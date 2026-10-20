import { CONFIG } from '../../config';

/*
 * Flying game rules (CLAUDE.md, game 3) as pure functions. The course is the
 * same for every player and every attempt: it is generated from a fixed seed.
 * Everything depends on the distance flown, so "the first 20 seconds are easy"
 * holds for a flight without crashes.
 */

const C = CONFIG.lentopeli;

/** Layout in game space. */
export const WITCH_X = 300;
export const GROUND_Y = 652;
export const CEILING_Y = 70;

/** Distance covered during the easy start. */
export const EASY_DISTANCE = C.startSpeed * C.easySeconds;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 0 during the easy part, rising evenly to 1 at the hardest. */
export function difficulty(distance: number): number {
  return clamp((distance - EASY_DISTANCE) / C.rampDistance, 0, 1);
}

/** Flying speed (px/s) the witch accelerates to at this distance. */
export function targetSpeed(distance: number): number {
  return lerp(C.startSpeed, C.maxSpeed, difficulty(distance));
}

/** Seconds needed to fly from the start to this distance at full speed. */
export function flightSeconds(distance: number): number {
  const step = 10;
  let seconds = 0;
  for (let x = 0; x < distance; x += step) seconds += Math.min(step, distance - x) / targetSpeed(x + step / 2);
  return seconds;
}

/** Distance flown in the given number of seconds at full speed. */
function distanceAfter(seconds: number): number {
  let lo = 0;
  let hi = C.maxSpeed * seconds;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (flightSeconds(mid) < seconds) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Distance of the finish line. */
export const GOAL_DISTANCE = Math.round(distanceAfter(C.goalSeconds) / 10) * 10;

/** Points: 1000 at the finish, otherwise the share of the way flown (at most 999). */
export function distancePoints(distance: number, reachedGoal: boolean): number {
  if (reachedGoal) return CONFIG.maxScore;
  return clamp(Math.floor((CONFIG.maxScore * distance) / GOAL_DISTANCE), 0, CONFIG.maxScore - 1);
}

/** Kinds of obstacle columns. See CONFIG.lentopeli.obstacleMixEasy. */
export type Pattern = 'gate' | 'tower' | 'hanging' | 'bats';
export const PATTERNS: readonly Pattern[] = ['gate', 'tower', 'hanging', 'bats'];

/** A solid part of a column: a cage hanging from the sky, an inquisitor on a pillar, or a flock of bats. */
export type BlockKind = 'cage' | 'inquisitor' | 'bats';
export interface Block {
  kind: BlockKind;
  top: number;
  bottom: number;
}

/** Free space between the blocks of a column. */
export interface Opening {
  top: number;
  bottom: number;
}

/** One obstacle column on the course. */
export interface Column {
  index: number;
  /** Distance of the column from the start. Bats meet the witch here. */
  x: number;
  pattern: Pattern;
  /** Solid parts, top to bottom. */
  blocks: Block[];
  /** Ways through, top to bottom. */
  openings: Opening[];
  /** Height of the route that is always open (every opening leads back to it). */
  pathY: number;
  /** Height of a black cat waiting in the column, if any. */
  catY: number | null;
}

/** Witch: radius against the sky and the ground, and hitbox half sizes (smaller than the picture, to be fair). */
export const WITCH_RADIUS = 24;
export const WITCH_HALF_W = 26;
export const WITCH_HALF_H = 16;
/** A cat is collected when the witch is this close to it. */
export const CAT_PICKUP = 46;

/** Half widths of the blocks for collisions (narrower than the drawings, to be fair). */
export const HALF_WIDTH: Record<BlockKind, number> = { cage: 32, inquisitor: 32, bats: 30 };
/** Height taken by one bat of a flock. */
export const BAT_HEIGHT = 56;

/** Smallest sensible blocks: a cage peeking from above, an inquisitor (partly in the ground), a lone tower or cage. */
const MIN_CAGE = 30;
const MIN_INQUISITOR = 110;
const MIN_SINGLE = 150;
const FIRST_X = 900;
const SEED = 20261031;

/** Screen x of a block. Bats fly towards the witch and meet her exactly at the column. */
export function blockScreenX(column: Column, kind: BlockKind, distance: number): number {
  const factor = kind === 'bats' ? 1 + C.batSpeedShare : 1;
  return WITCH_X + (column.x - distance) * factor;
}

/** True when the witch (centre height wy) touches a block of the column. */
export function hitsColumn(column: Column, distance: number, wy: number): boolean {
  return column.blocks.some((block) => {
    const sx = blockScreenX(column, block.kind, distance);
    if (Math.abs(sx - WITCH_X) >= HALF_WIDTH[block.kind] + WITCH_HALF_W) return false;
    return wy + WITCH_HALF_H > block.top && wy - WITCH_HALF_H < block.bottom;
  });
}

/** True when the witch is close enough to pick up the column's cat. */
export function reachesCat(column: Column, distance: number, wy: number): boolean {
  return column.catY !== null && Math.hypot(column.x - distance, column.catY - wy) <= CAT_PICKUP;
}

export function openingsBetween(blocks: Block[]): Opening[] {
  const openings: Opening[] = [];
  let y = CEILING_Y;
  for (const block of [...blocks].sort((a, b) => a.top - b.top)) {
    if (block.top > y) openings.push({ top: y, bottom: block.top });
    y = Math.max(y, block.bottom);
  }
  if (y < GROUND_Y) openings.push({ top: y, bottom: GROUND_Y });
  return openings;
}

/*
 * Fairness. The course only contains moves the witch can make: from every
 * opening she can get well inside the next route in time, even when climbing
 * with five presses a second, as long as she uses the part of the opening
 * nearest to where she is going. The limits keep a safety margin.
 */
const CLIMB_SPEED = Math.abs(C.flapVelocity) - 0.5 * C.gravity * 0.2;
const SAFETY = 0.8;
const ROUTE_MARGIN = 20;
/** Height of the part of a wide opening the witch is expected to use. */
const PASSAGE = 2 * WITCH_HALF_H + 70;
const reachUp = (t: number): number => SAFETY * CLIMB_SPEED * t;
/** Falling, counted from a slight upward drift (the witch is rarely perfectly still). */
const reachDown = (t: number): number => SAFETY * Math.max(0, Math.min(0.5 * C.gravity * t * t, C.maxFallSpeed * t) - 100 * t);

/** Seconds of free flight between two columns at full speed. */
function travelTime(fromX: number, toX: number): number {
  return Math.max(0.05, (toX - fromX - 120) / targetSpeed(fromX));
}

/** Heights of the witch's centre that fit in the opening. */
function band(o: Opening): Opening {
  return { top: Math.max(o.top + WITCH_HALF_H, CEILING_Y + WITCH_RADIUS), bottom: Math.min(o.bottom - WITCH_HALF_H, GROUND_Y - WITCH_RADIUS) };
}

/** The part of an opening nearest to the target, at most PASSAGE high. */
function passage(o: Opening, to: Opening): Opening {
  if (o.bottom - o.top <= PASSAGE) return o;
  const centre = clamp((to.top + to.bottom) / 2, o.top + PASSAGE / 2, o.bottom - PASSAGE / 2);
  return { top: centre - PASSAGE / 2, bottom: centre + PASSAGE / 2 };
}

/** Through the opening, the witch can get well inside `to` within t seconds. */
export function canReach(from: Opening, to: Opening, t: number): boolean {
  const a = band(passage(from, to));
  const b = band(to);
  return a.bottom - (b.bottom - ROUTE_MARGIN) <= reachUp(t) && b.top + ROUTE_MARGIN - a.top <= reachDown(t);
}

function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const route = (y: number, gap: number): Opening => ({ top: y - gap / 2, bottom: y + gap / 2 });

/** Heights from which the witch picks up a cat at catY (with room to spare). */
const catZone = (catY: number): Opening => ({ top: catY - 30 - WITCH_HALF_H, bottom: catY + 30 + WITCH_HALF_H });

function pickPattern(d: number, previous: Pattern, random: () => number): Pattern {
  const weights = PATTERNS.map((p) => (p !== 'gate' && p === previous ? 0 : lerp(C.obstacleMixEasy[p], C.obstacleMixHard[p], d)));
  let roll = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < PATTERNS.length; i++) {
    roll -= weights[i];
    if (roll < 0) return PATTERNS[i];
  }
  return 'gate';
}

const cage = (bottom: number): Block => ({ kind: 'cage', top: CEILING_Y, bottom: Math.round(bottom) });
const inquisitor = (top: number): Block => ({ kind: 'inquisitor', top: Math.round(top), bottom: GROUND_Y });

/** Random choices for a flock of bats, made once per column. */
interface FlockPlan {
  count: number;
  side: 'above' | 'below';
  /** Also a cage and an inquisitor at the ends where they fit. */
  ends: boolean;
}

/** Blocks of a column whose route is centred at y, or null if the pattern does not fit there. */
function shapeColumn(pattern: Pattern, y: number, gap: number, d: number, flock: FlockPlan, withCat: boolean): { blocks: Block[]; catY: number | null } | null {
  const top = y - gap / 2;
  const bottom = y + gap / 2;
  switch (pattern) {
    case 'gate':
      return { blocks: [cage(top), inquisitor(bottom)], catY: withCat ? Math.round(top + 40) : null };
    case 'tower':
      return GROUND_Y - bottom >= MIN_SINGLE ? { blocks: [inquisitor(bottom)], catY: null } : null;
    case 'hanging':
      return top - CEILING_Y >= MIN_SINGLE ? { blocks: [cage(top)], catY: null } : null;
    case 'bats': {
      // The flock flies just above or below the route, leaving another way round it.
      const height = flock.count * BAT_HEIGHT;
      const altGap = Math.round(gap * lerp(1, 0.9, d));
      if (flock.side === 'below') {
        if (GROUND_Y - bottom < height + altGap * 0.8) return null;
        const bats: Block = { kind: 'bats', top: Math.round(bottom), bottom: Math.round(bottom + height) };
        const blocks = [bats];
        if (flock.ends && top - CEILING_Y >= MIN_CAGE) blocks.unshift(cage(top));
        if (flock.ends && GROUND_Y - (bats.bottom + altGap) >= MIN_INQUISITOR) blocks.push(inquisitor(bats.bottom + altGap));
        return { blocks, catY: withCat ? bats.bottom + 70 : null };
      }
      if (top - CEILING_Y < height + altGap * 0.8) return null;
      const bats: Block = { kind: 'bats', top: Math.round(top - height), bottom: Math.round(top) };
      const blocks = [bats];
      if (flock.ends && bats.top - altGap - CEILING_Y >= MIN_CAGE) blocks.unshift(cage(bats.top - altGap));
      if (flock.ends && GROUND_Y - bottom >= MIN_INQUISITOR) blocks.push(inquisitor(bottom));
      return { blocks, catY: withCat ? bats.top - 70 : null };
    }
  }
}

/**
 * The whole course up to the finish. Same for everyone, every time.
 * Each column picks its kind first and then a height for its route that fits
 * the kind and can be reached through every opening of the previous column.
 */
export function buildCourse(): Column[] {
  const random = seededRandom(SEED);
  const catDistances: number[] = [];
  for (let s = C.catEverySeconds; s <= C.goalSeconds - 10; s += C.catEverySeconds) catDistances.push(distanceAfter(s));

  const columns: Column[] = [];
  let x = FIRST_X;
  for (let index = 0; x < GOAL_DISTANCE - 500; index++) {
    const d = difficulty(x);
    const gap = lerp(C.gapEasy, C.gapHard, d);
    const prev = columns[index - 1];
    const t = prev ? travelTime(prev.x, x) : 0;
    const withCat = index >= 2 && catDistances.length > 0 && x >= catDistances[0];
    if (withCat) catDistances.shift();
    // The first two are plain gates; a cat sits next to a flock of bats when possible.
    const wanted: Pattern = index < 2 ? 'gate' : withCat ? 'bats' : pickPattern(d, prev?.pattern ?? 'gate', random);
    const side = random() < 0.5 ? 'above' : 'below';
    const flocks: FlockPlan[] = [
      { count: random() < lerp(0.25, 0.75, d) ? 3 : 2, side, ends: random() < lerp(0.15, 0.6, d) },
    ];
    flocks.push({ ...flocks[0], side: side === 'above' ? 'below' : 'above' }, { ...flocks[0], count: 2 }, { ...flocks[0], count: 2, side: side === 'above' ? 'below' : 'above' });
    const swingLimit = lerp(C.routeSwingEasy, C.routeSwingHard, d);
    const swing = 0.3 + 0.7 * random();
    const goUp = random() < 0.5;

    let column: Column | null = null;
    const tries: Array<[Pattern, FlockPlan]> = wanted === 'bats' ? flocks.map((f) => ['bats', f]) : [[wanted, flocks[0]]];
    tries.push(['gate', flocks[0]]);
    for (const [pattern, flock] of tries) {
      const fits: Array<{ y: number; shape: { blocks: Block[]; catY: number | null } }> = [];
      const lo = Math.ceil(CEILING_Y + MIN_CAGE + gap / 2);
      const hi = Math.floor(GROUND_Y - MIN_INQUISITOR - gap / 2);
      for (let y = lo; y <= hi; y += 2) {
        if (prev && Math.abs(y - prev.pathY) > swingLimit) continue;
        if (prev && !prev.openings.every((o) => canReach(o, route(y, gap), t))) continue;
        const shape = shapeColumn(pattern, y, gap, d, flock, withCat);
        if (!shape) continue;
        if (shape.catY !== null && prev && pattern === 'bats' && !canReach(route(prev.pathY, gap), catZone(shape.catY), t)) continue;
        fits.push({ y, shape });
      }
      if (fits.length === 0) continue;
      // Move up or down from the previous route, by a random share of the room on that side.
      const from = prev?.pathY ?? (lo + hi) / 2;
      const upward = fits.filter((f) => f.y <= from).reverse();
      const downward = fits.filter((f) => f.y >= from);
      const way = (goUp && upward.length > 0) || downward.length === 0 ? upward : downward;
      const pick = way[Math.min(way.length - 1, Math.floor(swing * way.length))];
      column = { index, x: Math.round(x), pattern, blocks: pick.shape.blocks, openings: openingsBetween(pick.shape.blocks), pathY: pick.y, catY: pick.shape.catY };
      break;
    }
    if (!column) {
      const y = prev ? prev.pathY : Math.round((CEILING_Y + GROUND_Y) / 2);
      const blocks = [cage(y - gap / 2), inquisitor(y + gap / 2)];
      column = { index, x: Math.round(x), pattern: 'gate', blocks, openings: openingsBetween(blocks), pathY: y, catY: withCat ? Math.round(y - gap / 2 + 40) : null };
    }
    columns.push(column);
    x += lerp(C.gateSpacingEasy, C.gateSpacingHard, d);
  }
  return columns;
}

/** Vertical movement of the witch for one frame. The sky is a ceiling and the ground a floor. */
export function stepWitch(y: number, vy: number, dt: number, radius: number): { y: number; vy: number; onGround: boolean } {
  let nextVy = Math.min(C.maxFallSpeed, vy + C.gravity * dt);
  let nextY = y + nextVy * dt;
  if (nextY < CEILING_Y + radius) {
    nextY = CEILING_Y + radius;
    nextVy = Math.max(0, nextVy);
  }
  const onGround = nextY >= GROUND_Y - radius;
  if (onGround) {
    nextY = GROUND_Y - radius;
    nextVy = Math.min(0, nextVy);
  }
  return { y: nextY, vy: nextVy, onGround };
}
