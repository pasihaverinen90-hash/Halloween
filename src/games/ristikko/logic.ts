import { CONFIG } from '../../config';

/*
 * Crossword rules (CLAUDE.md, game 5; Pasi 20.10.) as pure functions. The
 * grid is built automatically from the word list (content/ristikko.txt), so
 * Pasi can change the words without touching anything else. The same list
 * always gives the same grid, so everyone plays the same crossword.
 */

const C = CONFIG.ristikko;

export type Direction = 'across' | 'down';

/** A word from the content file: the answer in capitals (A–Ö) and its clue. */
export interface CrosswordWord {
  answer: string;
  clue: string;
}

/** A word placed in the grid. */
export interface Placement {
  /** Position in the content file. */
  index: number;
  answer: string;
  clue: string;
  row: number;
  col: number;
  dir: Direction;
  /** Number shown in the first cell and in front of the clue. */
  number: number;
}

export interface Layout {
  rows: number;
  cols: number;
  /** Clue order: across words by number, then down words by number. */
  words: Placement[];
}

export const cellKey = (row: number, col: number): string => `${row},${col}`;

export function letters(word: string): string[] {
  return Array.from(word);
}

/** The cells of a placed word, first to last. */
export function wordCells(word: Pick<Placement, 'row' | 'col' | 'dir' | 'answer'>): Array<{ row: number; col: number }> {
  return letters(word.answer).map((_, i) => (word.dir === 'across' ? { row: word.row, col: word.col + i } : { row: word.row + i, col: word.col }));
}

/** Every cell of the grid with its correct letter. */
export function solutionCells(layout: Layout): Map<string, string> {
  const cells = new Map<string, string>();
  for (const word of layout.words) {
    letters(word.answer).forEach((letter, i) => {
      const { row, col } = wordCells(word)[i];
      cells.set(cellKey(row, col), letter);
    });
  }
  return cells;
}

export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Draft {
  letters: Map<string, string>;
  /** Directions of the words passing through each cell. */
  dirs: Map<string, Set<Direction>>;
  placed: Array<{ index: number; row: number; col: number; dir: Direction }>;
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
  crossings: number;
}

function step(dir: Direction): [number, number] {
  return dir === 'across' ? [0, 1] : [1, 0];
}

/**
 * Number of crossings if the word can be placed here, or -1 if not: no
 * clashing letters, no word running along another, and no letters touching
 * the word from the side except where words cross.
 */
function fit(draft: Draft, word: string[], row: number, col: number, dir: Direction, maxRows: number, maxCols: number): number {
  const [dr, dc] = step(dir);
  const [sr, sc] = [dc, dr]; // the sideways direction
  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);
  if (draft.placed.length > 0) {
    const height = Math.max(draft.maxRow, endRow) - Math.min(draft.minRow, row) + 1;
    const width = Math.max(draft.maxCol, endCol) - Math.min(draft.minCol, col) + 1;
    if (height > maxRows || width > maxCols) return -1;
  }
  if (draft.letters.has(cellKey(row - dr, col - dc)) || draft.letters.has(cellKey(endRow + dr, endCol + dc))) return -1;
  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const key = cellKey(r, c);
    const existing = draft.letters.get(key);
    if (existing !== undefined) {
      if (existing !== word[i] || draft.dirs.get(key)?.has(dir)) return -1;
      crossings += 1;
    } else if (draft.letters.has(cellKey(r + sr, c + sc)) || draft.letters.has(cellKey(r - sr, c - sc))) {
      return -1;
    }
  }
  return crossings;
}

function place(draft: Draft, index: number, word: string[], row: number, col: number, dir: Direction, crossings: number): void {
  const [dr, dc] = step(dir);
  for (let i = 0; i < word.length; i++) {
    const key = cellKey(row + dr * i, col + dc * i);
    draft.letters.set(key, word[i]);
    const dirs = draft.dirs.get(key) ?? new Set<Direction>();
    dirs.add(dir);
    draft.dirs.set(key, dirs);
  }
  draft.placed.push({ index, row, col, dir });
  draft.minRow = Math.min(draft.minRow, row);
  draft.maxRow = Math.max(draft.maxRow, row + dr * (word.length - 1));
  draft.minCol = Math.min(draft.minCol, col);
  draft.maxCol = Math.max(draft.maxCol, col + dc * (word.length - 1));
  draft.crossings += crossings;
}

interface Candidate {
  index: number;
  row: number;
  col: number;
  dir: Direction;
  crossings: number;
  score: number;
}

function cloneDraft(draft: Draft): Draft {
  return {
    ...draft,
    letters: new Map(draft.letters),
    dirs: new Map([...draft.dirs].map(([key, dirs]) => [key, new Set(dirs)])),
    placed: [...draft.placed],
  };
}

/** Every spot where the word crosses the grid, best first: many crossings, compact grid. */
function candidates(draft: Draft, index: number, word: string[], random: () => number, maxRows: number, maxCols: number): Candidate[] {
  const area = (draft.maxRow - draft.minRow + 1) * (draft.maxCol - draft.minCol + 1);
  const found: Candidate[] = [];
  const seen = new Set<string>();
  for (const [key, letter] of draft.letters) {
    const [r, c] = key.split(',').map(Number);
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== letter) continue;
      for (const dir of ['across', 'down'] as Direction[]) {
        const row = dir === 'down' ? r - i : r;
        const col = dir === 'across' ? c - i : c;
        const id = `${row},${col},${dir}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const crossings = fit(draft, word, row, col, dir, maxRows, maxCols);
        if (crossings < 1) continue;
        const height = Math.max(draft.maxRow, dir === 'down' ? row + word.length - 1 : row) - Math.min(draft.minRow, row) + 1;
        const width = Math.max(draft.maxCol, dir === 'across' ? col + word.length - 1 : col) - Math.min(draft.minCol, col) + 1;
        const score = crossings * 100 - (height * width - area) * 3 - ((width / maxCols) ** 4 + (height / maxRows) ** 4) * 150 + random() * 15;
        found.push({ index, row, col, dir, crossings, score });
      }
    }
  }
  return found.sort((a, b) => b.score - a.score);
}

/**
 * One search for a crossword. The word with the fewest possible spots goes
 * next, trying its best spots in turn; a dead end steps back. The budget
 * limits the work, so a hopeless word list gives up quickly.
 */
export function attempt(words: string[][], random: () => number, maxRows: number, maxCols: number, budget = 400): Draft | null {
  const start: Draft = { letters: new Map(), dirs: new Map(), placed: [], minRow: 0, maxRow: 0, minCol: 0, maxCol: 0, crossings: 0 };
  const byLength = words.map((w, i) => ({ i, key: w.length + random() * 3 })).sort((a, b) => b.key - a.key);
  place(start, byLength[0].i, words[byLength[0].i], 0, 0, random() < 0.6 ? 'across' : 'down', 0);
  let nodes = 0;
  const search = (draft: Draft, remaining: number[]): Draft | null => {
    if (remaining.length === 0) return draft;
    if (++nodes > budget) return null;
    let pick: { index: number; options: Candidate[] } | null = null;
    for (const index of remaining) {
      const options = candidates(draft, index, words[index], random, maxRows, maxCols);
      if (options.length === 0) return null;
      if (!pick || options.length < pick.options.length || (options.length === pick.options.length && words[index].length > words[pick.index].length)) {
        pick = { index, options };
      }
    }
    for (const option of pick!.options.slice(0, 3)) {
      const next = cloneDraft(draft);
      place(next, option.index, words[option.index], option.row, option.col, option.dir, option.crossings);
      const done = search(
        next,
        remaining.filter((i) => i !== option.index),
      );
      if (done) return done;
    }
    return null;
  };
  return search(start, byLength.slice(1).map((o) => o.i));
}

/**
 * Builds the crossword: a few searches with a fixed seed, keeping the one
 * with the most crossings and the tightest grid; if none succeeds, a few
 * longer searches. Null if the words cannot be made into a connected
 * crossword that fits the screen (the content check reports it).
 */
export function buildLayout(words: CrosswordWord[]): Layout | null {
  const random = seededRandom(20261031);
  const split = words.map((w) => letters(w.answer));
  let best: { draft: Draft; score: number } | null = null;
  for (const [tries, budget] of [
    [8, 400],
    [6, 3000],
  ]) {
    for (let t = 0; t < tries; t++) {
      const draft = attempt(split, random, C.maxRows, C.maxCols, budget);
      if (!draft) continue;
      const height = draft.maxRow - draft.minRow + 1;
      const width = draft.maxCol - draft.minCol + 1;
      const score = draft.crossings * 30 - height * width * 0.5;
      if (!best || score > best.score) best = { draft, score };
    }
    if (best) break;
  }
  if (!best) return null;
  const { draft } = best;
  const placed = draft.placed.map((p) => ({ ...p, row: p.row - draft.minRow, col: p.col - draft.minCol }));
  // Numbers go to the start cells in reading order, as in a printed crossword.
  const starts = [...new Set(placed.map((p) => cellKey(p.row, p.col)))]
    .map((key) => key.split(',').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([r, c]) => cellKey(r, c));
  const numbered: Placement[] = placed.map((p) => ({
    index: p.index,
    answer: words[p.index].answer,
    clue: words[p.index].clue,
    row: p.row,
    col: p.col,
    dir: p.dir,
    number: starts.indexOf(cellKey(p.row, p.col)) + 1,
  }));
  numbered.sort((a, b) => (a.dir === b.dir ? a.number - b.number : a.dir === 'across' ? -1 : 1));
  return { rows: draft.maxRow - draft.minRow + 1, cols: draft.maxCol - draft.minCol + 1, words: numbered };
}

/**
 * Points (CLAUDE.md, Pasi 20.10.): correct words as a share of all of them
 * (600; a word revealed completely does not count) and the remaining time
 * (400): full time points when solved within 3 minutes, then evenly down to
 * 0 at the end of the time.
 */
export function crosswordPoints(countedWords: number, totalWords: number, secondsLeft: number): number {
  const words = Math.floor((C.wordPoints * Math.min(countedWords, totalWords)) / Math.max(1, totalWords));
  const fullFrom = C.seconds - C.fullTimePointsWithinSeconds;
  const time = Math.floor(C.timePoints * Math.min(1, Math.max(0, secondsLeft) / fullFrom));
  return Math.min(CONFIG.maxScore, words + time);
}
