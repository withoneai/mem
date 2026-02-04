# CLI Reference

Complete reference for the `mem` command-line interface.

## Global Options

```bash
mem --version    # Show version
mem --help       # Show help
```

## CRUD Commands

### add

Add a new memory record.

```bash
mem add <type> '<json>'
```

**Arguments:**
- `type`: Record type (note, decision, preference, etc.)
- `json`: JSON object with data

**Special JSON fields:**
- `weight`: Set importance (1-10), removed from data
- `tags`: Array of tags, removed from data

**Examples:**
```bash
mem add note '{"content": "Meeting notes"}'
mem add decision '{"topic": "API", "content": "Using REST", "weight": 9}'
mem add preference '{"content": "Prefers TypeScript", "tags": ["code"]}'
```

### get

Get a memory by ID.

```bash
mem get <id> [--with-links]
```

**Options:**
- `--with-links`: Include linked records in response

**Examples:**
```bash
mem get abc123
mem get abc123 --with-links
```

### list

List memories by type.

```bash
mem list <type> [--filter key=value] [-n limit]
```

**Options:**
- `--filter`: Filter by JSON field value
- `-n, --limit`: Maximum results (default: 100)

**Examples:**
```bash
mem list note
mem list decision --filter topic=API
mem list preference -n 10
```

### update

Update a memory.

```bash
mem update <id> '<json>'
```

Updates are merged with existing data. Regenerates embedding.

**Examples:**
```bash
mem update abc123 '{"content": "Updated content"}'
mem update abc123 '{"status": "done", "tags": ["completed"]}'
```

### delete

Delete a memory.

```bash
mem delete <id>
```

## Link Commands

### link

Create a link between memories.

```bash
mem link <from> <relation> <to> [--bi]
```

**Options:**
- `--bi`: Make link bidirectional

**Examples:**
```bash
# Directional
mem link person123 works_at company456

# Bidirectional
mem link doc1 related_to doc2 --bi
```

### unlink

Remove a link.

```bash
mem unlink <from> <relation> <to>
```

### linked

Get linked memories.

```bash
mem linked <id> [relation] [--dir direction]
```

**Options:**
- `relation`: Filter by relation type
- `--dir`: Direction (outgoing, incoming, both). Default: outgoing

For outgoing direction, bidirectional links from incoming are also included.

**Examples:**
```bash
mem linked abc123
mem linked person123 works_at
mem linked company456 --dir incoming
mem linked doc1 --dir both
```

## Search Commands

### search

Search memories using hybrid (semantic + keyword) search.

```bash
mem search <query> [-t type] [-n limit]
```

**Options:**
- `-t, --type`: Filter by record type
- `-n, --limit`: Maximum results (default: 10)

**Examples:**
```bash
mem search "database decision"
mem search "API design" -t decision
mem search "Jane" -n 20
```

**Output:**
```
[0.847] decision: Database Choice
         Using Supabase for database...

[0.634] note: Database notes
         Compared PostgreSQL and MongoDB...

2 results
```

### context

Get startup context (most relevant memories).

```bash
mem context [-n limit] [-t types]
```

**Options:**
- `-n, --limit`: Maximum results (default: 20)
- `-t, --types`: Comma-separated type filter

**Examples:**
```bash
mem context
mem context -n 10
mem context -t decision,preference
```

**Output:**
```
Startup Context (by relevance):

[0.823] preference: Code style
         weight=9, accesses=15
         Prefers TypeScript...

[0.756] decision: API Architecture
         weight=8, accesses=7
         Using REST not GraphQL...

20 memories
```

## Relevance Commands

### weight

Set importance weight.

```bash
mem weight <id> <value>
```

**Arguments:**
- `id`: Record ID
- `value`: Weight 1-10 (1=low, 5=default, 10=critical)

**Examples:**
```bash
mem weight abc123 9    # Mark as important
mem weight abc123 3    # Let it fade
```

### archive

Archive memories (exclude from context).

```bash
mem archive <id...>
```

Archived memories are still searchable but won't appear in `context`.

**Examples:**
```bash
mem archive abc123
mem archive id1 id2 id3
```

### unarchive

Restore archived memories.

```bash
mem unarchive <id...>
```

### flush

Reset access count (let relevance decay naturally).

```bash
mem flush <id...>
```

Use when something was over-accessed temporarily.

## Setup Commands

### migrate

Apply database schema to Supabase.

```bash
mem migrate [--dry-run]
```

**Options:**
- `--dry-run`: Print SQL without executing

If migration fails, SQL is saved to `mem-migration.sql` for manual execution.

## Exit Codes

- `0`: Success
- `1`: Error (invalid arguments, not found, operation failed)

## Environment Variables

Required:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Service role key (or `SUPABASE_ANON_KEY`)

Optional:
- `OPENAI_API_KEY`: For semantic search embeddings

## Tips

### JSON with Special Characters

Use single quotes around JSON and double quotes inside:
```bash
mem add note '{"content": "He said \"hello\""}'
```

### Piping Output

```bash
mem search "query" | jq '.[] | .data.content'
mem list note | jq 'length'
```

### Scripting

```bash
# Add and capture ID
ID=$(mem add note '{"content": "test"}' | grep "ID:" | cut -d' ' -f2)
echo "Created: $ID"

# Archive old items
mem list note | jq -r '.[].id' | xargs mem archive
```
