import type Phaser from 'phaser';

/**
 * Go to another screen: stop every other running, paused or sleeping scene
 * (game scenes, overlays…) and start the target. Use this for all top-level
 * screen changes so no overlay is ever left behind.
 */
export function switchTo(from: Phaser.Scene, key: string, data?: object): void {
  const manager = from.game.scene;
  for (const scene of manager.getScenes(false)) {
    const sceneKey = scene.sys.settings.key;
    if (sceneKey === key) continue;
    if (scene.sys.isActive() || scene.sys.isPaused() || scene.sys.isSleeping()) {
      manager.stop(sceneKey);
    }
  }
  // start() restarts the target if it is already running.
  manager.start(key, data);
}
