import Phaser from 'phaser';
import { CONFIG } from '../../config';
import type { HirsipuuWord } from '../../content/hirsipuu';
import { addKeyHints, type KeyHintBar } from '../../ui/hints';
import { onChar, onKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { H, W } from '../../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../../ui/theme';
import { drawPanel, paintPanel } from '../../ui/widgets/panel';
import type { GameContext, GameSceneData } from '../types';
import { BACKGROUND, GALLOWS, GALLOWS_BOX, NOOSE, PART_LAYOUT, SKELETON_PARTS } from './assets';
import { HIRSIPUU_CONTENT } from './content';
import {
  ALPHABET,
  HIRSIPUU_LAYOUT,
  guess,
  isFailed,
  isOver,
  isSolved,
  newWord,
  restoreRound,
  revealed,
  roundTotal,
  serializeRound,
  wordPoints,
  wrapPhrase,
  type RoundState,
  type WordState,
} from './logic';

const RIGHT_CX = 884;
const CELL_W = 46;
const CELL_GAP = 6;
const LINE_H = 78;
const KEY_W = 50;
const KEY_H = 40;
const KEY_GAP = 6;
const KEY_ROWS = [10, 10, 9];

const fi = (n: number): string => n.toLocaleString('fi-FI');

interface Cell {
  char: string;
  letter: boolean;
  text: Phaser.GameObjects.Text;
  line: Phaser.GameObjects.Rectangle | null;
}

interface BoardKey {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  strike: Phaser.GameObjects.Rectangle;
}

/** Hangman: five words with hints, eight wrong letters fail a word. Plays one round. */
export class HirsipuuScene extends Phaser.Scene {
  private ctx!: GameContext;
  private words: HirsipuuWord[] = [];
  private round: RoundState = { index: 0, scores: [], current: null };
  private phase: 'guessing' | 'wordDone' | 'finished' = 'guessing';

  private skeleton!: Phaser.GameObjects.Container;
  private parts: Phaser.GameObjects.Image[] = [];
  private cells: Cell[] = [];
  private wordLayer!: Phaser.GameObjects.Container;
  private keys = new Map<string, BoardKey>();
  private pips: Phaser.GameObjects.Arc[] = [];
  private progressText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private wrongText!: Phaser.GameObjects.Text;
  private valueText!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Container;
  private hints!: KeyHintBar;

  constructor() {
    super('Hirsipuu');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.words = HIRSIPUU_CONTENT.ok ? HIRSIPUU_CONTENT.words : [];
    this.phase = 'guessing';
    this.parts = [];
    this.cells = [];
    this.keys = new Map();
    this.pips = [];
  }

  create(): void {
    if (!HIRSIPUU_CONTENT.ok) {
      this.showContentError(HIRSIPUU_CONTENT.errors.map((e) => e.message));
      return;
    }
    const phrases = this.words.map((w) => w.phrase);
    const restored = restoreRound(this.ctx.checkpoint.initial, phrases);
    this.round = restored ?? { index: 0, scores: [], current: null };
    if (this.round.index >= this.words.length) {
      // Every word was finished before an interruption: report the result right away.
      this.phase = 'finished';
      this.ctx.finish(roundTotal(this.round.scores));
      return;
    }
    if (!this.round.current) this.round.current = newWord(phrases[this.round.index]);

    addAsset(this, BACKGROUND, W / 2, H / 2, { fit: 'cover' });
    addAsset(this, GALLOWS, GALLOWS_BOX.x + GALLOWS_BOX.width / 2, GALLOWS_BOX.y + GALLOWS_BOX.height / 2);
    this.buildSkeleton();
    this.buildHeader();
    this.wordLayer = this.add.container(0, 0);
    this.buildCounter();
    this.buildBoard();
    this.banner = this.add.container(RIGHT_CX, 562).setDepth(10).setVisible(false);
    this.hints = addKeyHints(this, []);

    this.showWord(false);
    onChar(this, (char) => this.onLetter(char));
    onKeys(this, { Enter: () => this.onEnter() });
  }

  getTestState(): unknown {
    const current = this.round.current;
    return {
      index: this.round.index,
      phrase: current?.phrase ?? null,
      hint: this.words[this.round.index]?.hint ?? null,
      tried: current?.tried ?? [],
      wrong: current?.wrong ?? [],
      scores: [...this.round.scores],
      total: this.displayTotal(),
      phase: this.phase,
    };
  }

  // ---------------------------------------------------------------- building

  private buildSkeleton(): void {
    this.skeleton = this.add.container(NOOSE.x, NOOSE.y);
    // Draw order: spine behind the ribs, limbs behind the body.
    const order = [1, 4, 5, 6, 7, 3, 2, 0];
    const images: Phaser.GameObjects.Image[] = [];
    SKELETON_PARTS.forEach((spec, i) => {
      const layout = PART_LAYOUT[i];
      images[i] = addAsset(this, spec, layout.dx, layout.dy, { width: layout.width, height: layout.height }).setVisible(false);
    });
    for (const i of order) this.skeleton.add(images[i]);
    this.parts = images;
  }

  private buildHeader(): void {
    const left = 540;
    const right = 1236;
    this.progressText = this.add.text(left, 52, '', { ...TEXT.heading, fontSize: '34px', color: CSS.muted }).setOrigin(0, 0.5);
    this.scoreText = this.add
      .text(right, 52, '', { ...TEXT.bodyBold, fontSize: '30px', color: CSS.orange })
      .setOrigin(1, 0.5);
    drawPanel(this, left, 88, right - left, 104, { radius: 16, alpha: 0.88 });
    this.add.text(left + 22, 100, 'Vihje', { ...TEXT.small, fontSize: '18px' });
    this.hintText = this.add
      .text(RIGHT_CX, 150, '', { ...TEXT.hand, fontSize: '34px', align: 'center', wordWrap: { width: right - left - 60 } })
      .setOrigin(0.5);
  }

  private buildCounter(): void {
    const y = 452;
    this.wrongText = this.add.text(540, y, '', { ...TEXT.bodyBold, fontSize: '24px' }).setOrigin(0, 0.5);
    const max = CONFIG.hirsipuu.maxWrongLetters;
    for (let i = 0; i < max; i++) {
      this.pips.push(this.add.circle(800 + i * 26, y, 9, COLORS.panelLight).setStrokeStyle(2, COLORS.border));
    }
    this.valueText = this.add.text(1236, y, '', { ...TEXT.bodyBold, fontSize: '24px', color: CSS.muted }).setOrigin(1, 0.5);
  }

  private buildBoard(): void {
    let index = 0;
    KEY_ROWS.forEach((count, row) => {
      const rowWidth = count * KEY_W + (count - 1) * KEY_GAP;
      const y = 506 + row * (KEY_H + KEY_GAP);
      for (let col = 0; col < count; col++) {
        const letter = ALPHABET[index++];
        const x = RIGHT_CX - rowWidth / 2 + col * (KEY_W + KEY_GAP);
        const bg = this.add.graphics({ x, y: y - KEY_H / 2 });
        const label = this.add
          .text(x + KEY_W / 2, y, letter, { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '22px', color: CSS.bone })
          .setOrigin(0.5);
        const strike = this.add.rectangle(x + KEY_W / 2, y, KEY_W - 14, 3, COLORS.red).setVisible(false);
        this.keys.set(letter, { bg, label, strike });
      }
    });
  }

  // ---------------------------------------------------------------- showing

  private get current(): WordState {
    return this.round.current as WordState;
  }

  private displayTotal(): number {
    const current = this.round.current;
    const pending = current && isOver(current) ? wordPoints(current) : 0;
    return roundTotal(this.round.scores) + pending;
  }

  /** Build the letter cells for the current word and refresh everything. */
  private showWord(animate: boolean): void {
    const word = this.current;
    // Stop letter animations before their texts are destroyed.
    this.tweens.killTweensOf(this.cells.map((cell) => cell.text));
    this.wordLayer.removeAll(true);
    this.cells = [];
    const lines = wrapPhrase(word.phrase, HIRSIPUU_LAYOUT.maxLineChars);
    const firstY = 320 - ((lines.length - 1) * LINE_H) / 2;
    lines.forEach((line, row) => {
      const chars = Array.from(line);
      const width = chars.length * CELL_W + (chars.length - 1) * CELL_GAP;
      chars.forEach((char, col) => {
        const x = RIGHT_CX - width / 2 + col * (CELL_W + CELL_GAP) + CELL_W / 2;
        const y = firstY + row * LINE_H;
        const letter = ALPHABET.includes(char);
        const underline = letter ? this.add.rectangle(x, y + 30, CELL_W - 6, 4, COLORS.bone, 0.9) : null;
        const text = this.add
          .text(x, y, letter ? '' : char, { fontFamily: FONTS.hand, fontSize: '52px', color: CSS.bone })
          .setOrigin(0.5);
        if (underline) this.wordLayer.add(underline);
        this.wordLayer.add(text);
        this.cells.push({ char, letter, text, line: underline });
      });
    });
    if (animate) {
      this.wordLayer.setAlpha(0);
      this.tweens.add({ targets: this.wordLayer, alpha: 1, duration: 250 });
    }
    this.hintText.setText(this.words[this.round.index].hint);
    this.parts.forEach((part, i) => part.setVisible(i < word.wrong.length).setAlpha(1).setY(PART_LAYOUT[i].dy));
    this.skeleton.setRotation(0);
    this.refreshCells(null);
    this.refresh();
    if (isOver(word)) this.wordFinished(false);
    else this.setPhaseGuessing();
  }

  private refreshCells(justRevealed: string | null): void {
    const shown = revealed(this.current);
    const failed = isFailed(this.current);
    // revealed() walks the phrase including the spaces that became line breaks; skip those.
    const visible = shown.filter((c, i) => !(c.char === ' ' && this.isBreak(i)));
    visible.forEach((info, i) => {
      const cell = this.cells[i];
      if (!cell || !cell.letter) return;
      if (info.shown) {
        if (cell.text.text !== cell.char) {
          cell.text.setText(cell.char).setColor(CSS.bone);
          if (justRevealed === cell.char) {
            cell.text.setScale(1.5).setColor(CSS.green);
            this.tweens.add({
              targets: cell.text,
              scale: 1,
              duration: 260,
              ease: 'Back.Out',
              onComplete: () => {
                if (cell.text.active) cell.text.setColor(CSS.bone);
              },
            });
          }
        }
      } else if (failed) {
        cell.text.setText(cell.char).setColor(CSS.red);
      }
    });
  }

  /** True when the space at this phrase index was turned into a line break by wrapPhrase. */
  private isBreak(index: number): boolean {
    const lines = wrapPhrase(this.current.phrase, HIRSIPUU_LAYOUT.maxLineChars);
    let pos = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      pos += Array.from(lines[i]).length;
      if (pos === index) return true;
      pos += 1;
    }
    return false;
  }

  private refresh(): void {
    const word = this.current;
    const max = CONFIG.hirsipuu.maxWrongLetters;
    this.progressText.setText(`Sana ${this.round.index + 1}/${this.words.length}`);
    this.scoreText.setText(`Pisteet: ${fi(this.displayTotal())}`);
    this.wrongText.setText(`Väärät kirjaimet: ${word.wrong.length}/${max}`);
    this.wrongText.setColor(word.wrong.length >= max - 2 ? CSS.red : CSS.bone);
    this.pips.forEach((pip, i) => {
      const used = i < word.wrong.length;
      pip.setFillStyle(used ? COLORS.red : COLORS.panelLight).setStrokeStyle(2, used ? 0xff9a9d : COLORS.border);
    });
    this.valueText.setText(isOver(word) ? '' : `Sanan arvo: ${fi(wordPoints(word))} p`);
    for (const [letter, key] of this.keys) {
      const tried = word.tried.includes(letter);
      const wrong = word.wrong.includes(letter);
      paintPanel(key.bg, KEY_W, KEY_H, {
        fill: !tried ? COLORS.panel : wrong ? 0x3a1420 : 0x1f3a1c,
        border: !tried ? COLORS.border : wrong ? COLORS.red : COLORS.green,
        radius: 8,
        alpha: 0.95,
      });
      key.label.setColor(!tried ? CSS.bone : wrong ? CSS.red : CSS.green).setAlpha(tried && wrong ? 0.8 : 1);
      key.strike.setVisible(wrong);
    }
  }

  private setPhaseGuessing(): void {
    this.phase = 'guessing';
    this.banner.setVisible(false);
    this.hints.setHints([
      ['A–Ö', 'Arvaa kirjain'],
      ['Esc', 'Tauko'],
    ]);
  }

  // ---------------------------------------------------------------- input

  private onLetter(char: string): void {
    if (this.phase !== 'guessing') return;
    const { state, outcome } = guess(this.current, char);
    if (outcome === 'ignored') return;
    if (outcome === 'repeat') {
      this.ctx.sfx.play('move');
      this.flashKey(char.toLocaleUpperCase('fi-FI'));
      return;
    }
    this.round.current = state;
    const letter = state.tried[state.tried.length - 1];
    if (outcome === 'correct') {
      this.ctx.sfx.play('correct');
      this.refreshCells(letter);
    } else {
      this.ctx.sfx.play('wrong');
      this.showPart(state.wrong.length - 1);
    }
    this.refresh();
    this.save();
    if (isOver(state)) this.wordFinished(true);
  }

  private onEnter(): boolean {
    if (this.phase !== 'wordDone') return false;
    this.ctx.sfx.play('select');
    this.round.scores.push(wordPoints(this.current));
    this.round.index += 1;
    if (this.round.index >= this.words.length) {
      this.phase = 'finished';
      this.round.current = null;
      this.save();
      this.ctx.finish(roundTotal(this.round.scores));
      return true;
    }
    this.round.current = newWord(this.words[this.round.index].phrase);
    this.save();
    this.showWord(true);
    return true;
  }

  private save(): void {
    this.ctx.checkpoint.save(serializeRound(this.round));
  }

  // ---------------------------------------------------------------- effects

  private showPart(index: number): void {
    const part = this.parts[index];
    if (!part) return;
    const y = PART_LAYOUT[index].dy;
    part.setVisible(true).setAlpha(0).setY(y - 26);
    this.tweens.add({ targets: part, alpha: 1, y, duration: 280, ease: 'Bounce.Out' });
    this.cameras.main.shake(140, 0.003);
  }

  private flashKey(letter: string): void {
    const key = this.keys.get(letter);
    if (!key) return;
    this.tweens.add({ targets: key.label, scale: { from: 1.35, to: 1 }, duration: 220, ease: 'Sine.Out' });
  }

  private wordFinished(animate: boolean): void {
    const word = this.current;
    const solved = isSolved(word);
    this.phase = 'wordDone';
    if (animate) this.ctx.sfx.play(solved ? 'success' : 'fail');
    this.refreshCells(null);
    this.refresh();

    this.banner.removeAll(true);
    const panel = this.add.graphics({ x: -330, y: -78 });
    paintPanel(panel, 660, 156, {
      fill: solved ? 0x1d3320 : 0x3a1420,
      border: solved ? COLORS.green : COLORS.red,
      borderWidth: 3,
      radius: 18,
      glow: solved ? COLORS.green : COLORS.red,
      alpha: 1,
    });
    const headline = solved ? `Ratkaistu! +${fi(wordPoints(word))} pistettä` : 'Sana jäi ratkaisematta – 0 pistettä';
    const title = this.add
      .text(0, -26, headline, { ...TEXT.heading, fontSize: '40px', color: solved ? CSS.green : CSS.red })
      .setOrigin(0.5);
    const last = this.round.index + 1 >= this.words.length;
    const sub = this.add
      .text(0, 34, last ? 'Paina Enter, niin näet tuloksen.' : 'Paina Enter, niin siirryt seuraavaan sanaan.', { ...TEXT.body, fontSize: '24px' })
      .setOrigin(0.5);
    this.banner.add([panel, title, sub]).setVisible(true);
    if (animate) {
      this.banner.setScale(0.9).setAlpha(0);
      this.tweens.add({ targets: this.banner, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    }
    if (!solved && animate) {
      this.tweens.add({ targets: this.skeleton, rotation: { from: -0.06, to: 0.06 }, duration: 900, yoyo: true, repeat: 1, ease: 'Sine.InOut', onComplete: () => this.skeleton.setRotation(0) });
    }
    this.hints.setHints([
      ['Enter', last ? 'Katso tulos' : 'Seuraava sana'],
      ['Esc', 'Tauko'],
    ]);
  }

  private showContentError(messages: string[]): void {
    this.add.rectangle(W / 2, H / 2, W, H, COLORS.night);
    this.add.text(W / 2, 120, 'Hirsipuun sanatiedostossa on virhe', { ...TEXT.heading, color: CSS.red }).setOrigin(0.5);
    this.add
      .text(W / 2, 190, [...messages, '', 'Korjaa tiedosto content/hirsipuu.txt. Pasi: Ctrl + Shift + K avaa korjaustilan.'].join('\n'), {
        ...TEXT.body,
        fontSize: '22px',
        align: 'center',
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5, 0);
  }
}
