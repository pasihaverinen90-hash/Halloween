import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { drawRistikkoVersion, RISTIKKO_FILES } from './content';
import { parseRistikko } from '../../content/ristikko';
import { buildLayout, cellKey, crosswordPoints, solutionCells, wordCells, type Layout } from './logic';

const C = CONFIG.ristikko;
const content = parseRistikko(readFileSync(resolve(__dirname, '../../../content/ristikko-1.txt'), 'utf8'));
if (!content.ok) throw new Error(content.errors.map((e) => e.message).join('\n'));
const layout = content.layout;

/** Every run of two or more letters in a row or a column. */
function runs(grid: Layout): string[] {
  const cells = solutionCells(grid);
  const found: string[] = [];
  for (const [dr, dc] of [
    [0, 1],
    [1, 0],
  ]) {
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (!cells.has(cellKey(r, c)) || cells.has(cellKey(r - dr, c - dc))) continue;
        let word = '';
        for (let k = 0; cells.has(cellKey(r + dr * k, c + dc * k)); k++) word += cells.get(cellKey(r + dr * k, c + dc * k));
        if (word.length > 1) found.push(word);
      }
    }
  }
  return found;
}

describe('crossword grid', () => {
  it('places every word and fits the screen', () => {
    expect(layout.words).toHaveLength(content.words.length);
    expect(layout.cols).toBeLessThanOrEqual(C.maxCols);
    expect(layout.rows).toBeLessThanOrEqual(C.maxRows);
    for (const word of layout.words) {
      for (const cell of wordCells(word)) {
        expect(cell.row).toBeGreaterThanOrEqual(0);
        expect(cell.row).toBeLessThan(layout.rows);
        expect(cell.col).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeLessThan(layout.cols);
      }
    }
  });

  it('forms no accidental words: every row and column run is one of the words', () => {
    expect(runs(layout).sort()).toEqual(layout.words.map((w) => w.answer).sort());
  });

  it('is one connected crossword with plenty of crossings', () => {
    const cells = solutionCells(layout);
    const letterCount = layout.words.reduce((sum, w) => sum + w.answer.length, 0);
    const crossings = letterCount - cells.size;
    expect(crossings).toBeGreaterThanOrEqual(layout.words.length - 1);
    // Flood fill from one cell reaches all cells
    const start = [...cells.keys()][0];
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const [r, c] = queue.pop()!.split(',').map(Number);
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ]) {
        const key = cellKey(r + dr, c + dc);
        if (cells.has(key) && !seen.has(key)) {
          seen.add(key);
          queue.push(key);
        }
      }
    }
    expect(seen.size).toBe(cells.size);
  });

  it('numbers the start cells in reading order, across clues first', () => {
    const starts = [...new Set(layout.words.map((w) => cellKey(w.row, w.col)))];
    expect(Math.max(...layout.words.map((w) => w.number))).toBe(starts.length);
    const across = layout.words.filter((w) => w.dir === 'across');
    expect(layout.words.slice(0, across.length).every((w) => w.dir === 'across')).toBe(true);
    for (const list of [across, layout.words.filter((w) => w.dir === 'down')]) {
      expect(list.map((w) => w.number)).toEqual([...list.map((w) => w.number)].sort((a, b) => a - b));
    }
    const byNumber = [...layout.words].sort((a, b) => a.number - b.number);
    for (let i = 1; i < byNumber.length; i++) {
      const [p, q] = [byNumber[i - 1], byNumber[i]];
      expect(p.row < q.row || (p.row === q.row && p.col <= q.col)).toBe(true);
    }
  });

  it('is the same every time', () => {
    expect(buildLayout(content.words)).toEqual(layout);
  });

  it('reports words that cannot make a crossword', () => {
    expect(buildLayout([{ answer: 'ABC', clue: '' }, { answer: 'DEF', clue: '' }])).toBeNull();
  });
});

describe('content check', () => {
  it('explains bad words in Finnish', () => {
    const bad = parseRistikko('sana: kissa koira\nvihje: x\n\nsana: ab\nvihje: y\n');
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      const text = bad.errors.map((e) => e.message).join('\n');
      expect(text).toMatch(/välilyöntejä/);
      expect(text).toMatch(/3–13 kirjainta/);
      expect(text).toMatch(/Sanoja pitää olla 16–22/);
    }
  });
});

describe('points', () => {
  it('gives 600 for words and 400 for time when solved within 3 minutes', () => {
    expect(crosswordPoints(18, 18, 600)).toBe(1000);
    expect(crosswordPoints(18, 18, 420)).toBe(1000);
    expect(crosswordPoints(18, 18, 210)).toBe(800);
    expect(crosswordPoints(18, 18, 0)).toBe(600);
    expect(crosswordPoints(9, 18, 0)).toBe(300);
    expect(crosswordPoints(0, 18, 0)).toBe(0);
  });
});

it('prints the grid (for a look)', () => {
  const cells = solutionCells(layout);
  const lines: string[] = [];
  for (let r = 0; r < layout.rows; r++) {
    let line = '';
    for (let c = 0; c < layout.cols; c++) line += cells.get(cellKey(r, c)) ?? '·';
    lines.push(line);
  }
  console.log(`${layout.cols}×${layout.rows}, ${cells.size} ruutua\n${lines.join('\n')}`);
});

describe('three crosswords (Pasi 25.10.)', () => {
  it('every version builds a crossword that fits the screen, and freeplay draws all of them', () => {
    for (const file of RISTIKKO_FILES) {
      const result = parseRistikko(readFileSync(resolve(__dirname, `../../../content/${file}`), 'utf8'));
      expect(result.ok, file).toBe(true);
    }
    const drawn = new Set(Array.from({ length: 60 }, () => drawRistikkoVersion()));
    expect([...drawn].sort()).toEqual([1, 2, 3]);
  });
});
