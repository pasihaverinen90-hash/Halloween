import Phaser from 'phaser';
import { sfx } from '../core/sfx';
import { SCENES, type AttemptIntroData } from '../scenes/keys';
import { addBackdrop } from './backdrop';
import { addKeyHints } from './hints';
import { onKeys } from './input';
import { addCenteredPanel } from './overlay';
import { H, W } from './screen';
import { CSS, TEXT } from './theme';
import { riseIn } from './widgets/motion';

/** "Yritys 2/3" before an action-game attempt. Enter starts the attempt. */
export class AttemptIntroScene extends Phaser.Scene {
  private opts!: AttemptIntroData;
  private started = false;

  constructor() {
    super(SCENES.AttemptIntro);
  }

  init(data: AttemptIntroData): void {
    this.opts = data;
    this.started = false;
  }

  create(): void {
    this.scene.bringToTop();
    const d = this.opts;
    addBackdrop(this, { dim: 0.55 });
    addCenteredPanel(this, 680, 400);

    const name = this.add.text(W / 2, H / 2 - 132, d.gameName, { ...TEXT.heading, fontSize: '38px', color: CSS.muted }).setOrigin(0.5);
    const big = this.add
      .text(W / 2, H / 2 - 30, d.total === 1 ? 'Yksi yritys' : `Yritys ${d.attempt}/${d.total}`, { ...TEXT.title, fontSize: '104px' })
      .setOrigin(0.5);
    const bestText =
      d.total === 1
        ? 'Peli pelataan kerran.'
        : d.best === null
          ? 'Paras yritys jää voimaan.'
          : `Paras tulos tähän mennessä: ${d.best.toLocaleString('fi-FI')} p`;
    const best = this.add.text(W / 2, H / 2 + 80, bestText, { ...TEXT.bodyBold, fontSize: '30px' }).setOrigin(0.5);
    const ready = d.note
      ? this.add.text(W / 2, H / 2 + 136, d.note, { ...TEXT.bodyBold, fontSize: '28px', color: CSS.orange, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5)
      : this.add.text(W / 2, H / 2 + 136, 'Valmis?', { ...TEXT.body, color: CSS.muted }).setOrigin(0.5);
    riseIn(this, name, 0);
    riseIn(this, big, 60);
    riseIn(this, best, 120);
    riseIn(this, ready, 180);

    addKeyHints(this, [['Enter', 'Aloita yritys']]);
    onKeys(this, { Enter: () => this.start() });
  }

  getTestState(): unknown {
    const { attempt, total, best, note } = this.opts;
    return note ? { attempt, total, best, note } : { attempt, total, best };
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    sfx.play('start');
    const { onStart } = this.opts;
    this.scene.stop();
    onStart();
  }
}
