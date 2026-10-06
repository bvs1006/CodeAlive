# CodeAlive 0.6.0

Local JavaScript and TypeScript explanations with source-linked steps and flow diagrams, plus a code music/video studio and read-only GitHub PR companion.

## Install and explain

Install `codealive-0.6.0.vsix` with **Extensions → … → Install from VSIX…**. After upgrading, close CodeAlive tabs and run **Developer: Reload Window**. Requires desktop VS Code 1.90+ and a trusted workspace.

Select a complete JavaScript/TypeScript function and run **CodeAlive: Explain Selected Code**. With no selection, the active file is loaded. Choose a function scope, switch between Plain language and Developer, and select a step or diagram node to reveal its source. **Load editor** refreshes changed files. **CodeAlive: Open Explainer** opens ten examples.

Code is parsed locally and never executed or uploaded by the explainer. No account or API key is required. Explanations describe syntax and return expressions, not computed values, business intent, correctness or complete runtime flow. Try, switch and labeled blocks are collapsed with warnings. Limits: 50,000 characters, 100 listed functions, 80 steps, 100 graph nodes and 12 return/call facts. Editor links stop working after source changes until refreshed.

## Music and video

Run **CodeAlive: Open Studio**, then Load editor file or **CodeAlive: Load Selection**. Choose Ambient Cloud, Night Drive or 8-bit Arcade and press **Make it alive**. Language changes preserve code. **Explain code** opens the current studio source in the explainer.

Code soundtrack uses shared text patterns. Live sorting and Bubble vs Quick comparison run only bundled algorithms on your list. Preview with Pause/Step/Resume; record a 15–30 second vertical video with audio, captions and branding. Video presets exclude source. Hide source conceals it in visuals. Save video uses browser formats; Save as MP4 needs local FFmpeg with H.264/AAC if conversion is required. No automatic uploads.

## PR companion

Run **CodeAlive: Review GitHub PR** and paste a GitHub PR URL. Public reads can be anonymous; private reads require VS Code GitHub sign-in. Inspect changed-file groups and existing head/test-merge check evidence. Filename prompts are heuristic; this does not execute PR code, verify required checks, prove correctness or approve merges.

## Development

From the repository root: `npm ci --ignore-scripts`, `npm test`, `npm run package`. Shared explainer sources are built from `shared/`. For actual browser checks use `npx playwright install chromium` then `npm run test:browser`. The generated browser parser includes its MIT license. The project has no open-source license selected.
