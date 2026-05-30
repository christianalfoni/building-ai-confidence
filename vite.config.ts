/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { reactx } from 'reactx/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [tailwindcss(), reactx(), react()],
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
