import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10000,
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/lib/**', 'src/node/**'],
      exclude: [
        'src/lib/index.ts',
        'src/lib/types/index.ts',
        'src/lib/types/addons.ts',
      ],
    },
  },
});
