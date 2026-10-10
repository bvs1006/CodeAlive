# Help and contact

- **Installation or usage question:** [ask a question](https://github.com/bvs1006/CodeAlive/issues/new?template=question.yml).
- **Something broken:** [report a bug](https://github.com/bvs1006/CodeAlive/issues/new?template=bug_report.yml).
- **Feature or collaboration idea:** [request a feature](https://github.com/bvs1006/CodeAlive/issues/new?template=feature_request.yml).
- **Beta testing result:** follow [manual acceptance](docs/MANUAL_ACCEPTANCE.md) and [report one group](https://github.com/bvs1006/CodeAlive/issues/new?template=release_acceptance.yml).

Maintainer: [@bvs1006](https://github.com/bvs1006). These channels are public. Please do not include passwords, tokens, proprietary code or personal data. No response-time commitment is offered for this beta.

## Code is not loading

Close old studio tabs and run Developer: Reload Window after installing an update. Click inside your source editor, open CodeAlive: Open Studio, and click Load editor file. Confirm the Loaded: filename status. For files above 50,000 characters, select a smaller block and run CodeAlive: Load Selection.

## Music does not start

Use a built-in sample first. Click Make it alive, check system audio output and studio volume. Report whether the button changes to Stop, whether the animation moves, and the exact message below the buttons.

## Editor following

Follow editor updates source after a short delay. During playback, changes wait until Stop. It does not automatically start audio in the background.

## MP4 export fails

Native recording may produce WebM. The music studio's Save as MP4 converts WebM using locally installed FFmpeg. Explanation videos currently save the native browser format. If FFmpeg is missing, install it separately and restart VS Code, or save the original video. Include the exact conversion error in a bug report.

## Download or installation problems

Download the ZIP from the README, extract it, then install its VSIX rather than the ZIP itself. Requires desktop VS Code 1.90+. The extension is disabled in untrusted workspaces. Review the extension source before trusting it.

## Replay reports unsupported code

Replay intentionally supports only the documented synchronous JS/TS subset. Async code, callbacks, surrounding module state and host APIs are unavailable. Use static explanation for that source, or select a smaller supported function with JSON inputs. [Execution model](docs/EXECUTION_REPLAY.md)

## Change explanations cannot load HEAD or a PR file

Local comparison needs a tracked JS/TS file with a readable version at HEAD. Paste versions manually for new/renamed paths. PR comparison needs an open, unmerged PR, accessible regular UTF-8 source blobs and a stable head; refresh the report after changes. [Change guide](docs/CHANGE_EXPLANATIONS.md)

## Narration or explanation recording fails

Use a local mono/stereo WAV or MP3 of at most 120 seconds and 15 MB. Fit scene timing if narration is longer than the video, then preview and adjust boundaries. Keep the explainer view visible while recording. Hiding it discards that recording. For large outputs, shorten the script; the limit is 50 MB. Source hiding only affects the code panel, so also review captions/audio. [Video guide](docs/EXPLANATION_VIDEO.md)
