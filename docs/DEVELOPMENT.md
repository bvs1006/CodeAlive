# Developer setup and architecture

The unified 1.0 beta combines explanations, replay, comparisons, PR evidence and
editable narrated videos. Use one commit and its matching package version when
testing; do not mix installed VSIX versions. [Release installers](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.3)
are built by the gated `main` release workflow.

## Run locally

Requires Git, Node.js 22+ with npm, and Python 3.

```sh
git clone https://github.com/bvs1006/CodeAlive.git
cd CodeAlive
npm ci --ignore-scripts
npm run build
python3 -m http.server 8080 --directory web
```

Open [the explainer](http://localhost:8080/explain.html) or
[the music studio](http://localhost:8080/). The browser explainer works offline once
packaged. GitHub PR inspection and the studio's sorting/comparison modes are VS Code
features. There is no public hosted demo at present.

**CodeAlive: Open CodeAlive** provides a common navigation bar and editable
explanation-video scenes with imported narration. See the [release checklist](RELEASE_CHECKLIST.md).

## Build and verify

Run commands from the repository root.

| Command | Purpose |
|---|---|
| `npm run build` | Generate matching browser/extension assets and bundle the pinned Babel parser and license |
| `npm test` | Unit, mocked editor/GitHub API, replay differential and generated-asset checks |
| `npx playwright install --with-deps chromium` then `npm run test:browser` | Chromium interaction/media checks and screenshots; also requires FFmpeg |
| `npm run package` | Build the VSIX for the checked-out extension version |
| `xvfb-run -a npm run test:vscode` | Real installed Linux VS Code check; omit Xvfb on a desktop with a display |
| `python3 scripts/package-release.py` | Build the VSIX and offline browser ZIP for the current branch |
| `npm run check:package` | Verify versions, current payloads, parser license and the exact embedded VSIX |

Install the resulting VSIX through VS Code's Extensions menu. Close older CodeAlive
tabs and reload the window after upgrading. Rebuild and reinstall after source
changes. On systems without `python3`, use Python 3's `python` command directly for
the packaging scripts. No F5 launch configuration is committed.

CI runs unit/extension checks and real installed VSIX acceptance on Linux, Windows
and macOS, plus Chromium/media integration. These seven gates must pass before
publication. Installed acceptance uses fresh and legacy-upgrade profiles; the fresh
profile exercises toolbar entry, replay, recorded narration/music, Save/cancel and
live public PR evidence. Physical audio devices, private signed-in PRs and
screen-reader checks remain manual work. [Known limits](KNOWN_LIMITATIONS.md).

## Accept a published installer on Windows and macOS

The **Published desktop acceptance** reusable workflow runs after the gated `main`
release job. It downloads that version's published VSIX and verifies its SHA-256,
size, identity and tag commit before installation on Windows/macOS hosted desktops.
It tests the downloaded bytes rather than rebuilding the release. To inspect an
older release, choose its **Run workflow** action and `release_tag` (default `v1.0.3`).

The fresh profile exercises the real toolbar, editor transfer, preserved panel/replay
state, source navigation, Git comparison, recording with imported narration/music
and Save/cancel. Each OS uploads screenshots, the saved recording and JSON receipts
for the installer and both installation modes. Receipts distinguish the published
source commit from the test harness commit and record the OS/architecture, VS Code
version and installer hash. Candidate PR checks additionally inspect live public
PR evidence using the locally built VSIX.

The published v1.0.2 failed Save on both hosted desktop platforms because a codec
list's comma was mistaken for the data URL's payload separator. v1.0.3 preserves
the complete base64 recording in the explanation and music-studio exports. The
regression suite covers codec-bearing MP4/WebM and plain MIME types for all Save paths.
Physical audio, screen readers, private sign-in and behavior on developers' own
machines remain manual acceptance. Record actual runs in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## Where the code lives

| Path | Responsibility |
|---|---|
| `shared/explain-engine.js` | Local AST analysis, source ranges and static flow model |
| `shared/replay-engine.js`, `replay-ui.js` | Bounded interpreter, immutable snapshots and input/playback controls |
| `shared/compare-engine.js`, `compare-ui.js` | Structural comparison, source links and evidence display |
| `shared/explain-ui.js`, `explain.html`, `explain.css` | Shared browser/webview interface |
| `extension/explain-panel.js` | Source snapshots, editor navigation and document-version guards |
| `extension/compare-source.js`, `pr-changes.js` | HEAD/editor capture and exact PR revision reads |
| `extension/pr-api.js`, `pr-core.js`, `pr-panel.js` | GitHub reads and evidence interpretation |
| `extension/extension.js`, `extension/media/` | Studio host, music, sorting and video |
| `shared/movie-engine.js`, `movie-ui.js`, `extension/video-save.js` | Editable scenes, narration/music and validated video saving |
| `web/`, `scripts/`, `tests/` | Browser entry points, building, packaging and verification |

Edit `shared/`, then build. Generated `web/explainer/` and
`extension/media/explainer/` copies are ignored by Git and included in packages.
The music studio still has separate browser and extension versions; check each
declared surface when changing shared behavior.

Analysis runs in the browser/webview. Source snapshots and validated navigation
messages pass through the extension host. GitHub authentication and requests remain
in the host; tokens do not enter webview payloads.

[Contributing](../CONTRIBUTING.md) · [Roadmap](ROADMAP.md) ·
[Support](../SUPPORT.md) · [Examples](../examples/README.md)
