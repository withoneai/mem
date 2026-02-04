# Mem

Memory for AI agents. Simple, fast, works anywhere.

**https://mem.now**

## Quick Start

```bash
npm install @anthropic/mem
mem init
```

The `init` wizard will:
1. Configure your Supabase connection
2. Apply the database schema
3. Create CLAUDE.md with instructions
4. Install skills for Claude Code

## Usage

```bash
# Add memories
mem add note '{"content": "Meeting notes from today"}'
mem add decision '{"topic": "API Design", "content": "Using REST because...", "weight": 9}'
mem add preference '{"content": "Prefers TypeScript", "weight": 8}'

# Search (semantic + keyword)
mem search "API design"
mem search "meeting" -t note

# Get context at session start
mem context
mem context -n 10 -t decision,preference

# Manage relevance
mem weight <id> 9      # Set importance (1-10)
mem archive <id>       # Exclude from context
mem flush <id>         # Reset access count

# Link memories
mem link <id1> related_to <id2> --bi    # Bidirectional
mem link <new> supersedes <old>          # Directional
```

## How It Works

**Two tables:**
- `mem_records` - All memories (flexible JSON)
- `mem_links` - Relationships between memories

**Relevance scoring:**
- Weight (40%) - Explicit importance you set
- Access (30%) - How often it's retrieved
- Recency (30%) - When it was last accessed

High-weight items always surface. Frequently used items rise. Old unused items fade.

**Hybrid search:**
- Semantic similarity (70%) - Finds conceptually related content
- Keyword matching (30%) - Finds exact terms

## Requirements

- Node.js 18+
- Supabase project (free tier works)
- OpenAI API key (optional, for semantic search)

## TypeScript API

```typescript
import { add, search, context, link } from '@anthropic/mem';

// Add a memory
const record = await add('decision', {
  topic: 'Database',
  content: 'Using Supabase because...',
}, { weight: 9 });

// Search
const results = await search('database decision');

// Get startup context
const relevant = await context({ limit: 20 });

// Link memories
await link(id1, id2, 'related_to', { bidirectional: true });
```

## License

MIT
