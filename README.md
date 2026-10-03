# CodeAlive

**Turn code into music, motion, and shareable developer videos.**

CodeAlive is a creative coding studio for making short performances from your code. Paste a sample in the browser or load a file/selection in VS Code, choose a sound, and record a vertical video with audio.

**Current version: VS Code Video Studio 0.3.0 alpha.** Code soundtrack mode maps text structure to music. Live sorting mode runs built-in Bubble Sort and Quick Sort on a list of numbers. Your editor code is never executed.

[Download the installer](https://github.com/bvs1006/CodeAlive/raw/refs/heads/main/downloads/codealive-sorting-studio-0.3.0.zip) · [Installation & usage](docs/GETTING_STARTED.md) · [Ask a question](https://github.com/bvs1006/CodeAlive/issues/new?template=question.yml) · [Report a bug](https://github.com/bvs1006/CodeAlive/issues/new?template=bug_report.yml)

## Install in VS Code

1. Download and extract the ZIP above.
2. In VS Code, choose **Extensions → … → Install from VSIX…** and select `codealive-0.3.0.vsix`.
3. When upgrading, close existing studio tabs and run **Developer: Reload Window**.
4. Open a code file and run **CodeAlive: Open Studio** from the Command Palette.
5. Click **Load editor file**, or select a smaller section and run **CodeAlive: Load Selection**. Confirm **Loaded: your filename** appears.
6. Choose a style and click **Make it alive**.

Requires desktop VS Code 1.90+, a trusted workspace, and code input of at most 50,000 characters. No Marketplace account or CodeAlive account is required for this local alpha.

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

Python and Terraform/HCL receive their own mapping; YAML uses Kubernetes mapping. JavaScript/TypeScript and other languages use the JavaScript text mapping. Algorithm Performance is inspired by code structure, not actual algorithm execution.

## Live sorting performance

In the studio choose **Performance → Live sorting algorithm**. Select Bubble Sort or Quick Sort and enter 3–18 whole numbers from 1–99.

**Make it alive** runs a preview with highlighted comparisons, swaps and pivots, counters and synchronized tones. Choose a preview speed, then use **Pause**, **Step**, **Resume** and **Reset** to inspect it.

**Record video** fits the complete operation trace into the chosen 15–30 seconds, including opening and sorted-result scenes. Pause/Step are disabled during recording. Use your existing title, creator name and opening/closing captions, then save the recording.

These are actual executions of the two bundled algorithms. They do not run arbitrary selected source code. The older Algorithm Performance video template in code soundtrack mode remains structure-inspired.

## Browser version

The `web/` folder contains the earlier standalone browser alpha. To test locally:

```sh
python3 -m http.server 8080 --directory web
```

Open http://localhost:8080. The browser alpha has music, visuals and recording; the newer video templates and presets are currently in the VS Code extension. The hosted browser demo is currently private and is not advertised as a public launch link.

## Reach out

Use [GitHub Issues](https://github.com/bvs1006/CodeAlive/issues/new/choose) for questions, bugs, feature ideas and collaboration proposals. Maintainer: [@bvs1006](https://github.com/bvs1006). No email address or guaranteed response time is published.

Please share a small, sanitized example rather than proprietary code, credentials or personal information. See [support and troubleshooting](SUPPORT.md).

## Development and validation

```sh
cd extension
node test-extension.cjs
node test-app.cjs
node test-sorting.cjs
node test-sorting-app.cjs
python3 package.py
```

Node.js and Python 3 are required for local development; no npm installation is needed. Packaging creates `codealive-0.3.0.vsix` in the repository root. See [CONTRIBUTING.md](CONTRIBUTING.md).

Mocked editor/browser tests and a real sample WebM-to-MP4 conversion passed. These do not replace audio/video testing in real VS Code on Windows, macOS and Linux. See [known limitations](docs/KNOWN_LIMITATIONS.md).

## Roadmap and licensing

Next areas: better language parsing, additional instrumented algorithms, test/build integrations and batch video creation. These are planned possibilities, not shipped functionality.

No open-source license has been selected. Source is available for inspection; do not assume unrestricted reuse or redistribution rights. Contact the maintainer before commercial reuse or redistribution. VS Code Marketplace and Open VSX listings have not been published.
