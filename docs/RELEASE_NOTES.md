# CodeAlive 0.8.0 alpha preview

Adds source-linked before/after change explanations for JavaScript and TypeScript. Compare pasted versions, committed HEAD versus your current editor buffer, or a PR file at its exact merge-base/head revisions. Structural observations cover parameters, signatures, conditions, returns, calls and writes.

PR comparisons attach the existing report's timestamped checks, exact revision identities, warnings and changed test-file links. Moving revisions require refresh; editing source detaches evidence. This is read-only inspection, without test execution, coverage verification or a correctness/merge verdict. Function matching, file limits and supported workflows are documented in CHANGE_EXPLANATIONS.md.

Includes the tested 0.6 static explainer and 0.7 restricted execution replay. All local suites pass; review CI for cross-platform, real Chromium/media and installed-VSIX checks on the exact commit. Private signed-in PR use and physical Windows/macOS editor/audio behavior still need manual verification. Feature branches await merge and public-release approval.
