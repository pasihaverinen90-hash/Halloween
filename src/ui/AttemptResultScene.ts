import Phaser from 'phaser';
import { sfx } from '../core/sfx';
import { SCENES, type AttemptResultData } from '../scenes/keys';
import { addBackdrop } from './backdrop';
import { addKeyHints } from './hints';
import { onKeys } from './input';
import { addCenteredPanel } from './overlay';
import { H, W } from './screen';
import { CSS, TEXT } from './theme';
import { riseIn } from './widgets/motion';

const fi = (n: number): string => n.toLocaleString('fi-FI');

/** Points of the attempt (action) or the round (puzzle). Enter continues. */
export class AttemptResultScene extends Phaser.Scene {
  private opts!: AttemptResultData;
  private continued = false;

  constructor() {
    super(SCENES.AttemptResult);
  }

  init(data: AttemptResultData): void {
    this.opts = data;
    this.continued = false;
  }

  create(): void {
    this.scene.bringToTop();
    const d = this.opts;
    addBackdrop(this, { dim: 0.55 });
    addCenteredPanel(this, 760, 470);

    const action = d.kind === 'action';
    const heading = action ? `Yritys ${d.attempt}/${d.total}` : 'Tulos';
    const top = this.add.text(W / 2, H / 2 - 170, d.gameName, { ...TEXT.heading, fontSize: '36px', color: CSS.muted }).setOrigin(0.5);
    const head = this.add.text(W / 2, H / 2 - 112, heading, { ...TEXT.heading, fontSize: '48px' }).setOrigin(0.5);
    const score = this.add.text(W / 2, H / 2 - 20, `${fi(0)} pistettä`, { ...TEXT.title, fontSize: '88px' }).setOrigin(0.5);
    riseIn(this, top, 0);
    riseIn(this, head, 60);
    riseIn(this, score, 120);

    // Count the number up (at most ~1 s).
    const counter = { value: 0 };
    this.tweens.add({
      targets: counter,
      value: d.score,
      duration: Math.min(1000, 300 + d.score),
      delay: 200,
      ease: 'Cubic.Out',
      onUpdate: () => score.setText(`${fi(Math.round(counter.value))} pistettä`),
      onComplete: () => score.setText(`${fi(d.score)} pistettä`),
    });
    this.time.delayedCall(200, () => sfx.play('result'));

    const lines: string[] = [];
    if (action && d.isFinal) {
      const perfectEarly = d.attempt < d.total;
      lines.push(`Pelin tulos: ${fi(d.best)} pistettä`, perfectEarly ? 'Täydellinen tulos! Loput yritykset jäävät väliin.' : 'Paras yritys jää voimaan.');
    } else if (action) {
      lines.push(`Paras tulos tähän mennessä: ${fi(d.best)} p`);
    } else {
      lines.push('Tulos on tallennettu.');
    }
    lines.forEach((line, i) => {
      const style = i === 0 ? { ...TEXT.bodyBold, fontSize: '32px', color: d.isFinal && action ? CSS.orange : CSS.bone } : TEXT.small;
      const text = this.add.text(W / 2, H / 2 + 80 + i * 50, line, style).setOrigin(0.5);
      riseIn(this, text, 400 + i * 80);
    });

    addKeyHints(this, [['Enter', d.isFinal ? 'Jatka' : 'Seuraava yritys']]);
    onKeys(this, { Enter: () => this.continue() });
  }

  getTestState(): unknown {
    const d = this.opts;
    return { kind: d.kind, attempt: d.attempt, total: d.total, score: d.score, best: d.best, isFinal: d.isFinal };
  }

  private continue(): void {
    if (this.continued) return;
    this.continued = true;
    sfx.play('select');
    const { onContinue } = this.opts;
    this.scene.stop();
    onContinue();
  }
}
