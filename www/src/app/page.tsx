import { CommandDemo } from "@/components/CommandDemo";
import { AgentMarquee } from "@/components/AgentMarquee";

const ASCII_LOGO = `███╗   ███╗███████╗███╗   ███╗
████╗ ████║██╔════╝████╗ ████║
██╔████╔██║█████╗  ██╔████╔██║
██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║
██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║
╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝`;

const CODE_EXAMPLE = `import { add, search } from '@withone/mem'

// Your agent remembers
await add('preference', {
  content: 'User prefers dark mode'
})

// And recalls intelligently
const results = await search('user preferences')
// => [{ type: 'preference', data: {...}, score: 0.92 }]`;

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Terminal Window */}
        <div className="border border-coral-dim/30 rounded-lg overflow-hidden mb-12">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-coral-dim/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-coral-dim text-sm ml-2">moe@dev ~ mem</span>
          </div>

          {/* Terminal content */}
          <div className="p-6 md:p-8">
            {/* ASCII Logo */}
            <pre className="text-coral text-xs md:text-sm leading-tight mb-6 overflow-x-auto">
              {ASCII_LOGO}
            </pre>

            {/* Problem statement */}
            <p className="text-coral-dim mb-4">
              AI agents forget everything between sessions.
            </p>

            {/* Tagline */}
            <div className="mb-6">
              <p className="text-coral text-lg md:text-xl mb-1">
                Give them memory.
              </p>
              <p className="text-coral-dim">
                Simple. Fast. Works anywhere.
              </p>
            </div>

            {/* Install command */}
            <div className="bg-secondary/50 rounded px-4 py-3 font-mono text-sm">
              <span className="text-coral-dim">$</span>{" "}
              <span className="text-coral">npm install @withone/mem</span>
            </div>
          </div>
        </div>

        {/* Agent marquee */}
        <AgentMarquee />

        {/* Code Example */}
        <section className="mb-12">
          <h2 className="text-coral text-lg mb-4">Quick start</h2>
          <div className="border border-coral-dim/30 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-coral-dim/30">
              <span className="text-coral-dim text-xs">example.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-coral-dim">
                {CODE_EXAMPLE.split('\n').map((line, i) => {
                  // Syntax highlighting
                  let highlighted = line
                    // Comments
                    .replace(/(\/\/.*)$/g, '<span class="text-coral-dim/60">$1</span>')
                    // Strings
                    .replace(/('[^']*')/g, '<span class="text-green-500">$1</span>')
                    // Keywords
                    .replace(/\b(import|from|await|const)\b/g, '<span class="text-coral">$1</span>')
                    // Functions/methods
                    .replace(/\.(add|search)\b/g, '.<span class="text-coral">$1</span>');

                  return (
                    <div key={i} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
                  );
                })}
              </code>
            </pre>
          </div>
        </section>

        {/* Command Demo */}
        <section className="mb-12">
          <h2 className="text-coral text-lg mb-4">See it in action</h2>
          <CommandDemo />
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-coral text-lg mb-6">Features</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              title="Hybrid Search"
              description="Semantic + keyword search with RRF ranking. Find what you mean, not just what you type."
            />
            <FeatureCard
              title="Relevance Scoring"
              description="Important memories surface automatically. Weight, access frequency, and recency combine to rank results."
            />
            <FeatureCard
              title="Graph Relationships"
              description="Link memories together. Build knowledge graphs that capture how ideas connect."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-coral text-lg mb-4">How it works</h2>
          <div className="border border-coral-dim/30 rounded-lg p-6 space-y-4 text-sm">
            <div className="flex gap-4">
              <span className="text-coral-dim font-mono">1.</span>
              <div>
                <span className="text-coral">Connect to Supabase</span>
                <p className="text-coral-dim mt-1">
                  mem uses Supabase for storage with pgvector for embeddings. Run <code className="bg-secondary px-1.5 py-0.5 rounded text-coral">mem init</code> to set up.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-coral-dim font-mono">2.</span>
              <div>
                <span className="text-coral">Store memories</span>
                <p className="text-coral-dim mt-1">
                  Add notes, decisions, preferences, or any structured data. Embeddings are generated automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-coral-dim font-mono">3.</span>
              <div>
                <span className="text-coral">Retrieve with context</span>
                <p className="text-coral-dim mt-1">
                  Search finds relevant memories using hybrid semantic + keyword search. Results are ranked by relevance score.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-coral-dim/30 pt-8 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/withoneai/mem"
              className="text-coral-dim hover:text-coral transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://npmjs.com/package/@withone/mem"
              className="text-coral-dim hover:text-coral transition-colors"
            >
              npm
            </a>
          </div>
          <div className="text-coral-dim">
            Built for{" "}
            <a
              href="https://docs.anthropic.com/en/docs/claude-code"
              className="text-coral hover:underline"
            >
              Claude Code
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-coral-dim/30 rounded-lg p-4">
      <h3 className="text-coral font-medium mb-2">{title}</h3>
      <p className="text-coral-dim text-sm">{description}</p>
    </div>
  );
}
