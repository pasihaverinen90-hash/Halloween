import { attemptsFor, recordScore } from '../core/scores';
import type { GameRecord } from '../core/types';
import type { GameDefinition, GameKind } from '../games/types';

/** Where a player stands in one game: how many attempts are done and which comes next. */
export interface AttemptPlan {
  kind: GameKind;
  /** Attempts in this game: 3 for action games, 1 for puzzles (CONFIG.attempts), unless the game sets its own. */
  total: number;
  /** Attempts already recorded. */
  done: number;
  /** Best score so far (the score that counts), or null before any result. */
  best: number | null;
  /** All attempts played (or a manual score set): the game cannot be played. */
  finished: boolean;
  /** 1-based number of the next attempt (meaningful when not finished). */
  next: number;
  /** A puzzle round was interrupted and will continue from its checkpoint. */
  resumes: boolean;
}

/** How many attempts a game has: its own number, or the usual for its kind. */
export function attemptCount(def: Pick<GameDefinition, 'kind' | 'attempts'>): number {
  return def.attempts ?? attemptsFor(def.kind);
}

export function planAttempts(kind: GameKind, record: GameRecord | undefined, total: number = attemptsFor(kind)): AttemptPlan {
  const done = record ? Math.min(record.attempts.length, total) : 0;
  const finished = record ? record.finished || done >= total : false;
  return {
    kind,
    total,
    done,
    best: recordScore(record),
    finished,
    next: Math.min(done + 1, total),
    resumes: !finished && record?.checkpoint != null,
  };
}
