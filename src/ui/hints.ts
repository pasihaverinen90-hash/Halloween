import Phaser from 'phaser';
import { H, W } from './screen';
import { COLORS, CSS, DEPTH, FONTS } from './theme';
import { drawFade } from './widgets/panel';

/*
 * Key hints: every screen shows its keys at the bottom, e.g.
 * [Enter] Aloita   [Esc] Takaisin. Keys are drawn as small key caps.
 */

export type KeyHint = [key: string, action: string];

const KEY_FONT_SIZE = 20;
const ACTION_FONT_SIZE = 22;
const CAP_HEIGHT = 36;
const CAP_PAD_X = 11;
const CAP_MIN_WIDTH = 38;
const GAP_KEY_ACTION = 10;
const GAP_BETWEEN_HINTS = 40;

const ARROWS: Readonly<Record<string, number>> = { '↑': -Math.PI / 2, '↓': Math.PI / 2, '←': Math.PI, '→': 0 };

/** Separators inside a key label: "Esc tai Enter", "Ctrl + Shift + K", "A / B". */
const SEPARATOR = /\s+(tai|\+|\/)\s+/;

export interface KeyCapOptions {
  /** Label font size. Default 20. */
  fontSize?: number;
  /** Cap height. Default 36. */
  height?: number;
}

/**
 * One key drawn as a key cap. (x, y) = left edge and vertical centre.
 * Arrow labels ('↑↓', '←→', '↑') are drawn as crisp vector arrows.
 * The returned container's width (container.width) is the cap width.
 */
export function addKeyCap(scene: Phaser.Scene, x: number, y: number, label: string, opts: KeyCapOptions = {}): Phaser.GameObjects.Container {
  const height = opts.height ?? CAP_HEIGHT;
  const fontSize = opts.fontSize ?? KEY_FONT_SIZE;
  const container = scene.add.container(x, y);
  const chars = Array.from(label.trim());
  const isArrows = chars.length > 0 && chars.every((ch) => ch in ARROWS);

  let contentWidth: number;
  let text: Phaser.GameObjects.Text | null = null;
  const arrowSize = Math.round(height * 0.36);
  const arrowGap = Math.round(arrowSize * 0.5);
  if (isArrows) {
    contentWidth = chars.length * arrowSize + (chars.length - 1) * arrowGap;
  } else {
    text = scene.add
      .text(0, 0, label.trim(), { fontFamily: FONTS.ui, fontStyle: '800', fontSize: `${fontSize}px`, color: CSS.bone })
      .setOrigin(0.5, 0.5);
    contentWidth = text.width;
  }

  const width = Math.max(CAP_MIN_WIDTH, Math.ceil(contentWidth + CAP_PAD_X * 2));
  const radius = 7;
  const cap = scene.add.graphics();
  // Key "depth": a darker base under the cap.
  cap.fillStyle(COLORS.black, 0.45);
  cap.fillRoundedRect(0, -height / 2 + 3, width, height, radius);
  cap.fillStyle(COLORS.panelLight, 1);
  cap.fillRoundedRect(0, -height / 2, width, height, radius);
  cap.lineStyle(1.5, COLORS.muted, 0.55);
  cap.strokeRoundedRect(0, -height / 2, width, height, radius);
  cap.lineStyle(1, 0xffffff, 0.08);
  cap.beginPath();
  cap.moveTo(radius, -height / 2 + 2);
  cap.lineTo(width - radius, -height / 2 + 2);
  cap.strokePath();
  container.add(cap);

  if (text) {
    text.setPosition(width / 2, -1);
    container.add(text);
  } else {
    const arrows = scene.add.graphics();
    let cx = (width - contentWidth) / 2 + arrowSize / 2;
    for (const ch of chars) {
      drawArrow(arrows, cx, 0, arrowSize, ARROWS[ch]);
      cx += arrowSize + arrowGap;
    }
    container.add(arrows);
  }

  container.setSize(width, height);
  return container;
}

/** A small arrow (shaft + head) pointing at `angle`, centred at (x, y). */
function drawArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number, angle: number): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const point = (px: number, py: number) => ({ x: x + px * cos - py * sin, y: y + px * sin + py * cos });
  const half = size / 2;
  const headLength = size * 0.55;
  const headWidth = size * 0.5;
  graphics.fillStyle(COLORS.bone, 1);
  graphics.fillPoints([point(half, 0), point(half - headLength, -headWidth), point(half - headLength, headWidth)], true);
  graphics.lineStyle(Math.max(2, size * 0.18), COLORS.bone, 1);
  graphics.beginPath();
  const tail = point(-half, 0);
  const neck = point(half - headLength + 1, 0);
  graphics.moveTo(tail.x, tail.y);
  graphics.lineTo(neck.x, neck.y);
  graphics.strokePath();
}

/**
 * A key label with separators: "Esc tai Enter" → [Esc] tai [Enter],
 * "Ctrl + Shift + K" → [Ctrl] + [Shift] + [K]. (x, y) = left edge, centre.
 */
function addKeyLabel(scene: Phaser.Scene, x: number, y: number, label: string): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const parts = label.trim().split(SEPARATOR);
  let cursor = 0;
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      const sep = scene.add
        .text(cursor + 8, 0, part, { fontFamily: FONTS.ui, fontStyle: '700', fontSize: `${ACTION_FONT_SIZE - 2}px`, color: CSS.muted })
        .setOrigin(0, 0.5);
      container.add(sep);
      cursor += sep.width + 16;
    } else {
      const cap = addKeyCap(scene, cursor, 0, part);
      container.add(cap);
      cursor += cap.width;
    }
  });
  container.setSize(cursor, CAP_HEIGHT);
  return container;
}

export interface KeyHintOptions {
  /** Dark fade behind the line (keeps it readable over any background and hides hints of screens below). Default true. */
  band?: boolean;
  /** Fully opaque band: overlays use it so the hints of the screen below never show through. */
  opaque?: boolean;
}

/** The footer line of key hints. Use setHints() to change the keys shown. */
export class KeyHintBar extends Phaser.GameObjects.Container {
  private readonly band: boolean;
  private readonly bandAlpha: number;
  private hints: KeyHint[] = [];

  constructor(scene: Phaser.Scene, hints: KeyHint[], y: number, opts: KeyHintOptions = {}) {
    super(scene, W / 2, y);
    this.band = opts.band ?? true;
    this.bandAlpha = opts.opaque ? 1 : 0.82;
    this.setDepth(DEPTH.hints);
    scene.add.existing(this);
    this.setHints(hints);
  }

  /** The hints currently shown. */
  get current(): readonly KeyHint[] {
    return this.hints;
  }

  setHints(hints: KeyHint[]): this {
    this.hints = hints.map(([key, action]) => [key, action] as KeyHint);
    this.removeAll(true);
    const scene = this.scene;

    if (this.band) {
      const top = -58;
      const bottom = Math.max(H - this.y, 34) + 2;
      const fade = drawFade(scene, -W / 2, top, W, 44, COLORS.night, this.bandAlpha);
      const solid = scene.add.rectangle(-W / 2, top + 44, W, bottom - (top + 44), COLORS.night, this.bandAlpha).setOrigin(0, 0);
      this.add([fade, solid]);
    }

    const groups: Phaser.GameObjects.Container[] = [];
    for (const [key, action] of this.hints) {
      const group = scene.add.container(0, 0);
      const keys = addKeyLabel(scene, 0, 0, key);
      const text = scene.add
        .text(keys.width + GAP_KEY_ACTION, 0, action, {
          fontFamily: FONTS.ui,
          fontStyle: '700',
          fontSize: `${ACTION_FONT_SIZE}px`,
          color: CSS.muted,
        })
        .setOrigin(0, 0.5);
      group.add([keys, text]);
      group.setSize(keys.width + GAP_KEY_ACTION + text.width, CAP_HEIGHT);
      groups.push(group);
    }
    const total = groups.reduce((sum, g) => sum + g.width, 0) + GAP_BETWEEN_HINTS * Math.max(0, groups.length - 1);
    let x = -total / 2;
    for (const group of groups) {
      group.setPosition(Math.round(x), 0);
      x += group.width + GAP_BETWEEN_HINTS;
    }
    this.add(groups);
    return this;
  }
}

/**
 * Centred footer line of key hints, keys as key caps and actions in muted text:
 * addKeyHints(this, [['Enter', 'Aloita'], ['Esc', 'Takaisin']]).
 * Key labels may combine keys: 'Esc tai Enter', 'Ctrl + Shift + K', '↑↓', '←→'.
 */
export function addKeyHints(scene: Phaser.Scene, hints: KeyHint[], y = H - 34, opts: KeyHintOptions = {}): KeyHintBar {
  return new KeyHintBar(scene, hints, y, opts);
}
