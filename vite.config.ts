import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The PDF simulator's SimSpec/template catalog lives under api/ (its
      // NodeNext build needs a rootDir of src/), but the reader renders sims
      // client-side (bindTemplate) so the frontend needs read access to the
      // same pure module — no server round-trip to draw an already-fetched
      // annotation. Ported unmodified from pdf-simulation-master/shared;
      // see api/src/lib/simShared for the porting notes.
      '@sim/shared': fileURLToPath(new URL('./api/src/lib/simShared', import.meta.url)),
    },
  },
})
