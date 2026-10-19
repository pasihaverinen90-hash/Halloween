import Phaser from 'phaser';
import { SCENES } from '../scenes/keys';
import { H, W } from './screen';
import { TEXT } from './theme';

/** PLACEHOLDER – replaced by the real implementation. */
export class PromptScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Prompt);
  }

  create(): void {
    this.add.text(W / 2, H / 2, 'Syöttö (tulossa)', TEXT.heading).setOrigin(0.5);
  }
}
