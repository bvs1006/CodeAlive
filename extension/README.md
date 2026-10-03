# CodeAlive — VS Code alpha 0.1.1

Requires desktop VS Code 1.90 or newer and a trusted workspace.

## Install

Extensions view → `...` menu → **Install from VSIX...** → select `codealive-0.1.1.vsix`.

Alternatively: `code --install-extension codealive-0.1.1.vsix`.

## Test

1. Open a source file. Run **CodeAlive: Load Active File** from the Command Palette, or select code and run **CodeAlive: Load Selection**.
2. Press **Make it alive**. Check styles, volume, Stop and replay.
3. Toggle **Follow editor** and edit your file. Changes load after a short delay; during playback, they wait until Stop. Playback always needs a click.
4. Set a title and name, optionally hide source, and record 15 seconds. Preview, choose **Save video**, then verify the saved video has audio.

Commands: Open Studio, Load Active File, Load Selection, Toggle Follow Editor.

## Privacy and limits

Source stays local and is never executed. Maximum 50,000 characters and 50 MB per recording. Videos contain source unless hidden. Only user-selected video paths are written; workspace source is never modified. No telemetry or network requests are made. Copied sample links omit your source.

This alpha uses text-pattern mapping, not a full parser, tests/build telemetry or runtime events. Python and Terraform/HCL have their own mapping; YAML uses Kubernetes, and other languages use the JavaScript mapping. Live editor following updates source, not an automatic background soundtrack.

MP4 recording is preferred when supported by VS Code's embedded browser; WebM is the fallback. For WebM conversion using a separately installed FFmpeg:

`ffmpeg -i input.webm -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart output.mp4`

Package structure, JavaScript syntax and mocked integration tests were checked. Real VS Code installation and encoded audio/video have not been tested here. Test locally before distributing widely.

## Distribution

- Send the VSIX directly to alpha testers, or attach it to a GitHub release.
- For Marketplace publication, register your own publisher, replace provisional `codealive-local` in package.json, choose a license, add a product icon/repository metadata, test Windows/macOS/Linux, then use Microsoft's maintained `@vscode/vsce` packaging and publishing tool. This is not a Marketplace listing.
- The browser demo remains another option; its current access is private, so copied sample links are not public launch links yet.
- Static hosting of the earlier browser build is available. PWA installation, Open VSX publication and standalone Electron/Tauri installers are potential follow-ons, not included here.

## Source

VSIX is a ZIP archive. Extract its `extension/` directory to edit readable source. `node test-extension.cjs` runs mocked integration checks. `python3 package.py` builds the local VSIX without network dependencies. Use Microsoft's `vsce` for Marketplace submission.

Official references:
https://code.visualstudio.com/api/extension-guides/webview
https://code.visualstudio.com/api/working-with-extensions/publishing-extension

All rights reserved pending the owner's choice of a distribution license.

## 0.1.1 editor connection update

Uses the last active or visible text editor when the studio has focus. Includes a Load editor file button, source receipt acknowledgment with retries, and visible bridge/startup errors. Close old studio tabs and reload the VS Code window after installing.

## Video Studio 0.2.0

Choose Code Soundtrack, Algorithm Performance or Project Showcase. Customize the opening, middle and closing captions. Captions are burned into the video; titles and username remain visible. Music progresses through intro, buildup, peak and a resolving ending. Algorithm Performance is inspired by the code structure; it does not execute the algorithm.

Save preset stores your template, captions, branding, style, tempo, duration and source-hiding choice in local VS Code settings storage. Source is excluded. The preset is restored when the studio opens.

Save as MP4 uses native MP4 when supported; for WebM it invokes `ffmpeg` from your machine's PATH locally. FFmpeg must be installed separately with libx264 and AAC support. Missing FFmpeg produces an actionable error; the original recording remains available through Save video. Conversion uses a temporary directory, no shell and a three-minute timeout, and cleans up temporary files. Encoding has not been tested on your computer.

Install 0.2.0, close studio tabs, run Developer: Reload Window, then Open Studio and Load editor file or Load Selection. Test a 15-second recording first.

Validation for 0.2.0: mocked app and editor checks passed; caption and section checks passed; a real sample WebM was converted locally and ffprobe confirmed H.264 video, yuv420p pixels and AAC audio. This does not replace VS Code recording QA on your device.

## Sorting Studio 0.3.0

Performance → Live sorting algorithm runs built-in Bubble Sort or Quick Sort on 3–18 integers (1–99). Pause/Step/Resume inspect preview operations; Record fits the whole trace to the chosen duration. Editor code is never executed. Run `node test-sorting.cjs` and `node test-sorting-app.cjs`. 212 traces and mocked playback/recording controls passed; real VS Code recording still needs device testing.

## Comparison Studio 0.4.0

Choose Performance → Bubble vs Quick comparison. Shared input and equal comparison/swap ticks drive two panels, counters and distinguishable sounds. The quicker-to-finish trace holds its result. This is not a CPU benchmark; pivot and partition annotation events are excluded from the operation timeline. Quick Sort uses a last-element pivot, so sorted input may favor Bubble Sort's early-exit implementation. Run `node test-comparison.cjs` and `node test-comparison-app.cjs`.
