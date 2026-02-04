# Getting Started with Mem

This guide walks you through setting up Mem from scratch.

## Prerequisites

- **Node.js 18+**: Check with `node --version`
- **Supabase account**: Free tier works fine
- **OpenAI API key** (optional): For semantic search

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose a name and password
4. Wait for the project to be created (~2 minutes)

## Step 2: Enable pgvector

In your Supabase project:

1. Go to **SQL Editor**
2. Run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This enables the vector similarity search used for semantic matching.

## Step 3: Install Mem

In your project directory:

```bash
npm install @anthropic/mem
```

Or globally:

```bash
npm install -g @anthropic/mem
```

## Step 4: Configure Environment

Create a `.env` file:

```bash
# Required
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...your-service-role-key

# Optional (for semantic search)
OPENAI_API_KEY=sk-...your-openai-key
```

**Where to find these:**
- `SUPABASE_URL`: Project Settings > API > Project URL
- `SUPABASE_SERVICE_KEY`: Project Settings > API > service_role (secret)
- `OPENAI_API_KEY`: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

**Important:** Use the service role key, not the anon key. The service key bypasses Row Level Security for full access.

## Step 5: Apply Schema

```bash
mem migrate
```

This creates:
- `mem_records` table for all memories
- `mem_links` table for relationships
- All necessary functions and indexes

If migration fails, it saves SQL to `mem-migration.sql`. Run that SQL manually in the Supabase SQL Editor.

## Step 6: Verify Setup

```bash
# Add a test memory
mem add note '{"content": "Hello, Mem!"}'

# Search for it
mem search "hello"

# Get context
mem context
```

You should see your test memory in the results.

## Step 7: Start Using Mem

### Add memories

```bash
# Notes
mem add note '{"content": "Meeting with Jane went well"}'

# Decisions with rationale
mem add decision '{"topic": "Framework", "content": "Using Next.js because...", "weight": 8}'

# Preferences (high weight to always surface)
mem add preference '{"content": "Prefers TypeScript", "weight": 9}'
```

### Search

```bash
mem search "Jane"
mem search "framework decision" -t decision
```

### Get context at session start

```bash
mem context
```

## For AI Agent Integration

If you're using Mem with Claude Code or another AI agent:

1. Copy `skills/` to your project's skill directory
2. Add the CLAUDE.md snippet from the README
3. Run `mem context` at session start

## Troubleshooting

### "SUPABASE_URL must be set"

Make sure your `.env` file exists and contains the correct values.

### "Failed to generate embedding"

This is a warning, not an error. Semantic search requires OpenAI. Without it, search falls back to keyword-only mode.

### "relation mem_records does not exist"

Run the migration: `mem migrate`

### Migration fails

Copy `mem-migration.sql` and run it directly in Supabase SQL Editor.

## Next Steps

- Read [Concepts](./concepts.md) to understand how Mem works
- See [CLI Reference](./cli-reference.md) for all commands
- Check [Skills Guide](./skills-guide.md) for AI agent integration
