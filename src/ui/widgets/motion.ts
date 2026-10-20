import type Phaser from 'phaser';

/*
 * Short, subtle motion shared by the UI (120–300 ms).
 */

interface Positioned {
  x: number;
  y: number;
}

const shakes = new WeakMap<object, { baseX: number; tween: Phaser.Tweens.Tween }>();

/** Shake an object sideways (wrong password, invalid input). Safe to call repeatedly. */
export function shake(scene: Phaser.Scene, target: Positioned, distance = 10, duration = 320): void {
  const running = shakes.get(target);
  const baseX = running ? running.baseX : target.x;
  if (running) {
    running.tween.stop();
    target.x = baseX;
  }
  const tween = scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration,
    onUpdate: (tw) => {
      const p = tw.getValue() ?? 0;
      target.x = baseX + Math.sin(p * Math.PI * 6) * distance * (1 - p);
    },
    onComplete: () => {
      target.x = baseX;
      shakes.delete(target);
    },
    onStop: () => {
      target.x = baseX;
    },
  });
  shakes.set(target, { baseX, tween });
}

/** Fade and scale an object in (overlay panels). */
export function popIn(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Transform,
  delay = 0,
  duration = 220,
): void {
  const scale = target.scaleX;
  target.setAlpha(0);
  target.setScale(scale * 0.94);
  scene.tweens.add({ targets: target, alpha: 1, scale, duration, delay, ease: 'Back.Out' });
}

/** Fade an object in from transparent to `alpha`. */
export function fadeIn(scene: Phaser.Scene, target: Phaser.GameObjects.Components.Alpha, alpha = 1, duration = 180, delay = 0): void {
  target.setAlpha(0);
  scene.tweens.add({ targets: target, alpha, duration, delay, ease: 'Sine.Out' });
}

/** Slide an object up a little while fading it in. */
export function riseIn(scene: Phaser.Scene, target: Phaser.GameObjects.Components.Alpha & Positioned, delay = 0, distance = 14): void {
  const y = target.y;
  target.y = y + distance;
  target.setAlpha(0);
  scene.tweens.add({ targets: target, alpha: 1, y, duration: 260, delay, ease: 'Cubic.Out' });
}
