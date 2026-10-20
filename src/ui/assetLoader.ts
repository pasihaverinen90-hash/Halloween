import type Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';
import { GAMES } from '../games/registry';
import { assetKey, type AssetSpec } from '../games/types';
import { UI_ASSETS } from './assets';
import { ZOOM } from './screen';

/*
 * Replaceable images. Pasi's files in public/assets/ win; every image without a
 * file is drawn by code (AssetSpec.draw). Matching is by base name,
 * case-insensitive, and any of .png .jpg .jpeg .webp is accepted.
 */

/** Every image the game knows: shared images, then each game's preview and images. Unique by file name. */
export function allAssetSpecs(): AssetSpec[] {
  const byKey = new Map<string, AssetSpec>();
  const all = [...UI_ASSETS, ...GAMES.flatMap((game) => [game.preview, ...game.assets])];
  for (const spec of all) {
    const key = assetKey(spec).toLowerCase();
    if (byKey.has(key)) {
      if (byKey.get(key) !== spec) console.warn(`Kuvan nimi ${spec.file} on käytössä kahdesti.`);
      continue;
    }
    byKey.set(key, spec);
  }
  return [...byKey.values()];
}

function baseName(file: string): string {
  return file.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
}

/** The file in public/assets/ that replaces this image, if Pasi has added one. */
export function findReplacement(spec: AssetSpec, files: readonly string[] = manifest): string | undefined {
  const wanted = baseName(spec.file);
  return files.find((file) => baseName(file) === wanted);
}

/** Queue Pasi's replacement images for loading. Returns the texture keys queued. */
export function queueReplacementImages(scene: Phaser.Scene, specs: readonly AssetSpec[]): string[] {
  const known = new Set(specs.map((spec) => baseName(spec.file)));
  for (const file of manifest) {
    if (!known.has(baseName(file))) console.warn(`Kansiossa public/assets on tuntematon kuva: ${file} (nimi ei vastaa mitään kuvaa).`);
  }
  const queued: string[] = [];
  for (const spec of specs) {
    const file = findReplacement(spec);
    if (!file) continue;
    const key = assetKey(spec);
    if (scene.textures.exists(key)) continue;
    scene.load.image(key, `${import.meta.env.BASE_URL}assets/${encodeURIComponent(file)}`);
    queued.push(key);
  }
  return queued;
}

/** Split a texture into `count` equal frames side by side, named 0..count-1. */
function addFrames(texture: Phaser.Textures.Texture, count: number): void {
  if (count <= 1 || texture.has('0')) return;
  const source = texture.source[0];
  const frameWidth = Math.floor(source.width / count);
  for (let i = 0; i < count; i++) texture.add(i, 0, i * frameWidth, 0, frameWidth, source.height);
}

/** Draw every image whose texture does not exist yet (not replaced, or the file failed to load). */
export function createMissingTextures(scene: Phaser.Scene, specs: readonly AssetSpec[]): void {
  for (const spec of specs) {
    const key = assetKey(spec);
    if (!scene.textures.exists(key)) {
      const texture = scene.textures.createCanvas(key, Math.round(spec.width * ZOOM), Math.round(spec.height * ZOOM));
      if (!texture) continue;
      const ctx = texture.context;
      ctx.save();
      ctx.scale(ZOOM, ZOOM);
      try {
        spec.draw(ctx, spec.width, spec.height);
      } catch (error) {
        console.error(`Kuvan ${spec.file} piirtäminen epäonnistui:`, error);
        ctx.fillStyle = '#2f2052';
        ctx.fillRect(0, 0, spec.width, spec.height);
      }
      ctx.restore();
      texture.refresh();
    }
    const texture = scene.textures.get(key);
    if (spec.frames) addFrames(texture, spec.frames.count);
  }
}
