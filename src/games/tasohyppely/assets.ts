import { CONFIG } from '../../config';
import type { AssetSpec } from '../types';
import type { Theme } from './levels';
import { P } from './pixel';
import { DECOR_FRAMES, drawDecor, drawLandscape, drawPreview, drawSky, drawTiles, TILE_FRAMES } from './scenery';
import {
  drawArmor,
  drawAxe,
  drawBat,
  drawBlade,
  drawCandle,
  drawCoin,
  drawDagger,
  drawDaggerItem,
  drawGate,
  drawHeartItem,
  drawHudHeart,
  drawHunter,
  drawMushroom,
  drawOrb,
  drawRaven,
  drawSkeleton,
  drawSkull,
  drawSpider,
  drawSpore,
  drawWhip,
  drawWhipItem,
  drawWisp,
  drawWitch,
  drawWolf,
  drawZombie,
  HUNTER_FRAMES,
} from './sprites';

/*
 * Images of the platformer (Pasi 21.10.: pixel art, one pixel = 3 × 3
 * points). Pasi can replace any of them with a file of the same name in
 * public/assets/. No Phaser import: scripts/kuvalista.ts reads this file.
 */

const STYLE = 'Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.';
const SPRITE = 'Hahmo katsoo oikealle. Kaikki ruudut ovat samankokoisia, ja hahmon jalat ovat ruudun alareunassa.';

function sprite(file: string, title: string, prompt: string, width: number, height: number, draw: AssetSpec['draw'], frames?: AssetSpec['frames']): AssetSpec {
  return { file, title, prompt, style: STYLE, transparent: true, width, height, frames, draw };
}

/** The visible whip lengths (pixels) match the reach of each level from the hand. */
const WHIP_PIXELS = CONFIG.tasohyppely.whipReach.map((reach) => Math.round((reach - 19) / P));

export const HUNTER = sprite(
  'tasohyppely-metsastaja.png',
  'Vampyyrimetsästäjä',
  `Pelin sankari: vampyyrimetsästäjä, jolla on valkoinen tukka, pitkä tummanpunainen takki, harmaa kaulahuivi, tummat housut ja ruskeat nahkasaappaat. Ruoskaa ei piirretä kuvaan, sillä peli piirtää sen erikseen. ${SPRITE}`,
  72,
  96,
  drawHunter,
  { count: HUNTER_FRAMES.length, order: HUNTER_FRAMES.join(', ') },
);

export const WHIP = sprite(
  'tasohyppely-ruoska.png',
  'Ruoska',
  'Ojennettu ruoska sivulta, kahvan pää vasemmassa reunassa keskellä. Viisi tasoa lyhimmästä pisimpään: nahkaruoska, piikkiketju, hopearuoska, liekehtivä ruoska ja salamaruoska.',
  168,
  24,
  (ctx) => drawWhip(ctx, WHIP_PIXELS),
  { count: 5, order: 'nahkaruoska, piikkiketju, hopearuoska, liekehtivä ruoska, salamaruoska' },
);

export const ZOMBIE = sprite('tasohyppely-zombi.png', 'Zombi', `Laahustava zombi, harmaanvihreä iho, repaleiset vaatteet, kädet ojossa. ${SPRITE}`, 48, 96, drawZombie, {
  count: 2,
  order: 'kävely 1, kävely 2',
});
export const BAT = sprite('tasohyppely-lepakko.png', 'Lepakko', 'Tumma lepakko punaisin silmin.', 48, 36, drawBat, { count: 3, order: 'roikkuu siivet suljettuina, siivet ylhäällä, siivet alhaalla' });
export const RAVEN = sprite('tasohyppely-korppi.png', 'Korppi', 'Musta korppi keltaisella nokalla, katsoo oikealle.', 48, 42, drawRaven, { count: 3, order: 'istuu, siivet ylhäällä, siivet alhaalla' });
export const ARMOR = sprite('tasohyppely-haarniska.png', 'Haarniska', `Tyhjä, liikkuva ritarihaarniska, jossa on punainen kypäräntöyhtö ja kirves. ${SPRITE}`, 60, 96, drawArmor, {
  count: 3,
  order: 'kävely 1, kävely 2, kirves nostettuna heittoon',
});
export const AXE = sprite('tasohyppely-kirves.png', 'Kirves', 'Heitetty pieni kirves (peli pyörittää sitä).', 30, 30, drawAxe);
export const SKULL = sprite('tasohyppely-kallo.png', 'Liekehtivä kallo', 'Lentävä pääkallo, jonka perässä liekit loimuavat vasemmalle.', 48, 48, drawSkull, { count: 2, order: 'liekit 1, liekit 2' });
export const SPIDER = sprite('tasohyppely-hamahakki.png', 'Hämähäkki', 'Iso musta hämähäkki ylhäältä päin, punainen merkki selässä.', 42, 36, drawSpider, { count: 2, order: 'jalat 1, jalat 2' });
export const WISP = sprite('tasohyppely-virvatuli.png', 'Virvatuli', 'Leijuva kylmä virvatuli, turkoosi hehku ja valkoinen ydin.', 36, 36, drawWisp, { count: 2, order: 'hehku 1, hehku 2' });
export const MUSHROOM = sprite('tasohyppely-sieni.png', 'Myrkkysieni', 'Vihainen myrkkysieni, violetti lakki ja vihreät pilkut.', 48, 48, drawMushroom, { count: 2, order: 'paikallaan, puhaltaa itiöitä' });
export const SPORE = sprite('tasohyppely-itio.png', 'Itiö', 'Pieni hehkuvan vihreä myrkkyitiö.', 18, 18, drawSpore);
export const WOLF = sprite('tasohyppely-susi.png', 'Susi', 'Tummanharmaa susi keltaisin silmin, katsoo oikealle.', 78, 48, drawWolf, { count: 3, order: 'istuu ja ulvoo, juoksee 1, juoksee 2' });
export const SKELETON = sprite('tasohyppely-luuranko.png', 'Luuranko', `Maasta noussut luuranko, kädet ojossa. ${SPRITE}`, 48, 96, drawSkeleton, { count: 2, order: 'kävely 1, kävely 2' });
export const WITCH = sprite(
  'tasohyppely-paanoita.png',
  'Päänoita',
  'Pelin loppuvastus: vanha päänoita lentää luudalla. Musta suippo hattu, violetti kaapu, harmaa tukka, vihertävä iho ja punaiset silmät. Katsoo oikealle.',
  96,
  96,
  drawWitch,
  { count: 4, order: 'lento 1, lento 2, loitsii käsi ylhäällä, saa osuman' },
);
export const ORB = sprite('tasohyppely-taikapallo.png', 'Taikapallo', 'Hehkuva violetti taikapallo.', 24, 24, drawOrb, { count: 2, order: 'sykkii 1, sykkii 2' });
export const CANDLE = sprite('tasohyppely-kynttila.png', 'Kynttilä', 'Palava kynttilä rautaisella jalustalla.', 24, 48, drawCandle, { count: 2, order: 'liekki 1, liekki 2' });
export const HEART_ITEM = sprite('tasohyppely-sydan-esine.png', 'Puolikas sydän', 'Puolikas punainen sydän (vasen puolisko), kerättävä esine.', 24, 24, drawHeartItem);
export const WHIP_ITEM = sprite('tasohyppely-ruoska-esine.png', 'Ruoskan päivitys', 'Kerällä oleva kultainen ruoska, kerättävä esine.', 30, 30, drawWhipItem);
export const DAGGER = sprite('tasohyppely-tikari.png', 'Heitettävä tikari', 'Lentävä heittotikari sivulta, kärki oikealle.', 30, 12, drawDagger);
export const DAGGER_ITEM = sprite('tasohyppely-tikarit-esine.png', 'Tikarinippu', 'Viuhkaksi aseteltu nippu heittotikareita, kerättävä esine.', 30, 30, drawDaggerItem);
export const COIN = sprite('tasohyppely-kolikko.png', 'Kolikko', 'Kiiltävä kultakolikko, jonka saa jokaisesta kynttilästä.', 24, 24, drawCoin);
export const HUD_HEART = sprite('tasohyppely-sydan.png', 'Sydän tilarivillä', 'Pieni sydän, joka näyttää jäljellä olevat health-pisteet.', 30, 27, drawHudHeart, { count: 3, order: 'täysi, puolikas, tyhjä' });
export const BLADE = sprite('tasohyppely-heilurin-tera.png', 'Heilurin terä', 'Kuunsirpin muotoinen terästerä, kiinnityslenkki ylhäällä keskellä. Peli piirtää tangon.', 72, 48, drawBlade);
export const GATE = sprite('tasohyppely-portti.png', 'Kentän maaliportti', 'Goottilainen kivikaari, jonka rautaovien raoista hohtaa lämmin valo.', 96, 144, drawGate);

const THEME_NAMES: Record<Theme, string> = { hautausmaa: 'hautausmaa', linna: 'linna', metsa: 'noidan metsä' };

function themeAssets(theme: Theme, landscapeHeight: number, landscape: string, sky: string, tiles: string): { tiles: AssetSpec; sky: AssetSpec; landscape: AssetSpec; decor: AssetSpec } {
  const name = THEME_NAMES[theme];
  return {
    tiles: {
      file: `tasohyppely-palat-${theme}.png`,
      title: `Maaston palat: ${name}`,
      prompt: `Maaston ruudut, jotka toistuvat saumattomasti vierekkäin. ${tiles} Taso, liikkuvan tason puolikkaat ja pinta ovat ruudun yläreunassa.`,
      style: STYLE,
      transparent: true,
      width: 48,
      height: 48,
      frames: { count: TILE_FRAMES.length, order: TILE_FRAMES.join(', ') },
      draw: drawTiles(theme),
    },
    sky: {
      file: `tasohyppely-taivas-${theme}.png`,
      title: `Taivas: ${name}`,
      prompt: sky,
      style: STYLE,
      transparent: false,
      width: 1280,
      height: 720,
      draw: drawSky(theme),
    },
    landscape: {
      file: `tasohyppely-maisema-${theme}.png`,
      title: `Kaukainen maisema: ${name}`,
      prompt: `${landscape} Kuvan vasen ja oikea reuna jatkuvat saumattomasti toisiinsa, koska kuva toistuu sivuttain.`,
      style: STYLE,
      transparent: true,
      width: 1280,
      height: landscapeHeight,
      draw: drawLandscape(theme),
    },
    decor: {
      file: `tasohyppely-koriste-${theme}.png`,
      title: `Koristeet: ${name}`,
      prompt: 'Pieniä koristeita, jotka seisovat maassa (ruudun alareunassa).',
      style: STYLE,
      transparent: true,
      width: 48,
      height: 96,
      frames: { count: 4, order: DECOR_FRAMES[theme].join(', ') },
      draw: drawDecor(theme),
    },
  };
}

export const THEMES: Record<Theme, ReturnType<typeof themeAssets>> = {
  hautausmaa: themeAssets(
    'hautausmaa',
    400,
    'Kaukaisia kumpuja, pieni kappeli kukkulalla, kuolleita puita ja ristejä tummina siluetteina.',
    'Violetti yötaivas, iso vaalea täysikuu oikealla ylhäällä ja tähtiä.',
    'Hautausmaan multaa: pinta, jossa on ruohoa, multaa sisältä (kiviä ja luita), kivilaatta, halkeillut kivi, joka sortuu, ja puinen lankku.',
  ),
  linna: themeAssets(
    'linna',
    720,
    'Linnan sisäseinä: tummaa kiveä, pylväitä, korkeita kuunvalaisia ikkunoita ja punaisia viirejä.',
    'Tumma yötaivas ja punainen verikuu vasemmalla ylhäällä.',
    'Linnan kivitiiliä: pinta, tiilet sisältä, puinen palkki, halkeillut tiili, joka sortuu, ja rautaritilä.',
  ),
  metsa: themeAssets(
    'metsa',
    420,
    'Tiheän noitametsän puunrunkoja ja oksia tummina siluetteina, välissä tulikärpäsiä.',
    'Tummanvihreä yötaivas, utuinen kuu oikealla ylhäällä ja sumua alhaalla.',
    'Metsän maata: sammaleinen pinta, multaa ja juuria, oksa, laho tukki, joka sortuu, ja sammaloitunut kivilaatta.',
  ),
};

export const PREVIEW: AssetSpec = {
  file: 'tasohyppely-esikatselu.png',
  title: 'Valikon esikatselukuva',
  prompt: 'Vampyyrimetsästäjä lyö ruoskalla zombia kuutamoisella hautausmaalla, kynttilä palaa taustalla.',
  style: STYLE,
  transparent: false,
  width: 360,
  height: 200,
  draw: drawPreview,
};

export const ASSETS: AssetSpec[] = [
  HUNTER,
  WHIP,
  ZOMBIE,
  BAT,
  RAVEN,
  ARMOR,
  AXE,
  SKULL,
  SPIDER,
  WISP,
  MUSHROOM,
  SPORE,
  WOLF,
  SKELETON,
  WITCH,
  ORB,
  CANDLE,
  HEART_ITEM,
  WHIP_ITEM,
  DAGGER,
  DAGGER_ITEM,
  COIN,
  HUD_HEART,
  BLADE,
  GATE,
  ...Object.values(THEMES).flatMap((t) => [t.tiles, t.sky, t.landscape, t.decor]),
];
