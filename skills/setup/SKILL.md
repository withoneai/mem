---
name: mem-setup
description: Set up Mem memory system with Supabase
triggers:
  - "set up mem"
  - "initialize memory"
  - "install mem"
  - "/mem-setup"
---

# Mem Setup Skill

Guide the user through setting up Mem with Supabase.

## Prerequisites Check

First, verify the user has what they need:

```bash
# Check Node.js version (need 18+)
node --version

# Check if mem is installed
npm list mem-memory 2>/dev/null || echo "Not installed"
```

## Workflow

### Step 1: Install Mem

```bash
npm install mem-memory
```

Or with a specific project:
```bash
cd your-project
npm install mem-memory
```

### Step 2: Create Supabase Project

If the user doesn't have a Supabase project:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Note the project URL and service role key

### Step 3: Enable pgvector Extension

In Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This enables semantic search capabilities.

### Step 4: Configure Environment

Create a `.env` file in the project root:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key  # Optional, for semantic search
```

**Important:**
- Use the **service role key**, not the anon key (for server-side operations)
- The OpenAI key is optional but recommended for better search quality

### Step 5: Apply Schema

```bash
npx mem migrate
```

This creates the `mem_records` and `mem_links` tables plus all the functions.

If the migration fails (some Supabase configs don't allow exec_sql), it will save the SQL to `mem-migration.sql`. Run that SQL manually in the Supabase SQL Editor.

### Step 6: Verify Setup

```bash
# Add a test memory
npx mem add note '{"content": "Test memory for setup verification"}'

# Search for it
npx mem search "test"

# Get context
npx mem context
```

### Step 7: Add to CLAUDE.md (for Claude Code users)

Add this snippet to your project's `CLAUDE.md`:

```markdown
## Memory System

This project uses Mem for memory. Run context at session start:

\`\`\`bash
npx mem context
\`\`\`

### Quick Commands

\`\`\`bash
# Add memory
npx mem add <type> '{"content": "..."}'

# Search
npx mem search "query"

# Get context
npx mem context

# Set importance (1-10)
npx mem weight <id> 9

# Archive when done
npx mem archive <id>
\`\`\`

### When to Remember

Save to memory when:
- User says "remember this", "note that", "save this"
- A decision is made with rationale
- A preference is expressed
- Important context is shared
- A lesson is learned
```

## Troubleshooting

### "SUPABASE_URL must be set"

Create a `.env` file with your Supabase credentials.

### "pgvector extension not found"

Run `CREATE EXTENSION IF NOT EXISTS vector;` in the Supabase SQL Editor.

### "Failed to generate embedding"

Check that `OPENAI_API_KEY` is set. Semantic search requires OpenAI embeddings.
If you don't have an OpenAI key, search will fall back to keyword-only mode.

### Migration fails

Copy the SQL from `mem-migration.sql` and run it directly in Supabase SQL Editor.

## Done!

Once setup is complete, use the other Mem skills:
- `/remember` - Add memories
- `/search` - Search memories
- `/context` - Get startup context
