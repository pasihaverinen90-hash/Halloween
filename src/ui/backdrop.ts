import type Phaser from 'phaser';
import { YLEINEN_TAUSTA } from './assets';
import { addAsset } from './place';
import { H, W } from './screen';
import { COLORS, DEPTH } from './theme';

/** The shared night background behind menus, with an optional darkening layer (0..1). */
export function addBackdrop(scene: Phaser.Scene, opts: { dim?: number } = {}): Phaser.GameObjects.Image {
  const image = addAsset(scene, YLEINEN_TAUSTA, W / 2, H / 2, { fit: 'cover' }).setDepth(DEPTH.backdrop);
  if (opts.dim && opts.dim > 0) {
    scene.add.rectangle(W / 2, H / 2, W, H, COLORS.night, Math.min(1, opts.dim)).setDepth(DEPTH.backdropDim);
  }
  return image;
}
