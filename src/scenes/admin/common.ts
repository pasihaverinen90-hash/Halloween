import type Phaser from 'phaser';
import { addBackdrop } from '../../ui/backdrop';
import { W } from '../../ui/screen';
import { CSS, TEXT } from '../../ui/theme';

export const fi = (n: number): string => n.toLocaleString('fi-FI');

/** Background, title and the "Vain Pasille" marker shared by the results views and correction mode. */
export function addAdminHeader(scene: Phaser.Scene, title: string, color: string = CSS.orange): void {
  addBackdrop(scene, { dim: 0.62 });
  scene.add.text(W / 2, 58, title, { ...TEXT.title, fontSize: '62px', color }).setOrigin(0.5);
  scene.add.text(W - 32, 30, 'Vain Pasille', { ...TEXT.small, fontSize: '18px' }).setOrigin(1, 0.5);
}

/** Medal colours for places 1–3 (CSS). */
export const PLACE_COLORS = [CSS.gold, CSS.silver, CSS.bronze] as const;
