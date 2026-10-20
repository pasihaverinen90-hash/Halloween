import { describe, expect, it } from 'vitest';
import { firstEnabled, lastEnabled, moveInGrid, moveInList } from './gridNav';

describe('moveInGrid', () => {
  // 7 items in 4 columns:
  //   0 1 2 3
  //   4 5 6
  const count = 7;
  const cols = 4;

  it('moves left and right within a row', () => {
    expect(moveInGrid(1, count, cols, 'right')).toBe(2);
    expect(moveInGrid(2, count, cols, 'left')).toBe(1);
  });

  it('continues left/right across rows', () => {
    expect(moveInGrid(3, count, cols, 'right')).toBe(4);
    expect(moveInGrid(4, count, cols, 'left')).toBe(3);
  });

  it('stops at the first and last item (no wrap)', () => {
    expect(moveInGrid(0, count, cols, 'left')).toBe(0);
    expect(moveInGrid(6, count, cols, 'right')).toBe(6);
  });

  it('moves up and down by one row without wrapping', () => {
    expect(moveInGrid(1, count, cols, 'down')).toBe(5);
    expect(moveInGrid(5, count, cols, 'up')).toBe(1);
    expect(moveInGrid(1, count, cols, 'up')).toBe(1);
    expect(moveInGrid(5, count, cols, 'down')).toBe(5);
  });

  it('moving down into a shorter last row lands on its last item', () => {
    expect(moveInGrid(3, count, cols, 'down')).toBe(6);
  });

  it('never returns an index outside 0..count-1', () => {
    for (let c = 1; c <= 9; c++) {
      for (let columns = 1; columns <= 5; columns++) {
        for (let i = 0; i < c; i++) {
          for (const dir of ['up', 'down', 'left', 'right'] as const) {
            const next = moveInGrid(i, c, columns, dir);
            expect(next).toBeGreaterThanOrEqual(0);
            expect(next).toBeLessThan(c);
          }
        }
      }
    }
  });

  it('handles a single column, a single item and an empty grid', () => {
    expect(moveInGrid(0, 3, 1, 'down')).toBe(1);
    expect(moveInGrid(2, 3, 1, 'down')).toBe(2);
    expect(moveInGrid(0, 1, 4, 'right')).toBe(0);
    expect(moveInGrid(0, 1, 4, 'down')).toBe(0);
    expect(moveInGrid(0, 0, 4, 'down')).toBe(-1);
  });

  it('clamps an out-of-range starting index and bad column counts', () => {
    expect(moveInGrid(99, count, cols, 'left')).toBe(5);
    expect(moveInGrid(-3, count, cols, 'right')).toBe(1);
    expect(moveInGrid(Number.NaN, count, cols, 'right')).toBe(1);
    expect(moveInGrid(0, count, 0, 'down')).toBe(1);
  });
});

describe('moveInList', () => {
  const items = [{}, { disabled: true }, {}, {}, { disabled: true }];

  it('skips disabled items', () => {
    expect(moveInList(items, 0, 1, true)).toBe(2);
    expect(moveInList(items, 2, -1, true)).toBe(0);
  });

  it('wraps around both ends when asked', () => {
    expect(moveInList(items, 3, 1, true)).toBe(0);
    expect(moveInList(items, 0, -1, true)).toBe(3);
  });

  it('stops at the ends without wrap', () => {
    expect(moveInList(items, 3, 1, false)).toBe(3);
    expect(moveInList(items, 0, -1, false)).toBe(0);
  });

  it('moves several steps (paging) and stops at the last selectable item', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ disabled: i === 4 }));
    expect(moveInList(many, 0, 5, false)).toBe(6);
    expect(moveInList(many, 8, 5, false)).toBe(9);
    expect(moveInList(many, 9, -5, false)).toBe(3);
  });

  it('stays put when nothing else is selectable', () => {
    const single = [{ disabled: true }, {}, { disabled: true }];
    expect(moveInList(single, 1, 1, true)).toBe(1);
    expect(moveInList(single, 1, -1, true)).toBe(1);
    expect(moveInList(single, 1, 1, false)).toBe(1);
  });

  it('recovers from an invalid or disabled starting index', () => {
    expect(moveInList(items, 1, 1, true)).toBe(0);
    expect(moveInList(items, -1, 1, true)).toBe(0);
    expect(moveInList(items, 7, -1, true)).toBe(3);
  });

  it('returns -1 when no item can be selected', () => {
    expect(moveInList([], 0, 1, true)).toBe(-1);
    expect(moveInList([{ disabled: true }], 0, 1, true)).toBe(-1);
    expect(firstEnabled([{ disabled: true }])).toBe(-1);
    expect(lastEnabled([{ disabled: true }, {}, { disabled: true }])).toBe(1);
  });
});
