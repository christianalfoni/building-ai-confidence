# PR Workflow

Submit completed work as a pull request on GitHub.

## Steps

1. Determine a branch name from the changes — short, kebab-case, descriptive (e.g. `fix/login-redirect`, `feat/user-profile`).
2. Check out (or create) that branch:
   ```bash
   git checkout -b <branch-name>
   ```
3. Stage and commit changes using the conventional commit prefix that best fits:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `chore:` — tooling, deps, config, scripts
   - `refactor:` — code change with no behaviour difference
   - `docs:` — documentation only
   - `test:` — tests only
   - `style:` — formatting, whitespace
4. Push the branch:
   ```bash
   git push -u origin <branch-name>
   ```
5. Create or update the PR using the script:
   ```bash
   ./scripts/upsert-pr --title "<conventional-prefix>: <short description>" --body "<body>"
   ```
   The script detects whether a PR already exists for the branch and creates or updates it accordingly.

   Use this template for `--body`:

   ```
   ## Current behavior
   ASCII diagram showing how things worked before this change.

   ## New behavior
   ASCII diagram showing what is different after this change.

   ## Assumptions
   Any assumptions made about intent, scope, or implementation that were not explicitly stated.

   ## Considerations
   Approaches explored, pivots made during implementation, or direction changes requested by the user.

   ## Validation
   How the change was verified — tests run, manual steps taken, or edge cases checked.

   ## Instructions followed
   Bullet list of the specific agent instructions (from AGENTS.md or workflow files) that governed this change — so the reviewer can verify compliance.
   ```

   The `Current behavior` and `New behavior` sections must use ASCII diagrams to visually represent the behavioral change — not prose. Use boxes, arrows, and flow notation to make the before/after immediately scannable.

   Omit any section that has nothing meaningful to say (e.g. a brand-new feature has no "Current behavior").
6. Report the PR URL to the user.

## Rules

- Never commit directly to `main`.
- One logical change per branch. If the plan covered multiple unrelated concerns, split them into separate branches.
- The PR title must follow the same conventional commit format as the commit message.
- Do not force-push a branch that already has an open PR unless the user explicitly requests it.
