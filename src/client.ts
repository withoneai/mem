/**
 * Mem Supabase Client
 * https://mem.now
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type {
  MemRecord,
  MemRecordWithLinks,
  SearchResult,
  ContextResult,
  LinkedRecord,
  AddRecordOptions,
  UpdateRecordOptions,
  SearchOptions,
  ContextOptions,
  LinkedOptions,
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

  try {
    const client = getOpenAI();
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Warning: Failed to generate embedding:", error);
    return null;
  }
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
  const { tags, weight, generateEmbedding = true } = options;
  const db = getSupabase();

  const insertData: Record<string, unknown> = {
    type,
    data,
    tags: tags || extractTags(data),
  };

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
  const { tags, regenerateEmbedding = true } = options;
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

  const results = data || [];

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
