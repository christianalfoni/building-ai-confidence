# PR Workflow

Submit completed work as a pull request on GitHub.

## Steps

1. Check that the current branch is not already associated with a merged or closed PR:
   ```bash
   gh pr view --json state -q .state 2>/dev/null
   ```
   If the result is `MERGED` or `CLOSED`, stop and create a new branch instead:
   ```bash
   git checkout main && git pull && git checkout -b <new-branch-name>
   ```
2. Determine a branch name from the changes — short, kebab-case, descriptive (e.g. `fix/login-redirect`, `feat/user-profile`).
3. Check out (or create) that branch:
   ```bash
   git checkout -b <branch-name>
   ```
4. Capture agent sessions into the work folder so they are included in the commit:
   ```bash
   ./scripts/capture-agent-sessions
   ```
   This writes one Markdown file per agent session into the branch work folder.
5. Stage and commit changes using the conventional commit prefix that best fits:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `chore:` — tooling, deps, config, scripts
   - `refactor:` — code change with no behaviour difference
   - `docs:` — documentation only
   - `test:` — tests only
   - `style:` — formatting, whitespace
6. Push the branch:
   ```bash
   git push -u origin <branch-name>
   ```
7. Create or update the PR using the script:
   ```bash
   ./scripts/upsert-pr --title "<conventional-prefix>: <short description>" --body "<body>"
   ```
   The script detects whether a PR already exists for the branch and creates or updates it accordingly.

   Use this template for `--body`:

   ```
   ## Current behavior
   ASCII diagram or screenshot showing how things worked before this change.

   ## New behavior
   ASCII diagram or screenshot showing what is different after this change.

   ## Assumptions
   Any assumptions made about intent, scope, or implementation that were not explicitly stated.

   ## Considerations
   Approaches explored, pivots made during implementation, or direction changes requested by the user.

   ## Validation
   How the change was verified — tests run, manual steps taken, or edge cases checked.

   ## Instructions followed
   Bullet list of the specific agent instructions (from AGENTS.md or workflow files) that governed this change — so the reviewer can verify compliance.

   ## Work session
   This branch's plan and session artifacts are in `work/YYYY_MM_DD_<branch-name>/`. The plan documents the approach taken, tasks completed, and any deviations. GitHub Copilot can use this folder for context about the work session.
   ```

   The `Current behavior` and `New behavior` sections must visually represent the change — not prose. For UI changes, embed before/after screenshots using uploaded image URLs (see below). For non-UI changes, use ASCII diagrams with boxes, arrows, and flow notation.

   **Including screenshots in a PR:** If the change touches UI, take before/after screenshots using `./scripts/screenshot` and upload each one:
   ```bash
   BEFORE_URL=$(./scripts/upload-screenshot work/<YYYY_MM_DD_branch-name>/screenshots/<platform>-<Component>-<storyName>.png)
   AFTER_URL=$(./scripts/upload-screenshot work/<YYYY_MM_DD_branch-name>/screenshots/<platform>-<Component>-<storyName>.png)
   ```
   Then embed them in the PR body using a linked image tag so the reviewer can click to open full size:
   ```
   ## Current behavior
   <a href="$BEFORE_URL" target="_blank"><img src="$BEFORE_URL" width="600" /></a>

   ## New behavior
   <a href="$AFTER_URL" target="_blank"><img src="$AFTER_URL" width="600" /></a>
   ```

   Omit any section that has nothing meaningful to say (e.g. a brand-new feature has no "Current behavior").
8. Report the PR URL to the user.

## Rules

- Never commit directly to `main`.
- One logical change per branch. If the plan covered multiple unrelated concerns, split them into separate branches.
- The PR title must follow the same conventional commit format as the commit message.
- Do not force-push a branch that already has an open PR unless the user explicitly requests it.
