/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { reactx } from 'reactx/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Stories-only config — no nitro() so requests aren't intercepted by the SSR handler
export default defineConfig({
  plugins: [tailwindcss(), reactx(), react()],
  build: {
    rollupOptions: {
      input: {
        stories: resolve(__dirname, 'stories.html'),
      },
    },
  },
})
