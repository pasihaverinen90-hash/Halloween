import { CONFIG } from '../config';
import { normalizeAnswer, type Riddle, type RiddleKind } from '../games/arvoitukset/logic';
import { listKeys, parseCards, type ContentError } from './format';

/*
 * content/kuva-arvoitukset.txt: CONFIG.arvoitukset.riddlesPerRound cards, half
 * of them multiple choice. Each card is a picture riddle (kuva) or an emoji
 * riddle (emojit).
 */

export type ArvoituksetContent = { ok: true; riddles: Riddle[] } | { ok: false; errors: ContentError[] };

const KEYS = ['tyyppi', 'kuva', 'emojit', 'kysymys', 'vastaus', 'väärät'] as const;
const IMAGE_FILE = /^[a-z0-9][a-z0-9-]*\.(png|jpe?g|webp)$/;
const MAX_QUESTION = 70;
const MAX_OPTION = 30;
const MAX_ANSWER = 40;

function splitList(value: string): string[] {
  return value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

export function parseArvoitukset(text: string): ArvoituksetContent {
  const { cards, errors } = parseCards(text);
  const riddles: Riddle[] = [];
  const { riddlesPerRound, multipleChoiceCount } = CONFIG.arvoitukset;

  for (const card of cards) {
    const err = (line: number, message: string): void => {
      errors.push({ line, message: `Rivi ${line}: ${message}` });
    };
    for (const [key, field] of card.fields) {
      if (!(KEYS as readonly string[]).includes(key)) {
        err(field.line, `tuntematon kohta "${key}". Sallitut kohdat ovat ${listKeys(KEYS)}. Tarkista kirjoitusasu.`);
      }
    }
    const get = (key: string) => card.fields.get(key);
    const tyyppi = get('tyyppi');
    const kuva = get('kuva');
    const emojit = get('emojit');
    const kysymys = get('kysymys');
    const vastaus = get('vastaus');
    const vaarat = get('väärät');
    const at = card.line;
    let ok = true;

    let kind: RiddleKind | null = null;
    if (!tyyppi) {
      errors.push({ line: at, message: `Rivillä ${at} alkavasta kortista puuttuu kohta "tyyppi" (monivalinta tai avoin).` });
      ok = false;
    } else {
      const value = tyyppi.value.toLocaleLowerCase('fi-FI');
      if (value === 'monivalinta' || value === 'avoin') kind = value;
      else {
        err(tyyppi.line, `tyyppi "${tyyppi.value}" ei kelpaa. Kirjoita joko "monivalinta" tai "avoin".`);
        ok = false;
      }
    }

    let image: Riddle['image'] = null;
    if (kuva && emojit) {
      err(emojit.line, 'kortissa on sekä "kuva" että "emojit". Arvoituksessa on joko kuva tai emojit, ei molempia.');
      ok = false;
    } else if (!kuva && !emojit) {
      errors.push({ line: at, message: `Rivillä ${at} alkavasta kortista puuttuu "kuva" tai "emojit".` });
      ok = false;
    }
    if (kuva) {
      const [file, ...extras] = kuva.value.split('+').map((part) => part.trim());
      if (!IMAGE_FILE.test(file)) {
        err(kuva.line, `kuvan nimi "${file}" ei kelpaa. Käytä pieniä kirjaimia, numeroita ja väliviivoja sekä päätettä .png, .jpg tai .webp, esimerkiksi "arvoitus-kuu.png".`);
        ok = false;
      }
      if (extras.some((part) => part === '' || Array.from(part).length > 6) || extras.length > 2) {
        err(kuva.line, 'kuvan perään voi lisätä enintään kaksi lyhyttä tekstiä plusmerkillä, esimerkiksi "arvoitus-hirvi.png + Ö".');
        ok = false;
      }
      image = { file, extras };
    }
    if (emojit && Array.from(emojit.value.replace(/\s/g, '')).length > 16) {
      err(emojit.line, 'emojeja on liikaa. Käytä enintään noin kuutta emojia.');
      ok = false;
    }

    if (!kysymys) {
      errors.push({ line: at, message: `Rivillä ${at} alkavasta kortista puuttuu kohta "kysymys", esimerkiksi "kysymys: Mikä kauhuelokuva?".` });
      ok = false;
    } else if (Array.from(kysymys.value).length > MAX_QUESTION) {
      err(kysymys.line, `kysymys on liian pitkä (${Array.from(kysymys.value).length} merkkiä). Enintään ${MAX_QUESTION} merkkiä.`);
      ok = false;
    }

    let answers: string[] = [];
    let wrongOptions: string[] = [];
    if (!vastaus) {
      errors.push({ line: at, message: `Rivillä ${at} alkavasta kortista puuttuu kohta "vastaus".` });
      ok = false;
    } else {
      answers = splitList(vastaus.value);
      if (kind === 'monivalinta' && answers.length !== 1) {
        err(vastaus.line, 'monivalinnassa on yksi oikea vastaus. Laita väärät vaihtoehdot kohtaan "väärät".');
        ok = false;
      }
      const limit = kind === 'monivalinta' ? MAX_OPTION : MAX_ANSWER;
      for (const answer of answers) {
        if (Array.from(answer).length > limit) {
          err(vastaus.line, `vastaus "${answer}" on liian pitkä. Enintään ${limit} merkkiä.`);
          ok = false;
        }
      }
    }
    if (kind === 'monivalinta') {
      if (!vaarat) {
        errors.push({ line: at, message: `Rivillä ${at} alkavasta monivalinnasta puuttuu kohta "väärät" (kolme väärää vaihtoehtoa puolipisteillä erotettuina).` });
        ok = false;
      } else {
        wrongOptions = splitList(vaarat.value);
        if (wrongOptions.length !== 3) {
          err(vaarat.line, `monivalinnassa pitää olla tasan 3 väärää vaihtoehtoa puolipisteillä erotettuina, nyt niitä on ${wrongOptions.length}.`);
          ok = false;
        }
        for (const option of wrongOptions) {
          if (Array.from(option).length > MAX_OPTION) {
            err(vaarat.line, `vaihtoehto "${option}" on liian pitkä. Enintään ${MAX_OPTION} merkkiä.`);
            ok = false;
          }
        }
        const all = [...answers, ...wrongOptions].map(normalizeAnswer);
        if (new Set(all).size !== all.length) {
          err(vaarat.line, 'vaihtoehdoissa on sama vaihtoehto kahdesti, tai väärä vaihtoehto on sama kuin oikea vastaus.');
          ok = false;
        }
      }
    } else if (kind === 'avoin' && vaarat) {
      err(vaarat.line, 'kohta "väärät" kuuluu vain monivalintaan. Poista se tai vaihda tyypiksi "monivalinta".');
      ok = false;
    }

    if (ok && kind && kysymys) {
      riddles.push({ kind, image, emojis: emojit ? emojit.value.replace(/\s+/g, ' ') : null, question: kysymys.value, answers, wrongOptions });
    }
  }

  if (cards.length === 0 && errors.length === 0) {
    errors.push({ line: null, message: `Tiedostossa ei ole yhtään arvoitusta. Arvoituksia pitää olla tasan ${riddlesPerRound}.` });
  } else if (cards.length !== riddlesPerRound) {
    errors.push({
      line: null,
      message: `Arvoituksia pitää olla tasan ${riddlesPerRound}, nyt niitä on ${cards.length}. Jokainen arvoitus on oma korttinsa, ja korttien välissä on tyhjä rivi.`,
    });
  } else if (errors.length === 0) {
    const multiple = riddles.filter((r) => r.kind === 'monivalinta').length;
    if (multiple !== multipleChoiceCount) {
      errors.push({
        line: null,
        message: `Monivalintoja pitää olla ${multipleChoiceCount} ja avoimia ${riddlesPerRound - multipleChoiceCount}, nyt monivalintoja on ${multiple}.`,
      });
    }
  }

  errors.sort((a, b) => (a.line ?? Infinity) - (b.line ?? Infinity));
  return errors.length > 0 ? { ok: false, errors } : { ok: true, riddles };
}
