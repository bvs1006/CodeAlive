# CodeAlive 1.0 beta release checklist

Run this checklist against one commit and its exact packaged VSIX. Record the commit SHA,
OS, VS Code version, browser version, and results. A passing automated suite does not
mark the manual rows complete. Automated gates apply to the beta prerelease; the
manual rows track remaining desktop, physical-device and accessibility coverage.

## Published 1.0 beta evidence

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
| `npm run package:release` | One 1.0.0 version across workspace, lockfile, extension manifest, VSIX identity and installation instructions; archive payloads match current source. |
| `npm run check:package` | Browser and extension contain identical shared engines and parser license; the ZIP embeds the exact verified VSIX. |
| `npm run test:browser` | Source links, input replay, comparisons, mobile width and CSP pass; actual encoded videos contain expected dimensions and narration/music signals. Requires Chromium and FFmpeg. |
| `xvfb-run -a npm run test:vscode` on Linux | The packaged extension upgrades the legacy fixture and activates; editor transfer, navigation, stale-source protection and a real Git comparison pass. |
| CI on the exact release commit | Linux, Windows and macOS unit suites plus Chromium and installed Linux VS Code jobs pass before publication. |

## Fresh-install acceptance

Use a clean VS Code profile with no CodeAlive installed. Install `codealive-1.0.0.vsix`.
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
