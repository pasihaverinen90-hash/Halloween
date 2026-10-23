import { describe, expect, it } from 'vitest';
import { FreeplayStore, freeplayScore } from './freeplay';
import type { KeyValueStorage } from './storage';

class MemoryStorage implements KeyValueStorage {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

const KEY = 'test-freeplay';

describe('freeplay', () => {
  it('scales a game result to 0–10 000 with one more digit', () => {
    expect(freeplayScore(1000)).toBe(10000);
    expect(freeplayScore(512.34)).toBe(5123);
    expect(freeplayScore(-5)).toBe(0);
    expect(freeplayScore(2000)).toBe(10000);
    expect(freeplayScore(Number.NaN)).toBe(0);
  });

  it('is closed at first and stays open once opened', () => {
    const storage = new MemoryStorage();
    expect(new FreeplayStore(storage, KEY).isOpen()).toBe(false);
    new FreeplayStore(storage, KEY).setOpen(true);
    expect(new FreeplayStore(storage, KEY).isOpen()).toBe(true);
  });

  it('keeps a top 10 per game, arcade style', () => {
    const storage = new MemoryStorage();
    const store = new FreeplayStore(storage, KEY);
    for (let i = 1; i <= 10; i++) expect(store.add('lentopeli', `P${i}`, i * 100)).toBe(1);
    expect(store.top('lentopeli').map((e) => e.score)).toEqual([1000, 900, 800, 700, 600, 500, 400, 300, 200, 100]);
    // The same name may appear again; an equal score goes below the older one.
    expect(store.placeFor('lentopeli', 900)).toBe(3);
    expect(store.add('lentopeli', 'P10', 900)).toBe(3);
    expect(store.top('lentopeli')).toHaveLength(10);
    expect(store.top('lentopeli').map((e) => e.name).slice(0, 3)).toEqual(['P10', 'P9', 'P10']);
    // Too low for the full list: no name is asked
    expect(store.placeFor('lentopeli', 150)).toBeNull();
    expect(store.add('lentopeli', 'X', 150)).toBeNull();
    // Other games have their own lists, and everything survives a reload
    expect(new FreeplayStore(storage, KEY).top('lentopeli')).toEqual(store.top('lentopeli'));
    expect(store.top('hirsipuu')).toEqual([]);
    store.clearLists();
    expect(new FreeplayStore(storage, KEY).top('lentopeli')).toEqual([]);
  });

  it('survives broken saved data', () => {
    const storage = new MemoryStorage();
    storage.setItem(KEY, '{not json');
    expect(new FreeplayStore(storage, KEY).isOpen()).toBe(false);
    storage.setItem(KEY, JSON.stringify({ open: true, lists: { a: [{ name: 'X', score: 'many' }, { name: 'Y', score: 5 }], b: 'oops' } }));
    const store = new FreeplayStore(storage, KEY);
    expect(store.isOpen()).toBe(true);
    expect(store.top('a').map((e) => e.name)).toEqual(['Y']);
    expect(store.top('b')).toEqual([]);
  });
});
