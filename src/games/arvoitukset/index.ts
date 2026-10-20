import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ArvoitusScene } from './ArvoitusScene';
import { ASSETS, PICTURE_EMOJIS, PREVIEW } from './assets';
import { ARVOITUKSET_CONTENT } from './content';
import { META } from './meta';

const { riddlesPerRound, secondsPerRiddle, maxPoints, minPoints, wrongAnswerPenalty } = CONFIG.arvoitukset;
const contentEmojis = ARVOITUKSET_CONTENT.ok ? ARVOITUKSET_CONTENT.riddles.map((r) => r.emojis ?? '').join('') : '';

/** 2. Kuva-arvoitukset – drawn style. Rules: CLAUDE.md, game 2. */
const arvoitukset: GameDefinition = {
  ...META,
  sceneKey: 'Arvoitukset',
  sceneClass: ArvoitusScene,
  instructions: {
    goal: `Ratkaise ${riddlesPerRound} arvoitusta Halloweenista ja kauhuelokuvista. Arvoituksessa on kuva tai emojeja, ja niistä pitää keksiä sana tai elokuva.`,
    keys: [
      ['A–Ö', 'Kirjoita vastaus'],
      ['←→↑↓', 'Valitse vaihtoehto'],
      ['Enter', 'Vastaa'],
    ],
    rules: [
      `Jokaiseen arvoitukseen on aikaa ${secondsPerRiddle} sekuntia. Ohitusta ei ole.`,
      'Monivalinnassa on neljä vaihtoehtoa, ja vastata saa vain kerran.',
      'Avoimeen arvoitukseen kirjoitetaan vastaus, ja yrittää saa monta kertaa. Isot ja pienet kirjaimet ja välilyönnit eivät haittaa.',
      'Kun aika loppuu, peli siirtyy seuraavaan arvoitukseen.',
    ],
    scoring: [
      `Oikea vastaus: ${maxPoints} p heti, ${minPoints} p viime hetkellä.`,
      `Väärä vastaus avoimeen: −${wrongAnswerPenalty} p.`,
      'Väärä monivalinta tai aika loppuu: 0 p.',
    ],
  },
  preview: PREVIEW,
  assets: ASSETS,
  preloadText: `${PICTURE_EMOJIS}${contentEmojis}🦇🎃👻🕯️`,
};

export default arvoitukset;
