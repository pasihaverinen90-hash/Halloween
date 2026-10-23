import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ArvoitusScene } from './ArvoitusScene';
import { ASSETS, PICTURE_EMOJIS, PREVIEW } from './assets';
import { ARVOITUKSET_CONTENT } from './content';
import { META } from './meta';

const { riddlesPerRound, secondsPerRiddle } = CONFIG.arvoitukset;
const contentEmojis = ARVOITUKSET_CONTENT.ok ? ARVOITUKSET_CONTENT.riddles.map((r) => r.emojis ?? '').join('') : '';

/** 2. Kuva-arvoitukset – drawn style. Rules: CLAUDE.md, game 2. */
const arvoitukset: GameDefinition = {
  ...META,
  sceneKey: 'Arvoitukset',
  sceneClass: ArvoitusScene,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: `Ratkaise ${riddlesPerRound} kuva- ja emojiarvoitusta Halloweenista ja kauhuelokuvista.`,
    keys: [
      ['A–Ö', 'Kirjoita vastaus'],
      ['←→↑↓', 'Valitse vaihtoehto'],
      ['Enter', 'Vastaa'],
    ],
    rules: [`Kuhunkin arvoitukseen on aikaa ${secondsPerRiddle} sekuntia.`, 'Monivalintaan saa vastata kerran, avoimeen monta kertaa.'],
    scoring: ['Ole nopea. Väärät vastaukset vievät pisteitä.'],
  },
  preview: PREVIEW,
  assets: ASSETS,
  preloadText: `${PICTURE_EMOJIS}${contentEmojis}🦇🎃👻🕯️`,
};

export default arvoitukset;
