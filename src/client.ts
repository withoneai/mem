/**
 * Mem Supabase Client
 * https://mem.now
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type {
  MemRecord,
  MemRecordWithLinks,
  ExternalRef,
  AddExternalRefOptions,
  SearchResult,
  ContextResult,
  LinkedRecord,
  AddRecordOptions,
  UpdateRecordOptions,
  SearchOptions,
  ContextOptions,
  LinkedOptions,
  UpsertResult,
} from "./types.js";

// =============================================================================
// Client Singleton
// =============================================================================

let supabase: SupabaseClient | null = null;
let openai: OpenAI | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set"
      );
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

export function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY must be set for embeddings");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

/**
 * Check if OpenAI is available for embeddings
 */
export function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// =============================================================================
// Embeddings
// =============================================================================

export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!text?.trim()) return null;
  if (!hasOpenAI()) return null;

  const client = getOpenAI();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
        dimensions: 1536,
      });
      const embedding = response.data[0].embedding;
      if (embedding.length === 1536) return embedding;
      // Wrong dimensions returned, retry
    } catch (error) {
      if (attempt === 2) {
        console.error("Warning: Failed to generate embedding:", error);
        return null;
      }
    }
  }
  return null;
}

export function extractSearchableText(data: Record<string, unknown>): string {
  // Generic extraction: concatenate all string values
  const values: string[] = [];

  for (const [, value] of Object.entries(data)) {
    if (typeof value === "string" && value.trim()) {
      values.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          values.push(item);
        }
      }
    }
  }

  return values.join(" ");
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Add a new memory record
 */
export async function add(
  type: string,
  data: Record<string, unknown>,
  options: AddRecordOptions = {}
): Promise<MemRecord | null> {
  const { tags, keys, weight, generateEmbedding = true } = options;
  const db = getSupabase();

  const insertData: Record<string, unknown> = {
    type,
    data,
    tags: tags || extractTags(data),
  };

  if (keys?.length) {
    insertData.keys = keys;
  }

  if (weight !== undefined && weight >= 1 && weight <= 10) {
    insertData.weight = weight;
  }

  if (generateEmbedding && hasOpenAI()) {
    const searchableText = extractSearchableText(data);
    if (searchableText) {
      const embedding = await getEmbedding(searchableText);
      if (embedding) {
        insertData.embedding = embedding;
      }
    }
  }

  const { data: result, error } = await db
    .from("mem_records")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error adding record:", error);
    return null;
  }

  return result;
}

/**
 * Get a record by ID
 */
export async function get(
  id: string,
  withLinks = false
): Promise<MemRecord | MemRecordWithLinks | null> {
  const db = getSupabase();

  if (withLinks) {
    const { data, error } = await db.rpc("mem_get_record_with_links", {
      record_id: id,
    });
    if (error) {
      console.error("Error getting record with links:", error);
      return null;
    }
    return data;
  }

  const { data, error } = await db
    .from("mem_records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error getting record:", error);
    return null;
  }
  return data;
}

/**
 * List records by type
 */
export async function list(
  type: string,
  options: { filterField?: string; filterValue?: string; limit?: number } = {}
): Promise<MemRecord[]> {
  const { filterField, filterValue, limit = 100 } = options;
  const db = getSupabase();

  let query = db.from("mem_records").select("*").eq("type", type);

  if (filterField && filterValue) {
    query = query.eq(`data->>${filterField}`, filterValue);
  }

  query = query.order("updated_at", { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error("Error listing records:", error);
    return [];
  }

  return data || [];
}

/**
 * Update a record
 */
export async function update(
  id: string,
  data?: Record<string, unknown>,
  options: UpdateRecordOptions = {}
): Promise<MemRecord | null> {
  const { tags, keys, regenerateEmbedding = true } = options;
  const db = getSupabase();

  const existing = await get(id);
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};

  if (data) {
    const mergedData = { ...existing.data, ...data };
    updateData.data = mergedData;

    if (regenerateEmbedding && hasOpenAI()) {
      const searchableText = extractSearchableText(
        mergedData as Record<string, unknown>
      );
      if (searchableText) {
        const embedding = await getEmbedding(searchableText);
        if (embedding) {
          updateData.embedding = embedding;
        }
      }
    }
  }

  if (tags !== undefined) {
    updateData.tags = tags;
  }

  if (keys !== undefined) {
    updateData.keys = keys;
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const { data: result, error } = await db
    .from("mem_records")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating record:", error);
    return null;
  }

  return result;
}

/**
 * Delete a record
 */
export async function remove(id: string): Promise<boolean> {
  const db = getSupabase();
  const { error } = await db.from("mem_records").delete().eq("id", id);
  return !error;
}

// =============================================================================
// Link Operations
// =============================================================================

/**
 * Create a link between two records
 */
export async function link(
  fromId: string,
  toId: string,
  relation: string,
  options: { bidirectional?: boolean; metadata?: Record<string, unknown> } = {}
): Promise<string | null> {
  const { bidirectional = false, metadata } = options;
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_create_link", {
    from_record_id: fromId,
    to_record_id: toId,
    relation_type: relation,
    is_bidirectional: bidirectional,
    link_metadata: metadata,
  });

  if (error) {
    console.error("Error creating link:", error);
    return null;
  }

  return data;
}

/**
 * Remove a link between two records
 */
export async function unlink(
  fromId: string,
  toId: string,
  relation: string
): Promise<boolean> {
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_remove_link", {
    from_record_id: fromId,
    to_record_id: toId,
    relation_type: relation,
  });

  if (error) {
    console.error("Error removing link:", error);
    return false;
  }

  return data;
}

/**
 * Get linked records
 */
export async function linked(
  id: string,
  options: LinkedOptions = {}
): Promise<LinkedRecord[]> {
  const { relation, direction = "outgoing" } = options;
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_get_linked", {
    record_id: id,
    relation_type: relation || null,
    direction,
  });

  if (error) {
    console.error("Error getting linked records:", error);
    return [];
  }

  return data || [];
}

// =============================================================================
// Search
// =============================================================================

/**
 * Hybrid search combining semantic similarity and full-text search
 */
export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = 10,
    type,
    ftsWeight = 0.3,
    semanticWeight = 0.7,
    includeArchived = false,
    trackAccess = true,
  } = options;
  const db = getSupabase();

  const queryEmbedding = await getEmbedding(query);

  if (!queryEmbedding) {
    // Fall back to FTS only
    return ftsSearch(query, { limit, type });
  }

  const { data, error } = await db.rpc("mem_hybrid_search", {
    query_text: query,
    query_embedding: queryEmbedding,
    match_count: limit,
    filter_type: type || null,
    full_text_weight: ftsWeight,
    semantic_weight: semanticWeight,
    include_archived: includeArchived,
  });

  if (error) {
    console.error("Error in hybrid search:", error);
    return [];
  }

  let results: SearchResult[] = data || [];

  // Boost name matches for short queries (1-2 words) where hybrid search
  // tends to drown out exact name hits with semantically similar records
  const wordCount = query.trim().split(/\s+/).length;
  if (wordCount <= 2 && query.length <= 30) {
    const pattern = `%${query}%`;
    let nameQuery = db
      .from("mem_records")
      .select("id, type, data, tags")
      .or(`data->>name.ilike.${pattern},data->>title.ilike.${pattern},data->>topic.ilike.${pattern}`)
      .eq("status", "active");

    if (type) {
      nameQuery = nameQuery.eq("type", type);
    }

    const { data: nameHits, error: nameError } = await nameQuery.limit(5);
    if (nameError) {
      console.error("Name boost query failed:", nameError.message);
    }

    if (nameHits && nameHits.length > 0) {
      const resultIds = new Set(results.map((r) => r.id));
      const boostScore = results.length > 0 ? results[0].combined_score + 0.01 : 1.0;

      // Boost existing results that match by name
      const nameHitIds = new Set(nameHits.map((h: Record<string, unknown>) => h.id as string));
      const boosted = results.filter((r) => nameHitIds.has(r.id)).map((r) => ({ ...r, combined_score: boostScore }));
      const rest = results.filter((r) => !nameHitIds.has(r.id));

      // Add name hits not already in results
      const newHits: SearchResult[] = nameHits
        .filter((h: Record<string, unknown>) => !resultIds.has(h.id as string))
        .map((h: Record<string, unknown>) => ({
          id: h.id as string,
          type: h.type as string,
          data: h.data as Record<string, unknown>,
          tags: h.tags as string[],
          fts_rank: 0,
          semantic_rank: 0,
          combined_score: boostScore,
        }));

      results = [...boosted, ...newHits, ...rest].slice(0, limit);
    }
  }

  // Track access for returned results
  if (trackAccess && results.length > 0) {
    const ids = results.map((r: SearchResult) => r.id);
    await incrementAccess(ids);
  }

  return results;
}

/**
 * Full-text search only (no embeddings)
 */
export async function ftsSearch(
  query: string,
  options: { limit?: number; type?: string } = {}
): Promise<SearchResult[]> {
  const { limit = 10, type } = options;
  const db = getSupabase();

  let queryBuilder = db
    .from("mem_records")
    .select("id, type, data, tags")
    .textSearch("searchable", query);

  if (type) {
    queryBuilder = queryBuilder.eq("type", type);
  }

  const { data, error } = await queryBuilder.limit(limit);

  if (error) {
    console.error("Error in FTS search:", error);
    return [];
  }

  return (data || []).map((r, i) => ({
    ...r,
    fts_rank: 1 / (1 + i),
    semantic_rank: 0,
    combined_score: 1 / (1 + i),
  }));
}

// =============================================================================
// Relevance & Context
// =============================================================================

/**
 * Get startup context: most relevant active records
 */
export async function context(
  options: ContextOptions = {}
): Promise<ContextResult[]> {
  const { limit = 20, types } = options;
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_get_context", {
    match_count: limit,
    filter_types: types || null,
  });

  if (error) {
    console.error("Error getting context:", error);
    return [];
  }

  return data || [];
}

/**
 * Increment access count for records
 */
export async function incrementAccess(recordIds: string[]): Promise<void> {
  if (recordIds.length === 0) return;

  const db = getSupabase();
  const { error } = await db.rpc("mem_increment_access", {
    record_ids: recordIds,
  });

  if (error) {
    console.error("Error incrementing access:", error);
  }
}

/**
 * Archive records (exclude from context but keep searchable)
 */
export async function archive(recordIds: string[]): Promise<number> {
  if (recordIds.length === 0) return 0;

  const db = getSupabase();
  const { data, error } = await db.rpc("mem_archive", {
    record_ids: recordIds,
  });

  if (error) {
    console.error("Error archiving records:", error);
    return 0;
  }

  return data || 0;
}

/**
 * Unarchive records (restore to active status)
 */
export async function unarchive(recordIds: string[]): Promise<number> {
  if (recordIds.length === 0) return 0;

  const db = getSupabase();
  const { data, error } = await db.rpc("mem_unarchive", {
    record_ids: recordIds,
  });

  if (error) {
    console.error("Error unarchiving records:", error);
    return 0;
  }

  return data || 0;
}

/**
 * Flush records (reset access count)
 */
export async function flush(recordIds: string[]): Promise<number> {
  if (recordIds.length === 0) return 0;

  const db = getSupabase();
  const { data, error } = await db.rpc("mem_flush", {
    record_ids: recordIds,
  });

  if (error) {
    console.error("Error flushing records:", error);
    return 0;
  }

  return data || 0;
}

/**
 * Set weight for a record (1-10)
 */
export async function weight(recordId: string, value: number): Promise<boolean> {
  if (value < 1 || value > 10) {
    console.error("Weight must be between 1 and 10");
    return false;
  }

  const db = getSupabase();
  const { error } = await db
    .from("mem_records")
    .update({ weight: value })
    .eq("id", recordId);

  if (error) {
    console.error("Error setting weight:", error);
    return false;
  }

  return true;
}

// =============================================================================
// Key-Based Operations
// =============================================================================

/**
 * Find a record by one of its keys
 */
export async function findByKey(key: string): Promise<MemRecord | null> {
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_find_by_key", { p_key: key });

  if (error) {
    console.error("Error finding by key:", error);
    return null;
  }

  if (!data || data.length === 0) return null;
  return data[0] as MemRecord;
}

/**
 * Upsert a record by keys. If any key matches an existing record, update it.
 * Otherwise insert a new record.
 */
export async function upsertByKeys(
  type: string,
  data: Record<string, unknown>,
  keys: string[],
  options: { tags?: string[]; weight?: number } = {}
): Promise<UpsertResult | null> {
  const db = getSupabase();
  const { tags, weight } = options;

  // Generate embedding
  let embedding: number[] | null = null;
  if (hasOpenAI()) {
    const searchableText = extractSearchableText(data);
    if (searchableText) {
      embedding = await getEmbedding(searchableText);
    }
  }

  const { data: result, error } = await db.rpc("mem_upsert_by_keys", {
    p_type: type,
    p_data: data,
    p_tags: tags || extractTags(data),
    p_keys: keys,
    p_weight: weight || null,
    p_embedding: embedding,
  });

  if (error) {
    console.error("Error upserting by keys:", error);
    return null;
  }

  if (!result || result.length === 0) return null;

  const { id, action } = result[0];
  const record = await get(id);
  if (!record) return null;

  return { record, action };
}

/**
 * Add keys to an existing record
 */
export async function addKeys(
  id: string,
  newKeys: string[]
): Promise<boolean> {
  const db = getSupabase();

  const record = await get(id);
  if (!record) return false;

  const existing = record.keys || [];
  const merged = [...new Set([...existing, ...newKeys])];

  const { error } = await db
    .from("mem_records")
    .update({ keys: merged })
    .eq("id", id);

  if (error) {
    console.error("Error adding keys:", error);
    return false;
  }

  return true;
}

/**
 * Remove keys from an existing record
 */
export async function removeKeys(
  id: string,
  keysToRemove: string[]
): Promise<boolean> {
  const db = getSupabase();

  const record = await get(id);
  if (!record) return false;

  const existing = record.keys || [];
  const removeSet = new Set(keysToRemove);
  const filtered = existing.filter((k) => !removeSet.has(k));

  const { error } = await db
    .from("mem_records")
    .update({ keys: filtered })
    .eq("id", id);

  if (error) {
    console.error("Error removing keys:", error);
    return false;
  }

  return true;
}

// =============================================================================
// External References
// =============================================================================

/**
 * Add an external reference to a record
 */
export async function addExternalRef(
  recordId: string,
  system: string,
  externalId: string,
  options: AddExternalRefOptions = {}
): Promise<string | null> {
  const { url, metadata } = options;
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_add_external_ref", {
    p_record_id: recordId,
    p_system: system,
    p_external_id: externalId,
    p_external_url: url || null,
    p_metadata: metadata || {},
  });

  if (error) {
    console.error("Error adding external ref:", error);
    return null;
  }

  return data;
}

/**
 * Find a record by its external reference
 */
export async function findByExternalRef(
  system: string,
  externalId: string
): Promise<{ record: MemRecord; ref: ExternalRef } | null> {
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_find_by_external_ref", {
    p_system: system,
    p_external_id: externalId,
  });

  if (error) {
    console.error("Error finding by external ref:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const row = data[0];
  return {
    record: {
      id: row.id,
      type: row.type,
      data: row.data,
      tags: row.tags,
      weight: row.weight,
      status: row.status,
    } as MemRecord,
    ref: {
      id: row.ref_id,
      record_id: row.id,
      system,
      external_id: externalId,
      external_url: row.external_url,
      metadata: row.ref_metadata,
      last_synced_at: row.last_synced_at,
    } as ExternalRef,
  };
}

/**
 * List all external references for a record
 */
export async function listExternalRefs(
  recordId: string
): Promise<ExternalRef[]> {
  const db = getSupabase();

  const { data, error } = await db.rpc("mem_list_external_refs", {
    p_record_id: recordId,
  });

  if (error) {
    console.error("Error listing external refs:", error);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    ...r,
    record_id: recordId,
  })) as ExternalRef[];
}

/**
 * Update the last_synced_at timestamp for an external ref
 */
export async function touchExternalRef(
  system: string,
  externalId: string
): Promise<boolean> {
  const db = getSupabase();

  const { error } = await db
    .from("mem_external_refs")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("system", system)
    .eq("external_id", externalId);

  return !error;
}

// =============================================================================
// Migration
// =============================================================================

import { getMigrationSQL } from "./schema.js";

/**
 * Apply the database schema
 */
export async function migrate(): Promise<boolean> {
  const db = getSupabase();
  const sql = getMigrationSQL();

  const { error } = await db.rpc("exec_sql", { sql_query: sql });

  if (error) {
    // Try direct execution if exec_sql doesn't exist
    // This happens on fresh Supabase instances
    console.log(
      "Note: exec_sql function not found. Please run the migration SQL directly in the Supabase SQL editor."
    );
    console.log("\nMigration SQL has been saved to: recall-migration.sql");

    // Write the SQL to a file for manual execution
    const fs = await import("fs/promises");
    await fs.writeFile("recall-migration.sql", sql);

    return false;
  }

  return true;
}

// =============================================================================
// Helpers
// =============================================================================

function extractTags(data: Record<string, unknown>): string[] {
  const tags: string[] = [];

  if (Array.isArray(data.tags)) {
    tags.push(...(data.tags as string[]));
  }
  if (typeof data.category === "string") {
    tags.push(data.category);
  }
  if (typeof data.status === "string") {
    tags.push(data.status);
  }

  return [...new Set(tags)];
}
