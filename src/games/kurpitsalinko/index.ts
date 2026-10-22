import { CONFIG } from '../../config';
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
  // Pasi 22.10.: two attempts; the first is a kind of practice round.
  attempts: CONFIG.kurpitsalinko.attempts,
  instructions: {
    goal: `Kurpitsapäinen soturi piirittää luurankolinnaa. Kaada katapultilla kaikki ${totalSkeletons()} luurankoa ${LEVELS.length} kentässä mahdollisimman vähillä laukauksilla.`,
    keys: [
      ['↑↓', 'Muuta kulmaa'],
      ['←→', 'Muuta kulmaa tarkasti'],
      ['Välilyönti', 'Pidä pohjassa: voima heiluu. Päästä irti: laukaus'],
      ['1–5', 'Valitse ase'],
      ['A / D', 'Katso kenttää vasemmalle ja oikealle'],
    ],
    rules: [
      'Kurpitsa räjähtää osuessaan ja kaataa lähellä olevat luurangot. Räjähdys tekee maahan kuopan.',
      'Luuranko hajoaa myös, jos se putoaa korkealta, vallihautaan tai kentän ulkopuolelle.',
      'Ruutitynnyri räjähtää osumasta, ja puurakenteet hajoavat helposti.',
      'Tavallisia kurpitsoja on loputtomasti. Jokaista erikoisasetta saa käyttää kerran kentässä: rypälekurpitsa, ohjautuva kurpitsa, maaston läpäisevä kurpitsasäde ja iso kurpitsapommi.',
      'Kentästä 3 alkaen osa luurangoista liikkuu laukausten välissä. Edellisen laukauksen rata jää näkyviin, ja ylhäällä näkyy koko kentän kartta.',
    ],
    scoring: [
      'Jokaisesta kentästä enintään 200.',
      'Laukauksia enintään luurangot + 1: 200. + 2–5: 150. + 6–10: 100. + 11–15: 50. Enemmän: 25.',
    ],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default kurpitsalinko;
