import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import {
  buildCourse,
  CEILING_Y,
  ENDLESS_DISTANCE,
  endlessPoints,
  difficulty,
  distancePoints,
  EASY_DISTANCE,
  flightSeconds,
  GOAL_DISTANCE,
  GROUND_Y,
  hitsColumn,
  reachesCat,
  stepWitch,
  targetSpeed,
  WITCH_RADIUS,
  type Column,
  type Opening,
} from './logic';

const C = CONFIG.lentopeli;

describe('course length and speed', () => {
  it('puts the finish about 60 seconds of flight away (Pasi 23.10.)', () => {
    expect(Math.abs(flightSeconds(GOAL_DISTANCE) - C.goalSeconds)).toBeLessThan(0.2);
  });

  it('keeps the first 20 seconds easy and then gets harder gradually', () => {
    expect(EASY_DISTANCE).toBe(C.startSpeed * C.easySeconds);
    expect(flightSeconds(EASY_DISTANCE)).toBeCloseTo(C.easySeconds, 1);
    expect(difficulty(EASY_DISTANCE - 1)).toBe(0);
    expect(targetSpeed(0)).toBe(C.startSpeed);
    expect(targetSpeed(EASY_DISTANCE + C.rampDistance / 2)).toBeCloseTo((C.startSpeed + C.maxSpeed) / 2, 5);
    expect(targetSpeed(1e9)).toBe(C.maxSpeed);
  });
});

describe('points', () => {
  it('gives 1000 at the finish and the share of the way otherwise', () => {
    expect(distancePoints(GOAL_DISTANCE, true)).toBe(1000);
    expect(distancePoints(GOAL_DISTANCE / 2, false)).toBe(500);
    expect(distancePoints(GOAL_DISTANCE, false)).toBe(999);
    expect(distancePoints(0, false)).toBe(0);
  });
});

/**
 * An autopilot that flies like a careful player: it heads for the nearest
 * opening of the next column, uses the part of it nearest to the column
 * after that, and presses Space at most about eight times a second.
 * With `cats`, it goes for every cat.
 */
function autopilot(cats: boolean, endless = false, until = GOAL_DISTANCE): { hits: number[]; cats: number; seconds: number } {
  const course = buildCourse(endless);
  const dt = 1 / 60;
  let distance = 0;
  let speed = 0;
  let y = 300;
  let vy: number = C.flapVelocity;
  let sinceFlap = 0;
  let seconds = 0;
  const hits: number[] = [];
  const collected = new Set<number>();
  let aimed = { index: -1, opening: { top: CEILING_Y, bottom: GROUND_Y } as Opening };
  while (distance < until && seconds < 400) {
    seconds += dt;
    sinceFlap += dt;
    speed = Math.min(targetSpeed(distance, endless), speed + C.acceleration * dt);
    distance = Math.min(until, distance + speed * dt);
    const next = course.find((c) => c.x + 60 >= distance);
    let target = 360;
    if (next) {
      if (aimed.index !== next.index) {
        const gapDistance = (o: Opening): number => Math.max(0, o.top + 40 - y, y - (o.bottom - 40));
        const catOpening = cats && next.catY !== null ? next.openings.find((o) => o.top < next.catY! && next.catY! < o.bottom) : undefined;
        const opening = catOpening ?? [...next.openings].sort((a, b) => gapDistance(a) - gapDistance(b))[0];
        aimed = { index: next.index, opening };
      }
      // Each press lifts the witch about 75 px above where she was, so she bobs from target − 55 to target + 20.
      const after = course[next.index + 1];
      const lo = aimed.opening.top + 78;
      const hi = aimed.opening.bottom - 52;
      const heading = (c: Column): number => (cats && c.catY !== null ? c.catY + 17 : c.pathY);
      const wanted = cats && next.catY !== null ? heading(next) : after ? heading(after) : 360;
      target = lo <= hi ? Math.min(hi, Math.max(lo, wanted)) : (lo + hi) / 2;
    }
    if (y > target + 20 && vy > (y > target + 90 ? -250 : -60) && sinceFlap > 0.12) {
      vy = C.flapVelocity;
      sinceFlap = 0;
    }
    ({ y, vy } = stepWitch(y, vy, dt, WITCH_RADIUS));
    for (const column of course) {
      if (Math.abs(column.x - distance) > 150) continue;
      if (hitsColumn(column, distance, y) && hits[hits.length - 1] !== column.index) hits.push(column.index);
      if (reachesCat(column, distance, y)) collected.add(column.index);
    }
  }
  return { hits, cats: collected.size, seconds };
}

describe('course', () => {
  const course = buildCourse();
  const gapAt = (x: number): number => C.gapEasy + (C.gapHard - C.gapEasy) * difficulty(x);

  it('is the same every time', () => {
    expect(buildCourse()).toEqual(course);
  });

  it('always leaves a route of the right size inside the playfield', () => {
    for (const column of course) {
      const route = column.openings.find((o) => o.top <= column.pathY && column.pathY <= o.bottom)!;
      expect(route).toBeDefined();
      expect(column.pathY - route.top).toBeGreaterThanOrEqual(gapAt(column.x) / 2 - 1);
      expect(route.bottom - column.pathY).toBeGreaterThanOrEqual(gapAt(column.x) / 2 - 1);
      for (const block of column.blocks) {
        expect(block.top).toBeGreaterThanOrEqual(CEILING_Y);
        expect(block.bottom).toBeLessThanOrEqual(GROUND_Y);
      }
    }
    expect(course[course.length - 1].x).toBeLessThan(GOAL_DISTANCE);
  });

  it('starts with plain gates and gets denser after the easy part', () => {
    expect(course.slice(0, 2).map((c) => c.pattern)).toEqual(['gate', 'gate']);
    const first = course[1].x - course[0].x;
    const last = course[course.length - 1].x - course[course.length - 2].x;
    expect(first).toBe(C.gateSpacingEasy);
    expect(last).toBeLessThan(first);
  });

  it('mixes all kinds of obstacles, so the route is not always under the sky', () => {
    const count = (p: string): number => course.filter((c) => c.pattern === p).length;
    // Pasi 23.10.: the finish is 60 seconds away, so a little fewer of each than before
    expect(count('bats')).toBeGreaterThanOrEqual(6);
    expect(count('tower')).toBeGreaterThanOrEqual(3);
    expect(count('hanging')).toBeGreaterThanOrEqual(3);
    expect(count('gate')).toBeGreaterThanOrEqual(course.length / 4);
    // Bats and single obstacles leave ways both over and under
    expect(course.filter((c) => c.pattern === 'bats').every((c) => c.openings.length >= 2)).toBe(true);
  });

  it('has a few black cats, each next to a flock of bats', () => {
    const cats = course.filter((c) => c.catY !== null);
    expect(cats.length).toBe(Math.floor((C.goalSeconds - 10) / C.catEverySeconds));
    expect(cats.every((c) => c.pattern === 'bats')).toBe(true);
    expect(flightSeconds(cats[0].x)).toBeGreaterThan(C.catEverySeconds - 2);
  });

  it('can be flown to the finish without crashing', () => {
    const run = autopilot(false);
    expect(run.hits, JSON.stringify(run.hits)).toEqual([]);
    expect(run.seconds).toBeLessThan(C.goalSeconds + 5);
  });

  it('lets the witch collect every cat without crashing', () => {
    const run = autopilot(true);
    expect(run.hits).toEqual([]);
    expect(run.cats).toBe(course.filter((c) => c.catY !== null).length);
  });
});

describe('endless flight (freeplay, Pasi 23.10.)', () => {
  const endless = buildCourse(true);

  it('starts like the tournament course and goes on far beyond its finish', () => {
    const course = buildCourse();
    const easyPart = course.filter((c) => c.x < EASY_DISTANCE + C.rampDistance);
    expect(endless.slice(0, easyPart.length)).toEqual(easyPart);
    expect(endless[endless.length - 1].x).toBeGreaterThan(GOAL_DISTANCE * 4);
    expect(endless[endless.length - 1].x).toBeLessThan(ENDLESS_DISTANCE);
  });

  it('gets faster and faster after the hardest point, up to a limit', () => {
    const hardest = EASY_DISTANCE + C.rampDistance;
    expect(targetSpeed(hardest, true)).toBe(C.maxSpeed);
    expect(targetSpeed(hardest + 20000, true)).toBeGreaterThan(C.maxSpeed + 50);
    expect(targetSpeed(ENDLESS_DISTANCE, true)).toBe(C.endlessMaxSpeed);
    expect(targetSpeed(hardest + 20000)).toBe(C.maxSpeed);
  });

  it('scores the distance without an upper limit: the tournament finish is worth 1000', () => {
    expect(endlessPoints(GOAL_DISTANCE)).toBeCloseTo(1000, 6);
    expect(endlessPoints(GOAL_DISTANCE * 2.5)).toBeCloseTo(2500, 6);
    expect(endlessPoints(-5)).toBe(0);
  });

  // The simple autopilot falls behind somewhat later, when the speed has grown: that is the idea.
  it('can be flown well past the tournament finish into the faster part without crashing', () => {
    const until = GOAL_DISTANCE * 1.6;
    expect(targetSpeed(until, true)).toBeGreaterThan(C.maxSpeed);
    const run = autopilot(false, true, until);
    expect(run.hits, JSON.stringify(run.hits)).toEqual([]);
  });
});

describe('witch', () => {
  it('falls with gravity, stops at the ground and at the sky', () => {
    let s = { y: 300, vy: 0, onGround: false };
    for (let i = 0; i < 200; i++) s = stepWitch(s.y, s.vy, 1 / 60, 20);
    expect(s).toEqual({ y: GROUND_Y - 20, vy: 0, onGround: true });
    const up = stepWitch(CEILING_Y + 21, -2000, 1 / 60, 20);
    expect(up.y).toBe(CEILING_Y + 20);
  });

  it('hits the blocks of a column, not its openings', () => {
    const column: Column = {
      index: 0,
      x: 1000,
      pattern: 'gate',
      blocks: [
        { kind: 'cage', top: CEILING_Y, bottom: 200 },
        { kind: 'inquisitor', top: 400, bottom: GROUND_Y },
      ],
      openings: [{ top: 200, bottom: 400 }],
      pathY: 300,
      catY: null,
    };
    expect(hitsColumn(column, 1000, 300)).toBe(false);
    expect(hitsColumn(column, 1000, 205)).toBe(true);
    expect(hitsColumn(column, 1000, 395)).toBe(true);
    expect(hitsColumn(column, 800, 205)).toBe(false);
  });

  it('meets flying bats exactly at their column', () => {
    const column: Column = {
      index: 0,
      x: 1000,
      pattern: 'bats',
      blocks: [{ kind: 'bats', top: 300, bottom: 412 }],
      openings: [
        { top: CEILING_Y, bottom: 300 },
        { top: 412, bottom: GROUND_Y },
      ],
      pathY: 200,
      catY: null,
    };
    expect(hitsColumn(column, 1000, 350)).toBe(true);
    expect(hitsColumn(column, 1000, 200)).toBe(false);
    expect(hitsColumn(column, 1000, 500)).toBe(false);
    // Bats move faster than the scenery, so they pass the witch quickly
    expect(hitsColumn(column, 960, 350)).toBe(false);
    expect(hitsColumn(column, 1040, 350)).toBe(false);
  });
});
