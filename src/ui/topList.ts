import type Phaser from 'phaser';
import { CONFIG } from '../config';
import type { FreeplayEntry } from '../core/freeplay';
import { COLORS, CSS, FONTS, TEXT } from './theme';

const fi = (n: number): string => n.toLocaleString('fi-FI');
const PLACE_COLORS = [CSS.gold, CSS.silver, CSS.bronze] as const;

/**
 * A freeplay top list (Pasi 23.10.): CONFIG.freeplay.topSize rows from y down,
 * centred at x. The row at index `highlight` (0-based) glows. Returns the objects made.
 */
export function drawTopList(
  scene: Phaser.Scene,
  entries: readonly FreeplayEntry[],
  x: number,
  y: number,
  width: number,
  rowH = 38,
  highlight: number | null = null,
): Phaser.GameObjects.GameObject[] {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const left = x - width / 2;
  const size = `${Math.round(rowH * 0.62)}px`;
  for (let i = 0; i < CONFIG.freeplay.topSize; i++) {
    const rowY = y + i * rowH + rowH / 2;
    const entry = entries[i];
    if (i === highlight) objects.push(scene.add.rectangle(x, rowY, width, rowH - 4, COLORS.orange, 0.35).setStrokeStyle(2, COLORS.orange));
    else if (i % 2 === 0) objects.push(scene.add.rectangle(x, rowY, width, rowH - 4, COLORS.panelLight, 0.45));
    const color = i < 3 && entry ? PLACE_COLORS[i] : CSS.muted;
    objects.push(scene.add.text(left + 16, rowY, `${i + 1}.`, { fontFamily: FONTS.ui, fontStyle: '800', fontSize: size, color }).setOrigin(0, 0.5));
    objects.push(
      scene.add.text(left + 76, rowY, entry ? entry.name : '–', { ...TEXT.body, fontSize: size, color: entry ? CSS.bone : CSS.muted }).setOrigin(0, 0.5),
    );
    if (entry) objects.push(scene.add.text(left + width - 16, rowY, fi(entry.score), { ...TEXT.bodyBold, fontSize: size }).setOrigin(1, 0.5));
  }
  return objects;
}
