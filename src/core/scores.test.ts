import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';
import {
  attemptsFor,
  clampScore,
  compareNames,
  gameStatus,
  getGameRecord,
  hasAnyScore,
  isPlayerDone,
  playerTotal,
  rankGame,
  rankTotals,
  recordScore,
} from './scores';
import type { GameRecord, PlayerRecord } from './types';

const T = '2026-10-31T18:00:00.000Z';

function rec(attempts: number[], extra: Partial<GameRecord> = {}): GameRecord {
  return { attempts, finished: false, checkpoint: null, manualScore: null, updatedAt: T, ...extra };
}

function done(attempts: number[], extra: Partial<GameRecord> = {}): GameRecord {
  return rec(attempts, { finished: true, ...extra });
}

function player(name: string, games: Record<string, GameRecord> = {}): PlayerRecord {
  return { id: `id-${name}`, name, createdAt: T, finishedAt: null, games };
}

const GAMES = ['hirsipuu', 'lentopeli'];

describe('clampScore', () => {
  it('turns NaN and infinities into 0', () => {
    expect(clampScore(Number.NaN)).toBe(0);
    expect(clampScore(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampScore(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('rounds and clamps to 0..maxScore', () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(499.5)).toBe(500);
    expect(clampScore(499.4)).toBe(499);
    expect(clampScore(1000.4)).toBe(CONFIG.maxScore);
    expect(clampScore(1500)).toBe(CONFIG.maxScore);
    expect(clampScore(725)).toBe(725);
  });

  it('never returns negative zero', () => {
    expect(Object.is(clampScore(-0.4), 0)).toBe(true);
    expect(Object.is(clampScore(-0), 0)).toBe(true);
  });

  it('treats a non-number as 0', () => {
    expect(clampScore('500' as unknown as number)).toBe(0);
    expect(clampScore(null as unknown as number)).toBe(0);
  });
});

describe('attemptsFor', () => {
  it('reads the attempt counts from CONFIG', () => {
    expect(attemptsFor('action')).toBe(CONFIG.attempts.action);
    expect(attemptsFor('puzzle')).toBe(CONFIG.attempts.puzzle);
    expect(attemptsFor('action')).toBe(3);
    expect(attemptsFor('puzzle')).toBe(1);
  });
});

describe('gameStatus', () => {
  it('is unplayed without a record', () => {
    expect(gameStatus(undefined)).toBe('unplayed');
  });

  it('is in progress after some attempts or with a checkpoint', () => {
    expect(gameStatus(rec([400]))).toBe('inProgress');
    expect(gameStatus(rec([], { checkpoint: { index: 2 } }))).toBe('inProgress');
  });

  it('is finished when the finished flag is set', () => {
    expect(gameStatus(done([100, 200, 300]))).toBe('finished');
    expect(gameStatus(done([], { manualScore: 500 }))).toBe('finished');
  });
});

describe('recordScore', () => {
  it('is null when nothing has been scored', () => {
    expect(recordScore(undefined)).toBeNull();
    expect(recordScore(rec([], { checkpoint: { index: 1 } }))).toBeNull();
  });

  it('is the best attempt so far', () => {
    expect(recordScore(rec([300]))).toBe(300);
    expect(recordScore(done([300, 650, 400]))).toBe(650);
    expect(recordScore(done([0]))).toBe(0);
  });

  it('uses the manual score when one is set, even a lower one or 0', () => {
    expect(recordScore(done([300, 650], { manualScore: 500 }))).toBe(500);
    expect(recordScore(done([900], { manualScore: 0 }))).toBe(0);
    expect(recordScore(done([], { manualScore: 750 }))).toBe(750);
  });
});

describe('getGameRecord', () => {
  it('returns own records only, so odd ids are safe', () => {
    const p = player('Matti', { hirsipuu: done([500]) });
    expect(getGameRecord(p, 'hirsipuu')?.attempts).toEqual([500]);
    expect(getGameRecord(p, 'lentopeli')).toBeUndefined();
    expect(getGameRecord(p, 'constructor')).toBeUndefined();
    expect(getGameRecord(p, 'toString')).toBeUndefined();
    expect(getGameRecord(p, '__proto__')).toBeUndefined();
    expect(recordScore(getGameRecord(p, 'constructor'))).toBeNull();
  });
});

describe('playerTotal, isPlayerDone, hasAnyScore', () => {
  const matti = player('Matti', {
    hirsipuu: done([725]),
    lentopeli: rec([300, 450]), // still playing: best so far counts
    poistettu: done([1000]), // a game no longer in the registry
  });

  it('sums the counting scores of the listed games only', () => {
    expect(playerTotal(matti, GAMES)).toBe(725 + 450);
    expect(playerTotal(matti, ['hirsipuu'])).toBe(725);
    expect(playerTotal(matti, [])).toBe(0);
  });

  it('does not count a game twice if its id is listed twice', () => {
    expect(playerTotal(matti, ['hirsipuu', 'hirsipuu'])).toBe(725);
  });

  it('is done only when every listed game is finished', () => {
    expect(isPlayerDone(matti, GAMES)).toBe(false);
    expect(isPlayerDone(matti, ['hirsipuu'])).toBe(true);
    expect(isPlayerDone(player('Uusi'), GAMES)).toBe(false);
  });

  it('knows whether there is any score (0 counts as a score)', () => {
    expect(hasAnyScore(matti, GAMES)).toBe(true);
    expect(hasAnyScore(player('Uusi'), GAMES)).toBe(false);
    expect(hasAnyScore(player('Nolla', { hirsipuu: done([0]) }), GAMES)).toBe(true);
    expect(hasAnyScore(player('Vanha', { poistettu: done([900]) }), GAMES)).toBe(false);
    expect(hasAnyScore(player('Aloitti', { hirsipuu: rec([], { checkpoint: {} }) }), GAMES)).toBe(false);
  });
});

describe('compareNames', () => {
  it('sorts with Finnish rules: Å, Ä and Ö after Z', () => {
    const names = ['Öljy', 'Ärrä', 'Åke', 'Zorro', 'Aino'];
    expect([...names].sort(compareNames)).toEqual(['Aino', 'Zorro', 'Åke', 'Ärrä', 'Öljy']);
  });
});

describe('rankTotals', () => {
  it('orders by total and gives tied players the same rank (1, 1, 3)', () => {
    const players = [
      player('Pekka', { hirsipuu: done([500]) }),
      player('Anna', { hirsipuu: done([900]) }),
      player('Ville', { hirsipuu: done([900]) }),
      player('Liisa', { hirsipuu: done([200]) }),
    ];
    const rows = rankTotals(players, GAMES);
    expect(rows.map((row) => [row.player.name, row.total, row.rank])).toEqual([
      ['Anna', 900, 1],
      ['Ville', 900, 1],
      ['Pekka', 500, 3],
      ['Liisa', 200, 4],
    ]);
  });

  it('handles a tie further down and a three-way tie', () => {
    const players = [
      player('A', { hirsipuu: done([800]) }),
      player('B', { hirsipuu: done([600]) }),
      player('C', { hirsipuu: done([600]) }),
      player('D', { hirsipuu: done([600]) }),
      player('E', { hirsipuu: done([100]) }),
    ];
    expect(rankTotals(players, GAMES).map((row) => row.rank)).toEqual([1, 2, 2, 2, 5]);
  });

  it('orders tied players alphabetically with Finnish rules', () => {
    const players = ['Öljy', 'Ärrä', 'Åke', 'Zorro', 'Aino'].map((name) => player(name, { hirsipuu: done([400]) }));
    const rows = rankTotals(players, GAMES);
    expect(rows.map((row) => row.player.name)).toEqual(['Aino', 'Zorro', 'Åke', 'Ärrä', 'Öljy']);
    expect(rows.every((row) => row.rank === 1)).toBe(true);
  });

  it('leaves out players without any score in these games and ignores removed games', () => {
    const players = [
      player('Uusi'),
      player('Vanha', { poistettu: done([1000]) }),
      player('Nolla', { hirsipuu: done([0]) }),
      player('Matti', { hirsipuu: done([300]), poistettu: done([1000]) }),
    ];
    const rows = rankTotals(players, GAMES);
    expect(rows.map((row) => [row.player.name, row.total, row.rank])).toEqual([
      ['Matti', 300, 1],
      ['Nolla', 0, 2],
    ]);
  });

  it('counts scored games and includes in-progress partial scores', () => {
    const players = [
      player('Matti', { hirsipuu: done([500]), lentopeli: rec([250]) }),
      player('Liisa', { lentopeli: rec([], { checkpoint: { x: 1 } }), hirsipuu: done([600]) }),
    ];
    const rows = rankTotals(players, GAMES);
    expect(rows.map((row) => [row.player.name, row.total, row.scoredGames])).toEqual([
      ['Matti', 750, 2],
      ['Liisa', 600, 1],
    ]);
  });

  it('uses manual scores in totals', () => {
    const players = [player('Matti', { hirsipuu: done([900], { manualScore: 100 }) }), player('Liisa', { hirsipuu: done([200]) })];
    expect(rankTotals(players, GAMES).map((row) => [row.player.name, row.total])).toEqual([
      ['Liisa', 200],
      ['Matti', 100],
    ]);
  });

  it('does not reorder the given list', () => {
    const players = [player('B', { hirsipuu: done([1]) }), player('A', { hirsipuu: done([2]) })];
    rankTotals(players, GAMES);
    expect(players.map((p) => p.name)).toEqual(['B', 'A']);
  });

  it('returns an empty list when nobody has played', () => {
    expect(rankTotals([player('A'), player('B')], GAMES)).toEqual([]);
    expect(rankTotals([], GAMES)).toEqual([]);
  });
});

describe('rankGame', () => {
  it('lists players with a score in the game, best first, with shared ranks and status', () => {
    const players = [
      player('Pekka', { hirsipuu: done([500]) }),
      player('Anna', { hirsipuu: rec([700]) }),
      player('Ville', { hirsipuu: done([700]) }),
      player('Uusi'),
      player('Aloitti', { hirsipuu: rec([], { checkpoint: { index: 1 } }) }),
      player('Muu', { lentopeli: done([1000]) }),
    ];
    const rows = rankGame(players, 'hirsipuu');
    expect(rows.map((row) => [row.player.name, row.score, row.rank, row.status])).toEqual([
      ['Anna', 700, 1, 'inProgress'],
      ['Ville', 700, 1, 'finished'],
      ['Pekka', 500, 3, 'finished'],
    ]);
  });

  it('uses the manual score', () => {
    const rows = rankGame([player('Matti', { hirsipuu: done([100], { manualScore: 999 }) })], 'hirsipuu');
    expect(rows[0]).toMatchObject({ score: 999, rank: 1, status: 'finished' });
  });

  it('is empty for a game nobody has played', () => {
    expect(rankGame([player('A')], 'ristikko')).toEqual([]);
  });
});
