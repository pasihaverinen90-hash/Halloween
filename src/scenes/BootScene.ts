import Phaser from 'phaser';
import { allAssetSpecs, createMissingTextures, queueReplacementImages } from '../ui/assetLoader';
import type { AssetSpec } from '../games/types';
import { H, W } from '../ui/screen';
import { CSS, TEXT } from '../ui/theme';
import { SCENES } from './keys';

/**
 * Loads Pasi's replacement images from public/assets/ and draws every other
 * image by code, then opens the start screen.
 */
export class BootScene extends Phaser.Scene {
  private specs: AssetSpec[] = [];
  private queued: string[] = [];

  constructor() {
    super(SCENES.Boot);
  }

  preload(): void {
    this.add.text(W / 2, H / 2, 'Ladataan…', { ...TEXT.heading, color: CSS.muted }).setOrigin(0.5);
    this.specs = allAssetSpecs();
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`Kuvaa ${String(file.url)} ei voitu ladata. Käytetään koodilla piirrettyä kuvaa.`);
    });
    this.queued = queueReplacementImages(this, this.specs);
  }

  create(): void {
    const loaded = this.queued.filter((key) => this.textures.exists(key));
    if (loaded.length > 0) console.info(`Omat kuvat käytössä: ${loaded.join(', ')}`);
    createMissingTextures(this, this.specs);
    this.scene.start(SCENES.Start);
  }
}
