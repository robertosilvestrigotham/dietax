import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, './app'),
      '@': path.resolve(import.meta.dirname, './app'),
      'shared': path.resolve(import.meta.dirname, './shared'),
    },
  },
  test: {
    environment: 'node',
  },
})
