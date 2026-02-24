/**
 * Mem Database Schema
 * https://mem.now
 *
 * Two tables:
 * - mem_records: All memories
 * - mem_links: Relationships between records
 */

export const SCHEMA_VERSION = "1.2.0";

export const SCHEMA_SQL = `
-- =============================================================================
-- Mem: Memory for AI Agents
-- https://mem.now
-- Version: ${SCHEMA_VERSION}
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- RECORDS: All memories
-- =============================================================================

CREATE TABLE IF NOT EXISTS mem_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,                    -- user-defined (note, decision, preference, etc.)
    data JSONB NOT NULL,                   -- flexible structure
    tags TEXT[],
    keys TEXT[],
    embedding vector(1536),
    searchable_text TEXT,
    searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(searchable_text, ''))
    ) STORED,

    -- Relevance scoring
    weight INTEGER NOT NULL DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LINKS: Relationships between records
-- =============================================================================

CREATE TABLE IF NOT EXISTS mem_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id UUID NOT NULL REFERENCES mem_records(id) ON DELETE CASCADE,
    to_id UUID NOT NULL REFERENCES mem_records(id) ON DELETE CASCADE,
    relation TEXT NOT NULL,
    bidirectional BOOLEAN NOT NULL DEFAULT false,    -- true = traversable both ways
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_id, to_id, relation)
);

-- Upgrade path: add keys column if it doesn't exist
ALTER TABLE mem_records ADD COLUMN IF NOT EXISTS keys TEXT[];

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_mem_records_type ON mem_records(type);
CREATE INDEX IF NOT EXISTS idx_mem_records_keys ON mem_records USING GIN(keys);
CREATE INDEX IF NOT EXISTS idx_mem_records_tags ON mem_records USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_mem_records_data ON mem_records USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_mem_records_searchable ON mem_records USING GIN(searchable);
CREATE INDEX IF NOT EXISTS idx_mem_records_status ON mem_records(status);
CREATE INDEX IF NOT EXISTS idx_mem_records_relevance ON mem_records(
    status, weight DESC, access_count DESC, last_accessed_at DESC NULLS LAST
);

CREATE INDEX IF NOT EXISTS idx_mem_links_from ON mem_links(from_id);
CREATE INDEX IF NOT EXISTS idx_mem_links_to ON mem_links(to_id);
CREATE INDEX IF NOT EXISTS idx_mem_links_relation ON mem_links(relation);
CREATE INDEX IF NOT EXISTS idx_mem_links_from_relation ON mem_links(from_id, relation);
CREATE INDEX IF NOT EXISTS idx_mem_links_to_relation ON mem_links(to_id, relation);
CREATE INDEX IF NOT EXISTS idx_mem_links_bidirectional ON mem_links(bidirectional) WHERE bidirectional = true;

-- =============================================================================
-- EXTERNAL REFERENCES: Track where records came from
-- =============================================================================

CREATE TABLE IF NOT EXISTS mem_external_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES mem_records(id) ON DELETE CASCADE,
    system TEXT NOT NULL,
    external_id TEXT NOT NULL,
    external_url TEXT,
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(record_id, system, external_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mem_ext_refs_lookup ON mem_external_refs(system, external_id);
CREATE INDEX IF NOT EXISTS idx_mem_ext_refs_record ON mem_external_refs(record_id);

-- =============================================================================
-- SCHEMA METADATA
-- =============================================================================

CREATE TABLE IF NOT EXISTS mem_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO mem_meta (key, value) VALUES ('version', '${SCHEMA_VERSION}')
ON CONFLICT (key) DO UPDATE SET value = '${SCHEMA_VERSION}', updated_at = NOW();
`;

// Vector index (created separately)
export const VECTOR_INDEX_SQL = `
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mem_records_embedding') THEN
        CREATE INDEX idx_mem_records_embedding ON mem_records USING hnsw(embedding vector_cosine_ops);
    END IF;
END $$;
`;

export const FUNCTIONS_SQL = `
-- =============================================================================
-- HYBRID SEARCH
-- Combines semantic similarity with full-text search using RRF
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_hybrid_search(
    query_text TEXT,
    query_embedding vector(1536),
    match_count INT DEFAULT 10,
    filter_type TEXT DEFAULT NULL,
    full_text_weight FLOAT DEFAULT 0.3,
    semantic_weight FLOAT DEFAULT 0.7,
    rrf_k INT DEFAULT 50,
    include_archived BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    data JSONB,
    tags TEXT[],
    fts_rank FLOAT,
    semantic_rank FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH fts_results AS (
        SELECT
            r.id,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(r.searchable, websearch_to_tsquery('english', query_text)) DESC) AS rank
        FROM mem_records r
        WHERE r.searchable @@ websearch_to_tsquery('english', query_text)
        AND (filter_type IS NULL OR r.type = filter_type)
        AND (include_archived OR r.status = 'active')
        LIMIT match_count * 2
    ),
    semantic_results AS (
        SELECT
            r.id,
            ROW_NUMBER() OVER (ORDER BY r.embedding <=> query_embedding) AS rank
        FROM mem_records r
        WHERE r.embedding IS NOT NULL
        AND (filter_type IS NULL OR r.type = filter_type)
        AND (include_archived OR r.status = 'active')
        ORDER BY r.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    combined AS (
        SELECT
            COALESCE(fts.id, sem.id) AS id,
            COALESCE(1.0 / (rrf_k + fts.rank), 0.0) AS fts_score,
            COALESCE(1.0 / (rrf_k + sem.rank), 0.0) AS sem_score
        FROM fts_results fts
        FULL OUTER JOIN semantic_results sem ON fts.id = sem.id
    )
    SELECT
        r.id,
        r.type,
        r.data,
        r.tags,
        c.fts_score::FLOAT AS fts_rank,
        c.sem_score::FLOAT AS semantic_rank,
        (c.fts_score * full_text_weight + c.sem_score * semantic_weight)::FLOAT AS combined_score
    FROM combined c
    JOIN mem_records r ON r.id = c.id
    ORDER BY (c.fts_score * full_text_weight + c.sem_score * semantic_weight) DESC
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- RELEVANCE SCORING
-- Combines: weight (40%), access frequency (30%), recency (30%)
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_calculate_relevance(
    p_weight INTEGER,
    p_access_count INTEGER,
    p_last_accessed_at TIMESTAMPTZ,
    p_created_at TIMESTAMPTZ,
    max_access_count INTEGER DEFAULT 100
)
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
    weight_score FLOAT;
    access_score FLOAT;
    recency_score FLOAT;
    days_since_access FLOAT;
BEGIN
    -- Normalize weight to 0-1 (weight is 1-10)
    weight_score := (p_weight - 1) / 9.0;

    -- Normalize access count to 0-1 (capped at max_access_count)
    access_score := LEAST(p_access_count::FLOAT / max_access_count, 1.0);

    -- Calculate recency score (1.0 for today, decays over 30 days to 0.1)
    IF p_last_accessed_at IS NOT NULL THEN
        days_since_access := EXTRACT(EPOCH FROM (NOW() - p_last_accessed_at)) / 86400.0;
        recency_score := GREATEST(1.0 - (days_since_access / 30.0) * 0.9, 0.1);
    ELSE
        -- Never accessed, use created_at with lower base score
        days_since_access := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 86400.0;
        recency_score := GREATEST(0.5 - (days_since_access / 60.0) * 0.4, 0.1);
    END IF;

    -- Combine scores: weight 40%, access 30%, recency 30%
    RETURN (weight_score * 0.4) + (access_score * 0.3) + (recency_score * 0.3);
END;
$$;

-- =============================================================================
-- CONTEXT: Get most relevant records for startup
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_get_context(
    match_count INT DEFAULT 20,
    filter_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    data JSONB,
    tags TEXT[],
    keys TEXT[],
    weight INTEGER,
    access_count INTEGER,
    relevance_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.type,
        r.data,
        r.tags,
        r.keys,
        r.weight,
        r.access_count,
        mem_calculate_relevance(r.weight, r.access_count, r.last_accessed_at, r.created_at)::FLOAT AS relevance_score
    FROM mem_records r
    WHERE r.status = 'active'
    AND (filter_types IS NULL OR r.type = ANY(filter_types))
    ORDER BY mem_calculate_relevance(r.weight, r.access_count, r.last_accessed_at, r.created_at) DESC
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- ACCESS TRACKING
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_increment_access(record_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE mem_records
    SET
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE id = ANY(record_ids);
END;
$$;

-- =============================================================================
-- ARCHIVE / UNARCHIVE
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_archive(record_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE mem_records
    SET status = 'archived', updated_at = NOW()
    WHERE id = ANY(record_ids) AND status = 'active';
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION mem_unarchive(record_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE mem_records
    SET status = 'active', updated_at = NOW()
    WHERE id = ANY(record_ids) AND status = 'archived';
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

-- =============================================================================
-- FLUSH: Reset access count
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_flush(record_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE mem_records
    SET
        access_count = 0,
        last_accessed_at = NULL,
        updated_at = NOW()
    WHERE id = ANY(record_ids);
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

-- =============================================================================
-- GRAPH TRAVERSAL
-- Respects bidirectional flag
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_get_record_with_links(record_id UUID)
RETURNS JSONB
LANGUAGE sql
AS $$
    SELECT jsonb_build_object(
        'id', r.id,
        'type', r.type,
        'data', r.data,
        'tags', r.tags,
        'keys', r.keys,
        'weight', r.weight,
        'access_count', r.access_count,
        'status', r.status,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'outgoing', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'relation', l.relation,
                'bidirectional', l.bidirectional,
                'metadata', l.metadata,
                'record', jsonb_build_object(
                    'id', linked.id,
                    'type', linked.type,
                    'data', linked.data
                )
            ))
            FROM mem_links l
            JOIN mem_records linked ON linked.id = l.to_id
            WHERE l.from_id = r.id
        ), '[]'::jsonb),
        'incoming', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'relation', l.relation,
                'bidirectional', l.bidirectional,
                'metadata', l.metadata,
                'record', jsonb_build_object(
                    'id', linked.id,
                    'type', linked.type,
                    'data', linked.data
                )
            ))
            FROM mem_links l
            JOIN mem_records linked ON linked.id = l.from_id
            WHERE l.to_id = r.id
        ), '[]'::jsonb)
    )
    FROM mem_records r
    WHERE r.id = record_id;
$$;

CREATE OR REPLACE FUNCTION mem_get_linked(
    record_id UUID,
    relation_type TEXT DEFAULT NULL,
    direction TEXT DEFAULT 'outgoing'
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    data JSONB,
    relation TEXT,
    bidirectional BOOLEAN,
    link_metadata JSONB
)
LANGUAGE sql
AS $$
    -- Outgoing links (from this record to others)
    SELECT
        r.id,
        r.type,
        r.data,
        l.relation,
        l.bidirectional,
        l.metadata
    FROM mem_links l
    JOIN mem_records r ON r.id = l.to_id
    WHERE l.from_id = record_id
    AND (relation_type IS NULL OR l.relation = relation_type)
    AND (direction = 'outgoing' OR direction = 'both')

    UNION ALL

    -- Incoming links (from others to this record)
    -- Only include if bidirectional=true OR direction includes incoming
    SELECT
        r.id,
        r.type,
        r.data,
        l.relation,
        l.bidirectional,
        l.metadata
    FROM mem_links l
    JOIN mem_records r ON r.id = l.from_id
    WHERE l.to_id = record_id
    AND (relation_type IS NULL OR l.relation = relation_type)
    AND (
        direction = 'incoming'
        OR direction = 'both'
        OR l.bidirectional = true
    );
$$;

-- =============================================================================
-- LINK OPERATIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_create_link(
    from_record_id UUID,
    to_record_id UUID,
    relation_type TEXT,
    is_bidirectional BOOLEAN DEFAULT false,
    link_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    link_id UUID;
BEGIN
    INSERT INTO mem_links (from_id, to_id, relation, bidirectional, metadata)
    VALUES (from_record_id, to_record_id, relation_type, is_bidirectional, link_metadata)
    ON CONFLICT (from_id, to_id, relation) DO UPDATE
    SET bidirectional = is_bidirectional,
        metadata = COALESCE(link_metadata, mem_links.metadata)
    RETURNING id INTO link_id;
    RETURN link_id;
END;
$$;

CREATE OR REPLACE FUNCTION mem_remove_link(
    from_record_id UUID,
    to_record_id UUID,
    relation_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM mem_links
    WHERE from_id = from_record_id
    AND to_id = to_record_id
    AND relation = relation_type;
    RETURN FOUND;
END;
$$;

-- =============================================================================
-- EXTERNAL REFERENCES
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_add_external_ref(
    p_record_id UUID,
    p_system TEXT,
    p_external_id TEXT,
    p_external_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    ref_id UUID;
BEGIN
    INSERT INTO mem_external_refs (record_id, system, external_id, external_url, metadata)
    VALUES (p_record_id, p_system, p_external_id, p_external_url, p_metadata)
    ON CONFLICT (record_id, system, external_id) DO UPDATE
    SET external_url = COALESCE(p_external_url, mem_external_refs.external_url),
        metadata = COALESCE(p_metadata, mem_external_refs.metadata),
        last_synced_at = NOW()
    RETURNING id INTO ref_id;
    RETURN ref_id;
END;
$$;

CREATE OR REPLACE FUNCTION mem_find_by_external_ref(
    p_system TEXT,
    p_external_id TEXT
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    data JSONB,
    tags TEXT[],
    weight INTEGER,
    status TEXT,
    ref_id UUID,
    external_url TEXT,
    ref_metadata JSONB,
    last_synced_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
    SELECT
        r.id,
        r.type,
        r.data,
        r.tags,
        r.weight,
        r.status,
        e.id AS ref_id,
        e.external_url,
        e.metadata AS ref_metadata,
        e.last_synced_at
    FROM mem_external_refs e
    JOIN mem_records r ON r.id = e.record_id
    WHERE e.system = p_system AND e.external_id = p_external_id;
$$;

CREATE OR REPLACE FUNCTION mem_list_external_refs(p_record_id UUID)
RETURNS TABLE (
    id UUID,
    system TEXT,
    external_id TEXT,
    external_url TEXT,
    metadata JSONB,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
    SELECT id, system, external_id, external_url, metadata, last_synced_at, created_at
    FROM mem_external_refs
    WHERE record_id = p_record_id
    ORDER BY created_at;
$$;

-- =============================================================================
-- KEY-BASED LOOKUP AND UPSERT
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_enforce_key_uniqueness()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    conflicting_id UUID;
BEGIN
    IF NEW.keys IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT id INTO conflicting_id
    FROM mem_records
    WHERE keys && NEW.keys AND id != NEW.id
    LIMIT 1;

    IF conflicting_id IS NOT NULL THEN
        RAISE EXCEPTION 'Key conflict: one or more keys in % already exist on record %',
            NEW.keys, conflicting_id
            USING ERRCODE = 'unique_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mem_enforce_key_uniqueness_trigger ON mem_records;
CREATE TRIGGER mem_enforce_key_uniqueness_trigger
BEFORE INSERT OR UPDATE ON mem_records
FOR EACH ROW
EXECUTE FUNCTION mem_enforce_key_uniqueness();

CREATE OR REPLACE FUNCTION mem_find_by_key(p_key TEXT)
RETURNS TABLE (
    id UUID,
    type TEXT,
    data JSONB,
    tags TEXT[],
    keys TEXT[],
    weight INTEGER,
    access_count INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
    SELECT r.id, r.type, r.data, r.tags, r.keys, r.weight, r.access_count,
           r.status, r.created_at, r.updated_at
    FROM mem_records r
    WHERE r.keys @> ARRAY[p_key];
$$;

CREATE OR REPLACE FUNCTION mem_upsert_by_keys(
    p_type TEXT,
    p_data JSONB,
    p_tags TEXT[],
    p_keys TEXT[],
    p_weight INTEGER DEFAULT NULL,
    p_embedding vector(1536) DEFAULT NULL
)
RETURNS TABLE (id UUID, action TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    existing_id UUID;
    result_id UUID;
    result_action TEXT;
BEGIN
    -- Find existing record by key overlap
    SELECT r.id INTO existing_id
    FROM mem_records r
    WHERE r.keys && p_keys
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
        -- Update: merge data, union tags and keys
        UPDATE mem_records r
        SET data = r.data || p_data,
            tags = (SELECT ARRAY(SELECT DISTINCT unnest FROM unnest(COALESCE(r.tags, '{}') || COALESCE(p_tags, '{}')))),
            keys = (SELECT ARRAY(SELECT DISTINCT unnest FROM unnest(COALESCE(r.keys, '{}') || COALESCE(p_keys, '{}')))),
            weight = COALESCE(p_weight, r.weight),
            embedding = COALESCE(p_embedding, r.embedding)
        WHERE r.id = existing_id;

        result_id := existing_id;
        result_action := 'updated';
    ELSE
        -- Insert new record
        INSERT INTO mem_records (type, data, tags, keys, weight, embedding)
        VALUES (
            p_type,
            p_data,
            p_tags,
            p_keys,
            COALESCE(p_weight, 5),
            p_embedding
        )
        RETURNING mem_records.id INTO result_id;

        result_action := 'inserted';
    END IF;

    RETURN QUERY SELECT result_id, result_action;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION mem_extract_searchable_text(record_type TEXT, record_data JSONB)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Generic extraction: concatenate all string values
    RETURN (SELECT string_agg(value::TEXT, ' ')
            FROM jsonb_each_text(record_data)
            WHERE value IS NOT NULL AND value != '');
END;
$$;

CREATE OR REPLACE FUNCTION mem_records_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.searchable_text := mem_extract_searchable_text(NEW.type, NEW.data);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mem_records_before_upsert ON mem_records;
CREATE TRIGGER mem_records_before_upsert
BEFORE INSERT OR UPDATE ON mem_records
FOR EACH ROW
EXECUTE FUNCTION mem_records_trigger();
`;

// Full migration SQL (combines schema + vector index + functions)
export function getMigrationSQL(): string {
  return `${SCHEMA_SQL}\n\n${VECTOR_INDEX_SQL}\n\n${FUNCTIONS_SQL}`;
}
