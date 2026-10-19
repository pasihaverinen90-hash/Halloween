import Phaser from 'phaser';
import { SCENES } from '../scenes/keys';
import { H, W } from './screen';
import { TEXT } from './theme';

/** PLACEHOLDER – replaced by the real implementation. */
export class AttemptIntroScene extends Phaser.Scene {
  constructor() {
    super(SCENES.AttemptIntro);
  }

  create(): void {
    this.add.text(W / 2, H / 2, 'Yritys (tulossa)', TEXT.heading).setOrigin(0.5);
  }
}
