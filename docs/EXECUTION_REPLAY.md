# Execution replay — 1.0 beta candidate

After explaining a JavaScript or TypeScript function, open **Replay an input**, enter its arguments as a JSON array and choose **Run with these inputs**. Static explanation never starts a run. For `discountedPrice(price, percent)`, try `[100,20]`, pin the result, then try `[200,50]`.

Replay records the order of operations, variable snapshots, condition values, writes and return/throw results. Previous/Next, Play/Pause and the timeline slider move through that captured trace and highlight exact source ranges. Pinning a run retains its input, result and step count while you try another input. Editing source or changing scope clears the trace and its baseline.

## Supported execution model

This is an interpreter for a deliberately limited synchronous JS/TS subset. It does not evaluate JavaScript in the host, import modules, access the DOM, use Node APIs or make network requests. Surrounding module state and closures are unavailable. TypeScript annotations are parsed but not type-checked.

- Plain functions and arrow functions, identifier parameters and parameter defaults.
- Finite numbers, strings, booleans, null/undefined, dense arrays and plain objects.
- `let`/`const`, block scopes and temporal-dead-zone checks, assignments, property writes and numeric updates.
- Arithmetic/comparison/boolean expressions, short-circuiting, conditional expressions and template strings.
- `if`, `for`, `for…of` arrays/strings, `while`, `do…while`, unlabelled break/continue, return and throw.
- Recursive self-calls; `new Error(message)`; numeric `Math.abs/floor/ceil/round/min/max/pow`.
- Array `push/pop/slice` and string `trim/toUpperCase/toLowerCase` within the limits below.

Async/generator functions, callbacks, nested function definitions, imports, classes, getters, destructuring, spread, `var`, try/catch/finally, switch, labelled jumps, host globals and other methods are unsupported. Unsupported constructs report an error; partial traces remain inspectable when execution had already begun. The static explainer can still analyze many of these constructs.

This is not a general JavaScript sandbox or a reproduction of your application's full runtime. Results apply to the chosen function, JSON arguments and the supported interpreter semantics. Non-finite numbers, object-to-primitive coercion, sparse arrays and prototype-related property access are rejected. Tagged trace values identify undefined, uninitialized and circular values.

## Limits

50,000 source characters; 10,000 input characters; 10,000 interpreter operations; 300 trace steps; 12 nested calls/input levels; 400 array items; 100 object properties; 2,000 characters per string; 300,000 serialized trace characters and 10,000 visited values per snapshot. Shadowed Math/Error built-ins are conservatively rejected anywhere in the supplied source. Hitting a limit stops the run with a reason. Runs are bounded and local, and arguments are parsed into fresh owned values.

## Implementation and checks

`shared/replay-engine.js` owns the interpreter and trace model. `shared/replay-ui.js` owns input/run/playback/baseline controls. Both are packaged into the browser and VS Code alongside the existing explainer.

Tests compare supported cases with real JavaScript on trusted fixtures, check scope/initialization and assignment order, early returns, loops/jumps, recursion, property snapshots, input rejection, blocked host access and resource limits. Browser tests verify explicit execution, values, source highlights, playback and comparing inputs. Existing suites and the installed-VSIX check remain release gates.
