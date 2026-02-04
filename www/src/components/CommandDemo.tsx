"use client";

import { useState, useEffect, useCallback } from "react";

interface DemoLine {
  type: "cmd" | "prompt" | "success" | "info" | "table" | "dim";
  text: string;
}

interface Command {
  name: string;
  description: string;
  demo: DemoLine[];
}

const COMMANDS: Command[] = [
  {
    name: "init",
    description: "Configure mem with your Supabase",
    demo: [
      { type: "cmd", text: "$ mem init" },
      { type: "prompt", text: "? Supabase URL: https://abc.supabase.co" },
      { type: "prompt", text: "? Service Key: ****" },
      { type: "success", text: "✓ Connected to Supabase" },
      { type: "success", text: "✓ Schema applied (2 tables, 6 functions)" },
      { type: "success", text: "✓ Ready to remember" },
    ],
  },
  {
    name: "add",
    description: "Save a memory",
    demo: [
      { type: "cmd", text: '$ mem add note \'{"content": "User prefers dark mode"}\'' },
      { type: "success", text: "✓ Added note" },
      { type: "info", text: "  id: 7f3a2b1c" },
      { type: "info", text: "  type: note" },
      { type: "info", text: "  weight: 5" },
    ],
  },
  {
    name: "search",
    description: "Find memories",
    demo: [
      { type: "cmd", text: '$ mem search "user preferences"' },
      { type: "info", text: "Found 2 memories:" },
      { type: "table", text: "┌──────────┬──────────────────────────┬───────┐" },
      { type: "table", text: "│ type     │ content                  │ score │" },
      { type: "table", text: "├──────────┼──────────────────────────┼───────┤" },
      { type: "table", text: "│ note     │ User prefers dark mode   │ 0.92  │" },
      { type: "table", text: "│ pref     │ No em-dashes in writing  │ 0.78  │" },
      { type: "table", text: "└──────────┴──────────────────────────┴───────┘" },
    ],
  },
  {
    name: "context",
    description: "Get relevant memories",
    demo: [
      { type: "cmd", text: "$ mem context" },
      { type: "info", text: "Top memories by relevance:" },
      { type: "table", text: "┌──────────┬───────────────────────────┬────────┐" },
      { type: "table", text: "│ type     │ content                   │ weight │" },
      { type: "table", text: "├──────────┼───────────────────────────┼────────┤" },
      { type: "table", text: "│ decision │ Use TypeScript everywhere │ 9/10   │" },
      { type: "table", text: "│ pref     │ No em-dashes in writing   │ 8/10   │" },
      { type: "table", text: "│ note     │ User prefers dark mode    │ 5/10   │" },
      { type: "table", text: "└──────────┴───────────────────────────┴────────┘" },
    ],
  },
  {
    name: "link",
    description: "Connect memories",
    demo: [
      { type: "cmd", text: "$ mem link abc123 related_to def456 --bi" },
      { type: "success", text: "✓ Linked note → decision (bidirectional)" },
      { type: "info", text: "  abc123 ←→ def456" },
    ],
  },
];

const AUTO_CYCLE_DELAY = 5000; // 5 seconds
const LINE_DELAY = 80; // ms between lines
const CHAR_DELAY = 15; // ms between characters for command lines

export function CommandDemo() {
  const [activeCommand, setActiveCommand] = useState(0);
  const [displayLines, setDisplayLines] = useState<{ line: DemoLine; chars: number }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const typeCommand = useCallback((commandIndex: number) => {
    const command = COMMANDS[commandIndex];
    setDisplayLines([]);
    setIsTyping(true);

    let lineIndex = 0;
    const lines = command.demo;

    const typeLine = (li: number) => {
      if (li >= lines.length) {
        setIsTyping(false);
        return;
      }

      const line = lines[li];

      if (line.type === "cmd") {
        // Typewriter effect for command lines
        let charIndex = 0;
        setDisplayLines((prev) => [...prev, { line, chars: 0 }]);

        const typeChar = () => {
          charIndex++;
          setDisplayLines((prev) => {
            const newLines = [...prev];
            newLines[newLines.length - 1] = { line, chars: charIndex };
            return newLines;
          });

          if (charIndex < line.text.length) {
            setTimeout(typeChar, CHAR_DELAY);
          } else {
            setTimeout(() => typeLine(li + 1), LINE_DELAY * 3);
          }
        };

        setTimeout(typeChar, CHAR_DELAY);
      } else {
        // Instant display for other lines
        setDisplayLines((prev) => [...prev, { line, chars: line.text.length }]);
        setTimeout(() => typeLine(li + 1), LINE_DELAY);
      }
    };

    typeLine(0);
  }, []);

  // Type the initial command
  useEffect(() => {
    typeCommand(activeCommand);
  }, [activeCommand, typeCommand]);

  // Auto-cycle through commands if user hasn't interacted
  useEffect(() => {
    if (userInteracted || isTyping) return;

    const timer = setTimeout(() => {
      setActiveCommand((prev) => (prev + 1) % COMMANDS.length);
    }, AUTO_CYCLE_DELAY);

    return () => clearTimeout(timer);
  }, [userInteracted, isTyping, activeCommand]);

  const handleCommandClick = (index: number) => {
    setUserInteracted(true);
    if (index !== activeCommand) {
      setActiveCommand(index);
    }
  };

  const getLineColor = (type: DemoLine["type"]) => {
    switch (type) {
      case "cmd":
        return "text-coral";
      case "success":
        return "text-green-500";
      case "prompt":
        return "text-coral-dim";
      case "info":
        return "text-coral-dim";
      case "table":
        return "text-coral-dim";
      case "dim":
        return "text-coral-dim/60";
      default:
        return "text-coral";
    }
  };

  return (
    <div className="border border-coral-dim/30 rounded-lg overflow-hidden">
      {/* Command selector */}
      <div className="flex flex-wrap gap-2 p-4 border-b border-coral-dim/30 bg-secondary/30">
        <span className="text-coral-dim text-sm mr-2 self-center">Try:</span>
        {COMMANDS.map((cmd, i) => (
          <button
            key={cmd.name}
            onClick={() => handleCommandClick(i)}
            className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
              i === activeCommand
                ? "bg-coral text-black"
                : "text-coral-dim hover:text-coral hover:bg-coral/10"
            }`}
          >
            {cmd.name}
          </button>
        ))}
      </div>

      {/* Demo output */}
      <div className="p-4 font-mono text-sm min-h-[200px] overflow-x-auto">
        {displayLines.map((item, i) => (
          <div key={i} className={`${getLineColor(item.line.type)} whitespace-pre`}>
            {item.line.text.slice(0, item.chars)}
            {i === displayLines.length - 1 && isTyping && item.line.type === "cmd" && (
              <span className="cursor-blink">█</span>
            )}
          </div>
        ))}
        {!isTyping && (
          <div className="text-coral mt-2">
            <span className="cursor-blink">█</span>
          </div>
        )}
      </div>
    </div>
  );
}
