# CodeAlive 1.0.2 beta release checklist

Run this checklist against one commit and its exact packaged VSIX. Record the commit SHA,
OS, VS Code version, browser version, and results. A passing automated suite does not
mark the manual rows complete. Automated gates apply to the beta prerelease; the
manual rows track remaining desktop, physical-device and accessibility coverage.

## Published 1.0.2 beta evidence

| Evidence | Recorded result |
|---|---|
| Release | [v1.0.2 beta prerelease](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.2), published 9 October 2026 |
| Exact source | Tag points to [55953aa](https://github.com/bvs1006/CodeAlive/commit/55953aac576d5b2a87a1d8b38645d88c277c4d63), the merged [PR #12](https://github.com/bvs1006/CodeAlive/pull/12) release candidate containing PR #11's IDE entry improvements |
| Automated gates | [Release CI](https://github.com/bvs1006/CodeAlive/actions/runs/37877906619): Linux, Windows and macOS unit suites, Chromium/media integration, installed Linux VS Code acceptance and the release job all passed on that commit |
| Installed acceptance | Linux / VS Code 1.141.0: fresh and legacy-upgrade installations of 1.0.2 passed. The real toolbar loaded selection/file and stayed hidden for Markdown; panel edits, replay state and editor groups were preserved. Source links, stale guards, input comparison, encoded narration/music and Save/cancel passed. |
| Browser acceptance | Chromium 151.0.7922.34: examples, source links, keyboard, CSP/injection, mobile layout, language preservation and actual audio/video recording passed |
| Candidate evidence | [All five PR checks](https://github.com/bvs1006/CodeAlive/actions/runs/37877691837) and [all five branch checks](https://github.com/bvs1006/CodeAlive/actions/runs/37877666603) passed; the fresh installed PR run also inspected live public PR #12 evidence |
| Packages | Both published assets were downloaded. SHA-256 digests and sizes matched GitHub; both archive entry lists and every unpacked source/guide payload matched the build from the exact release sources. The offline ZIP embeds the exact published VSIX. |

| Published asset | Bytes | SHA-256 |
|---|---:|---|
| [codealive-1.0.2.vsix](https://github.com/bvs1006/CodeAlive/releases/download/v1.0.2/codealive-1.0.2.vsix) | 199445 | `62693e5998bead624fcb8692b0a64578559e42d94a303e7e5f6c5c92fa944a70` |
| [codealive-explainer-1.0.2.zip](https://github.com/bvs1006/CodeAlive/releases/download/v1.0.2/codealive-explainer-1.0.2.zip) | 362560 | `0028253c20e85c5c0984e7dd7e89011b4ddbade20020c1dde96c85e7f31f6511` |

Publication completes this packaging task. The manual rows below remain pending;
automated Linux acceptance does not mark wider desktop or physical-device checks complete.

## Published 1.0.1 beta evidence

| Evidence | Recorded result |
|---|---|
| Release | [v1.0.1 beta prerelease](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.1), published 8 October 2026 |
| Exact source | Tag points to [776d394](https://github.com/bvs1006/CodeAlive/commit/776d394ddfeec47d455d2757cc5e0bf96fcc9d4a) |
| Automated gates | [Release CI](https://github.com/bvs1006/CodeAlive/actions/runs/37777462645): five checks and the release job passed on that commit |
| Packages | Both published installers were downloaded: SHA-256 digests matched the release assets and packaged source bytes matched the exact release sources. The offline ZIP embeds the exact published VSIX. |

| Published asset | Bytes | SHA-256 |
|---|---:|---|
| [codealive-1.0.1.vsix](https://github.com/bvs1006/CodeAlive/releases/download/v1.0.1/codealive-1.0.1.vsix) | 198956 | `f9254c5ec640bc7a1f86c6818432c0ced4264550b2842e29c73195faef731b08` |
| [codealive-explainer-1.0.1.zip](https://github.com/bvs1006/CodeAlive/releases/download/v1.0.1/codealive-explainer-1.0.1.zip) | 360749 | `d205737a53135682075199c808c75c5ec3bab63dd87e8db785ef24fc6b5acb64` |

## Earlier 1.0 beta evidence

| Evidence | Recorded result |
|---|---|
| Release | [v1.0.0 beta prerelease](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.0), published 7 October 2026 |
| Exact source | Tag points to [7760091](https://github.com/bvs1006/CodeAlive/commit/7760091cbbead7de259c799533a78cb4fbc8d12d) |
| Automated gates | [Release CI](https://github.com/bvs1006/CodeAlive/actions/runs/37646131724): five checks and the release job passed on that commit |
| Packages | VSIX and offline ZIP uploaded; release job verified matching metadata, current sources, parser license and the exact embedded VSIX |

The manual rows below remain pending. Their coverage is not implied by publication.

## Automated gates

| Check | Expected outcome |
|---|---|
| `npm ci --ignore-scripts` then `npm test` | All unit, mocked extension/API, replay differential and generated-asset checks pass. |
| `npm run package:release` | One 1.0.2 version across workspace, lockfile, extension manifest, VSIX identity and installation instructions; archive payloads match current source. |
| `npm run check:package` | Browser and extension contain identical shared engines and parser license; the ZIP embeds the exact verified VSIX. |
| `npm run test:browser` | Source links, input replay, comparisons, mobile width and CSP pass; actual encoded videos contain expected dimensions and narration/music signals. Requires Chromium and FFmpeg. |
| `xvfb-run -a npm run test:vscode` on Linux | Fresh and legacy-upgrade profiles activate the exact packaged version; the actual toolbar loads selection/file, stays hidden for Markdown and preserves panel edits, replay state and editor groups. Navigation, stale-source protection, Git comparison, encoded narration/music, Save/cancel and live public PR evidence pass. |
| CI on the exact release commit | Linux, Windows and macOS unit suites plus Chromium and installed Linux VS Code jobs pass before publication. |

## Fresh-install acceptance

Use a clean VS Code profile with no CodeAlive installed. Install `codealive-1.0.2.vsix`.
Use a trusted temporary Git repository containing this committed function:

```js
function discountedPrice(price, percent) {
  if (price < 0 || percent < 0 || percent > 100) throw new Error("Invalid discount");
  const savings = price * (percent / 100);
  return price - savings;
}
```

| Step | Expected outcome | Status |
|---|---|---|
| Click Open CodeAlive in the JS/TS editor toolbar with and without a selection | Loads the chosen selection or full file; the source editor stays visible beside CodeAlive. | Pending manual check |
| Edit code in the panel, run Replay, then reopen Open CodeAlive from the panel | Edited source, captured replay and editor groups remain intact. | Pending manual check |
| Select the function → Explain Selected Code | Correct function name, two inputs, source-linked steps; selecting a return reveals the exact editor range. | Pending manual check |
| Run Replay with `[100,20]` | Returns `80`; the final snapshot includes `savings: 20`. | Pending manual check |
| Pin the run; change arguments to `[200,50]` | New result `100`; baseline retains result `80`. Play/Pause and stepping follow captured values. | Pending manual check |
| Run `[-1,20]`; then return to valid input | Reports the thrown error without host execution; another valid run succeeds. | Pending manual check |
| Change the guard to `price <= 0` in the editor without saving → Explain Working Tree Changes | Before shows committed HEAD; After shows the unsaved change; condition observation links to each version. No CI evidence is attached. | Pending manual check |
| Explain again; build a two-scene video, edit a caption, import a short narration and enable music | Preview follows the chosen scenes; encoded video has both audio and video, readable captions and expected source highlights. | Pending manual check |
| Save video; cancel a second save | First file opens externally with audible narration/music. Cancellation creates no file. | Pending manual check |
| Hide source and record again; then edit a caption | Source panel is hidden in the saved video. Editing invalidates the previous export. Captions/audio still need review. | Pending manual check |
| Review an open real GitHub PR and explain a JS/TS file | Before/After revisions and check timestamps are visible; source links match the file; refreshing is required after a moving head. | Pending manual check |
| Repeat the PR flow for a private repository with VS Code GitHub sign-in | Access works with the intended account; authentication stays in the extension host. | Pending manual check |

## Release decisions and remaining platform work

- Complete the pending manual acceptance and physical audio checks; record actual results before broader distribution.
- Test Windows/macOS desktop installation and recording; unit CI on those systems is not desktop coverage.
- Check keyboard navigation, screen-reader labels and reduced-motion behavior with users.
- Resolve the maintainer's license and distribution decisions before promotion or Marketplace/Open VSX publication.
- Publish the beta through the existing `main` workflow after maintainer authorization: it builds and verifies the exact source package after all checks pass. Manual rows remain pending until their results are recorded.
- Record the release URL and the passing CI run for its exact commit; do not describe an unmerged candidate as released.

No source-code telemetry or new languages are required for this beta. Next work should
improve the existing understand → replay → compare → evidence → explain workflow.
