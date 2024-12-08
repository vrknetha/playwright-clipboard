import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for clipboard testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if a test is marked as only */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use */
  reporter: process.env.CI ? 'github' : [['html'], ['list']],
  /* Global timeout for the entire test run */
  timeout: 120000,
  /* Default timeout for assertions */
  expect: {
    timeout: 30000,
  },
  /* Shared settings for all tests */
  use: {
    baseURL: 'http://localhost:8080',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Default timeout for actions like click, fill, etc */
    actionTimeout: 30000,
    /* Default timeout for navigation */
    navigationTimeout: 30000,
    /* Run tests in headless mode by default */
    headless: true,
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },
  /* Configure the local development server */
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  /* Configure projects for different browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        permissions: ['clipboard-read', 'clipboard-write'],
        /* Enable Chrome DevTools Protocol for better debugging */
        launchOptions: {
          devtools: !process.env.CI,
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        /* Firefox-specific preferences for clipboard operations */
        launchOptions: {
          firefoxUserPrefs: {
            'dom.events.testing.asyncClipboard': true,
            'dom.events.asyncClipboard.readText': true,
            'dom.events.asyncClipboard.clipboardItem': true,
            'dom.events.asyncClipboard.writeText': true,
            'permissions.default.clipboard-read': 1,
            'permissions.default.clipboard-write': 1,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        /* Enable WebKit debug options */
        launchOptions: {
          devtools: !process.env.CI,
        },
      },
    },
  ],
});
