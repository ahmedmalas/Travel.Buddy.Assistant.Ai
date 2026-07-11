import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.ts',
        'src/vite-env.d.ts',
        'src/global.d.ts',
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
      ],
      thresholds: {
        statements: 45,
        branches: 35,
        functions: 40,
        lines: 45,
      },
    },
  },
});
