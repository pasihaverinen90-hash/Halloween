import { CONFIG } from '../../config';
import type { GameDefinition } from '../types';
import { ASSETS, PREVIEW } from './assets';
import { LEVELS } from './levels';
import { totalSkeletons } from './logic';
import { META } from './meta';
import { PiiritysScene } from './PiiritysScene';

/** "Laukauksia enintään luurangot + 3: 200. + 4–7: 150. …" from the settings. */
function pointStepsText(): string {
  const C = CONFIG.kurpitsalinko;
  let from = 0;
  const parts = C.pointSteps.map((step, i) => {
    const text = i === 0 ? `Laukauksia enintään luurangot + ${step.extra}: ${step.points}.` : `+ ${from}–${step.extra}: ${step.points}.`;
    from = step.extra + 1;
    return text;
  });
  return `${parts.join(' ')} Enemmän: ${C.fewestPoints}.`;
}

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
      'Tavallisia kurpitsoja on loputtomasti. Erikoisaseet (rypäle, ohjautuva, maaston läpäisevä säde ja iso pommi) säilyvät kentästä toiseen, ja niitä saa lisää laatikoista ja uusista kentistä.',
      'Ammu ilmassa leijuvan −1:n tai −3:n läpi, niin kentän laukauksista vähennetään sen verran.',
      'Kentästä 3 alkaen osa luurangoista liikkuu laukausten välissä. Edellisen laukauksen rata jää näkyviin, ja ylhäällä näkyy koko kentän kartta.',
    ],
    scoring: [
      'Jokaisesta kentästä enintään 200.',
      `${pointStepsText()} Ylhäällä näkyy, montako laukausta riittää täysiin pisteisiin.`,
    ],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default kurpitsalinko;
