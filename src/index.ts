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
  SearchResult,
  ContextResult,
  LinkedRecord,
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
