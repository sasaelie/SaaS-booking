import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base,
  testDir: 'tests/publication',
  outputDir: 'qa-results/publication-artifacts',
  reporter: [['list'], ['json', { outputFile: 'qa-results/publication-browser.json' }]],
});
