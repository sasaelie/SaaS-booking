import { defineConfig } from '@playwright/test';

export default defineConfig({
  forbidOnly: true,
  testDir: 'tests/e2e',
  testMatch:
    /embed-(cookie-resilience|fallback|loading|installation-check|ticket-recovery|payment-resilience|host-policy)\.spec\.ts/,
  workers: 1,
  outputDir: 'qa-results/embed-artifacts',
  reporter: [['list'], ['json', { outputFile: 'qa-results/embed-browser.json' }]],
  use: {
    baseURL: process.env['BOOKING_TEST_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: { executablePath: process.env['BROWSER_EXECUTABLE_PATH'] },
      },
    },
    { name: 'webkit', use: { browserName: 'webkit' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
  webServer: process.env['CI']
    ? {
        command: 'npm run start -- --hostname 127.0.0.1',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: false,
      }
    : undefined,
});
