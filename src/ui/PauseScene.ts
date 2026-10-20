import Phaser from 'phaser';
import { SCENES, type PauseData } from '../scenes/keys';
import { addKeyHints } from './hints';
import { addCenteredPanel, addDim } from './overlay';
import { H, W } from './screen';
import { CSS, TEXT } from './theme';

/**
 * "Tauko" over a paused game. Display only: GameHost owns the keys that pause
 * and resume, so this scene never handles input.
 */
export class PauseScene extends Phaser.Scene {
  private gameName = '';

  constructor() {
    super(SCENES.Pause);
  }

  init(data: PauseData): void {
    this.gameName = data?.gameName ?? '';
  }

  create(): void {
    this.scene.bringToTop();
    addDim(this, 0.7);
    addCenteredPanel(this, 620, 300);
    const title = this.add.text(W / 2, H / 2 - 50, 'Tauko', { ...TEXT.title, fontSize: '96px' }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 40, this.gameName, { ...TEXT.body, color: CSS.muted }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 92, 'Peli odottaa. Mitään ei menetetä.', { ...TEXT.small }).setOrigin(0.5);
    addKeyHints(this, [['Esc tai Enter', 'Jatka']], undefined, { opaque: true });
    this.tweens.add({ targets: title, alpha: { from: 1, to: 0.55 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  getTestState(): unknown {
    return { gameName: this.gameName };
  }
}
