import type Phaser from 'phaser';
import { GAMES } from '../games/registry';
import { AttemptIntroScene } from '../ui/AttemptIntroScene';
import { AttemptResultScene } from '../ui/AttemptResultScene';
import { DialogScene } from '../ui/DialogScene';
import { PasswordScene } from '../ui/PasswordScene';
import { PromptScene } from '../ui/PromptScene';
import { BootScene } from './BootScene';
import { CorrectionScene } from './CorrectionScene';
import { GameHostScene } from './GameHostScene';
import { GameResultsScene } from './GameResultsScene';
import { InstructionsScene } from './InstructionsScene';
import { MenuScene } from './MenuScene';
import { PlayerResultsScene } from './PlayerResultsScene';
import { PodiumScene } from './PodiumScene';
import { ResultsMenuScene } from './ResultsMenuScene';
import { StartScene } from './StartScene';
import { ThanksScene } from './ThanksScene';
import { UnlockScene } from './UnlockScene';

/**
 * Every scene of the game. The first one (Boot) starts automatically.
 * Overlays come after the screens so they render on top.
 */
export const ALL_SCENES: Array<new () => Phaser.Scene> = [
  BootScene,
  UnlockScene,
  StartScene,
  MenuScene,
  InstructionsScene,
  GameHostScene,
  ThanksScene,
  ResultsMenuScene,
  PodiumScene,
  GameResultsScene,
  PlayerResultsScene,
  CorrectionScene,
  ...GAMES.map((game) => game.sceneClass),
  AttemptIntroScene,
  AttemptResultScene,
  PasswordScene,
  DialogScene,
  PromptScene,
];
