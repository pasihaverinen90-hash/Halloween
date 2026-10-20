import { describe, expect, it } from 'vitest';
import { createResultsDb, ResultsDbError, SAVE_PROBLEM_MESSAGE } from './db';
import type { KeyValueStorage } from './storage';

const KEY = 'testi:v1';

class MemoryStorage implements KeyValueStorage {
  readonly items = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.items.has(key) ? (this.items.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

function clock(start = Date.UTC(2026, 9, 31, 18, 0, 0)): () => Date {
  let t = start;
  return () => new Date((t += 1000));
}

function setup() {
  const storage = new MemoryStorage();
  const db = createResultsDb(storage, KEY, clock());
  return { storage, db };
}

describe('players', () => {
  it('creates players with normalised, unique names', () => {
    const { db } = setup();
    const matti = db.createPlayer('  Matti   Ä ');
    expect(matti.name).toBe('Matti Ä');
    expect(db.players().map((p) => p.name)).toEqual(['Matti Ä']);
    expect(() => db.createPlayer('matti ä')).toThrow(ResultsDbError);
    expect(db.checkName('MATTI Ä')).toMatch(/on jo käytössä/);
    expect(db.checkName('')).toBe('Kirjoita ensin nimesi.');
    expect(db.players()).toHaveLength(1);
  });

  it('deletes a player with all results', () => {
    const { db } = setup();
    const a = db.createPlayer('Aino');
    db.recordAttempt(a.id, 'hirsipuu', 500, 1);
    db.deletePlayer(a.id);
    expect(db.players()).toEqual([]);
    expect(db.getRecord(a.id, 'hirsipuu')).toBeUndefined();
  });
});

describe('attempts', () => {
  it('records attempts, clamps scores and finishes after the last attempt', () => {
    const { db } = setup();
    const p = db.createPlayer('Eero');
    expect(db.recordAttempt(p.id, 'lento', 123.6, 3)).toMatchObject({ attempts: [124], finished: false });
    db.recordAttempt(p.id, 'lento', -50, 3);
    const rec = db.recordAttempt(p.id, 'lento', 5000, 3);
    expect(rec).toMatchObject({ attempts: [124, 0, 1000], finished: true, checkpoint: null });
  });

  it('never adds an attempt to a finished game', () => {
    const { db } = setup();
    const p = db.createPlayer('Eero');
    db.recordAttempt(p.id, 'hirsipuu', 700, 1);
    expect(() => db.recordAttempt(p.id, 'hirsipuu', 900, 1)).toThrow(/jo pelattu loppuun/);
    expect(db.getRecord(p.id, 'hirsipuu')?.attempts).toEqual([700]);
  });

  it('refuses unknown players', () => {
    const { db } = setup();
    expect(() => db.recordAttempt('ei-ole', 'hirsipuu', 100, 1)).toThrow(ResultsDbError);
  });

  it('keeps a checkpoint until the attempt is recorded', () => {
    const { db } = setup();
    const p = db.createPlayer('Liisa');
    const state = { index: 2, scores: [200, 150] };
    db.saveCheckpoint(p.id, 'hirsipuu', state);
    state.index = 99; // later changes by the game must not leak into the saved copy
    expect(db.getRecord(p.id, 'hirsipuu')).toMatchObject({ attempts: [], finished: false, checkpoint: { index: 2 } });
    db.recordAttempt(p.id, 'hirsipuu', 650, 1);
    expect(db.getRecord(p.id, 'hirsipuu')?.checkpoint).toBeNull();
    db.saveCheckpoint(p.id, 'hirsipuu', { index: 0 }); // late save after the round is ignored
    expect(db.getRecord(p.id, 'hirsipuu')?.checkpoint).toBeNull();
  });
});

describe('corrections', () => {
  it('sets a manual score that finishes the game', () => {
    const { db } = setup();
    const p = db.createPlayer('Ville');
    db.setManualScore(p.id, 'hirsipuu', 1234);
    expect(db.getRecord(p.id, 'hirsipuu')).toMatchObject({ manualScore: 1000, finished: true });
  });

  it('deleting a result makes the game unplayed and reopens the turn', () => {
    const { db } = setup();
    const p = db.createPlayer('Ville');
    db.recordAttempt(p.id, 'hirsipuu', 400, 1);
    db.markFinished(p.id);
    expect(db.getPlayer(p.id)?.finishedAt).not.toBeNull();
    db.deleteRecord(p.id, 'hirsipuu');
    expect(db.getRecord(p.id, 'hirsipuu')).toBeUndefined();
    expect(db.getPlayer(p.id)?.finishedAt).toBeNull();
  });

  it('clears everything but keeps a copy of the old results', () => {
    const { db, storage } = setup();
    db.createPlayer('Aino');
    db.clearAll();
    expect(db.players()).toEqual([]);
    expect(storage.getItem(`${KEY}:edellinen`)).toContain('Aino');
  });

  it('replaces everything with valid imported data only', () => {
    const { db } = setup();
    const p = db.createPlayer('Aino');
    db.recordAttempt(p.id, 'hirsipuu', 800, 1);
    const backup = JSON.parse(JSON.stringify(db.data));
    db.clearAll();
    db.replaceAll(backup);
    expect(db.players().map((x) => x.name)).toEqual(['Aino']);
    expect(() => db.replaceAll({ app: 'muu' } as never)).toThrow(ResultsDbError);
    expect(db.players()).toHaveLength(1);
  });
});

describe('persistence', () => {
  it('writes every change to storage and loads it back', () => {
    const { db, storage } = setup();
    const p = db.createPlayer('Säde');
    db.recordAttempt(p.id, 'hirsipuu', 875, 1);
    const again = createResultsDb(storage, KEY, clock());
    expect(again.getRecord(p.id, 'hirsipuu')?.attempts).toEqual([875]);
    expect(again.loadProblem).toBeNull();
  });

  it('sets corrupt data aside and starts empty', () => {
    const storage = new MemoryStorage();
    storage.setItem(KEY, '{rikki');
    const db = createResultsDb(storage, KEY, clock());
    expect(db.players()).toEqual([]);
    expect(db.loadProblem).toMatch(/rikki/);
    const aside = [...storage.items.keys()].filter((k) => k.startsWith(`${KEY}:rikki:`));
    expect(aside).toHaveLength(1);
    expect(storage.getItem(aside[0])).toBe('{rikki');
  });

  it('keeps working in memory when storage refuses writes', () => {
    const { db, storage } = setup();
    storage.failWrites = true;
    const p = db.createPlayer('Onni');
    expect(db.saveProblem).toBe(SAVE_PROBLEM_MESSAGE);
    expect(db.getPlayer(p.id)?.name).toBe('Onni');
    storage.failWrites = false;
    db.recordAttempt(p.id, 'hirsipuu', 300, 1);
    expect(db.saveProblem).toBeNull();
    expect(storage.getItem(KEY)).toContain('Onni');
  });

  it('works without any storage', () => {
    const db = createResultsDb(null, KEY, clock());
    expect(db.saveProblem).toBe(SAVE_PROBLEM_MESSAGE);
    expect(db.createPlayer('Aino').name).toBe('Aino');
  });

  it('notifies listeners after changes', () => {
    const { db } = setup();
    let calls = 0;
    const off = db.onChange(() => (calls += 1));
    db.createPlayer('Aino');
    off();
    db.createPlayer('Eino');
    expect(calls).toBe(1);
  });
});
