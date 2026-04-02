import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3001';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';

export default defineConfig({
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  projects: [
    /* ── API tests (no browser) ── */
    {
      name: 'api',
      testDir: './api',
      use: {
        baseURL: API_URL,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },

    /* ── Web client browser tests ── */
    {
      name: 'web',
      testDir: './web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_URL,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },

    /* ── Admin panel browser tests ── */
    {
      name: 'admin',
      testDir: './admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ADMIN_URL,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
  ],
});
