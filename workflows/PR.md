# PR Workflow

Submit completed work as a pull request on GitHub.

## Steps

1. Check whether the current branch already has a PR using the `mcp__github__list_pull_requests` tool
   (`owner=christianalfoni`, `repo=building-ai-confidence`, `head=<branch>`).
   - If the result is `MERGED` or `CLOSED`, stop and create a new branch instead:
     ```bash
     git checkout main && git pull && git checkout -b <new-branch-name>
     ```
2. Determine a branch name from the changes — short, kebab-case, descriptive (e.g. `fix/login-redirect`, `feat/user-profile`).
3. Check out (or create) that branch:
   ```bash
   git checkout -b <branch-name>
   ```
4. If a work folder exists for this branch (`work/YYYY_MM_DD_<branch-name>/`), capture agent sessions so they are included in the commit:
   ```bash
   ./scripts/capture-agent-sessions
   ```
   This writes one Markdown file per agent session into the branch work folder. If no work folder exists, skip this step.
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
7. Run lint before submitting:
   ```bash
   npm run lint
   ```
   Fix any errors before continuing.

8. Create or update the PR using MCP tools:
   - **No open PR exists:** call `mcp__github__create_pull_request` with `owner=christianalfoni`,
     `repo=building-ai-confidence`, `head=<branch>`, `base=main`, `title`, and `body`.
   - **Open PR exists:** call `mcp__github__update_pull_request` with `owner=christianalfoni`,
     `repo=building-ai-confidence`, `pullNumber=<number>`, `title`, and `body`.

   Use this template for the body:

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

   **Including screenshots in a PR:** If the change touches UI, take before/after screenshots using `./scripts/screenshot`, then generate the embed markup with:
   ```bash
   ./scripts/screenshot-url <before-name> <after-name>
   ```
   This prints a ready-to-paste `<a>/<img>` block for each name. Paste the output directly into the PR body under the relevant section. Screenshot names may include or omit the `.png` extension.

   Omit any section that has nothing meaningful to say (e.g. a brand-new feature has no "Current behavior").
9. Report the PR URL to the user.

## Rules

- Never commit directly to `main`.
- One logical change per branch. If the plan covered multiple unrelated concerns, split them into separate branches.
- The PR title must follow the same conventional commit format as the commit message.
- Do not force-push a branch that already has an open PR unless the user explicitly requests it.
