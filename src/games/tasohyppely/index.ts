import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { META } from './meta';
import { continueNote } from './shop';
import { TasohyppelyScene } from './TasohyppelyScene';

const C = CONFIG.tasohyppely;
const fi = (n: number): string => n.toLocaleString('fi-FI');

/** 6. Tasohyppely – pixel art, Castlevania-like. Rules: CLAUDE.md, game 6, and Pasi's choices 21.10. */
const tasohyppely: GameDefinition = {
  ...META,
  sceneKey: 'Tasohyppely',
  sceneClass: TasohyppelyScene,
  // Pasi 22.10.: five attempts, and each continues from the level where the previous one ended.
  attempts: C.attempts,
  attemptNote: continueNote,
  instructions: {
    goal: 'Vampyyrimetsästäjä kulkee hautausmaan, linnan ja noidan metsän läpi. Metsän perällä odottaa päänoita.',
    keys: [
      ['←→', 'Liiku'],
      ['Välilyönti', 'Hyppää (ilmassa vielä kerran)'],
      ['X', 'Lyö ruoskalla (↑ + X lyö ylöspäin)'],
      ['C', 'Heitä tikari'],
      ['↓', 'Kyyristy (X lyö matalalta)'],
    ],
    rules: [
      `Jokaisen kentän alussa sinulla on ${C.maxHealth} sydäntä. Vihollinen, ammus, terä ja kuoppaan putoaminen vievät yhden.`,
      'Kun sydämet loppuvat, yritys päättyy. Seuraava yritys jatkuu saman kentän alusta, ja tavarat ovat kuten kentän alkaessa.',
      'Tason läpi pääsee alas painamalla ↓ ja välilyöntiä yhtä aikaa.',
      'Jokaisesta kynttilästä saa kolikon. Ennen kenttiä 2 ja 3 kolikoilla voi ostaa tikareita, lisäsydämiä, paremman ruoskan ja teroitusta.',
      'Kaatuneet viholliset pudottavat joskus tikareita, puolikkaan sydämen tai ruoskan päivityksen.',
      `Ruoskassa on viisi tasoa, ja tikareita on alussa ${C.daggersStart} (enintään ${C.daggersMax}).`,
      'Varo kuoppia, sortuvia lattioita ja heiluvia teriä. Terän alta pääsee kyyristymällä, ja liikkuvat tasot kuljettavat kuoppien yli.',
    ],
    scoring: [
      `Edetty matka: enintään ${fi(C.distancePoints)} (${fi(C.distancePoints / 3)} kentältä).`,
      `Lyödyt kynttilät: enintään ${fi(C.candlePoints)}.`,
      `Päänoidan kestävyydestä: enintään ${fi(C.bossPoints)}.`,
    ],
    attemptRule: `${C.attempts} yritystä. Paras jää voimaan. Päänoidan kaatuminen tai ${fi(CONFIG.maxScore)} pistettä päättää pelin.`,
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default tasohyppely;
