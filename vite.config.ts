import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { serviceWorkerPlugin } from './scripts/sw-plugin'

export default defineConfig({
  base: './',
  plugins: [react(), serviceWorkerPlugin()],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
