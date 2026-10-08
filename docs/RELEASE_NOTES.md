# CodeAlive 1.0.1 beta

**See what code does, what changed, and why it matters.**

This maintenance beta packages the accessibility fixes merged after 1.0.0. Installers
are built from the release commit after all five CI gates pass. Marketplace/Open VSX
listings and the manual platform checks below remain pending.

## Accessibility fixes

- Music studio decorations honor the system's reduced-motion preference in both the
  browser and VS Code. Preference changes apply without reloading; playback, source
  highlights, sorting and recording remain usable. [PR #7](https://github.com/bvs1006/CodeAlive/pull/7)
- Explanation videos announce the scene number and caption once at each scene boundary.
  The visible clock updates without continuous live announcements. Editing clears stale
  announcements, and restarting announces the first scene again. [PR #8](https://github.com/bvs1006/CodeAlive/pull/8)

Automated browser and installed Linux VS Code checks cover these fixes. Physical
screen-reader and audio-device acceptance remain pending.

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
- Start with **CodeAlive: Open CodeAlive** and navigate between Explain, Replay,
  Compare, Review PR and Create video without clearing entered values.

The beta includes the replay correction for `for (const item of item)`: evaluating
its iterable now respects JavaScript's uninitialized loop binding instead of reading an
outer value. Differential tests cover both `let` and `const`.

## Installation and validation

Download the [release VSIX or offline ZIP](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.1),
or build with `npm ci --ignore-scripts` and `npm run package:release`. Install
`codealive-1.0.1.vsix`, or extract `downloads/codealive-explainer-1.0.1.zip` and open
`browser/explain.html`. Close old CodeAlive tabs and reload VS Code after upgrading.

The package check verifies one version, current browser/extension source, the parser's
license and the exact embedded VSIX. Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) to
record the release commit, CI results and fresh-install acceptance. Existing passing
milestone checks do not automatically count as validation of a new release commit.

## Boundaries

Static explanations never execute source. Replay uses a bounded interpreter with no
host, module, file or network access; it is not the application's full runtime. Change
observations and CI evidence do not prove correctness, coverage or merge readiness.

Narration is a local audio file; automatic speech generation is not included. Review
captions and audio when hiding source. Videos are limited to 20 scenes, 120 seconds and
50 MB, with browser-dependent MP4/WebM encoding and no automatic upload.

Physical audio devices, Windows/macOS desktop recording, private signed-in PR acceptance
and accessibility checks remain manual work. Licensing and distribution decisions are
still pending. No telemetry or additional language support is introduced by this beta.
