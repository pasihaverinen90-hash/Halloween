import type Phaser from 'phaser';

/*
 * Game space. ALL layout uses these 1280×720 coordinates.
 *
 * On large screens the canvas is rendered at ZOOM× resolution for crisp text
 * and lines, and every scene's main camera is zoomed so that the 1280×720
 * world fills it. Consequences for scene code:
 *  - Use W and H for layout. Never use this.scale.width/height or
 *    camera.width/height/centerX/centerY: they are in canvas pixels.
 *  - Arcade physics: call this.physics.world.setBounds(0, 0, W, H) (or the level size).
 *  - Extra cameras need applyCameraZoom(). A scrolling game should draw its HUD in a
 *    separate overlay scene, because scrollFactor(0) objects shift under camera zoom.
 */
export const W = 1280;
export const H = 720;

function computeZoom(): number {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio || 1;
  const widest = Math.max(window.screen?.width ?? 0, window.innerWidth) * dpr;
  return widest > 1400 ? 2 : 1;
}

/** Internal render scale (1 or 2). */
export const ZOOM = computeZoom();

/** Text objects render their glyphs at this resolution (patched into this.add.text in main.ts). */
export const TEXT_RESOLUTION = ZOOM;

/** Make a camera show the 1280×720 world on the ZOOM× canvas. Done automatically for main cameras. */
export function applyCameraZoom(camera: Phaser.Cameras.Scene2D.Camera): void {
  camera.setZoom(ZOOM);
  camera.centerOn(W / 2, H / 2);
}

/**
 * Zoom the scene's main camera every time the scene starts. main.ts does this
 * for every scene; call it yourself only for scenes added at runtime.
 */
export function attachCameraZoom(scene: Phaser.Scene): void {
  // 'ready' = Phaser.Scenes.Events.READY, emitted on every (re)start after the main camera exists.
  scene.sys.events.on('ready', () => applyCameraZoom(scene.cameras.main));
  if (scene.sys.isActive() && scene.cameras?.main) applyCameraZoom(scene.cameras.main);
}
