import { describe, expect, it } from 'vitest';
import { backupFileName, backupSummary, parseBackup, resultsCsv, serializeBackup } from './backup';
import { createResultsDb } from './db';
import type { SaveData } from './types';

function sampleData(): SaveData {
  let t = Date.UTC(2026, 9, 31, 18, 0, 0);
  const db = createResultsDb(null, 'k', () => new Date((t += 60_000)));
  const aino = db.createPlayer('Aino');
  const eero = db.createPlayer('Eero');
  db.createPlayer('Kalle');
  db.recordAttempt(aino.id, 'hirsipuu', 800, 1);
  db.recordAttempt(eero.id, 'hirsipuu', 800, 1);
  db.recordAttempt(eero.id, 'lento', 250, 3);
  return JSON.parse(JSON.stringify(db.data)) as SaveData;
}

describe('backupFileName', () => {
  it('contains the local date and time with zero padding', () => {
    expect(backupFileName(new Date(2026, 9, 5, 7, 3, 9), 'varmuuskopio', 'json')).toBe(
      'halloween-varmuuskopio-2026-10-05-klo-07-03-09.json',
    );
    expect(backupFileName(new Date(2026, 9, 31, 21, 45, 0), 'tulokset', 'csv')).toBe(
      'halloween-tulokset-2026-10-31-klo-21-45-00.csv',
    );
  });
});

describe('serializeBackup / parseBackup', () => {
  it('round-trips the data', () => {
    const data = sampleData();
    const parsed = parseBackup(serializeBackup(data));
    expect(parsed.ok && parsed.data.players.map((p) => p.name)).toEqual(['Aino', 'Eero', 'Kalle']);
  });

  it('accepts a byte order mark', () => {
    expect(parseBackup(`﻿${serializeBackup(sampleData())}`).ok).toBe(true);
  });

  it('explains broken, empty, foreign and CSV files in Finnish', () => {
    expect(parseBackup('')).toEqual({ ok: false, error: 'Tiedosto on tyhjä.' });
    expect(parseBackup('{"app":')).toMatchObject({ ok: false, error: expect.stringMatching(/JSON-muoto on rikki/) });
    expect(parseBackup('{"jotain": 1}')).toMatchObject({ ok: false });
    expect(parseBackup('Sija;Nimi;Yhteensä\r\n1;Aino;800')).toMatchObject({
      ok: false,
      error: expect.stringMatching(/CSV/),
    });
  });
});

describe('backupSummary', () => {
  it('counts players and results of the given games', () => {
    expect(backupSummary(sampleData(), ['hirsipuu'])).toMatch(/^3 pelaajaa, 2 tulosta, tallennettu /);
    expect(backupSummary(sampleData(), ['hirsipuu', 'lento'])).toMatch(/^3 pelaajaa, 3 tulosta/);
  });
});

describe('resultsCsv', () => {
  it('is a Finnish-Excel friendly table in standings order', () => {
    const csv = resultsCsv(sampleData(), [
      { id: 'hirsipuu', name: 'Viimeinen sana' },
      { id: 'lento', name: 'Yö; "lento"' },
    ]);
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Sija;Nimi;Viimeinen sana;"Yö; ""lento""";Yhteensä');
    expect(lines[1]).toBe('1;Eero;800;250;1050');
    expect(lines[2]).toBe('2;Aino;800;;800');
    expect(lines[3]).toBe(';Kalle;;;0');
    expect(lines[4]).toBe('');
  });
});
