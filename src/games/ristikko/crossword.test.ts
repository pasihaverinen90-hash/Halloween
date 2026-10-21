import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { Crossword } from './crossword';
import type { Layout } from './logic';

const C = CONFIG.ristikko;

/*
 *   K A L M A
 *   I . . . A
 *   S . . . V
 *   S . . . E
 *   A
 */
const LAYOUT: Layout = {
  rows: 5,
  cols: 5,
  words: [
    { index: 0, answer: 'KALMA', clue: 'Kuolema', row: 0, col: 0, dir: 'across', number: 1 },
    { index: 1, answer: 'KISSA', clue: 'Musta eläin', row: 0, col: 0, dir: 'down', number: 1 },
    { index: 2, answer: 'AAVE', clue: 'Kummittelija', row: 0, col: 4, dir: 'down', number: 2 },
  ],
};

const typeAll = (x: Crossword, text: string): void => {
  for (const ch of text) x.type(ch);
};

describe('crossword round', () => {
  it('locks a correct word and jumps to the next unsolved word', () => {
    const x = new Crossword(LAYOUT);
    expect([x.row, x.col, x.dir]).toEqual([0, 0, 'across']);
    typeAll(x, 'KALMA');
    expect(x.solved.has(0)).toBe(true);
    expect(x.locked('0,4')).toBe(true);
    // Next word KISSA: its first cell is locked, so the cursor goes to the first open one
    expect([x.row, x.col, x.dir]).toEqual([1, 0, 'down']);
  });

  it('removes only the wrong letters of a wrong word and takes 5 seconds', () => {
    const x = new Crossword(LAYOUT);
    typeAll(x, 'KALMO');
    expect(x.solved.size).toBe(0);
    expect(x.secondsLeft).toBe(C.seconds - C.wrongWordPenaltySeconds);
    expect([...x.values.keys()].sort()).toEqual(['0,0', '0,1', '0,2', '0,3']);
    expect([x.row, x.col]).toEqual([0, 4]);
    const events = x.type('A');
    expect(events).toContainEqual({ type: 'solved', word: 0 });
  });

  it('types over a locked cell into the next open one', () => {
    const x = new Crossword(LAYOUT);
    typeAll(x, 'KALMA');
    x.selectWord(1);
    x.move('up'); // onto the locked K
    expect([x.row, x.col]).toEqual([0, 0]);
    x.type('I');
    expect(x.values.get('1,0')).toBe('I');
  });

  it('a hint reveals 3 random missing letters anywhere for 10 seconds', () => {
    const x = new Crossword(LAYOUT);
    typeAll(x, 'KALMA');
    const events = x.reveal(() => 0); // always the first missing cell
    expect(events.filter((e) => e.type === 'revealed')).toHaveLength(C.revealCount);
    expect([...x.revealed]).toEqual(['1,0', '2,0', '3,0']);
    expect(x.secondsLeft).toBe(C.seconds - C.revealPenaltySeconds);
    for (const key of x.revealed) expect(x.locked(key)).toBe(true);
  });

  it('reveals only missing letters, and a word revealed completely gives no word points', () => {
    const x = new Crossword(LAYOUT);
    typeAll(x, 'KAL'); // three right letters, not locked yet
    for (let i = 0; i < 3; i++) x.reveal(() => 0.99);
    expect([...x.revealed].some((key) => ['0,0', '0,1', '0,2'].includes(key))).toBe(false);
    expect(x.allSolved()).toBe(true);
    // KALMA and KISSA have letters typed by the player; every letter of AAVE was revealed
    expect(x.counted()).toBe(2);
    expect(x.reveal()).toEqual([]);
  });

  it('gives only time points when everything was revealed', () => {
    const x = new Crossword(LAYOUT);
    while (!x.allSolved()) x.reveal();
    expect(x.counted()).toBe(0);
    expect(x.secondsLeft).toBe(C.seconds - 4 * C.revealPenaltySeconds);
    expect(x.points()).toBe(C.timePoints);
  });

  it('moves with arrows: an arrow across the direction first turns, gaps are skipped', () => {
    const x = new Crossword(LAYOUT);
    x.move('down'); // turn to KISSA
    expect([x.row, x.col, x.dir]).toEqual([0, 0, 'down']);
    x.move('down');
    expect([x.row, x.col]).toEqual([1, 0]);
    x.move('right'); // jumps over the empty cells to AAVE
    expect([x.row, x.col, x.dir]).toEqual([1, 4, 'down']);
    x.move('left');
    x.move('left');
    expect([x.row, x.col]).toEqual([1, 0]);
    expect(x.toggle()).toBe(false); // only one word here
  });

  it('erases with Backspace, stepping back when the cell is empty', () => {
    const x = new Crossword(LAYOUT);
    typeAll(x, 'KAL');
    expect([x.row, x.col]).toEqual([0, 3]);
    x.backspace();
    expect(x.values.has('0,2')).toBe(false);
    expect([x.row, x.col]).toEqual([0, 2]);
    x.backspace();
    expect(x.values.has('0,1')).toBe(false);
  });

  it('gives 1000 points for a quick solve and saves and restores the round', () => {
    const x = new Crossword(LAYOUT);
    typeAll(x, 'KALMA');
    typeAll(x, 'ISSA');
    x.tick(30);
    const saved = JSON.parse(JSON.stringify(x.snapshot()));
    const y = new Crossword(LAYOUT);
    expect(y.restore(saved)).toBe(true);
    expect([...y.solved].sort()).toEqual([0, 1]);
    expect(y.secondsLeft).toBe(C.seconds - 30);
    typeAll(y, 'AVE');
    expect(y.allSolved()).toBe(true);
    expect(y.points()).toBe(1000);
    expect(new Crossword(LAYOUT).restore({ version: 9 })).toBe(false);
  });

  it('gives only word points when the time runs out', () => {
    const x = new Crossword(LAYOUT);
    typeAll(x, 'KALMA');
    x.tick(C.seconds);
    expect(x.points()).toBe(Math.floor(C.wordPoints / 3));
  });
});
