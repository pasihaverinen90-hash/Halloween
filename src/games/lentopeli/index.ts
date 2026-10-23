import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { LentoScene } from './LentoScene';
import { META } from './meta';

const { maxCats } = CONFIG.lentopeli;

/** 3. Lentopeli – drawn style, Flappy Bird -like. Rules: CLAUDE.md, game 3. */
const lentopeli: GameDefinition = {
  ...META,
  sceneKey: 'Lentopeli',
  sceneClass: LentoScene,
  // Pasi 23.10.: two attempts, so the evening stays about 30 minutes per player.
  attempts: CONFIG.lentopeli.attempts,
  // Pasi 23.10.: short instructions; scoring only says what gives points.
  instructions: {
    goal: 'Lennätä noita esteiden ohi matkan päässä odottavaan maaliin.',
    keys: [['Välilyönti', 'Lennä ylöspäin']],
    rules: [`Musta kissa on lisäelämä. Kissoja voi olla enintään ${maxCats}.`, 'Törmäys vie kissan. Ilman kissaa yritys päättyy.'],
    scoring: ['Pääse mahdollisimman pitkälle. Maali antaa täydet pisteet.'],
  },
  // Pasi 23.10.: in freeplay the flight goes on until the witch falls, faster and faster.
  freeplayInstructions: {
    goal: 'Lennätä noita esteiden ohi niin pitkälle kuin pääset. Maalia ei ole, ja vauhti kasvaa koko ajan.',
    scoring: ['Pisteet tulevat lennetystä matkasta.'],
  },
  freeplayUncapped: true,
  preview: PREVIEW,
  assets: ASSETS,
};

export default lentopeli;
