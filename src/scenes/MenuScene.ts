import Phaser from 'phaser';
import { CONFIG } from '../config';
import { getFreeplay } from '../core/freeplay';
import { sfx } from '../core/sfx';
import { ALL_GAMES } from '../games/registry';
import type { GameDefinition } from '../games/types';
import { addBackdrop } from '../ui/backdrop';
import { addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { addAsset } from '../ui/place';
import { W } from '../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../ui/theme';
import { moveInGrid, type GridDirection } from '../ui/widgets/gridNav';
import { paintPanel } from '../ui/widgets/panel';
import { SCENES } from './keys';
import { switchTo } from './nav';

const COLUMNS = 4;
const TILE_W = 270;
const TILE_H = 240;
const GAP_X = 26;
const GAP_Y = 22;
const GRID_TOP = 136;
const PREVIEW_W = 228;
const PREVIEW_H = 126;

const fi = (n: number): string => n.toLocaleString('fi-FI');

interface Tile {
  /** A game, or null for the top lists tile. */
  game: GameDefinition | null;
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Graphics;
}

/**
 * Freeplayn pelivalikko (Pasi 23.10.): every game as a preview tile with its
 * record, and a last tile for the top lists. Arrows choose, Enter plays, Esc
 * goes back to the start screen. Nothing is greyed out: play as often as you like.
 */
export class MenuScene extends Phaser.Scene {
  private tiles: Tile[] = [];
  private selected = 0;
  private leaving = false;

  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    this.tiles = [];
    this.leaving = false;
    if (!getFreeplay().isOpen()) {
      switchTo(this, SCENES.Start);
      return;
    }

    addBackdrop(this, { dim: 0.35 });
    this.add.text(W / 2, 62, 'FREE PLAY', { ...TEXT.title, fontSize: '64px' }).setOrigin(0.5);
    this.add.text(48, 62, 'Pelaa niin paljon kuin haluat', { ...TEXT.bodyBold, fontSize: '24px', color: CSS.muted }).setOrigin(0, 0.5);

    const items: Array<GameDefinition | null> = [...ALL_GAMES, null];
    const rows = Math.ceil(items.length / COLUMNS);
    items.forEach((game, i) => {
      const row = Math.floor(i / COLUMNS);
      const inRow = row === rows - 1 ? items.length - row * COLUMNS : COLUMNS;
      const col = i % COLUMNS;
      const rowWidth = inRow * TILE_W + (inRow - 1) * GAP_X;
      const x = W / 2 - rowWidth / 2 + col * (TILE_W + GAP_X) + TILE_W / 2;
      const y = GRID_TOP + row * (TILE_H + GAP_Y) + TILE_H / 2;
      this.tiles.push(game ? this.buildTile(game, x, y) : this.buildTopListsTile(x, y));
    });
    this.selected = Math.min(this.selected, this.tiles.length - 1);
    this.paint(false);

    addKeyHints(this, [
      ['←→↑↓', 'Valitse'],
      ['Enter', 'Pelaa'],
      ['Esc', 'Takaisin alkuun'],
    ]);
    const move = (dir: GridDirection) => () => this.move(dir);
    onKeys(
      this,
      {
        ArrowLeft: move('left'),
        ArrowRight: move('right'),
        ArrowUp: move('up'),
        ArrowDown: move('down'),
        Enter: () => this.choose(),
        Escape: () => this.back(),
      },
      { allowRepeat: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] },
    );
  }

  getTestState(): unknown {
    const freeplay = getFreeplay();
    return {
      selected: this.tiles[this.selected] ? (this.tiles[this.selected].game?.id ?? 'ennatykset') : null,
      tiles: this.tiles.map((tile) => (tile.game ? { id: tile.game.id, record: freeplay.top(tile.game.id)[0]?.score ?? null } : { id: 'ennatykset' })),
    };
  }

  private buildTile(game: GameDefinition, x: number, y: number): Tile {
    const best = getFreeplay().top(game.id)[0];
    const container = this.add.container(x, y);
    const frame = this.add.graphics({ x: -TILE_W / 2, y: -TILE_H / 2 });
    const preview = addAsset(this, game.preview, 0, -TILE_H / 2 + 14 + PREVIEW_H / 2, { width: PREVIEW_W, height: PREVIEW_H });
    const name = this.add.text(0, 44, game.name, { fontFamily: FONTS.title, fontStyle: '800', fontSize: '30px', color: CSS.bone }).setOrigin(0.5);
    const genre = this.add.text(0, 72, game.genre, { ...TEXT.small, fontSize: '18px' }).setOrigin(0.5);
    const record = this.add
      .text(0, 98, best ? `Ennätys ${fi(best.score)} · ${best.name}` : 'Ei vielä ennätystä', {
        fontFamily: FONTS.ui,
        fontStyle: '800',
        fontSize: '18px',
        color: best ? CSS.gold : CSS.green,
        fixedWidth: TILE_W - 16,
        align: 'center',
      })
      .setOrigin(0.5);
    container.add([frame, preview, name, genre, record]);
    return { game, container, frame };
  }

  private buildTopListsTile(x: number, y: number): Tile {
    const container = this.add.container(x, y);
    const frame = this.add.graphics({ x: -TILE_W / 2, y: -TILE_H / 2 });
    const badge = this.add
      .text(0, -TILE_H / 2 + 14 + PREVIEW_H / 2, `TOP ${CONFIG.freeplay.topSize}`, { ...TEXT.title, fontSize: '64px', color: CSS.gold })
      .setOrigin(0.5);
    const name = this.add.text(0, 44, 'Ennätykset', { fontFamily: FONTS.title, fontStyle: '800', fontSize: '30px', color: CSS.bone }).setOrigin(0.5);
    const genre = this.add.text(0, 72, 'Kaikkien pelien top-listat', { ...TEXT.small, fontSize: '18px' }).setOrigin(0.5);
    container.add([frame, badge, name, genre]);
    return { game: null, container, frame };
  }

  private paint(animate: boolean): void {
    this.tiles.forEach((tile, i) => {
      const selected = i === this.selected;
      paintPanel(tile.frame, TILE_W, TILE_H, {
        fill: selected ? COLORS.panelLight : COLORS.panel,
        border: selected ? COLORS.orange : COLORS.border,
        borderWidth: selected ? 4 : 2,
        radius: 16,
        alpha: 0.95,
        glow: selected,
      });
      const scale = selected ? 1.04 : 1;
      if (animate) this.tweens.add({ targets: tile.container, scale, duration: 140, ease: 'Sine.Out' });
      else tile.container.setScale(scale);
      tile.container.setDepth(selected ? 2 : 1);
    });
  }

  private move(dir: GridDirection): void {
    if (this.leaving) return;
    const next = moveInGrid(this.selected, this.tiles.length, COLUMNS, dir);
    if (next === this.selected) return;
    this.selected = next;
    sfx.play('move');
    this.paint(true);
  }

  private choose(): void {
    if (this.leaving) return;
    const tile = this.tiles[this.selected];
    if (!tile) return;
    this.leaving = true;
    sfx.play('select');
    if (tile.game) switchTo(this, SCENES.Instructions, { gameId: tile.game.id, freeplay: true });
    else switchTo(this, SCENES.Highscores);
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    sfx.play('back');
    switchTo(this, SCENES.Start);
  }
}
