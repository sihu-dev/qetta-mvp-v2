import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Qetta MVP E2E Test Configuration
 *
 * Projects:
 * - setup: 인증 셋업 (storageState 생성)
 * - public: 인증 불필요 테스트 (landing, api)
 * - authenticated: 인증 필요 테스트 (X-E2E-Test-Token 헤더로 우회)
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');
const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET || 'e2e-test-secret-dev-only-2024';

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    // 1. 인증 셋업 프로젝트 (먼저 실행)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 2. 인증이 필요없는 테스트 (public)
    {
      name: 'public',
      testMatch: ['**/landing.spec.ts', '**/api.spec.ts', '**/gov-api.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },

    // 3. 인증이 필요한 테스트 (authenticated)
    // X-E2E-Test-Token 헤더로 인증 우회
    {
      name: 'authenticated',
      testMatch: [
        '**/dashboard.spec.ts',
        '**/tender.spec.ts',
        '**/evidence.spec.ts',
        '**/agi.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
        extraHTTPHeaders: {
          'X-E2E-Test-Token': E2E_TEST_SECRET,
        },
      },
      dependencies: ['setup'],
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Global timeout for each test
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 10 * 1000,
  },
});
