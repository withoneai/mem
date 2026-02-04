/**
 * Mem Type Definitions
 */

// =============================================================================
// Core Types
// =============================================================================

export interface MemRecord {
  id: string;
  type: string;
  data: Record<string, unknown>;
  tags?: string[];
  embedding?: number[];
  searchable_text?: string;
  weight: number;
  access_count: number;
  last_accessed_at?: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface MemLink {
  id: string;
  from_id: string;
  to_id: string;
  relation: string;
  bidirectional: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface MemRecordWithLinks extends MemRecord {
  outgoing: Array<{
    relation: string;
    bidirectional: boolean;
    metadata?: Record<string, unknown>;
    record: { id: string; type: string; data: Record<string, unknown> };
  }>;
  incoming: Array<{
    relation: string;
    bidirectional: boolean;
    metadata?: Record<string, unknown>;
    record: { id: string; type: string; data: Record<string, unknown> };
  }>;
}

// =============================================================================
// Search Types
// =============================================================================

export interface SearchResult {
  id: string;
  type: string;
  data: Record<string, unknown>;
  tags?: string[];
  fts_rank: number;
  semantic_rank: number;
  combined_score: number;
}

export interface ContextResult {
  id: string;
  type: string;
  data: Record<string, unknown>;
  tags?: string[];
  weight: number;
  access_count: number;
  relevance_score: number;
}

// =============================================================================
// Options Types
// =============================================================================

export interface AddRecordOptions {
  tags?: string[];
  weight?: number;
  generateEmbedding?: boolean;
}

export interface UpdateRecordOptions {
  tags?: string[];
  regenerateEmbedding?: boolean;
}

export interface SearchOptions {
  limit?: number;
  type?: string;
  ftsWeight?: number;
  semanticWeight?: number;
  includeArchived?: boolean;
  trackAccess?: boolean;
}

export interface ContextOptions {
  limit?: number;
  types?: string[];
}

export interface LinkedOptions {
  relation?: string;
  direction?: "outgoing" | "incoming" | "both";
}

// =============================================================================
// Linked Record Result
// =============================================================================

export interface LinkedRecord {
  id: string;
  type: string;
  data: Record<string, unknown>;
  relation: string;
  bidirectional: boolean;
  link_metadata?: Record<string, unknown>;
}
