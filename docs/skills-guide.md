# Skills Guide

How to use Mem skills with Claude Code or other AI agents.

## What Are Skills?

Skills are markdown files that tell AI agents how to perform specific tasks. Mem includes four skills:

- **setup**: Guide users through initial setup
- **remember**: Save information to memory
- **search**: Search the memory system
- **context**: Get startup context

## Installing Skills

### For Claude Code

Copy the skills folder to your project:

```bash
cp -r node_modules/@anthropic/mem/skills .claude/skills/mem/
```

Or symlink:

```bash
ln -s $(npm root)/@anthropic/mem/skills .claude/skills/mem
```

### For Other Agents

Reference the skill files at `node_modules/@anthropic/mem/skills/` or copy them to your agent's skill directory.

## Available Skills

### /mem-setup

Triggers: "set up mem", "initialize memory", "/mem-setup"

Guides through:
1. Installing the package
2. Creating Supabase project
3. Enabling pgvector
4. Configuring environment
5. Applying schema
6. Verifying setup

### /remember

Triggers: "remember this", "note that", "save this", "/remember"

Helps save information with:
- Appropriate type selection
- Weight recommendations
- Link creation
- Confirmation

### /search

Triggers: "search memory", "what do I know about", "/search"

Searches with:
- Hybrid search explanation
- Type filtering
- Access tracking awareness
- Result interpretation

### /context

Triggers: "get context", "load memory", "/context"

Gets startup context with:
- Relevance scoring explanation
- Type filtering
- Lifecycle management tips

## CLAUDE.md Integration

Add this to your project's `CLAUDE.md` for seamless integration:

```markdown
## Memory System

This project uses Mem for persistent memory.

### Session Startup

Run at the start of each session:

\`\`\`bash
mem context
\`\`\`

This returns the most relevant memories based on importance, access frequency, and recency.

### Quick Commands

\`\`\`bash
# Add memory
mem add <type> '{"content": "..."}'
mem add decision '{"topic": "...", "content": "...", "weight": 9}'

# Search
mem search "query"
mem search "query" -t decision

# Get context
mem context
mem context -n 10 -t decision,preference

# Set importance (1-10)
mem weight <id> 9

# Archive when done
mem archive <id>
\`\`\`

### When to Remember

Save to memory when:
- User says "remember this", "note that", "save this"
- A decision is made with rationale
- A preference is expressed
- Important context is shared
- A lesson is learned

### Memory Types

- \`note\`: General information
- \`decision\`: Choices with rationale (weight: 7-9)
- \`preference\`: How user likes things (weight: 8-10)
- \`insight\`: Learnings and realizations
- \`context\`: Background about people/projects

### Proactive Search

Before saying "I don't have information about X", search memory first:

\`\`\`bash
mem search "X"
\`\`\`
```

## Writing Custom Skills

Skills are markdown files with YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does
triggers:
  - "phrase that triggers this"
  - "/slash-command"
---

# Skill Name

Description of what this skill does.

## Quick Command

\`\`\`bash
mem ...
\`\`\`

## Workflow

1. First step
2. Second step
3. Third step

## Examples

**User:** "Example request"

\`\`\`bash
mem ...
\`\`\`

Response: "What to tell the user"
```

### Frontmatter Fields

- `name`: Unique skill identifier
- `description`: Brief description for skill discovery
- `triggers`: Phrases/commands that activate this skill

### Content Structure

1. **Quick Command**: Most common usage
2. **Workflow**: Step-by-step guide
3. **Examples**: Common scenarios with responses

## Best Practices

### For AI Agents

1. **Session start**: Always run `mem context`
2. **Before unfamiliar names**: Search memory first
3. **After decisions**: Save with rationale
4. **Auto-remember**: Proactively save preferences and decisions
5. **Confirm saves**: Tell user what was saved

### For Users

1. **Be explicit**: "Remember that I prefer X"
2. **Provide context**: "This is important because..."
3. **Review periodically**: "Show me my preferences"
4. **Archive old items**: Keep context relevant
