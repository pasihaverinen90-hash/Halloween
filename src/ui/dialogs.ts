import type Phaser from 'phaser';
import { SCENES, type DialogData, type PasswordData, type PromptData } from '../scenes/keys';

/*
 * Modal overlays for screens. Each helper pauses the calling scene (so it
 * gets no keys), opens the overlay on top and resumes the caller when the
 * overlay closes. If the caller is stopped meanwhile (e.g. correction mode
 * takes over), the promise simply never resolves.
 */

function open(scene: Phaser.Scene, key: string, data: object): void {
  scene.scene.pause();
  scene.scene.launch(key, data);
  scene.scene.bringToTop(key);
}

function resume(scene: Phaser.Scene): void {
  if (scene.sys.isPaused()) scene.scene.resume();
}

/** Ask a yes/no question. Resolves true when the confirm button was chosen. */
export function confirmDialog(scene: Phaser.Scene, opts: Omit<DialogData, 'onClose'>): Promise<boolean> {
  return new Promise((resolve) => {
    const data: DialogData = {
      ...opts,
      onClose: (confirmed) => {
        resume(scene);
        resolve(confirmed);
      },
    };
    open(scene, SCENES.Dialog, data);
  });
}

/** Show a message with a single "OK" button. */
export async function infoDialog(scene: Phaser.Scene, title: string, message: string): Promise<void> {
  await confirmDialog(scene, { title, message, confirmLabel: 'Selvä', cancelLabel: null, defaultChoice: 'confirm' });
}

/** Ask for one line of text. Resolves with the accepted value, or null when cancelled. */
export function promptText(scene: Phaser.Scene, opts: Omit<PromptData, 'onClose'>): Promise<string | null> {
  return new Promise((resolve) => {
    const data: PromptData = {
      ...opts,
      onClose: (value) => {
        resume(scene);
        resolve(value);
      },
    };
    open(scene, SCENES.Prompt, data);
  });
}

/** Ask for Pasi's password. Resolves true when the correct password was typed, false when cancelled. */
export function askPassword(scene: Phaser.Scene, title: string, opts: { cancelable?: boolean } = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const data: PasswordData = {
      title,
      cancelable: opts.cancelable,
      onSuccess: () => {
        resume(scene);
        resolve(true);
      },
      onCancel: () => {
        resume(scene);
        resolve(false);
      },
    };
    open(scene, SCENES.Password, data);
  });
}
