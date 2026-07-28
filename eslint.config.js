import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    // Upstream source repo the Class 9-10 labs were ported from. Kept in the
    // tree as the reference copy; it is third-party code held to its own
    // conventions, so linting it here is noise.
    'EducationAI-Games-master',
    // The ported labs themselves are vendored verbatim (84/88 files are
    // byte-identical to upstream) so they stay diffable against the source.
    // They are excluded for the same reason, not because they are exempt.
    'src/routes/batch3/labs/**/*.jsx',
    'src/routes/batch3/labs/**/*.js',
  ]),
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
])
