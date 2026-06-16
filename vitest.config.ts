import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    tsconfig: 'tsconfig.json',
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    typecheck: {
      tsconfig: 'tsconfig.json',
      checker: 'tsc',
      include: ['src/**/*.ts', 'tests/**/*.ts'],
    },
  },
});
