import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildAssetsMarkdown, gameOrderFromRegistry } from './kuvalista';

describe('ASSETS.md', () => {
  it('reads the game order from the registry and skips commented lines', () => {
    const source = "export const GAME_ORDER: readonly string[] = [\n  'hirsipuu',\n  // 'lento',\n  'ristikko',\n];";
    expect(gameOrderFromRegistry(source)).toEqual(['hirsipuu', 'ristikko']);
  });

  it('is up to date with the images in the code (run `npm run kuvalista` after changing them)', async () => {
    expect(readFileSync('ASSETS.md', 'utf8')).toBe(await buildAssetsMarkdown('.'));
  });
});
