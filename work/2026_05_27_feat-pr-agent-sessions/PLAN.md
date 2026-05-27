# Plan: PR agent session capture and review tooling

## Goal

Add tooling so that agent sessions are captured into the branch work folder before a PR is committed, and so the agent can fetch and address PR review comments in a structured way.

## Tasks

- [x] Create `scripts/capture-agent-sessions` — distills all Claude sessions for the current branch into `work/YYYY_MM_DD_<branch>/`
- [x] Update `workflows/PR.md` — run capture-agent-sessions as step 4 before committing
- [x] Create `.github/copilot-instructions.md` — guide Copilot to review agent process (sessions vs plan) and code separately
- [x] Add `scripts/agent-review` to `.gitignore` — it is a local binary, not a project file
- [x] Document `capture-agent-sessions` in the scripts table in `AGENTS.md`
- [x] Create `scripts/pr-review-comments` — fetches all inline and overall review comments for the current PR
- [x] Create `workflows/REVIEW.md` — agent proposes fixes for each comment, waits for user approval, then applies and commits
- [x] Document `pr-review-comments` and the review workflow in `AGENTS.md`
