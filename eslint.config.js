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
    rules: {
      // ---------------------------------------------------------------------
      // KNOWN DEBT — warn, not error, so CI can gate on genuinely new problems
      // instead of failing on day one against ~50 pre-existing sites.
      //
      // `set-state-in-effect` (47 sites): every route loads its data with
      // `useEffect(() => { api.get(...).then(setState) }, [])`. Fixing it means
      // moving the app onto a data-loading library — a real migration, not a
      // lint pass, and one that should not be attempted while there are no
      // browser E2E tests to catch a regression on a screen that works today.
      //
      // `only-export-components` (3 sites): the context modules export both a
      // provider component and its hook. This costs a full reload instead of a
      // hot update in dev, and nothing in production.
      //
      // `preserve-manual-memoization` (2 sites): informational — the React
      // Compiler declined to compile two blocks in Games.tsx.
      //
      // Do not add to these counts. Anything else must be fixed, not demoted.
      // ---------------------------------------------------------------------
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',

      // Same convention as the api/**/*.ts block below, for the same reason:
      // a `_` prefix marks a name as deliberately unused (a required
      // destructuring/tuple slot, a signature the caller controls) instead
      // of switching the rule off. The frontend already relies on this in
      // several places; this override just makes the config match.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The API is Node, not browser. It also has signatures it cannot shorten:
    // Express only recognises a middleware as an ERROR handler if it declares
    // four parameters, so `next` must stay even when unused. Allowing a `_`
    // prefix marks those deliberately, rather than switching the rule off.
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
])
