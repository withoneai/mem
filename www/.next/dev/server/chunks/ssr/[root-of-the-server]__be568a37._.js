module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/www/src/components/CommandDemo.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CommandDemo",
    ()=>CommandDemo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/www/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/www/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const COMMANDS = [
    {
        name: "init",
        description: "Configure mem with your Supabase",
        demo: [
            {
                type: "cmd",
                text: "$ mem init"
            },
            {
                type: "prompt",
                text: "? Supabase URL: https://abc.supabase.co"
            },
            {
                type: "prompt",
                text: "? Service Key: ****"
            },
            {
                type: "success",
                text: "✓ Connected to Supabase"
            },
            {
                type: "success",
                text: "✓ Schema applied (2 tables, 6 functions)"
            },
            {
                type: "success",
                text: "✓ Ready to remember"
            }
        ]
    },
    {
        name: "add",
        description: "Save a memory",
        demo: [
            {
                type: "cmd",
                text: '$ mem add note \'{"content": "User prefers dark mode"}\''
            },
            {
                type: "success",
                text: "✓ Added note"
            },
            {
                type: "info",
                text: "  id: 7f3a2b1c"
            },
            {
                type: "info",
                text: "  type: note"
            },
            {
                type: "info",
                text: "  weight: 5"
            }
        ]
    },
    {
        name: "search",
        description: "Find memories",
        demo: [
            {
                type: "cmd",
                text: '$ mem search "user preferences"'
            },
            {
                type: "info",
                text: "Found 2 memories:"
            },
            {
                type: "table",
                text: "┌──────────┬──────────────────────────┬───────┐"
            },
            {
                type: "table",
                text: "│ type     │ content                  │ score │"
            },
            {
                type: "table",
                text: "├──────────┼──────────────────────────┼───────┤"
            },
            {
                type: "table",
                text: "│ note     │ User prefers dark mode   │ 0.92  │"
            },
            {
                type: "table",
                text: "│ pref     │ No em-dashes in writing  │ 0.78  │"
            },
            {
                type: "table",
                text: "└──────────┴──────────────────────────┴───────┘"
            }
        ]
    },
    {
        name: "context",
        description: "Get relevant memories",
        demo: [
            {
                type: "cmd",
                text: "$ mem context"
            },
            {
                type: "info",
                text: "Top memories by relevance:"
            },
            {
                type: "table",
                text: "┌──────────┬───────────────────────────┬────────┐"
            },
            {
                type: "table",
                text: "│ type     │ content                   │ weight │"
            },
            {
                type: "table",
                text: "├──────────┼───────────────────────────┼────────┤"
            },
            {
                type: "table",
                text: "│ decision │ Use TypeScript everywhere │ 9/10   │"
            },
            {
                type: "table",
                text: "│ pref     │ No em-dashes in writing   │ 8/10   │"
            },
            {
                type: "table",
                text: "│ note     │ User prefers dark mode    │ 5/10   │"
            },
            {
                type: "table",
                text: "└──────────┴───────────────────────────┴────────┘"
            }
        ]
    },
    {
        name: "link",
        description: "Connect memories",
        demo: [
            {
                type: "cmd",
                text: "$ mem link abc123 related_to def456 --bi"
            },
            {
                type: "success",
                text: "✓ Linked note → decision (bidirectional)"
            },
            {
                type: "info",
                text: "  abc123 ←→ def456"
            }
        ]
    }
];
const AUTO_CYCLE_DELAY = 5000; // 5 seconds
const LINE_DELAY = 80; // ms between lines
const CHAR_DELAY = 15; // ms between characters for command lines
function CommandDemo() {
    const [activeCommand, setActiveCommand] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [displayLines, setDisplayLines] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isTyping, setIsTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [userInteracted, setUserInteracted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const typeCommand = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((commandIndex)=>{
        const command = COMMANDS[commandIndex];
        setDisplayLines([]);
        setIsTyping(true);
        let lineIndex = 0;
        const lines = command.demo;
        const typeLine = (li)=>{
            if (li >= lines.length) {
                setIsTyping(false);
                return;
            }
            const line = lines[li];
            if (line.type === "cmd") {
                // Typewriter effect for command lines
                let charIndex = 0;
                setDisplayLines((prev)=>[
                        ...prev,
                        {
                            line,
                            chars: 0
                        }
                    ]);
                const typeChar = ()=>{
                    charIndex++;
                    setDisplayLines((prev)=>{
                        const newLines = [
                            ...prev
                        ];
                        newLines[newLines.length - 1] = {
                            line,
                            chars: charIndex
                        };
                        return newLines;
                    });
                    if (charIndex < line.text.length) {
                        setTimeout(typeChar, CHAR_DELAY);
                    } else {
                        setTimeout(()=>typeLine(li + 1), LINE_DELAY * 3);
                    }
                };
                setTimeout(typeChar, CHAR_DELAY);
            } else {
                // Instant display for other lines
                setDisplayLines((prev)=>[
                        ...prev,
                        {
                            line,
                            chars: line.text.length
                        }
                    ]);
                setTimeout(()=>typeLine(li + 1), LINE_DELAY);
            }
        };
        typeLine(0);
    }, []);
    // Type the initial command
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        typeCommand(activeCommand);
    }, [
        activeCommand,
        typeCommand
    ]);
    // Auto-cycle through commands if user hasn't interacted
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (userInteracted || isTyping) return;
        const timer = setTimeout(()=>{
            setActiveCommand((prev)=>(prev + 1) % COMMANDS.length);
        }, AUTO_CYCLE_DELAY);
        return ()=>clearTimeout(timer);
    }, [
        userInteracted,
        isTyping,
        activeCommand
    ]);
    const handleCommandClick = (index)=>{
        setUserInteracted(true);
        if (index !== activeCommand) {
            setActiveCommand(index);
        }
    };
    const getLineColor = (type)=>{
        switch(type){
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border border-coral-dim/30 rounded-lg overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2 p-4 border-b border-coral-dim/30 bg-secondary/30",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-coral-dim text-sm mr-2 self-center",
                        children: "Try:"
                    }, void 0, false, {
                        fileName: "[project]/www/src/components/CommandDemo.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    COMMANDS.map((cmd, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>handleCommandClick(i),
                            className: `px-3 py-1 rounded text-sm font-mono transition-colors ${i === activeCommand ? "bg-coral text-black" : "text-coral-dim hover:text-coral hover:bg-coral/10"}`,
                            children: cmd.name
                        }, cmd.name, false, {
                            fileName: "[project]/www/src/components/CommandDemo.tsx",
                            lineNumber: 185,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/www/src/components/CommandDemo.tsx",
                lineNumber: 182,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 font-mono text-sm min-h-[200px] overflow-x-auto",
                children: [
                    displayLines.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `${getLineColor(item.line.type)} whitespace-pre`,
                            children: [
                                item.line.text.slice(0, item.chars),
                                i === displayLines.length - 1 && isTyping && item.line.type === "cmd" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "cursor-blink",
                                    children: "█"
                                }, void 0, false, {
                                    fileName: "[project]/www/src/components/CommandDemo.tsx",
                                    lineNumber: 205,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/www/src/components/CommandDemo.tsx",
                            lineNumber: 202,
                            columnNumber: 11
                        }, this)),
                    !isTyping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-coral mt-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "cursor-blink",
                            children: "█"
                        }, void 0, false, {
                            fileName: "[project]/www/src/components/CommandDemo.tsx",
                            lineNumber: 211,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/www/src/components/CommandDemo.tsx",
                        lineNumber: 210,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/www/src/components/CommandDemo.tsx",
                lineNumber: 200,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/www/src/components/CommandDemo.tsx",
        lineNumber: 180,
        columnNumber: 5
    }, this);
}
}),
"[project]/www/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/www/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/www/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/www/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/www/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__be568a37._.js.map