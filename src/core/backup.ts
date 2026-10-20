import { getGameRecord, hasAnyScore, rankTotals, recordScore } from './scores';
import { UNKNOWN_TIMESTAMP, validateSaveData, type SaveDataResult } from './storage';
import type { PlayerRecord, SaveData } from './types';

/*
 * Backup files (JSON, can be imported back in correction mode) and the
 * results table (CSV for a spreadsheet program). Pure functions; files.ts
 * does the actual download.
 */

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** File name with the local date and time, e.g. 'halloween-varmuuskopio-2026-10-31-klo-21-45-07.json'. */
export function backupFileName(now: Date, kind: 'varmuuskopio' | 'tulokset', ext: 'json' | 'csv'): string {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return `halloween-${kind}.${ext}`;
  const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}-${pad2(now.getMinutes())}-${pad2(now.getSeconds())}`;
  return `halloween-${kind}-${date}-klo-${time}.${ext}`;
}

/** Finnish date and time in local time, e.g. '31.10.2026 klo 21.45' or '5.1.2026 klo 9.04'. */
export function formatDateTimeFi(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} klo ${date.getHours()}.${pad2(date.getMinutes())}`;
}

/** Key order in backup files (any other keys follow alphabetically), so equal data gives an identical file. */
const KEY_ORDER: readonly string[] = [
  'app',
  'version',
  'id',
  'name',
  'createdAt',
  'finishedAt',
  'attempts',
  'finished',
  'checkpoint',
  'manualScore',
  'updatedAt',
  'players',
  'games',
];

function keyRank(key: string): number {
  const index = KEY_ORDER.indexOf(key);
  return index < 0 ? KEY_ORDER.length : index;
}

/** JSON.stringify replacer that rebuilds every plain object with its keys in a fixed order. */
function orderKeys(_key: string, value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  const keys = Object.keys(source).sort((a, b) => keyRank(a) - keyRank(b) || (a < b ? -1 : a > b ? 1 : 0));
  const ordered: Record<string, unknown> = {};
  for (const key of keys) {
    // defineProperty: a key named '__proto__' stays an ordinary key.
    Object.defineProperty(ordered, key, { value: source[key], enumerable: true, writable: true, configurable: true });
  }
  return ordered;
}

/** Pretty-printed JSON with a stable key order and a final newline. */
export function serializeBackup(data: SaveData): string {
  return `${JSON.stringify(data, orderKeys, 2)}\n`;
}

/** Read a backup file chosen by Pasi. Errors are Finnish and can be shown as they are. */
export function parseBackup(text: string): SaveDataResult {
  // A text editor may have added a byte order mark.
  const clean = typeof text === 'string' ? text.replace(/^﻿/, '') : '';
  if (clean.trim() === '') return { ok: false, error: 'Tiedosto on tyhjä.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    if (/^\s*"?Sija"?;/.test(clean)) {
      return {
        ok: false,
        error: 'Tiedosto on tulostaulukko (CSV), ei varmuuskopio. Valitse .json-päätteinen varmuuskopiotiedosto.',
      };
    }
    return { ok: false, error: 'Tiedosto ei ole kelvollinen varmuuskopio (JSON-muoto on rikki).' };
  }
  return validateSaveData(parsed);
}

/**
 * One line that helps to pick the right backup, e.g.
 * '4 pelaajaa, 9 tulosta, tallennettu 31.10.2026 klo 21.45'. Results are
 * counted only for the given games.
 */
export function backupSummary(data: SaveData, gameIds: readonly string[]): string {
  const ids = [...new Set(gameIds)];
  const playerCount = data.players.length;
  let resultCount = 0;
  for (const player of data.players) {
    for (const gameId of ids) {
      if (recordScore(getGameRecord(player, gameId)) !== null) resultCount += 1;
    }
  }
  const parts = [
    playerCount === 1 ? '1 pelaaja' : `${playerCount} pelaajaa`,
    resultCount === 1 ? '1 tulos' : `${resultCount} tulosta`,
  ];
  const saved = new Date(data.updatedAt);
  if (data.updatedAt !== UNKNOWN_TIMESTAMP && Number.isFinite(saved.getTime())) {
    parts.push(`tallennettu ${formatDateTimeFi(saved)}`);
  }
  return parts.join(', ');
}

/**
 * Results table for Excel or LibreOffice with Finnish settings: UTF-8 with a
 * byte order mark, ';' between fields, CRLF line ends.
 * Columns: Sija;Nimi;<game names…>;Yhteensä. Rows in the order of the overall
 * standings, then players without any score (empty Sija). An unplayed game is
 * an empty cell; an unfinished game shows its best score so far.
 */
export function resultsCsv(data: SaveData, games: ReadonlyArray<{ id: string; name: string }>): string {
  const gameIds = games.map((game) => game.id);
  const gameCells = (player: PlayerRecord): Array<string | number> =>
    games.map((game) => recordScore(getGameRecord(player, game.id)) ?? '');

  const lines = [csvLine(['Sija', 'Nimi', ...games.map((game) => game.name), 'Yhteensä'])];
  for (const row of rankTotals(data.players, gameIds)) {
    lines.push(csvLine([row.rank, row.player.name, ...gameCells(row.player), row.total]));
  }
  for (const player of data.players) {
    if (!hasAnyScore(player, gameIds)) lines.push(csvLine(['', player.name, ...gameCells(player), 0]));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}

function csvLine(fields: ReadonlyArray<string | number>): string {
  return fields.map(csvField).join(';');
}

function csvField(value: string | number): string {
  if (typeof value === 'number') return String(value);
  // A spreadsheet would treat text starting with = + - @ as a formula; the apostrophe keeps it text.
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
