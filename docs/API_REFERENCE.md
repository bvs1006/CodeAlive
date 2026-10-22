# CodeAlive API Reference

Complete programmatic reference for CodeAlive's core shared engines and extension host communication protocols.

---

## 1. Engine: `CodeAliveExplain`

Located in `shared/explain-engine.js`. Provides static AST analysis, scope extraction, human-readable execution steps, and control flow graph (CFG) construction.

### `CodeAliveExplain.analyze(source, options)`

Analyzes JavaScript or TypeScript source code statically without executing it.

#### Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `source` | `string` | Yes | — | The source code to analyze (max 50,000 characters). |
| `options.language` | `string` | No | `'JavaScript'` | `'JavaScript'` or `'TypeScript'`. |
| `options.scopeId` | `string` | No | First function or `'module'` | ID of the target scope to analyze in detail. |

#### Return Value (`object`)
- **Success (`ok: true`)**:
  - `scopes` (`Array<{id: string, name: string, line: number, endLine: number, start: number, end: number}>`): Available function scopes and the whole-module scope.
  - `model` (`object`):
    - `name` (`string`): Scope name.
    - `summary` (`object`): Counts of branches, loops, returns, and inputs.
    - `steps` (`Array<{line: number, endLine: number, start: number, end: number, beginner: string, developer: string}>`): Source-linked sequential explanation steps.
    - `graph` (`{nodes: Array, edges: Array}`): Directed control flow graph nodes and edges.
  - `warnings` (`Array<string>`): Non-fatal structural warnings (e.g. collapsed try/switch blocks).
- **Error (`ok: false`)**:
  - `error` (`string`): Human-readable error explanation.
  - `line` (`number`, optional): Line number of syntax or parsing failure.
  - `column` (`number`, optional): Column number of parsing failure.

#### Example
```javascript
const { analyze } = require('./shared/explain-engine.js');

const code = `function calculateTotal(price, taxRate) {
  if (price <= 0) return 0;
  return price + (price * taxRate);
}`;

const result = analyze(code, { language: 'JavaScript' });
if (result.ok) {
  console.log('Scopes detected:', result.scopes.map(s => s.name));
  console.log('Steps count:', result.model.steps.length);
  console.log('First step:', result.model.steps[0].beginner);
}
```

---

## 2. Engine: `CodeAliveReplay`

Located in `shared/replay-engine.js`. Sandboxed, bounded execution simulator providing step-by-step state snapshots.

### `CodeAliveReplay.run(source, argsText, options)`

Executes a synchronous function with JSON arguments in a restricted AST interpreter.

#### Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `source` | `string` | Yes | — | Complete JavaScript/TypeScript function code. |
| `argsText` | `string` | Yes | — | JSON array of arguments (e.g. `"[100, 0.15]"`). |
| `options.language` | `string` | No | `'JavaScript'` | Language mode. |

#### Limits & Constraints
- Maximum 10,000 operations
- Maximum 300 recorded steps
- Maximum call stack depth: 12
- Maximum array length: 400
- Maximum string length: 2,000 characters
- Trace byte limit: 300,000 bytes

#### Return Value (`object`)
- **Success (`ok: true`)**:
  - `steps` (`Array<Step>`):
    - `index` (`number`): Step sequence index.
    - `kind` (`string`): e.g. `'call'`, `'branch'`, `'assign'`, `'return'`.
    - `range` (`{start: number, end: number, line: number, endLine: number}`): Source position.
    - `variables` (`Record<string, any>`): Snapshot of all in-scope variables at this exact tick.
    - `value` (`any`): Current expression value.
    - `detail` (`string`): Operational note.
  - `result` (`any`): Final return value.
- **Error (`ok: false`)**:
  - `error` (`string`): Error message explaining the fault or exceeded limit.
  - `line` (`number`, optional): Line where execution faulted.

#### Example
```javascript
const { run } = require('./shared/replay-engine.js');

const fnCode = `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`;

const trace = run(fnCode, '[4]');
console.log('Result:', trace.result); // 24
console.log('Execution took', trace.steps.length, 'trace steps.');
```

---

## 3. Engine: `CodeAliveCompare`

Located in `shared/compare-engine.js`. AST-level semantic structural comparison.

### `CodeAliveCompare.compare(before, after, options)`

Compares two code revisions at the AST level, abstracting away whitespace, comments, and trivial formatting.

#### Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `before` | `string` | Yes | — | Original source text (<= 50,000 chars). |
| `after` | `string` | Yes | — | Modified source text (<= 50,000 chars). |
| `options.language` | `string` | No | `'JavaScript'` | Target language. |

#### Return Value (`object`)
- **Success (`ok: true`)**:
  - `summary` (`string`): High-level observation verdict.
  - `changes` (`Array<Observation>`):
    - `title` (`string`): e.g. `'calculateTotal · conditions changed'`.
    - `detail` (`string`): Concrete before/after descriptions.
    - `before` (`Range | null`): Source location in original version.
    - `after` (`Range | null`): Source location in updated version.
  - `warnings` (`Array<string>`): Boundary notices.

#### Example
```javascript
const { compare } = require('./shared/compare-engine.js');

const v1 = `function isEligible(age) { return age >= 18; }`;
const v2 = `function isEligible(age, hasConsent) { return age >= 18 || hasConsent; }`;

const diff = compare(v1, v2);
diff.changes.forEach(c => console.log(`[${c.title}] ${c.detail}`));
```

---

## 4. Engine: `CodeAliveMovie`

Located in `shared/movie-engine.js`. Coordinates video timeline planning, Canvas 2D scene rendering, and subtitle generation.

### `CodeAliveMovie.plan(source, scenes, options)`
Validates and calculates chronological start and end timestamps for video scenes.

- **Options**:
  - `title` (`string`): Video header title (max 80 chars).
  - `hideSource` (`boolean`): Hides code editor panel in output frames.
  - `aspectRatio` (`'16:9'` | `'9:16'`): Output aspect ratio.
  - `mode` (`'explanation'` | `'replay'` | `'ai'`): Video narrative mode.
  - `showCaptions` (`boolean`): Renders on-screen closed-caption overlay.

### `CodeAliveMovie.draw(ctx, plan, time)`
Draws a single video frame onto an HTML5 Canvas 2D context at the given elapsed seconds.

### `CodeAliveMovie.toSRT(plan)`
Generates SubRip (`.srt`) subtitle text formatted with millisecond timestamps.

### `CodeAliveMovie.toVTT(plan)`
Generates WebVTT (`.vtt`) subtitle text formatted for modern web video players.

#### Example
```javascript
const movie = require('./shared/movie-engine.js');

const source = `function add(a, b) { return a + b; }`;
const scenes = [
  { enabled: true, duration: 4.0, caption: "Introduction to add", range: { start: 0, end: 20 } },
  { enabled: true, duration: 3.5, caption: "Returns the sum", range: { start: 21, end: 38 } }
];

const plan = movie.plan(source, scenes, { aspectRatio: '16:9', title: 'Add Function' });
const srtOutput = movie.toSRT(plan);
console.log(srtOutput);
```

---

## 5. Engine: `CodeAliveAIScript`

Located in `shared/ai-script.js`. Generates pedagogical script structures from code using heuristic analysis or LLM prompt formatting.

### `CodeAliveAIScript.heuristicScript(source, options)`
Parses code syntax to detect function headers, recursion, conditional guards, and loops to generate a 3–5 scene pedagogical script.

### `CodeAliveAIScript.buildPrompt(code, options)`
Generates an optimized LLM system/user prompt instructing language models to return valid scene JSON.

### `CodeAliveAIScript.parseScript(source, jsonText)`
Validates external JSON, maps line numbers to exact character offsets, and ensures all scene constraints are met.

### `CodeAliveAIScript.linesToRange(source, startLine, endLine)`
Translates 1-based line numbers into 0-based character offsets `{start, end}`.

---

## 6. Engine: `CodeAliveNarrationSynth`

Located in `shared/narration-synth.js` and `extension/narration-synth.js`. Orchestrates neural and native text-to-speech engines.

### `CodeAliveNarrationSynth.synthesizeNarration(scenes, options)`
Synthesizes spoken audio for each scene, measures real duration, adjusts scene timings, and combines audio into a single 48kHz WAV buffer.

#### Parameters
- `scenes` (`Array<{caption: string, duration?: number}>`): The scenes to synthesize.
- `options.voice` (`string`): Target voice identifier.
  - Male Neural: `'en-US-AndrewMultilingualNeural'`, `'en-US-ChristopherNeural'`.
  - Female Neural: `'en-US-AvaMultilingualNeural'`, `'en-US-EmmaMultilingualNeural'`.
  - Fallbacks: macOS `say` system voices, Linux `espeak`.

#### Return Value
```typescript
{
  ok: boolean;
  wavBuffer?: Buffer | Uint8Array;
  base64?: string;
  scenes?: Array<{caption: string, duration: number, range: object}>;
  error?: string;
}
```

---

## 7. Webview <-> Extension Host IPC Protocol

Communication between the VS Code Extension Host (`explain-panel.js`) and the Webview frontend (`explain-ui.js` / `movie-ui.js`) uses bidirectional `postMessage`.

### Messages from Webview to Extension Host

| Message Type | Payload Structure | Purpose |
|---|---|---|
| `ready` | `{ type: 'ready' }` | Webview signals that DOM and scripts are fully initialized. |
| `revealRange` | `{ type: 'revealRange', range: { start, end } }` | Requests the active editor to select and reveal a line range. |
| `requestAIScript` | `{ type: 'requestAIScript', code: string, language: string }` | Requests VS Code LM API to generate script scenes. |
| `synthesizeNarration` | `{ type: 'synthesizeNarration', scenes: Array, voice: string }` | Requests host to synthesize voice audio using local TTS engines. |
| `saveExplanationVideo`| `{ type: 'saveExplanationVideo', base64: string, format: 'mp4'\|'webm' }` | Prompts native Save dialog to persist recorded video file. |
| `saveSubtitles` | `{ type: 'saveSubtitles', content: string, format: 'srt'\|'vtt' }` | Prompts native Save dialog to persist subtitle file. |

### Messages from Extension Host to Webview

| Message Type | Payload Structure | Purpose |
|---|---|---|
| `loadExplanation` | `{ type: 'loadExplanation', code: string, language: string, title?: string }` | Sends active editor selection/file into webview explainer. |
| `aiScriptResult` | `{ type: 'aiScriptResult', ok: boolean, script?: object, error?: string }` | Returns generated pedagogical script scenes. |
| `narrationGenerated`| `{ type: 'narrationGenerated', ok: boolean, base64: string, scenes: Array }` | Delivers synthesized WAV narration audio and updated timings. |
| `saveResult` | `{ type: 'saveResult', ok: boolean, canceled?: boolean, error?: string }` | Confirms file persistence status. |
