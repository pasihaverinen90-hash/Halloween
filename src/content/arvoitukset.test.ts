import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseArvoitukset } from './arvoitukset';

const real = readFileSync('content/kuva-arvoitukset.txt', 'utf8');

function errorsOf(text: string): string {
  const result = parseArvoitukset(text);
  return result.ok ? '' : result.errors.map((e) => e.message).join('\n');
}

const choice = `tyyppi: monivalinta
emojit: 🦈🌊
kysymys: Mikä kauhuelokuva?
vastaus: Tappajahai
väärät: Uhrilampaat; Linnut; Alien`;

describe('parseArvoitukset', () => {
  it('accepts the real content file: 11 open riddles in the tournament and 2 more in freeplay (Pasi 23.10.)', () => {
    const result = parseArvoitukset(real);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.riddles.filter((r) => !r.freeplayOnly)).toHaveLength(11);
    expect(result.riddles.filter((r) => r.freeplayOnly).map((r) => r.answers[0])).toEqual(['Hohto', 'Uhrilampaat']);
    expect(result.riddles.every((r) => r.kind === 'avoin')).toBe(true);
    expect(result.riddles.find((r) => r.image?.file === 'arvoitus-hirvi.png')?.image?.extras).toEqual(['Ö']);
    const texas = result.riddles.find((r) => r.image?.file === 'arvoitus-texas.jpg');
    expect(texas?.answers).toEqual(expect.arrayContaining(['Texasin moottorisahamurhat', 'Teksasin moottorisahamurhaaja', 'Texasin moottorisahamurhaaja']));
  });

  it('requires 11 tournament riddles; freeplay ones come on top', () => {
    const cards = real.split(/\n\s*\n/).filter((c) => c.trim().startsWith('tyyppi:'));
    expect(errorsOf(cards.slice(0, 10).join('\n\n'))).toMatch(/tasan 11, nyt niitä on 10/);
    expect(errorsOf(cards.slice(0, 11).join('\n\n'))).toBe('');
    expect(errorsOf(`${real}\n\n${choice}\nvain: freeplay`)).toBe('');
  });

  it('still understands multiple choice', () => {
    const result = parseArvoitukset(`${real}\n\n${choice}\nvain: freeplay`);
    expect(result.ok && result.riddles[result.riddles.length - 1]).toMatchObject({ kind: 'monivalinta', wrongOptions: ['Uhrilampaat', 'Linnut', 'Alien'], freeplayOnly: true });
  });

  it('explains mistakes in Finnish', () => {
    expect(errorsOf(real.replace('tyyppi: avoin', 'tyyppi: vapaa'))).toMatch(/tyyppi "vapaa" ei kelpaa/);
    expect(errorsOf(`${real}\n\n${choice.replace('Linnut; Alien', 'Linnut')}\nvain: freeplay`)).toMatch(/tasan 3 väärää/);
    expect(errorsOf(`${real}\n\n${choice.replace('Alien', 'Tappajahai')}\nvain: freeplay`)).toMatch(/sama/);
    expect(errorsOf(real.replace('kuva: arvoitus-halloween.jpg', 'kuva: Halloween Kuva.png'))).toMatch(/kuvan nimi/);
    expect(errorsOf(real.replace('kuva: arvoitus-halloween.jpg', 'kuva: arvoitus-halloween.jpg\nemojit: 🔪'))).toMatch(/sekä "kuva" että "emojit"/);
    expect(errorsOf(real.replace('kysymys: Mikä kauhuolento?\n', ''))).toMatch(/puuttuu kohta "kysymys"/);
    expect(errorsOf(real.replace('vastaus: Halloween', 'vastaus: Halloween\nväärät: A; B; C'))).toMatch(/kuuluu vain monivalintaan/);
    expect(errorsOf(real.replace('Shining\nvain: freeplay', 'Shining\nvain: turnaus'))).toMatch(/"vain: turnaus" ei kelpaa/);
  });
});
