# Contributing

Start with a question or feature issue before a large change. Include a small sanitized reproduction for bugs.

The extension is in `extension/`; the earlier browser alpha is in `web/`. Preserve the source privacy boundary: no execution, telemetry or network transfer of editor code. Keep captions honest about structure-based sonification.

Run the Node test scripts and package with `python3 package.py`. Test loading, playback, recording and source hiding in desktop VS Code. Mocked tests alone do not validate real audio or encoded videos. A VSIX can be inspected as a ZIP archive.

Do not commit credentials, private code, temporary recordings or generated test clips. Submit a pull request describing behavior changes and validation.

No open-source license has been selected. Discuss contribution and reuse terms with the maintainer before contributing substantial work.

## Explainer development

Use Node.js 22+ and Python 3 from the repository root. Run `npm ci --ignore-scripts`, then `npm test`. Canonical explainer sources are in `shared/`; `npm run build` generates identical assets for `web/` and `extension/media/`, including the pinned Babel parser and its license. Do not hand-edit generated copies.

Run `npx playwright install chromium` and `npm run test:browser` for rendered browser integration and screenshots. `npm run package` builds the VSIX. `python3 scripts/package-release.py` packages the VSIX and offline browser version. Extension-host tests are mocked; test actual VS Code installation and media support before a public release.
