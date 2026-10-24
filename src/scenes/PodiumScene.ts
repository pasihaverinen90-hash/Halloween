import Phaser from 'phaser';
import { getDb } from '../core/db';
import { isPlayerDone, rankTotals, type TotalRow } from '../core/scores';
import { sfx } from '../core/sfx';
import { GAMES, GAME_IDS } from '../games/registry';
import { addKeyHints, type KeyHintBar } from '../ui/hints';
import { onKeys } from '../ui/input';
import { H, W } from '../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../ui/theme';
import { drawPanel } from '../ui/widgets/panel';
import { addAdminHeader, fi } from './admin/common';
import { SCENES } from './keys';
import { switchTo } from './nav';

const BASE_Y = 628;
const BLOCK_W = 230;
/** Places 1–3: x centre, block height, colour. */
const PLACES = [
  { x: W / 2, height: 230, color: COLORS.gold, css: CSS.gold, label: '1' },
  { x: W / 2 - 270, height: 168, color: COLORS.silver, css: CSS.silver, label: '2' },
  { x: W / 2 + 270, height: 124, color: COLORS.bronze, css: CSS.bronze, label: '3' },
] as const;
const DRUMROLL_MS = 2100;

type Step = 'intro' | 'reveal3' | 'reveal2' | 'reveal1' | 'standings';

/** Palkintojenjako: the top three revealed one by one, then the full standings. */
export class PodiumScene extends Phaser.Scene {
  private rows: TotalRow[] = [];
  private places: TotalRow[][] = [[], [], []];
  private steps: Step[] = [];
  private stepIndex = 0;
  private busy = false;
  private leaving = false;
  private stage!: Phaser.GameObjects.Container;
  private standings!: Phaser.GameObjects.Container;
  private headline!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;
  private hints!: KeyHintBar;
  private glows: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super(SCENES.Podium);
  }

  create(): void {
    this.busy = false;
    this.leaving = false;
    this.stepIndex = 0;
    this.glows = [];
    addAdminHeader(this, 'Palkintojenjako');
    const players = getDb().players();
    this.rows = rankTotals(players, GAME_IDS);
    this.places = [1, 2, 3].map((rank) => this.rows.filter((row) => row.rank === rank));

    this.headline = this.add.text(W / 2, 150, '', { ...TEXT.arcade, fontSize: '34px', color: CSS.gold }).setOrigin(0.5).setDepth(5);
    this.note = this.add.text(W / 2, 214, '', { ...TEXT.body, color: CSS.muted, align: 'center' }).setOrigin(0.5);
    this.stage = this.add.container(0, 0);
    this.standings = this.add.container(0, 0).setVisible(false);
    this.hints = addKeyHints(this, []);

    onKeys(this, {
      Enter: () => this.advance(),
      Escape: () => this.back(),
    });

    if (this.rows.length === 0) {
      this.note.setText('Tuloksia ei vielä ole.').setY(H / 2);
      this.hints.setHints([['Esc', 'Takaisin']]);
      return;
    }
    this.buildStage();
    this.steps = ['intro'];
    if (this.places[2].length > 0) this.steps.push('reveal3');
    if (this.places[1].length > 0) this.steps.push('reveal2');
    this.steps.push('reveal1', 'standings');

    const unfinished = players.filter((p) => !isPlayerDone(p, GAME_IDS)).length;
    this.headline.setText('ILLAN PARHAAT').setColor(CSS.neonPink);
    this.note.setText(
      unfinished > 0 ? `Huom: ${unfinished} pelaajalla on pelejä kesken.` : `${this.rows.length} pelaajaa · ${GAMES.length} ${GAMES.length === 1 ? 'peli' : 'peliä'}`,
    );
    this.updateHints();
  }

  getTestState(): unknown {
    return {
      step: this.steps[this.stepIndex] ?? null,
      busy: this.busy,
      places: this.places.map((group) => group.map((row) => ({ name: row.player.name, total: row.total }))),
    };
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    switchTo(this, SCENES.ResultsMenu);
  }

  private advance(): boolean {
    if (this.rows.length === 0 || this.leaving) return false;
    if (this.busy) return true; // keys during a drumroll are ignored
    const current = this.steps[this.stepIndex];
    if (current === 'standings') {
      this.back();
      return true;
    }
    this.stepIndex += 1;
    const next = this.steps[this.stepIndex];
    if (next === 'reveal3') this.reveal(2);
    else if (next === 'reveal2') this.reveal(1);
    else if (next === 'reveal1') this.reveal(0);
    else if (next === 'standings') this.showStandings();
    return true;
  }

  private updateHints(): void {
    const next = this.steps[this.stepIndex + 1];
    const label =
      next === 'reveal3' ? 'Paljasta 3. sija' : next === 'reveal2' ? 'Paljasta 2. sija' : next === 'reveal1' ? 'Paljasta voittaja' : next === 'standings' ? 'Koko tulostaulu' : 'Takaisin';
    if (this.busy) this.hints.setHints([['Esc', 'Takaisin']]);
    else if (!next) this.hints.setHints([['Enter tai Esc', 'Takaisin']]);
    else this.hints.setHints([['Enter', label], ['Esc', 'Takaisin']]);
  }

  private buildStage(): void {
    PLACES.forEach((place, i) => {
      const top = BASE_Y - place.height;
      const glow = this.add.graphics();
      glow.fillStyle(place.color, 0.18);
      glow.fillEllipse(place.x, top - 40, BLOCK_W + 120, 200);
      glow.setAlpha(0);
      this.glows[i] = glow;
      const block = this.add.graphics();
      // Front and a lighter top face for depth
      block.fillStyle(place.color, 1);
      block.fillRoundedRect(place.x - BLOCK_W / 2, top, BLOCK_W, place.height, { tl: 10, tr: 10, bl: 0, br: 0 });
      block.fillStyle(0xffffff, 0.22);
      block.fillRect(place.x - BLOCK_W / 2 + 8, top + 8, BLOCK_W - 16, 14);
      block.fillStyle(0x000000, 0.18);
      block.fillRect(place.x + BLOCK_W / 2 - 26, top + 22, 18, place.height - 22);
      block.lineStyle(3, 0x1a1028, 1);
      block.strokeRoundedRect(place.x - BLOCK_W / 2, top, BLOCK_W, place.height, { tl: 10, tr: 10, bl: 0, br: 0 });
      const number = this.add
        .text(place.x, top + place.height / 2 + 6, place.label, { fontFamily: FONTS.title, fontStyle: '800', fontSize: '96px', color: '#2a1a12' })
        .setOrigin(0.5)
        .setAlpha(0.75);
      const empty = this.places[i].length === 0;
      const mystery = this.add
        .text(place.x, top - 46, empty ? '' : '?', { ...TEXT.arcade, fontSize: '48px', color: CSS.muted })
        .setOrigin(0.5);
      mystery.setName(`mystery-${i}`);
      this.stage.add([glow, block, number, mystery]);
    });
    // Floor line
    this.stage.add(this.add.rectangle(W / 2, BASE_Y + 2, 900, 4, 0x1a1028));
  }

  private reveal(placeIndex: number): void {
    this.busy = true;
    this.updateHints();
    const place = PLACES[placeIndex];
    const group = this.places[placeIndex];
    const winner = placeIndex === 0;
    const glow = this.glows[placeIndex];
    this.headline.setText(winner ? 'JA ILLAN VOITTAJA ON...' : `${place.label}. SIJA`).setColor(winner ? CSS.gold : place.css);
    this.note.setText('');
    sfx.play('drumroll');
    this.tweens.add({ targets: glow, alpha: { from: 0, to: 1 }, duration: 260, yoyo: true, repeat: winner ? 5 : 3 });
    const delay = winner ? DRUMROLL_MS + 500 : DRUMROLL_MS;

    this.time.delayedCall(delay, () => {
      const mystery = this.stage.getByName(`mystery-${placeIndex}`) as Phaser.GameObjects.Text | null;
      mystery?.setVisible(false);
      glow.setAlpha(1);
      sfx.play(winner ? 'fanfare' : 'reveal');
      const top = BASE_Y - place.height;
      const names = group.map((row) => row.player.name);
      const fontSize = names.length > 2 ? 28 : names.length === 2 ? 34 : 40;
      const nameText = this.add
        .text(place.x, top - 24, names.join('\n'), {
          ...TEXT.title,
          fontSize: `${fontSize}px`,
          color: place.css,
          align: 'center',
          strokeThickness: 5,
        })
        .setOrigin(0.5, 1);
      const points = this.add
        .text(place.x, top + 26, `${fi(group[0].total)} p`, { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '26px', color: '#2a1a12' })
        .setOrigin(0.5);
      this.stage.add([nameText, points]);
      nameText.setScale(0.4).setAlpha(0);
      this.tweens.add({ targets: nameText, scale: 1, alpha: 1, duration: 520, ease: 'Back.Out' });
      if (winner) {
        const who = names.length > 1 ? `Illan voittajat: ${names.join(' ja ')}!` : `Illan voittaja: ${names[0]}!`;
        this.headline.setText(who.toLocaleUpperCase('fi-FI'));
        // The pixel font is wide: a long name shrinks to fit the screen.
        const fit = Math.min(1, (W - 80) / this.headline.width);
        this.headline.setScale(0.6 * fit);
        this.tweens.add({ targets: this.headline, scale: fit, duration: 600, ease: 'Back.Out' });
        this.confetti();
      } else if (group.length > 1) {
        this.note.setText(`Jaettu ${place.label}. sija`);
      }
      this.busy = false;
      this.updateHints();
    });
  }

  private confetti(): void {
    if (!this.textures.exists('konfetti')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 12, 7);
      g.generateTexture('konfetti', 12, 7);
      g.destroy();
    }
    const colors = [COLORS.gold, COLORS.orange, 0xb07cff, COLORS.green, 0xff6fa8, COLORS.bone];
    for (const x of [W * 0.2, W * 0.5, W * 0.8]) {
      const emitter = this.add.particles(x, -20, 'konfetti', {
        speedX: { min: -180, max: 180 },
        speedY: { min: 80, max: 260 },
        gravityY: 220,
        rotate: { min: 0, max: 360 },
        scale: { min: 0.6, max: 1.2 },
        lifespan: 4200,
        frequency: 40,
        quantity: 2,
        tint: colors,
      });
      emitter.setDepth(20);
      this.time.delayedCall(3200, () => emitter.stop());
    }
  }

  private showStandings(): void {
    this.stage.setVisible(false);
    this.headline.setText('KOKO TULOSTAULU').setColor(CSS.bone).setScale(1).setY(132).setFontSize(30);
    this.note.setText('');
    this.standings.setVisible(true);
    const visible = this.rows.slice(0, 11);
    const tableW = 760;
    const left = W / 2 - tableW / 2;
    const rowH = 40;
    this.standings.add(drawPanel(this, left - 20, 172, tableW + 40, 40 + visible.length * rowH + 20, { radius: 18 }));
    this.standings.add([
      this.add.text(left + 20, 196, 'Sija', { ...TEXT.small, fontStyle: '800' }).setOrigin(0, 0.5),
      this.add.text(left + 110, 196, 'Nimi', { ...TEXT.small, fontStyle: '800' }).setOrigin(0, 0.5),
      this.add.text(left + tableW - 20, 196, 'Pisteet', { ...TEXT.small, fontStyle: '800' }).setOrigin(1, 0.5),
    ]);
    visible.forEach((row, i) => {
      const y = 232 + i * rowH;
      const color = row.rank <= 3 ? [CSS.gold, CSS.silver, CSS.bronze][row.rank - 1] : CSS.bone;
      if (i % 2 === 0) this.standings.add(this.add.rectangle(W / 2, y, tableW, rowH - 4, COLORS.panelLight, 0.45));
      this.standings.add([
        this.add.text(left + 20, y, `${row.rank}.`, { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '24px', color }).setOrigin(0, 0.5),
        this.add.text(left + 110, y, row.player.name, { ...TEXT.body, fontSize: '24px' }).setOrigin(0, 0.5),
        this.add.text(left + tableW - 20, y, `${fi(row.total)} p`, { ...TEXT.bodyBold, fontSize: '24px' }).setOrigin(1, 0.5),
      ]);
    });
    if (this.rows.length > visible.length) {
      this.standings.add(
        this.add.text(W / 2, 252 + visible.length * rowH, `…ja ${this.rows.length - visible.length} muuta. Kaikki tulokset näkyvät korjaustilassa.`, TEXT.small).setOrigin(0.5),
      );
    }
    this.updateHints();
  }
}
