import { CONFIG } from '../config';
import { normalizeName, validateName } from './names';
import { clampScore, getGameRecord } from './scores';
import { emptySaveData, validateSaveData, type KeyValueStorage, type SaveDataResult } from './storage';
import type { GameRecord, PlayerRecord, SaveData } from './types';

/*
 * The results database: the single source of truth for every score of the
 * evening. Every change is written to storage (localStorage) immediately, so
 * closing the browser loses nothing.
 *  - Storage missing or failing: keep working in memory and report saveProblem.
 *  - Saved data unreadable: copy it aside (never delete it), start empty and
 *    report loadProblem.
 *  - Two browser tabs: before every change the database re-reads storage and
 *    adopts what the other tab saved, so neither tab overwrites the other.
 */

export interface ResultsDb {
  /** Current data. Treat as read-only outside db.ts, and re-read it after onChange (import replaces it). */
  readonly data: SaveData;
  /** Finnish: saved data was unreadable and was set aside. null when loading went fine. */
  readonly loadProblem: string | null;
  /** Finnish: the last write failed (storage blocked or full), results are only in memory. null when ok. */
  readonly saveProblem: string | null;
  /** All players in creation order (a copy of the list; the player objects are live). */
  players(): PlayerRecord[];
  getPlayer(id: string): PlayerRecord | undefined;
  /** validateName against the existing players: Finnish error or null. */
  checkName(name: string): string | null;
  /** Throws ResultsDbError (code 'invalid-name', Finnish message) if checkName fails. The name is stored normalised. */
  createPlayer(name: string): PlayerRecord;
  /** Removes the player and all their results. Does nothing if the player does not exist. */
  deletePlayer(id: string): void;
  getRecord(playerId: string, gameId: string): GameRecord | undefined;
  /**
   * Appends clampScore(score); finished = attempts.length >= attemptsTotal or a perfect score; checkpoint = null; saves.
   * Throws ResultsDbError 'already-finished' if the game is finished or all attempts are used
   * (never silently adds an extra attempt), 'unknown-player' if the player does not exist.
   */
  recordAttempt(playerId: string, gameId: string, score: number, attemptsTotal: number): GameRecord;
  /**
   * Stores a JSON copy of state as the record's checkpoint, creating the record if missing
   * (attempts [], finished false). Ignored when the game is already finished.
   * Throws ResultsDbError if the player does not exist or state cannot be stored as JSON.
   */
  saveCheckpoint(playerId: string, gameId: string, state: unknown): void;
  /** Clamped manual score that overrides the attempts; the record becomes finished (created if missing). */
  setManualScore(playerId: string, gameId: string, score: number): void;
  /** The game becomes unplayed and the player's finishedAt is cleared ("give the game again"). */
  deleteRecord(playerId: string, gameId: string): void;
  /** finishedAt = now, unless it is already set. */
  markFinished(playerId: string): void;
  /** Backup import. Validates again and throws ResultsDbError 'invalid-data' (Finnish) if the data is not valid. */
  replaceAll(data: SaveData): void;
  /** Removes every player and result. */
  clearAll(): void;
  /** Called after every change (also changes saved by another tab). Returns an unsubscribe function. */
  onChange(listener: () => void): () => void;
}

export type ResultsDbErrorCode = 'invalid-name' | 'unknown-player' | 'already-finished' | 'invalid-data';

/** A refused change. Nothing was changed. The message is Finnish and can be shown as it is. */
export class ResultsDbError extends Error {
  override name = 'ResultsDbError';
  readonly code: ResultsDbErrorCode;

  constructor(code: ResultsDbErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export const SAVE_PROBLEM_MESSAGE =
  'Tuloksia ei voi tallentaa selaimeen. Lataa varmuuskopio korjaustilasta säännöllisesti.';

const UNKNOWN_PLAYER = 'Pelaajaa ei löydy tuloksista.';
const ALREADY_FINISHED = 'Tämä peli on jo pelattu loppuun, joten uutta yritystä ei tallennettu.';
const BAD_GAME_ID = 'Pelin tunnus ei kelpaa, joten tulosta ei tallennettu.';
const BAD_CHECKPOINT = 'Pelin välitallennus ei onnistunut, koska pelin tilaa ei voi tallentaa.';

function loadProblemMessage(reason: string, copied: boolean): string {
  return [
    'Selaimeen tallennetut tulokset olivat rikki, joten peli aloitti tyhjillä tuloksilla.',
    copied ? 'Rikkinäiset tiedot siirrettiin talteen selaimeen.' : 'Rikkinäisiä tietoja ei saatu siirrettyä talteen.',
    'Palauta tulokset tuomalla viimeisin varmuuskopio korjaustilassa (Ctrl + Shift + K).',
    'Varmuuskopiot ovat Lataukset-kansiossa nimellä halloween-varmuuskopio-….json.',
    `(Syy: ${reason})`,
  ].join(' ');
}

class StoredResultsDb implements ResultsDb {
  private storage: KeyValueStorage | null;
  private readonly key: string;
  private readonly clock: () => Date;
  private current: SaveData;
  /** Exactly what storage held after our last read or write. A difference means another tab saved. */
  private lastRaw: string | null = null;
  /** True while memory has changes that could not be written. */
  private unsaved = false;
  private loadMessage: string | null = null;
  private saveMessage: string | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(storage: KeyValueStorage | null, key: string, clock: () => Date) {
    this.storage = storage;
    this.key = key;
    this.clock = clock;
    this.current = emptySaveData(this.now());
    this.loadFromStorage();
  }

  get data(): SaveData {
    return this.current;
  }

  get loadProblem(): string | null {
    return this.loadMessage;
  }

  get saveProblem(): string | null {
    return this.saveMessage;
  }

  players(): PlayerRecord[] {
    return this.current.players.slice();
  }

  getPlayer(id: string): PlayerRecord | undefined {
    return this.current.players.find((player) => player.id === id);
  }

  checkName(name: string): string | null {
    return validateName(name, this.current.players.map((player) => player.name));
  }

  createPlayer(name: string): PlayerRecord {
    let created!: PlayerRecord;
    this.change((data, now) => {
      const problem = validateName(name, data.players.map((player) => player.name));
      if (problem !== null) throw new ResultsDbError('invalid-name', problem);
      created = { id: newPlayerId(data.players), name: normalizeName(name), createdAt: now, finishedAt: null, games: {} };
      data.players.push(created);
      return true;
    });
    return created;
  }

  deletePlayer(id: string): void {
    this.change((data) => {
      const index = data.players.findIndex((player) => player.id === id);
      if (index < 0) return false;
      data.players.splice(index, 1);
      return true;
    });
  }

  getRecord(playerId: string, gameId: string): GameRecord | undefined {
    const player = this.getPlayer(playerId);
    return player ? getGameRecord(player, gameId) : undefined;
  }

  recordAttempt(playerId: string, gameId: string, score: number, attemptsTotal: number): GameRecord {
    let saved!: GameRecord;
    this.change((data, now) => {
      const player = findPlayer(data, playerId);
      const total = Number.isFinite(attemptsTotal) ? Math.max(1, Math.floor(attemptsTotal)) : 1;
      const existing = getGameRecord(player, gameId);
      if (existing && (existing.finished || existing.attempts.length >= total)) {
        throw new ResultsDbError('already-finished', ALREADY_FINISHED);
      }
      const record = existing ?? addRecord(player, gameId, now);
      const points = clampScore(score);
      record.attempts.push(points);
      // A perfect score cannot be bettered, so the remaining attempts are skipped.
      record.finished = record.attempts.length >= total || points >= CONFIG.maxScore;
      record.checkpoint = null;
      record.updatedAt = now;
      saved = record;
      return true;
    });
    return saved;
  }

  saveCheckpoint(playerId: string, gameId: string, state: unknown): void {
    // Copy now: the game may keep changing its own state object afterwards.
    const snapshot = jsonSnapshot(state);
    this.change((data, now) => {
      const player = findPlayer(data, playerId);
      const existing = getGameRecord(player, gameId);
      // A late save after the round has ended must not bring back an old checkpoint.
      if (existing?.finished) return false;
      const record = existing ?? addRecord(player, gameId, now);
      record.checkpoint = snapshot;
      record.updatedAt = now;
      return true;
    });
  }

  setManualScore(playerId: string, gameId: string, score: number): void {
    this.change((data, now) => {
      const player = findPlayer(data, playerId);
      const record = getGameRecord(player, gameId) ?? addRecord(player, gameId, now);
      record.manualScore = clampScore(score);
      record.finished = true;
      record.checkpoint = null;
      record.updatedAt = now;
      return true;
    });
  }

  deleteRecord(playerId: string, gameId: string): void {
    this.change((data) => {
      const player = data.players.find((candidate) => candidate.id === playerId);
      if (!player) return false;
      const hadRecord = getGameRecord(player, gameId) !== undefined;
      if (!hadRecord && player.finishedAt === null) return false;
      if (hadRecord) delete player.games[gameId];
      player.finishedAt = null;
      return true;
    });
  }

  markFinished(playerId: string): void {
    this.change((data, now) => {
      const player = data.players.find((candidate) => candidate.id === playerId);
      if (!player || player.finishedAt !== null) return false;
      player.finishedAt = now;
      return true;
    });
  }

  replaceAll(data: SaveData): void {
    let copy: unknown;
    try {
      copy = JSON.parse(JSON.stringify(data));
    } catch {
      throw new ResultsDbError('invalid-data', 'Tiedosto ei ole tämän pelin varmuuskopio.');
    }
    const checked = validateSaveData(copy);
    if (!checked.ok) throw new ResultsDbError('invalid-data', checked.error);
    this.change(() => {
      this.keepPreviousCopy();
      this.current = checked.data;
      this.loadMessage = null;
      return true;
    });
  }

  clearAll(): void {
    this.change((_data, now) => {
      this.keepPreviousCopy();
      this.current = emptySaveData(new Date(now));
      this.loadMessage = null;
      return true;
    });
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Re-read storage, e.g. after another tab saved. Listeners are told if the data changed. */
  refresh(): void {
    if (this.syncFromStorage()) this.emit();
  }

  /**
   * One change: adopt what another tab saved, apply (returns false when
   * nothing changed; may throw before changing anything), then save and notify.
   */
  private change(apply: (data: SaveData, now: string) => boolean): void {
    const synced = this.syncFromStorage();
    let changed = false;
    try {
      const now = this.now().toISOString();
      changed = apply(this.current, now);
      if (changed) {
        this.current.updatedAt = now;
        this.persist();
      }
    } finally {
      if (changed || synced) this.emit();
    }
  }

  private now(): Date {
    const date = this.clock();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date : new Date();
  }

  private loadFromStorage(): void {
    if (!this.storage) {
      this.saveMessage = SAVE_PROBLEM_MESSAGE;
      return;
    }
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
    } catch {
      // Storage exists but cannot be read (blocked by the browser): memory only.
      this.storage = null;
      this.saveMessage = SAVE_PROBLEM_MESSAGE;
      return;
    }
    if (raw !== null) {
      this.lastRaw = raw;
      const parsed = parseStored(raw);
      if (parsed.ok) {
        this.current = parsed.data;
      } else {
        const copied = this.setAside(raw);
        this.loadMessage = loadProblemMessage(parsed.error, copied);
        console.warn('Tallennetut tulokset olivat rikki:', parsed.error);
        // Save the empty start right away so the same text is not set aside again on every reload.
        // If the copy failed, leave the text in place; the next real change overwrites it.
        if (copied) this.persist();
      }
    }
    this.probeWritable();
  }

  /** Find out at start-up (not after the first player) if the browser refuses to save. */
  private probeWritable(): void {
    const storage = this.storage;
    if (!storage) return;
    const testKey = `${this.key}:testi`;
    try {
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
    } catch {
      this.saveMessage = SAVE_PROBLEM_MESSAGE;
    }
  }

  /** Write everything. On failure keep working in memory and report saveProblem. */
  private persist(): void {
    let raw: string;
    try {
      raw = JSON.stringify(this.current);
    } catch (error) {
      console.error('Tulosten muuttaminen tallennusmuotoon epäonnistui:', error);
      this.unsaved = true;
      this.saveMessage = SAVE_PROBLEM_MESSAGE;
      return;
    }
    if (!this.storage) {
      this.unsaved = true;
      this.saveMessage = SAVE_PROBLEM_MESSAGE;
      return;
    }
    try {
      this.storage.setItem(this.key, raw);
      this.lastRaw = raw;
      this.unsaved = false;
      this.saveMessage = null;
    } catch (error) {
      console.warn('Tulosten tallennus selaimeen epäonnistui:', error);
      this.unsaved = true;
      this.saveMessage = SAVE_PROBLEM_MESSAGE;
    }
  }

  /**
   * Adopt data another browser tab saved since our last read or write.
   * Returns true when the data in memory was replaced.
   */
  private syncFromStorage(): boolean {
    const storage = this.storage;
    if (!storage) return false;
    let raw: string | null;
    try {
      raw = storage.getItem(this.key);
    } catch {
      return false;
    }
    if (raw === this.lastRaw) return false;
    if (raw === null) {
      // Removed outside the game (browser data cleared): keep ours, the next change writes it back.
      this.lastRaw = null;
      return false;
    }
    // Adopting would throw away our changes that could not be written; keep them instead.
    if (this.unsaved) return false;
    this.lastRaw = raw;
    const parsed = parseStored(raw);
    if (!parsed.ok) {
      // Another tab (maybe another version of the game) saved something unreadable: keep a copy, keep ours.
      this.setAside(raw);
      console.warn('Toisen välilehden tallentamat tulokset olivat rikki:', parsed.error);
      return false;
    }
    this.current = parsed.data;
    return true;
  }

  /** Copy unreadable saved text to `${key}:rikki:<time>` so that it is never lost. Best effort. */
  private setAside(raw: string): boolean {
    const storage = this.storage;
    if (!storage) return false;
    try {
      const base = `${this.key}:rikki:${this.now().toISOString()}`;
      let name = base;
      for (let n = 2; storage.getItem(name) !== null; n++) name = `${base}-${n}`;
      storage.setItem(name, raw);
      return true;
    } catch {
      return false;
    }
  }

  /** Before an import or clearing everything, keep the old results at `${key}:edellinen` (one copy, best effort). */
  private keepPreviousCopy(): void {
    if (!this.storage || this.current.players.length === 0) return;
    try {
      this.storage.setItem(`${this.key}:edellinen`, JSON.stringify(this.current));
    } catch {
      // Only a safety net; the change itself must still happen.
    }
  }

  private emit(): void {
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch (error) {
        // A broken screen must never stop results from being saved.
        console.error('Tulosten muutoksen käsittely epäonnistui:', error);
      }
    }
  }
}

function parseStored(raw: string): SaveDataResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Tallennettu teksti ei ole JSON-muodossa.' };
  }
  return validateSaveData(parsed);
}

function findPlayer(data: SaveData, playerId: string): PlayerRecord {
  const player = data.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new ResultsDbError('unknown-player', UNKNOWN_PLAYER);
  return player;
}

function addRecord(player: PlayerRecord, gameId: string, now: string): GameRecord {
  // '__proto__' would change the object's prototype instead of adding a key.
  if (typeof gameId !== 'string' || gameId === '' || gameId === '__proto__') {
    throw new ResultsDbError('invalid-data', BAD_GAME_ID);
  }
  const record: GameRecord = { attempts: [], finished: false, checkpoint: null, manualScore: null, updatedAt: now };
  player.games[gameId] = record;
  return record;
}

/** A detached JSON copy (undefined becomes null). Throws if the state cannot be stored as JSON. */
function jsonSnapshot(state: unknown): unknown {
  if (state === undefined) return null;
  let text: string | undefined;
  try {
    text = JSON.stringify(state);
  } catch {
    throw new ResultsDbError('invalid-data', BAD_CHECKPOINT);
  }
  return text === undefined ? null : (JSON.parse(text) as unknown);
}

function newPlayerId(players: readonly PlayerRecord[]): string {
  const taken = new Set(players.map((player) => player.id));
  for (;;) {
    const id = randomId();
    if (!taken.has(id)) return id;
  }
}

let fallbackIdCounter = 0;

/** crypto.randomUUID needs a secure context (https or localhost); plain http gets the fallback. */
function randomId(): string {
  const cryptoApi = (globalThis as { crypto?: Partial<Crypto> }).crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    try {
      return cryptoApi.randomUUID();
    } catch {
      // Fall through to the fallback.
    }
  }
  fallbackIdCounter += 1;
  return `p-${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A results database on the given storage. storage null = memory only
 * (saveProblem is set). clock is for tests.
 */
export function createResultsDb(storage: KeyValueStorage | null, key: string, clock: () => Date = () => new Date()): ResultsDb {
  return new StoredResultsDb(storage, key, clock);
}

let shared: StoredResultsDb | null = null;

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    // Merely touching localStorage throws when the browser blocks site data.
    return null;
  }
}

/** The game's results database (window.localStorage, CONFIG.storage.key). Created on first call. */
export function getDb(): ResultsDb {
  if (!shared) {
    const storage = browserStorage();
    const db = new StoredResultsDb(storage, CONFIG.storage.key, () => new Date());
    shared = db;
    if (storage && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      // Another tab of the game saved: show its results here too (key null = storage was cleared).
      window.addEventListener('storage', (event) => {
        if (event.key === null || event.key === CONFIG.storage.key) db.refresh();
      });
    }
  }
  return shared;
}
