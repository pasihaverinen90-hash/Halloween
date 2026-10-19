import Phaser from 'phaser';
import { SCENES } from '../scenes/keys';
import { H, W } from './screen';
import { TEXT } from './theme';

/** PLACEHOLDER – replaced by the real implementation. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Pause);
  }

  create(): void {
    this.add.text(W / 2, H / 2, 'Tauko (tulossa)', TEXT.heading).setOrigin(0.5);
  }
}
