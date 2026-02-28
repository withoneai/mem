/**
 * Recall - Memory System for AI Agents
 *
 * A simple, graph-based memory system backed by Supabase
 * with hybrid search and relevance scoring.
 */

// Core client functions
export {
  // Client setup
  getSupabase,
  getOpenAI,
  hasOpenAI,

  // CRUD operations
  add,
  get,
  list,
  update,
  remove,

  // Link operations
  link,
  unlink,
  linked,

  // Search
  search,
  ftsSearch,

  // Context & Relevance
  context,
  incrementAccess,
  archive,
  unarchive,
  flush,
  weight,

  // Key-Based Operations
  findByKey,
  upsertByKeys,
  addKeys,
  removeKeys,

  // External References
  addExternalRef,
  findByExternalRef,
  listExternalRefs,
  touchExternalRef,

  // Convenience Shortcuts
  getPersonByEmail,
  getPendingFollowups,

  // Migration
  migrate,

  // Utilities
  getEmbedding,
  extractSearchableText,
} from "./client.js";

// Types
export type {
  MemRecord,
  MemRecordWithLinks,
  MemLink,
  ExternalRef,
  AddExternalRefOptions,
  SearchResult,
  ContextResult,
  LinkedRecord,
  UpsertResult,
  AddRecordOptions,
  UpdateRecordOptions,
  SearchOptions,
  ContextOptions,
  LinkedOptions,
} from "./types.js";

// Schema (for advanced users)
export {
  SCHEMA_VERSION,
  SCHEMA_SQL,
  VECTOR_INDEX_SQL,
  FUNCTIONS_SQL,
  getMigrationSQL,
} from "./schema.js";
