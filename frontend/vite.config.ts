/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function staticDeckMiddleware(): Plugin {
  return {
    name: 'static-deck-directory-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next()
        if (req.url === '/deck' || req.url === '/deck/') {
          req.url = '/deck/index.html'
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next()
        if (req.url === '/deck' || req.url === '/deck/') {
          req.url = '/deck/index.html'
        }
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), staticDeckMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Vitest's default `include` is `**/*.{test,spec}.?(c|m)[jt]s?(x)`, which sweeps up
    // tests/e2e/*.spec.ts -- those are PLAYWRIGHT specs, owned by playwright.config.ts
    // (`testDir: './tests/e2e'`). Run under vitest they fail at collection with
    //   "Playwright Test did not expect test.describe() to be called here"
    // which is not a product failure at all, but it does make `npm test` exit non-zero
    // and therefore blocks the platform CI's image build.
    //
    // Excluding the directory here gives each runner exactly the files it owns. The e2e
    // specs are NOT deleted and NOT disabled -- run them with `npx playwright test`.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
    ],
  },
})
