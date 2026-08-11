import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Security tests drive a real Postgres + GoTrue + PostgREST stack rather
    // than mocks. Mocking RLS would test the mock: the whole point is that the
    // DATABASE refuses these requests, so the database has to be in the loop.
    include: ['tests/**/*.test.ts'],
    // Sequential: tests share one database and several assert on row counts.
    fileParallelism: false,
    testTimeout: 30_000,
    // Login backs off through the rate limiter (up to 5 x 15s per actor).
    hookTimeout: 120_000,
  },
});
