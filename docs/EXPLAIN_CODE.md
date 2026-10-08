# Explain selected code

CodeAlive 0.6 adds local, source-linked explanations for JavaScript and TypeScript. No account, API key or AI service is needed. The explainer parses your source and describes its structure without executing it.

## Start in VS Code

1. Install `codealive-1.0.1.vsix` from the locally built beta ZIP (`npm run package:release`). Close older CodeAlive tabs and run **Developer: Reload Window** after upgrading.
2. Open a JavaScript or TypeScript file. Select a complete function, or leave the selection empty to use the active file.
3. Run **CodeAlive: Explain Selected Code**, or use the editor's context menu.
4. Choose a function in **Function / scope**. Nested callbacks have their own scopes.
5. Switch between **Plain language** and **Developer** explanations.
6. Select a step or flow node to highlight the exact source and reveal it in the original editor. Keyboard users can focus diagram nodes and press Enter or Space.

**CodeAlive: Open Explainer** opens the playground with ten examples. **Load editor** refreshes the selection or active file. If the editor document changes, source navigation is suspended until you load it again; stale offsets are never applied to changed code. Editing the playground detaches it from the editor.

From the music studio, **Explain code** transfers the current source to the explainer. Unsupported languages show a clear message. Changing language preserves your code; loading an example is an explicit action.

## Start in a browser

Extract the download ZIP and open `browser/explain.html`. The parser, examples and styles are bundled, so the explainer works offline without npm. The browser version highlights its own source view; editor navigation is available in VS Code.

For development, use Node.js 22+ and Python 3:

```sh
npm ci --ignore-scripts
npm run build
python3 -m http.server 8080 --directory web
```

Open `http://localhost:8080/explain.html`. The original music studio is at `/`.

## What the explanation means

- Summary: declared parameters, conditional constructs and loops in the chosen scope.
- Outputs: explicit return expressions, not computed values. Async functions return promises and generator functions return iterators.
- Possible effects: visible calls, construction and object/property writes. Their actual effects depend on implementations, getters, proxies and surrounding code.
- Steps: a source-order reading guide, not an execution trace. Steps can include unreachable source.
- Diagram: statement-level branches, loops and early exits. Unreachable statements after direct return/throw are omitted from the diagram. Nested functions are definitions, not executed bodies.

The explainer does not infer business intent, resolve imports or variable bindings, type-check TypeScript, calculate outputs or establish correctness/purity. Expression-level control flow, short-circuiting, async suspension and yields are kept inside statement nodes. Try/catch/finally, switch and labeled blocks are collapsed with a visible limitation notice. Their exceptional paths, fallthrough and internal jumps are not expanded.

Inputs are limited to 50,000 characters, 100 listed functions, 80 explanation steps and 100 diagram nodes. Up to 12 return expressions and 12 calls/property writes are listed. Over-limit diagrams are omitted with an explanation; choose a smaller scope. Syntax errors are reported without replacing your source.

## Privacy and implementation

Source is held in memory. Static explanation has no network requests, analytics, source persistence or code execution. The separate [Replay an input](EXECUTION_REPLAY.md) action explicitly interprets a documented synchronous subset and keeps its trace in memory. The extension webview uses a nonce-based script policy and blocks network connections. Editor navigation validates a captured document version, an opaque snapshot token and source offsets.

`shared/` is the canonical implementation for both surfaces. `npm run build` creates matching browser and extension assets, including the pinned Babel parser and its MIT license. Generated copies are ignored by git and included in installers. The rest of CodeAlive remains subject to the repository's current UNLICENSED status.

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run package
python3 scripts/package-release.py
```

The browser suite exercises rendered pages, keyboard navigation, source offsets, CSP, inert source text, all ten examples and mobile width. Extension-host integration is covered by mocks; actual VS Code installation and audio/video checks remain manual release checks.
