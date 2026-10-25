import { describe, expect, it } from 'vitest';
import { ALPHABET, drawWords, guess, isFailed, isSolved, newWord, toLetter, restoreRound, revealed, roundTotal, serializeRound, wordPoints, type WordState, wrapPhrase } from './logic';

function play(phrase: string, keys: string): WordState {
  let state = newWord(phrase);
  for (const key of keys) state = guess(state, key).state;
  return state;
}

describe('letters', () => {
  it('has 29 guessable letters including Å, Ä and Ö', () => {
    expect(ALPHABET).toHaveLength(29);
    expect(toLetter('ä')).toBe('Ä');
    expect(toLetter('Ö')).toBe('Ö');
    expect(toLetter('å')).toBe('Å');
    expect(toLetter('q')).toBe('Q');
    expect(toLetter('é')).toBeNull();
    expect(toLetter('1')).toBeNull();
    expect(toLetter(' ')).toBeNull();
    expect(toLetter('Enter')).toBeNull();
  });
});

describe('guessing and points', () => {
  it('gives 200 for a perfect word', () => {
    const s = play('LEPAKKO', 'lepako');
    expect(isSolved(s)).toBe(true);
    expect(wordPoints(s)).toBe(200);
  });

  it('takes 25 per wrong letter', () => {
    const s = play('LEPAKKO', 'xyzlepako');
    expect(s.wrong).toEqual(['X', 'Y', 'Z']);
    expect(wordPoints(s)).toBe(125);
    expect(wordPoints(play('LEPAKKO', 'bcdfghjlepako'))).toBe(25);
  });

  it('fails on the 8th wrong letter with 0 points and ignores further guesses', () => {
    const s = play('LEPAKKO', 'bcdfghjm');
    expect(isFailed(s)).toBe(true);
    expect(wordPoints(s)).toBe(0);
    expect(guess(s, 'L').outcome).toBe('ignored');
  });

  it('ignores repeated letters without a penalty', () => {
    let s = play('LEPAKKO', 'x');
    const again = guess(s, 'X');
    expect(again.outcome).toBe('repeat');
    expect(again.state.wrong).toEqual(['X']);
    s = play('LEPAKKO', 'l');
    expect(guess(s, 'l').outcome).toBe('repeat');
  });

  it('reveals every position of a correct letter and always shows spaces and punctuation', () => {
    const s = play('KARKKI VAI KEPPONEN!', 'k');
    const shown = revealed(s)
      .map((c) => (c.shown ? c.char : '_'))
      .join('');
    expect(shown).toBe('K__KK_ ___ K_______!');
  });

  it('handles Ä and Ö', () => {
    const s = play('HÄMÄHÄKKI MÖRKÖ', 'hämkirö');
    expect(isSolved(s)).toBe(true);
    expect(wordPoints(s)).toBe(200);
  });

  it('locks a solved word', () => {
    const s = play('KUU', 'ku');
    expect(guess(s, 'x').outcome).toBe('ignored');
  });

  it('five perfect words give 1000', () => {
    expect(roundTotal([200, 200, 200, 200, 200])).toBe(1000);
  });
});

describe('wrapPhrase', () => {
  it('breaks lines at spaces', () => {
    expect(wrapPhrase('KARKKI VAI KEPPONEN', 14)).toEqual(['KARKKI VAI', 'KEPPONEN']);
    expect(wrapPhrase('KURPITSALYHTY', 14)).toEqual(['KURPITSALYHTY']);
    expect(wrapPhrase('A B C', 3)).toEqual(['A B', 'C']);
  });
});

describe('checkpoint', () => {
  const words = ['LEPAKKO', 'NOIDAN PATA'];

  it('round-trips a round in progress', () => {
    const state = { index: 1, scores: [175], current: play('NOIDAN PATA', 'nxo') };
    const restored = restoreRound(JSON.parse(JSON.stringify(serializeRound(state))), words);
    expect(restored).toEqual(state);
  });

  it('rejects snapshots that do not match the words', () => {
    expect(restoreRound(null, words)).toBeNull();
    expect(restoreRound({ v: 1, index: 1, scores: [175], current: { phrase: 'MUU', tried: [] } }, words)).toBeNull();
    expect(restoreRound({ v: 1, index: 2, scores: [175], current: null }, words)).toBeNull();
    expect(restoreRound({ v: 1, index: 0, scores: [], current: { phrase: 'LEPAKKO', tried: ['L', 'L'] } }, words)).toBeNull();
    expect(restoreRound({ v: 1, index: 1, scores: [999], current: null }, words)).toBeNull();
  });

  it('restores a finished word that waits for Enter', () => {
    const done = play('LEPAKKO', 'lepako');
    const restored = restoreRound(serializeRound({ index: 0, scores: [], current: done }), words);
    expect(restored?.current && isSolved(restored.current)).toBe(true);
  });
});

describe('drawing the words (Pasi 25.10.)', () => {
  const all = ['KUU', 'LEPAKKO', 'KARKKI VAI KEPPONEN', 'NOITA', 'ZOMBI', 'HAUTAUSMAA', 'KALLO'].map((phrase) => ({ phrase }));

  it('draws five different words, the longest first', () => {
    for (let seed = 0; seed < 20; seed++) {
      let n = seed;
      const random = (): number => ((n = (n * 9301 + 49297) % 233280) / 233280);
      const words = drawWords(all, 5, random);
      expect(words).toHaveLength(5);
      expect(new Set(words.map((w) => w.phrase)).size).toBe(5);
      const letters = (p: string): number => p.replace(/[^A-ZÅÄÖ]/g, '').length;
      expect(words.every((w) => letters(w.phrase) <= letters(words[0].phrase))).toBe(true);
    }
  });

  it('varies from round to round', () => {
    const rounds = new Set(Array.from({ length: 10 }, () => drawWords(all, 5).map((w) => w.phrase).sort().join()));
    expect(rounds.size).toBeGreaterThan(1);
  });
});
