# CodeAlive roadmap

Status snapshot: **7 October 2026**. Track completion with a tested commit and usable
package; candidate code and published releases are separate states.

## Direction

**CodeAlive — See what code does, what changed, and why it matters.**

The shared workflow is understand → replay → compare → inspect evidence → explain/share.
Developers reading and reviewing code are the primary focus. Educators can use the same
explanation and replay engine for videos. Music remains an optional part of the experience.

## Built and validated

| Capability | Integration status | Evidence |
|---|---|---|
| Local JS/TS explanation and source-linked flow | PR #1 merged into `main`; 0.6 prerelease | [Main checks and release](https://github.com/bvs1006/CodeAlive/actions/runs/37565036227) |
| Bounded replay, snapshots and input comparison | PR #2 merged; 0.7 prerelease; loop-binding regression fixed | [Main checks and release](https://github.com/bvs1006/CodeAlive/actions/runs/37565658315) |
| Before/after observations and revision-bound PR evidence | PR #3 merged; 0.8 prerelease | [Main checks and release](https://github.com/bvs1006/CodeAlive/actions/runs/37567881283) |
| Editable explanation videos with local narration | [PR #4](https://github.com/bvs1006/CodeAlive/pull/4) is open; updated package publication remains pending | [Original PR checks](https://github.com/bvs1006/CodeAlive/actions/runs/37497941870); [video scope](EXPLANATION_VIDEO.md) |
| Unified 1.0.0 beta | Candidate branch `codex/release-1.0-beta`; includes all workflows and the replay fix | Version/package validation and [release acceptance checklist](RELEASE_CHECKLIST.md); not a published 1.0 release |
| Shared workflow navigation | Open CodeAlive and a common Explain / Replay / Compare / Review PR / Create video bar in the candidate | Browser keyboard, value-preservation and invalid-source checks; installed VS Code navigation and PR action |
| Music, sorting and existing Studio video tools | Available; retained in the candidate | Unit/browser coverage for the declared surfaces; wider physical-device testing remains |

CI runs unit/extension checks on Linux, Windows and macOS, Chromium/media integration,
and a real installed VSIX on Linux. Windows/macOS unit checks use mocked editor APIs.
Those checks do not establish complete desktop, accessibility or audio-device coverage.

## Small tasks, in order

| Order | Task | Expected outcome |
|---|---|---|
| 1 | Finish PR #4 integration after its publication block is resolved | Updated branch and merged `main` pass all checks before the release is considered ready. |
| 2 | Prepare one 1.0 beta candidate | Matching version metadata, complete notes, verified VSIX/offline bundle and accurate status; no mixed preview installation guidance. |
| 3 | Run fresh-install acceptance | Select function → Explain → Run → compare inputs → compare changes → create/save video → review a real PR; record actual results. |
| 4 | Simplify product navigation — implemented in the candidate | Open CodeAlive leads to Explain, Replay, Compare, Review PR and Create video, with keyboard focus and preserved inputs. CI gates each change; publication remains pending. |
| 5 | Align repository/product metadata | Description, topics, install guidance and screenshots describe the current developer workflow. |
| 6 | Decide licensing | Maintainer explicitly chooses reuse/distribution terms before open-source promotion or broader distribution. |
| 7 | Publish through Marketplace/Open VSX | Confirm publisher identity and license, then verify a clean installation from the chosen listing. |
| 8 | Design optional usage measurement | Explicit privacy choices; no source code, arguments, traces or narration collected. No telemetry is implemented now. |
| 9 | Observe repeat usage | Learn which JS/TS understanding/review tasks users return for before adding languages. |
| 10 | Build developer review intelligence | Connect structural changes, captured behavior and existing tests/CI; label observations, evidence gaps and inferences separately. |

For each engineering task: make one reviewable change, validate its expected result,
commit/push, check CI, then proceed. Stop for exhausted limits or a concrete external blocker.

## Keep the beta focused

Do not expand into arbitrary application execution, many new languages, more sorting
algorithms, cloud accounts, billing or a broad AI chat interface before validating the
existing workflow. The interpreter remains explicit and bounded; the PR companion reads
evidence without executing PR code or declaring it correct.

Complete physical media and Windows/macOS desktop checks, a private signed-in PR smoke
test, keyboard/screen-reader checks and reduced-motion review. Track failures as small
reproducible tasks. [Known limitations](KNOWN_LIMITATIONS.md)

Propose work with a concrete user task, sanitized input, expected output and a verification
method. Update the README and this roadmap when evidence changes the completion status.
