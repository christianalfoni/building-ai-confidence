/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { reactx } from 'reactx/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { nitro } from 'nitro/vite'

export default defineConfig({
  plugins: [nitro(), tailwindcss(), reactx(), react()],
  ssr: {
    noExternal: ['reactx'],
  },
  build: {
    rollupOptions: {
      input: {
        stories: resolve(__dirname, 'stories.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    server: {
      deps: {
        inline: ['reactx'],
      },
    },
  },
})
