import Phaser from 'phaser';
import { getDb } from '../core/db';
import { isPlayerDone } from '../core/scores';
import { session } from '../core/session';
import type { PlayerRecord } from '../core/types';
import { GAME_IDS } from '../games/registry';
import { addBackdrop } from '../ui/backdrop';
import { askPassword, confirmDialog } from '../ui/dialogs';
import { H, W } from '../ui/screen';
import { CSS, TEXT } from '../ui/theme';
import { SCENES } from './keys';
import { switchTo } from './nav';
import { continueTournament } from './tournament';

/**
 * The game opens only with Pasi's password, every time the page loads (Pasi
 * 21.10.), so reloading gives no one a new round. If someone's turn was left
 * unfinished, it is offered to continue.
 */
export class UnlockScene extends Phaser.Scene {
  private asking = false;

  constructor() {
    super(SCENES.Unlock);
  }

  create(): void {
    this.asking = false;
    session.playerId = null;
    addBackdrop(this, { dim: 0.35 });
    this.add.text(W / 2, H / 2 - 230, 'Halloween-peli-ilta', { ...TEXT.title, fontSize: '80px' }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 160, 'Peli avataan Pasin salasanalla.', { ...TEXT.body, color: CSS.muted }).setOrigin(0.5);
    this.time.delayedCall(150, () => void this.unlock());
  }

  getTestState(): unknown {
    return { asking: this.asking };
  }

  private async unlock(): Promise<void> {
    // There is no way past the lock but the password.
    for (;;) {
      this.asking = true;
      const ok = await askPassword(this, 'Avaa peli', { cancelable: false });
      this.asking = false;
      if (ok) break;
    }
    const player = unfinishedPlayer();
    if (player) {
      const resume = await confirmDialog(this, {
        title: 'Vuoro kesken',
        message: `Pelaajan ${player.name} vuoro jäi kesken. Jatketaanko sitä?`,
        confirmLabel: 'Jatka vuoroa',
        cancelLabel: 'Uusi pelaaja',
        defaultChoice: 'confirm',
      });
      if (resume) {
        session.playerId = player.id;
        continueTournament(this);
        return;
      }
    }
    switchTo(this, SCENES.Start);
  }
}

/** The player who played last but has not played every game, if any. */
function unfinishedPlayer(): PlayerRecord | undefined {
  const lastActivity = (p: PlayerRecord): string =>
    Object.values(p.games).reduce((latest, record) => (record.updatedAt > latest ? record.updatedAt : latest), p.createdAt);
  return getDb()
    .players()
    .filter((p) => !isPlayerDone(p, GAME_IDS))
    .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)))[0];
}
