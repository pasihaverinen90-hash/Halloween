import { CONFIG } from '../../config';
import { cellKey, crosswordPoints, solutionCells, wordCells, type Direction, type Layout } from './logic';

/*
 * The state of one crossword round and everything the player can do to it,
 * without any drawing (CLAUDE.md, game 5; Pasi 20.10.):
 *  - typing fills the cell under the cursor and moves on in the word;
 *  - when every cell of a word is filled it is checked: a correct word locks,
 *    a wrong one loses its wrong unlocked letters and costs 5 seconds;
 *  - revealing a letter costs 5 seconds; a word revealed completely gives no
 *    word points;
 *  - after a solved word the cursor jumps to the next unsolved word.
 * Operations return events, so the scene can animate them.
 */

const C = CONFIG.ristikko;

export type Arrow = 'left' | 'right' | 'up' | 'down';

export type CrosswordEvent =
  | { type: 'typed'; key: string }
  | { type: 'erased'; key: string }
  | { type: 'revealed'; key: string }
  | { type: 'solved'; word: number }
  | { type: 'wrong'; word: number; cleared: string[] }
  | { type: 'locked'; key: string };

/** What is saved after every change, so an interrupted round continues where it was. */
export interface CrosswordSnapshot {
  version: 1;
  values: Record<string, string>;
  typed: string[];
  revealed: string[];
  solved: number[];
  secondsLeft: number;
  row: number;
  col: number;
  dir: Direction;
}

export class Crossword {
  readonly solution: Map<string, string>;
  readonly values = new Map<string, string>();
  /** Cells whose letter the player typed (and that are still there). */
  readonly typed = new Set<string>();
  readonly revealed = new Set<string>();
  /** Solved words as indices into layout.words. */
  readonly solved = new Set<number>();
  row = 0;
  col = 0;
  dir: Direction = 'across';
  secondsLeft: number = C.seconds;
  /** Words passing through each cell. */
  private readonly byCell = new Map<string, number[]>();

  constructor(readonly layout: Layout) {
    this.solution = solutionCells(layout);
    layout.words.forEach((word, i) => {
      for (const cell of wordCells(word)) {
        const key = cellKey(cell.row, cell.col);
        this.byCell.set(key, [...(this.byCell.get(key) ?? []), i]);
      }
    });
    const first = layout.words[0];
    this.row = first.row;
    this.col = first.col;
    this.dir = first.dir;
  }

  // ---------------------------------------------------------------- reading

  get key(): string {
    return cellKey(this.row, this.col);
  }

  has(row: number, col: number): boolean {
    return this.solution.has(cellKey(row, col));
  }

  /** Words through a cell (indices into layout.words). */
  wordsAt(key: string): number[] {
    return this.byCell.get(key) ?? [];
  }

  /** The word under the cursor in the current direction. */
  currentWord(): number {
    const words = this.wordsAt(this.key);
    return words.find((i) => this.layout.words[i].dir === this.dir) ?? words[0];
  }

  cellsOf(word: number): string[] {
    return wordCells(this.layout.words[word]).map((c) => cellKey(c.row, c.col));
  }

  /** A cell cannot change once it is revealed or part of a solved word. */
  locked(key: string): boolean {
    return this.revealed.has(key) || this.wordsAt(key).some((w) => this.solved.has(w));
  }

  allSolved(): boolean {
    return this.solved.size === this.layout.words.length;
  }

  /** Solved words that count for points: not every letter was revealed. */
  counted(): number {
    return [...this.solved].filter((w) => this.cellsOf(w).some((key) => !this.revealed.has(key))).length;
  }

  points(): number {
    return crosswordPoints(this.counted(), this.layout.words.length, this.allSolved() ? this.secondsLeft : 0);
  }

  // ---------------------------------------------------------------- moving

  /** Arrows: an arrow across the current direction first turns, then moves; gaps are skipped. */
  move(arrow: Arrow): void {
    const dir: Direction = arrow === 'left' || arrow === 'right' ? 'across' : 'down';
    if (dir !== this.dir && this.wordsAt(this.key).some((w) => this.layout.words[w].dir === dir)) {
      this.dir = dir;
      return;
    }
    const [dr, dc] = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] }[arrow];
    for (let r = this.row + dr, c = this.col + dc; r >= 0 && c >= 0 && r < this.layout.rows && c < this.layout.cols; r += dr, c += dc) {
      if (this.has(r, c)) {
        this.goTo(r, c, dir);
        return;
      }
    }
  }

  /** Space: turn between across and down where two words cross. */
  toggle(): boolean {
    const other: Direction = this.dir === 'across' ? 'down' : 'across';
    if (!this.wordsAt(this.key).some((w) => this.layout.words[w].dir === other)) return false;
    this.dir = other;
    return true;
  }

  /** Mouse: choose a cell; choosing the same cell again turns the direction. */
  select(row: number, col: number): void {
    if (!this.has(row, col)) return;
    if (row === this.row && col === this.col) {
      this.toggle();
      return;
    }
    this.goTo(row, col, this.dir);
  }

  /** Mouse or jump: go to a word, at its first cell that is still open. */
  selectWord(word: number): void {
    const keys = this.cellsOf(word);
    const target = keys.find((key) => !this.locked(key) && !this.values.has(key)) ?? keys.find((key) => !this.locked(key)) ?? keys[0];
    const [row, col] = target.split(',').map(Number);
    this.row = row;
    this.col = col;
    this.dir = this.layout.words[word].dir;
  }

  private goTo(row: number, col: number, prefer: Direction): void {
    this.row = row;
    this.col = col;
    const words = this.wordsAt(this.key);
    if (!words.some((w) => this.layout.words[w].dir === prefer)) this.dir = this.layout.words[words[0]].dir;
    else this.dir = prefer;
  }

  /** Next cell of the current word that is not locked, after (or before) the cursor. */
  private nextOpen(word: number, from: string, step: 1 | -1): string | null {
    const keys = this.cellsOf(word);
    for (let i = keys.indexOf(from) + step; i >= 0 && i < keys.length; i += step) if (!this.locked(keys[i])) return keys[i];
    return null;
  }

  private moveTo(key: string): void {
    const [row, col] = key.split(',').map(Number);
    this.row = row;
    this.col = col;
  }

  // ---------------------------------------------------------------- changing

  /** Types a letter A–Ö into the cursor cell (or the next open cell of the word) and moves on. */
  type(letter: string): CrosswordEvent[] {
    const word = this.currentWord();
    const target = this.locked(this.key) ? this.nextOpen(word, this.key, 1) : this.key;
    if (!target) return [{ type: 'locked', key: this.key }];
    this.values.set(target, letter);
    this.typed.add(target);
    const events: CrosswordEvent[] = [{ type: 'typed', key: target }, ...this.checkWordsAt(target)];
    if (this.solved.has(word)) {
      this.jumpToNextWord(word);
    } else {
      const wrong = events.find((e) => e.type === 'wrong' && e.word === word);
      if (wrong && wrong.type === 'wrong' && wrong.cleared.length > 0) this.moveTo(this.cellsOf(word).find((k) => wrong.cleared.includes(k))!);
      else this.moveTo(this.nextOpen(word, target, 1) ?? target);
    }
    return events;
  }

  /** Backspace: clears the cursor cell, or steps back and clears that one. */
  backspace(): CrosswordEvent[] {
    if (!this.locked(this.key) && this.values.has(this.key)) return this.clear(this.key);
    const previous = this.nextOpen(this.currentWord(), this.key, -1);
    if (!previous) return [];
    this.moveTo(previous);
    return this.values.has(previous) ? this.clear(previous) : [];
  }

  /** Delete: clears the cursor cell. */
  erase(): CrosswordEvent[] {
    return !this.locked(this.key) && this.values.has(this.key) ? this.clear(this.key) : [];
  }

  private clear(key: string): CrosswordEvent[] {
    this.values.delete(key);
    this.typed.delete(key);
    return [{ type: 'erased', key }];
  }

  /** Reveals the correct letter of the cursor cell; costs time. */
  reveal(): CrosswordEvent[] {
    const key = this.key;
    if (this.locked(key)) return [{ type: 'locked', key }];
    this.values.set(key, this.solution.get(key)!);
    this.typed.delete(key);
    this.revealed.add(key);
    this.penalty(C.revealPenaltySeconds);
    const word = this.currentWord();
    const events: CrosswordEvent[] = [{ type: 'revealed', key }, ...this.checkWordsAt(key)];
    if (this.solved.has(word)) this.jumpToNextWord(word);
    else this.moveTo(this.nextOpen(word, key, 1) ?? key);
    return events;
  }

  /** Real time passing (seconds). */
  tick(seconds: number): void {
    this.secondsLeft = Math.max(0, this.secondsLeft - Math.max(0, seconds));
  }

  private penalty(seconds: number): void {
    this.secondsLeft = Math.max(0, this.secondsLeft - seconds);
  }

  /** Checks every word through the cell that has just become full. */
  private checkWordsAt(key: string): CrosswordEvent[] {
    const events: CrosswordEvent[] = [];
    for (const word of this.wordsAt(key)) {
      if (this.solved.has(word)) continue;
      const keys = this.cellsOf(word);
      if (!keys.every((k) => this.values.has(k))) continue;
      if (keys.every((k) => this.values.get(k) === this.solution.get(k))) {
        this.solved.add(word);
        events.push({ type: 'solved', word });
      } else {
        const cleared = keys.filter((k) => !this.locked(k) && this.values.get(k) !== this.solution.get(k));
        for (const k of cleared) this.clear(k);
        this.penalty(C.wrongWordPenaltySeconds);
        events.push({ type: 'wrong', word, cleared });
      }
    }
    return events;
  }

  /** After a solved word: the next unsolved word in clue order. */
  private jumpToNextWord(from: number): void {
    const total = this.layout.words.length;
    for (let step = 1; step <= total; step++) {
      const word = (from + step) % total;
      if (!this.solved.has(word)) {
        this.selectWord(word);
        return;
      }
    }
  }

  // ---------------------------------------------------------------- saving

  snapshot(): CrosswordSnapshot {
    return {
      version: 1,
      values: Object.fromEntries(this.values),
      typed: [...this.typed],
      revealed: [...this.revealed],
      solved: [...this.solved],
      secondsLeft: Math.round(this.secondsLeft * 10) / 10,
      row: this.row,
      col: this.col,
      dir: this.dir,
    };
  }

  /** Continues a saved round. Anything that does not match this crossword is ignored. */
  restore(raw: unknown): boolean {
    if (!raw || typeof raw !== 'object') return false;
    const s = raw as Partial<CrosswordSnapshot>;
    if (s.version !== 1 || typeof s.secondsLeft !== 'number' || !s.values || typeof s.values !== 'object') return false;
    for (const [key, value] of Object.entries(s.values)) {
      if (this.solution.has(key) && typeof value === 'string' && /^[A-ZÅÄÖ]$/.test(value)) this.values.set(key, value);
    }
    for (const key of Array.isArray(s.typed) ? s.typed : []) if (this.values.has(key)) this.typed.add(key);
    for (const key of Array.isArray(s.revealed) ? s.revealed : []) if (this.values.get(key) === this.solution.get(key)) this.revealed.add(key);
    for (const word of Array.isArray(s.solved) ? s.solved : []) {
      if (typeof word === 'number' && this.layout.words[word] && this.cellsOf(word).every((k) => this.values.get(k) === this.solution.get(k))) this.solved.add(word);
    }
    this.secondsLeft = Math.max(0, Math.min(C.seconds, s.secondsLeft));
    if (typeof s.row === 'number' && typeof s.col === 'number' && this.has(s.row, s.col)) {
      this.row = s.row;
      this.col = s.col;
      this.dir = s.dir === 'down' ? 'down' : 'across';
      if (!this.wordsAt(this.key).some((w) => this.layout.words[w].dir === this.dir)) this.toggle();
    }
    return true;
  }
}
