import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { getLevels } from './logic';
import { buy, continueNote, damageFactor, freshRun, MAX_WHIP, maxHealth, offer, readRunState, SHOP_ITEMS, type RunState } from './shop';

const C = CONFIG.tasohyppely;
const S = C.shop;

describe('what carries over (Pasi 22.10.)', () => {
  it('starts with the basic whip, 10 daggers and no coins', () => {
    expect(freshRun()).toEqual({ level: 0, whip: 1, daggers: 10, coins: 0, extraHearts: 0, sharpen: 0, candles: 0 });
    expect(C.attempts).toBe(5);
  });

  it('reads back a saved state, and rejects a broken one', () => {
    const run: RunState = { level: 2, whip: 3, daggers: 7, coins: 4, extraHearts: 1, sharpen: 2, candles: 20 };
    expect(readRunState(JSON.parse(JSON.stringify(run)))).toEqual(run);
    expect(readRunState(null)).toBeNull();
    expect(readRunState({ ...run, level: 3 })).toBeNull();
    expect(readRunState({ ...run, whip: 0 })).toBeNull();
    expect(readRunState({ ...run, daggers: 1.5 })).toBeNull();
    // More candles than the earlier levels have cannot be.
    expect(readRunState({ ...run, candles: 25 })).toBeNull();
    expect(readRunState({ ...run, coins: undefined })).toBeNull();
  });

  it('says on the attempt screen where the attempt continues', () => {
    expect(continueNote(null)).toBeNull();
    expect(continueNote({ ...freshRun(), level: 2, candles: 10 })).toBe(`Jatkat kentän 3 alusta: ${getLevels()[2].name}`);
  });
});

describe('shop (Pasi 22.10.)', () => {
  const rich = (extra: Partial<RunState> = {}): RunState => ({ ...freshRun(), level: 1, coins: 100, ...extra });

  it('sells daggers, extra hearts, a better whip and sharpening for coins', () => {
    expect(SHOP_ITEMS).toEqual(['daggers', 'heart', 'whip', 'sharpen']);
    let run = rich({ daggers: 2 });
    run = buy(run, 'daggers')!;
    expect(run).toMatchObject({ daggers: 2 + S.daggerAmount, coins: 100 - S.daggerPrice });
    run = buy(run, 'heart')!;
    expect(maxHealth(run)).toBe(C.maxHealth + 1);
    run = buy(run, 'whip')!;
    expect(run.whip).toBe(2);
    run = buy(run, 'sharpen')!;
    expect(damageFactor(run)).toBeCloseTo(1 + S.sharpenBonus, 5);
    expect(run.coins).toBe(100 - S.daggerPrice - S.heartPrice - S.whipPrice - S.sharpenPrice);
  });

  it('does not sell what the hunter cannot afford or has full', () => {
    expect(buy({ ...freshRun(), coins: S.daggerPrice - 1, daggers: 0 }, 'daggers')).toBeNull();
    expect(offer({ ...freshRun(), coins: 0 }, 'whip')).toMatchObject({ affordable: false, soldOut: false });
    expect(buy(rich({ daggers: C.daggersMax }), 'daggers')).toBeNull();
    expect(buy(rich({ whip: MAX_WHIP }), 'whip')).toBeNull();
    expect(buy(rich({ extraHearts: S.extraHeartsMax }), 'heart')).toBeNull();
    expect(buy(rich({ sharpen: S.sharpenMax }), 'sharpen')).toBeNull();
    expect(offer(rich({ whip: MAX_WHIP }), 'whip').soldOut).toBe(true);
    // Daggers never go over the limit.
    expect(buy(rich({ daggers: C.daggersMax - 1 }), 'daggers')!.daggers).toBe(C.daggersMax);
  });

  it('names the next whip and shows the counts', () => {
    expect(offer(rich({ whip: 2 }), 'whip')).toMatchObject({ name: 'Hopearuoska', count: '2/5' });
    expect(offer(rich({ sharpen: 1 }), 'sharpen').count).toBe(`1/${S.sharpenMax}`);
  });

  it('a whole level of candles buys a good share of the shop, but not everything', () => {
    const coinsPerLevel = getLevels()[0].candles.length * C.coinsPerCandle;
    const everything = S.daggerPrice + S.heartPrice + S.whipPrice + S.sharpenPrice;
    expect(coinsPerLevel).toBeGreaterThanOrEqual(S.whipPrice);
    expect(coinsPerLevel).toBeLessThan(everything);
  });
});
