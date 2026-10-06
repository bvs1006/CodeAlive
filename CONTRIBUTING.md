# Contributing to CodeAlive

Start with a small, reproducible developer task. Open a question or feature issue before a large change, and include a sanitized input plus expected behavior for bugs. The project has no open-source license selected; discuss contribution and reuse terms with the maintainer before substantial work.

## Choose the right version

As of 6 October 2026, `main` has the 0.5 alpha and the 0.6 explainer is in `codex/explain-selected-code` / PR #1. Follow the [README's preview checkout and setup instructions](README.md#developer-quick-start--06-preview) for the root npm commands below. Check the PR for current merge status.

Use Node.js 22+ and Python 3. Install dependencies with `npm ci --ignore-scripts` from the repository root.

## Make changes in the owning source

- Edit explainer logic, examples and UI in `shared/`. Run `npm run build` to produce browser and extension copies. Do not hand-edit generated `explainer/` assets.
- Edit VS Code source capture/navigation in `extension/explain-panel.js`; do not apply stale offsets to a changed document.
- The music studio still has separate browser and extension implementations. Check both when changing shared behavior such as language selection or source loading.
- Keep GitHub authentication and PR requests in the extension host. The webview must not receive authentication tokens.

Preserve the current privacy boundary: the explainer must not execute, persist or transmit selected source. Keep static explanations, text-pattern music, actual bundled algorithm traces and verified CI observations clearly distinguished. Proposed execution replay is a separate roadmap feature requiring an explicit execution design and user action.

## Verify the behavior you changed

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run package
```

On Linux, Playwright may require `npx playwright install --with-deps chromium`. Packaging expects `python3` on PATH; where Python 3 is named `python`, run `npm run build` then `python extension/package.py`.

`npm test` builds assets, exercises the parser and mocked editor/GitHub/browser paths, runs the existing studio suites and checks shared-asset equality. `npm run test:browser` exercises real rendered pages and captures screenshots in `test-results/`. Use the relevant checks for the change; documentation-only work needs correct paths, links and accurate claims rather than new implementation tests.

Install the built VSIX to check real editor commands, selection/file loading, source navigation and media workflows. Record your OS and VS Code version. Mocked tests do not validate actual desktop integration, audio or encoded videos. A VSIX can be inspected as a ZIP archive.

`python3 scripts/package-release.py` builds the VSIX and offline browser release ZIP. Publish a refreshed package only when runtime or packaged content needs it. Update version/status/download guidance when a preview becomes the main release.

## Submit a reviewable change

Describe the user problem, resulting behavior, validation performed and remaining limits. Link relevant issues and update [the roadmap](docs/ROADMAP.md) only when the acceptance criteria have evidence. Do not commit credentials, private source, temporary recordings or generated test clips.
