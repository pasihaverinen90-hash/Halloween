import { CONFIG } from '../../config';
import { getLevels } from './logic';

/*
 * What carries over in the platformer (Pasi 22.10.): five attempts, and after
 * a fall the next attempt continues from the start of the same level, with
 * everything as it was when that level began. Coins from candles buy things
 * in the shop before levels 2 and 3. Pure rules, no Phaser.
 */

const C = CONFIG.tasohyppely;
const S = C.shop;

export const MAX_WHIP = C.whipReach.length;
export const WHIP_NAMES = ['Nahkaruoska', 'Piikkiketju', 'Hopearuoska', 'Liekehtivä ruoska', 'Salamaruoska'];

/** The hunter's things at the start of a level: saved there, and handed to the next attempt after a fall. */
export interface RunState {
  /** Level index 0..2 (the levels before it are done). */
  level: number;
  whip: number;
  daggers: number;
  coins: number;
  /** Bought extra hearts and sharpenings. */
  extraHearts: number;
  sharpen: number;
  /** Candles broken in the levels already done. */
  candles: number;
}

export function freshRun(): RunState {
  return { level: 0, whip: 1, daggers: C.daggersStart, coins: 0, extraHearts: 0, sharpen: 0, candles: 0 };
}

function whole(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null;
}

/** A saved run state, checked; null when it is missing or broken (then the attempt starts from the beginning). */
export function readRunState(raw: unknown): RunState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const levels = getLevels();
  const candlesBefore = (level: number): number => levels.slice(0, level).reduce((sum, l) => sum + l.candles.length, 0);
  const level = whole(r.level, 0, levels.length - 1);
  if (level === null) return null;
  const state = {
    level,
    whip: whole(r.whip, 1, MAX_WHIP),
    daggers: whole(r.daggers, 0, C.daggersMax),
    coins: whole(r.coins, 0, 9999),
    extraHearts: whole(r.extraHearts, 0, S.extraHeartsMax),
    sharpen: whole(r.sharpen, 0, S.sharpenMax),
    candles: whole(r.candles, 0, candlesBefore(level)),
  };
  if (Object.values(state).some((v) => v === null)) return null;
  return state as RunState;
}

/** Hearts at the start of a level. */
export function maxHealth(run: Pick<RunState, 'extraHearts'>): number {
  return C.maxHealth + run.extraHearts;
}

/** Damage multiplier from sharpening. */
export function damageFactor(run: Pick<RunState, 'sharpen'>): number {
  return 1 + run.sharpen * S.sharpenBonus;
}

export type ShopItem = 'daggers' | 'heart' | 'whip' | 'sharpen';
export const SHOP_ITEMS: readonly ShopItem[] = ['daggers', 'heart', 'whip', 'sharpen'];

export interface Offer {
  item: ShopItem;
  name: string;
  description: string;
  price: number;
  /** "2/4" for limited purchases. */
  count: string | null;
  /** Not sold any more (full). */
  soldOut: boolean;
  affordable: boolean;
}

export function offer(run: RunState, item: ShopItem): Offer {
  const base = (price: number, soldOut: boolean): Pick<Offer, 'item' | 'price' | 'soldOut' | 'affordable'> => ({
    item,
    price,
    soldOut,
    affordable: !soldOut && run.coins >= price,
  });
  switch (item) {
    case 'daggers':
      return {
        ...base(S.daggerPrice, run.daggers >= C.daggersMax),
        name: `${S.daggerAmount} tikaria`,
        description: `Heitä C:llä. Tikareita voi olla enintään ${C.daggersMax}, nyt ${run.daggers}.`,
        count: null,
      };
    case 'heart':
      return {
        ...base(S.heartPrice, run.extraHearts >= S.extraHeartsMax),
        name: 'Lisäsydän',
        description: `Yksi sydän lisää jokaisen kentän alkuun (enintään ${C.maxHealth + S.extraHeartsMax}).`,
        count: `${run.extraHearts}/${S.extraHeartsMax}`,
      };
    case 'whip':
      return {
        ...base(S.whipPrice, run.whip >= MAX_WHIP),
        name: run.whip >= MAX_WHIP ? 'Parempi ruoska' : WHIP_NAMES[run.whip],
        description: run.whip >= MAX_WHIP ? 'Ruoskasi on jo paras mahdollinen.' : 'Seuraava ruoska: pidempi ja vahvempi.',
        count: `${run.whip}/${MAX_WHIP}`,
      };
    case 'sharpen':
      return {
        ...base(S.sharpenPrice, run.sharpen >= S.sharpenMax),
        name: 'Teroitus',
        description: `Ruoska ja tikarit tekevät ${Math.round(S.sharpenBonus * 100)} % enemmän vahinkoa.`,
        count: `${run.sharpen}/${S.sharpenMax}`,
      };
  }
}

/** Buy an item: the new state, or null when it is sold out or too expensive. */
export function buy(run: RunState, item: ShopItem): RunState | null {
  const o = offer(run, item);
  if (!o.affordable) return null;
  const next = { ...run, coins: run.coins - o.price };
  if (item === 'daggers') next.daggers = Math.min(C.daggersMax, run.daggers + S.daggerAmount);
  else if (item === 'heart') next.extraHearts++;
  else if (item === 'whip') next.whip++;
  else next.sharpen++;
  return next;
}

/** The line on the "Yritys 2/5" screen: where the attempt continues. */
export function continueNote(carry: unknown): string | null {
  const run = readRunState(carry);
  if (!run) return null;
  const level = getLevels()[run.level];
  return `Jatkat kentän ${run.level + 1} alusta: ${level.name}`;
}
