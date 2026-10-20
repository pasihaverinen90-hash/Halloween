import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import {
  BOSS_ATTACKS,
  bossPosition,
  bossStage,
  buildSchedule,
  ENEMY_TOTAL,
  enemyPosition,
  EXIT_Y,
  FIELD_W,
  fireInterval,
  hitsBoss,
  orbPositions,
  planDive,
  POPE_HALF_H,
  POPE_HALF_W,
  rollDrop,
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
    expect(ENEMY_TOTAL).toBeGreaterThan(400);
    expect(ENEMY_TOTAL).toBeLessThan(800);
    expect(new Set(SCHEDULE.map((s) => s.kind))).toEqual(new Set(['ghost', 'bat', 'pumpkin', 'skeleton', 'imp', 'reaper', 'ark', 'grail']));
  });

  it('brings the harder imps and reapers only after the start', () => {
    const first = (kind: string): number => SCHEDULE.find((s) => s.kind === kind)!.t;
    expect(first('imp')).toBeGreaterThan(15);
    expect(first('reaper')).toBeGreaterThan(40);
  });

  it('has the ark and the grail at the agreed moments', () => {
    const specials = SCHEDULE.filter((s) => SPECIALS.has(s.kind));
    expect(specials.map((s) => s.t)).toEqual([...C.specialTimes]);
    expect(specials.map((s) => s.kind)).toEqual(['ark', 'grail', 'ark', 'grail', 'ark', 'grail', 'ark']);
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
      expect(left, `${spawn.kind} ${spawn.id}`).toBeGreaterThan(2);
      expect(left, `${spawn.kind} ${spawn.id}`).toBeLessThan(spawn.kind === 'skeleton' ? 45 : spawn.kind === 'reaper' ? 30 : 20);
    }
  });

  it('lets the last enemies be shot before the Devil arrives', () => {
    const last = SCHEDULE.filter((s) => !SPECIALS.has(s.kind)).at(-1)!;
    const visible = enemyPosition(last, C.bossAfterSeconds - last.t - 1);
    expect(last.t).toBeLessThan(C.bossAfterSeconds - 8);
    expect(visible === null || visible.y < EXIT_Y).toBe(true);
  });
});

describe('drops', () => {
  it('drops a boost only by chance and not too often', () => {
    expect(rollDrop(C.dropChance + 0.01, 0, 99, 0)).toBeNull();
    expect(rollDrop(0, 0, C.dropGapSeconds - 0.1, 0)).toBeNull();
    expect(rollDrop(0, 0, C.dropGapSeconds, 0)).toBe('rapid');
    expect(new Set([0, 0.3, 0.5, 0.8, 0.99].map((p) => rollDrop(0, p, 99, 0)))).toEqual(new Set(['rapid', 'spread', 'shield', 'water']));
  });

  it('never gives endurance by chance (golden crosses drop only at set moments)', () => {
    for (let p = 0; p < 1; p += 0.01) expect(rollDrop(0, p, 99, 0)).not.toBe('life');
    expect(C.lifeDropTimes.length).toBeGreaterThanOrEqual(2);
  });

  it('gives no holy water when the pope carries the most he can', () => {
    for (let p = 0; p < 1; p += 0.01) expect(rollDrop(0, p, 99, C.holyWaterMax)).not.toBe('water');
  });
});

describe('guardian orbs', () => {
  it('circle the pope evenly', () => {
    const orbs = orbPositions(3, 0, 640, 500);
    expect(orbs).toHaveLength(3);
    for (const o of orbs) expect(Math.hypot(o.x - 640, (o.y - 494) / 0.9)).toBeCloseTo(64, 5);
    expect(orbPositions(0, 1, 640, 500)).toEqual([]);
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
  it('hits the pope only near his body, wherever he is', () => {
    expect(touchesPope(640, 500, 640, 500, 10)).toBe(true);
    expect(touchesPope(640, 500, 640 + POPE_HALF_W + 9, 500, 10)).toBe(true);
    expect(touchesPope(640, 500, 640 + POPE_HALF_W + 11, 500, 10)).toBe(false);
    expect(touchesPope(640, 500, 640, 500 - POPE_HALF_H - 11, 10)).toBe(false);
  });

  it('sends an imp straight at the pope', () => {
    const dive = planDive({ x: 300, y: 150 }, { x: 600, y: 550 }, 1.4);
    expect(dive.vx).toBeGreaterThan(0);
    expect(dive.vy / dive.vx).toBeCloseTo(400 / 300, 5);
    const imp = SCHEDULE.find((s) => s.kind === 'imp')!;
    const later = enemyPosition(imp, 2.4, dive)!;
    expect(later.x).toBeCloseTo(300 + dive.vx, 5);
    expect(later.y).toBeCloseTo(150 + dive.vy, 5);
  });

  it('makes the Devil angrier at two thirds and one third of its health', () => {
    expect([1, 0.7, 0.6, 0.34, 0.3, 0.01].map(bossStage)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(BOSS_ATTACKS[2].length).toBeGreaterThan(BOSS_ATTACKS[0].length);
  });

  it('brings the Devil down from above the screen and hits it within its body', () => {
    expect(bossPosition(0, 1).y).toBeLessThan(0);
    const p = bossPosition(10, 1);
    expect(p.y).toBeGreaterThan(140);
    expect(hitsBoss(p.x, p.y, p.x, p.y + 60)).toBe(true);
    expect(hitsBoss(p.x, p.y, p.x + 100, p.y)).toBe(false);
  });
});
