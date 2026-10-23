import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { META } from './meta';
import { RistikkoScene } from './RistikkoScene';

const C = CONFIG.ristikko;

/** 5. Ristikko – drawn style. Rules: CLAUDE.md, game 5, and Pasi's choices 20.10. */
const ristikko: GameDefinition = {
  ...META,
  sceneKey: 'Ristikko',
  sceneClass: RistikkoScene,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: 'Ratkaise kauhuaiheinen ristikko.',
    keys: [
      ['←→↑↓', 'Liiku'],
      ['Välilyönti', 'Vaihda suuntaa'],
      ['Backspace', 'Pyyhi kirjain'],
      ['Enter ×2', `Vihje (−${C.revealPenaltySeconds} s)`],
    ],
    rules: [`Aikaa on ${C.seconds / 60} minuuttia.`, `Valmis sana tarkistetaan heti. Väärä sana vie ${C.wrongWordPenaltySeconds} sekuntia.`],
    scoring: ['Ratkaise mahdollisimman monta sanaa mahdollisimman nopeasti.'],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default ristikko;
