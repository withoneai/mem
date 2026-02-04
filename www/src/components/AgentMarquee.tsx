"use client";

import Image from "next/image";

const agents = [
  { name: "Claude Code", logo: "/agents/claude-code.svg", url: "https://claude.ai/code" },
  { name: "Cursor", logo: "/agents/cursor.svg", url: "https://cursor.sh" },
  { name: "Windsurf", logo: "/agents/windsurf.svg", url: "https://codeium.com/windsurf" },
  { name: "GitHub Copilot", logo: "/agents/copilot.svg", url: "https://github.com/features/copilot" },
  { name: "Cline", logo: "/agents/cline.svg", url: "https://cline.bot/" },
  { name: "Roo", logo: "/agents/roo.svg", url: "https://roocode.com/" },
  { name: "AMP", logo: "/agents/amp.svg", url: "https://ampcode.com/" },
  { name: "Goose", logo: "/agents/goose.svg", url: "https://block.github.io/goose" },
  { name: "Codex", logo: "/agents/codex.svg", url: "https://openai.com/codex" },
  { name: "Gemini", logo: "/agents/gemini.svg", url: "https://gemini.google.com" },
  { name: "Kilo", logo: "/agents/kilo.svg", url: "https://kilo.ai/" },
  { name: "Trae", logo: "/agents/trae.svg", url: "https://www.trae.ai/" },
  { name: "OpenCode", logo: "/agents/opencode.svg", url: "https://opencode.ai/" },
  { name: "Droid", logo: "/agents/droid.svg", url: "https://factory.ai" },
  { name: "Kiro CLI", logo: "/agents/kiro-cli.svg", url: "https://kiro.dev/cli" },
];

export function AgentMarquee() {
  // Duplicate for seamless infinite scroll
  const duplicatedAgents = [...agents, ...agents];

  return (
    <section className="mb-12">
      <p className="text-center text-coral-dim text-sm mb-6">
        Works with your favorite AI agents
      </p>

      <div className="relative w-full">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling logos */}
        <div className="overflow-hidden">
          <div
            className="flex gap-6 sm:gap-8 animate-marquee"
            style={{ width: "fit-content" }}
          >
            {duplicatedAgents.map((agent, index) => (
              <a
                key={`${agent.name}-${index}`}
                href={agent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-all duration-300"
                title={agent.name}
              >
                <Image
                  src={agent.logo}
                  alt={agent.name}
                  width={100}
                  height={100}
                  className="h-[40px] sm:h-[48px] w-auto object-contain"
                  style={{
                    filter: "brightness(0) invert(63%) sepia(51%) saturate(1238%) hue-rotate(334deg) brightness(101%) contrast(97%)",
                  }}
                  loading="eager"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
