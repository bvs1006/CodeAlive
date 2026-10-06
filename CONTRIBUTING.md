# Contributing to CodeAlive

Start with a small, reproducible developer task. Open a question or feature issue before a large change, and include a sanitized input plus expected behavior for bugs. The project has no open-source license selected; discuss contribution and reuse terms with the maintainer before substantial work.

## Choose the right version

Use the feature branch named in the README for the latest preview; `main` still has the 0.5 runtime while merges await approval. Follow the [README setup instructions](README.md#developer-quick-start) for the root npm commands below.

Use Node.js 22+ and Python 3. Install dependencies with `npm ci --ignore-scripts` from the repository root.

## Make changes in the owning source

- Edit explainer logic, examples and UI in `shared/`. Run `npm run build` to produce browser and extension copies. Do not hand-edit generated `explainer/` assets.
- Edit VS Code source capture/navigation in `extension/explain-panel.js`; do not apply stale offsets to a changed document.
- The music studio still has separate browser and extension implementations. Check both when changing shared behavior such as language selection or source loading.
- Keep GitHub authentication and PR requests in the extension host. The webview must not receive authentication tokens.

Static explanation must never execute source or silently start replay. Inputs and traces must not be persisted or transmitted without a separate user action. Keep static observations, interpreter results, bundled sorting traces and CI evidence clearly distinguished. Replay uses an explicit Run action and the documented bounded interpreter; do not introduce eval, host globals, module access or unbounded execution. Add differential tests for newly supported semantics and rejection tests for unsupported constructs.

## Verify the behavior you changed

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run package
npm run test:vscode
```

On Linux, Playwright may require `npx playwright install --with-deps chromium`. Packaging expects `python3` on PATH; where Python 3 is named `python`, run `npm run build` then `python extension/package.py`.

`npm test` builds assets, exercises the parser and mocked editor/GitHub/browser paths, runs the existing studio suites and checks shared-asset equality. `npm run test:browser` exercises real rendered pages and captures screenshots in `test-results/`. Use the relevant checks for the change; documentation-only work needs correct paths, links and accurate claims rather than new implementation tests.

The VS Code test runner installs the legacy 0.5 package, upgrades to the built VSIX and exercises real editor commands, selection/file loading, source navigation and both webview bridges in an isolated profile. Headless Linux needs `xvfb-run -a npm run test:vscode`. Also install the VSIX on your target desktop to check device-specific behavior. Record your OS and VS Code version. Mocked tests do not validate actual desktop integration, audio or encoded videos. A VSIX can be inspected as a ZIP archive.

`python3 scripts/package-release.py` builds the VSIX and offline browser release ZIP. Publish a refreshed package only when runtime or packaged content needs it. Update version/status/download guidance when a preview becomes the main release.

## Submit a reviewable change

Describe the user problem, resulting behavior, validation performed and remaining limits. Link relevant issues and update [the roadmap](docs/ROADMAP.md) only when the acceptance criteria have evidence. Do not commit credentials, private source, temporary recordings or generated test clips.
