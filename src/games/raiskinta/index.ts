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
  instructions: {
    goal: `Paavi puolustaa hautausmaata Halloween-olentoja vastaan. Selviä ${minutes} minuuttia ja kaada lopuksi Paholainen.`,
    keys: [
      ['←→↑↓', 'Liiku'],
      ['Välilyönti', `Heitä pyhää vettä (alussa ${C.holyWaterStart} pulloa)`],
    ],
    rules: [
      'Paavi ampuu itse. Sinä liikutat häntä ja väistelet vihollisia ja niiden ammuksia.',
      `Paavi kestää ${C.maxHealth} osumaa. Matkan varrella putoaa ${C.lifeDropTimes.length} kultaista ristiä, joista kukin palauttaa yhden.`,
      'Pyhä vesi vahingoittaa kaikkia näkyviä vihollisia ja hävittää niiden ammukset.',
      'Liitonarkku parantaa asetta, ja pyhä malja tuo paavin ympärille kiertävän suojapallon.',
      'Tuhottu vihollinen voi pudottaa boostin: nopea tuli, hajaammus, suojakehä tai pyhää vettä.',
      `Vihollisia tulee koko ajan enemmän. ${minutes} minuutin kohdalla saapuu Paholainen.`,
    ],
    scoring: [
      `Tuhotut viholliset: enintään ${C.enemyPoints} (osuus kaikista).`,
      `Selviytyminen ${minutes} minuuttia: enintään ${C.survivalPoints}.`,
      `Paholaisen kaataminen: ${C.bossPoints}.`,
    ],
  },
  preview: PREVIEW,
  assets: ASSETS,
};

export default raiskinta;
