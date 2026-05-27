import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/desktop/components/**/*.{ts,tsx}', 'src/mobile/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react',
          importNames: ['useState'],
          message: 'useState is not allowed in components/. Move state to AppState (src/state/), or extract local UI state into a ui-component.',
        }],
      }],
    },
  },
])
