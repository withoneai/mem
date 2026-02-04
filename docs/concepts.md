# Mem Concepts

Understanding how Mem works under the hood.

## Architecture

Mem has a simple architecture:

```
┌─────────────────────────────────────────────────┐
│                   Your Agent                     │
├─────────────────────────────────────────────────┤
│   CLI (mem)  │  TypeScript API           │
├─────────────────────────────────────────────────┤
│              Supabase (PostgreSQL)               │
│  ┌─────────────┐  ┌─────────────┐               │
│  │   records   │  │    links    │               │
│  │  (memories) │──│(relationships)│             │
│  └─────────────┘  └─────────────┘               │
│                                                  │
│  pgvector (embeddings) + tsvector (full-text)   │
└─────────────────────────────────────────────────┘
```

## Records

All memories are stored in one table with flexible JSON data:

```sql
mem_records (
  id UUID,
  type TEXT,           -- user-defined: note, decision, preference, etc.
  data JSONB,          -- flexible structure
  tags TEXT[],
  embedding vector,    -- for semantic search
  weight INTEGER,      -- 1-10 importance
  access_count INTEGER,
  status TEXT,         -- active or archived
  ...
)
```

### Why One Table?

Many systems create separate tables for each entity type (people, projects, notes, etc.). Mem uses a single table because:

1. **Flexibility**: Add any type of memory without schema changes
2. **Simplicity**: One set of functions works for everything
3. **Search**: Unified search across all memory types
4. **Links**: Connect any record to any other record

### Types

Types are just strings. You define what makes sense for your use case:

```bash
mem add note '{"content": "..."}'
mem add decision '{"topic": "...", "content": "..."}'
mem add preference '{"content": "..."}'
mem add person '{"name": "Jane", "email": "..."}'
mem add project '{"name": "...", "status": "..."}'
```

## Links

Relationships between records:

```sql
mem_links (
  from_id UUID,
  to_id UUID,
  relation TEXT,       -- works_at, related_to, supersedes, etc.
  bidirectional BOOLEAN,
  metadata JSONB,
)
```

### Bidirectional vs Directional

**Bidirectional** (`--bi`): Both directions are equivalent
- `A related_to B` means `B related_to A`
- Good for: related_to, sibling_of, collaborates_with

**Directional** (default): Only one direction
- `A supersedes B` doesn't mean `B supersedes A`
- Good for: supersedes, works_at, manages, parent_of

```bash
# Bidirectional
mem link <a> related_to <b> --bi

# Directional
mem link <person> works_at <company>
mem link <new> supersedes <old>
```

### Traversal

When querying linked records:
- **Outgoing**: Records this one points to
- **Incoming**: Records pointing to this one
- **Both**: All connected records

Bidirectional links are included in both directions automatically.

## Search

Mem uses **hybrid search** combining:

### Semantic Search (70% weight)

Uses OpenAI embeddings to find conceptually similar content:
- "database choice" finds "Supabase selection"
- "API design" finds "REST architecture decision"

Requires `OPENAI_API_KEY` to be set.

### Full-Text Search (30% weight)

PostgreSQL tsvector for exact keyword matching:
- Good for names, specific terms
- Works without OpenAI

### Reciprocal Rank Fusion (RRF)

Combines both result sets using RRF algorithm:
1. Rank results from each search method
2. Calculate combined score: `1/(k + rank)`
3. Weight and sum scores
4. Return top N

This ensures results that rank well in both searches appear first.

## Relevance Scoring

Every record has a relevance score used by `context`:

```
relevance = (weight × 0.4) + (access × 0.3) + (recency × 0.3)
```

### Weight (40%)

Explicit importance you set:
- 1-3: Low importance, will fade
- 4-6: Normal (5 is default)
- 7-8: Important, surfaces often
- 9-10: Critical, always surfaces

```bash
mem weight <id> 9
```

### Access Frequency (30%)

How often the record is retrieved:
- Search results increment access count
- Frequently useful memories rise naturally
- Capped at 100 accesses

### Recency (30%)

How recently accessed:
- Today = 1.0
- Decays over 30 days to 0.1
- Never accessed uses created_at with lower base

## Lifecycle

1. **Add**: Memory enters with default weight (5), no accesses
2. **Use**: Searching/accessing increments count, updates timestamp
3. **Rise**: Frequently accessed memories gain relevance
4. **Fade**: Unused memories naturally decay in relevance
5. **Archive**: When done, archive to exclude from context

### Managing Relevance

```bash
# Increase
mem weight <id> 9      # Set high importance

# Decrease
mem archive <id>       # Exclude from context
mem flush <id>         # Reset access count

# Restore
mem unarchive <id>     # Bring back archived
```

## Embeddings

Records are embedded on creation using OpenAI's `text-embedding-3-small` model:

1. Extract searchable text from JSON data
2. Call OpenAI embedding API
3. Store 1536-dimensional vector
4. Index with HNSW for fast similarity search

Without OpenAI, search falls back to keyword-only mode.

## Performance

Mem is designed for typical AI agent memory workloads:
- Thousands to tens of thousands of memories
- Dozens of links per record
- Real-time search latency

### Indexes

- `idx_mem_records_embedding`: HNSW for vector search
- `idx_mem_records_searchable`: GIN for full-text search
- `idx_mem_records_relevance`: B-tree for context queries
- Various indexes on links for traversal

For very large datasets (100k+ records), consider Supabase's dedicated compute options.
