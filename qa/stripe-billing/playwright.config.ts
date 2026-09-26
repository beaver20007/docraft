import { defineConfig } from '@playwright/test';

try {
  process.loadEnvFile('.env.e2e');
} catch {
  // env may come from the shell; the spec fails with a clear message if vars are missing
}

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  workers: 1,
  retries: 0,
  reporter: [['list']],
});
