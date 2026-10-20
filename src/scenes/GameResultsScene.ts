import Phaser from 'phaser';
import { getDb } from '../core/db';
import { rankGame, type GameRow } from '../core/scores';
import { sfx } from '../core/sfx';
import { GAMES } from '../games/registry';
import { addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { W } from '../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../ui/theme';
import { drawPanel } from '../ui/widgets/panel';
import { addAdminHeader, fi, PLACE_COLORS } from './admin/common';
import { SCENES } from './keys';
import { switchTo } from './nav';

const VISIBLE_ROWS = 9;
const ROW_H = 44;
const TABLE_W = 760;
const TABLE_TOP = 214;

/** Tulokset pelin mukaan: one game's top list. ←/→ switch game, ↑/↓ scroll. */
export class GameResultsScene extends Phaser.Scene {
  private gameIndex = 0;
  private scroll = 0;
  private rows: GameRow[] = [];
  private layer!: Phaser.GameObjects.Container;
  private leaving = false;

  constructor() {
    super(SCENES.GameResults);
  }

  create(): void {
    this.leaving = false;
    this.scroll = 0;
    this.gameIndex = Math.min(this.gameIndex, GAMES.length - 1);
    addAdminHeader(this, 'Tulokset pelin mukaan');
    drawPanel(this, W / 2 - TABLE_W / 2 - 20, TABLE_TOP - 70, TABLE_W + 40, 480, { radius: 18 });
    this.layer = this.add.container(0, 0);
    this.render();
    addKeyHints(this, [
      ['←→', 'Vaihda peliä'],
      ['↑↓', 'Selaa'],
      ['Esc', 'Takaisin'],
    ]);
    onKeys(
      this,
      {
        ArrowLeft: () => this.switchGame(-1),
        ArrowRight: () => this.switchGame(1),
        ArrowUp: () => this.scrollBy(-1),
        ArrowDown: () => this.scrollBy(1),
        Escape: () => this.back(),
      },
      { allowRepeat: ['ArrowUp', 'ArrowDown'] },
    );
  }

  getTestState(): unknown {
    return {
      gameId: GAMES[this.gameIndex]?.id ?? null,
      rows: this.rows.map((r) => ({ name: r.player.name, score: r.score, rank: r.rank, status: r.status })),
    };
  }

  private switchGame(step: number): void {
    if (GAMES.length < 2) return;
    this.gameIndex = (this.gameIndex + step + GAMES.length) % GAMES.length;
    this.scroll = 0;
    sfx.play('move');
    this.render();
  }

  private scrollBy(step: number): void {
    const max = Math.max(0, this.rows.length - VISIBLE_ROWS);
    const next = Math.min(max, Math.max(0, this.scroll + step));
    if (next === this.scroll) return;
    this.scroll = next;
    this.render();
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    switchTo(this, SCENES.ResultsMenu);
  }

  private render(): void {
    this.layer.removeAll(true);
    const game = GAMES[this.gameIndex];
    if (!game) return;
    const players = getDb().players();
    this.rows = rankGame(players, game.id);
    const left = W / 2 - TABLE_W / 2;

    const title = this.add
      .text(W / 2, TABLE_TOP - 40, `${game.name} (${game.genre.toLocaleLowerCase('fi-FI')})`, { ...TEXT.heading, fontSize: '36px' })
      .setOrigin(0.5);
    const counter = this.add
      .text(left + TABLE_W, TABLE_TOP - 40, GAMES.length > 1 ? `${this.gameIndex + 1}/${GAMES.length}` : '', { ...TEXT.small })
      .setOrigin(1, 0.5);
    this.layer.add([title, counter]);

    if (this.rows.length === 0) {
      this.layer.add(this.add.text(W / 2, TABLE_TOP + 120, 'Kukaan ei ole vielä pelannut tätä peliä.', { ...TEXT.body, color: CSS.muted }).setOrigin(0.5));
    }
    this.rows.slice(this.scroll, this.scroll + VISIBLE_ROWS).forEach((row, i) => {
      const y = TABLE_TOP + 20 + i * ROW_H;
      const color = row.rank <= 3 ? PLACE_COLORS[row.rank - 1] : CSS.bone;
      if (i % 2 === 0) this.layer.add(this.add.rectangle(W / 2, y, TABLE_W, ROW_H - 4, COLORS.panelLight, 0.45));
      this.layer.add([
        this.add.text(left + 20, y, `${row.rank}.`, { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '26px', color }).setOrigin(0, 0.5),
        this.add.text(left + 90, y, row.player.name, { ...TEXT.body, fontSize: '26px' }).setOrigin(0, 0.5),
        this.add
          .text(left + TABLE_W - 20, y, `${fi(row.score)} p${row.status === 'inProgress' ? ' (kesken)' : ''}`, {
            ...TEXT.bodyBold,
            fontSize: '26px',
            color: row.status === 'inProgress' ? CSS.muted : CSS.bone,
          })
          .setOrigin(1, 0.5),
      ]);
    });
    const missing = players.length - this.rows.length;
    const notes: string[] = [];
    if (missing > 0) notes.push(`Ei vielä pelannut: ${missing}`);
    if (this.rows.length > VISIBLE_ROWS) notes.push(`Rivit ${this.scroll + 1}–${Math.min(this.rows.length, this.scroll + VISIBLE_ROWS)} / ${this.rows.length}`);
    this.layer.add(this.add.text(W / 2, TABLE_TOP + 20 + VISIBLE_ROWS * ROW_H + 8, notes.join(' · '), { ...TEXT.small }).setOrigin(0.5));
  }
}
