import Phaser from 'phaser';
import { sfx } from '../../core/sfx';
import { onChar, onKeys } from '../input';
import { COLORS, CSS, FONTS } from '../theme';
import { shake } from './motion';
import { paintPanel } from './panel';

/*
 * Single-line text field for names, passwords and numbers. Keyboard only:
 * typed characters are appended, Backspace erases. Enter is NOT handled
 * here; the scene decides what Enter does (read `value`).
 */

export interface TextInputOptions {
  /** Field width in pixels. */
  width: number;
  /** Maximum number of characters. */
  maxLength: number;
  /** Grey text shown while the field is empty. */
  placeholder?: string;
  /** Show • instead of the characters (passwords). */
  masked?: boolean;
  /** Which single characters may be typed. Default: any printable character. */
  allow?: (ch: string) => boolean;
  /** Font size of the value. Default 34. */
  fontSize?: number;
  /** Starting value. */
  initial?: string;
}

const MASK_CHAR = '•';
const PAD_X = 20;

/**
 * A text field. (x, y) is the centre of the field. Emits 'change' (value)
 * whenever the value changes. Plays 'type', 'erase' and 'error' sounds.
 */
export class TextInput extends Phaser.GameObjects.Container {
  private readonly options: Required<Omit<TextInputOptions, 'placeholder' | 'allow' | 'initial'>> &
    Pick<TextInputOptions, 'placeholder' | 'allow'>;
  private readonly box: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly caret: Phaser.GameObjects.Rectangle;
  private readonly fieldHeight: number;
  private current = '';
  private enabled = true;
  private errorUntil = 0;
  private unsubscribe: Array<() => void> = [];
  private blink: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: TextInputOptions) {
    super(scene, x, y);
    this.options = {
      width: Math.max(120, opts.width),
      maxLength: Math.max(1, Math.floor(opts.maxLength)),
      masked: opts.masked ?? false,
      fontSize: opts.fontSize ?? 34,
      placeholder: opts.placeholder,
      allow: opts.allow,
    };
    const { width, fontSize } = this.options;
    this.fieldHeight = Math.round(fontSize * 1.85);

    this.box = scene.add.graphics();
    this.label = scene.add
      .text(-width / 2 + PAD_X, 0, '', {
        fontFamily: FONTS.ui,
        fontStyle: '700',
        fontSize: `${fontSize}px`,
        color: CSS.bone,
      })
      .setOrigin(0, 0.5);
    this.caret = scene.add.rectangle(0, 0, 3, Math.round(fontSize * 1.05), COLORS.orange).setOrigin(0, 0.5);
    this.add([this.box, this.label, this.caret]);
    this.setSize(width, this.fieldHeight);
    scene.add.existing(this);

    this.current = this.sanitize(opts.initial ?? '');
    this.redraw();
    this.subscribe();
    this.startBlink();
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.teardown());
  }

  /** The current text. */
  get value(): string {
    return this.current;
  }

  set value(text: string) {
    this.setValue(text);
  }

  /** Field height in pixels (for layout). */
  get boxHeight(): number {
    return this.fieldHeight;
  }

  /** Replace the text (characters that are not allowed are dropped, the rest cut to maxLength). */
  setValue(text: string): this {
    const next = this.sanitize(text);
    if (next !== this.current) {
      this.current = next;
      this.redraw();
      this.emit('change', this.current);
    } else {
      this.redraw();
    }
    return this;
  }

  /** Empty the field. */
  clear(): this {
    return this.setValue('');
  }

  /** Turn typing on or off. A disabled field is dimmed and ignores all keys. */
  setEnabled(on: boolean): this {
    if (on === this.enabled) return this;
    this.enabled = on;
    if (on) {
      this.subscribe();
      this.startBlink();
    } else {
      this.unsubscribeAll();
      this.stopBlink();
    }
    this.redraw();
    return this;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Red outline and a shake: use when the scene rejects the value (wrong password, name taken). */
  showError(): this {
    this.errorUntil = this.scene.time.now + 900;
    this.redraw();
    shake(this.scene, this);
    this.scene.time.delayedCall(920, () => {
      if (this.active) this.redraw();
    });
    return this;
  }

  private sanitize(text: string): string {
    let result = '';
    for (const ch of Array.from(text)) {
      if (Array.from(result).length >= this.options.maxLength) break;
      if (this.isAllowed(ch)) result += ch;
    }
    return result;
  }

  private isAllowed(ch: string): boolean {
    try {
      return this.options.allow ? this.options.allow(ch) : true;
    } catch {
      return false;
    }
  }

  private subscribe(): void {
    this.unsubscribeAll();
    this.unsubscribe.push(
      onChar(this.scene, (ch) => this.typeChar(ch)),
      onKeys(this.scene, { Backspace: (event) => this.erase(event.repeat) }, { allowRepeat: ['Backspace'] }),
    );
  }

  private unsubscribeAll(): void {
    for (const off of this.unsubscribe) off();
    this.unsubscribe = [];
  }

  private typeChar(ch: string): void {
    if (!this.enabled) return;
    if (Array.from(this.current).length >= this.options.maxLength || !this.isAllowed(ch)) {
      sfx.play('error');
      shake(this.scene, this, 6, 220);
      return;
    }
    this.current += ch;
    sfx.play('type');
    this.afterEdit();
  }

  private erase(repeat: boolean): void {
    if (!this.enabled) return;
    if (this.current.length === 0) {
      if (!repeat) sfx.play('error');
      return;
    }
    const chars = Array.from(this.current);
    chars.pop();
    this.current = chars.join('');
    sfx.play('erase');
    this.afterEdit();
  }

  private afterEdit(): void {
    this.errorUntil = 0;
    this.redraw();
    this.startBlink();
    this.emit('change', this.current);
  }

  private startBlink(): void {
    this.stopBlink();
    this.caret.setVisible(this.enabled);
    if (!this.enabled) return;
    this.blink = this.scene.time.addEvent({
      delay: 530,
      loop: true,
      callback: () => this.caret.setVisible(!this.caret.visible),
    });
  }

  private stopBlink(): void {
    this.blink?.remove(false);
    this.blink = null;
    this.caret.setVisible(false);
  }

  private redraw(): void {
    const { width, fontSize, masked, placeholder } = this.options;
    const error = this.scene.time.now < this.errorUntil;
    const border = error ? COLORS.red : this.enabled ? COLORS.orange : COLORS.border;
    this.box.clear();
    this.box.setPosition(-width / 2, -this.fieldHeight / 2);
    paintPanel(this.box, width, this.fieldHeight, {
      fill: COLORS.night,
      alpha: this.enabled ? 0.92 : 0.7,
      border,
      borderWidth: this.enabled ? 3 : 2,
      radius: 12,
      glow: this.enabled ? (error ? COLORS.red : COLORS.orange) : false,
    });

    const inner = width - PAD_X * 2 - 8;
    const left = -width / 2 + PAD_X;
    if (this.current.length === 0) {
      this.label.setText(placeholder ?? '');
      this.label.setColor(CSS.grey);
      this.label.setLetterSpacing(0);
      this.fitTail(placeholder ?? '', inner, false);
      this.label.setX(left + 8);
      this.caret.setX(left);
    } else {
      const shown = masked ? MASK_CHAR.repeat(Array.from(this.current).length) : this.current;
      this.label.setColor(CSS.bone);
      this.label.setLetterSpacing(masked ? Math.round(fontSize * 0.12) : 0);
      this.fitTail(shown, inner, true);
      this.label.setX(left);
      this.caret.setX(left + this.label.width + 3);
    }
    this.label.setAlpha(this.enabled ? 1 : 0.6);
  }

  /** Show the text; when it is too wide, show "…" and the end that fits (the end is where typing happens). */
  private fitTail(text: string, maxWidth: number, keepEnd: boolean): void {
    this.label.setText(text);
    if (this.label.width <= maxWidth) return;
    const chars = Array.from(text);
    if (keepEnd) {
      for (let start = 1; start < chars.length; start++) {
        this.label.setText('…' + chars.slice(start).join(''));
        if (this.label.width <= maxWidth) return;
      }
    } else {
      for (let end = chars.length - 1; end > 0; end--) {
        this.label.setText(chars.slice(0, end).join('') + '…');
        if (this.label.width <= maxWidth) return;
      }
    }
  }

  private teardown(): void {
    this.unsubscribeAll();
    this.blink?.remove(false);
    this.blink = null;
  }
}
