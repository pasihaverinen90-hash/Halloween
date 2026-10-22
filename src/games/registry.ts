import type { GameDefinition } from './types';

const modules = import.meta.glob<{ default: GameDefinition }>('./*/index.ts', { eager: true });

/**
 * The games of the evening, in menu order. Each game lives in its own folder
 * src/games/<id>/. Adding or removing a game is one line here.
 */
export const GAME_ORDER: readonly string[] = [
  'hirsipuu',
  'arvoitukset',
  'lentopeli',
  'raiskinta',
  'ristikko',
  'tasohyppely',
  'kurpitsalinko',
];

export const GAMES: readonly GameDefinition[] = GAME_ORDER.map((id) => {
  const mod = modules[`./${id}/index.ts`];
  if (!mod) throw new Error(`Peliä "${id}" ei löydy kansiosta src/games/${id}/`);
  if (mod.default.id !== id) throw new Error(`Kansion ${id} pelin tunnus on "${mod.default.id}"`);
  return mod.default;
});

export const GAME_IDS: readonly string[] = GAMES.map((g) => g.id);

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
