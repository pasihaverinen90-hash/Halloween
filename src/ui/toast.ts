import Phaser from 'phaser';
import { W } from './screen';
import { COLORS, CSS, DEPTH, FONTS } from './theme';

/*
 * Toasts: short messages near the top of the screen that fade out by
 * themselves ("Varmuuskopio ladattu."). Several toasts stack downwards.
 */

export type ToastKind = 'info' | 'success' | 'error';

const SHOW_MS = 2500;
const TOP = 22;
const GAP = 10;
const MAX_TEXT_WIDTH = 860;

const STYLE: Record<ToastKind, { accent: number; icon: string }> = {
  info: { accent: COLORS.muted, icon: 'i' },
  success: { accent: COLORS.green, icon: '✓' },
  error: { accent: COLORS.red, icon: '!' },
};

const stacks = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container[]>();

function stackFor(scene: Phaser.Scene): Phaser.GameObjects.Container[] {
  let stack = stacks.get(scene);
  if (!stack) {
    const created: Phaser.GameObjects.Container[] = [];
    stacks.set(scene, created);
    // The objects die with the scene; forget the list so a restarted scene starts clean.
    scene.sys.events.once('shutdown', () => stacks.delete(scene));
    stack = created;
  }
  return stack;
}

/** Move the remaining toasts into their slots. */
function layout(scene: Phaser.Scene, stack: Phaser.GameObjects.Container[]): void {
  let y = TOP;
  for (const toast of stack) {
    const targetY = y + toast.height / 2;
    if (toast.getData('placed')) {
      scene.tweens.add({ targets: toast, y: targetY, duration: 200, ease: 'Cubic.Out' });
    } else {
      toast.y = targetY;
      toast.setData('placed', true);
    }
    y += toast.height + GAP;
  }
}

/** Show a short message near the top of the screen. It fades out after about 2.5 s. */
export function showToast(scene: Phaser.Scene, message: string, kind: ToastKind = 'info'): void {
  if (!scene.sys.isActive() && !scene.sys.isPaused()) return;
  const style = STYLE[kind] ?? STYLE.info;
  const stack = stackFor(scene);

  const text = scene.add
    .text(0, 0, message, {
      fontFamily: FONTS.ui,
      fontStyle: '700',
      fontSize: '24px',
      color: CSS.bone,
      wordWrap: { width: MAX_TEXT_WIDTH, useAdvancedWrap: true },
      lineSpacing: 4,
    })
    .setOrigin(0, 0.5);
  const padX = 22;
  const iconSize = 30;
  const width = Math.ceil(padX + iconSize + 14 + text.width + padX);
  const height = Math.max(56, Math.ceil(text.height + 22));

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.black, 0.35);
  bg.fillRoundedRect(-width / 2 + 2, -height / 2 + 4, width, height, 14);
  bg.fillStyle(COLORS.panel, 0.97);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
  bg.lineStyle(2, style.accent, 0.9);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);

  const iconX = -width / 2 + padX + iconSize / 2;
  bg.fillStyle(style.accent, 1);
  bg.fillCircle(iconX, 0, iconSize / 2);
  const icon = scene.add
    .text(iconX, 0, style.icon, { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '20px', color: CSS.night })
    .setOrigin(0.5, 0.5);
  text.setPosition(iconX + iconSize / 2 + 14, 0);

  const toast = scene.add.container(W / 2, 0, [bg, icon, text]);
  toast.setSize(width, height);
  toast.setDepth(DEPTH.toast);
  stack.push(toast);
  layout(scene, stack);

  toast.setAlpha(0);
  const restY = toast.y;
  toast.y = restY - 12;
  scene.tweens.add({ targets: toast, alpha: 1, y: restY, duration: 200, ease: 'Cubic.Out' });

  scene.time.delayedCall(SHOW_MS, () => {
    scene.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 300,
      ease: 'Sine.In',
      onComplete: () => {
        const index = stack.indexOf(toast);
        if (index >= 0) stack.splice(index, 1);
        toast.destroy();
        layout(scene, stack);
      },
    });
  });
}
