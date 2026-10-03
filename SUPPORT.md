# Help and contact

- **Installation or usage question:** [ask a question](https://github.com/bvs1006/CodeAlive/issues/new?template=question.yml).
- **Something broken:** [report a bug](https://github.com/bvs1006/CodeAlive/issues/new?template=bug_report.yml).
- **Feature or collaboration idea:** [request a feature](https://github.com/bvs1006/CodeAlive/issues/new?template=feature_request.yml).

Maintainer: [@bvs1006](https://github.com/bvs1006). These channels are public. Please do not include passwords, tokens, proprietary code or personal data. No response-time commitment is offered for this alpha.

## Code is not loading

Close old studio tabs and run Developer: Reload Window after installing an update. Click inside your source editor, open CodeAlive: Open Studio, and click Load editor file. Confirm the Loaded: filename status. For files above 50,000 characters, select a smaller block and run CodeAlive: Load Selection.

## Music does not start

Use a built-in sample first. Click Make it alive, check system audio output and studio volume. Report whether the button changes to Stop, whether the animation moves, and the exact message below the buttons.

## Editor following

Follow editor updates source after a short delay. During playback, changes wait until Stop. It does not automatically start audio in the background.

## MP4 export fails

Native recording may produce WebM. Save as MP4 converts WebM using locally installed FFmpeg. If FFmpeg is missing, install it separately and restart VS Code, or save the original video. Include the exact conversion error in a bug report.

## Download or installation problems

Download the ZIP from the README, extract it, then install its VSIX rather than the ZIP itself. Requires desktop VS Code 1.90+. The extension is disabled in untrusted workspaces. Review the extension source before trusting it.
