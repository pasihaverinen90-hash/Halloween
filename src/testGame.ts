import Phaser from 'phaser';
import { GAMES, GAME_IDS } from './games/registry';
import { assetKey } from './games/types';
import type { AssetSpec, GameContext, GameDefinition, GameSceneData } from './games/types';
import { SCENES } from './scenes/keys';
import { H, W, ZOOM, attachCameraZoom } from './ui/screen';
import { TEXT } from './ui/theme';

/*
 * A minimal ACTION game for automated browser tests only. Pasi decided that
 * the real menu contains no test game, so this is registered only when a test
 * calls window.__peli.addTestActionGame(). It lets tests exercise the
 * three-attempt flow before the first real action game exists.
 */

declare global {
  interface Window {
    /** Score the test game reports on Enter (default 300). */
    __peliTestScore?: number;
  }
}

const TEST_GAME_ID = 'testipeli';
const TEST_SCENE_KEY = 'Testipeli';

class TestActionScene extends Phaser.Scene {
  private ctx!: GameContext;
  private finished = false;

  constructor() {
    super(TEST_SCENE_KEY);
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.finished = false;
  }

  create(): void {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1d2a1d);
    this.add.text(W / 2, H / 2 - 30, 'Testipeli', TEXT.title).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 50, 'Enter lopettaa yrityksen', TEXT.body).setOrigin(0.5);
    this.input.keyboard?.on('keydown-ENTER', (event: KeyboardEvent) => {
      if (event.repeat || this.finished) return;
      this.finished = true;
      this.ctx.finish(window.__peliTestScore ?? 300);
    });
  }

  getTestState(): unknown {
    return { finished: this.finished };
  }
}

const preview: AssetSpec = {
  file: 'valikko-testipeli.png',
  width: 360,
  height: 200,
  title: 'Testipeli',
  prompt: 'Vain automaattisia testejä varten.',
  style: '-',
  transparent: false,
  draw(ctx, width, height) {
    ctx.fillStyle = '#1d2a1d';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#8fdc5a';
    ctx.font = '700 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TESTI', width / 2, height / 2);
  },
};

const definition: GameDefinition = {
  id: TEST_GAME_ID,
  name: 'Testipeli',
  genre: 'Vain testeille',
  kind: 'action',
  sceneKey: TEST_SCENE_KEY,
  sceneClass: TestActionScene,
  instructions: {
    goal: 'Automaattisten testien toimintapeli.',
    keys: [['Enter', 'Lopeta yritys']],
    rules: ['Yritys päättyy, kun painat Enteriä.'],
    scoring: ['Pisteet asetetaan testistä.'],
  },
  preview,
  assets: [],
};

/** Register the test-only action game. Call on the Start screen, before a player is created. */
export function addTestActionGame(game: Phaser.Game): void {
  if (GAME_IDS.includes(TEST_GAME_ID)) return;
  (GAMES as GameDefinition[]).push(definition);
  (GAME_IDS as string[]).push(TEST_GAME_ID);

  const key = assetKey(preview);
  if (!game.textures.exists(key)) {
    const texture = game.textures.createCanvas(key, preview.width * ZOOM, preview.height * ZOOM);
    if (texture) {
      texture.context.scale(ZOOM, ZOOM);
      preview.draw(texture.context, preview.width, preview.height);
      texture.refresh();
    }
  }

  const scene = game.scene.add(TEST_SCENE_KEY, TestActionScene, false);
  if (scene) attachCameraZoom(scene);
  // Keep the game below the overlay scenes so the result screens draw on top of it.
  game.scene.moveBelow(SCENES.AttemptIntro, TEST_SCENE_KEY);
}
