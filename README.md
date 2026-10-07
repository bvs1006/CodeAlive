# CodeAlive — See what code does, what changed, and why it matters

CodeAlive is a developer tool for **source-linked code explanations**, **algorithm visualization**, **code-inspired music and video**, and **GitHub PR evidence review**. Use it to learn an unfamiliar function, demonstrate an algorithm, create an educational clip, or inspect existing CI results.

Start with the workflow you need. The explainer describes JavaScript/TypeScript structure locally and offers explicit replay of a limited synchronous subset; the studio turns text patterns into music; the PR companion reads GitHub evidence.

> **Status — 7 October 2026:** **1.0.0 beta candidate** on `codex/release-1.0-beta` unifies explanations, replay, change comparisons, PR evidence and editable narrated videos. PRs #1–#3 are merged and released through 0.8. PR #4 remains open while its updated package publication is pending. The 1.0 candidate is not yet a public release; build it locally for review. Windows/macOS desktop and physical audio-device checks remain manual work.

[Published prereleases](https://github.com/bvs1006/CodeAlive/releases) · [Build the candidate](#developer-quick-start) · [Release checklist](docs/RELEASE_CHECKLIST.md) · [Roadmap](docs/ROADMAP.md) · [Ask a question](https://github.com/bvs1006/CodeAlive/issues/new?template=question.yml)

## What can I do today?

| Workflow | What you get | Availability |
|---|---|---|
| Understand a function | Plain-language/developer explanations, parameters, return expressions, calls/property writes, source-linked steps and a static flow diagram | **1.0 beta candidate:** VS Code and offline browser; JavaScript/TypeScript |
| Replay a function | Explicit JSON inputs, bounded interpreter, variable snapshots, branch choices, step/play controls and pinned input comparison | **1.0 beta candidate:** documented synchronous JS/TS subset |
| Explain a change | Source-linked before/after observations for pasted versions, HEAD versus editor, or a PR file with revision-bound CI evidence | **1.0 beta candidate:** JavaScript/TypeScript |
| Hear code structure | Three music styles, code-linked visuals and synthesized audio from text patterns | **0.5+:** VS Code and browser studio |
| Explore sorting | Built-in Bubble Sort and Quick Sort, pause/step/resume, operation counts and same-input comparison | **0.5+:** VS Code |
| Narrate an explanation | Editable explanation/replay scenes, local narration import, timing controls, source highlights, optional music and video export | **1.0 beta candidate:** browser and VS Code; no automatic speech generation |
| Create a developer video | Vertical video with audio, captions, branding, source hiding and local presets | **0.5+:** VS Code; browser studio has basic recording |
| Inspect a GitHub PR | Changed-file groups, existing head/test-merge checks and available failure annotations | **0.5+:** VS Code; read-only |

**Current boundaries:** static explanation and music never execute selected source. **Replay** runs only after an explicit action, using a restricted interpreter with no host, file, network or module access. Async code, callbacks and surrounding application state are unsupported. The explainer and music studio connect through **Explain code**. Explanation videos use an editable scene timeline and optional imported narration; you align spoken words by adjusting scene durations. The PR companion does not validate semantic correctness, generate fixes or decide whether to merge.

## Try the explainer in two minutes

### VS Code

1. Build the candidate with `npm run package:release` using the developer setup below, then extract `downloads/codealive-explainer-1.0.0.zip`. Published older prereleases are linked above.
2. In desktop VS Code, open **Extensions → … → Install from VSIX…**, then choose `codealive-1.0.0.vsix`.
3. After upgrading, close existing CodeAlive tabs and run **Developer: Reload Window**.
4. Open a JavaScript or TypeScript file, select a complete function, and run **CodeAlive: Explain Selected Code** from the Command Palette. An empty selection loads the active file.
5. Choose the function scope and explanation style. Select a step or diagram node to highlight the code and reveal it in the original editor.

For a demo without your own file, run **CodeAlive: Open Explainer**, load **A simple discount**, and select **Explain this code**. Ten examples cover guards, loops, callbacks, recursion, async code and TypeScript.

For one starting point, run **CodeAlive: Open CodeAlive**. The navigation bar leads to **Explain**, **Replay**, **Compare**, **Review PR** and **Create video**. It keeps your source and entered values when moving between sections. Replay and video navigation prepare a static explanation when needed; execution and recording still require their explicit buttons. The offline browser shows the four local workflows; PR review is available in VS Code.

Requires desktop VS Code **1.90+**, a trusted workspace and input of at most **50,000 characters**. No CodeAlive account or API key is needed. The Command Palette is `Cmd+Shift+P` on macOS and `Ctrl+Shift+P` on Windows/Linux.

### Browser, without installation

Extract the same ZIP and open **`browser/explain.html`**. The parser, examples and styles are bundled and work offline. Source links highlight code in the browser; navigation into your original file is a VS Code feature.

[Full explainer guide](docs/EXPLAIN_CODE.md) · [Replay guide and supported subset](docs/EXECUTION_REPLAY.md)

<details>
<summary>See the actual 0.6 explainer interface</summary>

![CodeAlive explaining discountedPrice with source, inputs, return expressions, linked steps and a branching flow diagram](docs/media/explainer-preview.png)

Captured from the real browser interface in Chromium CI, with the bundled discount example. This is a browser screenshot, not a desktop VS Code screenshot.

</details>

### What an explanation means

```js
function discountedPrice(price, percent) {
  if (price < 0 || percent < 0 || percent > 100) {
    throw new Error("Invalid discount");
  }
  const savings = price * (percent / 100);
  return price - savings;
}
```

CodeAlive identifies two parameters, a conditional branch, an error path, a declaration and a return expression. Selecting a step reveals its exact source range. Static explanation does **not** calculate a price, prove the validation is sufficient, or infer business intent. To calculate an example explicitly, choose **Run with these inputs** under Replay with `[100,20]`: it returns `80`. Step through the captured values, pin that run, then compare `[200,50]`, which returns `100`. The result applies to the supported interpreter model, not your complete application runtime.

The diagram describes statement-level structure. Try/catch/finally, switch and labeled blocks are collapsed with warnings; expression-level branches and async suspension remain inside statement nodes. Steps follow source order and can include unreachable code. Explanations are bounded to 100 listed functions, 80 steps, 100 diagram nodes, and 12 return expressions / 12 calls or property writes. Oversized diagrams are omitted with a message.

## Explain before/after changes

In the explainer, paste two versions under **Explain a change**, or load the change example. Compare parameters, conditions, returns, calls and writes. Each observation links to Before and After source ranges. Formatting/comment-only differences are identified; ambiguous names and renames have explicit limits.

In VS Code, run **CodeAlive: Explain Working Tree Changes** to compare the active file's committed HEAD version with its editor buffer, including unsaved edits. The command reads Git without modifying files or running code. New/renamed paths without a HEAD version need a manual comparison.

For an open, unmerged PR in **Review GitHub PR**, choose **Explain changes** on a JS/TS file. CodeAlive reads exact source blobs at the PR merge base and head, then attaches the report's existing checks and changed test-file links. Moving revisions stop loading and require a refresh. Test-file association is based on filenames, and CI evidence is a timestamped snapshot, not proof of coverage or correctness. Editing either pasted version detaches its evidence and editor links. [Change explanation guide](docs/CHANGE_EXPLANATIONS.md)

## Turn an explanation into a narrated video

1. Explain a function, then open **Explain it in a video**. Choose static explanation steps or run Replay and select its captured steps.
2. Select a range of up to 20 steps, then **Build editable script**. Include/exclude scenes and edit each caption and duration.
3. Add your recorded narration as a local audio file. **Fit scene timing to narration** adjusts durations proportionally; preview and refine boundaries to match your speech. Automatic voice generation is not included.
4. Optionally add quiet background music or hide the source panel. Hiding source does not remove code mentioned in captions or audio.
5. **Preview timeline**, then **Record explanation video**. Keep the view visible. Preview the encoded result before **Save video**.

Exports are vertical 1080 × 1920, up to 120 seconds, with local audio mixing and no automatic upload. The browser chooses supported MP4/WebM encoding. Editing the script clears the previous export; changing source/scope clears its script and narration. [Video guide and limits](docs/EXPLANATION_VIDEO.md)

## Music, sorting and video

Run **CodeAlive: Open Studio**, then **Load editor file** or **CodeAlive: Load Selection**. Confirm the loaded filename, choose Ambient Cloud, Night Drive or 8-bit Arcade, and press **Make it alive**. Soundtracks use shared text-pattern rules across the language choices; Python, Terraform and YAML samples are music inputs, not supported explainer languages.

To explore an actual bundled algorithm, choose **Performance → Live sorting algorithm** or **Bubble vs Quick comparison**. Start with `8, 3, 6, 1, 9, 2, 5, 4`; compare it with sorted and reversed inputs. Each comparison or swap counts as one operation. The result is specific to the input and bundled implementation, not a CPU benchmark.

To make a clip, set captions, title and creator name, choose 15–30 seconds, then **Record video**. Preview it before saving. Output is vertical 1080 × 1920 at 30 fps with audio. Native MP4 availability depends on the browser; WebM-to-MP4 conversion needs local FFmpeg with H.264/AAC support. Uploading remains your choice.

<details>
<summary>Watch the sorting comparison and find sample inputs</summary>

![Silent preview of Bubble Sort and Quick Sort on the same list](docs/media/comparison-preview.gif)

This silent documentation animation uses real bundled sorting traces; it is not a VS Code recording. [Still frame](docs/media/comparison-preview.png) · [Input comparison](docs/media/input-matters.png) · [Sample guide](examples/README.md)

Music samples: [JavaScript](examples/javascript.js), [Python](examples/python.py), [Terraform](examples/terraform.tf), [Kubernetes YAML](examples/kubernetes.yaml).

</details>

## Review GitHub PR evidence

Run **CodeAlive: Review GitHub PR** and paste a URL such as `https://github.com/owner/repo/pull/123` for a real PR. Public PRs can use anonymous reads; private PRs require VS Code GitHub sign-in and repository access.

The panel groups changed files and shows existing checks for the PR head and, when available, the test-merge commit. Missing, pending, inaccessible or truncated evidence is labeled. Filename-based review prompts are heuristic. Required-check coverage and semantic correctness are not verified; green checks alone are not a merge recommendation.

The companion does not check out code, run tests, rerun CI, post comments, modify files or approve a merge. [PR companion details](docs/PR_COMPANION.md)

## Developer quick start

For the unified candidate, build from `codex/release-1.0-beta`. `main` includes the merged 0.6–0.8 features; the candidate also includes PR #4 video functionality. Prerequisites: Git, **Node.js 22+** with npm, and **Python 3**. Use `python` instead of `python3` where that is your platform's Python 3 command.

```sh
git clone --branch codex/release-1.0-beta https://github.com/bvs1006/CodeAlive.git
cd CodeAlive
npm ci --ignore-scripts
npm run build
python3 -m http.server 8080 --directory web
```

Open [the explainer](http://localhost:8080/explain.html) or [the music studio](http://localhost:8080/). The standalone browser studio does not include the extension's sorting/comparison modes, newer video templates or presets. There is no public hosted demo link at present.

| Command, from the repository root | Purpose |
|---|---|
| `npm run build` | Generate matching browser/extension explainer assets and bundle the pinned Babel parser plus its license |
| `npm test` | Build assets, run the parser/editor tests and eight existing suites, and check generated-asset equality |
| `npx playwright install chromium` then `npm run test:browser` | Run real Chromium integration checks and create screenshots in `test-results/` |
| `npm run test:vscode` | Install/upgrade the built VSIX and exercise real VS Code; on headless Linux run under `xvfb-run -a` |
| `npm run package` | Build `codealive-1.0.0.vsix` in the repository root; needs `python3` on PATH |
| `npm run package:release` | Build and validate the VSIX plus offline browser ZIP in `downloads/` |
| `npm run check:package` | Check version consistency, current source payloads, parser license and the embedded VSIX |

On Linux, Playwright may also need system dependencies: use `npx playwright install --with-deps chromium`. On a system without a `python3` command, use `npm run build` followed by `python extension/package.py` to package with Python 3.

To test in desktop VS Code, install the built VSIX. There is no committed F5 launch configuration. Rebuild and reinstall after changing shared or extension code. [Contribution guide](CONTRIBUTING.md)

### Where the code lives

| Path | Responsibility |
|---|---|
| `shared/explain-engine.js` | Local AST analysis, source ranges, explanations and bounded static flow model |
| `shared/movie-engine.js`, `shared/movie-ui.js`, `extension/video-save.js` | Editable scene timing, canvas rendering, narration/music mix, recording and validated Save dialog |
| `shared/compare-engine.js`, `shared/compare-ui.js` | Bounded structural comparison, before/after source links and evidence display |
| `extension/compare-source.js`, `extension/pr-changes.js` | Read-only HEAD/editor capture and exact PR revision blob reads |
| `shared/replay-engine.js`, `shared/replay-ui.js` | Restricted interpreter, immutable trace snapshots, explicit run and playback controls |
| `shared/explain-ui.js`, `shared/explain.html`, `shared/explain.css` | Shared browser/webview interface, source highlights, keyboard interaction and diagram rendering |
| `shared/explain-examples.js` | Ten JavaScript/TypeScript examples |
| `extension/explain-panel.js` | VS Code commands, source snapshots, document-version checks and webview bridge |
| `extension/extension.js`, `extension/media/` | Studio host, music, sorting and video workflows |
| `extension/pr-api.js`, `pr-core.js`, `pr-panel.js` | GitHub reads, evidence interpretation and PR panel |
| `web/` | Standalone browser studio and generated explainer entry point |
| `scripts/`, `tests/`, `extension/test-*.cjs` | Shared build, packaging and verification |
| `.github/workflows/ci.yml` | Linux/Windows/macOS unit checks, Chromium integration and installer artifacts |

Edit `shared/`, then build. Generated `web/explainer/` and `extension/media/explainer/` copies are ignored by git and included in packages. Music studio files still have separate browser and extension versions; changes to shared behavior should be checked on both surfaces.

The explainer's analysis stays in the browser/webview. Source snapshots, bounded evidence summaries and validated source-navigation messages pass between the extension host and the explainer. GitHub authentication and PR requests stay in the extension host.

## Verification and known gaps

The [CI workflow](https://github.com/bvs1006/CodeAlive/actions/workflows/ci.yml) runs unit/extension suites on Linux, Windows and macOS, real Chromium/media checks, and an installed-VSIX check in real VS Code on Linux. Browser checks cover all ten examples, source links, keyboard activation, CSP, inert source text, mobile width and code preservation when changing languages. Desktop and mobile browser screenshots were inspected. The Linux editor smoke test passed on VS Code 1.140.0; the workflow records the version on each run.

Unit-level editor and GitHub API tests use mocks; the additional installed-VSIX suite uses real VS Code. Browser media tests verify playable recordings with audio/video tracks. Explanation-video checks also inspect encoded narration/music signals, dimensions and duration on browser and webview pages. Physical audio-device behavior and actual Windows/macOS editor installations still need manual checks. [Known limitations](docs/KNOWN_LIMITATIONS.md) · [Roadmap](docs/ROADMAP.md)

## Roadmap at a glance

| Task | Status |
|---|---|
| Explain, replay and source-linked change observations | PRs #1–#3 merged; fresh main CI and prereleases passed |
| Editable explanation videos | PR #4 code implemented; updated archive publication and main integration pending |
| One 1.0 beta candidate | Prepared on `codex/release-1.0-beta`; new candidate CI and acceptance are required before release |
| Fresh installation and full workflow acceptance | Repeatable [checklist](docs/RELEASE_CHECKLIST.md); manual rows remain pending until performed |
| Shared workflow navigation | Implemented in the 1.0 candidate: Open CodeAlive, keyboard actions and direct VS Code PR review |
| Metadata, license and distribution | Next consolidation tasks |
| Developer review intelligence | Later: connect observed changes, captured behavior and tests/CI while distinguishing evidence from inference |

[Full roadmap and integration evidence](docs/ROADMAP.md). No Marketplace/Open VSX listing or public 1.0 release is claimed. New languages, telemetry and major new features wait for validation of the current workflow.

## Privacy, support and licensing

Static explanation requires no network access and executes no source. Explicit replay interprets only the documented subset. Both keep inputs and traces in memory and do not upload source. Narration audio stays local; saving a video explicitly writes the rendered captions, selected source visuals and audio you chose to include. Studio presets exclude code. Recordings can display source unless **Hide source** is enabled. Sharing a soundtrack copies a sample/style link, not your pasted source. The hosted music demo remains private, so recipients may not be able to open that link. The PR companion uses GitHub's API and keeps authentication tokens out of the webview.

[Ask a question](https://github.com/bvs1006/CodeAlive/issues/new?template=question.yml) · [Report a bug](https://github.com/bvs1006/CodeAlive/issues/new?template=bug_report.yml) · [Request a feature](https://github.com/bvs1006/CodeAlive/issues/new?template=feature_request.yml) · [Troubleshooting](SUPPORT.md)

For bug reports, include your CodeAlive/VS Code version, OS, workflow, expected result and a small sanitized reproduction. Maintainer: [@bvs1006](https://github.com/bvs1006).

**No open-source license has been selected** (`UNLICENSED`). Source visibility does not grant general reuse or redistribution rights; discuss terms with the maintainer. The bundled Babel parser retains its MIT license. Marketplace and Open VSX listings have not been published.
