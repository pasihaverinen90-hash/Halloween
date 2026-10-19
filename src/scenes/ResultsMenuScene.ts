import Phaser from 'phaser';
import { SCENES } from './keys';
import { H, W } from '../ui/screen';
import { TEXT } from '../ui/theme';

/** PLACEHOLDER – replaced by the real implementation. */
export class ResultsMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.ResultsMenu);
  }

  create(): void {
    this.add.text(W / 2, H / 2, 'Tulokset (tulossa)', TEXT.heading).setOrigin(0.5);
  }
}
