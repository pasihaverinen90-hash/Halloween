import { CONFIG } from '../config';

/*
 * Player names. A name is shown on the score boards and must be unique:
 * names are compared case-insensitively after normalising whitespace, so
 * "matti", "MATTI" and " Matti " are the same name.
 */

/** One character that may be typed into a name: a letter or digit of any alphabet, space, or - ' . _ ! ? & */
const NAME_CHAR = /^[\p{L}\p{Nd} \-'._!?&]$/u;

/** Characters that are visible on their own, so an error message can show them. */
const VISIBLE_CHAR = /^[\p{L}\p{N}\p{P}\p{S}]$/u;

/**
 * Trim, collapse inner whitespace to one space and use the composed Unicode
 * form, so that "ä" is always one character whichever way it was typed.
 */
export function normalizeName(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

/** Key for uniqueness checks: the normalised name in lower case (Finnish rules). */
export function nameKey(name: string): string {
  return normalizeName(name).toLocaleLowerCase('fi-FI');
}

/** True when this single character may be typed into a name (used by the name text field). */
export function isNameChar(ch: string): boolean {
  return typeof ch === 'string' && NAME_CHAR.test(ch);
}

/**
 * Check a name typed on the start screen. Returns a Finnish error message,
 * or null when the name is fine. existingNames are the names already in use.
 */
export function validateName(raw: string, existingNames: readonly string[]): string | null {
  const name = normalizeName(raw);
  if (name === '') return 'Kirjoita ensin nimesi.';

  // Count characters, not UTF-16 code units.
  const chars = Array.from(name);
  const max = CONFIG.player.nameMaxLength;
  if (chars.length > max) return `Nimi saa olla enintään ${max} merkkiä pitkä.`;

  const bad = chars.find((ch) => !isNameChar(ch));
  if (bad !== undefined) {
    return VISIBLE_CHAR.test(bad)
      ? `Nimessä on merkki, jota ei voi käyttää: ${bad}`
      : 'Nimessä on näkymätön merkki, jota ei voi käyttää.';
  }

  const key = nameKey(name);
  const taken = existingNames.find((existing) => nameKey(existing) === key);
  if (taken !== undefined) return `Nimi "${normalizeName(taken)}" on jo käytössä. Valitse toinen nimi.`;

  return null;
}
