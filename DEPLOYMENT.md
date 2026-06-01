# Deployment

The app is deployed on **Vercel** using the Build Output API v3 (see `scripts/build-output.mjs`). There is no `vercel.json` — routing is owned by `.vercel/output/config.json`, which is generated at build time.

Secrets are managed in **Doppler** (project `building-ai-confidence`, config `prd`) and pushed to Vercel via `scripts/sync-to-vercel`.

> **TODO:** Vercel currently also holds a duplicate copy of most secrets that was set up manually before Doppler was introduced. Once `scripts/sync-to-vercel` has been run and verified, remove the manually-set Vercel env vars so Doppler is the single source of truth.

## Environment variables

| Variable | Where set | Description |
|---|---|---|
| `APP_URL` | Doppler + Vercel | Full origin of the production deployment (e.g. `https://building-ai-confidence.vercel.app`). Used to build the GitHub OAuth `redirect_uri`. Must not have a trailing slash. |
| `DATABASE_URL` | Doppler + Vercel | Neon Postgres connection string. |
| `GITHUB_CLIENT_ID` | Doppler + Vercel | GitHub OAuth App client ID. |
| `GITHUB_CLIENT_SECRET` | Doppler + Vercel | GitHub OAuth App client secret. |
| `NODE_ENV` | Set by Vercel runtime | `production` in deployed functions; not set locally. |
| `PORT` | Set by Vercel runtime | HTTP port for the Express function; not set locally. |
| `VERCEL_ENV` | Set by Vercel runtime | `production` or `preview`; not set locally. |
| `VERCEL_TOKEN` | Doppler only | Vercel API token used by local scripts (`vercel-logs`, `sync-to-vercel`). Never push to Vercel. |
| `VERCEL_PROJECT_ID` | Doppler only | Vercel project ID used by local scripts. Never push to Vercel. |
| `VERCEL_TEAM_ID` | Doppler only | Vercel team ID used by local scripts. Never push to Vercel. |
| `WORK_FOLDER` | Claude Code session hook | Absolute path to the current branch's work folder. Set by `scripts/setup-work-folder` at session start. |

## Syncing secrets to Vercel

After adding or updating a secret in Doppler, run:

```
doppler run -- node scripts/sync-to-vercel
```

This pushes all non-tooling secrets from Doppler to the `production` and `preview` environments on Vercel. The following keys are always skipped (they are Doppler/tooling internals): `DOPPLER_CONFIG`, `DOPPLER_ENVIRONMENT`, `DOPPLER_PROJECT`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`.

## GitHub OAuth App

The OAuth App must have its **Authorization callback URL** set to:

```
https://building-ai-confidence.vercel.app/auth/callback
```

If the production domain changes, update both `APP_URL` in Doppler and the callback URL in the GitHub OAuth App settings.
