import Phaser from 'phaser';
import { SCENES } from './keys';
import { H, W } from '../ui/screen';
import { TEXT } from '../ui/theme';

/** PLACEHOLDER – replaced by the real implementation. */
export class GameResultsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GameResults);
  }

  create(): void {
    this.add.text(W / 2, H / 2, 'Tulokset pelin mukaan (tulossa)', TEXT.heading).setOrigin(0.5);
  }
}
