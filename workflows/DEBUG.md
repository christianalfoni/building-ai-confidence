# Debug Workflow

Diagnose a production or preview error by reading Vercel deployment logs. Use this when the user reports unexpected behaviour in the deployed app, a server error, or a failed SSR render.

## When to use

- The user reports an error or crash in the deployed app.
- Something works locally but fails in production or preview.
- The user wants to understand what a Nitro server route or SSR handler is doing at runtime.

## Steps

1. List recent deployments to identify the relevant one:
   ```bash
   VERCEL_PROJECT_ID="" VERCEL_ORG_ID="" npx vercel ls --token=$VERCEL_TOKEN --scope=$VERCEL_TEAM_ID
   ```
2. Fetch logs for the deployment URL:
   ```bash
   VERCEL_PROJECT_ID="" VERCEL_ORG_ID="" npx vercel logs --token=$VERCEL_TOKEN --scope=$VERCEL_TEAM_ID <deployment-url>
   ```
3. Identify the error — look for stack traces, unhandled exceptions, or unexpected status codes.
4. Summarise the finding to the user:
   - What the error is and where it originates.
   - Likely cause.
   - Recommended next step (fix, research, or further investigation).
5. Hand off to the appropriate workflow (**research**, **plan**, or **implement**) based on how well the fix is understood.

## Rules

- Do not write application code during debugging. This workflow is investigation only.
- If logs are insufficient, ask the user to reproduce the error and provide the specific deployment URL.
- Always clear `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` before running Vercel CLI commands — these env vars conflict with `--scope` and cause errors.
