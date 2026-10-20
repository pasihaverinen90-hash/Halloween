import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { LentoScene } from './LentoScene';
import { META } from './meta';

const { easySeconds, maxCats } = CONFIG.lentopeli;

/** 3. Lentopeli – drawn style, Flappy Bird -like. Rules: CLAUDE.md, game 3. */
const lentopeli: GameDefinition = {
  ...META,
  sceneKey: 'Lentopeli',
  sceneClass: LentoScene,
  instructions: {
    goal: 'Lennätä noita luudalla esteiden välistä matkan päässä odottavaan maaliin.',
    keys: [['Välilyönti', 'Lennä ylöspäin']],
    rules: [
      'Noita laskee koko ajan. Jokainen välilyönnin painallus nostaa sitä.',
      'Varo riippuvia häkkejä ja pylväillä seisovia inkvisiittoreita. Maata pitkin voi liukua.',
      `Kerää mustia kissoja: kissa on lisäelämä. Kissoja voi olla enintään ${maxCats}.`,
      'Kun törmäät, menetät kissan ja vauhti pysähtyy. Ilman kissaa törmäys päättää yrityksen.',
      `Ensimmäiset ${easySeconds} sekuntia ovat helppoja, ja sen jälkeen peli vaikeutuu vähitellen.`,
    ],
    scoring: ['Maaliin pääsy: 1 000 pistettä.', 'Muuten pisteet tulevat lennetystä matkasta.'],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default lentopeli;
