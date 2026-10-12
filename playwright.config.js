import { defineConfig } from '@playwright/test';
const externalURL = process.env.E2E_BASE_URL;
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: externalURL || 'http://127.0.0.1:4173', channel: process.platform === 'darwin' ? 'chrome' : undefined, headless: true, viewport: { width: 1440, height: 1024 }, trace: 'retain-on-failure' },
  webServer: externalURL ? undefined : { command: 'npm run dev -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
