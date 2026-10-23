import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { META } from './meta';
import { RaiskintaScene } from './RaiskintaScene';

const C = CONFIG.raiskinta;
const minutes = C.bossAfterSeconds / 60;

/** 4. Räiskintä – drawn style, Space Invaders -like. Rules: CLAUDE.md, game 4, and Pasi's choices 20.10. */
const raiskinta: GameDefinition = {
  ...META,
  sceneKey: 'Raiskinta',
  sceneClass: RaiskintaScene,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: `Suojele hautausmaata ${minutes} minuuttia ja kaada lopuksi Paholainen.`,
    keys: [
      ['←→↑↓', 'Liiku'],
      ['Välilyönti', 'Pyhä vesi (osuu kaikkiin)'],
    ],
    rules: [
      'Paavi ampuu itse. Sinä väistelet.',
      `Paavi kestää ${C.maxHealth} osumaa. Kultainen risti palauttaa yhden.`,
      'Kerää esineitä: ne parantavat asetta ja suojaavat.',
    ],
    scoring: ['Tuhoa vihollisia, selviydy pitkään ja kaada Paholainen.'],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default raiskinta;
