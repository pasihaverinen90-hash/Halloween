import type { GameDefinition } from '../types';
import { HirsipuuScene } from './HirsipuuScene';

/** PLACEHOLDER definition – the real hangman replaces this. */
const hirsipuu: GameDefinition = {
  id: 'hirsipuu',
  name: 'Viimeinen sana',
  genre: 'Hirsipuu',
  kind: 'puzzle',
  sceneKey: 'Hirsipuu',
  sceneClass: HirsipuuScene,
  instructions: {
    goal: 'Arvaa viisi sanaa kirjain kerrallaan.',
    keys: [['A–Ö', 'Arvaa kirjain']],
    rules: ['Väärä kirjain saa tulla 8 kertaa.'],
    scoring: ['Jokaisesta sanasta saa 200 pistettä, ja jokainen väärä kirjain vähentää 25.'],
  },
  preview: {
    file: 'valikko-hirsipuu.png',
    width: 360,
    height: 200,
    title: 'Hirsipuun esikatselukuva',
    prompt: 'Väliaikainen',
    style: 'Pelkistetty piirroskuva',
    transparent: false,
    draw(ctx, width, height) {
      ctx.fillStyle = '#22163b';
      ctx.fillRect(0, 0, width, height);
    },
  },
  assets: [],
};

export default hirsipuu;
