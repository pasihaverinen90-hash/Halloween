import { defineConfig } from 'vitest/config';
import { assetManifest } from './vite-plugins/asset-manifest';

export default defineConfig({
  // GitHub Pages serves the game from https://<user>.github.io/<repo>/
  base: '/Halloween/',
  plugins: [assetManifest()],
  build: {
    target: 'es2022',
    // Phaser alone is ~1.2 MB; that is fine for this game.
    chunkSizeWarningLimit: 2500,
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
