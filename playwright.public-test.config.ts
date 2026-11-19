import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/public-test',
  testMatch: '*.spec.ts',
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'qa-results/public-test-browser.json' }]],
  use: {
    baseURL:
      process.env['PUBLIC_TEST_BASE_URL'] ??
      process.env['NEXT_PUBLIC_APP_URL'] ??
      'http://127.0.0.1:3008',
    launchOptions: {
      executablePath:
        process.env['BROWSER_EXECUTABLE_PATH'] ??
        (process.env['CI'] ? undefined : '/usr/bin/chromium'),
    },
    trace: 'retain-on-failure',
  },
  webServer: process.env['CI']
    ? {
        command: 'npm run start -- --hostname 127.0.0.1 --port 3008',
        url: 'http://127.0.0.1:3008',
        reuseExistingServer: false,
      }
    : undefined,
});
