import { execSync } from 'node:child_process'

export function resetDb(): void {
  execSync('pnpm exec tsx scripts/test-db-setup.ts', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URI: 'postgresql://edoardocavalcanti@localhost:5432/dcc_test',
      PAYLOAD_SECRET: 'local-test-secret-dashboard-e2e-0001',
      CI: '1',
    },
  })
}
