import { CONFIG } from '../config';
import type { KeyValueStorage } from './storage';

/*
 * Freeplay (Pasi 23.10.): Pasi opens it with his password, and it stays open
 * until he closes it in correction mode. Every game has its own top 10 list,
 * arcade style: each result is its own row, and the same name may appear many
 * times. Kept apart from the tournament's results.
 */

/** One row of a freeplay top list. */
export interface FreeplayEntry {
  name: string;
  /** 0..10 000 (see freeplayScore). */
  score: number;
  /** ISO time of the result. */
  at: string;
}

interface FreeplayData {
  open: boolean;
  lists: Record<string, FreeplayEntry[]>;
}

/**
 * A game's result (0..1000, may have decimals) as freeplay points 0..10 000.
 * uncapped: no upper limit (the endless flight).
 */
export function freeplayScore(raw: number, uncapped = false): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  const points = Math.max(0, Math.round(raw * CONFIG.freeplay.scale));
  return uncapped ? points : Math.min(CONFIG.maxScore * CONFIG.freeplay.scale, points);
}

export class FreeplayStore {
  private data: FreeplayData;

  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly key: string,
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.data = this.load();
  }

  isOpen(): boolean {
    return this.data.open;
  }

  setOpen(open: boolean): void {
    this.data.open = open;
    this.save();
  }

  /** A game's top list, best first. */
  top(gameId: string): readonly FreeplayEntry[] {
    return this.list(gameId);
  }

  /** The place (1-based) this score would get on the game's list, or null if it would not get on it. */
  placeFor(gameId: string, score: number): number | null {
    const place = this.list(gameId).filter((entry) => entry.score >= score).length + 1;
    return place <= CONFIG.freeplay.topSize ? place : null;
  }

  /** Put a result on the game's list (if it fits). Returns its place, or null. Equal scores keep the older one first. */
  add(gameId: string, name: string, score: number): number | null {
    const place = this.placeFor(gameId, score);
    if (place === null) return null;
    const list = this.list(gameId);
    list.splice(place - 1, 0, { name: name.trim(), score, at: this.clock().toISOString() });
    this.data.lists[gameId] = list.slice(0, CONFIG.freeplay.topSize);
    this.save();
    return place;
  }

  /** Empty every top list (freeplay stays open or closed as it is). */
  clearLists(): void {
    this.data.lists = {};
    this.save();
  }

  private list(gameId: string): FreeplayEntry[] {
    return Object.prototype.hasOwnProperty.call(this.data.lists, gameId) ? this.data.lists[gameId] : [];
  }

  private load(): FreeplayData {
    const empty: FreeplayData = { open: false, lists: {} };
    try {
      const raw = this.storage?.getItem(this.key);
      if (!raw) return empty;
      const parsed = JSON.parse(raw) as Partial<FreeplayData>;
      const lists: Record<string, FreeplayEntry[]> = {};
      for (const [gameId, list] of Object.entries(parsed.lists ?? {})) {
        if (!Array.isArray(list)) continue;
        lists[gameId] = list
          .filter((e) => e && typeof e.name === 'string' && typeof e.score === 'number' && Number.isFinite(e.score))
          .map((e) => ({ name: e.name, score: e.score, at: typeof e.at === 'string' ? e.at : '' }))
          .sort((a, b) => b.score - a.score)
          .slice(0, CONFIG.freeplay.topSize);
      }
      return { open: parsed.open === true, lists };
    } catch {
      return empty;
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.data));
    } catch (error) {
      console.error('Freeplayn tallennus epäonnistui:', error);
    }
  }
}

let shared: FreeplayStore | null = null;

/** The game's freeplay lists (window.localStorage, CONFIG.freeplay.key). Created on first call. */
export function getFreeplay(): FreeplayStore {
  if (!shared) {
    let storage: KeyValueStorage | null = null;
    try {
      storage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
    } catch {
      // Merely touching localStorage throws when the browser blocks site data.
    }
    shared = new FreeplayStore(storage, CONFIG.freeplay.key);
  }
  return shared;
}
