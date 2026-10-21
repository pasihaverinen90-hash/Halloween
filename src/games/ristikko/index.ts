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
  instructions: {
    goal: 'Ratkaise kauhuaiheinen ristikko. Kaikki pelaavat saman ristikon.',
    keys: [
      ['←→↑↓', 'Liiku (tai valitse ruutu hiirellä)'],
      ['Välilyönti', 'Vaihda suuntaa (vaaka / pysty)'],
      ['Backspace', 'Pyyhi kirjain'],
      ['Enter ×2', `Vihje: ${C.revealCount} kirjainta (−${C.revealPenaltySeconds} s)`],
    ],
    rules: [
      `Aikaa on ${C.seconds / 60} minuuttia. Kirjoita kirjaimet näppäimistöltä.`,
      'Kun sanan kaikki ruudut on täytetty, peli tarkistaa sen. Oikea sana lukittuu, ja kohdistin siirtyy seuraavaan sanaan.',
      `Väärä sana välähtää punaisena, sen väärät kirjaimet poistuvat ja ajasta lähtee ${C.wrongWordPenaltySeconds} sekuntia.`,
      `Vihje paljastaa ${C.revealCount} satunnaista puuttuvaa kirjainta koko ristikosta ja vie ${C.revealPenaltySeconds} sekuntia. Kokonaan paljastettu sana ei tuo pisteitä.`,
    ],
    scoring: [
      `Oikeat sanat: enintään ${C.wordPoints}.`,
      `Aika: ${C.timePoints}, kun ratkaiset kaiken ${C.fullTimePointsWithinSeconds / 60} minuutissa, sitten vähemmän.`,
    ],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default ristikko;
