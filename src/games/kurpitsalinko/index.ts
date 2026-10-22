import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { LEVELS } from './levels';
import { totalSkeletons } from './logic';
import { META } from './meta';
import { PiiritysScene } from './PiiritysScene';

/** 7. Kurpitsalinko – drawn style, Worms-like. Rules: CLAUDE.md, game 7, and Pasi's choices 22.10. */
const kurpitsalinko: GameDefinition = {
  ...META,
  sceneKey: 'Kurpitsalinko',
  sceneClass: PiiritysScene,
  instructions: {
    goal: `Kurpitsapäinen soturi piirittää luurankolinnaa. Kaada katapultilla kaikki ${totalSkeletons()} luurankoa ${LEVELS.length} kentässä mahdollisimman vähillä laukauksilla.`,
    keys: [
      ['↑↓', 'Muuta kulmaa'],
      ['←→', 'Muuta kulmaa tarkasti'],
      ['Välilyönti', 'Pidä pohjassa: voima heiluu. Päästä irti: laukaus'],
      ['1–5', 'Valitse ase'],
    ],
    rules: [
      'Kurpitsa räjähtää osuessaan ja kaataa lähellä olevat luurangot. Räjähdys tekee maahan kuopan.',
      'Luuranko hajoaa myös, jos se putoaa korkealta, vallihautaan tai kentän ulkopuolelle.',
      'Ruutitynnyri räjähtää osumasta, ja puurakenteet hajoavat helposti.',
      'Tavallisia kurpitsoja on loputtomasti. Jokaista erikoisasetta saa käyttää kerran kentässä: rypälekurpitsa, ohjautuva kurpitsa, maaston läpäisevä kurpitsasäde ja iso kurpitsapommi.',
      'Kentästä 3 alkaen osa luurangoista liikkuu laukausten välissä. Edellisen laukauksen rata jää näkyviin.',
    ],
    scoring: ['1 000 × luurangot ÷ laukaukset. Jokainen huti vähentää pisteitä, ensimmäinen eniten.'],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default kurpitsalinko;
