# First code explanation

These steps use the [1.0 beta VSIX or offline ZIP](https://github.com/bvs1006/CodeAlive/releases/tag/v1.0.1).
To build from source instead, follow [DEVELOPMENT.md](DEVELOPMENT.md).

1. Download the 1.0 beta VSIX (also included in the offline ZIP), then install `codealive-1.0.1.vsix` through VS Code's Extensions menu.
2. Close older CodeAlive tabs and run **Developer: Reload Window** after upgrading.
3. Select a JavaScript or TypeScript function and run **CodeAlive: Explain Selected Code**.
4. Choose Plain language or Developer. Select a step or flow node to reveal its source.
5. Use **Load editor** after editing the original file to refresh the explanation.

Without VS Code, open `browser/explain.html` from the ZIP. It works locally without an account or API key. Start with the discount example. See the [explanation guide](EXPLAIN_CODE.md) for scope selection, keyboard navigation and limits.

Run **CodeAlive: Open CodeAlive** for a common starting point. In development builds after the published 1.0.1 beta, a JS/TS editor also has an **Open CodeAlive** toolbar button (`</>`): either entry explains the current selection, or the whole file without a selection. Reopening from the CodeAlive panel preserves your work. This shortcut is pending the next installer release.

Use the navigation bar to reach Explain, Replay, Compare, Review PR or Create video. Each action moves keyboard focus to its controls without clearing your entered values. Replay and video prepare the explanation if needed, then wait for you to run or record. PR review appears in VS Code; the offline browser offers the four local workflows.

# First CodeAlive video

1. Install the ZIP's VSIX through VS Code's Extensions menu.
2. Open a file and run CodeAlive: Open Studio.
3. Load editor file or use CodeAlive: Load Selection. Start with a short function.
4. Choose a template and style. Adjust the three captions to describe what viewers see accurately.
5. Set a title and creator name. Enable Hide source if needed.
6. Click Save preset to reuse these settings. Only video settings are stored, not code.
7. Choose 15 seconds and Record video. Keep the studio visible throughout recording.
8. Preview the clip, then Save video or Save as MP4.
9. Open the saved clip outside VS Code and verify sound, captions, readability and format before uploading it yourself.

On macOS, Cmd+Shift+P opens the Command Palette. Windows/Linux use Ctrl+Shift+P.

In code soundtrack mode, Algorithm Performance is structure-inspired. For actual execution, choose Performance → Live sorting algorithm and run Bubble Sort or Quick Sort on your list. The studio does not execute editor source.

Suggested hooks: “What does Python sound like?”, “My code composed this soundtrack”, or “A sorting algorithm, reimagined as music.”

For help, use [GitHub Issues](https://github.com/bvs1006/CodeAlive/issues/new/choose).

## First comparison clip

Select Performance → Bubble vs Quick comparison. Try `8, 3, 6, 1, 9, 2, 5, 4`. Use a title such as “Same input. Two sorting algorithms.” Preview at 4 operations/s, then record 20 seconds. Pause and Step are preview-only. Try `1, 2, 3, 4, 5` for a contrasting outcome. The closing verdict refers to operations on that list, not universal algorithm speed.

## Follow the new workflows

- **Explain Selected Code:** select a complete JS/TS function, inspect steps and a static flow diagram. [Guide](EXPLAIN_CODE.md)
- **Replay an input:** enter JSON arguments and explicitly run the bounded interpreter; step through values and pin a run for comparison. [Supported subset](EXECUTION_REPLAY.md)
- **Explain Working Tree Changes:** compare HEAD with the active editor buffer. The explainer also accepts pasted versions; the PR companion can load open-PR files with revision-bound evidence. [Guide](CHANGE_EXPLANATIONS.md)
- **Explain it in a video:** choose steps, edit captions/timing, import narration, preview and record with optional music. [Guide](EXPLANATION_VIDEO.md)

Use one release and its matching installer. See the [release checklist](RELEASE_CHECKLIST.md) for the full acceptance workflow and remaining manual checks.
