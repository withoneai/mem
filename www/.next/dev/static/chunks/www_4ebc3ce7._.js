(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/www/src/components/CommandDemo.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CommandDemo",
    ()=>CommandDemo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/www/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/www/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
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
    _s();
    const [activeCommand, setActiveCommand] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [displayLines, setDisplayLines] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isTyping, setIsTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [userInteracted, setUserInteracted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const typeCommand = (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CommandDemo.useCallback[typeCommand]": (commandIndex)=>{
            const command = COMMANDS[commandIndex];
            setDisplayLines([]);
            setIsTyping(true);
            let lineIndex = 0;
            const lines = command.demo;
            const typeLine = {
                "CommandDemo.useCallback[typeCommand].typeLine": (li)=>{
                    if (li >= lines.length) {
                        setIsTyping(false);
                        return;
                    }
                    const line = lines[li];
                    if (line.type === "cmd") {
                        // Typewriter effect for command lines
                        let charIndex = 0;
                        setDisplayLines({
                            "CommandDemo.useCallback[typeCommand].typeLine": (prev)=>[
                                    ...prev,
                                    {
                                        line,
                                        chars: 0
                                    }
                                ]
                        }["CommandDemo.useCallback[typeCommand].typeLine"]);
                        const typeChar = {
                            "CommandDemo.useCallback[typeCommand].typeLine.typeChar": ()=>{
                                charIndex++;
                                setDisplayLines({
                                    "CommandDemo.useCallback[typeCommand].typeLine.typeChar": (prev)=>{
                                        const newLines = [
                                            ...prev
                                        ];
                                        newLines[newLines.length - 1] = {
                                            line,
                                            chars: charIndex
                                        };
                                        return newLines;
                                    }
                                }["CommandDemo.useCallback[typeCommand].typeLine.typeChar"]);
                                if (charIndex < line.text.length) {
                                    setTimeout(typeChar, CHAR_DELAY);
                                } else {
                                    setTimeout({
                                        "CommandDemo.useCallback[typeCommand].typeLine.typeChar": ()=>typeLine(li + 1)
                                    }["CommandDemo.useCallback[typeCommand].typeLine.typeChar"], LINE_DELAY * 3);
                                }
                            }
                        }["CommandDemo.useCallback[typeCommand].typeLine.typeChar"];
                        setTimeout(typeChar, CHAR_DELAY);
                    } else {
                        // Instant display for other lines
                        setDisplayLines({
                            "CommandDemo.useCallback[typeCommand].typeLine": (prev)=>[
                                    ...prev,
                                    {
                                        line,
                                        chars: line.text.length
                                    }
                                ]
                        }["CommandDemo.useCallback[typeCommand].typeLine"]);
                        setTimeout({
                            "CommandDemo.useCallback[typeCommand].typeLine": ()=>typeLine(li + 1)
                        }["CommandDemo.useCallback[typeCommand].typeLine"], LINE_DELAY);
                    }
                }
            }["CommandDemo.useCallback[typeCommand].typeLine"];
            typeLine(0);
        }
    }["CommandDemo.useCallback[typeCommand]"], []);
    // Type the initial command
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CommandDemo.useEffect": ()=>{
            typeCommand(activeCommand);
        }
    }["CommandDemo.useEffect"], [
        activeCommand,
        typeCommand
    ]);
    // Auto-cycle through commands if user hasn't interacted
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CommandDemo.useEffect": ()=>{
            if (userInteracted || isTyping) return;
            const timer = setTimeout({
                "CommandDemo.useEffect.timer": ()=>{
                    setActiveCommand({
                        "CommandDemo.useEffect.timer": (prev)=>(prev + 1) % COMMANDS.length
                    }["CommandDemo.useEffect.timer"]);
                }
            }["CommandDemo.useEffect.timer"], AUTO_CYCLE_DELAY);
            return ({
                "CommandDemo.useEffect": ()=>clearTimeout(timer)
            })["CommandDemo.useEffect"];
        }
    }["CommandDemo.useEffect"], [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border border-coral-dim/30 rounded-lg overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2 p-4 border-b border-coral-dim/30 bg-secondary/30",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-coral-dim text-sm mr-2 self-center",
                        children: "Try:"
                    }, void 0, false, {
                        fileName: "[project]/www/src/components/CommandDemo.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    COMMANDS.map((cmd, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 font-mono text-sm min-h-[200px] overflow-x-auto",
                children: [
                    displayLines.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `${getLineColor(item.line.type)} whitespace-pre`,
                            children: [
                                item.line.text.slice(0, item.chars),
                                i === displayLines.length - 1 && isTyping && item.line.type === "cmd" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    !isTyping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-coral mt-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_s(CommandDemo, "ngohqolnj/UmkJBQ695+aTShW5o=");
_c = CommandDemo;
var _c;
__turbopack_context__.k.register(_c, "CommandDemo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/www/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/www/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/www/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/www/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$www$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/www/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/www/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=www_4ebc3ce7._.js.map