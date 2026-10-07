# Narrated explanation videos — 1.0 beta candidate

Use **Explain it in a video** after explaining a JS/TS function. This workflow works in the offline browser bundle and VS Code explainer. It captures a short, editable explanation with captions, source highlights and optional local audio.

## Create and review a clip

1. Choose **Static explanation** or run Replay and select **Captured replay**. Refresh the step range if a new replay was captured. Choose 1–20 consecutive steps and **Build editable script**.
2. Include/exclude scenes, edit captions, set a title and adjust seconds per scene. The editor shows each included scene's start/end time. Static scenes follow source order and do not establish runtime behavior; replay scenes retain the captured input label.
3. Import your recorded narration (WAV/MP3 or another format supported by the browser). Audio is read locally and is never uploaded. Automatic speech synthesis and microphone capture are not part of this version.
4. **Fit scene timing to narration** scales durations proportionally. Preview the timeline and refine the durations to align captions/highlights with your spoken words. This is not automatic word-level alignment. Narration longer than the video must be fitted before recording; shorter narration leaves an unvoiced tail.
5. Optionally enable quiet background music. A synthesized tone progression follows scene boundaries beneath the voice. **Hide source panel** removes the source panel from rendered frames; captions and narration remain as supplied, so review them separately.
6. Preview, then **Record explanation video**. Recording takes the duration of the timeline. Keep the view visible. Stop produces a labeled partial clip; hiding the view or changing source discards the active recording.
7. Review the encoded video/audio before **Save video**. Browser mode downloads a file; VS Code opens a Save dialog. Nothing is uploaded or published automatically.

Changing source/scope clears its script and narration. Editing captions, timing or output settings invalidates the old export. Reloading the view loses the in-memory script/audio; persistent project files are not included yet.

## Format and limits

Vertical 1080 × 1920 canvas, captured at a requested 30 fps. MP4 is preferred when supported; otherwise WebM. The existing studio's FFmpeg conversion remains separate; explanation export saves its native browser format.

Up to 20 included scenes, 0.5–15 seconds each, 120 seconds total; captions up to 240 characters; title up to 80. Narration accepts known-duration mono/stereo audio up to 120 seconds and 15 MB. Export stops at 50 MB. Source is limited to 50,000 characters. A frame displays up to 13 source lines and crops long lines; use short focused examples and preview the output.

## Implementation and evidence

`shared/movie-engine.js` validates the timeline and renders frames; `movie-ui.js` owns scene editing, narration import, Web Audio mixing, clock-based playback and MediaRecorder. `extension/video-save.js` validates size, encoding/header and the user's chosen destination. CSP allows local blob media while keeping network connections blocked.

Unit checks cover scene boundaries, source ranges, captions/duration limits, source-panel hiding and Save validation/cancellation. Chromium tests import a known audio signal, mix optional music, record both browser and extension-webview pages, inspect audio/video tracks/duration/dimensions, and verify that both imported audio and music are present in the encoded samples. Screenshots and an encoded frame are CI artifacts. Real Linux VS Code activation/upgrade/commands remain a separate gate. Physical audio-device checks and Windows/macOS desktop recording remain manual work.
