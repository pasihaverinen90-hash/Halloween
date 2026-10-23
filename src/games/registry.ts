import type { GameDefinition } from './types';

const modules = import.meta.glob<{ default: GameDefinition }>('./*/index.ts', { eager: true });

/**
 * Every game, in the freeplay menu's order. Each game lives in its own folder
 * src/games/<id>/. Adding or removing a game is one line here.
 */
export const ALL_GAME_ORDER: readonly string[] = [
  'hirsipuu',
  'arvoitukset',
  'lentopeli',
  'raiskinta',
  'ristikko',
  'tasohyppely',
  'kurpitsalinko',
];

/**
 * Pasi 23.10.: the tournament plays these games one after another in this
 * order. Only they count in the totals, the results and the award ceremony;
 * the others are played in freeplay only.
 */
export const TOURNAMENT_ORDER: readonly string[] = ['arvoitukset', 'lentopeli', 'raiskinta', 'tasohyppely', 'kurpitsalinko'];

export const ALL_GAMES: readonly GameDefinition[] = ALL_GAME_ORDER.map((id) => {
  const mod = modules[`./${id}/index.ts`];
  if (!mod) throw new Error(`Peliä "${id}" ei löydy kansiosta src/games/${id}/`);
  if (mod.default.id !== id) throw new Error(`Kansion ${id} pelin tunnus on "${mod.default.id}"`);
  return mod.default;
});

/** The tournament's games in playing order. */
export const GAMES: readonly GameDefinition[] = TOURNAMENT_ORDER.map((id) => {
  const game = ALL_GAMES.find((g) => g.id === id);
  if (!game) throw new Error(`Turnauksen peli "${id}" puuttuu luettelosta ALL_GAME_ORDER`);
  return game;
});

export const GAME_IDS: readonly string[] = GAMES.map((g) => g.id);

export function getGame(id: string): GameDefinition | undefined {
  return ALL_GAMES.find((g) => g.id === id);
}
