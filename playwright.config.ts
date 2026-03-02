import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright API Testing Configuration
 */
export default defineConfig({
  testDir: './tests/api',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    // Custom reporter: auto-generates reports/test-report.html and reports/test-report-summary.md
    ['./utils/test-reporter']
  ],
  use: {
    // Base URL from environment
    baseURL: process.env.BASE_URL || 'https://dummyjson.com',

    // Collect specific traces for failed API calls
    trace: 'on-first-retry',

    // Global Headers
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // Add other global headers here if needed
    },

    // Timeout for each individual request
    actionTimeout: 10000,
  },

  // Total timeout for each test
  timeout: 30000,

  projects: [
    {
      name: 'api-tests',
      use: {
        // specific browser configuration is irrelevant for pure API tests,
        // but required by Playwright runner
      },
    },
  ],
});