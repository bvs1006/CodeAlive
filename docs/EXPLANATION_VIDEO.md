# Narrated explanation videos — 1.0 beta

Use **Explain it in a video** after explaining a JS/TS function. This workflow works in the offline browser bundle and VS Code explainer. It captures a short, editable explanation with captions, source highlights and optional local audio.

## Create and review a clip

1. Choose **Static explanation**, run Replay and select **Captured replay**, or click **✨ Generate AI scenes** to automatically produce a 3–6 scene pedagogical script. In VS Code, this connects to available language models (`vscode.lm`) with automatic local heuristic fallback; in the offline browser, it uses the local heuristic engine. You can also copy a formatted prompt with **Copy AI prompt** or apply external model outputs with **Paste AI JSON**.
2. Include/exclude scenes, edit captions, set a title and adjust seconds per scene. The editor shows each included scene's start/end time. Static scenes follow source order; replay scenes retain captured inputs; AI scenes provide a narrative overview, guard/condition walkthrough, core recursion/body focus, and summary.
3. **Add Narration**: Either import a pre-recorded audio file (WAV/MP3 up to 15 MB), or click **🎙️ Generate Voice** to synthesize neural voice narration directly. Speech comes from the engine in `codealive.narration.engine`: `system` (default; macOS `say`, Windows built-in speech voices, or `espeak-ng`/`espeak` on Linux; entirely local), `online` (Microsoft neural voices through `uvx edge-tts` and ffmpeg; **sends scene caption text to Microsoft's speech service** and may download `edge-tts` on first use) or `tone` (a wordless placeholder with speech-like timing). If the chosen engine is not available, generation stops and says why; it never switches engines. Run **CodeAlive: Check Voice Setup** to see what is installed. Generation runs in the background with progress and a Cancel button, and each scene's audio is reused until its caption, voice or engine changes. During preview with no loaded audio, browser speech synthesis (`window.speechSynthesis`) can read out scene captions.
4. **Fit scene timing to narration** scales durations proportionally to match voice length. Generated voice narration automatically measures spoken audio duration and adjusts scene boundaries to align seamlessly. Preview the timeline and refine the durations as needed.
5. Optionally enable quiet background music. A synthesized tone progression follows scene boundaries beneath the voice, with automatic audio ducking to maintain crisp voice clarity. Toggle **CC · Subtitles** to display on-screen closed-caption cards, or **Hide source panel** to focus strictly on narration and captions.
6. Preview, then **Record explanation video**. Recording takes the duration of the timeline. Keep the view visible. Stop produces a labeled partial clip; hiding the view or changing source discards the active recording.
7. Review the encoded video/audio before **Save video**. Subtitles can also be saved independently in SRT or WebVTT format using **Export subtitles**. Browser mode downloads a file; VS Code opens a Save dialog. Nothing is uploaded or published automatically.

Changing source/scope clears its script and narration. Editing captions, timing or output settings invalidates the old export. Reloading the view loses the in-memory script/audio; persistent project files are not included yet.

During preview and recording, the live region announces the scene number and caption once when each scene starts. The elapsed clock remains visible without generating continuous announcements. Restarting a preview announces its first scene again; editing or clearing the script removes the previous scene announcement. Screen-reader testing on physical devices remains pending.

## Format and limits

Supports 16:9 landscape (1920 × 1080) for YouTube and presentations, or 9:16 vertical (1080 × 1920) for Shorts/Reels, captured at a requested 30 fps. Standalone subtitles can be exported as `.srt` or `.vtt`. MP4 is preferred when supported; otherwise WebM. The existing studio's FFmpeg conversion remains separate; explanation export saves its native browser format.

Up to 20 included scenes, 0.5–15 seconds each, 120 seconds total; captions up to 240 characters; title up to 80. Narration accepts known-duration mono/stereo audio up to 120 seconds and 15 MB. Export stops at 50 MB. Source is limited to 50,000 characters. Vertical frames display up to 13 source lines; landscape frames display up to 18 lines and crop long lines; use short focused examples and preview the output.

## Implementation and evidence

`shared/movie-engine.js` validates the timeline, renders vertical and landscape frames, and generates formatted SRT/VTT subtitles; `shared/ai-script.js` handles line-to-byte range mapping, prompt generation, JSON validation, and local pedagogical heuristics; `movie-ui.js` owns scene editing, format selection, AI script actions, subtitle export, narration import, Web Audio mixing, clock-based playback and MediaRecorder. `extension/explain-panel.js` bridges `vscode.lm` chat requests to the webview. `extension/video-save.js` validates size, encoding/header and the user's chosen destination for videos and subtitles. CSP allows local blob media while keeping network connections blocked.

Unit checks cover scene boundaries, source ranges, captions/duration limits, 16:9 landscape rendering, SRT/VTT formatting, AI prompt/JSON parsing, line mapping, heuristic fallback, source-panel hiding and Save validation/cancellation. Chromium tests import a known audio signal, mix optional music, record both browser and extension-webview pages, inspect audio/video tracks/duration/dimensions, and verify that both imported audio and music are present in the encoded samples. Screenshots and an encoded frame are CI artifacts. Real Linux VS Code activation/upgrade/commands remain a separate gate. Physical audio-device checks and Windows/macOS desktop recording remain manual work.

## Scene visuals and overlay (9:16 only)

**Load sample explainer** fills the panel with a four-scene example (diagram, table, meter, typed code, plus the overlay) so you can see every scene type at once and edit from there. **Paste AI JSON** accepts two optional extras, so a script can look like an animated explainer and not only a caption over source lines. 16:9 ignores them and keeps the source-panel layout.

```json
{
  "title": "MCP and Code Mode",
  "overlay": { "handle": "@yourhandle", "tag": "MCP TODAY", "badge": { "label": "THE FIX", "text": "???" } },
  "scenes": [
    { "caption": "The MCP server sits between the agent and every tool.", "startLine": 1, "endLine": 1, "duration": 5,
      "visual": { "type": "diagram", "left": "AI", "leftNote": "AI AGENT", "hub": "MCP", "hubNote": "STANDARD PROTOCOL", "items": ["calendar", "database", "email"] } },
    { "caption": "Every tool definition lands in the context window.", "startLine": 1, "endLine": 1, "duration": 5,
      "visual": { "type": "meter", "value": 5.85, "label": "CONTEXT WINDOW", "sub": "200K TOKENS", "big": "1,170,000", "unit": "TOKENS", "note": "more than the entire context window" } },
    { "caption": "Code Mode lets the AI write the loop itself.", "startLine": 1, "endLine": 1, "duration": 6,
      "visual": { "type": "typed", "file": "trip.ts", "badge": "written by the AI", "code": "for (const item of list) {\n  grab(item)\n}" } }
  ]
}
```

- **`diagram`**: a left box, a vertical hub and 1–4 labelled targets. Connectors draw in over the scene.
- **`meter`**: a bar that fills to `value` (1 = full). Above 1 it turns red and shows `×N OVER LIMIT`.
- **`table`**: up to 3 columns and 6 rows, e.g. `{"type":"table","columns":["MCP SERVER","TOOLS","TOKENS"],"rows":[["GitHub",35,"26K"],["Slack",11,"21K"],["Sentry",5,"3K"]],"highlight":2,"note":"Anthropic's example"}`. Rows fade in one by one, the first `highlight` rows stay bright and the rest dim, and `note` prints underneath.
- **`shelf`**: a flat illustration of a shop shelf for analogies. `rows` is up to 3 shelves of up to 7 items from `milk, almond, eggs, bread, jar, bottle, box, box2, coffee, cheese, banana, apple, soldout` (unknown names are dropped). Optional `sign` ("GROCERY"), `figure` (a shopper with a basket and a name bubble), `callout` (a red tag such as "x 40 LABELS") and `phone`, a card with a `title`, up to 6 typed `lines`, an optional big `time` (used when there are no lines) and a `count` with a `countLabel` that counts up beside it.
- **`typed`**: a code window that types itself out with a caret (up to 12 lines and 600 characters).
- **`overlay`**: `handle` (top left), `badge` (dashed box, top right) and `tag` (section label), drawn on every frame.

Strings are clamped (labels 8–24 characters, notes 140) and anything malformed is dropped, so a bad visual falls back to the normal source panel. These are flat vector scenes drawn in code, with one built-in shelf illustration; and the line "startLine/endLine" is still required because captions and highlights use it.

### Presenter webcam (9:16 only)

Tick **Presenter webcam, vertical video only** before Preview or Record. The browser asks for camera access when the clip starts, and the picture is cropped to a circle at the bottom left of the frame (clear of the caption card; the progress bar and clock move right to make room). Video only: the soundtrack is still your narration and music, not the camera's microphone. Nothing is uploaded, and the camera stops when the clip ends or is stopped. If access is denied, there is no camera, or the host (a VS Code webview) does not offer one, the clip does not start and the status line says so; untick the option to continue.

## Optional: render offline with HyperFrames

For a repeatable MP4 without real-time recording, export a script and render it with [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache-2.0). This is a developer-side script, not part of the VSIX, and the product never runs HyperFrames itself.

```
node scripts/export-hyperframes.cjs --script script.json --source code.js --out my-video \
     [--aspect 9:16|16:9] [--narration voice.wav] [--music] [--hide-source] [--no-captions] [--gsap gsap.min.js]
cd my-video && npx hyperframes@0.8.223 render -o video.mp4
```

`--script` is the same JSON that **Paste AI JSON** accepts, and `--source` is the code it explains, so every limit above applies unchanged. `--narration` takes a WAV, MP3 or M4A of up to 15 MB; its scene timing must already fit, because the script does not re-time scenes. `--music` adds a quiet synthesized bed and needs ffmpeg. The output folder must be new or empty, and holds `index.html`, `movie-engine.js`, `plan.json`, `assets/` and a short README.

The exported page draws each frame with the product's own canvas renderer (`shared/movie-engine.js`), so scenes, overlay, source highlights and captions match the in-product video. Rendering needs Node 22+, ffmpeg and Google Chrome, and was tested with HyperFrames 0.8.223. Differences to expect:

- HyperFrames substitutes its own fonts, so monospace text is slightly different. Across the scene types and both aspect ratios, sampled frames compared at SSIM 0.95–0.98 against the in-product canvas.
- The presenter webcam is not available, because it needs a live camera.
- GSAP loads from a CDN during rendering unless you pass `--gsap`.
- Rendering is not faster than real time: a 16-second clip took about 27 seconds on an Apple M1.
