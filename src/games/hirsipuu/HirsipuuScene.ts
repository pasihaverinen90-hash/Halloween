import Phaser from 'phaser';
import type { GameContext, GameSceneData } from '../types';
import { H, W } from '../../ui/screen';
import { TEXT } from '../../ui/theme';

/** PLACEHOLDER – the real hangman replaces this. Enter finishes with 500 points. */
export class HirsipuuScene extends Phaser.Scene {
  private ctx!: GameContext;

  constructor() {
    super('Hirsipuu');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
  }

  create(): void {
    this.add.text(W / 2, H / 2, 'Hirsipuu (tulossa)\nEnter = 500 pistettä', TEXT.heading).setOrigin(0.5).setAlign('center');
    this.input.keyboard?.once('keydown-ENTER', () => this.ctx.finish(500));
  }
}
