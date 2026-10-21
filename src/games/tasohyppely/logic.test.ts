import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import type { LevelDef } from './levels';
import {
  getLevels,
  HUNTER_CROUCH_H,
  HUNTER_W,
  hunterRect,
  inPit,
  isStandable,
  levelProgress,
  moverRect,
  newHunter,
  NO_INPUT,
  parseLevel,
  pendulumAngle,
  safeFooting,
  score,
  stepHunter,
  TILE,
  totalCandles,
  whipRect,
  type Hunter,
  type HunterInput,
  type Level,
  type World,
} from './logic';

const C = CONFIG.tasohyppely;
const DT = 1 / 60;

function worldOf(level: Level, platforms: World['platforms'] = []): World {
  return { level, gone: new Set(), platforms };
}

/** A small test level from map rows. */
function testLevel(rows: string[]): Level {
  const def: LevelDef = { name: 'Testi', theme: 'hautausmaa', chunks: [{ rows }] };
  return parseLevel(def, 0);
}

function run(h: Hunter, world: World, frames: number, input: (frame: number) => Partial<HunterInput>): void {
  for (let i = 0; i < frames; i++) stepHunter(h, { ...NO_INPUT, ...input(i) }, DT, world);
}

const FLAT = testLevel([
  '..............................',
  '..............................',
  '..............................',
  '..............................',
  '..............................',
  '..............................',
  '..............................',
  '..............................',
  '.......====...#...............',
  '.S............#.............G.',
  '#####################....#####',
  '#####################....#####',
]);

describe('levels', () => {
  it('parses all three levels with a start, candles and enemies', () => {
    const levels = getLevels();
    expect(levels.map((l) => l.name)).toEqual(['Hautausmaa', 'Linna', 'Noidan metsä']);
    for (const level of levels) {
      expect(level.start).toBeTruthy();
      expect(level.enemies.length).toBeGreaterThan(8);
      // Pasi 21.10.: about 12 candles in a level, and 1–2 of them drop an item.
      expect(level.candles.length).toBe(12);
      const drops = level.candles.filter((c) => c.drop !== null).length;
      expect(drops).toBeGreaterThanOrEqual(1);
      expect(drops).toBeLessThanOrEqual(2);
    }
    expect(levels[0].gate).not.toBeNull();
    expect(levels[1].gate).not.toBeNull();
    expect(levels[2].gate).toBeNull();
    expect(levels[2].arena).not.toBeNull();
    expect(totalCandles()).toBe(36);
  });

  it('has climbing sections, moving platforms, crumbling floors and swinging blades (Pasi 21.10.)', () => {
    const levels = getLevels();
    expect(levels.every((l) => l.sections.some((s) => s.climb))).toBe(true);
    expect(levels.flatMap((l) => l.movers).some((m) => m.axis === 'x')).toBe(true);
    expect(levels.flatMap((l) => l.movers).some((m) => m.axis === 'y')).toBe(true);
    expect(levels.flatMap((l) => l.crumbles).length).toBeGreaterThan(0);
    expect(levels[1].pendulums.length).toBeGreaterThan(0);
  });

  it('puts walking enemies, the start and the gate on ground', () => {
    for (const level of getLevels()) {
      const world = worldOf(level);
      const onGround = (x: number, y: number): boolean => isStandable(world, Math.floor(x / TILE), y / TILE);
      expect(onGround(level.start.x, level.start.y)).toBe(true);
      if (level.gate) expect(onGround(level.gate.x, level.gate.y)).toBe(true);
      for (const e of level.enemies) {
        if (['zombie', 'armor', 'mushroom', 'wolf', 'raven'].includes(e.kind)) {
          expect(onGround(e.x, e.y), `${level.name}: ${e.kind} sarakkeessa ${Math.floor(e.x / TILE) + 1}`).toBe(true);
        }
      }
    }
  });

  it('the reachability check notices a gap that is too wide and a ledge that is too high', () => {
    const wide = testLevel(['.S...........G', '###.........##', '###.........##']);
    expect([...reachableSurfaces(wide).values()].some((p) => p.x > 12 * TILE)).toBe(false);
    const high = testLevel(['.......####G', '.......#####', '.......#####', '.......#####', '.......#####', '.......#####', '.S.....#####', '############']);
    expect([...reachableSurfaces(high).values()].some((p) => p.x > 7 * TILE)).toBe(false);
    const fine = testLevel(['.........####G', '.........#####', '.........#####', '.S.......#####', '###.....######']);
    expect([...reachableSurfaces(fine).values()].some((p) => p.x > 10 * TILE)).toBe(true);
    for (const level of getLevels()) expect(reachableSurfaces(level).size).toBeGreaterThan(80);
  });

  it('explains a broken map in Finnish', () => {
    expect(() => parseLevel({ name: 'Rikki', theme: 'linna', chunks: [{ rows: ['..', '...'] }] }, 0)).toThrow(/eri pitkiä/);
    expect(() => parseLevel({ name: 'Rikki', theme: 'linna', chunks: [{ rows: ['.S.X', '####'] }] }, 0)).toThrow(/tuntematon merkki/);
    expect(() => parseLevel({ name: 'Rikki', theme: 'linna', chunks: [{ rows: ['...G', '####'] }] }, 0)).toThrow(/aloituspaikka/);
  });

  it('every level can be played through, and every candle can be reached', { timeout: 180_000 }, () => {
    for (const level of getLevels()) {
      const reached = reachableSurfaces(level);
      const goalReached = [...reached.values()].some((p) =>
        level.gate ? Math.abs(p.x - level.gate.x) < TILE * 1.5 && p.y === level.gate.y : level.arena !== null && p.x > level.arena.left + TILE,
      );
      expect(goalReached, `${level.name}: maaliin ei pääse`).toBe(true);
      for (const candle of level.candles) {
        const near = [...reached.values()].some((p) => {
          const dx = Math.abs(p.x - candle.x);
          const above = p.y - candle.y;
          // Side lash from standing or a jump, or an upward lash.
          return (dx < TILE * 2.5 && above > 20 && above < TILE * 4) || (dx < TILE * 0.7 && above > 0 && above < TILE * 5);
        });
        expect(near, `${level.name}: kynttilään ${Math.floor(candle.x / TILE) + 1},${Math.floor(candle.y / TILE) + 1} ei ylety`).toBe(true);
      }
    }
  });
});

describe('moving', () => {
  it('runs and stops at walls', () => {
    const world = worldOf(FLAT);
    const h = newHunter(FLAT.start.x, FLAT.start.y);
    run(h, world, 200, () => ({ right: true }));
    // The wall at column 15 stops the hunter.
    expect(h.x).toBeCloseTo(14 * TILE - HUNTER_W / 2, 0);
    expect(h.onGround).toBe(true);
    expect(h.facing).toBe(1);
  });

  it('jumps about 3 tiles high, higher with the double jump, and lower with a short press', () => {
    const world = worldOf(FLAT);
    const peak = (input: (frame: number) => Partial<HunterInput>): number => {
      const h = newHunter(FLAT.start.x, FLAT.start.y);
      let top = h.y;
      for (let i = 0; i < 120; i++) {
        stepHunter(h, { ...NO_INPUT, ...input(i) }, DT, world);
        top = Math.min(top, h.y);
      }
      return (FLAT.start.y - top) / TILE;
    };
    const single = peak((i) => ({ jumpPressed: i === 0, jumpHeld: i < 40 }));
    const short = peak((i) => ({ jumpPressed: i === 0, jumpHeld: i < 3 }));
    const double = peak((i) => ({ jumpPressed: i === 0 || i === 20, jumpHeld: i < 60 }));
    const triple = peak((i) => ({ jumpPressed: i === 0 || i === 20 || i === 35, jumpHeld: i < 60 }));
    expect(single).toBeGreaterThan(2.7);
    expect(single).toBeLessThan(3.2);
    expect(short).toBeLessThan(1.5);
    expect(double).toBeGreaterThan(4.5);
    expect(triple).toBeCloseTo(double, 1);
  });

  it('allows a late jump just after running off a ledge, and then the double jump', () => {
    const world = worldOf(FLAT);
    // The gap at columns 22–25 (counted from 1).
    const h = newHunter(21 * TILE - 2, 10 * TILE);
    let frame = 0;
    while (h.onGround && frame++ < 60) stepHunter(h, { ...NO_INPUT, right: true }, DT, world);
    expect(h.onGround).toBe(false);
    stepHunter(h, { ...NO_INPUT, right: true, jumpPressed: true, jumpHeld: true }, DT, world);
    expect(h.vy).toBeLessThan(0);
    expect(h.jumps).toBe(1);
    run(h, world, 10, () => ({ right: true, jumpHeld: true }));
    stepHunter(h, { ...NO_INPUT, right: true, jumpPressed: true, jumpHeld: true }, DT, world);
    expect(h.jumps).toBe(2);
  });

  it('jumps up through a platform, stands on it, and drops through with ↓ + Space', () => {
    const world = worldOf(FLAT);
    const h = newHunter(8.5 * TILE, 10 * TILE);
    run(h, world, 70, (i) => ({ jumpPressed: i === 0, jumpHeld: i < 40 }));
    expect(h.onGround).toBe(true);
    expect(h.y).toBe(8 * TILE);
    run(h, world, 40, (i) => ({ down: true, jumpPressed: i === 0, jumpHeld: i < 5 }));
    expect(h.y).toBe(10 * TILE);
  });

  it('crouches with ↓: lower hitbox, feet planted, a low lash', () => {
    const world = worldOf(FLAT);
    const h = newHunter(5 * TILE, 10 * TILE);
    run(h, world, 20, () => ({ down: true, right: true }));
    expect(h.crouching).toBe(true);
    expect(h.x).toBe(5 * TILE);
    expect(hunterRect(h).h).toBe(HUNTER_CROUCH_H);
    stepHunter(h, { ...NO_INPUT, down: true, lashPressed: true }, DT, world);
    expect(h.lash?.kind).toBe('low');
    run(h, world, 8, () => ({ down: true }));
    const low = whipRect(h, 1)!;
    expect(low.y + low.h / 2).toBeGreaterThan(h.y - 40);
    run(h, world, 30, () => ({}));
    expect(h.crouching).toBe(false);
  });

  it('lashes forward, upward with ↑, and further with a better whip', () => {
    const world = worldOf(FLAT);
    const h = newHunter(5 * TILE, 10 * TILE);
    stepHunter(h, { ...NO_INPUT, lashPressed: true }, DT, world);
    expect(whipRect(h, 1)).toBeNull();
    run(h, world, 7, () => ({}));
    const side = whipRect(h, 1)!;
    expect(side.x).toBeGreaterThan(h.x);
    expect(side.w).toBe(C.whipReach[0]);
    expect(whipRect(h, 3)!.w).toBe(C.whipReach[2]);
    run(h, world, 30, () => ({}));
    expect(h.lash).toBeNull();
    stepHunter(h, { ...NO_INPUT, up: true, lashPressed: true }, DT, world);
    run(h, world, 7, () => ({}));
    const up = whipRect(h, 2)!;
    expect(up.y + up.h).toBeLessThan(h.y - 60);
    expect(up.h).toBe(C.whipReach[1]);
  });

  it('rides a moving platform', () => {
    const level = testLevel(['..........', '..~~~~~~..', '..........', '.S.......G', '##########']);
    const mover = level.movers[0];
    expect(mover.length).toBe(4 * TILE);
    const h = newHunter(3 * TILE, TILE);
    let t = 0;
    let prev = moverRect(mover, t);
    for (let i = 0; i < 60; i++) {
      t += DT;
      const now = moverRect(mover, t);
      stepHunter(h, NO_INPUT, DT, worldOf(level, [{ id: mover.id, rect: now }]), { dx: now.x - prev.x, dy: now.y - prev.y });
      prev = now;
    }
    expect(h.onGround).toBe(true);
    expect(h.support).toEqual({ kind: 'mover', id: mover.id });
    expect(Math.abs(h.x - (3 * TILE + C.moverSpeed))).toBeLessThan(4);
  });

  it('knows a pit and a safe place to come back to', () => {
    const world = worldOf(FLAT);
    const h = newHunter(23.5 * TILE, 10 * TILE);
    run(h, world, 90, () => ({}));
    expect(inPit(h, FLAT)).toBe(true);
    const safe = newHunter(5 * TILE, 10 * TILE);
    run(safe, world, 2, () => ({}));
    expect(safeFooting(safe, world)).toBe(true);
    const edge = newHunter(21 * TILE - 4, 10 * TILE);
    run(edge, world, 2, () => ({}));
    expect(safeFooting(edge, world)).toBe(false);
  });

  it('swings blades back and forth', () => {
    const p = getLevels()[1].pendulums[0];
    const angles = Array.from({ length: 40 }, (_, i) => pendulumAngle(p, (i / 40) * C.pendulumSeconds));
    expect(Math.max(...angles)).toBeCloseTo((C.pendulumAngle * Math.PI) / 180, 1);
    expect(Math.min(...angles)).toBeCloseTo((-C.pendulumAngle * Math.PI) / 180, 1);
  });
});

describe('distance and points', () => {
  it('measures distance from 0 at the start to 1 at the gate, following the climbs', () => {
    for (const level of getLevels()) {
      expect(levelProgress(level, level.start.x, level.start.y)).toBeLessThan(0.02);
      const end = level.gate ?? { x: level.arena!.left + TILE, y: level.arena!.floorY };
      expect(levelProgress(level, end.x, end.y)).toBe(1);
    }
    const level = getLevels()[0];
    const tower = level.sections.find((s) => s.climb)!;
    const x = (tower.left + tower.right) / 2;
    expect(levelProgress(level, x, tower.climb!.toY)).toBeGreaterThan(levelProgress(level, x, tower.climb!.fromY));
  });

  it('gives 200 per level, 100 for all candles and 300 for the head witch (Pasi 21.10.)', () => {
    const total = totalCandles();
    expect(score({ levelsDone: 0, progress: 0, candlesBroken: 0, candlesTotal: total, bossShare: 0 })).toBe(0);
    expect(score({ levelsDone: 1, progress: 0, candlesBroken: 0, candlesTotal: total, bossShare: 0 })).toBe(200);
    expect(score({ levelsDone: 2, progress: 0.5, candlesBroken: 0, candlesTotal: total, bossShare: 0 })).toBe(500);
    expect(score({ levelsDone: 3, progress: 0, candlesBroken: total, candlesTotal: total, bossShare: 0 })).toBe(700);
    expect(score({ levelsDone: 2, progress: 1, candlesBroken: 18, candlesTotal: total, bossShare: 0.5 })).toBe(800);
    expect(score({ levelsDone: 3, progress: 1, candlesBroken: total, candlesTotal: total, bossShare: 1 })).toBe(1000);
  });
});

// ---------------------------------------------------------------- reachability with the real movement

interface Spot {
  x: number;
  y: number;
}

/**
 * Every surface the hunter can stand on, found by trying many runs and jumps
 * with the real movement code. Moving platforms count as platforms along
 * their whole track, crumbling floors as floors.
 */
function reachableSurfaces(level: Level): Map<string, Spot> {
  const platforms: Array<{ id: number; rect: { x: number; y: number; w: number; h: number } }> = [];
  for (const m of level.movers) {
    const steps = Math.max(1, Math.round(m.length / TILE));
    for (let i = 0; i <= steps; i++) {
      const offset = (m.length * i) / steps;
      platforms.push({ id: m.id * 100 + i, rect: { x: m.axis === 'x' ? m.x + offset : m.x, y: m.axis === 'y' ? m.y + offset : m.y, w: TILE * 2, h: 18 } });
    }
  }
  const world: World = { level, gone: new Set(), platforms };
  const key = (s: Spot): string => `${Math.floor(s.x / TILE)},${Math.round(s.y)}`;
  const found = new Map<string, Spot>();
  const queue: Spot[] = [];
  const add = (s: Spot): void => {
    const k = key(s);
    if (found.has(k)) return;
    found.set(k, s);
    queue.push(s);
  };
  add(level.start);
  const plans: Array<(dir: 1 | -1) => (frame: number) => Partial<HunterInput>> = [];
  for (const hold of [6, 40]) {
    for (const second of [null, 12, 22]) {
      for (const delay of [0, 14]) {
        plans.push((dir) => (i) => ({
          left: dir < 0 && i >= delay,
          right: dir > 0 && i >= delay,
          jumpPressed: i === 0 || i === second,
          jumpHeld: i < hold || (second !== null && i >= second && i < second + 30),
        }));
      }
    }
  }
  plans.push((dir) => () => ({ left: dir < 0, right: dir > 0 }));
  while (queue.length > 0) {
    const spot = queue.shift()!;
    const col = Math.floor(spot.x / TILE);
    const starts = [col * TILE + TILE / 2, col * TILE + HUNTER_W / 2 + 1, (col + 1) * TILE - HUNTER_W / 2 - 1];
    for (const sx of starts) {
      for (const dir of [1, -1] as const) {
        for (const plan of plans) {
          const h = newHunter(sx, spot.y);
          const input = plan(dir);
          let airborne = false;
          for (let i = 0; i < 150; i++) {
            stepHunter(h, { ...NO_INPUT, ...input(i) }, DT, world);
            if (!h.onGround) airborne = true;
            else if (airborne || i > 40) break;
            if (inPit(h, level)) break;
          }
          if (h.onGround && !inPit(h, level)) add({ x: h.x, y: h.y });
        }
      }
    }
  }
  return found;
}
