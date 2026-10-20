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

function computeGoal(): number {
  let lo = 0;
  let hi = C.maxSpeed * C.goalSeconds;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (flightSeconds(mid) < C.goalSeconds) lo = mid;
    else hi = mid;
  }
  return Math.round(lo / 10) * 10;
}

/** Distance of the finish line. */
export const GOAL_DISTANCE = computeGoal();

/** Points: 1000 at the finish, otherwise the share of the way flown (at most 999). */
export function distancePoints(distance: number, reachedGoal: boolean): number {
  if (reachedGoal) return CONFIG.maxScore;
  return clamp(Math.floor((CONFIG.maxScore * distance) / GOAL_DISTANCE), 0, CONFIG.maxScore - 1);
}

/** One pair of obstacles: something hanging from above and an inquisitor standing below. */
export interface Gate {
  index: number;
  /** Distance of the obstacle's centre from the start. */
  x: number;
  /** The opening is between these heights. */
  gapTop: number;
  gapBottom: number;
  /** A black cat waits in the opening. */
  hasCat: boolean;
}

/** Obstacle width for collisions (narrower than the drawing, to be fair). */
export const GATE_WIDTH = 64;

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

/** The whole course up to the finish. Same every time. */
export function buildCourse(): Gate[] {
  const random = seededRandom(20261031);
  const gates: Gate[] = [];
  let x = 900;
  let center = (CEILING_Y + GROUND_Y) / 2;
  for (let index = 0; x < GOAL_DISTANCE - 500; index++) {
    const d = difficulty(x);
    const gap = lerp(C.gapEasy, C.gapHard, d);
    const top = CEILING_Y + 30 + gap / 2;
    const bottom = GROUND_Y - 50 - gap / 2;
    const maxChange = lerp(140, 230, d);
    const wanted = lerp(top, bottom, random());
    center = clamp(clamp(wanted, center - maxChange, center + maxChange), top, bottom);
    const hasCat = index >= C.catFirstGate && (index - C.catFirstGate) % C.catEveryGates === 0;
    gates.push({ index, x, gapTop: Math.round(center - gap / 2), gapBottom: Math.round(center + gap / 2), hasCat });
    x += lerp(C.gateSpacingEasy, C.gateSpacingHard, d);
  }
  return gates;
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

/** True when a witch hitbox (centre, half sizes) touches the gate's top or bottom obstacle. */
export function hitsGate(gate: Gate, gateScreenX: number, wy: number, halfW: number, halfH: number): boolean {
  const overlapsX = Math.abs(gateScreenX - WITCH_X) < GATE_WIDTH / 2 + halfW;
  if (!overlapsX) return false;
  return wy - halfH < gate.gapTop || wy + halfH > gate.gapBottom;
}
