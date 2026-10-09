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
| Visual product overview and concise installation guidance | README uses a feature graphic, real screenshots/animation and task-based benefits; detailed setup is in [DEVELOPMENT.md](DEVELOPMENT.md) |

CI covers Linux/Windows/macOS unit checks, Chromium/media integration and an installed
VSIX on Linux. The 1.0 suite tests fresh profiles, upgrades, recording, Save/cancel
and a real public PR. Unit checks on Windows/macOS are not desktop recording coverage.

## 1.0.2 beta packaging

The 1.0.2 beta packages an **Open CodeAlive** editor toolbar button and automatically
explains the current JS/TS selection or file. Reopening from the CodeAlive panel
preserves edited source and replay state, with the source editor visible beside it.
[PR #11](https://github.com/bvs1006/CodeAlive/pull/11) is merged. Publication uses
the gated `main` workflow; record its exact commit, CI and downloaded installer
verification in the [release checklist](RELEASE_CHECKLIST.md).

## Next small tasks

1. Align GitHub About settings with the current developer workflow; [suggested settings](GITHUB_ABOUT.md) need repository settings access.
2. Complete Windows/macOS desktop, physical audio-device, private signed-in PR,
   screen-reader and reduced-motion checks. Music studio decorations now respect
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
