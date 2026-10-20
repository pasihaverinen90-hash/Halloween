import Phaser from 'phaser';
import { sfx } from '../core/sfx';
import { SCENES, type PromptData } from '../scenes/keys';
import { addKeyHints } from './hints';
import { onKeys } from './input';
import { addCenteredPanel, addDim } from './overlay';
import { H, W } from './screen';
import { CSS, TEXT } from './theme';
import { TextInput } from './widgets/TextInput';

const PANEL_W = 760;

/** One-line text input over a paused scene. Enter accepts (after validation), Esc cancels. */
export class PromptScene extends Phaser.Scene {
  private opts!: PromptData;
  private field!: TextInput;
  private error!: Phaser.GameObjects.Text;
  private closed = false;

  constructor() {
    super(SCENES.Prompt);
  }

  init(data: PromptData): void {
    this.opts = data;
    this.closed = false;
  }

  create(): void {
    this.scene.bringToTop();
    const d = this.opts;
    addDim(this);

    const message = d.message
      ? this.add.text(W / 2, 0, d.message, { ...TEXT.body, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5, 0)
      : null;
    const messageH = message ? message.height + 24 : 0;
    const panelH = 300 + messageH;
    const top = H / 2 - panelH / 2;
    addCenteredPanel(this, PANEL_W, panelH);
    this.add.text(W / 2, top + 54, d.title, { ...TEXT.heading, fontSize: '42px', color: CSS.orange }).setOrigin(0.5);
    message?.setY(top + 96);

    const allow = d.allow;
    this.field = new TextInput(this, W / 2, top + 120 + messageH + 30, {
      width: 520,
      maxLength: d.maxLength,
      initial: d.initial ?? '',
      allow: allow ? (ch) => allow.test(ch) : undefined,
    });
    this.error = this.add
      .text(W / 2, top + panelH - 44, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.red, align: 'center' })
      .setOrigin(0.5);
    this.field.on('change', () => this.error.setText(''));

    addKeyHints(this, [
      ['Enter', 'Hyväksy'],
      ['Esc', 'Peruuta'],
    ], undefined, { opaque: true });
    onKeys(this, {
      Enter: () => this.accept(),
      Escape: () => this.close(null),
    });
  }

  getTestState(): unknown {
    return { title: this.opts.title, value: this.field?.value ?? '', error: this.error?.text ?? '' };
  }

  private accept(): void {
    const value = this.field.value.trim();
    let problem: string | null = null;
    try {
      problem = this.opts.validate ? this.opts.validate(value) : null;
    } catch {
      problem = 'Arvo ei kelpaa.';
    }
    if (problem) {
      this.error.setText(problem);
      this.field.showError();
      sfx.play('error');
      return;
    }
    sfx.play('select');
    this.close(value);
  }

  private close(value: string | null): void {
    if (this.closed) return;
    this.closed = true;
    if (value === null) sfx.play('back');
    const { onClose } = this.opts;
    this.scene.stop();
    onClose(value);
  }
}
