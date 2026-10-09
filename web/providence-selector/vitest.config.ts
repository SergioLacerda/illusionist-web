import { defineConfig } from 'vitest/config';

// Standalone config (the Astro pipeline is not needed): logic tests in
// src/lib and src/config, UI tests in happy-dom (opted in per file), and the
// release structural gate in scripts/. Fixtures live in fixtures/ and compat/
// and are never part of the build output.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/config/**/*.ts', 'scripts/check-surface.mjs'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
