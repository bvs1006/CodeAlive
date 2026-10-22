# CodeAlive Architecture & System Design

This document details the architectural design, component model, data flow, IPC protocols, and security boundaries of **CodeAlive**.

---

## 1. System Overview

CodeAlive is a local-first developer intelligence and visual explanation tool for JavaScript and TypeScript. It operates in two environments sharing the same underlying engines:
1. **VS Code Extension**: Deeply integrated into the editor with toolbar actions, active buffer tracking, Git HEAD comparison, GitHub PR inspection, and native file saving.
2. **Offline Browser Explainer**: A standalone HTML/JS bundle that runs entirely offline in any modern browser without network access or external APIs.

```mermaid
flowchart TD
    subgraph DeveloperWorkstation["Developer Workstation"]
        subgraph VSCodeHost["VS Code IDE Host (Node.js)"]
            ExtHost["Extension Host (extension.js)"]
            GitBridge["Git & Buffer Bridge (compare-source.js)"]
            PRBridge["GitHub PR Client (pr-api.js)"]
            SynthHost["Neural Voice Synthesizer (narration-synth.js)"]
            SaveHost["Disk / Media Writer (video-save.js)"]
        end

        subgraph WebviewHost["VS Code Webview / Browser Sandbox"]
            UI["Shared Web Interface (explain-ui.js, movie-ui.js)"]
            Parser["Babel Parser (@babel/parser 7.29.9)"]
            ExplainEngine["Static Flow Engine (explain-engine.js)"]
            ReplayEngine["Bounded Interpreter (replay-engine.js)"]
            CompareEngine["AST Diff Engine (compare-engine.js)"]
            MovieEngine["Canvas & Movie Engine (movie-engine.js)"]
            AIScriptEngine["Pedagogical Script Engine (ai-script.js)"]
        end

        subgraph LocalOS["Operating System / Native Tools"]
            DiskStorage[("Project Source Files")]
            TTS["Neural TTS / Speech (edge-tts / say / espeak)"]
            FFmpeg["FFmpeg CLI (Transcoding / Audio conversion)"]
        end
    end

    ExtHost <-->|"Typed IPC postMessage"| WebviewHost
    GitBridge --> DiskStorage
    ExtHost --> TTS
    ExtHost --> FFmpeg
    ExtHost --> SaveHost
    SaveHost --> DiskStorage
```

---

## 2. Container & Component Architecture

CodeAlive uses a modular architecture where core analysis, simulation, and rendering logic reside in `shared/` as universal JavaScript modules (UMD format) executable in both Node.js (during CI and tests) and browser/webview contexts.

```mermaid
flowchart LR
    subgraph SharedModules["Shared Universal Core (shared/)"]
        direction TB
        EE["explain-engine.js<br/>• AST Traversal<br/>• Scopes & Steps<br/>• Control Flow Graph"]
        RE["replay-engine.js<br/>• Bounded Interpreter<br/>• Immutable Snapshots<br/>• TDZ Enforcement"]
        CE["compare-engine.js<br/>• AST Fingerprinting<br/>• Fact Extraction<br/>• Semantic Deltas"]
        ME["movie-engine.js<br/>• Timeline Planning<br/>• Canvas 2D Rendering<br/>• SRT / VTT Subtitles"]
        AI["ai-script.js<br/>• Heuristic Generator<br/>• Prompt Engineering<br/>• JSON Parsing"]
        NS["narration-synth.js<br/>• PCM / WAV Framing<br/>• Multi-voice Fallback<br/>• TTS Integration"]
    end

    subgraph ExtensionModules["VS Code Extension Host (extension/)"]
        direction TB
        EXT["extension.js<br/>• Commands & Menus"]
        EP["explain-panel.js<br/>• Panel Lifecycle<br/>• LM Chat Routing"]
        CS["compare-source.js<br/>• Working Tree vs HEAD"]
        PR["pr-core.js / pr-api.js<br/>• GitHub PR & Checks"]
        VS["video-save.js<br/>• Security Guards<br/>• Disk Writing"]
    end

    subgraph UIModules["Shared UI & Presentation (shared/ & web/)"]
        EUI["explain-ui.js (Explainer UI & Tabs)"]
        MUI["movie-ui.js (Video Timeline & Controls)"]
        RUI["replay-ui.js (Playback & Snapshots)"]
        CUI["compare-ui.js (Diff & Evidence)"]
    end

    ExtensionModules --> UIModules
    UIModules --> SharedModules
```

---

## 3. Core Engine Pipelines & Sequence Flows

### 3.1 Static Code Analysis & Flow Generation

The static analyzer evaluates code structure without executing it, constructing beginner-friendly explanations and an explicit control flow graph (CFG).

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Panel as Webview (explain-ui.js)
    participant Parser as @babel/parser
    participant Engine as explain-engine.js
    participant Host as Extension Host (explain-panel.js)

    Dev->>Host: Open CodeAlive (Toolbar / Cmd+Shift+P)
    Host->>Host: Snapshot Active Editor Buffer & Selection
    Host->>Panel: postMessage({ type: 'loadExplanation', code, language })
    Panel->>Engine: CodeAliveExplain.analyze(code, { language, scopeId })
    Engine->>Parser: parse(code, { plugins: ['typescript', 'jsx'] })
    Parser-->>Engine: AST
    Engine->>Engine: Traverse Program & Collect Function Scopes
    Engine->>Engine: Build Sequence Steps & Branches
    Engine->>Engine: Construct Control Flow Graph (nodes & edges)
    Engine-->>Panel: { ok: true, model: { summary, steps, graph, scopes } }
    Panel->>Dev: Render Steps, Flowchart & Scope Switcher
    Dev->>Panel: Click Step / CFG Node
    Panel->>Host: postMessage({ type: 'revealRange', range: { start, end } })
    Host->>Dev: Highlight Exact Range in VS Code Editor
```

### 3.2 Bounded Replay Execution & Snapshot Tracing

The replay engine is a sandboxed, deterministic interpreter supporting a safe synchronous subset of JavaScript/TypeScript.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant RUI as Replay UI (replay-ui.js)
    participant RE as Replay Engine (replay-engine.js)

    Dev->>RUI: Input JSON Arguments (e.g. [100, 20]) & Run
    RUI->>RE: CodeAliveReplay.run(source, argsText, options)
    RE->>RE: Parse Arguments & Validate Source Bounds
    loop Statement / Expression Execution (max 10,000 ops)
        RE->>RE: Check TDZ (Temporal Dead Zone) & Scope Chain
        RE->>RE: Evaluate Expression within Resource Budget
        RE->>RE: Capture Immutable Variable Snapshot (level <= 12)
        RE->>RE: Append Trace Step (max 300 steps, <= 300 KB)
    end
    RE-->>RUI: { ok: true, steps, result, stats }
    RUI->>Dev: Display Step Controls, Pinned Run Comparison & Values
```

### 3.3 AI Pedagogical Script & Neural Voice Synthesis

CodeAlive generates multi-scene narrative scripts with voice narration and synchronized captions.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant MUI as Movie UI (movie-ui.js)
    participant AIScript as ai-script.js
    participant Host as Extension Host
    participant VSCodeLM as vscode.lm API
    participant Synth as narration-synth.js
    participant TTS as Native TTS / edge-tts

    Dev->>MUI: Click "Generate AI scenes"
    alt Inside VS Code (Host Available)
        MUI->>Host: postMessage({ type: 'requestAIScript', code, language })
        Host->>VSCodeLM: Request Chat Model completion with structured prompt
        alt LLM Available & Responds
            VSCodeLM-->>Host: JSON Script Payload
        else LLM Fails / No Model Found
            Host->>AIScript: heuristicScript(code, { language })
            AIScript-->>Host: Heuristic Pedagogical Script
        end
        Host-->>MUI: postMessage({ type: 'aiScriptResult', script })
    else Standalone Browser Mode
        MUI->>AIScript: heuristicScript(code, { language })
        AIScript-->>MUI: Heuristic Pedagogical Script
    end

    MUI->>Dev: Display Editable Scenes & Captions
    Dev->>MUI: Select Voice (e.g. Andrew / Emma) & Click "Generate Voice"
    MUI->>Host: postMessage({ type: 'synthesizeNarration', scenes, voice })
    Host->>Synth: synthesizeNarration(scenes, { voice })
    Synth->>TTS: Invoke edge-tts / say / espeak
    TTS-->>Synth: Audio PCM / MP3 -> Converted to 48kHz WAV
    Synth-->>Host: Combined WAV Buffer & Adjusted Scene Timings
    Host-->>MUI: postMessage({ type: 'narrationGenerated', base64, scenes })
    MUI->>MUI: Web Audio Context decodes audio buffer & fits timeline
    MUI->>Dev: Ready for Synchronized Preview or Recording
```

### 3.4 MediaRecorder Composition & Video Export

Video frames and audio streams are composed in real-time in the browser/webview canvas.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant MUI as Movie UI (movie-ui.js)
    participant Movie as movie-engine.js
    participant Canvas as HTML5 Canvas 2D
    participant WebAudio as Web Audio API
    participant MediaRec as MediaRecorder
    participant Host as Extension Host (video-save.js)

    Dev->>MUI: Click "Record explanation video"
    MUI->>Canvas: Initialize 1920x1080 (16:9) or 1080x1920 (9:16)
    MUI->>WebAudio: Create Audio Context, Master Gain & Ducking Node
    MUI->>WebAudio: Attach Narration Buffer + Synthesized Background Music
    MUI->>MediaRec: canvas.captureStream(30fps) + Audio Destination Tracks
    MediaRec->>MediaRec: Start Recording (MP4 / WebM chunks)
    loop Every Frame (requestAnimationFrame)
        MUI->>Movie: CodeAliveMovie.draw(ctx, plan, currentTime)
        Movie->>Canvas: Render Source Code, Highlights, Progress & CC Card
    end
    Dev->>MUI: Timeline Completes / Click Stop
    MediaRec-->>MUI: Recording Blob (Chunks assembled)
    Dev->>MUI: Click "Save video" or "Export subtitles"
    MUI->>Host: postMessage({ type: 'saveExplanationVideo', base64, format })
    Host->>Host: Validate Magic Bytes, Sanitize Path, Check Size Limit (<= 50MB)
    Host->>Host: Prompt Native VS Code Save Dialog
    Host->>Dev: Video file persisted to disk safely
```

---

## 4. Security Architecture & Isolation Guarantees

CodeAlive enforces rigorous defense-in-depth isolation across all environments:

| Boundary | Policy / Guarantee |
|---|---|
| **Content Security Policy (CSP)** | Webviews restrict `default-src 'none'`. Scripts and styles use explicit nonces or hashes. `connect-src` blocks all outbound network requests (except local blob URLs for media). |
| **Untrusted Code Execution** | Explanations and comparisons **never execute source code**. The replay interpreter forbids `eval`, `Function`, `require`, `import`, prototype pollution (`__proto__`, `prototype`, `constructor`), and object coercion. |
| **Resource Budgets** | Bounded bounds everywhere: Source max 50,000 chars; Replay max 10,000 ops, 300 steps, recursion depth 12; Video max 20 scenes, 120 seconds, 50 MB output. |
| **Token & Credential Isolation** | GitHub personal access tokens used for PR companion reviews live exclusively in the VS Code Extension Host (Node.js) and are **never transmitted** into the webview payload. |
| **Safe Disk Writes** | `extension/video-save.js` enforces user-directed destination selection via VS Code's native file picker (`showSaveDialog`). Arbitrary supplied paths from the webview are rejected. Video files require valid MP4 (`ftyp`) or WebM (`1A 45 DF A3`) magic byte headers. |
