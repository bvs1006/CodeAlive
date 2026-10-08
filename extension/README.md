# CodeAlive 1.0.1 beta

See what code does, what changed, and why it matters. This beta unifies local JS/TS explanations, bounded replay, before/after observations, PR evidence and editable explanation videos. Music and sorting remain available.

The gated release workflow builds [1.0.1 beta installers](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.1) from verified source. This update adds reduced-motion music decorations and scene announcements without continuous clock announcements. Marketplace/Open VSX listings and manual desktop/audio/accessibility checks remain pending.

## Install and explain

Install `codealive-1.0.1.vsix` with **Extensions → … → Install from VSIX…**. After upgrading, close CodeAlive tabs and run **Developer: Reload Window**. Requires desktop VS Code 1.90+ and a trusted workspace.

In development builds after the published 1.0.1 beta, click **Open CodeAlive** (the `</>` button in a JS/TS editor's toolbar), or run **CodeAlive: Open CodeAlive**. It explains your selection, or the whole file when nothing is selected. Reopening from the CodeAlive panel preserves your work. With no supported source, it opens examples or keeps the current panel. The published 1.0.1 installers use the command below.

Select a complete JavaScript/TypeScript function and run **CodeAlive: Explain Selected Code**. With no selection, the active file is loaded. Choose a function scope, switch between Plain language and Developer, and select a step or diagram node to reveal its source. **Load editor** refreshes changed files. **CodeAlive: Open Explainer** opens ten examples.

Static explanation parses code locally without executing or uploading it. No account or API key is required. Explanations describe syntax and return expressions, not computed values, business intent, correctness or complete runtime flow. Try, switch and labeled blocks are collapsed with warnings. Limits: 50,000 characters, 100 listed functions, 80 steps, 100 graph nodes and 12 return/call facts. Editor links stop working after source changes until refreshed.

## Replay a supported function

After explaining, enter a JSON argument array under **Replay an input**, then choose **Run with these inputs**. Inspect variables, branch choices and return/error results with Previous/Next or Play/Pause. Pin one run and change inputs to compare results. Source edits clear both runs.

Replay explicitly interprets a limited synchronous JS/TS subset, without eval, host APIs, network, files or modules. Async code, callbacks, closures, classes and many other constructs are unsupported. Limits stop large runs; this is not your application runtime. Static explanation remains independent. See `docs/EXECUTION_REPLAY.md` in the repository.

## Explain changes

Use **CodeAlive: Explain Working Tree Changes** for committed HEAD versus the active editor buffer. Or paste Before/After in the explainer. Source-linked observations describe changed parameters, conditions, returns, calls and writes without running code.

The PR companion's **Explain changes** button loads a JS/TS file at the exact merge-base/head revisions and attaches existing checks and changed test-file links. Source edits detach evidence; moving PR revisions require refresh. No correctness or coverage verdict is produced.

## Narrated explanation videos

After explaining a function, use **Explain it in a video**. Select explanation or captured replay steps, build a script, edit captions/timing, and import a local narration recording. Fit timing proportionally, preview and adjust boundaries to match the spoken words. Add optional quiet music, then record and save a vertical 1080 × 1920 video. Keep the view visible during recording.

Up to 20 scenes, 120 seconds and a 50 MB output. Narration stays local; automatic speech generation is not included. Source hiding conceals the code panel only: review captions/audio separately. Encoding depends on the embedded browser. No automatic uploads.

## Music and video

Run **CodeAlive: Open Studio**, then Load editor file or **CodeAlive: Load Selection**. Choose Ambient Cloud, Night Drive or 8-bit Arcade and press **Make it alive**. Language changes preserve code. **Explain code** opens the current studio source in the explainer.

Code soundtrack uses shared text patterns. Live sorting and Bubble vs Quick comparison run only bundled algorithms on your list. Preview with Pause/Step/Resume; record a 15–30 second vertical video with audio, captions and branding. Video presets exclude source. Hide source conceals it in visuals. Save video uses browser formats; Save as MP4 needs local FFmpeg with H.264/AAC if conversion is required. No automatic uploads.

## PR companion

Run **CodeAlive: Review GitHub PR** and paste a GitHub PR URL. Public reads can be anonymous; private reads require VS Code GitHub sign-in. Inspect changed-file groups and existing head/test-merge check evidence. Filename prompts are heuristic; this does not execute PR code, verify required checks, prove correctness or approve merges.

## Development

From the repository root: `npm ci --ignore-scripts`, `npm test`, `npm run package`. Shared explainer sources are built from `shared/`. For actual browser checks use `npx playwright install chromium` then `npm run test:browser`. The generated browser parser includes its MIT license. The project has no open-source license selected.
