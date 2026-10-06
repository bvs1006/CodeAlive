# CodeAlive roadmap

Status snapshot: **6 October 2026**. This is a prioritized product plan, not a delivery-date commitment. Revisit the status after each release and link completion claims to code, tests and a usable package.

## Direction

Make code easier to understand, investigate and explain to other people. The near-term audience is developers reading unfamiliar functions, learners exploring control flow, and educators making demonstrations. Music is an optional part of that experience; the core explanation must remain useful without sound.

Broad adoption means approachable onboarding, accessible interaction and dependable behavior. It does not mean claiming support for every language or workflow before those paths are implemented and tested.

## Where we are

| Area | Evidence today | Remaining work |
|---|---|---|
| Music and video studio | Available in the 0.5 alpha on `main`; music from shared text patterns, local recording, captions and presets | Wider device/media verification; explanation and music do not share a synchronized timeline |
| Algorithm demonstrations | Bundled Bubble Sort and Quick Sort with stepping, comparison and real operation traces | General selected-code execution is absent; more algorithms are optional extensions |
| GitHub PR companion | Read-only changed-file groups and existing head/test-merge CI evidence | No semantic diff explanation, test generation, required-check verification or automated fixes |
| Explain selected code | JavaScript/TypeScript implementation in [draft PR #1](https://github.com/bvs1006/CodeAlive/pull/1); local parser, ten examples, two explanation styles, exact source links and static flow diagrams | Desktop VS Code smoke test, review and merge; broader language/runtime semantics remain outside this milestone |
| Build and checks | Preview has shared explainer assets, packaged VSIX/offline browser, multi-OS unit/extension tests and real Chromium integration | CI is on the preview branch until merged; mocked host tests do not replace actual desktop installation and media tests |

The [implementation check run](https://github.com/bvs1006/CodeAlive/actions/runs/37403677204) passed all four jobs for `ee3a41159ce2407a21d7408e3c0dfdff2c7a7b68`. It covers Linux/Windows/macOS unit/extension tests and Chromium integration. This is evidence for the tested scope, not proof of a production-ready release.

## First: finish the 0.6 release

The first feature milestone is implemented. It is not yet a merged release.

- [x] Local JavaScript/TypeScript parsing without executing or uploading source.
- [x] Scope selection, declared inputs, return expressions, visible calls/property writes, and plain-language/developer steps.
- [x] Source-linked static diagrams with visible limits for unsupported control flow.
- [x] Ten examples, keyboard-operable diagram nodes and responsive browser layout.
- [x] Version-checked editor source navigation and code preservation on language changes.
- [x] Shared assets, installer/offline browser packaging, automated cross-platform and browser checks.
- [ ] Install and upgrade the VSIX in real desktop VS Code; verify commands, selection/file transfer, source navigation and stale-document handling.
- [ ] Smoke-test the existing studio and PR panel in that installation, including sample playback, recording, source hiding and editor loading. Record the OS/VS Code version and observed results.
- [ ] Resolve any smoke-test defects, review and merge PR #1, then tag/publish the chosen 0.6 release package.
- [ ] Update the README's main/preview status, download links and developer checkout instructions after merging.

Completion means a user can install the package, explain a complete supported function, inspect exact source links, and understand the feature's limits without assistance. Do not equate passing mocked tests with this installation check.

## Next milestones

| Order | Outcome | Proposed scope | Completion evidence |
|---|---|---|---|
| 2 — Execution replay | Help someone follow what actually happens for an input | Start with constrained, instrumented examples or imported execution traces; show step order, variable values, branch choices and return/error results; pause, step, replay and compare inputs | Displayed values and paths match captured execution; early returns, loops and errors have trace tests; supported/unsupported constructs are explicit |
| 3 — Before/after explanations | Help reviewers understand what changed | Source-linked structural diffs, changed functions/conditions/returns, and links to related test/CI evidence; distinguish observations from inferred impact | Every explanation points to a diff range or evidence source; head changes and incomplete evidence are handled; no unsupported correctness/merge claims |
| 4 — Explain-to-video | Help educators share a coherent explanation | Choose steps or a trace, edit a script, add narration and captions, and synchronize optional background music; preview and export a readable clip | Narration/captions/source highlights stay aligned; export works on declared target platforms; source hiding is respected; users can edit wording and review the result before sharing |

For execution replay, define the supported execution model and its resource/access limits before accepting arbitrary user code. Execution must be an explicit action. Static explanation continues to work independently and must never silently run a selection.

The existing sorting traces are a useful starting point for replay controls. The current studio provides recording and music infrastructure for explain-to-video. Neither is equivalent to those complete milestones today.

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

The PR companion should remain clear about its role: evidence inspection today, proposed change explanation next. Test execution, generated patches and repository writes would each need their own explicit user action and reviewable result.

## How to propose or complete work

Open a [feature request](https://github.com/bvs1006/CodeAlive/issues/new?template=feature_request.yml) with the user task, proposed behavior, example input/output and a way to verify success. Include a small sanitized example, not proprietary source.

For completed milestones, link the PR, validation results and package; record remaining limits and update this file plus the README. For pending items, keep the wording as proposed work until that evidence exists.
