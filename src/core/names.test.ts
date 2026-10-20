import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';
import { isNameChar, nameKey, normalizeName, validateName } from './names';

const MAX = CONFIG.player.nameMaxLength;

describe('normalizeName', () => {
  it('trims and collapses inner whitespace to one space', () => {
    expect(normalizeName('  Matti   Meikäläinen ')).toBe('Matti Meikäläinen');
    expect(normalizeName('Matti\t\n M K')).toBe('Matti M K');
  });

  it('gives an empty string for whitespace only', () => {
    expect(normalizeName('   \t ')).toBe('');
    expect(normalizeName('')).toBe('');
  });

  it('composes decomposed Finnish letters into single characters', () => {
    const decomposed = 'Äijö'; // Ä and ö typed as letter + combining diaeresis
    expect(normalizeName(decomposed)).toBe('Äijö');
    expect(normalizeName(decomposed)).toHaveLength(4);
  });

  it('keeps the case and the letters', () => {
    expect(normalizeName('ÅSA äijä')).toBe('ÅSA äijä');
  });

  it('treats a non-string as empty instead of crashing', () => {
    expect(normalizeName(undefined as unknown as string)).toBe('');
  });
});

describe('nameKey', () => {
  it('makes "matti", "MATTI" and " Matti " the same name', () => {
    expect(nameKey('matti')).toBe('matti');
    expect(nameKey('MATTI')).toBe('matti');
    expect(nameKey(' Matti ')).toBe('matti');
  });

  it('lower-cases Finnish letters', () => {
    expect(nameKey('ÅSA ÄIJÖ')).toBe('åsa äijö');
  });

  it('keeps names that differ by a letter apart', () => {
    expect(nameKey('Mätti')).not.toBe(nameKey('Matti'));
    expect(nameKey('Matti Ö')).not.toBe(nameKey('Matti O'));
  });
});

describe('isNameChar', () => {
  it('accepts letters of any alphabet, digits, space and - \' . _ ! ? &', () => {
    for (const ch of ['a', 'Z', 'å', 'Å', 'ä', 'Ä', 'ö', 'Ö', 'é', 'ß', 'Ж', '0', '9', ' ', '-', "'", '.', '_', '!', '?', '&']) {
      expect(isNameChar(ch), ch).toBe(true);
    }
  });

  it('rejects other characters and anything that is not exactly one character', () => {
    for (const ch of [';', '"', ',', '<', '>', '/', '\\', '#', '@', '=', '+', '😀', '\t', '\n', '​', '', 'ab', 'Enter']) {
      expect(isNameChar(ch), JSON.stringify(ch)).toBe(false);
    }
  });
});

describe('validateName', () => {
  it('accepts a good name', () => {
    expect(validateName('Matti', [])).toBeNull();
    expect(validateName('Äijä-Pekka', ['Matti'])).toBeNull();
    expect(validateName("D'Artagnan & Co.", [])).toBeNull();
  });

  it('asks for a name when it is empty or only spaces', () => {
    expect(validateName('', [])).toBe('Kirjoita ensin nimesi.');
    expect(validateName('    ', [])).toBe('Kirjoita ensin nimesi.');
  });

  it(`allows at most ${MAX} characters after normalising`, () => {
    expect(validateName('Ä'.repeat(MAX), [])).toBeNull();
    expect(validateName(`   ${'ö'.repeat(MAX)}   `, [])).toBeNull();
    expect(validateName('ö'.repeat(MAX + 1), [])).toBe(`Nimi saa olla enintään ${MAX} merkkiä pitkä.`);
  });

  it('counts a decomposed Finnish letter as one character', () => {
    expect(validateName('Ä'.repeat(MAX), [])).toBeNull();
  });

  it('collapses inner spaces before counting', () => {
    const name = `${'a'.repeat(MAX / 2)}      ${'b'.repeat(MAX / 2 - 1)}`;
    expect(validateName(name, [])).toBeNull();
  });

  it('names a character that cannot be used', () => {
    expect(validateName('Matti#1', [])).toBe('Nimessä on merkki, jota ei voi käyttää: #');
    expect(validateName('Matti;', [])).toBe('Nimessä on merkki, jota ei voi käyttää: ;');
  });

  it('explains an invisible character instead of showing nothing', () => {
    expect(validateName('Mat​ti', [])).toBe('Nimessä on näkymätön merkki, jota ei voi käyttää.');
  });

  it('refuses a taken name regardless of case and extra spaces, and shows the existing spelling', () => {
    const existing = ['Matti', 'Liisa'];
    for (const name of ['matti', 'MATTI', ' Matti ', 'mAtTi']) {
      expect(validateName(name, existing), name).toBe('Nimi "Matti" on jo käytössä. Valitse toinen nimi.');
    }
    expect(validateName('Matti2', existing)).toBeNull();
  });

  it('compares Finnish letters case-insensitively but keeps Ä and A apart', () => {
    expect(validateName('äIJÖ', ['Äijö'])).toBe('Nimi "Äijö" on jo käytössä. Valitse toinen nimi.');
    expect(validateName('Aijo', ['Äijö'])).toBeNull();
  });

  it('treats a multi-word name with different spacing as taken', () => {
    expect(validateName('anna   mäki', ['Anna Mäki'])).toBe('Nimi "Anna Mäki" on jo käytössä. Valitse toinen nimi.');
  });
});
