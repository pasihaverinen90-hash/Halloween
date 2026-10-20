import { describe, expect, it } from 'vitest';
import { UNKNOWN_TIMESTAMP, emptySaveData, validateSaveData } from './storage';
import type { SaveData } from './types';

const T1 = '2026-10-31T18:00:00.000Z';
const T2 = '2026-10-31T19:30:00.000Z';

function validData(): SaveData {
  return {
    app: 'halloween-peli-ilta',
    version: 1,
    updatedAt: T2,
    players: [
      {
        id: 'p1',
        name: 'Matti',
        createdAt: T1,
        finishedAt: null,
        games: {
          hirsipuu: { attempts: [725], finished: true, checkpoint: null, manualScore: null, updatedAt: T2 },
          lentopeli: { attempts: [300], finished: false, checkpoint: null, manualScore: null, updatedAt: T2 },
        },
      },
      {
        id: 'p2',
        name: 'Äijä',
        createdAt: T1,
        finishedAt: T2,
        games: {
          hirsipuu: {
            attempts: [],
            finished: false,
            checkpoint: { index: 2, scores: [200, 175] },
            manualScore: null,
            updatedAt: T2,
          },
        },
      },
    ],
  };
}

function expectError(raw: unknown, message: string): void {
  const result = validateSaveData(raw);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toBe(message);
}

function validatedOrFail(raw: unknown): SaveData {
  const result = validateSaveData(raw);
  if (!result.ok) throw new Error(`expected valid data, got: ${result.error}`);
  return result.data;
}

describe('emptySaveData', () => {
  it('has no players and the given time', () => {
    expect(emptySaveData(new Date(T1))).toEqual({ app: 'halloween-peli-ilta', version: 1, updatedAt: T1, players: [] });
  });

  it('returns a fresh object every time', () => {
    const a = emptySaveData(new Date(T1));
    a.players.push({ id: 'x', name: 'X', createdAt: T1, finishedAt: null, games: {} });
    expect(emptySaveData(new Date(T1)).players).toEqual([]);
  });

  it('survives an invalid date', () => {
    expect(emptySaveData(new Date(Number.NaN)).updatedAt).toBe(UNKNOWN_TIMESTAMP);
  });
});

describe('validateSaveData: valid data', () => {
  it('accepts valid data and returns an equal copy', () => {
    const raw = validData();
    const data = validatedOrFail(raw);
    expect(data).toEqual(raw);
    expect(data).not.toBe(raw);
    expect(data.players[0]).not.toBe(raw.players[0]);
  });

  it('survives a JSON round trip', () => {
    const raw = JSON.parse(JSON.stringify(validData())) as unknown;
    expect(validatedOrFail(raw)).toEqual(validData());
  });

  it('accepts empty data', () => {
    expect(validatedOrFail(emptySaveData(new Date(T1)))).toEqual(emptySaveData(new Date(T1)));
  });

  it('does not modify its input', () => {
    const raw = validData();
    raw.players[0].games.hirsipuu.attempts = [999.6, -3];
    const before = JSON.stringify(raw);
    validatedOrFail(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });
});

describe('validateSaveData: safe repairs', () => {
  it('rounds and clamps scores silently', () => {
    const raw = validData();
    raw.players[0].games.hirsipuu.attempts = [999.6, -3, 1500, 12.4];
    raw.players[0].games.lentopeli.manualScore = 1234;
    const data = validatedOrFail(raw);
    expect(data.players[0].games.hirsipuu.attempts).toEqual([1000, 0, 1000, 12]);
    expect(data.players[0].games.lentopeli.manualScore).toBe(1000);
  });

  it('fills in missing optional fields', () => {
    const raw = {
      app: 'halloween-peli-ilta',
      version: 1,
      players: [{ id: 'p1', name: 'Matti', games: { hirsipuu: { attempts: [100], finished: true } } }],
    };
    const data = validatedOrFail(raw);
    expect(data.updatedAt).toBe(UNKNOWN_TIMESTAMP);
    expect(data.players[0]).toEqual({
      id: 'p1',
      name: 'Matti',
      createdAt: UNKNOWN_TIMESTAMP,
      finishedAt: null,
      games: {
        hirsipuu: { attempts: [100], finished: true, checkpoint: null, manualScore: null, updatedAt: UNKNOWN_TIMESTAMP },
      },
    });
  });

  it('treats missing results and missing attempts as none', () => {
    const raw = {
      app: 'halloween-peli-ilta',
      version: 1,
      players: [
        { id: 'p1', name: 'Matti' },
        { id: 'p2', name: 'Liisa', games: { hirsipuu: { finished: true, manualScore: 640 } } },
      ],
    };
    const data = validatedOrFail(raw);
    expect(data.players[0].games).toEqual({});
    expect(data.players[1].games.hirsipuu).toMatchObject({ attempts: [], finished: true, manualScore: 640 });
  });

  it('replaces unreadable timestamps with the "unknown time" marker', () => {
    const raw = validData() as unknown as { players: Array<Record<string, unknown>>; updatedAt: unknown };
    raw.updatedAt = 'eilen';
    raw.players[0].createdAt = 42;
    raw.players[1].finishedAt = 'joskus';
    const data = validatedOrFail(raw);
    expect(data.updatedAt).toBe(UNKNOWN_TIMESTAMP);
    expect(data.players[0].createdAt).toBe(UNKNOWN_TIMESTAMP);
    // Still marked finished; only the time is unknown.
    expect(data.players[1].finishedAt).toBe(UNKNOWN_TIMESTAMP);
  });

  it('normalises names', () => {
    const raw = validData();
    raw.players[0].name = '  Matti   M ';
    expect(validatedOrFail(raw).players[0].name).toBe('Matti M');
  });

  it('keeps fields it does not know (data from a newer version is not lost)', () => {
    const raw = {
      ...validData(),
      exportedBy: 'testi',
      players: validData().players.map((p) => ({
        ...p,
        favouriteColour: 'orange',
        games: { hirsipuu: { ...p.games.hirsipuu, startedAt: T1 } },
      })),
    };
    const data = validatedOrFail(raw) as unknown as Record<string, unknown> & {
      players: Array<Record<string, unknown> & { games: Record<string, Record<string, unknown>> }>;
    };
    expect(data.exportedBy).toBe('testi');
    expect(data.players[0].favouriteColour).toBe('orange');
    expect(data.players[0].games.hirsipuu.startedAt).toBe(T1);
    // Known fields come first so files stay readable.
    expect(Object.keys(data.players[0]).slice(0, 5)).toEqual(['id', 'name', 'createdAt', 'finishedAt', 'games']);
  });

  it('keeps results of games that are no longer in the registry', () => {
    const raw = validData();
    raw.players[0].games.vanhapeli = { attempts: [10], finished: true, checkpoint: null, manualScore: null, updatedAt: T1 };
    expect(validatedOrFail(raw).players[0].games.vanhapeli.attempts).toEqual([10]);
  });

  it('keeps the checkpoint as it is', () => {
    expect(validatedOrFail(validData()).players[1].games.hirsipuu.checkpoint).toEqual({ index: 2, scores: [200, 175] });
  });
});

describe('validateSaveData: rejected data', () => {
  it('rejects things that are not this game\'s data', () => {
    for (const raw of [null, undefined, 42, 'teksti', [], [validData()], {}, { foo: 1 }, { ...validData(), app: 'muu-peli' }]) {
      expectError(raw, 'Tiedosto ei ole tämän pelin varmuuskopio.');
    }
  });

  it('rejects other versions', () => {
    expectError({ ...validData(), version: 2 }, 'Varmuuskopio on tehty pelin uudemmalla versiolla, eikä tämä versio osaa lukea sitä.');
    expectError({ ...validData(), version: '1' }, 'Varmuuskopion versiotieto puuttuu tai on rikki.');
    const { version: _version, ...noVersion } = validData();
    expectError(noVersion, 'Varmuuskopion versiotieto puuttuu tai on rikki.');
  });

  it('requires the list of players', () => {
    expectError({ app: 'halloween-peli-ilta', version: 1 }, 'Varmuuskopiosta puuttuu pelaajien luettelo.');
    expectError({ app: 'halloween-peli-ilta', version: 1, players: {} }, 'Varmuuskopiosta puuttuu pelaajien luettelo.');
  });

  it('names the broken player by position', () => {
    const base = validData();
    expectError({ ...base, players: [base.players[0], 'x'] }, 'Pelaajan 2 tiedot ovat rikki.');
    expectError({ ...base, players: [base.players[0], { ...base.players[1], id: '' }] }, 'Pelaajan 2 tiedot ovat rikki (tunnus puuttuu).');
    expectError({ ...base, players: [{ ...base.players[0], id: 7 }] }, 'Pelaajan 1 tiedot ovat rikki (tunnus puuttuu).');
    expectError({ ...base, players: [base.players[0], { ...base.players[1], name: '   ' }] }, 'Pelaajan 2 tiedot ovat rikki (nimi puuttuu).');
    expectError({ ...base, players: [{ ...base.players[0], name: null }] }, 'Pelaajan 1 tiedot ovat rikki (nimi puuttuu).');
    expectError({ ...base, players: [{ ...base.players[0], finishedAt: true }] }, 'Pelaajan 1 (Matti) tiedot ovat rikki (pelien päättymisaika).');
    expectError({ ...base, players: [{ ...base.players[0], games: [] }] }, 'Pelaajan 1 (Matti) tulokset ovat rikki.');
  });

  it('rejects broken game records', () => {
    const base = validData();
    const withRecord = (record: unknown) => ({ ...base, players: [{ ...base.players[0], games: { hirsipuu: record } }] });
    const prefix = 'Pelaajan 1 (Matti) tulos pelissä "hirsipuu" on rikki';
    expectError(withRecord(null), `${prefix}.`);
    expectError(withRecord({ attempts: ['500'], finished: true }), `${prefix} (yritysten pisteet).`);
    expectError(withRecord({ attempts: [null], finished: true }), `${prefix} (yritysten pisteet).`);
    expectError(withRecord({ attempts: 500, finished: true }), `${prefix} (yritysten pisteet).`);
    expectError(withRecord({ attempts: [500] }), `${prefix} (tieto pelin päättymisestä puuttuu).`);
    expectError(withRecord({ attempts: [500], finished: 'true' }), `${prefix} (tieto pelin päättymisestä puuttuu).`);
    expectError(withRecord({ attempts: [500], finished: true, manualScore: '700' }), `${prefix} (käsin annetut pisteet).`);
  });

  it('rejects duplicate player ids', () => {
    const base = validData();
    expectError(
      { ...base, players: [base.players[0], { ...base.players[1], id: 'p1' }] },
      'Pelaajan 2 (Äijä) tunnus on sama kuin toisella pelaajalla.',
    );
  });

  it('rejects duplicate names, ignoring case and spaces', () => {
    const base = validData();
    expectError({ ...base, players: [base.players[0], { ...base.players[1], name: ' MATTI ' }] }, 'Nimi "MATTI" on kahdella pelaajalla.');
    expectError({ ...base, players: [base.players[1], { ...base.players[0], name: 'äIJÄ' }] }, 'Nimi "äIJÄ" on kahdella pelaajalla.');
  });

  it('rejects a "__proto__" game id instead of polluting objects', () => {
    const text =
      '{"app":"halloween-peli-ilta","version":1,"updatedAt":"2026-10-31T18:00:00.000Z","players":[' +
      '{"id":"p1","name":"Matti","createdAt":"2026-10-31T18:00:00.000Z","finishedAt":null,' +
      '"games":{"__proto__":{"attempts":[1],"finished":true,"checkpoint":null,"manualScore":null,"updatedAt":"2026-10-31T18:00:00.000Z"}}}]}';
    expectError(JSON.parse(text), 'Pelaajan 1 (Matti) tuloksissa on kelvoton pelin tunnus.');
    expect(({} as Record<string, unknown>).attempts).toBeUndefined();
  });

  it('drops an unknown top-level "__proto__" field without touching prototypes', () => {
    const raw = JSON.parse(`{"app":"halloween-peli-ilta","version":1,"players":[],"__proto__":{"polluted":true}}`) as unknown;
    const data = validatedOrFail(raw);
    expect(Object.getPrototypeOf(data)).toBe(Object.prototype);
    expect((data as unknown as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('turns an unexpected exception into a clean error', () => {
    const raw = {
      app: 'halloween-peli-ilta',
      version: 1,
      get players(): never {
        throw new Error('getter kaatui');
      },
    };
    const result = validateSaveData(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('getter kaatui');
  });
});
