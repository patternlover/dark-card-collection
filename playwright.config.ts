import { defineConfig } from '@playwright/test'

const ENV = {
  DATABASE_URI: 'postgresql://edoardocavalcanti@localhost:5432/dcc_test',
  PAYLOAD_SECRET: 'local-test-secret-dashboard-e2e-0001',
  DASH_SESSION_SECRET: 'local-dash-session-secret-0001',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3100',
  ENABLE_DASH_SQL: 'true',
  DASHBOARD_GOOGLE_EMAILS: 'test@example.com',
  GOOGLE_CLIENT_ID: 'local-test-client-id',
  GOOGLE_CLIENT_SECRET: 'local-test-client-secret',
  PORT: '3100',
  CI: '1',
}

export default defineConfig({
  testDir: 'tests-e2e',
  globalSetup: './tests-e2e/global-setup.ts',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    actionTimeout: 25_000,
    navigationTimeout: 90_000,
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 180_000,
    env: ENV,
  },
})
