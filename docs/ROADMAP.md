# CodeAlive roadmap

Status snapshot: **6 October 2026**. This is a prioritized product plan, not a delivery-date commitment. Revisit the status after each release and link completion claims to code, tests and a usable package.

## Direction

Make code easier to understand, investigate and explain to other people. The near-term audience is developers reading unfamiliar functions, learners exploring control flow, and educators making demonstrations. Music is an optional part of that experience; the core explanation must remain useful without sound.

Broad adoption means approachable onboarding, accessible interaction and dependable behavior. It does not mean claiming support for every language or workflow before those paths are implemented and tested.

## Where we are

| Area | Evidence today | Remaining work |
|---|---|---|
| Music and video studio | Available in the 0.5 alpha on `main`; music from shared text patterns, local recording, captions and presets | Wider device/media verification; explanation and music do not share a synchronized timeline |
| Algorithm demonstrations | Bundled Bubble Sort and Quick Sort with stepping, comparison and real operation traces | 0.7 preview offers a restricted interpreter; general application execution remains unsupported |
| GitHub PR companion | Read-only changed-file groups and existing head/test-merge CI evidence | 0.8 preview adds structural change observations and revision-bound evidence; no test generation, required-check verification or automated fixes |
| Explain selected code | JavaScript/TypeScript implementation in [PR #1](https://github.com/bvs1006/CodeAlive/pull/1); local parser, ten examples, two explanation styles, exact source links and static flow diagrams | Broader language/runtime semantics remain outside this milestone; Windows/macOS desktop and physical media-device checks remain |
| Build and checks | Preview has shared explainer assets, packaged VSIX/offline browser, multi-OS unit/extension tests and real Chromium integration | CI includes a real Linux VS Code install/upgrade check and real Chromium recording; physical device coverage remains limited |

The [CI workflow](https://github.com/bvs1006/CodeAlive/actions/workflows/ci.yml) covers Linux/Windows/macOS unit/extension tests, Chromium/media integration and real Linux VS Code installation. This is evidence for the tested scope, not proof of a production-ready release.

## First: finish the 0.6 release

The first feature milestone is implemented and all five CI jobs passed on PR #1. Merge and public release await approval. PR #2 replay passed all five CI jobs; the next stacked branch is `codex/change-explanations` for 0.8; each milestone must pass its checks before the next begins. Alpha releases publish only from `main` after all checks pass.

- [x] Local JavaScript/TypeScript parsing without executing or uploading source.
- [x] Scope selection, declared inputs, return expressions, visible calls/property writes, and plain-language/developer steps.
- [x] Source-linked static diagrams with visible limits for unsupported control flow.
- [x] Ten examples, keyboard-operable diagram nodes and responsive browser layout.
- [x] Version-checked editor source navigation and code preservation on language changes.
- [x] Shared assets, installer/offline browser packaging, automated cross-platform and browser checks.
- [x] Automated Linux VS Code install/upgrade check: commands, selection/file transfer, source navigation and stale-document handling.
- [x] Verify the real studio webview bridge and a Chromium recording with audio/video tracks and source hiding enabled. Linux VS Code 1.140.0 passed; CI records the tested version.
- [ ] Complete physical audio-device and Windows/macOS desktop checks, plus a signed-in PR panel smoke test.
- [x] Add CI-gated versioned alpha release packaging. Review/merge evidence is in PR #1.
- [x] Document feature-branch setup and usable preview packages.
- [ ] Obtain approval to merge the tested PRs and publish their versioned alpha releases.

Completion means a user can install the package, explain a complete supported function, inspect exact source links, and understand the feature's limits without assistance. Do not equate passing mocked tests with this installation check.

## Next milestones

| Order | Outcome | Proposed scope | Completion evidence |
|---|---|---|---|
| 2 — Execution replay | **Implemented in 0.7; all five CI jobs passed on PR #2** | Explicit JSON inputs; restricted synchronous interpreter; immutable variable snapshots, branches, writes, return/errors; step/play/slider and pinned input comparison | Differential tests against trusted JavaScript fixtures, early returns/loops/errors, isolation and resource-limit tests; browser playback checks; [supported execution model](EXECUTION_REPLAY.md) |
| 3 — Before/after explanations | **Implemented in 0.8 preview; CI verification required before advancing** | Pasted versions, HEAD/editor buffers and exact PR merge-base/head files; source-linked structural observations, existing checks and test-file links | Structural/range/ambiguity tests; stale source and moving-head guards; mocked fork/rename/blob tests plus browser and installed-VSIX checks; [guide](CHANGE_EXPLANATIONS.md) |
| 4 — Explain-to-video | Help educators share a coherent explanation | Choose steps or a trace, edit a script, add narration and captions, and synchronize optional background music; preview and export a readable clip | Narration/captions/source highlights stay aligned; export works on declared target platforms; source hiding is respected; users can edit wording and review the result before sharing |

For execution replay, define the supported execution model and its resource/access limits before accepting arbitrary user code. Execution must be an explicit action. Static explanation continues to work independently and must never silently run a selection.

The existing sorting traces are a useful starting point for replay controls. The current studio provides recording and music infrastructure for explain-to-video. The restricted interpreter now supplies replay; synchronized narration remains the next video milestone.

## Requirements for broader adoption

These work alongside the feature sequence, rather than expanding every feature at once.

| Priority | Work | Evidence of progress |
|---|---|---|
| Before promoting 0.6 | Clear installer/version guidance, honest limitations and clean installation tests | New users can find the right package and complete the first example; tested environments are recorded |
| Before open-source promotion or wide distribution | Maintainer chooses licensing terms, confirms the public product name and packaging identity, and decides on Marketplace/Open VSX or other distribution | Explicit license and a maintained distribution path; no claim that a listing or public demo exists before it does |
| Alongside each milestone | Keyboard and screen-reader checks, readable diagrams, reduced-motion behavior and useful error states | Documented checks with assistive technology and user feedback; keyboard browser tests alone are not a complete accessibility audit |
| After validating the first explanation workflow | Prioritize another explanation language, likely Python if user demand supports it | Parser/source-range/flow tests and useful error handling for that language; existing music samples do not count as explanation support |
| Before expanding to teams or paid plans | Learn which tasks users repeat and whether the tool improves understanding | Small task-based user sessions, concrete workflow feedback and repeated use; gather feedback without uploading source by default |

## Keep later work focused

Repository-wide Q&A, automated fixes, collaboration accounts, billing, more integrations and batch publishing are later candidates. Add them when usage justifies the complexity. Avoid building several partially supported workflows before the first explanation/replay experience is dependable.

The PR companion should remain clear about its role: evidence inspection plus bounded structural change observations. Test execution, generated patches and repository writes would each need their own explicit user action and reviewable result.

## How to propose or complete work

Open a [feature request](https://github.com/bvs1006/CodeAlive/issues/new?template=feature_request.yml) with the user task, proposed behavior, example input/output and a way to verify success. Include a small sanitized example, not proprietary source.

For completed milestones, link the PR, validation results and package; record remaining limits and update this file plus the README. For pending items, keep the wording as proposed work until that evidence exists.
