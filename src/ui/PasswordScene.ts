import Phaser from 'phaser';
import { verifyPassword } from '../core/password';
import { sfx } from '../core/sfx';
import { SCENES, type PasswordData } from '../scenes/keys';
import { addKeyHints } from './hints';
import { onKeys } from './input';
import { addCenteredPanel, addDim } from './overlay';
import { H, W } from './screen';
import { CSS, TEXT } from './theme';
import { TextInput } from './widgets/TextInput';

const PANEL_W = 700;
const PANEL_H = 360;

/** Pasi's password prompt. Masked input; Enter checks, Esc cancels. */
export class PasswordScene extends Phaser.Scene {
  private opts!: PasswordData;
  private field!: TextInput;
  private error!: Phaser.GameObjects.Text;
  private closed = false;
  private failures = 0;

  constructor() {
    super(SCENES.Password);
  }

  init(data: PasswordData): void {
    this.opts = data;
    this.closed = false;
    this.failures = 0;
  }

  create(): void {
    this.scene.bringToTop();
    addDim(this, 0.75);
    const top = H / 2 - PANEL_H / 2;
    addCenteredPanel(this, PANEL_W, PANEL_H);
    this.add.text(W / 2, top + 56, this.opts.title, { ...TEXT.heading, color: CSS.orange }).setOrigin(0.5);
    this.add.text(W / 2, top + 110, 'Kirjoita salasana', { ...TEXT.body, color: CSS.muted }).setOrigin(0.5);

    this.field = new TextInput(this, W / 2, top + 190, { width: 460, maxLength: 40, masked: true });
    this.error = this.add
      .text(W / 2, top + 280, '', { ...TEXT.bodyBold, fontSize: '24px', color: CSS.red })
      .setOrigin(0.5);
    this.field.on('change', () => this.error.setText(''));

    const cancelable = this.opts.cancelable !== false;
    addKeyHints(this, cancelable ? [
      ['Enter', 'Avaa'],
      ['Esc', 'Peruuta'],
    ] : [['Enter', 'Avaa']], undefined, { opaque: true });
    onKeys(this, {
      Enter: () => this.check(),
      Escape: () => (cancelable ? this.close(false) : false),
    });
  }

  getTestState(): unknown {
    return { title: this.opts.title, length: this.field ? Array.from(this.field.value).length : 0, error: this.error?.text ?? '' };
  }

  private check(): void {
    if (this.closed) return;
    const typed = this.field.value;
    if (typed.length > 0 && verifyPassword(typed)) {
      sfx.play('select');
      this.close(true);
      return;
    }
    this.failures += 1;
    sfx.play('error');
    // Clear first: clearing fires 'change', which would also wipe the message.
    this.field.clear();
    this.field.showError();
    this.error.setText(typed.length === 0 ? 'Kirjoita ensin salasana.' : 'Väärä salasana. Yritä uudelleen.');
  }

  private close(success: boolean): void {
    if (this.closed) return;
    this.closed = true;
    if (!success) sfx.play('back');
    const { onSuccess, onCancel } = this.opts;
    this.scene.stop();
    if (success) onSuccess();
    else onCancel();
  }
}
