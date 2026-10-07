# Before/after change explanations — 1.0 beta

Use **Explain a change** in the browser or VS Code explainer. Paste Before and After, choose JavaScript or TypeScript, and select **Explain changes**. **Use current source as After** copies the current explanation input. **Load change example** demonstrates changing a fixed discount into a percentage with a new guard.

Each structural observation links to source in either version. The source preview highlights the exact associated range; editor-backed comparisons also open that range in VS Code. Parameters, signature flags/types, condition sequences, return expressions, calls and writes are summarized. A whole-file observation retains context for other changes. Comments and formatting are ignored for structural matching.

## Local Git workflow

Run **CodeAlive: Explain Working Tree Changes** with a local JS/TS file open. The built-in Git extension reads that path at the captured HEAD commit; After uses the entire editor buffer, including unsaved changes. This does not modify the worktree, index or repository, and does not run tests. Before opens as a read-only snapshot; After navigation checks the captured document version. New/renamed files without a HEAD version need manual pasted versions.

## PR workflow and evidence

Run **CodeAlive: Review GitHub PR** for an open, unmerged PR, load a report, then choose **Explain changes** beside a JS/TS file. This explicitly reads source from GitHub: Before is the merge-base revision and previous filename for a rename; After is the captured PR head, including forks. Added/removed files use an empty missing side. Regular UTF-8 blobs are verified through Git trees; symlinks, submodules, oversized files, incomplete trees and unavailable revisions stop with a message.

The report's existing checks, exact checked revision SHAs, timestamp, warnings and changed test-file links accompany the comparison. These are observations, not proof that the changed function is covered. The tool does not run tests, validate required checks or recommend a merge. Refresh the PR report for current evidence. Source loading verifies the PR head before and after its reads; moving revisions require a refresh. Historical/closed PR comparison requires pasted versions. Tokens remain in the extension host. Local/manual comparison has no attached CI evidence.

Editing a comparison input clears its old observations, evidence and editor mapping. Compare again to inspect the new source independently.

## Scope and tests

Up to 50,000 characters and 100 functions per version; up to 200 observations. Unique names are matched; renames are removal/addition and duplicate/anonymous names are explicitly ambiguous. Overload/class names may therefore need a smaller manual selection. Static differences do not establish runtime behavior, semantic equivalence, business intent or correctness.

`shared/compare-engine.js` and `compare-ui.js` own comparison/rendering. `extension/compare-source.js` reads local HEAD/editor snapshots; `pr-changes.js` reads pinned GitHub blobs. Tests cover source ranges, formatting, changed types, ambiguity, additions/removals, forks, renames, stale editors, moving heads and unsupported modes. Browser checks cover source links/evidence detachment; the installed-VSIX suite exercises a real local Git repository.
