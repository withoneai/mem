---
name: remember
description: Save information to Mem memory
triggers:
  - "remember this"
  - "remember that"
  - "save this"
  - "note that"
  - "don't forget"
  - "/remember"
---

# Remember Skill

Save information to Mem memory for future retrieval.

## Quick Commands

```bash
# Basic - add any type of memory
mem add note '{"content": "The actual information to remember"}'

# With topic for organization
mem add note '{"content": "...", "topic": "Meeting Notes"}'

# Decision with high importance
mem add decision '{"topic": "API Design", "content": "Use REST not GraphQL because...", "weight": 9}'

# Preference (usually high weight)
mem add preference '{"content": "Prefers TypeScript over JavaScript", "weight": 8}'

# Link two memories
mem link <id1> related_to <id2> --bi    # bidirectional
mem link <id1> supersedes <id2>          # directional (old -> new)
```

## Workflow

### 1. Determine What to Save

Extract the key information. Ask if unclear:
- What exactly should be remembered?
- Is this a fact, preference, decision, or context?
- How important is it? (1=low, 5=default, 10=always surface)

### 2. Choose Type and Weight

| Type | When to Use | Typical Weight |
|------|-------------|----------------|
| `note` | General information, context | 5 |
| `decision` | Choices made with rationale | 7-9 |
| `preference` | How user likes things done | 8-10 |
| `insight` | Learnings, realizations | 6-8 |
| `context` | Background info about people/projects | 5-7 |

Weight guide:
- **1-3**: Nice to know, can fade
- **4-6**: Standard importance (default is 5)
- **7-8**: Important, should surface often
- **9-10**: Critical, always surface

### 3. Execute Command

```bash
mem add <type> '{"content": "...", "weight": N}'
```

### 4. Confirm What Was Saved

Tell the user:
- What was saved
- The ID (for reference)
- The weight if non-default

## Examples

**User:** "Remember that I prefer TypeScript over Python for new projects"

```bash
mem add preference '{"content": "Prefers TypeScript over Python for new projects", "weight": 8}'
```

Response: "Saved preference with weight 8. ID: abc123"

---

**User:** "We decided to use Supabase for the database because of real-time features"

```bash
mem add decision '{"topic": "Database Choice", "content": "Using Supabase for database. Rationale: real-time features, built-in auth, and good DX.", "weight": 9}'
```

Response: "Saved decision about database choice with weight 9."

---

**User:** "Note that Jane prefers async communication"

```bash
mem add context '{"content": "Jane prefers async communication (Slack/email over calls)", "about": "Jane"}'
```

Response: "Noted context about Jane."

---

**User:** "This supersedes our earlier decision about X"

```bash
mem add decision '{"topic": "X", "content": "New approach..."}'
# Then link to old decision
mem link <new_id> supersedes <old_id>
```

## Auto-Remember Triggers

Proactively save when you notice:
- **Preferences**: "I like X", "I prefer Y", "Don't do Z"
- **Decisions**: "Let's go with A", "We decided B"
- **Context**: Background about people, companies, relationships
- **Learnings**: "This worked because...", "Next time we should..."
- **Corrections**: "Actually, it's X not Y"

When auto-remembering, briefly note what you're saving:
"I'll remember that you prefer TypeScript for new projects."

## Other Useful Commands

```bash
# Update existing memory
mem update <id> '{"content": "Updated content"}'

# Archive when no longer relevant
mem archive <id>

# Change importance
mem weight <id> 9

# View a memory
mem get <id>

# List by type
mem list decision
```
