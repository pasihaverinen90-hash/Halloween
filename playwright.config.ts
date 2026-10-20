import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests drive the real game in Chromium with the keyboard only,
 * against the production build (vite preview). Headless Chromium renders
 * WebGL in software, so tests use a 1280×720 screen (1× render scale) to stay
 * fast; the 2× rendering is checked with screenshots during development.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:4173/Halloween/',
    viewport: { width: 1280, height: 720 },
    screen: { width: 1280, height: 720 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] },
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/Halloween/',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
