import Phaser from 'phaser';
import { getDb } from '../core/db';
import { compareNames, gameStatus, playerTotal, rankTotals, recordScore } from '../core/scores';
import { sfx } from '../core/sfx';
import type { PlayerRecord } from '../core/types';
import { GAMES, GAME_IDS } from '../games/registry';
import { addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { W } from '../ui/screen';
import { COLORS, CSS, TEXT } from '../ui/theme';
import { drawPanel } from '../ui/widgets/panel';
import { addAdminHeader, fi } from './admin/common';
import { SCENES } from './keys';
import { switchTo } from './nav';

const PANEL_W = 760;
const TOP = 150;

/** Tulokset pelaajan mukaan: every game of one player. ←/→ switch player. */
export class PlayerResultsScene extends Phaser.Scene {
  private players: PlayerRecord[] = [];
  private index = 0;
  private layer!: Phaser.GameObjects.Container;
  private leaving = false;

  constructor() {
    super(SCENES.PlayerResults);
  }

  create(): void {
    this.leaving = false;
    this.players = getDb()
      .players()
      .sort((a, b) => compareNames(a.name, b.name));
    this.index = Math.min(this.index, Math.max(0, this.players.length - 1));
    addAdminHeader(this, 'Tulokset pelaajan mukaan');
    this.layer = this.add.container(0, 0);
    this.render();
    addKeyHints(this, [
      ['←→', 'Vaihda pelaajaa'],
      ['Esc', 'Takaisin'],
    ]);
    onKeys(
      this,
      {
        ArrowLeft: () => this.switchPlayer(-1),
        ArrowRight: () => this.switchPlayer(1),
        Escape: () => this.back(),
      },
      { allowRepeat: ['ArrowLeft', 'ArrowRight'] },
    );
  }

  getTestState(): unknown {
    const player = this.players[this.index];
    return { player: player?.name ?? null, total: player ? playerTotal(player, GAME_IDS) : 0 };
  }

  private switchPlayer(step: number): void {
    if (this.players.length < 2) return;
    this.index = (this.index + step + this.players.length) % this.players.length;
    sfx.play('move');
    this.render();
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    switchTo(this, SCENES.ResultsMenu);
  }

  private render(): void {
    this.layer.removeAll(true);
    const player = this.players[this.index];
    if (!player) {
      this.layer.add(this.add.text(W / 2, 320, 'Pelaajia ei vielä ole.', { ...TEXT.body, color: CSS.muted }).setOrigin(0.5));
      return;
    }
    const rowH = GAMES.length > 6 ? 44 : 50;
    const panelH = 150 + GAMES.length * rowH + 90;
    const left = W / 2 - PANEL_W / 2;
    this.layer.add(drawPanel(this, left - 20, TOP, PANEL_W + 40, panelH, { radius: 18 }));

    const ranking = rankTotals(this.players, GAME_IDS);
    const row = ranking.find((r) => r.player.id === player.id);
    const place = row ? `Sija ${row.rank}/${ranking.length}` : 'Ei vielä tuloksia';
    this.layer.add([
      this.add.text(W / 2, TOP + 44, player.name, { ...TEXT.heading, fontSize: '44px', color: CSS.orange }).setOrigin(0.5),
      this.add.text(W / 2, TOP + 92, place, { ...TEXT.bodyBold, color: CSS.muted }).setOrigin(0.5),
      this.add
        .text(left + PANEL_W, TOP + 44, this.players.length > 1 ? `${this.index + 1}/${this.players.length}` : '', { ...TEXT.small })
        .setOrigin(1, 0.5),
    ]);

    GAMES.forEach((game, i) => {
      const y = TOP + 150 + i * rowH;
      const record = player.games[game.id];
      const status = gameStatus(record);
      const score = recordScore(record);
      const value =
        status === 'unplayed' ? '–  pelaamatta' : status === 'inProgress' ? `${fi(score ?? 0)} p (kesken)` : `${fi(score ?? 0)} p`;
      if (i % 2 === 0) this.layer.add(this.add.rectangle(W / 2, y, PANEL_W, rowH - 4, COLORS.panelLight, 0.45));
      this.layer.add([
        this.add.text(left + 20, y, game.name, { ...TEXT.body, fontSize: '26px' }).setOrigin(0, 0.5),
        this.add
          .text(left + PANEL_W - 20, y, value, { ...TEXT.bodyBold, fontSize: '26px', color: status === 'finished' ? CSS.bone : CSS.muted })
          .setOrigin(1, 0.5),
      ]);
    });
    const totalY = TOP + 150 + GAMES.length * rowH + 20;
    this.layer.add(
      this.add
        .text(W / 2, totalY, `Yhteensä ${fi(playerTotal(player, GAME_IDS))} pistettä`, { ...TEXT.title, fontSize: '40px' })
        .setOrigin(0.5),
    );
  }
}
