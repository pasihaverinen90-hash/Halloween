import Phaser from 'phaser';
import { CONFIG } from '../config';
import { getDb } from '../core/db';
import { downloadBackupFile } from '../core/files';
import { isPlayerDone, playerTotal, recordScore } from '../core/scores';
import { session } from '../core/session';
import { sfx } from '../core/sfx';
import type { PlayerRecord } from '../core/types';
import { GAMES, GAME_IDS } from '../games/registry';
import { addBackdrop } from '../ui/backdrop';
import { addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { H, W } from '../ui/screen';
import { COLORS, CSS, TEXT } from '../ui/theme';
import { showToast } from '../ui/toast';
import { riseIn } from '../ui/widgets/motion';
import { drawPanel } from '../ui/widgets/panel';
import { SCENES } from './keys';
import { switchTo } from './nav';

const fi = (n: number): string => n.toLocaleString('fi-FI');

/** Kiitosnäkymä: thanks and the player's own points; a backup file is downloaded automatically. */
export class ThanksScene extends Phaser.Scene {
  private player: PlayerRecord | undefined;
  private backupOk = false;
  private leaving = false;

  constructor() {
    super(SCENES.Thanks);
  }

  create(): void {
    this.leaving = false;
    const db = getDb();
    this.player = session.playerId ? db.getPlayer(session.playerId) : undefined;
    if (!this.player) {
      switchTo(this, SCENES.Start);
      return;
    }
    if (!isPlayerDone(this.player, GAME_IDS)) {
      switchTo(this, SCENES.Menu);
      return;
    }
    const player = this.player;
    db.markFinished(player.id);
    // JSON backups are off (Pasi 20.10.), see CONFIG.storage.jsonBackups.
    this.backupOk = CONFIG.storage.jsonBackups && downloadBackupFile(db.data);

    addBackdrop(this, { dim: 0.3 });
    this.addEmbers();
    const title = this.add.text(W / 2, 104, `Kiitos, ${player.name}!`, { ...TEXT.title, fontSize: '82px' }).setOrigin(0.5);
    const sub = this.add.text(W / 2, 172, 'Pelasit kaikki pelit.', { ...TEXT.body, fontSize: '30px', color: CSS.muted }).setOrigin(0.5);
    riseIn(this, title, 0);
    riseIn(this, sub, 120);

    const rowH = GAMES.length > 5 ? 40 : 46;
    const panelH = 60 + GAMES.length * rowH + 96;
    const panelW = 640;
    const top = Math.max(214, 410 - panelH / 2);
    drawPanel(this, W / 2 - panelW / 2, top, panelW, panelH, { radius: 18, borderWidth: 3 });
    this.add.text(W / 2, top + 32, 'Omat pisteesi', { ...TEXT.heading, fontSize: '32px', color: CSS.orange }).setOrigin(0.5);
    GAMES.forEach((game, i) => {
      const y = top + 74 + i * rowH;
      const score = recordScore(player.games[game.id]) ?? 0;
      const name = this.add.text(W / 2 - panelW / 2 + 40, y, game.name, { ...TEXT.body, fontSize: '26px' }).setOrigin(0, 0.5);
      const points = this.add
        .text(W / 2 + panelW / 2 - 40, y, `${fi(score)} p`, { ...TEXT.bodyBold, fontSize: '26px' })
        .setOrigin(1, 0.5);
      riseIn(this, name, 250 + i * 70);
      riseIn(this, points, 250 + i * 70);
    });
    const lineY = top + 74 + GAMES.length * rowH - rowH / 2 + 10;
    this.add.rectangle(W / 2, lineY, panelW - 80, 2, COLORS.border).setOrigin(0.5);
    const total = this.add
      .text(W / 2, lineY + 44, `Yhteensä ${fi(playerTotal(player, GAME_IDS))} pistettä`, { ...TEXT.title, fontSize: '46px' })
      .setOrigin(0.5);
    riseIn(this, total, 300 + GAMES.length * 70);

    this.time.delayedCall(250, () => {
      sfx.play('success');
      if (!CONFIG.storage.jsonBackups) return;
      showToast(
        this,
        this.backupOk
          ? 'Varmuuskopio tallennettiin Lataukset-kansioon.'
          : 'Varmuuskopion lataus ei onnistunut. Lataa varmuuskopio korjaustilasta.',
        this.backupOk ? 'success' : 'error',
      );
    });

    addKeyHints(this, [['Enter', 'Seuraava pelaaja']]);
    onKeys(this, { Enter: () => this.next() });
  }

  getTestState(): unknown {
    return {
      player: this.player?.name ?? null,
      total: this.player ? playerTotal(this.player, GAME_IDS) : 0,
      backupOk: this.backupOk,
    };
  }

  private next(): void {
    if (this.leaving) return;
    this.leaving = true;
    sfx.play('select');
    session.playerId = null;
    switchTo(this, SCENES.Start);
  }

  /** Slowly rising embers for a festive but calm finish. */
  private addEmbers(): void {
    const colors = [COLORS.orange, COLORS.gold, 0xb07cff];
    for (let i = 0; i < 28; i++) {
      const x = 40 + ((i * 397) % (W - 80));
      const dot = this.add.circle(x, H + 20, 2 + (i % 3), colors[i % colors.length], 0.7);
      this.tweens.add({
        targets: dot,
        y: -20,
        x: x + ((i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 8)),
        alpha: 0.15,
        duration: 7000 + (i % 7) * 900,
        delay: (i * 260) % 5000,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }
}
