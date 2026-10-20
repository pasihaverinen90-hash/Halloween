import { describe, expect, it } from 'vitest';
import { isCorrectAnswer, LIMIT_MS, normalizeAnswer, optionOrder, restoreRound, riddlePoints, roundTotal, serializeRound, type Riddle } from './logic';

const open: Riddle = { kind: 'avoin', image: null, emojis: '🔪🚿', question: 'Mikä kauhuelokuva?', answers: ['Psyko', 'Psycho'], wrongOptions: [] };
const choice: Riddle = {
  kind: 'monivalinta',
  image: { file: 'arvoitus-kuu.png', extras: [] },
  emojis: null,
  question: 'Mikä sana?',
  answers: ['Verikuu'],
  wrongOptions: ['Kuunsirppi', 'Täysikuu', 'Uusikuu'],
};

describe('points', () => {
  it('gives 100 at once and falls evenly to 50 at the end of 20 seconds', () => {
    expect(LIMIT_MS).toBe(20_000);
    expect(riddlePoints(0, 0)).toBe(100);
    expect(riddlePoints(10_000, 0)).toBe(75);
    expect(riddlePoints(19_999, 0)).toBe(50);
    expect(riddlePoints(20_000, 0)).toBe(0);
  });

  it('takes 20 per wrong answer but never goes below 0', () => {
    expect(riddlePoints(10_000, 1)).toBe(55);
    expect(riddlePoints(10_000, 3)).toBe(15);
    expect(riddlePoints(10_000, 4)).toBe(0);
    expect(riddlePoints(0, 9)).toBe(0);
  });

  it('ten perfect riddles give 1000', () => {
    expect(roundTotal(Array(10).fill(riddlePoints(0, 0)))).toBe(1000);
  });
});

describe('answers', () => {
  it('ignores case, spaces, hyphens and punctuation but keeps Finnish letters', () => {
    expect(normalizeAnswer('  Haamu-Jengi! ')).toBe('haamujengi');
    expect(isCorrectAnswer(open, 'psyko')).toBe(true);
    expect(isCorrectAnswer(open, ' PSY  CHO ')).toBe(true);
    expect(isCorrectAnswer(open, 'psykoo')).toBe(false);
    expect(isCorrectAnswer(open, '')).toBe(false);
    const hirvio: Riddle = { ...open, answers: ['Hirviö'] };
    expect(isCorrectAnswer(hirvio, 'HIRVIÖ')).toBe(true);
    expect(isCorrectAnswer(hirvio, 'hirvio')).toBe(false);
  });

  it('shows the multiple-choice options in the same mixed order every time', () => {
    const first = optionOrder(choice);
    expect(first).toHaveLength(4);
    expect([...first].sort()).toEqual(['Kuunsirppi', 'Täysikuu', 'Uusikuu', 'Verikuu']);
    expect(optionOrder(choice)).toEqual(first);
  });
});

describe('checkpoint', () => {
  it('round-trips a riddle in progress and a finished one', () => {
    const inProgress = { index: 2, scores: [100, 80], current: { elapsedMs: 6000, wrong: 1, result: null } };
    expect(restoreRound(JSON.parse(JSON.stringify(serializeRound(inProgress))), 10)).toEqual(inProgress);
    const done = { index: 2, scores: [100, 80], current: { elapsedMs: 9000, wrong: 0, result: { outcome: 'correct' as const, points: 78 } } };
    expect(restoreRound(serializeRound(done), 10)).toEqual(done);
  });

  it('rejects snapshots that do not fit', () => {
    expect(restoreRound(null, 10)).toBeNull();
    expect(restoreRound({ v: 1, index: 11, scores: [], current: null }, 10)).toBeNull();
    expect(restoreRound({ v: 1, index: 1, scores: [150], current: null }, 10)).toBeNull();
    expect(restoreRound({ v: 1, index: 1, scores: [100], current: { elapsedMs: 'x', wrong: 0, result: null } }, 10)).toBeNull();
  });
});
