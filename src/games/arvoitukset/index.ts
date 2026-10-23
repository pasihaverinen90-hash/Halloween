import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ArvoitusScene } from './ArvoitusScene';
import { ASSETS, PICTURE_EMOJIS, PREVIEW } from './assets';
import { ARVOITUKSET_CONTENT } from './content';
import { META } from './meta';

const { riddlesPerRound, secondsPerRiddle } = CONFIG.arvoitukset;
const freeplayCount = ARVOITUKSET_CONTENT.ok ? ARVOITUKSET_CONTENT.riddles.length : riddlesPerRound;
const contentEmojis = ARVOITUKSET_CONTENT.ok ? ARVOITUKSET_CONTENT.riddles.map((r) => r.emojis ?? '').join('') : '';

/** 2. Kuva-arvoitukset – drawn style. Rules: CLAUDE.md, game 2. */
const arvoitukset: GameDefinition = {
  ...META,
  sceneKey: 'Arvoitukset',
  sceneClass: ArvoitusScene,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: `Ratkaise ${riddlesPerRound} kuva-arvoitusta kauhuelokuvista ja Halloweenista.`,
    keys: [
      ['A–Ö', 'Kirjoita vastaus'],
      ['Enter', 'Vastaa'],
    ],
    rules: [`Kuhunkin arvoitukseen on aikaa ${secondsPerRiddle} sekuntia.`, 'Vastata saa monta kertaa.'],
    scoring: ['Ole nopea. Väärät vastaukset vievät pisteitä.'],
  },
  // Pasi 23.10.: freeplay also has the riddles marked "vain: freeplay".
  freeplayInstructions: {
    goal: `Ratkaise ${freeplayCount} kuva-arvoitusta kauhuelokuvista ja Halloweenista.`,
  },
  preview: PREVIEW,
  assets: ASSETS,
  preloadText: `${PICTURE_EMOJIS}${contentEmojis}🦇🎃👻🕯️`,
};

export default arvoitukset;
