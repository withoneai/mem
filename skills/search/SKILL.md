---
name: mem-search
description: Search Mem memory
triggers:
  - "search memory"
  - "what do I know about"
  - "find in memory"
  - "mem"
  - "/search"
---

# Search Skill

Search the Mem memory system using hybrid (semantic + keyword) search.

## Quick Commands

```bash
# Basic search
mem search "query"

# Filter by type
mem search "query" -t decision

# More results
mem search "query" -n 20

# Combine options
mem search "API design" -t decision -n 5
```

## How Search Works

Mem uses **hybrid search** that combines:
- **Semantic similarity** (70% weight): Finds conceptually related content
- **Keyword matching** (30% weight): Finds exact term matches

This means searching "database choice" will find memories about "Supabase selection" even if those exact words aren't used.

## When to Search

**Always search for:**
- Names, companies, or projects you don't recognize
- Past decisions about a topic before making new ones
- Context before meetings or conversations
- Background on technical approaches

**Search patterns:**
- "What did we decide about X?"
- "What do I know about [person/company]?"
- "Any notes on [topic]?"
- "Previous decisions about [area]"

## Examples

**User:** "What did we decide about the database?"

```bash
mem search "database decision" -t decision
```

---

**User:** "Who is Jane?"

```bash
mem search "Jane"
```

---

**User:** "Any notes on MCP integration?"

```bash
mem search "MCP integration"
```

---

**User:** "What are my preferences for code style?"

```bash
mem search "code style preference" -t preference
```

## Search Output

Results show:
- **Score**: Combined relevance (0-1, higher = more relevant)
- **Type**: The memory type
- **Content preview**: First 100 chars of content

Example output:
```
[0.847] decision: Database Choice
         Using Supabase for database. Rationale: real-time features...

[0.634] note: Database evaluation notes
         Compared PostgreSQL, MongoDB, and Supabase...

2 results
```

## Access Tracking

Search automatically increments the access count for returned results. This means:
- Frequently accessed memories rise in relevance
- Unused memories naturally fade over time

If you don't want to affect relevance scores, the `search` function accepts `trackAccess: false` (available via TypeScript API).

## Proactive Search

When encountering unfamiliar references:

1. **Search first** before saying "I don't have information"
2. **Report findings** if results found
3. **Note gaps** if no results

Example:
> "I searched for 'Acme Corp' and found: They're a potential customer Jane introduced. Last meeting was Jan 15."

Or:
> "I searched for 'Project Apollo' but found no matches in memory."

## Related Commands

```bash
# Get full context for session startup
mem context

# Get a specific memory by ID
mem get <id>

# Get linked memories
mem linked <id>
```
