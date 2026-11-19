import { defineConfig, type ReporterDescription } from '@playwright/test';
const reporters: ReporterDescription[] = [
  ['list'],
  ['json', { outputFile: 'qa-results/browser.json' }],
  ['html', { outputFolder: 'qa-results/browser-report', open: 'never' }],
];
if (process.env['CI']) reporters.push(['github']);
export default defineConfig({
  forbidOnly: true,
  reporter: reporters,
  testDir: 'tests/e2e',
  workers: 1,
  use: {
    baseURL: process.env['BOOKING_TEST_BASE_URL'] ?? 'http://127.0.0.1:3000',
    launchOptions: { executablePath: process.env['BROWSER_EXECUTABLE_PATH'] },
    trace: 'retain-on-failure',
  },
  webServer: process.env['CI']
    ? {
        command: 'npm run start -- --hostname 127.0.0.1',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: false,
      }
    : undefined,
});
