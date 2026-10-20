import Phaser from 'phaser';
import { getDb } from '../core/db';
import { isNameChar } from '../core/names';
import { session } from '../core/session';
import { sfx } from '../core/sfx';
import { CONFIG } from '../config';
import { GAMES } from '../games/registry';
import { addBackdrop } from '../ui/backdrop';
import { askPassword } from '../ui/dialogs';
import { addKeyHints } from '../ui/hints';
import { W } from '../ui/screen';
import { CSS, TEXT } from '../ui/theme';
import { MenuList } from '../ui/widgets/MenuList';
import { drawPanel } from '../ui/widgets/panel';
import { TextInput } from '../ui/widgets/TextInput';
import { SCENES } from './keys';
import { switchTo } from './nav';

const PANEL_W = 640;

/** Aloitusnäkymä: the player types a name; Pasi can open the results from here. */
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

    const title = this.add.text(W / 2, 112, 'Halloween-peli-ilta', { ...TEXT.title, fontSize: '88px' }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 118, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const games = GAMES.length === 1 ? 'Yksi peli' : `${GAMES.length} peliä`;
    this.add
      .text(W / 2, 186, `${games} · Jokainen pelaa vuorollaan · Suurin kokonaispistemäärä voittaa`, {
        ...TEXT.body,
        color: CSS.muted,
      })
      .setOrigin(0.5);

    const top = 236;
    drawPanel(this, W / 2 - PANEL_W / 2, top, PANEL_W, 348, { radius: 20, borderWidth: 3 });
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
      [{ label: 'Aloita peli' }, { label: 'Tulokset', detail: 'Vaatii salasanan' }],
      { width: 520, itemHeight: 54, gap: 10, fontSize: 26, onSelect: (index) => (index === 0 ? this.startPlayer() : void this.openResults()) },
    );
    this.nameField.on('change', () => {
      this.error.setText('');
      this.menu.setIndex(0);
    });

    const problem = db.loadProblem ?? db.saveProblem;
    if (problem) {
      this.add
        .text(W / 2, 616, problem, { ...TEXT.bodyBold, fontSize: '20px', color: CSS.red, align: 'center', wordWrap: { width: 1100 } })
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
