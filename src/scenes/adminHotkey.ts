import type Phaser from 'phaser';
import { SCENES, type PasswordData } from './keys';
import { switchScenes } from './nav';

/**
 * Ctrl + Shift + K opens Pasi's password prompt over whatever is on screen and
 * then the correction mode. Cancelling returns to exactly where the game was.
 * The listener runs in the capture phase, before Phaser sees the key, and
 * prevents the browser's own use of the shortcut where it can.
 */
export function installAdminHotkey(game: Phaser.Game): void {
  window.addEventListener(
    'keydown',
    (event) => {
      const isK = event.code === 'KeyK' || event.key === 'k' || event.key === 'K';
      if (!isK || !event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return;
      event.preventDefault();
      if (event.repeat) return;
      openCorrectionMode(game);
    },
    { capture: true },
  );
}

function openCorrectionMode(game: Phaser.Game): void {
  const manager = game.scene;
  const on = (key: string): boolean => manager.isActive(key) || manager.isPaused(key);
  if (on(SCENES.Boot) || on(SCENES.Password) || on(SCENES.Correction)) return;

  const paused = manager.getScenes(true).map((scene) => scene.sys.settings.key);
  for (const key of paused) manager.pause(key);
  const data: PasswordData = {
    title: 'Korjaustila',
    onSuccess: () => switchScenes(game, SCENES.Correction),
    onCancel: () => {
      for (const key of paused) if (manager.isPaused(key)) manager.resume(key);
    },
  };
  manager.start(SCENES.Password, data);
  manager.bringToTop(SCENES.Password);
}
