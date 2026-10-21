import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { META } from './meta';
import { TasohyppelyScene } from './TasohyppelyScene';

const C = CONFIG.tasohyppely;
const fi = (n: number): string => n.toLocaleString('fi-FI');

/** 6. Tasohyppely – pixel art, Castlevania-like. Rules: CLAUDE.md, game 6, and Pasi's choices 21.10. */
const tasohyppely: GameDefinition = {
  ...META,
  sceneKey: 'Tasohyppely',
  sceneClass: TasohyppelyScene,
  instructions: {
    goal: 'Vampyyrimetsästäjä kulkee hautausmaan, linnan ja noidan metsän läpi. Metsän perällä odottaa päänoita.',
    keys: [
      ['←→', 'Liiku'],
      ['Välilyönti', 'Hyppää (ilmassa vielä kerran)'],
      ['X', 'Lyö ruoskalla'],
      ['↑ + X', 'Lyö ylöspäin'],
      ['↓', 'Kyyristy (X lyö matalalta)'],
      ['↓ + Välilyönti', 'Pudottaudu tason läpi'],
    ],
    rules: [
      `Jokaisen kentän alussa sinulla on ${C.maxHealth} sydäntä. Vihollinen, ammus, terä ja kuoppaan putoaminen vievät yhden.`,
      'Kun sydämet loppuvat, yritys päättyy, ja seuraava yritys alkaa hautausmaalta.',
      'Lyö kynttilöitä ruoskalla. Kaatuneet viholliset ja muutama kynttilä pudottavat puolikkaan sydämen tai ruoskan päivityksen.',
      'Ruoskassa on kolme tasoa. Päivitys pidentää sitä ja tekee siitä vahvemman, ja se säilyy koko yrityksen ajan.',
      'Varo kuoppia, sortuvia lattioita ja heiluvia teriä. Terän alta pääsee kyyristymällä, ja liikkuvat tasot kuljettavat kuoppien yli.',
    ],
    scoring: [
      `Edetty matka: enintään ${fi(C.distancePoints)} (${fi(C.distancePoints / 3)} kentältä).`,
      `Lyödyt kynttilät: enintään ${fi(C.candlePoints)}.`,
      `Päänoita: enintään ${fi(C.bossPoints)} sen mukaan, paljonko kestävyydestä veit.`,
    ],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default tasohyppely;
