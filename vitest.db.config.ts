import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests-db/**/*.test.ts'],
    environment: 'node',
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    env: {
      DATABASE_URI: process.env.DATABASE_URI || 'postgresql://edoardocavalcanti@localhost:5432/dcc_test',
      PAYLOAD_SECRET: 'local-test-secret-dashboard-e2e-0001',
    },
  },
})
