# Manual beta acceptance

Use the [published 1.0.3 beta](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.3)
and its exact VSIX for these checks. The [release checklist](RELEASE_CHECKLIST.md)
records the installer hash, source commit and completed automated acceptance.
These checks cover the remaining human, physical-device and private-account gaps.

Choose one group below per session. Record the CodeAlive/VS Code versions, operating
system, fresh or upgrade installation, and the devices or assistive software used.
Report each attempted step as **Pass**, **Fail** or **Blocked**; keep unattempted steps
**Not tested**. An automated result does not complete a manual step.

## 1. Your own desktop

Install the published VSIX in a trusted test workspace. Use this function in a
tracked JS file with a committed HEAD version:

```js
function discountedPrice(price, percent) {
  if (price < 0 || percent < 0 || percent > 100) throw new Error("Invalid discount");
  const savings = price * (percent / 100);
  return price - savings;
}
```

| Check | Expected result |
|---|---|
| Select the function and click the Open CodeAlive editor-toolbar button; repeat without a selection | The chosen selection or full file loads beside the source editor. |
| Click an explanation step | The matching source range is revealed. |
| Run Replay with `[100,20]`, pin it, then run `[200,50]` | Results are `80` and `100`; the pinned run retains `80`. |
| Run `[-1,20]`, then a valid input | The thrown error is shown; the next valid run succeeds. |
| Edit panel source, run Replay, and reopen Open CodeAlive from the panel | Edited source and captured replay remain; source editor groups are preserved. |
| Change `price < 0` to `price <= 0` in the unsaved editor, then Explain Working Tree Changes | Before uses committed HEAD; After uses the unsaved buffer and shows the changed condition. |

## 2. Physical audio and saved video

Use a short local narration and a two-scene explanation video. Record the actual
speaker/headphone output and the external player used.

| Check | Expected result |
|---|---|
| Preview with narration and optional quiet music | Both are audible through the selected physical output; captions and scene timing are readable. |
| Record while keeping the view visible, Save video, then open the file in an external player | The saved file plays with video and audible narration/music. |
| Cancel a second Save dialog | No additional file is created. |
| Hide source and record again | The saved video's source panel is hidden; review captions and narration separately. |
| Edit a caption after recording | The prior export is invalidated; record again to save the changed script. |
| Play a built-in music-studio sample, then Stop | Sound reaches the chosen device and stops when requested. |

## 3. Keyboard, screen reader and reduced motion

Record the screen reader and version, OS motion preference and input method. Repeat
in VS Code and the offline browser if both surfaces are being accepted; record each
surface separately.

| Check | Expected result |
|---|---|
| Use Tab/Shift+Tab through navigation, source/function controls, Replay, Compare and video controls | Focus is visible, follows a usable order, and does not become trapped. |
| Activate navigation and source-linked steps using the keyboard | Enter/Space works where appropriate; focus reaches the requested controls or source. |
| Read form controls, buttons, status messages and flow-diagram actions with the screen reader | Controls have understandable names; updates can be understood without relying on color or animation. |
| Preview a two-scene video with the screen reader | Each scene number/caption is announced at its boundary; the elapsed clock does not produce continuous announcements. |
| Enable the OS reduced-motion preference and play a music-studio sample | Decorative waves, particles and spectrum remain still; explicit playback progress remains available. |
| Change the motion preference while the studio is open | The decorative treatment changes without reloading. |

## 4. Private GitHub sign-in

Use an existing open private PR with a small JS/TS change that the intended account
can access. Keep its URL, source and authentication information out of public reports.

| Check | Expected result |
|---|---|
| Run Review GitHub PR, enter the private PR URL and choose Use GitHub sign-in | The intended account can read the PR; unavailable access produces a clear error. |
| Inspect file groups, checks, revision labels and fetch timestamp | Evidence belongs to the displayed PR head/test-merge revisions; missing checks are not presented as passing. |
| Choose Explain changes for a JS/TS file | Before/After correspond to the exact displayed revisions and source links reveal matching ranges. |
| Edit compared source in the panel | Revision-bound evidence detaches from edited source. |
| Refresh after an independently updated PR head, if available | Evidence is reloaded for the new revision; record Not tested if no head update was exercised. |
| Cancel a requested sign-in or try an account without access, if available | No private report is loaded; retrying with valid access can recover. Record Not tested if this case was not exercised. |

## Record the outcome

Use the [beta acceptance report](https://github.com/bvs1006/CodeAlive/issues/new?template=release_acceptance.yml)
for one group and one environment. Include exact expected/actual results and sanitized
evidence. A partially exercised group remains incomplete even when attempted steps
pass. Reports are public: omit private repository names/URLs, code, tokens and personal
information. Use the [bug report](https://github.com/bvs1006/CodeAlive/issues/new?template=bug_report.yml)
for a reproducible failure.

Acceptance does not select a license, establish publisher ownership or authorize
Marketplace/Open VSX publication. Those maintainer decisions remain in the [roadmap](https://github.com/bvs1006/CodeAlive/blob/main/docs/ROADMAP.md).
