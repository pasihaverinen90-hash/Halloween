import Phaser from 'phaser';
import { sfx } from '../core/sfx';
import { SCENES, type DialogData } from '../scenes/keys';
import { addKeyHints } from './hints';
import { onKeys } from './input';
import { addCenteredPanel, addDim } from './overlay';
import { H, W } from './screen';
import { COLORS, CSS, FONTS, TEXT } from './theme';
import { paintPanel } from './widgets/panel';

const PANEL_W = 760;
const MESSAGE_W = 640;
const BUTTON_W = 250;
const BUTTON_H = 62;

interface Button {
  value: boolean;
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
}

/** Confirm / info dialog over a paused scene. ←/→ choose, Enter confirms, Esc cancels. */
export class DialogScene extends Phaser.Scene {
  private opts!: DialogData;
  private buttons: Button[] = [];
  private choice = 0;
  private closed = false;

  constructor() {
    super(SCENES.Dialog);
  }

  init(data: DialogData): void {
    this.opts = data;
    this.buttons = [];
    this.closed = false;
  }

  create(): void {
    this.scene.bringToTop();
    const d = this.opts;
    addDim(this);

    const message = this.add
      .text(W / 2, 0, d.message, { ...TEXT.body, align: 'center', lineSpacing: 6, wordWrap: { width: MESSAGE_W } })
      .setOrigin(0.5, 0);
    const panelH = Math.max(280, 96 + message.height + 40 + BUTTON_H + 48);
    const top = H / 2 - panelH / 2;
    const panel = addCenteredPanel(this, PANEL_W, panelH, d.danger ? { border: COLORS.red, glow: COLORS.red } : {});

    const title = this.add
      .text(W / 2, top + 54, d.title, { ...TEXT.heading, fontSize: '44px', color: d.danger ? CSS.red : CSS.orange })
      .setOrigin(0.5);
    message.setY(top + 96);

    const values = d.cancelLabel === null ? [true] : [true, false];
    const labels = values.map((v) => (v ? (d.confirmLabel ?? 'Kyllä') : (d.cancelLabel ?? 'Peruuta')));
    const buttonY = top + panelH - 40 - BUTTON_H / 2;
    const totalW = values.length * BUTTON_W + (values.length - 1) * 40;
    values.forEach((value, i) => {
      const x = W / 2 - totalW / 2 + i * (BUTTON_W + 40) + BUTTON_W / 2;
      const bg = this.add.graphics({ x: x - BUTTON_W / 2, y: buttonY - BUTTON_H / 2 });
      const label = this.add
        .text(x, buttonY, labels[i], { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '28px', color: CSS.bone })
        .setOrigin(0.5);
      this.buttons.push({ value, bg, label });
    });

    const preferConfirm = d.cancelLabel === null || d.defaultChoice === 'confirm';
    this.choice = preferConfirm ? 0 : this.buttons.length - 1;
    this.paintButtons();

    const parts = [panel, title, message, ...this.buttons.flatMap((b) => [b.bg, b.label])];
    this.tweens.add({ targets: parts, alpha: { from: 0, to: 1 }, duration: 160, ease: 'Sine.Out' });

    const hints: Array<[string, string]> =
      this.buttons.length > 1 ? [['← →', 'Valitse'], ['Enter', 'Vahvista'], ['Esc', 'Peruuta']] : [['Enter', 'Sulje']];
    addKeyHints(this, hints, undefined, { opaque: true });

    const move = (): void => {
      if (this.buttons.length < 2) return;
      this.choice = 1 - this.choice;
      sfx.play('move');
      this.paintButtons();
    };
    onKeys(
      this,
      {
        ArrowLeft: move,
        ArrowRight: move,
        ArrowUp: move,
        ArrowDown: move,
        Tab: move,
        Enter: () => this.close(this.buttons[this.choice].value),
        Escape: () => this.close(this.buttons.length > 1 ? false : true),
      },
      { allowRepeat: ['ArrowLeft', 'ArrowRight'] },
    );
  }

  getTestState(): unknown {
    return {
      title: this.opts.title,
      message: this.opts.message,
      buttons: this.buttons.map((b) => b.label.text),
      selected: this.buttons[this.choice]?.label.text ?? null,
    };
  }

  private paintButtons(): void {
    this.buttons.forEach((button, i) => {
      const selected = i === this.choice;
      const danger = this.opts.danger && button.value;
      const accent = danger ? COLORS.red : COLORS.orange;
      paintPanel(button.bg, BUTTON_W, BUTTON_H, {
        fill: selected ? (danger ? 0x5a1a22 : COLORS.panelLight) : COLORS.night,
        border: selected ? accent : COLORS.border,
        borderWidth: selected ? 3 : 2,
        radius: 14,
        glow: selected ? accent : false,
      });
      button.label.setColor(selected ? (danger ? '#ffd7d9' : CSS.orange) : CSS.muted);
    });
  }

  private close(confirmed: boolean): void {
    if (this.closed) return;
    this.closed = true;
    sfx.play(confirmed ? 'select' : 'back');
    const { onClose } = this.opts;
    this.scene.stop();
    onClose(confirmed);
  }
}
