import Phaser from 'phaser';
import { SCENES } from '../scenes/keys';
import { H, W } from './screen';
import { TEXT } from './theme';

/** PLACEHOLDER – replaced by the real implementation. */
export class DialogScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Dialog);
  }

  create(): void {
    this.add.text(W / 2, H / 2, 'Vahvistus (tulossa)', TEXT.heading).setOrigin(0.5);
  }
}
