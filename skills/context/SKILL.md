---
name: mem-context
description: Get startup context from Mem memory
triggers:
  - "get context"
  - "load memory"
  - "what's important"
  - "session context"
  - "/context"
---

# Context Skill

Get the most relevant memories for session startup.

## Quick Command

```bash
# Default: top 20 most relevant
mem context

# Limit results
mem context -n 10

# Filter by types
mem context -t decision,preference
```

## How Relevance Works

Context uses a **relevance score** combining:
- **Weight (40%)**: Explicit importance (1-10, set with `weight` command)
- **Access frequency (30%)**: How often the memory is accessed/returned
- **Recency (30%)**: How recently it was accessed (decays over ~30 days)

This means:
- High-weight items always surface (preferences, critical decisions)
- Frequently useful items rise naturally
- Old, unused items fade away

## When to Use

### Session Startup

Run at the start of each conversation to load important context:

```bash
mem context
```

This returns preferences, active decisions, recent context.

### Before Major Work

Before starting significant tasks:

```bash
mem context -t decision,preference
```

Gets relevant decisions and preferences that should guide your work.

### Meeting Prep

Before discussing a specific topic:

```bash
mem search "topic name"
mem context -n 10
```

## Context Output

Results show:
- **Score**: Relevance score (higher = more relevant)
- **Type**: Memory type
- **Weight**: Explicit importance setting
- **Accesses**: How many times accessed
- **Content preview**

Example:
```
Startup Context (by relevance):

[0.823] preference: Code style preferences
         weight=9, accesses=15
         Prefers TypeScript over JavaScript. Use ESLint...

[0.756] decision: API Architecture
         weight=8, accesses=7
         Using REST not GraphQL. Rationale: simpler...

[0.534] note: Current sprint goals
         weight=5, accesses=3
         Focus on MCP integration and documentation...

20 memories
```

## Managing Relevance

### Increase Relevance

```bash
# Set high weight (always surfaces)
mem weight <id> 9

# Accessing via search naturally increases relevance
mem search "relevant query"
```

### Decrease Relevance

```bash
# Archive when done (excludes from context)
mem archive <id>

# Reset access count (lets it fade naturally)
mem flush <id>
```

### Restore

```bash
# Bring back archived memory
mem unarchive <id>
```

## Lifecycle Pattern

1. **Add**: New memory enters with default weight (5)
2. **Surface**: Frequently accessed = higher relevance
3. **Fade**: Unused items decay in relevance over time
4. **Archive**: When done, archive to exclude from context
5. **Flush**: If over-accessed temporarily, flush to let it decay

## Integration Pattern

For AI agents, a typical session start:

```bash
# 1. Load context
mem context -n 15

# 2. Note any gaps or outdated info
# 3. Update weights if needed
mem weight <stale_id> 3
mem weight <important_id> 9

# 4. Archive completed items
mem archive <done_id>
```

## Related Commands

```bash
# Search for specific content
mem search "query"

# Get specific memory
mem get <id>

# Set importance
mem weight <id> <1-10>

# Archive
mem archive <id>
```
