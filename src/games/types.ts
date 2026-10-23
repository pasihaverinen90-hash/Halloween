import type Phaser from 'phaser';
import type { AttemptEnd, Sfx } from '../core/types';

/**
 * action = three attempts in a row, best counts ("Yritys 1/3").
 * puzzle = a single round (hangman, picture riddles, crossword).
 */
export type GameKind = 'action' | 'puzzle';

/** Text of the instruction screen. All in Finnish. */
export interface GameInstructions {
  /** One or two sentences: what the player tries to do. */
  goal: string;
  /** Keys and what they do, e.g. ['A–Ö', 'Arvaa kirjain']. */
  keys: Array<[key: string, action: string]>;
  /** Rules as short sentences. */
  rules: string[];
  /** What gives points, in a line or two, without formulas (Pasi 23.10.). The attempt rule is added automatically. */
  scoring: string[];
  /** Replaces the automatic line about attempts (e.g. when the attempts continue from each other). */
  attemptRule?: string;
}

/** Lets a puzzle round survive a crash or reload. The game does not know where it is stored. */
export interface GameCheckpoint {
  /** The latest snapshot of this unfinished round, or null when the round starts fresh. */
  readonly initial: unknown | null;
  /** Persist a JSON-serialisable snapshot. Call after every meaningful step (e.g. each guess). */
  save(state: unknown): void;
}

/**
 * Everything the core hands to a game scene. A game plays exactly one attempt
 * (action) or one round (puzzle) and then calls finish(score) once.
 * Games know nothing about attempts, saving or menus.
 */
export interface GameContext {
  /**
   * Report the result. The core rounds and clamps the score to 0..1000. Call exactly once.
   * `end.carry` is handed to the next attempt (ctx.carry); `end.complete` skips the remaining attempts.
   */
  finish(score: number, end?: AttemptEnd): void;
  /** What the previous attempt handed on with finish(score, { carry }), or null (first attempt, or nothing handed on). */
  carry: unknown | null;
  checkpoint: GameCheckpoint;
  sfx: Sfx;
}

/** Scene data every game scene receives: this.scene.launch(def.sceneKey, { ctx }). */
export interface GameSceneData {
  ctx: GameContext;
}

/**
 * A replaceable image. If public/assets/ contains a file with the same base
 * name (case-insensitive, .png/.jpg/.webp), the game uses it; otherwise draw()
 * produces the image by code. Metadata is also used to generate ASSETS.md.
 */
export interface AssetSpec {
  /** File name Pasi uses, e.g. 'hirsipuu-luuranko-1.png'. Texture key = name without extension. */
  file: string;
  /** Size in the 1280×720 game space (of one frame, for animations). Replacement images are scaled to fit this box. */
  width: number;
  height: number;
  /** Short Finnish title, e.g. 'Luurangon pääkallo'. */
  title: string;
  /** Finnish description that Pasi can give as-is to an image generator. */
  prompt: string;
  /** Style, e.g. 'Pelkistetty piirroskuva' or 'Pikselitaide'. */
  style: string;
  /** Does the image need a transparent background? */
  transparent: boolean;
  /** Animation frames side by side in one image, left to right. */
  frames?: { count: number; order: string };
  /**
   * Code-drawn fallback. Draws in width×height units; the canvas is already
   * scaled for the render resolution, so just draw in game-space units.
   * With frames, `width` is the whole strip (frame width × count).
   */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
}

/** One minigame. Each game lives in src/games/<id>/ and default-exports this from index.ts. */
export interface GameDefinition {
  /** Stable id used in saved results and as the folder name, e.g. 'hirsipuu'. Never change it. */
  id: string;
  /** Temporary display name (final names are decided with the theme). */
  name: string;
  /** Genre shown under the name, e.g. 'Hirsipuu'. */
  genre: string;
  kind: GameKind;
  /** Phaser scene key of the game scene. */
  sceneKey: string;
  /** The game scene class. Receives GameSceneData in init()/create(). */
  sceneClass: new () => Phaser.Scene;
  instructions: GameInstructions;
  /** Attempts when not the usual for its kind (CONFIG.attempts), e.g. the platformer's 5 (Pasi 21.10.). */
  attempts?: number;
  /** A line for the "Yritys 2/5" screen from what the previous attempt handed on (e.g. where it continues). */
  attemptNote?(carry: unknown): string | null;
  /** Menu preview image (about 360×200). */
  preview: AssetSpec;
  /** All other replaceable images of the game. */
  assets: AssetSpec[];
  /** Characters the game draws with web fonts (e.g. emojis), loaded before the game starts. */
  preloadText?: string;
}

/** Texture key for an asset: file name without extension. */
export function assetKey(spec: Pick<AssetSpec, 'file'> | string): string {
  const file = typeof spec === 'string' ? spec : spec.file;
  return file.replace(/\.[a-z0-9]+$/i, '');
}
