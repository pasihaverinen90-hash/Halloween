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
      .text(W / 2, H / 2 - 30, `Yritys ${d.attempt}/${d.total}`, { ...TEXT.title, fontSize: '104px' })
      .setOrigin(0.5);
    const bestText =
      d.best === null ? 'Paras yritys jää voimaan.' : `Paras tulos tähän mennessä: ${d.best.toLocaleString('fi-FI')} p`;
    const best = this.add.text(W / 2, H / 2 + 80, bestText, { ...TEXT.bodyBold, fontSize: '30px' }).setOrigin(0.5);
    const ready = this.add.text(W / 2, H / 2 + 136, 'Valmis?', { ...TEXT.body, color: CSS.muted }).setOrigin(0.5);
    riseIn(this, name, 0);
    riseIn(this, big, 60);
    riseIn(this, best, 120);
    riseIn(this, ready, 180);

    addKeyHints(this, [['Enter', 'Aloita yritys']]);
    onKeys(this, { Enter: () => this.start() });
  }

  getTestState(): unknown {
    return { attempt: this.opts.attempt, total: this.opts.total, best: this.opts.best };
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
