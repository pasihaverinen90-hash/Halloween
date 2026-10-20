import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCards } from './format';
import { parseHirsipuu } from './hirsipuu';

const FIVE = [1, 2, 3, 4, 5].map((n) => `sana: Sana${'a'.repeat(n)}\nvihje: Vihje ${n}`).join('\n\n');

function errorsOf(text: string): string[] {
  const result = parseHirsipuu(text);
  return result.ok ? [] : result.errors.map((e) => e.message);
}

describe('parseCards', () => {
  it('reads cards, comments, a BOM, CRLF, tabs and colons inside values', () => {
    const { cards, errors } = parseCards('﻿# ohje\r\nSana:Kuu\r\n\tvihje:  Kello: 12  \r\n\r\n\r\nsana: Yö');
    expect(errors).toEqual([]);
    expect(cards).toHaveLength(2);
    expect(cards[0].fields.get('sana')).toEqual({ value: 'Kuu', line: 2 });
    expect(cards[0].fields.get('vihje')?.value).toBe('Kello: 12');
    expect(cards[1].line).toBe(6);
  });

  it('explains a missing colon, an empty value and a missing blank line', () => {
    const { errors } = parseCards('sana Kuu\nvihje:\n\nsana: A\nvihje: B\nsana: C');
    expect(errors.map((e) => e.line)).toEqual([1, 2, 6]);
    expect(errors[0].message).toMatch(/kaksoispiste puuttuu/);
    expect(errors[1].message).toMatch(/teksti puuttuu/);
    expect(errors[2].message).toMatch(/kahdesti.*tyhjä rivi/);
  });
});

describe('parseHirsipuu', () => {
  it('accepts the real content file', () => {
    const result = parseHirsipuu(readFileSync('content/hirsipuu.txt', 'utf8'));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.words).toHaveLength(5);
      expect(result.words[0].phrase).toBe(result.words[0].phrase.toLocaleUpperCase('fi-FI'));
    }
  });

  it('upper-cases phrases and collapses spaces', () => {
    const result = parseHirsipuu(FIVE.replace('sana: Sanaa\n', 'sana: karkki   vai  kepponen!\n'));
    expect(result.ok && result.words[0].phrase).toBe('KARKKI VAI KEPPONEN!');
  });

  it('requires exactly five words', () => {
    const four = FIVE.split('\n\n').slice(0, 4).join('\n\n');
    expect(errorsOf(four).join()).toMatch(/tasan 5, nyt niitä on 4/);
    expect(errorsOf(`${FIVE}\n\nsana: Kuusi\nvihje: Kuusi`).join()).toMatch(/nyt niitä on 6/);
    expect(errorsOf('# vain kommentti').join()).toMatch(/ei ole yhtään sanaa/);
  });

  it('names bad characters with helpful advice', () => {
    expect(errorsOf(FIVE.replace('Sanaa', 'Sana 3')).join()).toMatch(/numeroa "3".*kirjaimin/);
    expect(errorsOf(FIVE.replace('Sanaa', 'Café')).join()).toMatch(/kirjain "É" ei kelpaa/);
    expect(errorsOf(FIVE.replace('Sanaa', 'Kurpitsa 🎃')).join()).toMatch(/merkki "🎃" ei kelpaa/);
  });

  it('reports unknown and missing keys', () => {
    expect(errorsOf(FIVE.replace('vihje: Vihje 1', 'vihjee: Vihje 1')).join()).toMatch(/tuntematon kohta "vihjee"/);
    expect(errorsOf(FIVE.replace('vihje: Vihje 1', 'vihjee: Vihje 1')).join()).toMatch(/puuttuu kohta "vihje"/);
  });

  it('keeps phrases and hints within the screen', () => {
    expect(errorsOf(FIVE.replace('Sanaa', 'Hämähäkinseittiverkko')).join()).toMatch(/liian pitkä \(21 merkkiä\)/);
    expect(errorsOf(FIVE.replace('Sanaa', 'yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan')).join()).toMatch(
      /enintään 3 riviä/,
    );
    expect(errorsOf(FIVE.replace('Vihje 1', 'x'.repeat(91))).join()).toMatch(/vihje on liian pitkä/);
  });

  it('requires at least one letter', () => {
    expect(errorsOf(FIVE.replace('Sanaa', '?!')).join()).toMatch(/ainakin yksi kirjain/);
  });
});
