# Beta limitations

- Code soundtrack mode uses text-pattern mapping, not full AST parsing or execution. Live sorting mode runs only the two built-in algorithms on user-entered numbers.
- 50,000-character input limit; select sections of larger files.
- No local test/build/terminal telemetry. The PR companion can read existing GitHub CI evidence, but does not run or validate it.
- The extension needs desktop VS Code; there is no browser-extension entrypoint or Marketplace listing. The standalone browser explainer is included in the download.
- Recording depends on embedded browser support and performance. Format may be WebM.
- WebM-to-MP4 conversion needs local FFmpeg with libx264/AAC. Conversion is local and time-limited.
- Videos can show code unless Hide source is enabled.
- Sharing copies a sample/style link, not a saved performance or editor source. The currently hosted browser demo is private.
- Follow editor changes source, not automatic music playback.
- Narrated explanation videos accept imported audio in the 1.0 beta. No automatic speech generation, thumbnails, batch exports or automated YouTube uploads.
- The standalone web alpha does not yet include the extension's newer templates/presets.

User testing confirmed sample playback and selection loading in a real installation. Other OS/browser combinations and full recording workflows still need testing.

Sorting input accepts 3–18 integers from 1–99. Preview speed controls operation playback; recording fits the whole trace to the selected duration. Pause and Step are preview-only. Sorting inputs and playback controls are not part of saved branding presets.

Comparison mode treats each comparison and swap as one equal-cost operation. It excludes pivot/partition markers from the shared timeline; results are not wall-clock timing. Only the two bundled implementations are compared.

The music studio honors the system's reduced-motion preference in both the browser and VS Code: decorative waves, moving particles and the audio spectrum stay still. Changes to the preference apply without reloading. Source highlights, playback progress, sorting operations and video scenes still update when you start playback or recording. Recordings use the same canvas treatment. Automated checks cover this behavior; physical-device and screen-reader acceptance remain pending.

PR companion: required-check coverage and semantic correctness are not verified. Anonymous API limits, private repository permissions, data truncation and head changes can limit the evidence. See PR_COMPANION.md.

## Code explanations

JavaScript and TypeScript only. Static parsing does not execute or type-check code, infer business intent, resolve calls/imports or prove correctness. Expression-level paths remain inside statements; try/catch/finally, switch and labeled blocks are collapsed with warnings. The diagram is not a complete runtime control-flow graph.

Limits: 50,000 characters, 100 listed functions, 80 steps, 100 diagram nodes, 12 return expressions and 12 calls/property writes. Large diagrams are omitted. Partial selections must parse as valid code. The source-order step list may include unreachable source; simple unreachable statements are removed from the diagram.

Editor source links require the captured document version; after a change, use Load editor again. Editing the playground detaches its editor mapping. Shared generated assets must be built before running or packaging the extension.

## Explicit execution replay

The 0.7 preview interprets a limited synchronous JavaScript/TypeScript subset only after Run. It does not reproduce module state, closures or your full runtime. Unsupported syntax/methods, host APIs, async functions and non-finite numbers stop the run with a reason. Calls, operations, trace size and input structures are bounded; highly shared or cyclic structures are limited in snapshots. See [the execution model](EXECUTION_REPLAY.md).

## Before/after explanations

Structural comparisons support JavaScript/TypeScript and at most 50,000 characters and 100 functions per version, with 200 observations. They do not infer behavioral equivalence, execute/type-check code or establish correctness. Unique function names are paired; renames appear as removal/addition, and ambiguous names require inspecting the whole-file source. Formatting/comments are ignored for structural comparison.

Working-tree comparison requires a local tracked file with a readable HEAD version; it includes unsaved editor changes. PR comparison supports open, unmerged PRs and reads regular UTF-8 source blobs at pinned revisions, with up to 20 path components; symlinks, submodules, unavailable forks and incomplete trees are rejected. CI evidence remains a timestamped snapshot; test-file links are a filename heuristic, not coverage. Signed-in private PR behavior still needs a manual account-based smoke test.

## Explanation videos

Import a local narration recording; text-to-speech and microphone recording are not included. Timing fit is proportional, not automatic word alignment: preview and edit scene boundaries. Static steps may include unreachable source; replay scenes describe only the captured interpreter input. Scripts are limited to 20 scenes, 0.5–15 seconds each and 120 seconds total. Narration is mono/stereo, at most 120 seconds and 15 MB. Output stops at 50 MB.

Source hiding affects the rendered source panel only; captions and narration may still contain code. Source windows crop long lines and show up to 13 lines around each highlight. Captions are capped at 240 characters; preview wrapping on the actual frame. Recording uses the local browser's supported MP4/WebM format and runs in real time. Hiding the view discards an active recording; Stop creates a labeled partial clip. Devices, codecs and system performance can affect results. Linux Chromium and the VS Code webview policy are automated targets; physical Windows/macOS devices remain manual checks.
