import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { META } from './meta';
import { continueNote } from './shop';
import { TasohyppelyScene } from './TasohyppelyScene';

const C = CONFIG.tasohyppely;

/** 6. Tasohyppely – pixel art, Castlevania-like. Rules: CLAUDE.md, game 6, and Pasi's choices 21.10. */
const tasohyppely: GameDefinition = {
  ...META,
  sceneKey: 'Tasohyppely',
  sceneClass: TasohyppelyScene,
  // Pasi 23.10.: three attempts (before 5), and each continues from the level where the previous one ended.
  attempts: C.attempts,
  attemptNote: continueNote,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: 'Kulje hautausmaan, linnan ja noidan metsän läpi ja kaada päänoita.',
    keys: [
      ['←→', 'Liiku'],
      ['Välilyönti', 'Hyppy ja tuplahyppy'],
      ['X', 'Lyö ruoskalla (↑ + X ylös)'],
      ['C', 'Heitä tikari'],
      ['↓', 'Kyyristy'],
      ['↓ + Välilyönti', 'Alas tasolta'],
    ],
    rules: [
      `Kentän alussa sinulla on ${C.maxHealth} sydäntä. Kun ne loppuvat, seuraava yritys jatkuu saman kentän alusta.`,
      'Kynttilöistä saa kolikoita. Kenttien välissä niillä voi ostaa varusteita.',
    ],
    scoring: ['Pääse pitkälle, lyö kynttilöitä ja kaada päänoita.'],
    attemptRule: `${C.attempts} yritystä. Paras jää voimaan.`,
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default tasohyppely;
