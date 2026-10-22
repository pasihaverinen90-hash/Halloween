import type { GameKind } from '../games/types';

/** Phaser scene keys of the core. Game scenes use GameDefinition.sceneKey. */
export const SCENES = {
  Boot: 'Boot',
  // Player flow
  Start: 'Start', // aloitusnäkymä: name entry
  Menu: 'Menu', // päävalikko: game grid
  Instructions: 'Instructions', // ohjeruutu
  GameHost: 'GameHost', // runs attempts of one game, pause, saving
  Thanks: 'Thanks', // kiitosnäkymä
  // Password-protected
  ResultsMenu: 'ResultsMenu', // tulosnäkymien valikko
  Podium: 'Podium', // palkintojenjako
  GameResults: 'GameResults', // tulokset pelin mukaan
  PlayerResults: 'PlayerResults', // tulokset pelaajan mukaan
  Correction: 'Correction', // korjaustila (Ctrl + Shift + K)
  // Overlays (src/ui)
  Pause: 'Pause',
  AttemptIntro: 'AttemptIntro',
  AttemptResult: 'AttemptResult',
  Password: 'Password',
  Dialog: 'Dialog', // confirm / info dialog
  Prompt: 'Prompt', // single-line text/number input
} as const;

/* Scene data contracts. Pass exactly these objects to scene.start/launch. */

export interface InstructionsData {
  gameId: string;
}

export interface GameHostData {
  gameId: string;
}

/** "Yritys 2/3" screen before an action-game attempt. Calls onStart when the player presses Enter. */
export interface AttemptIntroData {
  gameName: string;
  /** 1-based attempt number. */
  attempt: number;
  total: number;
  /** Best score so far, or null before the first attempt. */
  best: number | null;
  /** A line from the game, e.g. where this attempt continues (GameDefinition.attemptNote). */
  note?: string | null;
  onStart: () => void;
}

/** Result screen after an attempt (action) or the round (puzzle). Calls onContinue on Enter. */
export interface AttemptResultData {
  gameName: string;
  kind: GameKind;
  /** 1-based attempt number. */
  attempt: number;
  total: number;
  /** Score of this attempt. */
  score: number;
  /** Best score so far including this attempt (the score that counts). */
  best: number;
  /** True after the last attempt: the game is over and its result is final. */
  isFinal: boolean;
  onContinue: () => void;
}

/** Display-only pause overlay. GameHost owns the Esc/Enter keys that pause and resume. */
export interface PauseData {
  gameName: string;
}

/** Password prompt overlay. Esc cancels. */
export interface PasswordData {
  /** Heading, e.g. 'Tulokset' or 'Korjaustila'. */
  title: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Confirm or info dialog over a paused scene. Use the helpers in src/ui/dialogs.ts. */
export interface DialogData {
  title: string;
  message: string;
  /** Label of the confirm button. Default 'Kyllä'. */
  confirmLabel?: string;
  /** Label of the cancel button. Default 'Peruuta'. null = info dialog with only the confirm button. */
  cancelLabel?: string | null;
  /** Button selected when the dialog opens. Default 'cancel' (safer for destructive actions). */
  defaultChoice?: 'confirm' | 'cancel';
  /** Show the confirm button in red (destructive action). */
  danger?: boolean;
  onClose: (confirmed: boolean) => void;
}

/** Single-line text input over a paused scene. Use the helpers in src/ui/dialogs.ts. */
export interface PromptData {
  title: string;
  message?: string;
  initial?: string;
  maxLength: number;
  /** Allowed single characters, e.g. /^[0-9]$/. Default: any printable character. */
  allow?: RegExp;
  /** Return a Finnish error text to keep the prompt open, or null to accept the value. */
  validate?: (value: string) => string | null;
  /** Called with the accepted value, or null when cancelled with Esc. */
  onClose: (value: string | null) => void;
}
