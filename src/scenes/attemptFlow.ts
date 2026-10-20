import { attemptsFor, recordScore } from '../core/scores';
import type { GameRecord } from '../core/types';
import type { GameKind } from '../games/types';

/** Where a player stands in one game: how many attempts are done and which comes next. */
export interface AttemptPlan {
  kind: GameKind;
  /** Attempts in this game: 3 for action games, 1 for puzzles (CONFIG.attempts). */
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

export function planAttempts(kind: GameKind, record: GameRecord | undefined): AttemptPlan {
  const total = attemptsFor(kind);
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
