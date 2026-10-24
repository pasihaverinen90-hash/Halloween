import Phaser from 'phaser';
import { getDb } from '../core/db';
import { getFreeplay } from '../core/freeplay';
import { isNameChar } from '../core/names';
import { session } from '../core/session';
import { sfx } from '../core/sfx';
import { CONFIG } from '../config';
import { GAMES } from '../games/registry';
import { addBackdrop } from '../ui/backdrop';
import { askPassword } from '../ui/dialogs';
import { addKeyHints } from '../ui/hints';
import { W } from '../ui/screen';
import { CSS, FONTS, TEXT } from '../ui/theme';
import { MenuList } from '../ui/widgets/MenuList';
import { drawPanel } from '../ui/widgets/panel';
import { TextInput } from '../ui/widgets/TextInput';
import { SCENES } from './keys';
import { switchTo } from './nav';
import { continueTournament } from './tournament';

const PANEL_W = 640;

/** Aloitusnäkymä: a name starts the tournament; freeplay and the results open with Pasi's password. */
export class StartScene extends Phaser.Scene {
  private nameField!: TextInput;
  private menu!: MenuList;
  private error!: Phaser.GameObjects.Text;
  private busy = false;

  constructor() {
    super(SCENES.Start);
  }

  create(): void {
    session.playerId = null;
    this.busy = false;
    const db = getDb();
    addBackdrop(this, { dim: 0.15 });

    // Pasi 24.10.: the Spooky Arcade 3000 theme, cringe and old-fashioned on purpose.
    const title = this.add.text(W / 2, 92, 'SPOOKY ARCADE 3000', { ...TEXT.title, fontSize: '84px' }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 98, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const coin = this.add
      .text(W / 2, 154, '~ INSERT COIN ~', { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '26px', color: CSS.gold, letterSpacing: 6 })
      .setOrigin(0.5);
    this.tweens.add({ targets: coin, alpha: { from: 1, to: 0.15 }, duration: 600, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    const games = GAMES.length === 1 ? 'Yksi peli' : `${GAMES.length} peliä`;
    this.add
      .text(W / 2, 194, `${games} · Jokainen pelaa vuorollaan · Suurin kokonaispistemäärä voittaa`, {
        ...TEXT.body,
        color: CSS.muted,
      })
      .setOrigin(0.5);

    const top = 222;
    drawPanel(this, W / 2 - PANEL_W / 2, top, PANEL_W, 412, { radius: 20, borderWidth: 3 });
    this.add.text(W / 2, top + 46, 'Kirjoita nimesi', { ...TEXT.heading, fontSize: '40px' }).setOrigin(0.5);
    this.nameField = new TextInput(this, W / 2, top + 116, {
      width: 520,
      maxLength: CONFIG.player.nameMaxLength,
      placeholder: 'Nimi näkyy tulostaululla',
      allow: isNameChar,
    });
    this.error = this.add
      .text(W / 2, top + 172, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.red, align: 'center', wordWrap: { width: 560 } })
      .setOrigin(0.5);
    this.menu = new MenuList(
      this,
      W / 2,
      top + 204,
      [
        { label: 'TOURNAMENT', detail: 'Aloita vuoro' },
        { label: 'FREE PLAY', detail: getFreeplay().isOpen() ? 'Pelaa vapaasti' : 'Vaatii salasanan' },
        { label: 'HIGH SCORES', detail: 'Vaatii salasanan' },
      ],
      {
        width: 520,
        itemHeight: 54,
        gap: 10,
        fontSize: 26,
        onSelect: (index) => (index === 0 ? this.startPlayer() : index === 1 ? void this.openFreeplay() : void this.openResults()),
      },
    );
    this.nameField.on('change', () => {
      this.error.setText('');
      this.menu.setIndex(0);
    });

    const problem = db.loadProblem ?? db.saveProblem;
    if (problem) {
      this.add
        .text(W / 2, 652, problem, { ...TEXT.bodyBold, fontSize: '20px', color: CSS.red, align: 'center', wordWrap: { width: 1100 } })
        .setOrigin(0.5);
    }

    addKeyHints(this, [
      ['A–Ö', 'Kirjoita nimi'],
      ['↑↓', 'Valitse'],
      ['Enter', 'Valitse'],
      ['F11', 'Koko näyttö'],
    ]);
  }

  getTestState(): unknown {
    return { name: this.nameField?.value ?? '', selected: this.menu?.index ?? -1, error: this.error?.text ?? '' };
  }

  private startPlayer(): void {
    if (this.busy) return;
    const db = getDb();
    const name = this.nameField.value;
    const problem = db.checkName(name);
    if (problem) {
      this.error.setText(problem);
      this.nameField.showError();
      sfx.play('error');
      return;
    }
    try {
      const player = db.createPlayer(name);
      session.playerId = player.id;
    } catch (error) {
      this.error.setText(error instanceof Error ? error.message : String(error));
      sfx.play('error');
      return;
    }
    this.busy = true;
    continueTournament(this);
  }

  /** Pasi 23.10.: freeplay opens with Pasi's password once and then stays open (correction mode closes it). */
  private async openFreeplay(): Promise<void> {
    if (this.busy) return;
    const freeplay = getFreeplay();
    if (!freeplay.isOpen()) {
      if (!(await askPassword(this, 'Avaa freeplay'))) return;
      freeplay.setOpen(true);
    }
    this.busy = true;
    switchTo(this, SCENES.Menu);
  }

  private async openResults(): Promise<void> {
    if (this.busy) return;
    if (await askPassword(this, 'Tulokset')) {
      this.busy = true;
      switchTo(this, SCENES.ResultsMenu);
    }
  }
}
