# CodeAlive 0.6.0 alpha

Local JavaScript and TypeScript explanations with source-linked steps, plain-language/developer modes, ten examples and static flow diagrams. Includes the VS Code installer and an offline browser version.

Install the VSIX from the ZIP and run **CodeAlive: Explain Selected Code**, or open `browser/explain.html`. No account, API key or source upload is needed for explanations. Existing music, sorting, recording and read-only PR workflows remain available.

Automated checks cover the parser, source ranges, editor bridge, real Chromium pages and audio/video recording. The release workflow additionally installs the packaged extension into real VS Code on Linux and checks activation, both webview bridges, selection/file transfer, exact source navigation and stale-document handling. Windows/macOS unit suites use mocked VS Code APIs. Physical audio devices and desktop integration on those platforms still need manual verification.

Explanations describe static structure, not runtime values or correctness. Complex control flow is collapsed with visible limits. Selected source is never executed. This is an alpha; see the README and roadmap for supported scope and pending work.
