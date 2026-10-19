import type Phaser from 'phaser';
import type { Sfx } from '../core/types';

/**
 * action = three attempts in a row, best counts ("Yritys 1/3").
 * puzzle = a single round (hangman, picture riddles, crossword).
 */
export type GameKind = 'action' | 'puzzle';

/** Text of the instruction screen. All in Finnish. */
export interface GameInstructions {
  /** One or two sentences: what the player tries to do. */
  goal: string;
  /** Keys and what they do, e.g. ['A–Ö', 'Arvaa kirjain']. "Esc – Tauko" is added automatically. */
  keys: Array<[key: string, action: string]>;
  /** Rules as short sentences. */
  rules: string[];
  /** How points are earned. "Enintään 1000 pistettä" and the attempt rule are added automatically. */
  scoring: string[];
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
  /** Report the result. The core rounds and clamps the score to 0..1000. Call exactly once. */
  finish(score: number): void;
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
  /** Size in the 1280×720 game space. Replacement images are scaled to fit this box. */
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
  /** Menu preview image (about 360×200). */
  preview: AssetSpec;
  /** All other replaceable images of the game. */
  assets: AssetSpec[];
}

/** Texture key for an asset: file name without extension. */
export function assetKey(spec: Pick<AssetSpec, 'file'> | string): string {
  const file = typeof spec === 'string' ? spec : spec.file;
  return file.replace(/\.[a-z0-9]+$/i, '');
}
