import type Phaser from 'phaser';
import { H, W } from './screen';
import { COLORS } from './theme';
import { drawPanel, type PanelOptions } from './widgets/panel';

/*
 * Shared building blocks of the overlay scenes (dialogs, prompts, password,
 * attempt screens, pause): a dark veil over everything below and a centred panel.
 */

/** Full-screen dark veil. */
export function addDim(scene: Phaser.Scene, alpha = 0.62): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(W / 2, H / 2, W, H, COLORS.black, alpha);
}

/** A panel of size w×h centred at (cx, cy). Returns the Graphics (top-left at its position). */
export function addCenteredPanel(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opts: PanelOptions = {},
  cx = W / 2,
  cy = H / 2,
): Phaser.GameObjects.Graphics {
  return drawPanel(scene, cx - w / 2, cy - h / 2, w, h, { radius: 20, borderWidth: 3, glow: true, alpha: 1, ...opts });
}
