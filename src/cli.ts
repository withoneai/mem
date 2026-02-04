#!/usr/bin/env node
/**
 * mem - Memory for AI agents
 * https://mem.now
 *
 * Usage:
 *   mem <command> [args...]
 *
 * Commands:
 *   init                             Interactive setup
 *   add <type> '<json>'              Add memory
 *   get <id> [--with-links]          Get by ID
 *   list <type> [--filter key=val]   List memories
 *   update <id> '<json>'             Update
 *   delete <id>                      Delete
 *   link <from> <relation> <to>      Create link
 *   unlink <from> <relation> <to>    Remove link
 *   linked <id> [relation]           Get linked
 *   search <query> [-t type] [-n N]  Hybrid search
 *   context [-n N] [-t types]        Startup context
 *   weight <id> <1-10>               Set importance
 *   archive <id>                     Archive
 *   unarchive <id>                   Restore
 *   flush <id>                       Reset access
 *   migrate                          Apply schema
 */

import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { execSync, spawnSync } from "child_process";
import { existsSync, writeFileSync, readFileSync, mkdirSync, cpSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import {
  add,
  get,
  list,
  update,
  remove,
  link,
  unlink,
  linked,
  search,
  context,
  archive,
  unarchive,
  flush,
  weight,
  migrate,
} from "./client.js";
import { SCHEMA_VERSION, getMigrationSQL } from "./schema.js";

const program = new Command();

program
  .name("mem")
  .description("Memory for AI agents")
  .version(SCHEMA_VERSION);

// =============================================================================
// CRUD Commands
// =============================================================================

program
  .command("add <type> <json>")
  .description("Add a new memory")
  .action(async (type: string, jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      const tags = data.tags;
      const weightVal = data.weight;
      delete data.tags;
      delete data.weight;

      const result = await add(type, data, { tags, weight: weightVal });
      if (result) {
        const name = data.content?.slice(0, 50) || data.topic || data.title || result.id;
        console.log(`Added ${type}: ${name}`);
        console.log(`ID: ${result.id}`);
        if (weightVal) console.log(`Weight: ${weightVal}`);
      } else {
        console.error("Failed to add memory");
        process.exit(1);
      }
    } catch (error) {
      console.error("Error:", (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("get <id>")
  .description("Get a memory by ID")
  .option("--with-links", "Include linked records")
  .action(async (id: string, options: { withLinks?: boolean }) => {
    const result = await get(id, options.withLinks);
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("Memory not found");
      process.exit(1);
    }
  });

program
  .command("list <type>")
  .description("List memories by type")
  .option("--filter <key=value>", "Filter by field")
  .option("-n, --limit <number>", "Max results", "100")
  .action(async (type: string, options: { filter?: string; limit: string }) => {
    let filterField: string | undefined;
    let filterValue: string | undefined;

    if (options.filter) {
      const [key, value] = options.filter.split("=");
      filterField = key;
      filterValue = value;
    }

    const results = await list(type, {
      filterField,
      filterValue,
      limit: parseInt(options.limit, 10),
    });

    console.log(JSON.stringify(results, null, 2));
    console.log(`\n${results.length} memories`);
  });

program
  .command("update <id> <json>")
  .description("Update a memory")
  .action(async (id: string, jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      const tags = data.tags;
      delete data.tags;

      const result = await update(id, data, { tags });
      if (result) {
        console.log(`Updated: ${result.id}`);
      } else {
        console.log("Memory not found");
        process.exit(1);
      }
    } catch (error) {
      console.error("Error:", (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("delete <id>")
  .description("Delete a memory")
  .action(async (id: string) => {
    if (await remove(id)) {
      console.log(`Deleted: ${id}`);
    } else {
      console.log("Memory not found");
      process.exit(1);
    }
  });

// =============================================================================
// Link Commands
// =============================================================================

program
  .command("link <from> <relation> <to>")
  .description("Create a link between memories")
  .option("--bi", "Make link bidirectional")
  .action(
    async (
      from: string,
      relation: string,
      to: string,
      options: { bi?: boolean }
    ) => {
      const result = await link(from, to, relation, {
        bidirectional: options.bi,
      });
      if (result) {
        const arrow = options.bi ? "<--" : "--";
        console.log(`Created link: ${from} ${arrow}${relation}${arrow}> ${to}`);
      } else {
        console.error("Failed to create link");
        process.exit(1);
      }
    }
  );

program
  .command("unlink <from> <relation> <to>")
  .description("Remove a link between memories")
  .action(async (from: string, relation: string, to: string) => {
    if (await unlink(from, to, relation)) {
      console.log(`Removed link: ${from} --${relation}--> ${to}`);
    } else {
      console.log("Link not found");
      process.exit(1);
    }
  });

program
  .command("linked <id> [relation]")
  .description("Get linked memories")
  .option(
    "--dir <direction>",
    "Direction: outgoing, incoming, or both",
    "outgoing"
  )
  .action(
    async (
      id: string,
      relation: string | undefined,
      options: { dir: "outgoing" | "incoming" | "both" }
    ) => {
      const results = await linked(id, { relation, direction: options.dir });
      console.log(JSON.stringify(results, null, 2));
      console.log(`\n${results.length} linked memories`);
    }
  );

// =============================================================================
// Search Commands
// =============================================================================

program
  .command("search <query>")
  .description("Search memories (hybrid: semantic + keyword)")
  .option("-t, --type <type>", "Filter by type")
  .option("-n, --limit <number>", "Max results", "10")
  .action(
    async (query: string, options: { type?: string; limit: string }) => {
      const results = await search(query, {
        type: options.type,
        limit: parseInt(options.limit, 10),
      });

      for (const r of results) {
        const data = r.data as Record<string, unknown>;
        const name =
          (data.content as string)?.slice(0, 50) ||
          (data.topic as string) ||
          (data.title as string) ||
          r.id.slice(0, 8);
        console.log(`[${r.combined_score.toFixed(3)}] ${r.type}: ${name}`);

        const content =
          (data.content as string) ||
          (data.notes as string) ||
          (data.summary as string);
        if (content && content.length > 60) {
          console.log(`         ${content.slice(0, 100)}...`);
        }
        console.log();
      }

      console.log(`${results.length} results`);
    }
  );

// =============================================================================
// Context Commands
// =============================================================================

program
  .command("context")
  .description("Get startup context (most relevant memories)")
  .option("-n, --limit <number>", "Max results", "20")
  .option("-t, --types <types>", "Comma-separated types")
  .action(async (options: { limit: string; types?: string }) => {
    const types = options.types
      ? options.types.split(",").map((t) => t.trim())
      : undefined;

    const results = await context({
      limit: parseInt(options.limit, 10),
      types,
    });

    console.log("Startup Context (by relevance):\n");
    for (const r of results) {
      const data = r.data as Record<string, unknown>;
      const name =
        (data.content as string)?.slice(0, 50) ||
        (data.topic as string) ||
        (data.title as string) ||
        r.id.slice(0, 8);
      const score = r.relevance_score.toFixed(3);

      console.log(`[${score}] ${r.type}: ${name}`);
      console.log(`         weight=${r.weight}, accesses=${r.access_count}`);

      const content =
        (data.content as string) ||
        (data.notes as string) ||
        (data.summary as string);
      if (content && content.length > 60) {
        console.log(`         ${content.slice(0, 80)}...`);
      }
      console.log();
    }

    console.log(`${results.length} memories`);
  });

// =============================================================================
// Relevance Commands
// =============================================================================

program
  .command("weight <id> <value>")
  .description("Set importance weight (1=low, 5=default, 10=high)")
  .action(async (id: string, value: string) => {
    const weightVal = parseInt(value, 10);
    if (weightVal < 1 || weightVal > 10) {
      console.error("Weight must be between 1 and 10");
      process.exit(1);
    }

    if (await weight(id, weightVal)) {
      console.log(`Set weight=${weightVal} for ${id}`);
    } else {
      console.error("Failed to set weight");
      process.exit(1);
    }
  });

program
  .command("archive <id...>")
  .description("Archive memories (exclude from context)")
  .action(async (ids: string[]) => {
    const count = await archive(ids);
    console.log(`Archived ${count} memories`);
  });

program
  .command("unarchive <id...>")
  .description("Restore archived memories")
  .action(async (ids: string[]) => {
    const count = await unarchive(ids);
    console.log(`Unarchived ${count} memories`);
  });

program
  .command("flush <id...>")
  .description("Reset access count (let relevance decay)")
  .action(async (ids: string[]) => {
    const count = await flush(ids);
    console.log(`Flushed ${count} memories (access count reset)`);
  });

// =============================================================================
// Setup Commands
// =============================================================================

function hasSupabaseCLI(): boolean {
  try {
    execSync("which supabase", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runSupabaseMigration(sqlFile: string): boolean {
  try {
    const result = spawnSync("supabase", ["db", "execute", "--file", sqlFile], {
      stdio: "inherit",
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

function readExistingEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  if (existsSync(".env")) {
    const content = readFileSync(".env", "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    }
  }
  return env;
}

program
  .command("init")
  .description("Interactive setup")
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(" mem.now ")));

    const existingEnv = readExistingEnv();
    const hasExistingConfig = Object.keys(existingEnv).length > 0;

    if (hasExistingConfig) {
      const shouldContinue = await p.confirm({
        message: "Found existing .env. Reconfigure?",
        initialValue: false,
      });

      if (p.isCancel(shouldContinue) || !shouldContinue) {
        p.outro("Keeping existing configuration.");
        return;
      }
    }

    // Step 1: Supabase URL
    p.note(
      `Find at: ${pc.cyan("supabase.com/dashboard/project/<ref>/settings/api")}\n` +
      `Format: ${pc.dim("https://xxxxx.supabase.co")}`,
      "Supabase Project URL"
    );

    const supabaseUrl = await p.text({
      message: "Supabase URL:",
      placeholder: "https://xxxxx.supabase.co",
      initialValue: existingEnv.SUPABASE_URL || "",
      validate: (value) => {
        if (!value) return "Supabase URL is required";
        if (!value.startsWith("https://") || !value.includes("supabase.co")) {
          return "URL should be https://xxxxx.supabase.co";
        }
        return undefined;
      },
    });

    if (p.isCancel(supabaseUrl)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    // Step 2: Service Key
    p.note(
      `Find at: ${pc.cyan("Project Settings > API > service_role (secret)")}\n` +
      `${pc.dim("Use the service_role key, not the anon key")}`,
      "Service Role Key"
    );

    const serviceKey = await p.text({
      message: "Service Key:",
      placeholder: "your-service-role-key",
      initialValue: existingEnv.SUPABASE_SERVICE_KEY || "",
      validate: (value) => {
        if (!value) return "Service key is required";
        if (value.length < 20) return "Service key seems too short";
        return undefined;
      },
    });

    if (p.isCancel(serviceKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    // Step 3: OpenAI Key (optional)
    p.note(
      `Find at: ${pc.cyan("platform.openai.com/api-keys")}\n` +
      `${pc.dim("Optional - enables semantic search. Press enter to skip.")}`,
      "OpenAI API Key"
    );

    const openaiKey = await p.text({
      message: "OpenAI Key (optional):",
      placeholder: "sk-... (press enter to skip)",
      initialValue: existingEnv.OPENAI_API_KEY || "",
    });

    if (p.isCancel(openaiKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    // Write .env
    let envContent = `# Mem Configuration (mem.now)\n`;
    envContent += `SUPABASE_URL=${supabaseUrl}\n`;
    envContent += `SUPABASE_SERVICE_KEY=${serviceKey}\n`;
    if (openaiKey) {
      envContent += `OPENAI_API_KEY=${openaiKey}\n`;
    }
    writeFileSync(".env", envContent);
    p.log.success("Saved .env");

    // Write migration SQL
    const migrationSql = getMigrationSQL();
    writeFileSync("mem-migration.sql", migrationSql);
    p.log.success("Saved mem-migration.sql");

    // Step 4: Run migration
    const hasCliTool = hasSupabaseCLI();

    if (hasCliTool) {
      const runMigration = await p.confirm({
        message: "Supabase CLI detected. Run migration now?",
        initialValue: true,
      });

      if (!p.isCancel(runMigration) && runMigration) {
        p.note(
          `Make sure you've linked your project:\n` +
          `  ${pc.cyan("supabase link --project-ref <ref>")}`,
          "Migration"
        );

        const proceed = await p.confirm({
          message: "Proceed with migration?",
          initialValue: true,
        });

        if (!p.isCancel(proceed) && proceed) {
          const spinner = p.spinner();
          spinner.start("Running migration...");

          const success = runSupabaseMigration("mem-migration.sql");

          if (success) {
            spinner.stop("Migration complete!");
          } else {
            spinner.stop("Migration failed");
            p.log.warn("Run manually: supabase db execute --file mem-migration.sql");
          }
        }
      }
    } else {
      p.note(
        `Option A: ${pc.cyan("Supabase CLI")}\n` +
        `  brew install supabase/tap/supabase\n` +
        `  supabase link --project-ref <ref>\n` +
        `  supabase db execute --file mem-migration.sql\n\n` +
        `Option B: ${pc.cyan("SQL Editor")}\n` +
        `  1. Open supabase.com/dashboard/project/<ref>/sql\n` +
        `  2. Paste contents of mem-migration.sql\n` +
        `  3. Click Run`,
        "Apply Schema"
      );
    }

    // Step 5: CLAUDE.md
    const hasClaudeMd = existsSync("CLAUDE.md");
    const claudeMdAction = hasClaudeMd ? "Append to" : "Create";

    const createClaudeMd = await p.confirm({
      message: `${claudeMdAction} CLAUDE.md with Mem instructions?`,
      initialValue: true,
    });

    if (!p.isCancel(createClaudeMd) && createClaudeMd) {
      const claudeContent = getClaudeMdContent();
      if (hasClaudeMd) {
        const existing = readFileSync("CLAUDE.md", "utf8");
        writeFileSync("CLAUDE.md", existing + "\n\n" + claudeContent);
        p.log.success("Appended to CLAUDE.md");
      } else {
        writeFileSync("CLAUDE.md", claudeContent);
        p.log.success("Created CLAUDE.md");
      }
    }

    // Step 6: Install skills
    const installSkillsChoice = await p.select({
      message: "Install Claude Code skills?",
      options: [
        {
          value: "project",
          label: "Project (.claude/skills/mem/)",
          hint: "Only available in this project",
        },
        {
          value: "global",
          label: "Global (~/.claude/skills/mem/)",
          hint: "Available in all projects",
        },
        {
          value: "skip",
          label: "Skip",
          hint: "Don't install skills",
        },
      ],
    });

    if (!p.isCancel(installSkillsChoice) && installSkillsChoice !== "skip") {
      const memRoot = join(__dirname, "..");
      const { success, path } = installSkills(memRoot, installSkillsChoice as "project" | "global");
      if (success) {
        p.log.success(`Installed skills to ${path}`);
      } else {
        p.log.warn("Failed to install skills");
        p.log.info("Manual: cp -r node_modules/@anthropic/mem/skills .claude/skills/mem");
      }
    }

    // Done
    p.note(
      `${pc.cyan("mem add note")} '{"content": "Hello!"}'\n` +
      `${pc.cyan("mem search")} "hello"\n` +
      `${pc.cyan("mem context")}`,
      "Test Commands"
    );

    p.outro("Setup complete!");
  });

function showManualInstructions() {
  p.note(
    `Option A: ${pc.cyan("Supabase CLI")}\n` +
    `  brew install supabase/tap/supabase\n` +
    `  supabase link --project-ref <ref>\n` +
    `  supabase db execute --file mem-migration.sql\n\n` +
    `Option B: ${pc.cyan("SQL Editor")}\n` +
    `  1. Open supabase.com/dashboard/project/<ref>/sql\n` +
    `  2. Paste contents of mem-migration.sql\n` +
    `  3. Click Run`,
    "Apply Schema"
  );
}

function getClaudeMdContent(): string {
  return `# Project Memory

This project uses [Mem](https://mem.now) for persistent AI memory.

## Session Startup

Run at the start of each session to load relevant context:

\`\`\`bash
mem context
\`\`\`

## Quick Commands

\`\`\`bash
# Add memories
mem add note '{"content": "..."}'
mem add decision '{"topic": "...", "content": "...", "weight": 9}'
mem add preference '{"content": "...", "weight": 8}'

# Search
mem search "query"
mem search "query" -t decision

# Get context
mem context
mem context -n 10 -t decision,preference

# Manage relevance
mem weight <id> 9          # Set importance (1-10)
mem archive <id>           # Exclude from context
mem unarchive <id>         # Restore

# Links
mem link <id1> related_to <id2> --bi   # Bidirectional
mem link <id1> supersedes <id2>        # Directional
\`\`\`

## When to Remember

**Save to memory when:**
- User says "remember this", "note that", "save this"
- A decision is made with its rationale
- A preference is expressed ("I prefer X over Y")
- Important context is shared about people/projects
- A lesson is learned or mistake identified

## Memory Types

| Type | Use Case | Typical Weight |
|------|----------|----------------|
| \`note\` | General information | 5 |
| \`decision\` | Choices with rationale | 7-9 |
| \`preference\` | How user likes things | 8-10 |
| \`insight\` | Learnings, realizations | 6-8 |
| \`context\` | Background info | 5-7 |

## Auto-Remember Triggers

Proactively save when you notice:
- **Preferences**: "I like X", "I prefer Y", "Don't do Z"
- **Decisions**: "Let's go with A", "We decided B"
- **Learnings**: "This worked because...", "Next time..."
- **Corrections**: "Actually, it's X not Y"

When auto-remembering, briefly note: "I'll remember that you prefer X."

## Proactive Search

Before saying "I don't have information about X", search memory:

\`\`\`bash
mem search "X"
\`\`\`

Report findings or note that nothing was found.

## Relevance Scoring

Score = weight (40%) + access frequency (30%) + recency (30%)

- High-weight items always surface
- Frequently accessed items rise naturally
- Unused items fade over ~30 days
- Archive when done to exclude from context
`;
}

function installSkills(memRoot: string, scope: "project" | "global"): { success: boolean; path: string } {
  const skillsSource = join(memRoot, "skills");

  const skillsTarget = scope === "global"
    ? join(process.env.HOME || "~", ".claude", "skills", "mem")
    : join(process.cwd(), ".claude", "skills", "mem");

  if (!existsSync(skillsSource)) {
    return { success: false, path: skillsTarget };
  }

  try {
    // Create target directory
    mkdirSync(skillsTarget, { recursive: true });

    // Copy skills
    cpSync(skillsSource, skillsTarget, { recursive: true });
    return { success: true, path: skillsTarget };
  } catch {
    return { success: false, path: skillsTarget };
  }
}

program
  .command("migrate")
  .description("Apply database schema to Supabase")
  .option("--dry-run", "Print SQL without executing")
  .action(async (options: { dryRun?: boolean }) => {
    if (options.dryRun) {
      console.log(getMigrationSQL());
      return;
    }

    const migrationSql = getMigrationSQL();
    writeFileSync("mem-migration.sql", migrationSql);
    p.log.success("Saved mem-migration.sql");

    if (hasSupabaseCLI()) {
      const spinner = p.spinner();
      spinner.start("Running migration via Supabase CLI...");

      const success = runSupabaseMigration("mem-migration.sql");

      if (success) {
        spinner.stop("Migration complete!");
        p.note(
          `${pc.cyan("mem add note")} '{"content": "Test memory"}'\n` +
          `${pc.cyan("mem search")} "test"\n` +
          `${pc.cyan("mem context")}`,
          "Try it out"
        );
      } else {
        spinner.stop("Migration failed");
        showManualInstructions();
      }
    } else {
      p.log.warn("Supabase CLI not found");
      showManualInstructions();
    }
  });

// =============================================================================
// Run
// =============================================================================

program.parse();
