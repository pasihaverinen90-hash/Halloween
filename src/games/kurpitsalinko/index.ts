import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { LEVELS } from './levels';
import { META } from './meta';
import { PiiritysScene } from './PiiritysScene';

/** 7. Kurpitsalinko – drawn style, Worms-like. Rules: CLAUDE.md, game 7, and Pasi's choices 22.10. */
const kurpitsalinko: GameDefinition = {
  ...META,
  sceneKey: 'Kurpitsalinko',
  sceneClass: PiiritysScene,
  // Pasi 22.10.: two attempts; the first is a kind of practice round.
  attempts: CONFIG.kurpitsalinko.attempts,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: `Kaada katapultilla kaikki luurangot ${LEVELS.length} kentässä.`,
    keys: [
      ['↑↓', 'Kulma'],
      ['←→', 'Tarkka kulma'],
      ['Välilyönti', 'Pidä pohjassa ja päästä irti'],
      ['1–5', 'Valitse ase'],
      ['A / D', 'Katso kenttää'],
    ],
    rules: [
      'Kurpitsa räjähtää ja kaataa lähellä olevat luurangot.',
      'Erikoisaseita on rajallisesti. Lisää saa laatikoista.',
      'Ammu −2:n tai −5:n läpi, niin laukauksia vähennetään.',
    ],
    scoring: ['Mitä vähemmän laukauksia, sitä enemmän pisteitä.'],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default kurpitsalinko;
