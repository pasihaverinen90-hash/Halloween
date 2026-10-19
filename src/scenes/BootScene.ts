import Phaser from 'phaser';
import { SCENES } from './keys';

/** PLACEHOLDER – replaced by the real implementation (asset loading + code-drawn textures). */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  create(): void {
    this.scene.start(SCENES.Start);
  }
}
