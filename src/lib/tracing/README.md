# Letter-tracing engine

Ported verbatim from `EducationAI-Games-master/src/Components/Grade 1/engine`.

These five modules are the real tracing implementation: SVG letter path data,
path sampling, stroke accuracy scoring and a small subscribable state store.
They are plain framework-agnostic JavaScript with no dependencies beyond each
other, so they were copied **unmodified** rather than rewritten — the scoring
thresholds and stroke rules are the pedagogy, and paraphrasing them into
TypeScript would have quietly changed how a child's letter is marked.

The React binding lives in
`src/routes/batch1/games/LetterTracingEngine.tsx`, which wraps this API in the
Batch 1 game contract (`onFinish`, `isPreReader`, catalog `params`) and applies
the app's own styling.

Do not edit these files to restyle anything — the visuals are entirely in the
`.tsx` wrapper.

| file | role |
|---|---|
| `letterPaths.js` | SVG stroke data for A-Z |
| `pathSampler.js` | samples paths into points, tangents, progress |
| `accuracyChecker.js` | thresholds, nearest-point, direction, jump filtering |
| `tracingState.js` | subscribable state store |
| `tracingEngine.js` | public API — `init`, `loadLetter`, pointer handlers, scoring |
