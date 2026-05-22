import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { reactx } from 'reactx/vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tailwindcss(), reactx(), react()],
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
