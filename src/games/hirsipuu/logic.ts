import { CONFIG } from '../../config';

/*
 * Hangman rules (CLAUDE.md, game 1) as pure functions. No Phaser: used by the
 * scene, the content check and unit tests.
 */

/** Room for the phrase on screen: letters per line and lines. The content check enforces it. */
export const HIRSIPUU_LAYOUT = { maxLineChars: 14, maxLines: 3 } as const;

/** Letters that can be guessed: A–Z plus Å, Ä, Ö. */
export const ALPHABET: readonly string[] = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'];

const ALPHABET_SET: ReadonlySet<string> = new Set(ALPHABET);

/** A key press as a guessable letter ('ä' → 'Ä'), or null for anything else. */
export function toLetter(key: string): string | null {
  if (typeof key !== 'string' || Array.from(key).length !== 1) return null;
  const upper = key.toLocaleUpperCase('fi-FI');
  return ALPHABET_SET.has(upper) ? upper : null;
}

export function isLetter(ch: string): boolean {
  return ALPHABET_SET.has(ch);
}

/** Break a phrase into lines at spaces (greedy). A word longer than a line stays on its own line. */
export function wrapPhrase(phrase: string, maxLineChars: number): string[] {
  const words = phrase.split(' ').filter((word) => word.length > 0);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line === '') line = word;
    else if (Array.from(line).length + 1 + Array.from(word).length <= maxLineChars) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

/** One word or phrase being guessed. */
export interface WordState {
  phrase: string;
  /** Every distinct letter guessed, in order. */
  tried: string[];
  /** The wrong ones, in order. */
  wrong: string[];
}

/** repeat = already tried: no effect and no penalty (Pasi's decision). ignored = not a letter or the word is over. */
export type GuessOutcome = 'correct' | 'wrong' | 'repeat' | 'ignored';

export function newWord(phrase: string): WordState {
  return { phrase, tried: [], wrong: [] };
}

function lettersOf(phrase: string): Set<string> {
  return new Set(Array.from(phrase).filter(isLetter));
}

export function isSolved(state: WordState): boolean {
  for (const letter of lettersOf(state.phrase)) if (!state.tried.includes(letter)) return false;
  return true;
}

export function isFailed(state: WordState): boolean {
  return state.wrong.length >= CONFIG.hirsipuu.maxWrongLetters;
}

export function isOver(state: WordState): boolean {
  return isSolved(state) || isFailed(state);
}

/** Guess a letter. Returns a new state; the old one is not changed. */
export function guess(state: WordState, key: string): { state: WordState; outcome: GuessOutcome } {
  const letter = toLetter(key);
  if (letter === null || isOver(state)) return { state, outcome: 'ignored' };
  if (state.tried.includes(letter)) return { state, outcome: 'repeat' };
  const hit = lettersOf(state.phrase).has(letter);
  return {
    state: {
      phrase: state.phrase,
      tried: [...state.tried, letter],
      wrong: hit ? state.wrong : [...state.wrong, letter],
    },
    outcome: hit ? 'correct' : 'wrong',
  };
}

/** 200 − 25 per wrong letter; a failed word gives 0. While guessing: what the word is still worth. */
export function wordPoints(state: WordState): number {
  if (isFailed(state)) return 0;
  const { pointsPerWord, penaltyPerWrongLetter } = CONFIG.hirsipuu;
  return Math.max(0, pointsPerWord - penaltyPerWrongLetter * state.wrong.length);
}

/** Every character of the phrase; spaces and punctuation are always shown. */
export function revealed(state: WordState): Array<{ char: string; letter: boolean; shown: boolean }> {
  return Array.from(state.phrase).map((char) => {
    const letter = isLetter(char);
    return { char, letter, shown: !letter || state.tried.includes(char) };
  });
}

/** The whole round: which word is being guessed and the points of the finished words. */
export interface RoundState {
  /** Index of the current word (0..words-1). */
  index: number;
  /** Points of the words finished so far, one per word. */
  scores: number[];
  /** The current word, or null before it starts. */
  current: WordState | null;
}

export function roundTotal(scores: readonly number[]): number {
  return scores.reduce((sum, value) => sum + value, 0);
}

/** Snapshot for GameContext.checkpoint. */
export function serializeRound(state: RoundState): unknown {
  return {
    v: 1,
    index: state.index,
    scores: [...state.scores],
    current: state.current ? { phrase: state.current.phrase, tried: [...state.current.tried] } : null,
  };
}

/**
 * Rebuild a round from a checkpoint. Returns null if the snapshot does not
 * match the current words (e.g. Pasi changed the content), so the round
 * starts over instead of resuming nonsense.
 */
export function restoreRound(raw: unknown, words: readonly string[]): RoundState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as { v?: unknown; index?: unknown; scores?: unknown; current?: unknown };
  if (data.v !== 1) return null;
  const index = data.index;
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index > words.length) return null;
  if (!Array.isArray(data.scores) || data.scores.length !== index) return null;
  const max = CONFIG.hirsipuu.pointsPerWord;
  if (!data.scores.every((s) => typeof s === 'number' && Number.isInteger(s) && s >= 0 && s <= max)) return null;
  const scores = data.scores as number[];
  if (index === words.length) return data.current === null ? { index, scores, current: null } : null;

  if (data.current === null) return { index, scores, current: null };
  const current = data.current as { phrase?: unknown; tried?: unknown };
  if (current.phrase !== words[index] || !Array.isArray(current.tried)) return null;
  let state = newWord(words[index]);
  for (const letter of current.tried) {
    if (typeof letter !== 'string') return null;
    const result = guess(state, letter);
    if (result.outcome === 'ignored' || result.outcome === 'repeat') return null;
    state = result.state;
  }
  return { index, scores, current: state };
}

/**
 * Pasi 25.10.: a round's words drawn at random from the whole list. The word
 * with the most letters comes first: long words are the easiest to guess, so
 * the start is forgiving.
 */
export function drawWords<T extends { phrase: string }>(all: readonly T[], count: number, random: () => number = Math.random): T[] {
  const pool = [...all];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, count);
  const letters = (w: T): number => [...w.phrase].filter(isLetter).length;
  const first = picked.reduce((best, w, i) => (letters(w) > letters(picked[best]) ? i : best), 0);
  return [picked[first], ...picked.filter((_, i) => i !== first)];
}
