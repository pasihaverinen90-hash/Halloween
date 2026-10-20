import { CONFIG } from '../../config';

/*
 * Picture and emoji riddles (CLAUDE.md, game 2) as pure functions. No Phaser:
 * used by the scene, the content check and unit tests.
 */

export type RiddleKind = 'monivalinta' | 'avoin';

export interface Riddle {
  kind: RiddleKind;
  /** Picture riddle: the image file and optional text parts shown after it (e.g. "+ Ö"). */
  image: { file: string; extras: string[] } | null;
  /** Emoji riddle: the emojis. */
  emojis: string | null;
  /** Shown above the riddle, e.g. "Mikä kauhuelokuva?". Can include a hint. */
  question: string;
  /** Accepted answers of an open riddle; for multiple choice the single correct option. */
  answers: string[];
  /** Multiple choice: the three wrong options. */
  wrongOptions: string[];
}

export type Outcome = 'correct' | 'wrong' | 'timeout';

/** How one riddle is going: time used, wrong answers, and the result once it is over. */
export interface RiddleProgress {
  elapsedMs: number;
  wrong: number;
  result: { outcome: Outcome; points: number } | null;
}

export interface RoundState {
  /** Index of the current riddle. */
  index: number;
  /** Points of the finished riddles. */
  scores: number[];
  current: RiddleProgress | null;
}

export const LIMIT_MS = CONFIG.arvoitukset.secondsPerRiddle * 1000;

/**
 * Text for comparing open answers: case, spaces, hyphens and punctuation do not
 * matter ("Haamu-jengi!" = "haamujengi"). Finnish letters stay distinct (Ä ≠ A).
 */
export function normalizeAnswer(text: string): string {
  return text.toLocaleLowerCase('fi-FI').replace(/[\s\-‐–—.,!?;:'"’”“()]+/g, '');
}

export function isCorrectAnswer(riddle: Riddle, typed: string): boolean {
  const value = normalizeAnswer(typed);
  return value !== '' && riddle.answers.some((answer) => normalizeAnswer(answer) === value);
}

/**
 * Points for a correct answer: 100 at once, falling evenly to 50 at the end of
 * the time; each wrong answer (open riddles) takes 20, never below 0.
 * Time up gives 0.
 */
export function riddlePoints(elapsedMs: number, wrongAnswers: number): number {
  const { maxPoints, minPoints, wrongAnswerPenalty, fullPointsSeconds } = CONFIG.arvoitukset;
  if (!(elapsedMs < LIMIT_MS)) return 0;
  const fullMs = fullPointsSeconds * 1000;
  const progress = Math.max(0, elapsedMs - fullMs) / (LIMIT_MS - fullMs);
  const base = maxPoints - (maxPoints - minPoints) * progress;
  return Math.max(0, Math.round(base - wrongAnswerPenalty * Math.max(0, wrongAnswers)));
}

/** Small deterministic hash (FNV-1a), so every player sees the options in the same order. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The four options of a multiple-choice riddle in a fixed but mixed order. */
export function optionOrder(riddle: Riddle): string[] {
  const options = [riddle.answers[0], ...riddle.wrongOptions];
  let seed = hash(`${riddle.question}|${riddle.answers[0]}|${riddle.wrongOptions.join('|')}`);
  const random = (): number => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
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
    current: state.current ? { ...state.current, result: state.current.result ? { ...state.current.result } : null } : null,
  };
}

/** Rebuild a round from a checkpoint, or null when it does not fit (e.g. the riddles were changed). */
export function restoreRound(raw: unknown, riddleCount: number): RoundState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as { v?: unknown; index?: unknown; scores?: unknown; current?: unknown };
  if (data.v !== 1) return null;
  const index = data.index;
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index > riddleCount) return null;
  const max = CONFIG.arvoitukset.maxPoints;
  if (!Array.isArray(data.scores) || data.scores.length !== index) return null;
  if (!data.scores.every((s) => typeof s === 'number' && Number.isInteger(s) && s >= 0 && s <= max)) return null;
  const scores = data.scores as number[];
  if (data.current === null || data.current === undefined) return { index, scores, current: null };
  if (index >= riddleCount) return null;
  const c = data.current as { elapsedMs?: unknown; wrong?: unknown; result?: unknown };
  if (typeof c.elapsedMs !== 'number' || !Number.isFinite(c.elapsedMs) || typeof c.wrong !== 'number' || !Number.isInteger(c.wrong) || c.wrong < 0) {
    return null;
  }
  let result: RiddleProgress['result'] = null;
  if (c.result !== null && c.result !== undefined) {
    const r = c.result as { outcome?: unknown; points?: unknown };
    if ((r.outcome !== 'correct' && r.outcome !== 'wrong' && r.outcome !== 'timeout') || typeof r.points !== 'number') return null;
    if (!Number.isInteger(r.points) || r.points < 0 || r.points > max) return null;
    result = { outcome: r.outcome, points: r.points };
  }
  return { index, scores, current: { elapsedMs: Math.min(Math.max(0, c.elapsedMs), LIMIT_MS), wrong: c.wrong, result } };
}
