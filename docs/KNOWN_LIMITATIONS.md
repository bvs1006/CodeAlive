# Alpha limitations

- Code soundtrack mode uses text-pattern mapping, not full AST parsing or execution. Live sorting mode runs only the two built-in algorithms on user-entered numbers.
- 50,000-character input limit; select sections of larger files.
- No local test/build/terminal telemetry. The PR companion can read existing GitHub CI evidence, but does not run or validate it.
- Desktop VS Code only; no browser-extension entrypoint or Marketplace listing.
- Recording depends on embedded browser support and performance. Format may be WebM.
- WebM-to-MP4 conversion needs local FFmpeg with libx264/AAC. Conversion is local and time-limited.
- Videos can show code unless Hide source is enabled.
- Sharing copies a sample/style link, not a saved performance or editor source. The currently hosted browser demo is private.
- Follow editor changes source, not automatic music playback.
- No narration, thumbnails, batch exports or automated YouTube uploads.
- The standalone web alpha does not yet include the extension's newer templates/presets.

User testing confirmed sample playback and selection loading in a real installation. Other OS/browser combinations and full recording workflows still need testing.

Sorting input accepts 3–18 integers from 1–99. Preview speed controls operation playback; recording fits the whole trace to the selected duration. Pause and Step are preview-only. Sorting inputs and playback controls are not part of saved branding presets.

Comparison mode treats each comparison and swap as one equal-cost operation. It excludes pivot/partition markers from the shared timeline; results are not wall-clock timing. Only the two bundled implementations are compared.

PR companion: required-check coverage and semantic correctness are not verified. Anonymous API limits, private repository permissions, data truncation and head changes can limit the evidence. See PR_COMPANION.md.
