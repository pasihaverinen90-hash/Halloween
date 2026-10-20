import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { HirsipuuScene } from './HirsipuuScene';
import { META } from './meta';

const { wordsPerRound, pointsPerWord, penaltyPerWrongLetter, maxWrongLetters } = CONFIG.hirsipuu;
const ORDINALS: Record<number, string> = { 5: 'Viides', 6: 'Kuudes', 7: 'Seitsemäs', 8: 'Kahdeksas', 9: 'Yhdeksäs', 10: 'Kymmenes' };
const failingLetter = ORDINALS[maxWrongLetters] ?? `${maxWrongLetters}.`;

/** 1. Hirsipuu – drawn style. Rules: CLAUDE.md, game 1. */
const hirsipuu: GameDefinition = {
  ...META,
  sceneKey: 'Hirsipuu',
  sceneClass: HirsipuuScene,
  instructions: {
    goal: `Arvaa ${wordsPerRound} Halloween-aiheista sanaa tai sanontaa kirjain kerrallaan. Jokaisessa sanassa näkyy vihje.`,
    keys: [
      ['A–Ö', 'Arvaa kirjain'],
      ['Enter', 'Seuraava sana'],
    ],
    rules: [
      'Välilyönnit ja välimerkit näkyvät valmiina.',
      'Sana on ratkaistu, kun kaikki sen kirjaimet ovat paikallaan. Koko sanaa ei arvata erikseen.',
      `Jokainen väärä kirjain lisää luurankoon yhden osan. ${failingLetter} väärä kirjain kaataa sanan, ja peli siirtyy seuraavaan sanaan.`,
      'Jo kokeiltu kirjain ei maksa mitään.',
      'Aikarajaa ei ole.',
    ],
    scoring: [
      `${pointsPerWord} pistettä jokaisesta sanasta.`,
      `Jokainen väärä kirjain: −${penaltyPerWrongLetter} pistettä.`,
      'Epäonnistunut sana: 0 pistettä.',
    ],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default hirsipuu;
