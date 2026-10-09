# CodeAlive roadmap

Status: **9 October 2026**. Track implemented code, passing checks and published
packages as separate states.

## Direction

Help developers understand unfamiliar functions, investigate input cases, review
changes and explain findings to other people. Music and video support demonstrations.
The core workflow remains useful without sound.

## Completed and available

| Capability | Status and evidence |
|---|---|
| Local JS/TS explanations, source links and static flow diagrams | PR #1 merged; [0.6 release](https://github.com/bvs1006/CodeAlive/releases/tag/v0.6.0) |
| Bounded replay, snapshots and pinned input comparison | PR #2 merged; loop-binding regression fixed; [0.7 release](https://github.com/bvs1006/CodeAlive/releases/tag/v0.7.0) |
| Before/after, HEAD/editor and revision-bound PR comparisons | PR #3 merged; [0.8 release](https://github.com/bvs1006/CodeAlive/releases/tag/v0.8.0) |
| Music, sorting demonstrations and studio recording | Available in the published feature set; wider physical-device checks remain |
| Editable explanation scenes with imported narration | Included in the unified 1.0 beta from the PR #4 video work |
| Unified 1.0 metadata, package verification, navigation and fresh-install acceptance | [PR #5](https://github.com/bvs1006/CodeAlive/pull/5) merged; [1.0 beta published](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.0) after [five checks and the release job passed](https://github.com/bvs1006/CodeAlive/actions/runs/37646131724) |
| Reduced-motion music studio and scene-boundary video announcements | [PR #7](https://github.com/bvs1006/CodeAlive/pull/7) and [PR #8](https://github.com/bvs1006/CodeAlive/pull/8) merged; [PR #9](https://github.com/bvs1006/CodeAlive/pull/9) packaged the fixes in the [1.0.1 beta](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.1) after [all release checks passed](https://github.com/bvs1006/CodeAlive/actions/runs/37777462645). Both published installer downloads were verified. |
| Editor-toolbar entry, automatic selection/file loading and preserved panel work | [PR #11](https://github.com/bvs1006/CodeAlive/pull/11) merged; [PR #12](https://github.com/bvs1006/CodeAlive/pull/12) packaged the changes in [1.0.2 beta](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.2). [All release checks passed](https://github.com/bvs1006/CodeAlive/actions/runs/37877906619); both downloaded installers and their checksums were verified. |
| Desktop video Save and installed cross-platform release acceptance | [PR #13](https://github.com/bvs1006/CodeAlive/pull/13) merged; [1.0.3 beta published](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.3) with the codec-list Save fix. [Seven release gates and both published-desktop checks passed](https://github.com/bvs1006/CodeAlive/actions/runs/37902510640); Windows/macOS fresh and legacy-upgrade profiles installed the exact downloaded VSIX and saved real narrated videos. Both installer downloads were verified. |
| Visual product overview and concise installation guidance | README uses a feature graphic, real screenshots/animation and task-based benefits; detailed setup is in [DEVELOPMENT.md](DEVELOPMENT.md) |

CI covers Linux/Windows/macOS unit checks and installed VSIX acceptance, plus
Chromium/media integration. Seven gates must pass before publication. Windows/macOS
then install the published download and repeat fresh/upgrade acceptance, real
recording and Save/cancel. Physical devices and human accessibility remain manual.

## Next small tasks

1. Align GitHub About settings with the current developer workflow; [suggested settings](GITHUB_ABOUT.md) need repository settings access.
2. Complete acceptance on developers' own desktops, physical audio devices, private
   signed-in PRs, screen readers and reduced-motion preferences. Use the four focused
   groups in [Manual beta acceptance](MANUAL_ACCEPTANCE.md) and the linked report form;
   unattempted and blocked checks remain pending. Music studio decorations respect
   the system motion preference on both surfaces; physical-device acceptance remains.
3. Choose licensing and distribution terms; then confirm publisher identity before
   Marketplace/Open VSX publication.
4. Observe repeat use before adding languages or building review intelligence that
   connects changes, captured behavior and existing tests/CI.

[Release checklist](RELEASE_CHECKLIST.md)
· [Known limitations](KNOWN_LIMITATIONS.md)

For each engineering task, make one reviewable change, validate the expected outcome,
commit/push, check CI, then proceed. Stop for exhausted limits or a concrete blocker.
No telemetry, cloud accounts, billing or automatic fixes are required for this beta.
