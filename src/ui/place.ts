import type Phaser from 'phaser';
import { assetKey, type AssetSpec } from '../games/types';

/*
 * Placing replaceable images. A replacement image can have any resolution or
 * shape, so images are always sized to their box instead of drawn 1:1.
 */

export interface PlaceOptions {
  /** Box size (default: the spec's width × height). */
  width?: number;
  height?: number;
  /** contain = whole image visible (default), cover = fill the box (may crop), stretch = exact box. */
  fit?: 'contain' | 'cover' | 'stretch';
  /** Animation frame (for specs with frames). */
  frame?: number;
  /** Origin, default [0.5, 0.5] (x, y = centre of the box). */
  origin?: [number, number];
}

/** Texture key of an image. */
export function assetTextureKey(spec: AssetSpec): string {
  return assetKey(spec);
}

/** Size an image to a box. */
export function fitImage(image: Phaser.GameObjects.Image, width: number, height: number, fit: PlaceOptions['fit'] = 'contain'): void {
  const frameWidth = image.frame.realWidth || image.width || 1;
  const frameHeight = image.frame.realHeight || image.height || 1;
  if (fit === 'stretch') {
    image.setDisplaySize(width, height);
    return;
  }
  const sx = width / frameWidth;
  const sy = height / frameHeight;
  image.setScale(fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy));
}

/** Add a replaceable image sized to its box. */
export function addAsset(scene: Phaser.Scene, spec: AssetSpec, x: number, y: number, opts: PlaceOptions = {}): Phaser.GameObjects.Image {
  const image = scene.add.image(x, y, assetKey(spec), opts.frame);
  if (opts.origin) image.setOrigin(opts.origin[0], opts.origin[1]);
  fitImage(image, opts.width ?? spec.width, opts.height ?? spec.height, opts.fit ?? 'contain');
  return image;
}
