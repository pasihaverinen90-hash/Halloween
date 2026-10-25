import { CONFIG } from '../config';
import { HIRSIPUU_LAYOUT, isLetter, wrapPhrase } from '../games/hirsipuu/logic';
import { listKeys, parseCards, type ContentError } from './format';

/*
 * content/hirsipuu.txt: at least CONFIG.hirsipuu.wordsPerRound cards with
 * "sana" (the word or phrase) and "vihje" (the hint). Pasi 25.10.: each
 * round draws its words at random from all of them.
 */

export interface HirsipuuWord {
  /** Upper-case phrase exactly as shown, e.g. 'KARKKI VAI KEPPONEN'. */
  phrase: string;
  hint: string;
}

export type HirsipuuContent = { ok: true; words: HirsipuuWord[] } | { ok: false; errors: ContentError[] };

const KEYS = ['sana', 'vihje'] as const;
const PUNCTUATION = new Set([' ', '-', ',', '.', '!', '?', "'", '’', ':', ';', '(', ')', '"', '…']);
const MAX_HINT = 90;

function charProblem(ch: string, line: number): string {
  if (/\p{N}/u.test(ch)) {
    return `Rivi ${line}: numeroa "${ch}" ei voi arvata. Kirjoita numero kirjaimin, esimerkiksi "kolme".`;
  }
  if (/\p{L}/u.test(ch)) {
    return `Rivi ${line}: kirjain "${ch}" ei kelpaa. Käytä vain kirjaimia A–Ö (esimerkiksi E kirjaimen É sijaan).`;
  }
  return `Rivi ${line}: merkki "${ch}" ei kelpaa. Sanassa saa olla vain kirjaimia A–Ö, välilyöntejä ja tavallisia välimerkkejä (- , . ! ? ' : ; ( ) ").`;
}

export function parseHirsipuu(text: string): HirsipuuContent {
  const { cards, errors } = parseCards(text);
  const words: HirsipuuWord[] = [];
  const expected = CONFIG.hirsipuu.wordsPerRound;

  for (const card of cards) {
    for (const [key, field] of card.fields) {
      if (!(KEYS as readonly string[]).includes(key)) {
        errors.push({
          line: field.line,
          message: `Rivi ${field.line}: tuntematon kohta "${key}". Sallitut kohdat ovat ${listKeys(KEYS)}. Tarkista kirjoitusasu.`,
        });
      }
    }
    const sana = card.fields.get('sana');
    const vihje = card.fields.get('vihje');
    for (const key of KEYS) {
      if (!card.fields.has(key)) {
        errors.push({ line: card.line, message: `Rivillä ${card.line} alkavasta kortista puuttuu kohta "${key}".` });
      }
    }
    if (!sana || !vihje) continue;

    const phrase = sana.value.toLocaleUpperCase('fi-FI');
    const bad = new Set<string>();
    for (const ch of Array.from(phrase)) {
      if (!isLetter(ch) && !PUNCTUATION.has(ch) && !bad.has(ch)) {
        bad.add(ch);
        errors.push({ line: sana.line, message: charProblem(ch, sana.line) });
      }
    }
    if (bad.size === 0) {
      if (!Array.from(phrase).some(isLetter)) {
        errors.push({ line: sana.line, message: `Rivi ${sana.line}: sanassa pitää olla ainakin yksi kirjain.` });
      } else {
        const { maxLineChars, maxLines } = HIRSIPUU_LAYOUT;
        const longWord = phrase.split(' ').find((word) => Array.from(word).length > maxLineChars);
        if (longWord) {
          errors.push({
            line: sana.line,
            message: `Rivi ${sana.line}: sana "${longWord}" on liian pitkä (${Array.from(longWord).length} merkkiä). Yksi sana saa olla enintään ${maxLineChars} merkkiä, jotta se mahtuu ruudulle.`,
          });
        } else if (wrapPhrase(phrase, maxLineChars).length > maxLines) {
          errors.push({
            line: sana.line,
            message: `Rivi ${sana.line}: lause on liian pitkä mahtuakseen ruudulle (enintään ${maxLines} riviä, noin ${maxLineChars * maxLines - 4} merkkiä). Lyhennä sitä.`,
          });
        }
      }
    }
    const hintLength = Array.from(vihje.value).length;
    if (hintLength > MAX_HINT) {
      errors.push({
        line: vihje.line,
        message: `Rivi ${vihje.line}: vihje on liian pitkä (${hintLength} merkkiä). Vihje saa olla enintään ${MAX_HINT} merkkiä.`,
      });
    }
    words.push({ phrase, hint: vihje.value });
  }

  if (cards.length === 0 && errors.length === 0) {
    errors.push({ line: null, message: `Tiedostossa ei ole yhtään sanaa. Sanoja pitää olla vähintään ${expected}.` });
  } else if (cards.length < expected) {
    errors.push({
      line: null,
      message: `Sanoja pitää olla vähintään ${expected}, nyt niitä on ${cards.length}. Jokainen sana on oma korttinsa (rivit "sana:" ja "vihje:"), ja korttien välissä on tyhjä rivi.`,
    });
  }

  errors.sort((a, b) => (a.line ?? Infinity) - (b.line ?? Infinity));
  return errors.length > 0 ? { ok: false, errors } : { ok: true, words };
}
