import type Phaser from 'phaser';
import { CONFIG } from './config';
import { addTestActionGame } from './testGame';

/**
 * Automated browser tests (Playwright) cannot read text drawn on a canvas, so
 * the game exposes a small read-only API at window.__peli. Scenes may add a
 * `getTestState()` method that returns plain data about what is on screen.
 */
export interface TestStateProvider {
  getTestState(): unknown;
}

export interface PeliTestApi {
  game: Phaser.Game;
  /** Keys of running scenes in render order (bottom first). */
  activeScenes(): string[];
  /** getTestState() of every running or paused scene that implements it, by scene key. */
  sceneStates(): Record<string, unknown>;
  /** Saved results exactly as stored in localStorage (parsed), or null. */
  saved(): unknown;
  /** Recent runtime error messages. */
  errors: string[];
  /** Register the invisible test-only action game (src/testGame.ts). Call on the Start screen. */
  addTestActionGame(): void;
}

declare global {
  interface Window {
    __peli?: PeliTestApi;
  }
}

function hasTestState(scene: Phaser.Scene): scene is Phaser.Scene & TestStateProvider {
  return typeof (scene as Partial<TestStateProvider>).getTestState === 'function';
}

export function installTestHooks(game: Phaser.Game, errors: string[]): void {
  window.__peli = {
    game,
    activeScenes: () => game.scene.getScenes(true).map((s) => s.sys.settings.key),
    sceneStates: () => {
      const states: Record<string, unknown> = {};
      for (const scene of game.scene.getScenes(false)) {
        if ((scene.sys.isActive() || scene.sys.isPaused()) && hasTestState(scene)) {
          states[scene.sys.settings.key] = scene.getTestState();
        }
      }
      return states;
    },
    saved: () => {
      try {
        return JSON.parse(window.localStorage.getItem(CONFIG.storage.key) ?? 'null');
      } catch {
        return null;
      }
    },
    errors,
    addTestActionGame: () => addTestActionGame(game),
  };
}
