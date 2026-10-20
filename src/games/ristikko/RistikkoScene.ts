import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { onChar, onKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { H, W } from '../../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../../ui/theme';
import { drawPanel } from '../../ui/widgets/panel';
import type { GameContext, GameSceneData } from '../types';
import { BACKGROUND } from './assets';
import { ristikkoContent } from './content';
import { Crossword, type Arrow, type CrosswordEvent } from './crossword';
import { cellKey, type Layout } from './logic';

const C = CONFIG.ristikko;

/** Areas of the screen: the grid on the left, the clues on the right. */
const GRID_AREA = { x: 24, y: 108, w: 740, h: 530 };
const CLUE_AREA = { x: 786, y: 108, w: 470, h: 530 };

const PAPER = 0xefe3c8;
const WORD = 0xffd59a;
const SOLVED = 0xcfe8bd;
const INK = '#1a1124';
const REVEALED = '#8a4f00';
const MISSING = '#c23b3b';

type Phase = 'playing' | 'done' | 'timeout';

interface CellView {
  box: Phaser.GameObjects.Rectangle;
  letter: Phaser.GameObjects.Text;
  shown: string;
  fill: number;
}

interface ClueView {
  text: Phaser.GameObjects.Text;
  word: number;
}

/** Crossword: type the words, the game checks each finished word. One round of 10 minutes. */
export class RistikkoScene extends Phaser.Scene {
  private ctx!: GameContext;
  private phase: Phase = 'playing';
  private finished = false;
  /** The round; public for the browser tests. */
  crossword!: Crossword;
  private layout!: Layout;
  private cell = 32;
  private gridX = 0;
  private gridY = 0;
  private cells = new Map<string, CellView>();
  private clues: ClueView[] = [];
  private clueBar!: Phaser.GameObjects.Rectangle;
  private cursorBox!: Phaser.GameObjects.Rectangle;
  private clueText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private wordsText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  /** Seconds left for the second Enter that reveals a letter, and for which cell. */
  private revealArmed = 0;
  private revealKey = '';
  private saveIn = 0;
  private lastTick = -1;
  private shownTime = '';

  constructor() {
    super('Ristikko');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.phase = 'playing';
    this.finished = false;
    this.cells = new Map();
    this.clues = [];
    this.revealArmed = 0;
    this.revealKey = '';
    this.saveIn = 3;
    this.lastTick = -1;
    this.shownTime = '';
  }

  create(): void {
    const content = ristikkoContent();
    if (!content.ok) {
      this.showContentError(content.errors.map((e) => e.message));
      return;
    }
    this.layout = content.layout;
    this.crossword = new Crossword(this.layout);
    this.crossword.restore(this.ctx.checkpoint.initial);

    addAsset(this, BACKGROUND, W / 2, H / 2, { fit: 'cover' });
    this.buildHeader();
    this.buildGrid();
    this.buildClues();
    addKeyHints(this, [
      ['←→↑↓', 'Liiku'],
      ['Välilyönti', 'Suunta'],
      ['Enter ×2', 'Paljasta kirjain (−5 s)'],
      ['Esc', 'Tauko'],
    ]);

    onKeys(
      this,
      {
        ArrowLeft: () => this.arrow('left'),
        ArrowRight: () => this.arrow('right'),
        ArrowUp: () => this.arrow('up'),
        ArrowDown: () => this.arrow('down'),
        ' ': () => this.whilePlaying(() => this.crossword.toggle() && this.ctx.sfx.play('move')),
        Backspace: () => this.whilePlaying(() => this.apply(this.crossword.backspace())),
        Delete: () => this.whilePlaying(() => this.apply(this.crossword.erase())),
        Enter: () => this.enter(),
      },
      { allowRepeat: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace'] },
    );
    onChar(this, (char) => {
      const letter = char.toLocaleUpperCase('fi-FI');
      if (/^[A-ZÅÄÖ]$/.test(letter)) this.whilePlaying(() => this.apply(this.crossword.type(letter)));
    });
    // Pasi 20.10.: the mouse may be used here too (a click chooses a cell or a clue).
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.click(pointer.worldX, pointer.worldY));

    this.redraw();
    if (this.crossword.allSolved() || this.crossword.secondsLeft <= 0) this.time.delayedCall(300, () => this.end(this.crossword.allSolved() ? 'done' : 'timeout'));
  }

  override update(): void {
    if (!this.crossword || this.phase !== 'playing') return;
    // Real time (also on a slow computer), but nothing passes during a pause.
    const seconds = Math.min(250, Math.max(0, this.game.loop.rawDelta)) / 1000;
    this.crossword.tick(seconds);
    if (this.revealArmed > 0) {
      this.revealArmed = Math.max(0, this.revealArmed - seconds);
      if (this.revealArmed === 0) this.promptText.setVisible(false);
    }
    this.saveIn -= seconds;
    if (this.saveIn <= 0) this.save();
    const left = Math.ceil(this.crossword.secondsLeft);
    if (left <= 10 && left > 0 && left !== this.lastTick) {
      this.lastTick = left;
      this.ctx.sfx.play('tick');
    }
    this.refreshTime();
    if (this.crossword.secondsLeft <= 0) this.end('timeout');
  }

  getTestState(): unknown {
    const x = this.crossword;
    if (!x) return { phase: 'error' };
    return {
      phase: this.phase,
      secondsLeft: Math.round(x.secondsLeft * 10) / 10,
      solved: x.solved.size,
      counted: x.counted(),
      total: this.layout.words.length,
      row: x.row,
      col: x.col,
      dir: x.dir,
      word: x.currentWord(),
      filled: x.values.size,
      revealed: x.revealed.size,
      prompt: this.revealArmed > 0,
      points: x.points(),
    };
  }

  /** Test helper: the centre of a cell in game coordinates (for mouse clicks). */
  cellCenter(row: number, col: number): { x: number; y: number } {
    return { x: this.gridX + (col + 0.5) * this.cell, y: this.gridY + (row + 0.5) * this.cell };
  }

  // ---------------------------------------------------------------- input

  private whilePlaying(action: () => unknown): void {
    if (this.phase !== 'playing') return;
    action();
    this.redraw();
  }

  private arrow(arrow: Arrow): void {
    this.whilePlaying(() => {
      this.crossword.move(arrow);
      this.disarm();
    });
  }

  private enter(): unknown {
    if (this.phase === 'timeout') {
      this.finish();
      return true;
    }
    if (this.phase !== 'playing') return false;
    const x = this.crossword;
    if (x.locked(x.key)) {
      this.flashPrompt('Tämä kirjain on jo valmis.');
      return true;
    }
    if (this.revealArmed > 0 && this.revealKey === x.key) {
      this.disarm();
      this.apply(x.reveal());
      this.penaltyText();
      this.redraw();
      return true;
    }
    this.revealArmed = C.revealConfirmSeconds;
    this.revealKey = x.key;
    this.promptText.setText(`Paina Enter uudelleen, niin kirjain paljastetaan (−${C.revealPenaltySeconds} s).`).setColor(CSS.orange).setVisible(true);
    this.ctx.sfx.play('move');
    return true;
  }

  private disarm(): void {
    this.revealArmed = 0;
    this.promptText?.setVisible(false);
  }

  private flashPrompt(message: string): void {
    this.revealArmed = 1.5;
    this.revealKey = '';
    this.promptText.setText(message).setColor(CSS.muted).setVisible(true);
  }

  private click(x: number, y: number): void {
    if (this.phase !== 'playing') return;
    const col = Math.floor((x - this.gridX) / this.cell);
    const row = Math.floor((y - this.gridY) / this.cell);
    if (this.crossword.has(row, col)) {
      this.crossword.select(row, col);
      this.disarm();
      this.ctx.sfx.play('move');
      this.redraw();
      return;
    }
    const clue = this.clues.find((c) => c.text.getBounds().contains(x, y));
    if (clue) {
      this.crossword.selectWord(clue.word);
      this.disarm();
      this.ctx.sfx.play('move');
      this.redraw();
    }
  }

  /** Sounds and animations for what happened, then save. */
  private apply(events: CrosswordEvent[]): void {
    for (const event of events) {
      if (event.type === 'typed') this.ctx.sfx.play('type');
      else if (event.type === 'erased') this.ctx.sfx.play('erase');
      else if (event.type === 'revealed') this.ctx.sfx.play('select');
      else if (event.type === 'locked') this.flashPrompt('Tämä kirjain on jo valmis.');
      else if (event.type === 'solved') {
        this.ctx.sfx.play('success');
        this.pulse(this.crossword.cellsOf(event.word), 0x8fdc5a);
      } else if (event.type === 'wrong') {
        this.ctx.sfx.play('wrong');
        this.pulse(this.crossword.cellsOf(event.word), COLORS.red);
        this.penaltyText();
      }
    }
    if (events.length > 0) this.save();
    if (this.crossword.allSolved()) this.end('done');
  }

  private save(): void {
    this.saveIn = 3;
    if (this.phase === 'playing') this.ctx.checkpoint.save(this.crossword.snapshot());
  }

  // ---------------------------------------------------------------- ending

  private end(phase: 'done' | 'timeout'): void {
    if (this.phase !== 'playing') return;
    this.phase = phase;
    this.disarm();
    if (phase === 'done') {
      this.ctx.sfx.play('fanfare');
      this.banner('Ristikko ratkaistu!', CSS.green);
      this.time.delayedCall(2200, () => this.finish());
    } else {
      // Pasi 20.10.: the unsolved words are shown when the time runs out.
      this.ctx.sfx.play('fail');
      for (const [key, view] of this.cells) {
        if (!this.crossword.values.has(key)) view.letter.setText(this.crossword.solution.get(key)!).setColor(MISSING);
      }
      this.banner('Aika loppui! Puuttuvat kirjaimet näkyvät punaisina.', CSS.red);
      this.promptText.setText('Paina Enter, niin jatketaan.').setColor(CSS.bone).setVisible(true);
    }
    this.redraw();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.ctx.finish(this.crossword.points());
  }

  // ---------------------------------------------------------------- drawing

  private buildHeader(): void {
    const bar = this.add.graphics();
    bar.fillStyle(COLORS.night, 0.78);
    bar.fillRoundedRect(20, 14, 240, 40, 14);
    bar.fillRoundedRect(W - 260, 14, 240, 40, 14);
    this.timeText = this.add.text(36, 34, '', { ...TEXT.bodyBold, fontSize: '26px', color: CSS.orange }).setOrigin(0, 0.5);
    this.wordsText = this.add.text(W - 244, 34, '', { ...TEXT.bodyBold, fontSize: '24px', color: CSS.bone }).setOrigin(0, 0.5);
    this.clueText = this.add
      .text(W / 2, 34, '', { ...TEXT.bodyBold, fontSize: '24px', color: CSS.bone, align: 'center', wordWrap: { width: 680 } })
      .setOrigin(0.5);
    this.clueText.setShadow(0, 2, '#000000', 4, true, true);
    this.promptText = this.add
      .text(GRID_AREA.x + GRID_AREA.w / 2, 84, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.orange })
      .setOrigin(0.5)
      .setVisible(false);
    this.promptText.setShadow(0, 2, '#000000', 4, true, true);
  }

  private buildGrid(): void {
    const { rows, cols } = this.layout;
    this.cell = Math.floor(Math.min(GRID_AREA.w / cols, GRID_AREA.h / rows, 44));
    this.gridX = Math.round(GRID_AREA.x + (GRID_AREA.w - cols * this.cell) / 2);
    this.gridY = Math.round(GRID_AREA.y + (GRID_AREA.h - rows * this.cell) / 2);
    drawPanel(this, this.gridX - 14, this.gridY - 14, cols * this.cell + 28, rows * this.cell + 28, { radius: 14 });
    const numbers = new Map<string, number>();
    for (const word of this.layout.words) numbers.set(cellKey(word.row, word.col), word.number);
    for (const key of this.crossword.solution.keys()) {
      const [row, col] = key.split(',').map(Number);
      const x = this.gridX + col * this.cell;
      const y = this.gridY + row * this.cell;
      const box = this.add.rectangle(x + this.cell / 2, y + this.cell / 2, this.cell - 2, this.cell - 2, PAPER).setStrokeStyle(2, 0x2a1f35);
      const letter = this.add
        .text(x + this.cell / 2, y + this.cell / 2 + 2, '', { fontFamily: FONTS.ui, fontStyle: '800', fontSize: `${Math.round(this.cell * 0.6)}px`, color: INK })
        .setOrigin(0.5);
      const number = numbers.get(key);
      if (number !== undefined) {
        this.add.text(x + 3, y + 1, String(number), { fontFamily: FONTS.ui, fontStyle: '700', fontSize: `${Math.max(9, Math.round(this.cell * 0.3))}px`, color: '#5e4a6e' });
      }
      this.cells.set(key, { box, letter, shown: '', fill: PAPER });
    }
    this.cursorBox = this.add.rectangle(0, 0, this.cell - 1, this.cell - 1).setStrokeStyle(4, COLORS.orange).setDepth(5);
  }

  /** Across and down clues; the font shrinks until every clue fits. */
  private buildClues(): void {
    drawPanel(this, CLUE_AREA.x, CLUE_AREA.y - 14, CLUE_AREA.w, CLUE_AREA.h + 28, { radius: 14 });
    this.clueBar = this.add.rectangle(0, 0, CLUE_AREA.w - 20, 10, COLORS.orange, 0.28).setOrigin(0, 0);
    const words = this.layout.words;
    for (const size of [22, 20, 19, 18, 17, 16, 15, 14]) {
      for (const view of this.clues) view.text.destroy();
      this.clues = [];
      const headers: Phaser.GameObjects.Text[] = [];
      let y = CLUE_AREA.y + 4;
      let previousDir = '';
      words.forEach((word, i) => {
        if (word.dir !== previousDir) {
          previousDir = word.dir;
          if (i > 0) y += 8;
          headers.push(
            this.add.text(CLUE_AREA.x + 18, y, word.dir === 'across' ? 'Vaakasuoraan →' : 'Pystysuoraan ↓', {
              fontFamily: FONTS.title,
              fontSize: `${size + 6}px`,
              color: CSS.orange,
            }),
          );
          y += size + 14;
        }
        const text = this.add.text(CLUE_AREA.x + 18, y, `${word.number}. ${word.clue} (${Array.from(word.answer).length})`, {
          ...TEXT.body,
          fontSize: `${size}px`,
          wordWrap: { width: CLUE_AREA.w - 40 },
          lineSpacing: 0,
        });
        this.clues.push({ text, word: i });
        y += text.height + 3;
      });
      if (y <= CLUE_AREA.y + CLUE_AREA.h + 6 || size === 14) break;
      for (const header of headers) header.destroy();
    }
  }

  private redraw(): void {
    const x = this.crossword;
    const current = x.currentWord();
    const currentCells = new Set(this.phase === 'playing' ? x.cellsOf(current) : []);
    for (const [key, view] of this.cells) {
      const solved = x.wordsAt(key).some((w) => x.solved.has(w));
      const fill = currentCells.has(key) ? WORD : solved ? SOLVED : PAPER;
      if (fill !== view.fill) {
        view.fill = fill;
        view.box.setFillStyle(fill);
      }
      const value = x.values.get(key) ?? '';
      if (this.phase === 'timeout' && !value) continue;
      if (value !== view.shown) {
        view.shown = value;
        view.letter.setText(value);
      }
      view.letter.setColor(x.revealed.has(key) ? REVEALED : INK);
    }
    this.cursorBox.setVisible(this.phase === 'playing').setPosition(this.gridX + (x.col + 0.5) * this.cell, this.gridY + (x.row + 0.5) * this.cell);

    const word = this.layout.words[current];
    this.clueText.setText(this.phase === 'playing' ? `${word.number} ${word.dir === 'across' ? '→' : '↓'}  ${word.clue}` : '');
    for (const clue of this.clues) {
      const solved = x.solved.has(clue.word);
      clue.text.setColor(solved ? CSS.green : CSS.bone).setAlpha(solved ? 0.7 : 1);
      if (clue.word === current && this.phase === 'playing') {
        this.clueBar.setPosition(CLUE_AREA.x + 10, clue.text.y - 2).setSize(CLUE_AREA.w - 20, clue.text.height + 4).setVisible(true);
      }
    }
    if (this.phase !== 'playing') this.clueBar.setVisible(false);
    this.wordsText.setText(`Sanoja ${x.solved.size}/${this.layout.words.length}`);
    this.refreshTime();
  }

  private refreshTime(): void {
    const left = Math.max(0, Math.ceil(this.crossword.secondsLeft));
    const text = `Aikaa ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    if (text === this.shownTime) return;
    this.shownTime = text;
    this.timeText.setText(text).setColor(left <= 60 ? CSS.red : CSS.orange);
  }

  private penaltyText(): void {
    const text = this.add.text(200, 34, '−5 s', { ...TEXT.bodyBold, fontSize: '26px', color: CSS.red }).setOrigin(0, 0.5);
    this.tweens.add({ targets: text, y: 64, alpha: 0, duration: 1100, onComplete: () => text.destroy() });
  }

  /** A short flash over the cells of a word. */
  private pulse(keys: string[], color: number): void {
    for (const key of keys) {
      const view = this.cells.get(key);
      if (!view) continue;
      const flash = this.add.rectangle(view.box.x, view.box.y, this.cell - 2, this.cell - 2, color, 0.75).setDepth(4);
      this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
    }
  }

  private banner(message: string, color: string): void {
    const text = this.add
      .text(GRID_AREA.x + GRID_AREA.w / 2, GRID_AREA.y + GRID_AREA.h / 2, message, {
        ...TEXT.title,
        fontSize: '52px',
        color,
        align: 'center',
        wordWrap: { width: GRID_AREA.w - 40 },
      })
      .setOrigin(0.5)
      .setDepth(10);
    text.setShadow(0, 3, '#000000', 8, true, true);
    text.setScale(0.7);
    this.tweens.add({ targets: text, scale: 1, duration: 400, ease: 'Back.Out' });
    if (this.phase === 'timeout') this.tweens.add({ targets: text, alpha: 0.15, delay: 2200, duration: 600 });
  }

  private showContentError(messages: string[]): void {
    this.add.rectangle(W / 2, H / 2, W, H, COLORS.night);
    this.add.text(W / 2, 120, 'Ristikon sanatiedostossa on virhe', { ...TEXT.heading, color: CSS.red }).setOrigin(0.5);
    this.add
      .text(W / 2, 190, [...messages, '', 'Korjaa tiedosto content/ristikko.txt. Pasi: Ctrl + Shift + K avaa korjaustilan.'].join('\n'), {
        ...TEXT.body,
        fontSize: '22px',
        align: 'center',
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5, 0);
  }
}
