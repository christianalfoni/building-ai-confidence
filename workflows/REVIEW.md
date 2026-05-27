# Review Workflow

Address feedback from a PR review — inline comments and overall reviewer notes.

## Steps

1. Fetch all review comments for the current branch's PR:
   ```bash
   ./scripts/pr-review-comments
   ```

2. For each comment, read the referenced file at the relevant location to understand the full context around the diff hunk.

3. For each comment, formulate a concrete fix. Present all fixes to the user as a numbered list before touching any code:

   ```
   [1] workflows/PR.md — add a note that capture-agent-sessions requires a work folder to exist
       → Add a prerequisite sentence to step 4.

   [2] scripts/capture-agent-sessions — exit gracefully if no sessions are found instead of erroring
       → Change the empty-sessions check to print a warning and exit 0.

   Apply all, none, or list the numbers you want applied (e.g. "1 3"):
   ```

4. Wait for the user to confirm which fixes to apply. Do not make any code changes before this confirmation.

5. Apply only the approved fixes, one at a time. After each fix, briefly state what changed.

6. Once all fixes are applied, run the capture and commit steps from the [PR workflow](PR.md) (starting at step 4) to update the PR with the new changes.

## Rules

- Never apply a fix the user has not explicitly approved.
- If a comment is ambiguous, state your interpretation in the proposed fix and let the user correct it before applying.
- If two comments conflict, surface the conflict to the user rather than picking one silently.
- One commit per logical group of fixes — don't make a separate commit per comment unless the user asks.
