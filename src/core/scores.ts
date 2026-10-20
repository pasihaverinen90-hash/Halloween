import { CONFIG } from '../config';
import type { GameKind } from '../games/types';
import type { GameRecord, PlayerRecord } from './types';

/*
 * Score rules shared by every screen: what a game record is worth, totals and
 * rankings. Only the games listed in gameIds count; results of games that have
 * been removed from the registry stay in the data but are ignored here.
 */

/** Round and clamp a score to 0..CONFIG.maxScore. Anything that is not a finite number gives 0. */
export function clampScore(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(CONFIG.maxScore, Math.max(0, Math.round(value)));
}

/** How many attempts a game of this kind has (action: best of three, puzzle: one round). */
export function attemptsFor(kind: GameKind): number {
  return CONFIG.attempts[kind];
}

export type GameStatus = 'unplayed' | 'inProgress' | 'finished';

/**
 * A player's record for one game, or undefined when the game has not been
 * played. Only own properties count, so ids such as 'constructor' are safe.
 */
export function getGameRecord(player: PlayerRecord, gameId: string): GameRecord | undefined {
  return Object.prototype.hasOwnProperty.call(player.games, gameId) ? player.games[gameId] : undefined;
}

/** No record = unplayed. A record that is not finished (attempts done or a checkpoint saved) = in progress. */
export function gameStatus(record: GameRecord | undefined): GameStatus {
  if (!record) return 'unplayed';
  return record.finished ? 'finished' : 'inProgress';
}

/**
 * The score that counts for a record: the manual score set in correction mode
 * if there is one, otherwise the best attempt so far. null = nothing scored yet.
 */
export function recordScore(record: GameRecord | undefined): number | null {
  if (!record) return null;
  if (record.manualScore != null) return record.manualScore;
  if (record.attempts.length === 0) return null;
  return record.attempts.reduce((best, score) => Math.max(best, score));
}

/** Sum of the counting scores of these games (unplayed games add 0). */
export function playerTotal(player: PlayerRecord, gameIds: readonly string[]): number {
  let total = 0;
  for (const gameId of new Set(gameIds)) total += recordScore(getGameRecord(player, gameId)) ?? 0;
  return total;
}

/** True when every one of these games is finished. */
export function isPlayerDone(player: PlayerRecord, gameIds: readonly string[]): boolean {
  return gameIds.every((gameId) => gameStatus(getGameRecord(player, gameId)) === 'finished');
}

/** True when the player has a score (even 0) in at least one of these games. */
export function hasAnyScore(player: PlayerRecord, gameIds: readonly string[]): boolean {
  return gameIds.some((gameId) => recordScore(getGameRecord(player, gameId)) !== null);
}

const nameCollator = new Intl.Collator('fi-FI');

/** Alphabetical order of names with Finnish rules (Å, Ä and Ö come after Z). */
export function compareNames(a: string, b: string): number {
  return nameCollator.compare(a, b);
}

export interface TotalRow {
  player: PlayerRecord;
  total: number;
  /** 1-based. Equal totals share the rank (1, 1, 3). */
  rank: number;
  /** How many of the games have a score. */
  scoredGames: number;
}

export interface GameRow {
  player: PlayerRecord;
  score: number;
  /** 1-based. Equal scores share the rank (1, 1, 3). */
  rank: number;
  /** 'inProgress' = the player has not played every attempt yet (the score is the best so far). */
  status: GameStatus;
}

/**
 * Sort by score (highest first), ties alphabetically by name, and give
 * standard competition ranks: equal scores share a place and the next place
 * is skipped (1, 1, 3). Players with the same name order stay in input order.
 */
function rankRows<T extends { player: PlayerRecord; rank: number }>(rows: T[], scoreOf: (row: T) => number): T[] {
  rows.sort((a, b) => scoreOf(b) - scoreOf(a) || compareNames(a.player.name, b.player.name));
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    row.rank = previous !== undefined && scoreOf(previous) === scoreOf(row) ? previous.rank : index + 1;
  });
  return rows;
}

/** Overall standings: players with at least one score in these games, best total first. */
export function rankTotals(players: readonly PlayerRecord[], gameIds: readonly string[]): TotalRow[] {
  const ids = [...new Set(gameIds)];
  const rows: TotalRow[] = [];
  for (const player of players) {
    const scoredGames = ids.filter((gameId) => recordScore(getGameRecord(player, gameId)) !== null).length;
    if (scoredGames > 0) rows.push({ player, total: playerTotal(player, ids), rank: 0, scoredGames });
  }
  return rankRows(rows, (row) => row.total);
}

/** Top list of one game: players who have a score in it, best first. */
export function rankGame(players: readonly PlayerRecord[], gameId: string): GameRow[] {
  const rows: GameRow[] = [];
  for (const player of players) {
    const record = getGameRecord(player, gameId);
    const score = recordScore(record);
    if (score !== null) rows.push({ player, score, rank: 0, status: gameStatus(record) });
  }
  return rankRows(rows, (row) => row.score);
}
