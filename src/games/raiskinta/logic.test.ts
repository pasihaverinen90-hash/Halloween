import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import {
  bossPosition,
  buildSchedule,
  ENEMY_TOTAL,
  enemyPosition,
  EXIT_Y,
  FIELD_W,
  fireInterval,
  hitsBoss,
  POPE_Y,
  SCHEDULE,
  scoreOf,
  SPECIALS,
  touchesPope,
  weaponPattern,
} from './logic';

const C = CONFIG.raiskinta;

describe('schedule', () => {
  it('is the same every time', () => {
    expect(buildSchedule()).toEqual(SCHEDULE);
  });

  it('brings more and more enemies until shortly before the Devil', () => {
    const count = (from: number, to: number): number => SCHEDULE.filter((s) => s.t >= from && s.t < to && !SPECIALS.has(s.kind)).length;
    expect(count(0, 40)).toBeLessThan(count(128, 168));
    expect(Math.max(...SCHEDULE.map((s) => s.t))).toBeLessThanOrEqual(C.lastSpawnSeconds + 3);
    expect(ENEMY_TOTAL).toBeGreaterThan(120);
    expect(ENEMY_TOTAL).toBeLessThan(400);
    expect(new Set(SCHEDULE.map((s) => s.kind))).toEqual(new Set(['ghost', 'bat', 'pumpkin', 'skeleton', 'ark', 'grail']));
  });

  it('has the ark and the grail at the agreed moments', () => {
    const specials = SCHEDULE.filter((s) => SPECIALS.has(s.kind));
    expect(specials.map((s) => s.t)).toEqual([...C.specialTimes]);
    expect(specials.map((s) => s.kind)).toEqual(['ark', 'grail', 'ark', 'grail']);
  });

  it('drops a boost about every boostEverySeconds, in turn', () => {
    const drops = SCHEDULE.filter((s) => s.drop);
    expect(drops.length).toBe(Math.floor((C.lastSpawnSeconds - C.boostEverySeconds * 0.6) / C.boostEverySeconds) + 1);
    expect(drops.slice(0, 3).map((s) => s.drop)).toEqual(['rapid', 'spread', 'shield']);
  });

  it('keeps every enemy inside the field and lets it leave in reasonable time', () => {
    for (const spawn of SCHEDULE) {
      let left = -1;
      for (let age = 0; age < 60; age += 0.05) {
        const p = enemyPosition(spawn, age);
        if (!p) {
          left = age;
          break;
        }
        if (p.y > 40 && !SPECIALS.has(spawn.kind)) {
          expect(p.x, `${spawn.kind} ${spawn.id}`).toBeGreaterThanOrEqual(30);
          expect(p.x, `${spawn.kind} ${spawn.id}`).toBeLessThanOrEqual(FIELD_W - 30);
        }
      }
      expect(left, `${spawn.kind} ${spawn.id}`).toBeGreaterThan(3);
      expect(left, `${spawn.kind} ${spawn.id}`).toBeLessThan(spawn.kind === 'skeleton' ? 45 : 20);
    }
  });

  it('lets the last enemies be shot before the Devil arrives', () => {
    const last = SCHEDULE.filter((s) => !SPECIALS.has(s.kind)).at(-1)!;
    const visible = enemyPosition(last, C.bossAfterSeconds - last.t - 1);
    expect(last.t).toBeLessThan(C.bossAfterSeconds - 8);
    expect(visible === null || visible.y < EXIT_Y).toBe(true);
  });
});

describe('weapon', () => {
  it('gets more barrels with each level and two wide shots with the spread boost', () => {
    expect([1, 2, 3, 4, 5].map((l) => weaponPattern(l, false).length)).toEqual([1, 2, 3, 4, 5]);
    expect(weaponPattern(1, true).length).toBe(3);
    expect(weaponPattern(99, false).length).toBe(5);
  });

  it('fires faster with levels and twice as fast with the rapid-fire boost', () => {
    expect(fireInterval(1, false)).toBeCloseTo(1 / C.fireRate);
    expect(fireInterval(3, false)).toBeLessThan(fireInterval(1, false));
    expect(fireInterval(1, true)).toBeCloseTo(fireInterval(1, false) / 2);
  });
});

describe('points', () => {
  it('gives 400 for enemies, 300 for surviving and 300 for the Devil', () => {
    expect(scoreOf(0, 0, false)).toBe(0);
    expect(scoreOf(ENEMY_TOTAL, C.bossAfterSeconds, true)).toBe(1000);
    expect(scoreOf(ENEMY_TOTAL, C.bossAfterSeconds, false)).toBe(700);
    expect(scoreOf(0, C.bossAfterSeconds / 2, false)).toBe(150);
    expect(scoreOf(Math.floor(ENEMY_TOTAL / 2), 0, false)).toBe(Math.floor((400 * Math.floor(ENEMY_TOTAL / 2)) / ENEMY_TOTAL));
    expect(scoreOf(ENEMY_TOTAL * 2, 999, true)).toBe(1000);
  });

  it('never gives 1000 without destroying every enemy', () => {
    expect(scoreOf(ENEMY_TOTAL - 1, C.bossAfterSeconds, true)).toBeLessThan(1000);
  });
});

describe('collisions', () => {
  it('hits the pope only near his body', () => {
    expect(touchesPope(640, 640, POPE_Y, 10)).toBe(true);
    expect(touchesPope(640, 640 + 24 + 9, POPE_Y, 10)).toBe(true);
    expect(touchesPope(640, 640 + 24 + 11, POPE_Y, 10)).toBe(false);
    expect(touchesPope(640, 640, POPE_Y - 36 - 11, 10)).toBe(false);
  });

  it('brings the Devil down from above the screen and hits it within its body', () => {
    expect(bossPosition(0, 1).y).toBeLessThan(0);
    const p = bossPosition(10, 1);
    expect(p.y).toBeGreaterThan(140);
    expect(hitsBoss(p.x, p.y, p.x, p.y + 80)).toBe(true);
    expect(hitsBoss(p.x, p.y, p.x + 120, p.y)).toBe(false);
  });
});
