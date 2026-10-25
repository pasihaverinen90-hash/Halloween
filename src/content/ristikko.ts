import { CONFIG } from '../config';
import { buildLayout, letters, type CrosswordWord, type Layout } from '../games/ristikko/logic';
import { listKeys, parseCards, type ContentError } from './format';

/*
 * content/ristikko-<n>.txt (n = 1…3, Pasi 25.10.): CONFIG.ristikko.minWords…maxWords cards with "sana"
 * (one word, letters A–Ö) and "vihje" (the clue). The crossword is built from
 * them; the check fails if the words cannot be made into one.
 */

export type RistikkoContent = { ok: true; words: CrosswordWord[]; layout: Layout } | { ok: false; errors: ContentError[] };

const KEYS = ['sana', 'vihje'] as const;
const MAX_CLUE = 60;
const LETTER = /^[A-ZÅÄÖ]$/;

export function parseRistikko(text: string): RistikkoContent {
  const { cards, errors } = parseCards(text);
  const words: CrosswordWord[] = [];
  const { minWords, maxWords, minLetters, maxLetters } = CONFIG.ristikko;
  const seen = new Map<string, number>();

  for (const card of cards) {
    for (const [key, field] of card.fields) {
      if (!(KEYS as readonly string[]).includes(key)) {
        errors.push({
          line: field.line,
          message: `Rivi ${field.line}: tuntematon kohta "${key}". Sallitut kohdat ovat ${listKeys(KEYS)}. Tarkista kirjoitusasu.`,
        });
      }
    }
    for (const key of KEYS) {
      if (!card.fields.has(key)) errors.push({ line: card.line, message: `Rivillä ${card.line} alkavasta kortista puuttuu kohta "${key}".` });
    }
    const sana = card.fields.get('sana');
    const vihje = card.fields.get('vihje');
    if (!sana || !vihje) continue;

    const answer = sana.value.toLocaleUpperCase('fi-FI');
    const chars = letters(answer);
    const bad = chars.find((ch) => !LETTER.test(ch));
    if (bad !== undefined) {
      errors.push({
        line: sana.line,
        message:
          bad === ' '
            ? `Rivi ${sana.line}: sanassa ei saa olla välilyöntejä. Ristikon sana on yksi sana, esimerkiksi "KURPITSALYHTY".`
            : `Rivi ${sana.line}: merkki "${bad}" ei kelpaa. Ristikon sanassa saa olla vain kirjaimia A–Ö.`,
      });
      continue;
    }
    if (chars.length < minLetters || chars.length > maxLetters) {
      errors.push({
        line: sana.line,
        message: `Rivi ${sana.line}: sanassa "${answer}" on ${chars.length} kirjainta. Sanassa pitää olla ${minLetters}–${maxLetters} kirjainta.`,
      });
      continue;
    }
    const earlier = seen.get(answer);
    if (earlier !== undefined) {
      errors.push({ line: sana.line, message: `Rivi ${sana.line}: sana "${answer}" on jo rivillä ${earlier}. Jokainen sana saa olla ristikossa vain kerran.` });
      continue;
    }
    seen.set(answer, sana.line);
    const clueLength = Array.from(vihje.value).length;
    if (clueLength > MAX_CLUE) {
      errors.push({
        line: vihje.line,
        message: `Rivi ${vihje.line}: vihje on liian pitkä (${clueLength} merkkiä). Vihje saa olla enintään ${MAX_CLUE} merkkiä.`,
      });
    }
    words.push({ answer, clue: vihje.value });
  }

  if (cards.length < minWords || cards.length > maxWords) {
    errors.push({
      line: null,
      message: `Sanoja pitää olla ${minWords}–${maxWords}, nyt niitä on ${cards.length}. Jokainen sana on oma korttinsa (rivit "sana:" ja "vihje:"), ja korttien välissä on tyhjä rivi.`,
    });
  }
  if (errors.length > 0) {
    errors.sort((a, b) => (a.line ?? Infinity) - (b.line ?? Infinity));
    return { ok: false, errors };
  }
  const layout = buildLayout(words);
  if (!layout) {
    return {
      ok: false,
      errors: [
        {
          line: null,
          message: `Sanoista ei saatu tehtyä ristikkoa, joka mahtuisi ruudulle (enintään ${CONFIG.ristikko.maxCols} × ${CONFIG.ristikko.maxRows} ruutua). Vaihda jokin harvinaisia kirjaimia sisältävä tai hyvin pitkä sana sellaiseen, jossa on yleisiä kirjaimia (esimerkiksi A, I, K, L, S, T, U).`,
        },
      ],
    };
  }
  return { ok: true, words, layout };
}
