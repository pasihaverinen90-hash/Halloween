import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseArvoitukset } from './arvoitukset';

const real = readFileSync('content/kuva-arvoitukset.txt', 'utf8');

function errorsOf(text: string): string {
  const result = parseArvoitukset(text);
  return result.ok ? '' : result.errors.map((e) => e.message).join('\n');
}

describe('parseArvoitukset', () => {
  it('accepts the real content file: 10 riddles, half multiple choice', () => {
    const result = parseArvoitukset(real);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.riddles).toHaveLength(10);
    expect(result.riddles.filter((r) => r.kind === 'monivalinta')).toHaveLength(5);
    const hirvi = result.riddles.find((r) => r.image?.file === 'arvoitus-hirvi.png');
    expect(hirvi?.image?.extras).toEqual(['Ö']);
    expect(result.riddles.find((r) => r.emojis === '🔪🚿')?.answers).toEqual(['Psyko', 'Psycho']);
  });

  it('requires 10 riddles and a 5 + 5 split', () => {
    const cards = real.split(/\n\s*\n/).filter((c) => c.trim().startsWith('tyyppi:'));
    expect(errorsOf(cards.slice(0, 9).join('\n\n'))).toMatch(/tasan 10, nyt niitä on 9/);
    expect(errorsOf(real.replace('tyyppi: monivalinta\nkuva: arvoitus-ihmissusi.png', 'tyyppi: avoin\nkuva: arvoitus-ihmissusi.png').replace('väärät: Vampyyri; Susikoira; Metsänpeikko', ''))).toMatch(
      /Monivalintoja pitää olla 5/,
    );
  });

  it('explains mistakes in Finnish', () => {
    expect(errorsOf(real.replace('tyyppi: avoin', 'tyyppi: vapaa'))).toMatch(/tyyppi "vapaa" ei kelpaa/);
    expect(errorsOf(real.replace('väärät: Uhrilampaat; Linnut; Alien', 'väärät: Uhrilampaat; Linnut'))).toMatch(/tasan 3 väärää/);
    expect(errorsOf(real.replace('väärät: Uhrilampaat; Linnut; Alien', 'väärät: Uhrilampaat; Linnut; Tappajahai'))).toMatch(/sama/);
    expect(errorsOf(real.replace('kuva: arvoitus-verikuu.png', 'kuva: Veri Kuu.png'))).toMatch(/kuvan nimi/);
    expect(errorsOf(real.replace('emojit: 🔪🚿', 'emojit: 🔪🚿\nkuva: arvoitus-x.png'))).toMatch(/sekä "kuva" että "emojit"/);
    expect(errorsOf(real.replace('kysymys: Mikä elokuva?\n', ''))).toMatch(/puuttuu kohta "kysymys"/);
    expect(errorsOf(real.replace('vastaus: Psyko; Psycho', 'vastaus: Psyko; Psycho\nväärät: A; B; C'))).toMatch(/kuuluu vain monivalintaan/);
  });
});
