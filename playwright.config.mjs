import { defineConfig, devices } from '@playwright/test';

// The tests run against the WordPress in tests/wp (docker compose), with the
// Theme Unit Test content imported by tests/wp/setup.sh.
export default defineConfig({
  testDir: 'tests',
  timeout: 300000,
  workers: 1, // tests/landing.spec.mjs changes the front page, which the other tests read
  reporter: 'list',
  use: { baseURL: process.env.WP_URL ?? 'http://localhost:8888' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
