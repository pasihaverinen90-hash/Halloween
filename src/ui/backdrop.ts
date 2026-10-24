import type Phaser from 'phaser';
import { YLEINEN_TAUSTA } from './assets';
import { addAsset } from './place';
import { H, W } from './screen';
import { COLORS, DEPTH } from './theme';

const SCANLINES = 'crt-juovat';
const VIGNETTE = 'crt-reunat';

/**
 * The shared night background behind menus, with an optional darkening layer
 * (0..1). Pasi 24.10.: the menus look like an old arcade screen, so faint
 * picture tube lines and dark corners lie over everything.
 */
export function addBackdrop(scene: Phaser.Scene, opts: { dim?: number } = {}): Phaser.GameObjects.Image {
  const image = addAsset(scene, YLEINEN_TAUSTA, W / 2, H / 2, { fit: 'cover' }).setDepth(DEPTH.backdrop);
  if (opts.dim && opts.dim > 0) {
    scene.add.rectangle(W / 2, H / 2, W, H, COLORS.night, Math.min(1, opts.dim)).setDepth(DEPTH.backdropDim);
  }
  addScanlines(scene);
  return image;
}

/** Picture tube lines and dark corners over the whole screen. They never take keys. */
export function addScanlines(scene: Phaser.Scene): void {
  const textures = scene.textures;
  if (!textures.exists(SCANLINES)) {
    const lines = textures.createCanvas(SCANLINES, 4, 4);
    if (lines) {
      lines.context.fillStyle = 'rgba(0, 0, 0, 0.55)';
      lines.context.fillRect(0, 3, 4, 1);
      lines.refresh();
    }
  }
  if (!textures.exists(VIGNETTE)) {
    const corners = textures.createCanvas(VIGNETTE, 320, 180);
    if (corners) {
      const ctx = corners.context;
      const gradient = ctx.createRadialGradient(160, 90, 60, 160, 90, 190);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 320, 180);
      corners.refresh();
    }
  }
  scene.add.tileSprite(W / 2, H / 2, W, H, SCANLINES).setAlpha(0.35).setDepth(DEPTH.scanlines);
  scene.add.image(W / 2, H / 2, VIGNETTE).setDisplaySize(W, H).setDepth(DEPTH.scanlines);
}
