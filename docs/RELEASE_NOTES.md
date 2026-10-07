# CodeAlive 1.0.0 beta candidate

**See what code does, what changed, and why it matters.**

This candidate brings the four feature milestones together under one version. It is
prepared for validation; a public 1.0 release and Marketplace/Open VSX listings are pending.

## Included workflows

- Explain selected JavaScript/TypeScript with plain-language/developer steps, parameters,
  return expressions, exact source links and static flow diagrams.
- Explicitly replay the supported synchronous subset with JSON arguments, variable
  snapshots, branches, step/play controls and a pinned input comparison.
- Compare pasted versions, committed HEAD versus an unsaved editor buffer, or an open PR
  file at its merge-base/head revisions with existing CI evidence attached.
- Turn static or replay steps into editable video scenes with captions, local narration,
  timing controls, optional music, source-panel hiding and browser/VS Code saving.
- Use the existing music studio, Bubble/Quick Sort demonstrations, comparison and recording.

The candidate includes the replay correction for `for (const item of item)`: evaluating
its iterable now respects JavaScript's uninitialized loop binding instead of reading an
outer value. Differential tests cover both `let` and `const`.

## Installation and validation

Build with `npm ci --ignore-scripts` and `npm run package:release`. Install
`codealive-1.0.0.vsix`, or extract `downloads/codealive-explainer-1.0.0.zip` and open
`browser/explain.html`. Close old CodeAlive tabs and reload VS Code after upgrading.

The package check verifies one version, current browser/extension source, the parser's
license and the exact embedded VSIX. Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) to
record the candidate commit, CI results and fresh-install acceptance. Existing passing
milestone checks do not automatically count as validation of a new candidate.

## Boundaries

Static explanations never execute source. Replay uses a bounded interpreter with no
host, module, file or network access; it is not the application's full runtime. Change
observations and CI evidence do not prove correctness, coverage or merge readiness.

Narration is a local audio file; automatic speech generation is not included. Review
captions and audio when hiding source. Videos are limited to 20 scenes, 120 seconds and
50 MB, with browser-dependent MP4/WebM encoding and no automatic upload.

Physical audio devices, Windows/macOS desktop recording, private signed-in PR acceptance
and accessibility checks remain manual work. Licensing and distribution decisions are
still pending. No telemetry or additional language support is introduced by this candidate.
