import Phaser from 'phaser';
import { getDb } from '../core/db';
import { gameStatus, isPlayerDone, playerTotal, recordScore, type GameStatus } from '../core/scores';
import { session } from '../core/session';
import { sfx } from '../core/sfx';
import type { PlayerRecord } from '../core/types';
import { GAMES, GAME_IDS } from '../games/registry';
import type { GameDefinition } from '../games/types';
import { addBackdrop } from '../ui/backdrop';
import { addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { addAsset } from '../ui/place';
import { W } from '../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../ui/theme';
import { showToast } from '../ui/toast';
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
  game: GameDefinition;
  status: GameStatus;
  score: number | null;
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Graphics;
}

/** Päävalikko: the games as preview tiles. Arrows choose, Enter plays. Played games are grey. */
export class MenuScene extends Phaser.Scene {
  private tiles: Tile[] = [];
  private selected = 0;
  private player: PlayerRecord | undefined;
  private leaving = false;

  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    this.tiles = [];
    this.leaving = false;
    const db = getDb();
    this.player = session.playerId ? db.getPlayer(session.playerId) : undefined;
    if (!this.player) {
      switchTo(this, SCENES.Start);
      return;
    }
    if (isPlayerDone(this.player, GAME_IDS)) {
      switchTo(this, SCENES.Thanks);
      return;
    }
    const player = this.player;

    addBackdrop(this, { dim: 0.35 });
    this.add.text(W / 2, 62, 'Valitse peli', { ...TEXT.title, fontSize: '64px' }).setOrigin(0.5);
    this.add.text(48, 62, player.name, { ...TEXT.bodyBold, fontSize: '30px' }).setOrigin(0, 0.5);
    this.add
      .text(W - 48, 62, `Pisteesi: ${fi(playerTotal(player, GAME_IDS))}`, { ...TEXT.bodyBold, fontSize: '30px', color: CSS.orange })
      .setOrigin(1, 0.5);

    const rows = Math.ceil(GAMES.length / COLUMNS);
    GAMES.forEach((game, i) => {
      const row = Math.floor(i / COLUMNS);
      const inRow = row === rows - 1 ? GAMES.length - row * COLUMNS : COLUMNS;
      const col = i % COLUMNS;
      const rowWidth = inRow * TILE_W + (inRow - 1) * GAP_X;
      const x = W / 2 - rowWidth / 2 + col * (TILE_W + GAP_X) + TILE_W / 2;
      const y = GRID_TOP + row * (TILE_H + GAP_Y) + TILE_H / 2;
      this.tiles.push(this.buildTile(game, player, x, y));
    });

    const firstOpen = this.tiles.findIndex((tile) => tile.status !== 'finished');
    this.selected = Math.max(0, firstOpen);
    this.paint(false);

    addKeyHints(this, [
      ['←→↑↓', 'Valitse peli'],
      ['Enter', 'Pelaa'],
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
      },
      { allowRepeat: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] },
    );
  }

  getTestState(): unknown {
    return {
      player: this.player?.name ?? null,
      total: this.player ? playerTotal(this.player, GAME_IDS) : 0,
      selected: this.tiles[this.selected]?.game.id ?? null,
      tiles: this.tiles.map((tile) => ({ id: tile.game.id, status: tile.status, score: tile.score })),
    };
  }

  private buildTile(game: GameDefinition, player: PlayerRecord, x: number, y: number): Tile {
    const record = player.games[game.id];
    const status = gameStatus(record);
    const score = recordScore(record);
    const container = this.add.container(x, y);
    const frame = this.add.graphics({ x: -TILE_W / 2, y: -TILE_H / 2 });
    const preview = addAsset(this, game.preview, 0, -TILE_H / 2 + 14 + PREVIEW_H / 2, {
      width: PREVIEW_W,
      height: PREVIEW_H,
    });
    const name = this.add
      .text(0, 44, game.name, { fontFamily: FONTS.title, fontStyle: '800', fontSize: '30px', color: CSS.bone })
      .setOrigin(0.5);
    const genre = this.add.text(0, 72, game.genre, { ...TEXT.small, fontSize: '18px' }).setOrigin(0.5);
    const statusText =
      status === 'finished' ? `Pelattu · ${fi(score ?? 0)} p` : status === 'inProgress' ? 'Kesken – jatka' : 'Pelaamatta';
    const statusLabel = this.add
      .text(0, 98, statusText, {
        fontFamily: FONTS.ui,
        fontStyle: '800',
        fontSize: '18px',
        color: status === 'inProgress' ? CSS.orange : status === 'finished' ? CSS.muted : CSS.green,
      })
      .setOrigin(0.5);
    container.add([frame, preview, name, genre, statusLabel]);
    if (status === 'finished') {
      preview.setTint(0x6a6478);
      name.setColor(CSS.grey);
      const veil = this.add.rectangle(0, 0, TILE_W, TILE_H, COLORS.night, 0.35);
      container.add(veil);
    }
    return { game, status, score, container, frame };
  }

  private paint(animate: boolean): void {
    this.tiles.forEach((tile, i) => {
      const selected = i === this.selected;
      const finished = tile.status === 'finished';
      paintPanel(tile.frame, TILE_W, TILE_H, {
        fill: selected ? COLORS.panelLight : COLORS.panel,
        border: selected ? (finished ? COLORS.grey : COLORS.orange) : COLORS.border,
        borderWidth: selected ? 4 : 2,
        radius: 16,
        alpha: finished ? 0.8 : 0.95,
        glow: selected && !finished,
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
    if (tile.status === 'finished') {
      sfx.play('error');
      showToast(this, 'Olet jo pelannut tämän pelin.', 'info');
      return;
    }
    this.leaving = true;
    sfx.play('select');
    switchTo(this, SCENES.Instructions, { gameId: tile.game.id });
  }
}
