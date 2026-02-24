# Mem v0.2: Memory Enhancements - Product Design Review

## Summary

This PDR proposes three enhancements to Mem that address competitive gaps with claude-mem (23K GitHub stars) while maintaining Mem's philosophy of simplicity and signal over noise:

1. **Progressive Context Loading** - 10x token efficiency through two-tier retrieval
2. **Intelligent Auto-Capture Hook** - Smart memory detection without the noise
3. **Local-Only Mode (SQLite)** - Zero-dependency operation for privacy-conscious users

These features position Mem as the thoughtful alternative: same convenience as claude-mem, but with better token economics and less noise.

## Problem Statement

### User Impact

**Problem 1: Context is expensive**

Current `mem context` returns full records regardless of relevance. A typical startup context of 20 records at ~500 tokens each = 10,000 tokens before the agent even starts working. Most of these tokens are wasted - the agent only needs details for 2-3 records per task.

Impact:
- Higher API costs for users
- Slower response times (more tokens to process)
- Context window pollution (less room for actual work)
- Competitive disadvantage: models with smaller context windows can't use Mem effectively

**Problem 2: Memory capture requires explicit action**

Users must consciously run `mem add` to save memories. This creates friction:
- Important context slips through because users forget to save
- Decisions and preferences expressed in conversation are lost
- claude-mem's main advantage is automatic capture - it "just works"

However, claude-mem captures too aggressively (every tool call, code change, etc.), creating noise. There's an opportunity to be smarter.

Impact:
- Lost institutional knowledge
- Repeated explanations ("I told you last week I prefer...")
- Users switching to claude-mem for convenience despite its noise problem

**Problem 3: Supabase is required**

Mem requires a Supabase project with specific configuration. This creates barriers:
- Setup friction for evaluation (5-10 minutes vs. instant)
- Privacy concerns for sensitive/personal memory
- Dependency on external service availability
- Cost for high-volume users (Supabase free tier has limits)

Impact:
- Lower adoption in privacy-sensitive contexts (personal assistants, local-first users)
- Harder to evaluate before committing
- Users with simple needs forced into complex setup

### Cost of Inaction

Without these changes:
- claude-mem continues to dominate the "AI memory" space despite fundamental design issues
- Users accept noisy memory as the cost of convenience
- Mem remains a "good but requires effort" tool rather than a default choice
- Token inefficiency becomes a scaling problem as context windows grow

## Goals

### Primary Goals

1. **Token Efficiency**: Reduce average context token usage by 80% while maintaining recall quality
2. **Capture Rate**: Automatically capture 80%+ of save-worthy moments with <10% false positive rate
3. **Zero-Config Option**: Enable full Mem functionality with no external dependencies

### Secondary Goals

- Maintain backward compatibility with existing installations
- Keep the core API surface simple
- Preserve the "signal over noise" philosophy
- Enable migration path between local and cloud modes

### Non-Goals (Explicitly Out of Scope)

- Real-time sync between local and cloud (future work)
- Multi-device synchronization
- Collaborative memory sharing
- Browser extension for web capture
- Mobile client

## Success Criteria

| Feature | Metric | Target |
|---------|--------|--------|
| Progressive Context | Tokens per context call | <1,000 (vs. ~10,000 today) |
| Progressive Context | Time to first response | <200ms (compact) |
| Auto-Capture | Precision | >90% (captured items are worth saving) |
| Auto-Capture | Recall | >80% (save-worthy items are captured) |
| Auto-Capture | User override rate | <20% (users don't undo captures often) |
| Local Mode | Setup time | <30 seconds |
| Local Mode | Search latency | <100ms for 10K records |
| Local Mode | Feature parity | 100% CLI commands work |

## Proposed Solution

### Feature 1: Progressive Context Loading

**Concept**: Two-tier retrieval - summaries first, full details on demand.

#### API Changes

```typescript
// New types
interface CompactContextResult {
  id: string;
  type: string;
  topic: string;        // data.topic || data.title || data.content.slice(0,50)
  relevance_score: number;
  weight: number;
  access_count: number;
  tags?: string[];
}

interface ContextOptions {
  limit?: number;
  types?: string[];
  compact?: boolean;    // NEW: default true in v0.2
}

// Updated function signature
async function context(options?: ContextOptions): Promise<ContextResult[] | CompactContextResult[]>;

// New function
async function expand(ids: string[]): Promise<MemRecord[]>;
```

#### CLI Changes

```bash
# Current behavior (will become --full flag)
mem context                        # Returns compact by default
mem context --full                 # Returns full records (current behavior)

# New command
mem expand <id1> <id2> ...         # Get full details for specific IDs

# Examples
mem context                        # Compact summaries (~50 tokens each)
mem context -n 30                  # More summaries
mem expand abc123 def456           # Full records for specific IDs
mem context --full                 # Full records (backward compatible)
```

#### Database Changes

New Postgres function for compact retrieval:

```sql
CREATE OR REPLACE FUNCTION mem_get_context_compact(
    match_count INT DEFAULT 20,
    filter_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    topic TEXT,
    tags TEXT[],
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
        COALESCE(
            r.data->>'topic',
            r.data->>'title',
            LEFT(r.data->>'content', 50),
            LEFT(r.searchable_text, 50),
            r.id::TEXT
        )::TEXT AS topic,
        r.tags,
        r.weight,
        r.access_count,
        mem_calculate_relevance(r.weight, r.access_count, r.last_accessed_at, r.created_at)::FLOAT
    FROM mem_records r
    WHERE r.status = 'active'
    AND (filter_types IS NULL OR r.type = ANY(filter_types))
    ORDER BY mem_calculate_relevance(r.weight, r.access_count, r.last_accessed_at, r.created_at) DESC
    LIMIT match_count;
END;
$$;
```

#### Token Economics

| Mode | Records | Tokens/Record | Total Tokens |
|------|---------|---------------|--------------|
| Full (current) | 20 | ~500 | ~10,000 |
| Compact | 20 | ~50 | ~1,000 |
| Compact + 3 expanded | 20 + 3 | 50 + 500 | ~2,500 |

Typical workflow: Load 20 compact summaries, expand 2-3 relevant ones = 75% token reduction.

#### Workflow Example

```bash
# Agent startup
$ mem context
[0.89] decision: Database architecture choice
[0.82] preference: TypeScript over JavaScript
[0.75] note: API rate limits for OpenAI
[0.71] decision: REST vs GraphQL
[0.68] preference: No em-dashes in writing
...
20 memories (compact)

# Agent identifies relevant records
$ mem expand abc123 def456
[Full decision record about database architecture...]
[Full decision record about REST vs GraphQL...]
```

---

### Feature 2: Intelligent Auto-Capture Hook

**Concept**: Claude Code hook that detects save-worthy moments in conversation and captures them with minimal noise.

#### Detection Patterns

| Category | Trigger Patterns | Example | Type |
|----------|------------------|---------|------|
| **Explicit** | "remember this", "note that", "save this", "don't forget" | "Remember that I prefer TypeScript" | preference |
| **Decision** | "let's go with", "we decided", "the decision is", "going forward" | "Let's go with REST for the API" | decision |
| **Preference** | "I prefer", "I like X better", "always use", "never use" | "I prefer tabs over spaces" | preference |
| **Correction** | "actually it's", "no, I meant", "that's wrong" | "Actually, the deadline is Friday not Thursday" | correction |
| **Learning** | "learned that", "turns out", "note to self", "for next time" | "Turns out the API has a 100req/min limit" | insight |

#### Hook Architecture

The hook integrates with Claude Code's hook system:

```
~/.claude/hooks/mem-capture.js
```

Or project-local:

```
.claude/hooks/mem-capture.js
```

#### Hook Implementation

```javascript
// .claude/hooks/mem-capture.js
export default {
  name: "mem-capture",
  description: "Intelligent memory capture",

  // Hook into user message processing
  hooks: {
    "message:user": async (message, context) => {
      const captures = detectSaveWorthyContent(message);

      if (captures.length === 0) return;

      // Auto-save or prompt based on config
      const config = await getConfig();

      for (const capture of captures) {
        if (config.autoSave) {
          await saveMemory(capture);
          context.notify(`Remembered: ${capture.summary}`);
        } else {
          // Queue for confirmation
          context.suggest({
            action: "remember",
            data: capture,
            message: `Save this ${capture.type}? "${capture.summary}"`
          });
        }
      }
    }
  }
};

function detectSaveWorthyContent(message) {
  const captures = [];
  const text = message.content;

  // Pattern matching with confidence scores
  const patterns = [
    {
      regex: /\b(remember|note|save|don't forget)\s+(that\s+)?(.{10,200})/i,
      type: "note",
      confidence: 0.95,
      extract: (m) => m[3]
    },
    {
      regex: /\b(let's go with|we decided|the decision is|going forward)\s+(.{10,200})/i,
      type: "decision",
      confidence: 0.9,
      extract: (m) => m[0]
    },
    {
      regex: /\bI prefer\s+(.{5,100})\s+(over|instead of|rather than)\s+(.{5,100})/i,
      type: "preference",
      confidence: 0.95,
      extract: (m) => `Prefers ${m[1]} over ${m[3]}`
    },
    {
      regex: /\b(always use|never use|don't use)\s+(.{5,100})/i,
      type: "preference",
      confidence: 0.85,
      extract: (m) => m[0]
    },
    {
      regex: /\bactually,?\s+(it's|the)\s+(.{5,100})/i,
      type: "correction",
      confidence: 0.8,
      extract: (m) => m[0]
    },
    {
      regex: /\b(learned that|turns out|note to self)\s+(.{10,200})/i,
      type: "insight",
      confidence: 0.9,
      extract: (m) => m[2]
    }
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match && pattern.confidence >= 0.8) {
      captures.push({
        type: pattern.type,
        content: pattern.extract(match),
        summary: pattern.extract(match).slice(0, 50),
        confidence: pattern.confidence,
        source: "auto-capture"
      });
    }
  }

  return captures;
}
```

#### Configuration

```json
// ~/.claude/mem-config.json or .claude/mem-config.json
{
  "autoCapture": {
    "enabled": true,
    "autoSave": false,           // If true, save without confirmation
    "minConfidence": 0.85,       // Only capture high-confidence matches
    "types": {                   // Per-type configuration
      "decision": { "autoSave": true, "weight": 8 },
      "preference": { "autoSave": true, "weight": 9 },
      "correction": { "autoSave": false, "weight": 7 },
      "insight": { "autoSave": false, "weight": 6 }
    },
    "exclude": [                 // Patterns to never capture
      "/tmp/",
      "password",
      "secret"
    ]
  }
}
```

#### CLI Updates

```bash
# View capture queue
mem captures                     # Show pending captures

# Confirm/reject captures
mem captures --approve           # Approve all pending
mem captures --approve abc123    # Approve specific
mem captures --reject abc123     # Reject specific
mem captures --clear             # Clear queue

# Configure auto-capture
mem config autosave on           # Enable auto-save
mem config autosave off          # Disable (require confirmation)
mem config confidence 0.9        # Set minimum confidence
```

#### What We DON'T Capture (Anti-Patterns)

To avoid claude-mem's noise problem, we explicitly ignore:

- Tool call results (git status, file reads, etc.)
- Code changes and diffs
- Error messages and stack traces
- System prompts and context
- Repetitive confirmations
- File paths and technical artifacts

---

### Feature 3: Local-Only Mode (SQLite)

**Concept**: Full Mem functionality using SQLite, requiring zero external dependencies.

#### Storage Adapter Architecture

```
┌─────────────────────────────────────────────┐
│                 Mem Client                   │
│  (add, get, search, context, link, etc.)   │
├─────────────────────────────────────────────┤
│              Storage Adapter                 │
│         interface StorageAdapter            │
├────────────────────┬────────────────────────┤
│  SupabaseAdapter   │    SQLiteAdapter       │
│  (cloud, current)  │    (local, new)        │
└────────────────────┴────────────────────────┘
```

#### Adapter Interface

```typescript
interface StorageAdapter {
  // CRUD
  add(type: string, data: Record<string, unknown>, options?: AddRecordOptions): Promise<MemRecord | null>;
  get(id: string, withLinks?: boolean): Promise<MemRecord | MemRecordWithLinks | null>;
  list(type: string, options?: ListOptions): Promise<MemRecord[]>;
  update(id: string, data?: Record<string, unknown>, options?: UpdateRecordOptions): Promise<MemRecord | null>;
  remove(id: string): Promise<boolean>;

  // Links
  link(fromId: string, toId: string, relation: string, options?: LinkOptions): Promise<string | null>;
  unlink(fromId: string, toId: string, relation: string): Promise<boolean>;
  linked(id: string, options?: LinkedOptions): Promise<LinkedRecord[]>;

  // Search
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  // Context
  context(options?: ContextOptions): Promise<ContextResult[] | CompactContextResult[]>;
  expand(ids: string[]): Promise<MemRecord[]>;

  // Relevance
  incrementAccess(recordIds: string[]): Promise<void>;
  archive(recordIds: string[]): Promise<number>;
  unarchive(recordIds: string[]): Promise<number>;
  flush(recordIds: string[]): Promise<number>;
  weight(recordId: string, value: number): Promise<boolean>;

  // Setup
  migrate(): Promise<boolean>;
  close(): Promise<void>;
}
```

#### SQLite Schema

```sql
-- Records table (matches Supabase structure)
CREATE TABLE IF NOT EXISTS mem_records (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    type TEXT NOT NULL,
    data TEXT NOT NULL,  -- JSON
    tags TEXT,           -- JSON array
    searchable_text TEXT,
    embedding TEXT,      -- JSON array (optional)
    weight INTEGER NOT NULL DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS mem_records_fts USING fts5(
    id,
    searchable_text,
    content='mem_records',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER mem_records_ai AFTER INSERT ON mem_records BEGIN
    INSERT INTO mem_records_fts(id, searchable_text)
    VALUES (new.id, new.searchable_text);
END;

CREATE TRIGGER mem_records_ad AFTER DELETE ON mem_records BEGIN
    INSERT INTO mem_records_fts(mem_records_fts, id, searchable_text)
    VALUES('delete', old.id, old.searchable_text);
END;

CREATE TRIGGER mem_records_au AFTER UPDATE ON mem_records BEGIN
    INSERT INTO mem_records_fts(mem_records_fts, id, searchable_text)
    VALUES('delete', old.id, old.searchable_text);
    INSERT INTO mem_records_fts(id, searchable_text)
    VALUES (new.id, new.searchable_text);
END;

-- Links table
CREATE TABLE IF NOT EXISTS mem_links (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    from_id TEXT NOT NULL REFERENCES mem_records(id) ON DELETE CASCADE,
    to_id TEXT NOT NULL REFERENCES mem_records(id) ON DELETE CASCADE,
    relation TEXT NOT NULL,
    bidirectional INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,  -- JSON
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(from_id, to_id, relation)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mem_records_type ON mem_records(type);
CREATE INDEX IF NOT EXISTS idx_mem_records_status ON mem_records(status);
CREATE INDEX IF NOT EXISTS idx_mem_links_from ON mem_links(from_id);
CREATE INDEX IF NOT EXISTS idx_mem_links_to ON mem_links(to_id);
```

#### Embedding Options for Local Mode

Three strategies, user-configurable:

1. **No Embeddings** (default for local)
   - FTS-only search
   - Zero external dependencies
   - Fast, simple, works offline

2. **Ollama Embeddings** (optional)
   - Uses local Ollama with nomic-embed-text or similar
   - Requires Ollama running locally
   - Config: `OLLAMA_URL=http://localhost:11434`

3. **OpenAI Embeddings** (optional)
   - Same as cloud mode
   - Requires OpenAI API key
   - Best quality, but requires internet

```typescript
// Embedding strategy configuration
interface LocalEmbeddingConfig {
  strategy: "none" | "ollama" | "openai";
  ollamaModel?: string;  // Default: nomic-embed-text
  ollamaUrl?: string;    // Default: http://localhost:11434
}
```

#### CLI Updates for Local Mode

```bash
# Initialize in local mode
mem init --local                 # Creates ~/.mem/mem.db

# Or project-local
mem init --local --project       # Creates .mem/mem.db

# Check mode
mem status                       # Shows: Mode: local (~/.mem/mem.db)

# Configure embeddings for local
mem config embeddings none       # FTS only (default)
mem config embeddings ollama     # Use Ollama
mem config embeddings openai     # Use OpenAI

# Export/import for migration
mem export > backup.json         # Export all records
mem import < backup.json         # Import records
mem migrate-to cloud             # Migrate local to Supabase (future)
```

#### Init Flow Changes

```bash
$ mem init

  mem.now

? Choose storage mode:
  > Cloud (Supabase) - Sync across devices, requires account
    Local (SQLite) - Private, offline, zero config

[If Local selected]

? Where to store memories?
  > Global (~/.mem/mem.db) - Available everywhere
    Project (.mem/mem.db) - Only this project

? Enable semantic search?
  > No (keyword only) - Works offline
    Yes (via Ollama) - Requires local Ollama
    Yes (via OpenAI) - Requires API key

Creating database at ~/.mem/mem.db...
Done!

Test commands:
  mem add note '{"content": "Hello!"}'
  mem search "hello"
  mem context
```

#### Feature Parity Table

| Feature | Supabase | SQLite |
|---------|----------|--------|
| CRUD operations | Yes | Yes |
| Graph links | Yes | Yes |
| Keyword search | Yes (tsvector) | Yes (FTS5) |
| Semantic search | Yes (pgvector) | Optional (Ollama/OpenAI) |
| Hybrid search | Yes | If embeddings enabled |
| Relevance scoring | Yes | Yes |
| Context loading | Yes | Yes |
| Progressive context | Yes | Yes |
| Multiple instances | N/A | Yes (global + project) |
| Offline operation | No | Yes |
| Cross-device sync | Yes | No |

## Alternatives Considered

### Alternative 1: Streaming Context

Instead of compact/full modes, stream context progressively.

**Rejected because:**
- More complex to implement
- Harder to integrate with existing tools
- Claude Code doesn't have great streaming UX for context
- Two-tier is simpler and achieves the same goal

### Alternative 2: LLM-Based Auto-Capture

Use an LLM to evaluate each message for save-worthiness.

**Rejected because:**
- Adds latency to every message
- Increases costs significantly
- Regex patterns are sufficient for explicit triggers
- Can be added later if patterns prove insufficient

### Alternative 3: Using a Different Embedded Database

Considered: DuckDB, LanceDB, ChromaDB

**Rejected because:**
- SQLite is universally available and battle-tested
- FTS5 is excellent for keyword search
- Simpler dependency (pure SQLite vs. additional binaries)
- Easier to explain and debug
- ChromaDB/Lance could be adapter options later if needed

### Alternative 4: Hybrid Local-Cloud Mode

Real-time sync between local SQLite and Supabase.

**Rejected for v0.2 because:**
- Significant complexity (conflict resolution, sync state)
- Can be added in v0.3 once both modes are stable
- Export/import provides manual migration path

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auto-capture creates noise despite safeguards | Medium | High | Conservative default patterns; confidence threshold; easy disable |
| SQLite search quality is noticeably worse | Low | Medium | FTS5 is actually quite good; optional embeddings for users who need quality |
| Breaking changes in compact context format | Medium | Medium | Keep `--full` flag; version the output format |
| Hook integration with Claude Code changes | Medium | Medium | Abstract hook interface; follow Claude Code patterns |
| Ollama not available on all platforms | Low | Low | Optional feature; falls back to no embeddings |
| Local storage fills disk | Low | Low | Add `mem stats` command; warn at 100MB; provide `mem prune` |
| Migration from local to cloud loses data | Medium | High | Thorough export/import testing; warn before destructive operations |

## Open Questions

1. **Hook system**: What's the exact Claude Code hook API? Need to verify integration points.
   - Fallback: Ship as a skill that the agent runs after each interaction

2. **Compact context format**: Should we include a `preview` field with first 100 chars of content?
   - Leaning yes, but need to measure token impact

3. **Auto-capture UX**: Toast notification vs. inline suggestion vs. silent capture?
   - Need user testing; probably configurable

4. **SQLite location precedence**: Project-local before global, or configurable?
   - Leaning: check project first, then global (like .gitignore)

5. **Embedding dimension for local**: SQLite-vec supports variable dimensions. Should we support smaller embeddings (384) for local to reduce storage?
   - Could be a perf win; need to test quality impact

## Implementation Plan

### Phase 1: Progressive Context (Week 1-2)

**Week 1:**
- Add `mem_get_context_compact` Postgres function
- Update TypeScript types for compact result
- Add `compact` option to `context()` function
- Add `expand()` function

**Week 2:**
- Update CLI with `--full` flag and `expand` command
- Update CLAUDE.md templates
- Write tests
- Update documentation

**Deliverable:** `mem context` returns compact by default; `mem expand` works

### Phase 2: SQLite Adapter (Week 3-5)

**Week 3:**
- Create `StorageAdapter` interface
- Refactor `client.ts` to use adapter pattern
- Implement `SupabaseAdapter` (wrap existing code)

**Week 4:**
- Implement `SQLiteAdapter` with core CRUD and search
- Add FTS5 integration
- Implement relevance scoring in SQL

**Week 5:**
- Add `--local` flag to `mem init`
- Implement config management for storage mode
- Add `mem export` and `mem import`
- Write tests

**Deliverable:** `mem init --local` creates working SQLite-based memory

### Phase 3: Auto-Capture Hook (Week 6-7)

**Week 6:**
- Research Claude Code hook API
- Implement pattern detection library
- Create basic hook structure

**Week 7:**
- Add capture queue management
- Implement configuration system
- Add CLI commands for queue management
- Write tests

**Deliverable:** Hook detects save-worthy content; configurable auto-save

### Phase 4: Polish and Release (Week 8)

- Integration testing across all features
- Documentation updates
- CHANGELOG and migration guide
- npm publish @withone/mem@0.2.0

### Milestones

| Milestone | Target Date | Success Criteria |
|-----------|-------------|------------------|
| Progressive Context Beta | Week 2 | Compact context returns <100 tokens per record |
| SQLite Adapter Alpha | Week 4 | All CRUD tests pass with SQLite |
| SQLite Adapter Beta | Week 5 | Full feature parity with Supabase (except semantic) |
| Auto-Capture Alpha | Week 6 | Pattern detection works in isolation |
| Auto-Capture Beta | Week 7 | Hook integrates with Claude Code |
| v0.2.0 Release | Week 8 | All features documented and tested |

## Appendix

### A. Token Estimation Methodology

Estimates based on tiktoken with cl100k_base encoding:

- Compact record (id, type, topic, weight, score): ~50 tokens
- Full record (all fields + data JSON): ~300-800 tokens (avg 500)
- Typical context: 20 records

### B. SQLite FTS5 vs PostgreSQL tsvector

| Aspect | FTS5 | tsvector |
|--------|------|----------|
| Query syntax | Simple MATCH | websearch_to_tsquery |
| Ranking | BM25 | ts_rank_cd |
| Prefix search | Yes | Yes |
| Phrase search | Yes | Yes |
| Stemming | Via tokenizer | Built-in |
| Performance | Excellent | Excellent |

Both are production-grade. FTS5 is slightly simpler to configure.

### C. Ollama Embedding Models

Recommended models for local embeddings:

| Model | Dimensions | Size | Speed |
|-------|------------|------|-------|
| nomic-embed-text | 768 | 274MB | Fast |
| all-minilm | 384 | 45MB | Fastest |
| mxbai-embed-large | 1024 | 670MB | Slower |

Default: `nomic-embed-text` (good balance of quality/speed)

### D. Related Work

- **claude-mem**: 23K stars, captures everything, noisy
- **mem0**: Focuses on multi-user memory, more complex
- **LangChain Memory**: Tied to LangChain ecosystem
- **Zep**: Server-based, more infrastructure

Mem's position: Simple, local-first option with optional cloud sync.

### E. File Structure After Implementation

```
mem/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── schema.ts           # Supabase schema
│   ├── sqlite-schema.ts    # NEW: SQLite schema
│   ├── adapter.ts          # NEW: StorageAdapter interface
│   ├── supabase.ts         # Renamed from client.ts
│   ├── sqlite.ts           # NEW: SQLite adapter
│   ├── client.ts           # NEW: Facade using adapter
│   ├── embeddings.ts       # NEW: Unified embedding logic
│   ├── capture.ts          # NEW: Pattern detection
│   └── cli.ts
├── hooks/
│   └── mem-capture.js      # NEW: Claude Code hook
├── skills/
│   ├── remember/
│   ├── search/
│   └── context/
├── docs/
│   ├── concepts.md
│   ├── local-mode.md       # NEW
│   └── auto-capture.md     # NEW
└── package.json
```
