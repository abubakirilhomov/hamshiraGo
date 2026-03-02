import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './api',
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.API_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  // API-only tests — no browsers needed
  projects: [
    {
      name: 'api',
      use: {},
    },
  ],
});
