---
name: debug
description: Diagnose a production or preview error by reading Vercel deployment logs. Investigation only — no code changes.
---

# Debug Workflow

Diagnose a production or preview error by reading Vercel deployment logs. Use this when the user reports unexpected behaviour in the deployed app, a server error, or a failed SSR render.

## When to use

- The user reports an error or crash in the deployed app.
- Something works locally but fails in production or preview.
- The user wants to understand what a Nitro server route or SSR handler is doing at runtime.

## Steps

1. Fetch logs for the current branch's latest deployment:
   ```bash
   ./scripts/vercel-logs
   ```
2. Identify the error — look for stack traces, unhandled exceptions, or unexpected status codes.
3. Summarise the finding to the user:
   - What the error is and where it originates.
   - Likely cause.
   - Recommended next step (fix, research, or further investigation).
4. Hand off to the appropriate skill (`/research`, `/plan`, or `/implement`) based on how well the fix is understood.

## Rules

- Do not write application code during debugging. This skill is investigation only.
- If logs are insufficient, ask the user to reproduce the error and trigger a new deployment on the current branch first.
