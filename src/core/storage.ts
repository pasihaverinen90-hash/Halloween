import { nameKey, normalizeName } from './names';
import { clampScore } from './scores';
import type { GameRecord, PlayerRecord, SaveData } from './types';

/*
 * Shape checks for saved results. Used when results are read from
 * localStorage and when a backup file is imported. Strict about the structure,
 * forgiving where a fix is safe and unambiguous (scores are rounded and
 * clamped, missing optional fields get defaults). Fields this version does not
 * know are kept as they are, so data written by a newer version is not lost.
 */

/** The part of window.localStorage the results database needs. Tests use an in-memory version. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SaveDataResult = { ok: true; data: SaveData } | { ok: false; error: string };

/** Stands in for a missing or unreadable timestamp ("time unknown"). */
export const UNKNOWN_TIMESTAMP = new Date(0).toISOString();

const NOT_THIS_GAME = 'Tiedosto ei ole tämän pelin varmuuskopio.';

const SAVE_KEYS: readonly string[] = ['app', 'version', 'updatedAt', 'players'];
const PLAYER_KEYS: readonly string[] = ['id', 'name', 'createdAt', 'finishedAt', 'games'];
const RECORD_KEYS: readonly string[] = ['attempts', 'finished', 'checkpoint', 'manualScore', 'updatedAt'];

/** No players, no results. */
export function emptySaveData(now: Date): SaveData {
  const updatedAt = now instanceof Date && Number.isFinite(now.getTime()) ? now.toISOString() : UNKNOWN_TIMESTAMP;
  return { app: 'halloween-peli-ilta', version: 1, updatedAt, players: [] };
}

/**
 * Check that raw (parsed JSON) is saved data of this game and return a clean
 * copy. The input is not modified. Errors are Finnish and name the broken part,
 * e.g. 'Pelaajan 3 tiedot ovat rikki (nimi puuttuu).'
 */
export function validateSaveData(raw: unknown): SaveDataResult {
  try {
    return { ok: true, data: readSaveData(raw) };
  } catch (error) {
    if (error instanceof InvalidData) return { ok: false, error: error.message };
    // Something unexpected, e.g. a hand-made object with a throwing getter: still a clean "no".
    return { ok: false, error: `${NOT_THIS_GAME} (${error instanceof Error ? error.message : String(error)})` };
  }
}

/** Thrown inside the checks below; the message is the Finnish error. */
class InvalidData extends Error {}

function readSaveData(raw: unknown): SaveData {
  if (!isObject(raw) || raw.app !== 'halloween-peli-ilta') throw new InvalidData(NOT_THIS_GAME);
  if (raw.version !== 1) {
    throw new InvalidData(
      typeof raw.version === 'number' && raw.version > 1
        ? 'Varmuuskopio on tehty pelin uudemmalla versiolla, eikä tämä versio osaa lukea sitä.'
        : 'Varmuuskopion versiotieto puuttuu tai on rikki.',
    );
  }
  if (!Array.isArray(raw.players)) throw new InvalidData('Varmuuskopiosta puuttuu pelaajien luettelo.');

  const players = raw.players.map((player: unknown, index: number) => readPlayer(player, index + 1));

  const ids = new Set<string>();
  const names = new Set<string>();
  players.forEach((player, index) => {
    if (ids.has(player.id)) {
      throw new InvalidData(`Pelaajan ${index + 1} (${player.name}) tunnus on sama kuin toisella pelaajalla.`);
    }
    ids.add(player.id);
    const key = nameKey(player.name);
    if (names.has(key)) throw new InvalidData(`Nimi "${player.name}" on kahdella pelaajalla.`);
    names.add(key);
  });

  return {
    app: 'halloween-peli-ilta',
    version: 1,
    updatedAt: timestamp(raw.updatedAt),
    players,
    ...extraFields(raw, SAVE_KEYS),
  };
}

/** n = 1-based position, used in error messages. */
function readPlayer(raw: unknown, n: number): PlayerRecord {
  if (!isObject(raw)) throw new InvalidData(`Pelaajan ${n} tiedot ovat rikki.`);
  if (typeof raw.id !== 'string' || raw.id === '') throw new InvalidData(`Pelaajan ${n} tiedot ovat rikki (tunnus puuttuu).`);
  const name = typeof raw.name === 'string' ? normalizeName(raw.name) : '';
  if (name === '') throw new InvalidData(`Pelaajan ${n} tiedot ovat rikki (nimi puuttuu).`);
  const who = `Pelaajan ${n} (${name})`;

  let finishedAt: string | null = null;
  if (raw.finishedAt !== undefined && raw.finishedAt !== null) {
    if (typeof raw.finishedAt !== 'string') throw new InvalidData(`${who} tiedot ovat rikki (pelien päättymisaika).`);
    finishedAt = timestamp(raw.finishedAt);
  }

  return {
    id: raw.id,
    name,
    createdAt: timestamp(raw.createdAt),
    finishedAt,
    games: readGames(raw.games, who),
    ...extraFields(raw, PLAYER_KEYS),
  };
}

function readGames(raw: unknown, who: string): Record<string, GameRecord> {
  const games: Record<string, GameRecord> = {};
  // A player without any results may lack the field altogether.
  if (raw === undefined || raw === null) return games;
  if (!isObject(raw)) throw new InvalidData(`${who} tulokset ovat rikki.`);
  for (const [gameId, record] of Object.entries(raw)) {
    // '__proto__' cannot be a game id; assigning it would change the object's prototype.
    if (gameId === '__proto__') throw new InvalidData(`${who} tuloksissa on kelvoton pelin tunnus.`);
    games[gameId] = readRecord(record, `${who} tulos pelissä "${gameId}"`);
  }
  return games;
}

function readRecord(raw: unknown, what: string): GameRecord {
  if (!isObject(raw)) throw new InvalidData(`${what} on rikki.`);

  let attempts: number[] = [];
  if (raw.attempts !== undefined) {
    if (!Array.isArray(raw.attempts) || !raw.attempts.every(isFiniteNumber)) {
      throw new InvalidData(`${what} on rikki (yritysten pisteet).`);
    }
    attempts = raw.attempts.map((score: number) => clampScore(score));
  }

  if (typeof raw.finished !== 'boolean') throw new InvalidData(`${what} on rikki (tieto pelin päättymisestä puuttuu).`);

  let manualScore: number | null = null;
  if (raw.manualScore !== undefined && raw.manualScore !== null) {
    if (!isFiniteNumber(raw.manualScore)) throw new InvalidData(`${what} on rikki (käsin annetut pisteet).`);
    manualScore = clampScore(raw.manualScore);
  }

  return {
    attempts,
    finished: raw.finished,
    checkpoint: raw.checkpoint === undefined ? null : raw.checkpoint,
    manualScore,
    updatedAt: timestamp(raw.updatedAt),
    ...extraFields(raw, RECORD_KEYS),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A readable date string as it is; anything else becomes UNKNOWN_TIMESTAMP. */
function timestamp(value: unknown): string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : UNKNOWN_TIMESTAMP;
}

/** Fields this version does not know, kept so that nothing a newer version saved is lost. */
function extraFields(raw: Record<string, unknown>, known: readonly string[]): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!known.includes(key) && key !== '__proto__') extra[key] = value;
  }
  return extra;
}
