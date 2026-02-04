# Example CLAUDE.md with Mem Integration

This is an example `CLAUDE.md` showing how to integrate Mem memory into your project.

---

## Memory System

This project uses [Mem](https://github.com/anthropics/mem) for persistent memory.

### Session Startup

Run at the start of each session:

```bash
mem context
```

This returns the most relevant memories based on importance, access frequency, and recency.

### Quick Commands

```bash
# Add memory
mem add <type> '{"content": "..."}'
mem add decision '{"topic": "...", "content": "...", "weight": 9}'
mem add preference '{"content": "...", "weight": 8}'

# Search
mem search "query"
mem search "query" -t decision -n 20

# Get context
mem context
mem context -n 10 -t decision,preference

# Set importance (1-10)
mem weight <id> 9

# Archive when done
mem archive <id>

# Link related memories
mem link <id1> related_to <id2> --bi
```

### When to Remember

**Always save to memory when:**
- User says "remember this", "note that", "save this"
- A decision is made with its rationale
- A preference is expressed ("I prefer X over Y")
- Important context is shared about people/projects
- A lesson is learned or mistake is made

**Memory types:**
- `note`: General information, context (weight: 5)
- `decision`: Choices with rationale (weight: 7-9)
- `preference`: How user likes things done (weight: 8-10)
- `insight`: Learnings, realizations (weight: 6-8)
- `context`: Background about people/projects (weight: 5-7)

### Auto-Remember Triggers

Proactively save when you notice:
- **Preferences**: "I like X", "I prefer Y", "Don't do Z"
- **Decisions**: "Let's go with A", "We decided B"
- **Context**: Background about people, companies, relationships
- **Learnings**: "This worked because...", "Next time we should..."
- **Corrections**: "Actually, it's X not Y"

When auto-remembering, briefly note what you're saving:
"I'll remember that you prefer TypeScript for new projects."

### Proactive Search

**Before saying "I don't have information about X"**, always search memory first:

```bash
mem search "X"
```

Search when encountering:
- Names you don't recognize
- Companies or projects mentioned
- References to past decisions
- Technical terms that might be project-specific

**Report what you find:**
- If found: "I found [X] in memory: [summary]"
- If not: "I searched memory for [X] but found no matches."

### Relevance Management

Relevance score = weight (40%) + access frequency (30%) + recency (30%)

**To increase relevance:**
```bash
mem weight <id> 9      # Mark as important
```

**To decrease relevance:**
```bash
mem archive <id>       # Exclude from context
mem flush <id>         # Reset access count
```

**Lifecycle:**
1. Add: Memory enters with default weight (5)
2. Rise: Frequently accessed memories gain relevance
3. Fade: Unused memories naturally decay
4. Archive: When done, archive to exclude from context
