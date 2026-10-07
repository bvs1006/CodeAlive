# CodeAlive 0.7.0 alpha preview

Adds explicit execution replay to local JavaScript/TypeScript explanations. Enter JSON arguments, run a documented synchronous subset, inspect variable snapshots and branch decisions, step or play the trace, and pin a run to compare inputs. Both browser and VS Code packages include this workflow.

The interpreter has operation, step, recursion, snapshot and input limits. It cannot access browser/Node globals, files, network or modules; async code, callbacks and surrounding application state are unsupported. Static explanation never starts execution. Results describe the chosen interpreter run, not application correctness. See EXECUTION_REPLAY.md for supported semantics.

Validation includes trusted-fixture comparisons with JavaScript, source ranges, early returns, loops, recursion, initialization, assignment order, immutable snapshots, rejection of unsupported access, resource limits, browser controls and the existing multi-platform and installed-VSIX suites. See the PR checks for the exact tested commit. Physical audio-device and Windows/macOS desktop integration checks remain pending.

This is a feature-branch preview. Merging and public release await approval; main still contains the 0.5 runtime.
