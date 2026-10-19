/*
 * Shared data types of the core. No Phaser imports here: core code must stay
 * runnable in unit tests (Node).
 */

/** One player's results in one game. */
export interface GameRecord {
  /** Scores of completed attempts in play order (integers 0..1000). Puzzle games have at most one. */
  attempts: number[];
  /** True when every attempt (action game) or the single round (puzzle game) has been played. */
  finished: boolean;
  /**
   * Snapshot of an unfinished attempt (e.g. hangman words solved so far), saved by the game through
   * GameContext.checkpoint. Lets a crashed/reloaded round resume. Cleared when the attempt finishes.
   */
  checkpoint: unknown | null;
  /** Score set by hand in correction mode. Overrides the attempts when not null. */
  manualScore: number | null;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}

export interface PlayerRecord {
  id: string;
  /** Display name, unique case-insensitively. */
  name: string;
  createdAt: string;
  /** Set when the thank-you screen has been shown (all games played). Cleared if a game is given again. */
  finishedAt: string | null;
  /** Results keyed by game id (GameDefinition.id). A missing key means "not played". */
  games: Record<string, GameRecord>;
}

/** Everything that is saved to localStorage and to backup files. */
export interface SaveData {
  app: 'halloween-peli-ilta';
  version: 1;
  updatedAt: string;
  players: PlayerRecord[];
}

/* ---------------------------------------------------------------------------
 * Sound effects (implemented in core/sfx.ts). Generated with Web Audio, quiet.
 * ------------------------------------------------------------------------- */

export type SfxName =
  | 'move' // cursor moved in a menu
  | 'select' // menu choice confirmed
  | 'back' // cancelled / went back
  | 'error' // not allowed, wrong password, invalid name
  | 'type' // character typed
  | 'erase' // character erased
  | 'correct' // right guess / hit
  | 'wrong' // wrong guess / miss
  | 'success' // word solved, level cleared
  | 'fail' // word failed, life lost
  | 'start' // attempt starts
  | 'result' // result shown
  | 'pause'
  | 'unpause'
  | 'tick' // countdown tick
  | 'drumroll' // award ceremony suspense (about 2 s)
  | 'reveal' // podium place revealed
  | 'fanfare'; // winner announced

export interface ToneOptions {
  /** Start frequency in Hz. */
  freq: number;
  /** Seconds. */
  duration: number;
  type?: OscillatorType;
  /** 0..1 relative to the master volume. Default 0.5. */
  volume?: number;
  /** Glide to this frequency over the duration. */
  slideTo?: number;
  /** Seconds before the sound starts. */
  delay?: number;
  /** Attack time in seconds. */
  attack?: number;
}

export interface NoiseOptions {
  duration: number;
  volume?: number;
  /** Filter cutoff in Hz (default 1200). */
  filterFreq?: number;
  filterType?: BiquadFilterType;
  delay?: number;
}

export interface Sfx {
  play(name: SfxName): void;
  /** Custom synthesized tone for game-specific effects. */
  tone(options: ToneOptions): void;
  /** Custom noise burst (hits, whooshes, explosions). */
  noise(options: NoiseOptions): void;
}
