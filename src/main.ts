import Phaser from 'phaser';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/grenze-gotisch/600.css';
import '@fontsource/grenze-gotisch/800.css';
import '@fontsource/patrick-hand/400.css';
import 'twemoji-colr-font/twemoji.css';
import { GAMES } from './games/registry';
import { ALL_SCENES } from './scenes';
import { installAdminHotkey } from './scenes/adminHotkey';
import { installTestHooks } from './testHooks';
import { H, TEXT_RESOLUTION, W, ZOOM, attachCameraZoom } from './ui/screen';
import { COLORS } from './ui/theme';

const errors: string[] = [];

/** Full-screen error for problems that stop the game from starting at all. */
function showFatalError(message: string): void {
  document.getElementById('lataus')?.remove();
  const box = document.getElementById('virhe');
  if (!box) return;
  box.textContent = `Peli ei käynnistynyt.\n\n${message}\n\nLataa sivu uudelleen painamalla F5. Tulokset ovat tallessa.`;
  box.style.display = 'block';
}

/**
 * Runtime errors are shown in a small box so that Pasi's screenshots reveal
 * what went wrong. Results are saved after every attempt, so nothing is lost.
 */
function reportError(message: string): void {
  errors.push(message);
  if (errors.length > 20) errors.shift();
  let box = document.getElementById('virheilmoitus');
  if (!box) {
    box = document.createElement('div');
    box.id = 'virheilmoitus';
    box.style.cssText =
      'position:fixed;left:12px;bottom:12px;max-width:60vw;padding:10px 14px;border-radius:8px;' +
      'background:rgba(90,10,20,0.92);color:#fff;font:14px/1.4 system-ui,sans-serif;z-index:10;white-space:pre-wrap;';
    document.body.appendChild(box);
  }
  box.textContent = `Virhe: ${message}\n(Jos peli jumittui: Ctrl + Shift + K → korjaustila, tai F5. Tulokset ovat tallessa.)`;
  box.style.display = 'block';
  window.clearTimeout(Number(box.dataset.timer));
  box.dataset.timer = String(window.setTimeout(() => box && (box.style.display = 'none'), 20000));
}

window.addEventListener('error', (event) => reportError(event.message || String(event.error)));
window.addEventListener('unhandledrejection', (event) => reportError(String(event.reason)));

/**
 * Phaser stops its frame loop for good if one frame throws (the next frame is
 * never requested), which would freeze the evening. Catch, report and carry on.
 */
function keepLoopAlive(): void {
  const proto = Phaser.Game.prototype as unknown as { step: (time: number, delta: number) => void };
  const step = proto.step;
  proto.step = function (this: Phaser.Game, time: number, delta: number) {
    try {
      step.call(this, time, delta);
    } catch (error) {
      reportError(error instanceof Error ? `${error.message}` : String(error));
      console.error(error);
    }
  };
}

/** Every this.add.text(...) renders at TEXT_RESOLUTION unless the style says otherwise. */
function patchTextResolution(): void {
  const factory = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
    text: (x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle) => Phaser.GameObjects.Text;
    displayList: Phaser.GameObjects.DisplayList;
    scene: Phaser.Scene;
  };
  factory.text = function (this: typeof factory, x, y, text, style) {
    const object = new Phaser.GameObjects.Text(this.scene, x, y, text, { resolution: TEXT_RESOLUTION, ...style });
    return this.displayList.add(object) as Phaser.GameObjects.Text;
  };
}

/**
 * Stop the browser from reacting to game keys (space scrolling, Tab moving
 * focus, Firefox quick find on ' and /, Alt+arrow navigating back).
 * Registered after Phaser's own listener, because Phaser ignores events whose
 * default is already prevented. Function keys (F5, F11, F12) and Ctrl/Cmd
 * shortcuts keep working.
 */
function installKeyboardPolicy(): void {
  window.addEventListener('keydown', (event) => {
    if (/^F\d{1,2}$/.test(event.key)) return;
    const altGraph = event.getModifierState?.('AltGraph') ?? false;
    if ((event.ctrlKey || event.metaKey) && !altGraph) return;
    if (event.altKey && !altGraph && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
  });
}

/** Zoom each scene's main camera so the 1280×720 world fills the ZOOM× canvas. */
function installCameraZoom(game: Phaser.Game): void {
  for (const scene of game.scene.getScenes(false)) attachCameraZoom(scene);
}

async function loadFonts(): Promise<void> {
  const faces = [
    '400 26px "Nunito"',
    '700 26px "Nunito"',
    '800 26px "Nunito"',
    '600 46px "Grenze Gotisch"',
    '800 76px "Grenze Gotisch"',
    '400 34px "Patrick Hand"',
  ];
  const loads = Promise.all([
    ...faces.map((face) => document.fonts.load(face, 'AaÄäÖöÅå')),
    // Colour emoji font (COLR format, which Chrome supports; bundled so emojis look the same everywhere).
    document.fonts.load('64px "Twemoji"', GAMES.map((game) => game.preloadText ?? '').join('') || '🎃'),
  ]);
  const timeout = new Promise((resolve) => window.setTimeout(resolve, 8000));
  await Promise.race([loads, timeout]);
}

async function start(): Promise<void> {
  await loadFonts();
  patchTextResolution();
  keepLoopAlive();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'peli',
    width: W * ZOOM,
    height: H * ZOOM,
    backgroundColor: COLORS.night,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    // The mouse is used only in the crossword (Pasi 20.10.); everything else is keyboard only.
    input: { keyboard: true, mouse: true, touch: false, gamepad: false },
    render: { antialias: true },
    banner: false,
    scene: ALL_SCENES,
  });

  game.events.once(Phaser.Core.Events.READY, () => {
    document.getElementById('lataus')?.remove();
    installKeyboardPolicy();
    installCameraZoom(game);
  });

  installAdminHotkey(game);
  installTestHooks(game, errors);
}

start().catch((error: unknown) => showFatalError(error instanceof Error ? error.message : String(error)));
