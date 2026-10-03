# Contributing

Start with a question or feature issue before a large change. Include a small sanitized reproduction for bugs.

The extension is in `extension/`; the earlier browser alpha is in `web/`. Preserve the source privacy boundary: no execution, telemetry or network transfer of editor code. Keep captions honest about structure-based sonification.

Run the Node test scripts and package with `python3 package.py`. Test loading, playback, recording and source hiding in desktop VS Code. Mocked tests alone do not validate real audio or encoded videos. A VSIX can be inspected as a ZIP archive.

Do not commit credentials, private code, temporary recordings or generated test clips. Submit a pull request describing behavior changes and validation.

No open-source license has been selected. Discuss contribution and reuse terms with the maintainer before contributing substantial work.
