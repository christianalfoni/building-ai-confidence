import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
  runtimeConfig: {
    // Maps to NITRO_VERCEL_ENV env var. Vercel's own VERCEL_ENV system variable
    // is not reliably available via process.env in Nitro server handlers, so we
    // mirror it as NITRO_VERCEL_ENV in the Vercel project settings.
    vercelEnv: '',
  },
});
