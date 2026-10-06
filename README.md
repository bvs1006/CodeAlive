# CodeAlive — Visual Code Explanations & Studio

**Understand JavaScript and TypeScript through source-linked explanations and flow diagrams.**

CodeAlive explains code locally in VS Code and the browser. Start with a function, inspect its inputs and return expressions, and follow each step back to the source. The creative music/video studio and read-only GitHub PR companion remain available.

**Current version: CodeAlive 0.6.0 alpha.** Explanations use a local JavaScript/TypeScript parser. Code soundtrack mode maps text structure to music. Live sorting mode runs built-in Bubble Sort and Quick Sort on a list of numbers. Your editor code is never executed.

[Download the installer](downloads/codealive-explainer-0.6.0.zip?raw=true) · [Installation & usage](docs/GETTING_STARTED.md) · [Ask a question](https://github.com/bvs1006/CodeAlive/issues/new?template=question.yml) · [Report a bug](https://github.com/bvs1006/CodeAlive/issues/new?template=bug_report.yml)

## Explain a function

- Run **CodeAlive: Explain Selected Code** in VS Code, or open `browser/explain.html` from the download ZIP.
- Read a plain-language or developer explanation with exact source links.
- Inspect declared inputs, return expressions, calls and property writes.
- Follow a keyboard-accessible diagram of branches, loops and early exits.
- Choose among function scopes and ten JavaScript/TypeScript examples.
- Work offline without an account, API key or source upload.

These are static structural explanations, not computed results or execution traces. Complex control flow is collapsed and labeled. [Read the explanation guide](docs/EXPLAIN_CODE.md).

## Review a GitHub pull request

After installation, run **CodeAlive: Review GitHub PR** and paste `https://github.com/owner/repo/pull/123` for a real PR.

- Public PRs can use anonymous access; private PRs need VS Code GitHub sign-in.
- See changed files grouped into source, tests, dependencies, documentation and configuration.
- Inspect checks for the PR head and, when available, GitHub’s test-merge commit.
- See the first reported failure, its available summary, and file/line annotations.
- Use evidence links to open the PR or check details on GitHub.
- Review filename-based prompts separately from verified check results.

**This is read-only evidence inspection, not a new validator.** It never checks out or executes PR code, modifies files, posts comments, reruns CI or approves merges. Required-check coverage is not verified; all displayed checks passing is not proof a PR is merge-ready. Missing, skipped, inaccessible, truncated or changing evidence is shown explicitly. It does not generate AI explanations or patches.

[PR companion guide](docs/PR_COMPANION.md)

## See the creative studio in motion

![Silent animated preview of Bubble Sort and Quick Sort on the same list](docs/media/comparison-preview.gif)

[View the final frame as a still image](docs/media/comparison-preview.png).

*Silent preview generated from CodeAlive’s real built-in sorting traces with a documentation renderer. It is not a VS Code screenshot or a recording from the extension. Install the extension to hear the synchronized sounds.*

## Pick your first experience

| You want to… | Choose | What happens |
|---|---|---|
| Understand a function | Command: Explain Selected Code | Read source-linked steps and a static flow diagram. |
| Inspect a GitHub PR | Command: Review GitHub PR | Read change summaries and existing CI evidence without running code. |
| Hear your own code | Code soundtrack | Text structure becomes melody, rhythm and animation; your code is not executed. |
| Learn sorting step by step | Live sorting algorithm | A bundled Bubble Sort or Quick Sort runs on your numbers with comparisons, swaps and pivots. |
| Compare two algorithms | Bubble vs Quick comparison | Both sort the same numbers at equal comparison/swap ticks, with separate counters. |
| Make a developer short | Record video | Save a vertical clip with audio, captions and branding; upload it yourself. |

**Try this first:** install → **CodeAlive: Open Explainer** → **A simple discount** → **Explain this code** → select a step to highlight its source.

## Install in VS Code

1. Download and extract the ZIP above.
2. In VS Code, choose **Extensions → … → Install from VSIX…** and select `codealive-0.6.0.vsix`.
3. When upgrading, close existing studio tabs and run **Developer: Reload Window**.
4. Select a JavaScript or TypeScript function and run **CodeAlive: Explain Selected Code**.
5. Select explanation steps or diagram nodes to reveal their source.
6. For music and recording, run **CodeAlive: Open Studio** and load your editor file.

Requires desktop VS Code 1.90+, a trusted workspace, and code input of at most 50,000 characters. No Marketplace account or CodeAlive account is required for this local alpha.

## Samples you can copy

| Sample input | Bubble operations | Quick operations | What to look for |
|---|---:|---:|---|
| `8, 3, 6, 1, 9, 2, 5, 4` | 41 | 23 | Quick Sort finishes in fewer operation ticks. |
| `1, 2, 3, 4, 5` | 4 | 10 | Bubble Sort’s early exit helps on an already sorted list. |
| `5, 4, 3, 2, 1` | 20 | 12 | Swapping costs change the totals. |

![Comparison and swap counts for mixed, sorted, and reversed inputs](docs/media/input-matters.png)

An operation is one comparison or swap. These counts apply to the bundled implementations: early-exit Bubble Sort and last-element-pivot Quick Sort. They are not CPU timings or a universal ranking.

For code soundtracks, try the [JavaScript](examples/javascript.js), [Python](examples/python.py), [Terraform](examples/terraform.tf) or [Kubernetes YAML](examples/kubernetes.yaml) samples. Paste them into CodeAlive; they are sonification inputs, not deployment or standalone execution instructions. See the [sample guide](examples/README.md) for video hooks and expected behavior.

## Create a video

- Choose **Code Soundtrack**, **Algorithm Performance**, or **Project Showcase**.
- Customize opening, middle and closing captions, plus the title and creator name.
- Enable **Hide source** when you don't want the code visible in the recording.
- Choose 15, 20 or 30 seconds and click **Record video**.
- Preview the clip and choose **Save video** or **Save as MP4**.

Output is vertical 1080 × 1920 at 30 fps with synthesized audio. Native MP4 depends on the embedded browser. WebM-to-MP4 conversion requires FFmpeg installed locally with H.264/AAC support; the original recording remains available if conversion fails. Videos are not uploaded automatically.

## Features

- Three musical styles: Ambient Cloud, Night Drive and 8-bit Arcade.
- Layered melody, chords, bass and percussion with intro, buildup, peak and ending.
- Code-linked animation, musical event nodes and audio-reactive bars.
- Active-file and selection loading, plus optional editor following.
- Timed captions, branding and source hiding.
- Local video presets that exclude your source code.

Soundtracks use shared text-pattern rules across the language choices; they do not use the explainer’s AST parser. Algorithm Performance is inspired by code structure, not actual algorithm execution.

## Live sorting performance

In the studio choose **Performance → Live sorting algorithm**. Select Bubble Sort or Quick Sort and enter 3–18 whole numbers from 1–99.

**Make it alive** runs a preview with highlighted comparisons, swaps and pivots, counters and synchronized tones. Choose a preview speed, then use **Pause**, **Step**, **Resume** and **Reset** to inspect it.

**Record video** fits the complete operation trace into the chosen 15–30 seconds, including opening and sorted-result scenes. Pause/Step are disabled during recording. Use your existing title, creator name and opening/closing captions, then save the recording.

These are actual executions of the two bundled algorithms. They do not run arbitrary selected source code. The older Algorithm Performance video template in code soundtrack mode remains structure-inspired.

## Bubble Sort vs Quick Sort videos

Choose **Performance → Bubble vs Quick comparison**. Enter a list, then play or record. The two panels share the exact same input and advance at the same comparison/swap rate. Each has its own counters; the first to finish holds its sorted result while the other continues. Distinct pitches and stereo positioning distinguish the algorithms when supported.

The result says which used fewer operations **on this input**. This is an operation-count illustration, not a machine-time benchmark. Comparisons and swaps each count as one operation; pivot/partition annotations do not consume extra ticks. Both implementations and their counters are visible in the source. Quick Sort uses a last-element pivot; Bubble Sort exits early when a pass makes no swaps. Try sorted input as well as reversed input to see why input and implementation matter.

Use Pause/Step/Resume for previews. Record fits the whole shared timeline into 15–30 seconds. Titles, creator name and opening/closing captions are included.

## Browser version

The download ZIP includes a ready-to-open `browser/explain.html`. To develop from the repository:

```sh
npm ci --ignore-scripts
npm run build
python3 -m http.server 8080 --directory web
```

Open http://localhost:8080/explain.html for explanations, or http://localhost:8080 for music. The browser studio has music, visuals and recording; the newer video templates and presets are currently in the VS Code extension. The hosted browser demo is currently private and is not advertised as a public launch link.

## Reach out

Use [GitHub Issues](https://github.com/bvs1006/CodeAlive/issues/new/choose) for questions, bugs, feature ideas and collaboration proposals. Maintainer: [@bvs1006](https://github.com/bvs1006). No email address or guaranteed response time is published.

Please share a small, sanitized example rather than proprietary code, credentials or personal information. See [support and troubleshooting](SUPPORT.md).

## Development and validation

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
npm run package
python3 scripts/package-release.py
```

Node.js 22+ and Python 3 are required for development. Packaging creates `codealive-0.6.0.vsix`; the release script adds an offline browser bundle in `downloads/`. Shared explainer assets are generated from `shared/`. See [CONTRIBUTING.md](CONTRIBUTING.md).

GitHub Actions runs the unit/extension suites on Linux, Windows and macOS, plus Chromium integration checks and installer packaging on Linux. Actual desktop VS Code installation, audio/video support and performance still need manual checks on target devices. See [known limitations](docs/KNOWN_LIMITATIONS.md).

## Discoverability

CodeAlive combines **code sonification**, **algorithm visualization**, **sorting algorithm comparison**, **VS Code extension** workflows and **developer video creation**. Useful for creative coding experiments, computer-science demonstrations and educational coding clips.

## Roadmap and licensing

Recommended next milestones: instrumented execution replay, before/after change explanations, and narrated exports. Broader language support, accessible onboarding and reliable cross-platform releases should grow alongside those features. These are planned possibilities, not shipped functionality.

No open-source license has been selected. Source is available for inspection; do not assume unrestricted reuse or redistribution rights. Contact the maintainer before commercial reuse or redistribution. VS Code Marketplace and Open VSX listings have not been published.
