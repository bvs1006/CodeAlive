# CodeAlive roadmap

Status: **7 October 2026**. Track implemented code, passing checks and published
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
| Editable explanation scenes with imported narration | Implemented in open [PR #4](https://github.com/bvs1006/CodeAlive/pull/4); integration/package publication pending |
| Unified 1.0 metadata, package verification, navigation and fresh-install acceptance | Implemented in draft [PR #5](https://github.com/bvs1006/CodeAlive/pull/5); [all five checks passed](https://github.com/bvs1006/CodeAlive/actions/runs/37618984398); not publicly released |
| Visual product overview and concise installation guidance | README uses a feature graphic, real screenshots/animation and task-based benefits; detailed setup is in [DEVELOPMENT.md](DEVELOPMENT.md) |

CI covers Linux/Windows/macOS unit checks, Chromium/media integration and an installed
VSIX on Linux. The 1.0 candidate tests fresh profiles, upgrades, recording, Save/cancel
and a real public PR. Unit checks on Windows/macOS are not desktop recording coverage.

## Next small tasks

1. Resolve the PR #4 package-publication block and integrate the tested 1.0 candidate.
2. Align GitHub About settings with the current developer workflow; [suggested settings](GITHUB_ABOUT.md) need repository settings access.
3. Complete Windows/macOS desktop, physical audio-device, private signed-in PR,
   screen-reader and reduced-motion checks.
4. Choose licensing and distribution terms; then confirm publisher identity before
   Marketplace/Open VSX publication.
5. Observe repeat use before adding languages or building review intelligence that
   connects changes, captured behavior and existing tests/CI.

[Candidate release checklist](https://github.com/bvs1006/CodeAlive/blob/codex/release-1.0-beta/docs/RELEASE_CHECKLIST.md)
· [Known limitations](KNOWN_LIMITATIONS.md)

For each engineering task, make one reviewable change, validate the expected outcome,
commit/push, check CI, then proceed. Stop for exhausted limits or a concrete blocker.
No telemetry, cloud accounts, billing or automatic fixes are required for this beta.
