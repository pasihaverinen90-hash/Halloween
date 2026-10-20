import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import {
  buildCourse,
  CEILING_Y,
  difficulty,
  distancePoints,
  EASY_DISTANCE,
  flightSeconds,
  GOAL_DISTANCE,
  GROUND_Y,
  hitsGate,
  stepWitch,
  targetSpeed,
  WITCH_X,
} from './logic';

const C = CONFIG.lentopeli;

describe('course length and speed', () => {
  it('puts the finish about 90 seconds of flight away', () => {
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

describe('course', () => {
  const course = buildCourse();

  it('is the same every time', () => {
    expect(buildCourse()).toEqual(course);
  });

  it('has openings of the right size inside the playfield', () => {
    for (const gate of course) {
      const gap = gate.gapBottom - gate.gapTop;
      expect(gap).toBeGreaterThanOrEqual(C.gapHard - 1);
      expect(gap).toBeLessThanOrEqual(C.gapEasy + 1);
      expect(gate.gapTop).toBeGreaterThan(CEILING_Y);
      expect(gate.gapBottom).toBeLessThan(GROUND_Y);
    }
    const easy = course.filter((g) => g.x < EASY_DISTANCE);
    expect(easy.every((g) => g.gapBottom - g.gapTop === C.gapEasy)).toBe(true);
    expect(course[course.length - 1].x).toBeLessThan(GOAL_DISTANCE);
  });

  it('gets denser after the easy part', () => {
    const first = course[1].x - course[0].x;
    const last = course[course.length - 1].x - course[course.length - 2].x;
    expect(first).toBe(C.gateSpacingEasy);
    expect(last).toBeLessThan(first);
  });

  it('places a black cat in every fifth opening from the fourth', () => {
    const cats = course.filter((g) => g.hasCat).map((g) => g.index);
    expect(cats.slice(0, 3)).toEqual([3, 8, 13]);
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

  it('hits the obstacles above and below the opening, not the opening itself', () => {
    const gate = { index: 0, x: 0, gapTop: 200, gapBottom: 400, hasCat: false };
    expect(hitsGate(gate, WITCH_X, 300, 24, 16)).toBe(false);
    expect(hitsGate(gate, WITCH_X, 205, 24, 16)).toBe(true);
    expect(hitsGate(gate, WITCH_X, 395, 24, 16)).toBe(true);
    expect(hitsGate(gate, WITCH_X + 200, 205, 24, 16)).toBe(false);
  });
});
