import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints, type KeyHintBar } from '../../ui/hints';
import { onKeys } from '../../ui/input';
import { addAsset, fitImage } from '../../ui/place';
import { H, W } from '../../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../../ui/theme';
import { moveInGrid, type GridDirection } from '../../ui/widgets/gridNav';
import { shake } from '../../ui/widgets/motion';
import { drawPanel, paintPanel } from '../../ui/widgets/panel';
import { TextInput } from '../../ui/widgets/TextInput';
import { assetKey, type GameContext, type GameSceneData } from '../types';
import { BACKGROUND, PICTURES, PICTURE_BOX, PICTURE_BOX_WITH_TEXT } from './assets';
import { ARVOITUKSET_CONTENT } from './content';
import {
  LIMIT_MS,
  isCorrectAnswer,
  optionOrder,
  restoreRound,
  riddlePoints,
  roundTotal,
  serializeRound,
  type Outcome,
  type Riddle,
  type RiddleProgress,
  type RoundState,
} from './logic';

const OPTION_W = 500;
const OPTION_H = 58;
const OPTION_POS: ReadonlyArray<[number, number]> = [
  [370, 524],
  [910, 524],
  [370, 594],
  [910, 594],
];
const LETTERS = ['A', 'B', 'C', 'D'];
const RIDDLE_Y = 328;
const TIMER_X = 360;
const TIMER_W = 560;
const TIMER_Y = 158;

// Freeplay keeps unrounded points (Pasi 23.10.); the screen always shows whole points.
const fi = (n: number): string => Math.round(n).toLocaleString('fi-FI');

/** Picture and emoji riddles: ten riddles, 20 seconds each. Plays one round. */
export class ArvoitusScene extends Phaser.Scene {
  private ctx!: GameContext;
  private riddles: Riddle[] = [];
  private round: RoundState = { index: 0, scores: [], current: null };
  private phase: 'answering' | 'done' | 'finished' = 'answering';
  private options: string[] = [];
  private selected = 0;
  private savedAtMs = 0;
  private lastTick = -1;

  private riddleLayer!: Phaser.GameObjects.Container;
  private answerLayer!: Phaser.GameObjects.Container;
  private optionBgs: Phaser.GameObjects.Graphics[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private answerField: TextInput | null = null;
  private feedback!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private valueText!: Phaser.GameObjects.Text;
  private secondsText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private banner!: Phaser.GameObjects.Container;
  private hints!: KeyHintBar;

  constructor() {
    super('Arvoitukset');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.riddles = ARVOITUKSET_CONTENT.ok ? ARVOITUKSET_CONTENT.riddles : [];
    this.phase = 'answering';
    this.options = [];
    this.selected = 0;
    this.optionBgs = [];
    this.optionTexts = [];
    this.answerField = null;
    this.lastTick = -1;
  }

  create(): void {
    if (!ARVOITUKSET_CONTENT.ok) {
      this.showContentError(ARVOITUKSET_CONTENT.errors.map((e) => e.message));
      return;
    }
    this.round = restoreRound(this.ctx.checkpoint.initial, this.riddles.length) ?? { index: 0, scores: [], current: null };
    if (this.round.index >= this.riddles.length) {
      this.phase = 'finished';
      this.ctx.finish(roundTotal(this.round.scores));
      return;
    }

    addAsset(this, BACKGROUND, W / 2, H / 2, { fit: 'cover' });
    this.progressText = this.add.text(70, 50, '', { ...TEXT.heading, fontSize: '34px', color: CSS.muted }).setOrigin(0, 0.5);
    this.scoreText = this.add.text(W - 70, 50, '', { ...TEXT.bodyBold, fontSize: '30px', color: CSS.orange }).setOrigin(1, 0.5);
    this.questionText = this.add
      .text(W / 2, 108, '', { ...TEXT.heading, fontSize: '40px', align: 'center', wordWrap: { width: 1000 } })
      .setOrigin(0.5);
    this.timerBar = this.add.graphics();
    this.valueText = this.add.text(TIMER_X - 16, TIMER_Y, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.muted }).setOrigin(1, 0.5);
    this.secondsText = this.add.text(TIMER_X + TIMER_W + 16, TIMER_Y, '', { ...TEXT.bodyBold, fontSize: '22px' }).setOrigin(0, 0.5);
    this.riddleLayer = this.add.container(0, 0);
    this.answerLayer = this.add.container(0, 0);
    this.feedback = this.add.text(W / 2, 604, '', { ...TEXT.bodyBold, fontSize: '24px', color: CSS.red }).setOrigin(0.5);
    this.banner = this.add.container(W / 2, 132).setDepth(10).setVisible(false);
    this.hints = addKeyHints(this, []);

    const move = (dir: GridDirection) => () => this.moveOption(dir);
    onKeys(
      this,
      {
        ArrowLeft: move('left'),
        ArrowRight: move('right'),
        ArrowUp: move('up'),
        ArrowDown: move('down'),
        Enter: () => this.onEnter(),
      },
      { allowRepeat: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] },
    );
    this.showRiddle();
  }

  override update(): void {
    const current = this.round.current;
    if (this.phase !== 'answering' || !current) return;
    // Real time (not Phaser's smoothed delta, which slows down with the frame rate), so 20 seconds
    // is 20 seconds on any computer. One frame counts at most 250 ms; pauses stop update() entirely.
    const step = Math.min(250, Math.max(0, this.game.loop.rawDelta));
    current.elapsedMs = Math.min(LIMIT_MS, current.elapsedMs + step);
    this.refreshTimer();
    const left = Math.ceil((LIMIT_MS - current.elapsedMs) / 1000);
    if (left <= CONFIG.arvoitukset.tickFromSecondsLeft && left > 0 && left !== this.lastTick) {
      this.lastTick = left;
      this.ctx.sfx.play('tick');
    }
    if (current.elapsedMs - this.savedAtMs >= 1000) this.save();
    if (current.elapsedMs >= LIMIT_MS) this.finishRiddle('timeout', 0);
  }

  getTestState(): unknown {
    const riddle = this.riddles[this.round.index];
    const current = this.round.current;
    return {
      index: this.round.index,
      kind: riddle?.kind ?? null,
      question: riddle?.question ?? null,
      answers: riddle?.answers ?? [],
      options: [...this.options],
      selected: this.options[this.selected] ?? null,
      typed: this.answerField?.value ?? '',
      elapsedMs: current ? Math.round(current.elapsedMs) : 0,
      wrong: current?.wrong ?? 0,
      outcome: current?.result?.outcome ?? null,
      scores: [...this.round.scores],
      total: this.displayTotal(),
      phase: this.phase,
    };
  }

  // ---------------------------------------------------------------- showing

  private get riddle(): Riddle {
    return this.riddles[this.round.index];
  }

  private displayTotal(): number {
    const result = this.round.current?.result;
    return roundTotal(this.round.scores) + (result ? result.points : 0);
  }

  private clearRiddle(): void {
    const old = [...this.riddleLayer.list, ...this.answerLayer.list, ...this.optionTexts, ...this.optionBgs];
    this.tweens.killTweensOf(old);
    this.riddleLayer.removeAll(true);
    this.answerLayer.removeAll(true);
    this.answerField?.destroy();
    this.answerField = null;
    this.optionBgs = [];
    this.optionTexts = [];
    this.options = [];
    this.feedback.setText('');
    this.banner.setVisible(false);
  }

  private showRiddle(): void {
    this.clearRiddle();
    const riddle = this.riddle;
    if (!this.round.current) this.round.current = { elapsedMs: 0, wrong: 0, result: null };
    const current = this.round.current;
    this.savedAtMs = current.elapsedMs;
    this.lastTick = -1;

    // Set the phase first: the options are painted according to it (a new riddle must not show its answer).
    this.phase = current.result ? 'done' : 'answering';
    this.progressText.setText(`Arvoitus ${this.round.index + 1}/${this.riddles.length}`);
    this.questionText.setText(riddle.question);
    this.buildRiddleVisual(riddle);
    if (riddle.kind === 'monivalinta') this.buildOptions(riddle);
    else this.buildAnswerField();
    this.riddleLayer.setAlpha(0);
    this.tweens.add({ targets: this.riddleLayer, alpha: 1, duration: 220 });

    if (current.result) {
      this.showResult(current.result.outcome, current.result.points, false);
    } else {
      this.hints.setHints(
        riddle.kind === 'monivalinta'
          ? [['←→↑↓', 'Valitse'], ['Enter', 'Vastaa']]
          : [['A–Ö', 'Kirjoita vastaus'], ['Enter', 'Vastaa']],
      );
      this.save();
    }
    this.refreshTimer();
  }

  private buildRiddleVisual(riddle: Riddle): void {
    const frame = drawPanel(this, W / 2 - 330, RIDDLE_Y - 146, 660, 292, { radius: 20, alpha: 0.9 });
    this.riddleLayer.add(frame);
    if (riddle.emojis) {
      const emojis = this.add
        .text(W / 2, RIDDLE_Y, riddle.emojis, { fontFamily: FONTS.emoji, fontSize: '128px', padding: { top: 24, bottom: 24 } })
        .setOrigin(0.5);
      this.riddleLayer.add(emojis);
      return;
    }
    if (!riddle.image) return;
    const extras = riddle.image.extras;
    const box = extras.length > 0 ? PICTURE_BOX_WITH_TEXT : PICTURE_BOX;
    const imageX = extras.length > 0 ? W / 2 - 90 : W / 2;
    const key = assetKey(riddle.image.file);
    const spec = PICTURES.find((p) => p.file === riddle.image?.file);
    if (spec && this.textures.exists(key)) {
      this.riddleLayer.add(addAsset(this, spec, imageX, RIDDLE_Y, { width: box.width, height: box.height }));
    } else if (this.textures.exists(key)) {
      const image = this.add.image(imageX, RIDDLE_Y, key);
      fitImage(image, box.width, box.height);
      this.riddleLayer.add(image);
    } else {
      this.riddleLayer.add(
        this.add
          .text(imageX, RIDDLE_Y, `Kuva puuttuu:\n${riddle.image.file}`, { ...TEXT.body, color: CSS.muted, align: 'center' })
          .setOrigin(0.5),
      );
    }
    if (extras.length > 0) {
      const text = this.add
        .text(W / 2 + 220, RIDDLE_Y, `+ ${extras.join(' + ')}`, {
          fontFamily: FONTS.ui,
          fontStyle: '800',
          fontSize: '96px',
          color: CSS.bone,
          stroke: '#1a0f28',
          strokeThickness: 6,
        })
        .setOrigin(0.5);
      this.riddleLayer.add(text);
    }
  }

  private buildOptions(riddle: Riddle): void {
    this.options = optionOrder(riddle);
    this.selected = 0;
    this.options.forEach((option, i) => {
      const [x, y] = OPTION_POS[i];
      const bg = this.add.graphics({ x: x - OPTION_W / 2, y: y - OPTION_H / 2 });
      const text = this.add
        .text(x - OPTION_W / 2 + 24, y, `${LETTERS[i]}   ${option}`, { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '26px', color: CSS.bone })
        .setOrigin(0, 0.5);
      this.answerLayer.add([bg, text]);
      this.optionBgs.push(bg);
      this.optionTexts.push(text);
    });
    this.paintOptions();
  }

  private buildAnswerField(): void {
    this.answerField = new TextInput(this, W / 2, 534, {
      width: 620,
      maxLength: 40,
      placeholder: 'Kirjoita vastaus ja paina Enter',
    });
    this.answerField.on('change', () => {
      if (this.phase === 'answering') this.feedback.setText('');
    });
  }

  /** Option colours: selected (orange) while answering; correct (green) and a wrong choice (red) afterwards. */
  private paintOptions(choice: number | null = null): void {
    const correct = this.riddle?.answers[0];
    this.optionBgs.forEach((bg, i) => {
      const isSelected = i === this.selected;
      const done = this.phase !== 'answering';
      const isCorrect = done && this.options[i] === correct;
      const isWrongChoice = done && choice === i && !isCorrect;
      const border = isCorrect ? COLORS.green : isWrongChoice ? COLORS.red : isSelected && !done ? COLORS.orange : COLORS.border;
      paintPanel(bg, OPTION_W, OPTION_H, {
        fill: isCorrect ? 0x1d3320 : isWrongChoice ? 0x3a1420 : isSelected && !done ? COLORS.panelLight : COLORS.panel,
        border,
        borderWidth: isSelected || isCorrect || isWrongChoice ? 3 : 2,
        radius: 14,
        alpha: 0.96,
        glow: (isSelected && !done) || isCorrect ? border : false,
      });
      this.optionTexts[i].setColor(isCorrect ? CSS.green : isWrongChoice ? CSS.red : isSelected && !done ? CSS.orange : CSS.bone);
    });
  }

  private refreshTimer(): void {
    const current = this.round.current;
    if (!current) return;
    const left = Math.max(0, LIMIT_MS - current.elapsedMs);
    const ratio = left / LIMIT_MS;
    const urgent = left <= CONFIG.arvoitukset.tickFromSecondsLeft * 1000;
    this.timerBar.clear();
    this.timerBar.fillStyle(COLORS.panel, 0.95);
    this.timerBar.fillRoundedRect(TIMER_X, TIMER_Y - 8, TIMER_W, 16, 8);
    if (ratio > 0) {
      this.timerBar.fillStyle(urgent ? COLORS.red : COLORS.orange, 1);
      this.timerBar.fillRoundedRect(TIMER_X, TIMER_Y - 8, Math.max(16, TIMER_W * ratio), 16, 8);
    }
    // Text objects redraw on every setColor, so only touch them when something changed.
    this.secondsText.setText(`${Math.ceil(left / 1000)} s`);
    const color = urgent ? CSS.red : CSS.bone;
    if (this.secondsText.style.color !== color) this.secondsText.setColor(color);
    const value = current.result ? current.result.points : riddlePoints(current.elapsedMs, current.wrong);
    this.valueText.setText(current.result ? '' : `Arvo ${fi(value)} p`);
    this.scoreText.setText(`Pisteet: ${fi(this.displayTotal())}`);
  }

  // ---------------------------------------------------------------- input

  private moveOption(dir: GridDirection): boolean {
    if (this.phase !== 'answering' || this.riddle?.kind !== 'monivalinta') return false;
    const next = moveInGrid(this.selected, this.options.length, 2, dir);
    if (next !== this.selected) {
      this.selected = next;
      this.ctx.sfx.play('move');
      this.paintOptions();
    }
    return true;
  }

  private onEnter(): boolean {
    if (this.phase === 'done') {
      this.nextRiddle();
      return true;
    }
    if (this.phase !== 'answering') return false;
    const current = this.round.current as RiddleProgress;
    const riddle = this.riddle;
    if (riddle.kind === 'monivalinta') {
      const choice = this.selected;
      if (this.options[choice] === riddle.answers[0]) this.finishRiddle('correct', riddlePoints(current.elapsedMs, 0, this.ctx.freeplay), choice);
      else this.finishRiddle('wrong', 0, choice);
      return true;
    }
    const field = this.answerField;
    if (!field) return true;
    if (field.value.trim() === '') {
      this.ctx.sfx.play('error');
      field.showError();
      return true;
    }
    if (isCorrectAnswer(riddle, field.value)) {
      this.finishRiddle('correct', riddlePoints(current.elapsedMs, current.wrong, this.ctx.freeplay));
      return true;
    }
    current.wrong += 1;
    this.ctx.sfx.play('wrong');
    // Clear first: clearing fires 'change', which would also wipe the message.
    field.clear();
    field.showError();
    this.feedback.setText(`Väärin! −${CONFIG.arvoitukset.wrongAnswerPenalty} pistettä. Yritä uudelleen.`).setColor(CSS.red);
    shake(this, this.feedback, 8, 260);
    this.refreshTimer();
    this.save();
    return true;
  }

  private finishRiddle(outcome: Outcome, points: number, choice: number | null = null): void {
    const current = this.round.current;
    if (!current || this.phase !== 'answering') return;
    current.result = { outcome, points };
    this.phase = 'done';
    this.save();
    this.showResult(outcome, points, true, choice);
  }

  private showResult(outcome: Outcome, points: number, animate: boolean, choice: number | null = null): void {
    const riddle = this.riddle;
    this.answerField?.setEnabled(false);
    if (riddle.kind === 'monivalinta') this.paintOptions(choice);
    if (animate) this.ctx.sfx.play(outcome === 'correct' ? 'success' : 'fail');
    if (outcome === 'correct') this.feedback.setText('');
    else if (riddle.kind === 'avoin') this.feedback.setText(`Oikea vastaus: ${riddle.answers[0]}`).setColor(CSS.green);

    const solved = outcome === 'correct';
    const headline =
      outcome === 'correct'
        ? `Oikein! +${fi(points)} pistettä`
        : outcome === 'timeout'
          ? `Aika loppui – oikea vastaus: ${riddle.answers[0]}`
          : `Väärin – oikea vastaus: ${riddle.answers[0]}`;
    const last = this.round.index + 1 >= this.riddles.length;
    this.banner.removeAll(true);
    const panel = this.add.graphics({ x: -470, y: -52 });
    paintPanel(panel, 940, 104, {
      fill: solved ? 0x1d3320 : 0x3a1420,
      border: solved ? COLORS.green : COLORS.red,
      borderWidth: 3,
      radius: 18,
      glow: solved ? COLORS.green : COLORS.red,
      alpha: 1,
    });
    const title = this.add
      .text(0, -16, headline, { ...TEXT.heading, fontSize: '36px', color: solved ? CSS.green : CSS.red })
      .setOrigin(0.5);
    const sub = this.add
      .text(0, 26, last ? 'Paina Enter, niin näet tuloksen.' : 'Paina Enter, niin siirryt seuraavaan arvoitukseen.', { ...TEXT.body, fontSize: '22px' })
      .setOrigin(0.5);
    this.banner.add([panel, title, sub]).setVisible(true);
    if (animate) {
      this.banner.setScale(0.92).setAlpha(0);
      this.tweens.add({ targets: this.banner, scale: 1, alpha: 1, duration: 240, ease: 'Back.Out' });
    }
    this.hints.setHints([
      ['Enter', last ? 'Katso tulos' : 'Seuraava arvoitus'],
    ]);
    this.refreshTimer();
  }

  private nextRiddle(): void {
    const result = this.round.current?.result;
    if (!result) return;
    this.ctx.sfx.play('select');
    this.round.scores.push(result.points);
    this.round.index += 1;
    this.round.current = null;
    if (this.round.index >= this.riddles.length) {
      this.phase = 'finished';
      this.save();
      this.ctx.finish(roundTotal(this.round.scores));
      return;
    }
    this.save();
    this.showRiddle();
  }

  private save(): void {
    if (this.round.current) this.savedAtMs = this.round.current.elapsedMs;
    this.ctx.checkpoint.save(serializeRound(this.round));
  }

  private showContentError(messages: string[]): void {
    this.add.rectangle(W / 2, H / 2, W, H, COLORS.night);
    this.add.text(W / 2, 120, 'Arvoitustiedostossa on virhe', { ...TEXT.heading, color: CSS.red }).setOrigin(0.5);
    this.add
      .text(W / 2, 190, [...messages, '', 'Korjaa tiedosto content/kuva-arvoitukset.txt. Pasi: Ctrl + Shift + K avaa korjaustilan.'].join('\n'), {
        ...TEXT.body,
        fontSize: '22px',
        align: 'center',
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5, 0);
  }
}
