import type Phaser from 'phaser';
import { COLORS } from '../theme';

/*
 * Rounded panels: the basic building block of every screen and overlay.
 */

export interface PanelOptions {
  /** Fill colour. Default COLORS.panel. */
  fill?: number;
  /** Outline colour. Default COLORS.border. */
  border?: number;
  /** Outline width in pixels. Default 2. */
  borderWidth?: number;
  /** Corner radius. Default 16. */
  radius?: number;
  /** Fill opacity 0..1. Default 0.94. */
  alpha?: number;
  /** Soft outer glow: true = orange, or a colour. */
  glow?: boolean | number;
}

/**
 * Draw a rounded panel. (x, y) is the top-left corner; the Graphics object is
 * positioned there and its shapes are drawn relative to it, so it can be moved
 * or faded as a whole.
 */
export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: PanelOptions = {},
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics({ x, y });
  paintPanel(graphics, w, h, opts);
  return graphics;
}

/** Clear the Graphics and draw a panel of size w×h at its local (0, 0). Used to restyle panels in place. */
export function paintPanel(graphics: Phaser.GameObjects.Graphics, w: number, h: number, opts: PanelOptions = {}): void {
  paintPanelAt(graphics, 0, 0, w, h, opts, true);
}

/** Draw a panel at local (x, y) without clearing (several panels in one Graphics). */
export function paintPanelAt(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: PanelOptions = {},
  clear = false,
): void {
  if (clear) graphics.clear();
  if (w <= 0 || h <= 0) return;
  const radius = Math.max(0, Math.min(opts.radius ?? 16, w / 2, h / 2));
  const borderWidth = opts.borderWidth ?? 2;

  if (opts.glow) {
    const color = typeof opts.glow === 'number' ? opts.glow : COLORS.orange;
    // Concentric outlines with fading opacity read as a soft glow.
    const rings = [
      [18, 0.035],
      [12, 0.05],
      [7, 0.08],
      [3.5, 0.12],
    ] as const;
    for (const [spread, alpha] of rings) {
      graphics.lineStyle(spread, color, alpha);
      graphics.strokeRoundedRect(x - spread / 2, y - spread / 2, w + spread, h + spread, radius + spread / 2);
    }
  }

  graphics.fillStyle(opts.fill ?? COLORS.panel, opts.alpha ?? 0.94);
  graphics.fillRoundedRect(x, y, w, h, radius);

  // A faint inner highlight along the top edge gives the panel some depth.
  if (h > 24 && w > 24) {
    graphics.lineStyle(1, 0xffffff, 0.06);
    graphics.beginPath();
    graphics.moveTo(x + radius, y + 2);
    graphics.lineTo(x + w - radius, y + 2);
    graphics.strokePath();
  }

  if (borderWidth > 0) {
    graphics.lineStyle(borderWidth, opts.border ?? COLORS.border, 1);
    graphics.strokeRoundedRect(x, y, w, h, radius);
  }
}

/**
 * A vertical fade (transparent at the top, `color` at `alpha` at the bottom)
 * made of thin strips, so it works in both WebGL and Canvas renderers.
 * (x, y) is the top-left corner.
 */
export function drawFade(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number = COLORS.night,
  alpha = 0.85,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics({ x, y });
  const strips = Math.max(4, Math.round(h / 4));
  const stripHeight = h / strips;
  for (let i = 0; i < strips; i++) {
    const t = (i + 0.5) / strips;
    graphics.fillStyle(color, alpha * t * t * (3 - 2 * t));
    graphics.fillRect(0, i * stripHeight, w, stripHeight + 0.5);
  }
  return graphics;
}

/** A small decorative divider: a thin line with a diamond in the middle. (x, y) = centre. */
export function drawDivider(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  color: number = COLORS.border,
  accent: number = COLORS.orange,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics({ x, y });
  const half = width / 2;
  const gap = 14;
  graphics.lineStyle(2, color, 0.9);
  graphics.beginPath();
  graphics.moveTo(-half, 0);
  graphics.lineTo(-gap, 0);
  graphics.moveTo(gap, 0);
  graphics.lineTo(half, 0);
  graphics.strokePath();
  graphics.fillStyle(accent, 1);
  graphics.fillPoints(
    [
      { x: 0, y: -6 },
      { x: 6, y: 0 },
      { x: 0, y: 6 },
      { x: -6, y: 0 },
    ],
    true,
  );
  return graphics;
}
