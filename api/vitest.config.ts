import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Security tests drive a real Postgres + GoTrue + PostgREST stack rather
    // than mocks. Mocking RLS would test the mock: the whole point is that the
    // DATABASE refuses these requests, so the database has to be in the loop.
    include: [
      'tests/**/*.test.ts',
      // Ported from pdf-simulation-master/shared, co-located with the
      // module they test (upstream's own convention) rather than moved
      // into tests/ — these are pure unit tests with no database, unlike
      // everything else this config runs sequentially against one.
      'src/lib/simShared/**/*.test.ts',
    ],
    // Sequential: tests share one database and several assert on row counts.
    fileParallelism: false,
    testTimeout: 30_000,
    // Login backs off through the rate limiter (up to 5 x 15s per actor).
    hookTimeout: 120_000,
  },
});
