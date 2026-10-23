import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { HirsipuuScene } from './HirsipuuScene';
import { META } from './meta';

const { wordsPerRound, maxWrongLetters } = CONFIG.hirsipuu;
const ORDINALS: Record<number, string> = { 5: 'Viides', 6: 'Kuudes', 7: 'Seitsemäs', 8: 'Kahdeksas', 9: 'Yhdeksäs', 10: 'Kymmenes' };
const failingLetter = ORDINALS[maxWrongLetters] ?? `${maxWrongLetters}.`;

/** 1. Hirsipuu – drawn style. Rules: CLAUDE.md, game 1. */
const hirsipuu: GameDefinition = {
  ...META,
  sceneKey: 'Hirsipuu',
  sceneClass: HirsipuuScene,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: `Arvaa ${wordsPerRound} Halloween-aiheista sanaa kirjain kerrallaan. Vihje auttaa.`,
    keys: [
      ['A–Ö', 'Arvaa kirjain'],
      ['Enter', 'Seuraava sana'],
    ],
    rules: [`Jokainen väärä kirjain lisää luurankoon osan. ${failingLetter} väärä kirjain kaataa sanan.`, 'Aikarajaa ei ole.'],
    scoring: ['Mitä vähemmän vääriä kirjaimia, sitä enemmän pisteitä.'],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default hirsipuu;
