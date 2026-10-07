# Read-only PR companion and change explanations

## Start

Install the current VSIX, close old panels and run Developer: Reload Window. Run CodeAlive: Review GitHub PR. Paste a real github.com PR URL and select access:

- Public PR without sign-in: anonymous API reads. GitHub rate limits apply.
- Use GitHub sign-in: VS Code manages authentication. Private repository access may require organization authorization. GitHub OAuth `repo` scope is broader than read-only; CodeAlive uses only GET requests with it. The token stays in the extension host and is not sent to the webview or an AI service.

This alpha supports github.com, not GitHub Enterprise Server hosts. API proxy configuration is not implemented.

## Understand the evidence

The panel fetches the PR head commit and, when available for an open PR, the GitHub test-merge commit. Both check runs and legacy commit statuses are shown with their commit label. Test-merge data may not exist, especially while GitHub is recomputing it.

Passed means that individual reported check concluded success. Skipped/neutral are informational, cancelled/action-required need inspection, and pending checks are incomplete. No checks, inaccessible checks, partial file lists and a changed PR head are not passing results. Required branch/ruleset check coverage is not verified. The panel never declares a PR safe to merge.

Only the first reported failure’s available annotation page is retrieved, with up to 20 annotations shown. Summaries are shown as plain text, not generated root-cause analysis. Open check details for the full logs. Links are restricted to HTTPS github.com/docs.github.com; external CI links are not opened by this alpha. The panel offers a PR fallback link.

Changed-file reads cap at 600 files; check/status reads cap at 600 per evidence source. Truncation is disclosed. There is no background polling: click Refresh evidence to reload. Requests have time and response-size limits.

## Review prompts

Prompts come from filenames and change statuses. “No test files in the retrieved diff” does not mean tests are absent or inadequate. Dependency/configuration/deletion prompts are questions for the reviewer, not confirmed defects. The review prompts themselves do not analyze code. The separate **Explain changes** action adds bounded AST observations for JavaScript/TypeScript; it does not establish semantic correctness.

## Explain a changed JS/TS file

For an open, unmerged PR, choose **Explain changes** beside a JS/TS file. The explainer reads the regular UTF-8 file at its exact merge-base and head revisions, supports fork heads and renamed paths, and shows source-linked structural observations. The report's existing checks, full checked revision SHAs, timestamp, warnings and changed test-file links accompany it. Test-file association is a filename heuristic, not coverage evidence.

Moving revisions stop loading and require refresh. Editing either source version detaches old evidence and editor links. Source stays in the local webview after its explicit GitHub read; credentials remain in the extension host. Historical/closed PR versions can be pasted manually. See [the full change guide](CHANGE_EXPLANATIONS.md).

## What it does not do

No code checkout or execution, local command validation, CI reruns, check publication, comments, repository writes, automatic fixes or merge decisions. These need separate future designs and explicit actions.

## Validation

Mocked GitHub tests cover success/failure, annotations, missing/denied evidence, changing commits, truncation and URL restrictions. Mocked VS Code tests cover the command, authentication, content security policy and keeping tokens out of the webview. Additional tests cover pinned Git blobs, forks, renames, moving heads, before/after rendering and evidence detachment. Real Linux VS Code tests exercise extension installation, commands, local Git comparison and source navigation. A signed-in private PR panel still needs a manual account-based smoke test; mocked API tests do not establish that integration.

Report problems through the repository’s GitHub Issues form. Remove confidential check output and source paths before posting a public issue.
