import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { LEVELS } from './levels';
import { Battle, launchVelocity, levelScore, powerAt, SKELETON_H, totalSkeletons, WEAPONS, type BattleEvent } from './logic';
import { CELL, Terrain } from './terrain';

const C = CONFIG.kurpitsalinko;

/** Run the battle until nothing moves (at most `seconds`). */
function settle(b: Battle, seconds = 12): BattleEvent[] {
  const events: BattleEvent[] = [];
  for (let t = 0; t < seconds && (t === 0 || b.busy()); t += 1 / 60) {
    b.step(1 / 60);
    events.push(...b.takeEvents());
  }
  return events;
}

describe('terrain', () => {
  it('fills shapes and blows holes', () => {
    const t = new Terrain(200, 100, [{ kind: 'rect', material: 'earth', x: 0, y: 50, w: 200, h: 50 }]);
    expect(t.isSolid(100, 60)).toBe(true);
    expect(t.isSolid(100, 40)).toBe(false);
    expect(t.surfaceBelow(100)).toBe(12 * CELL);
    const before = t.count();
    t.carve(100, 50, 20);
    expect(t.count()).toBeLessThan(before);
    expect(t.isSolid(100, 60)).toBe(false);
    expect(t.isSolid(150, 60)).toBe(true);
  });

  it('burns wood in a larger circle', () => {
    const wood = new Terrain(200, 100, [{ kind: 'rect', material: 'wood', x: 0, y: 40, w: 200, h: 20 }]);
    const stone = new Terrain(200, 100, [{ kind: 'rect', material: 'stone', x: 0, y: 40, w: 200, h: 20 }]);
    wood.carve(100, 50, 20, 1.5);
    stone.carve(100, 50, 20, 1.5);
    expect(wood.count()).toBeLessThan(stone.count());
  });
});

describe('aiming and points', () => {
  it('swings the power up and down while Space is held (Pasi 22.10.)', () => {
    expect(powerAt(0)).toBe(0);
    expect(powerAt(C.powerSwingSeconds / 2)).toBeCloseTo(1, 5);
    expect(powerAt(C.powerSwingSeconds)).toBeCloseTo(0, 5);
    expect(powerAt(C.powerSwingSeconds * 0.25)).toBeCloseTo(0.5, 5);
  });

  it('gives 200 a level, less in steps for extra shots (Pasi 22.10.)', () => {
    expect(levelScore(6, 4)).toBe(200);
    expect(levelScore(6, 6)).toBe(200);
    expect(levelScore(6, 7)).toBe(200);
    expect(levelScore(6, 8)).toBe(150);
    expect(levelScore(6, 11)).toBe(150);
    expect(levelScore(6, 12)).toBe(100);
    expect(levelScore(6, 16)).toBe(100);
    expect(levelScore(6, 17)).toBe(50);
    expect(levelScore(6, 21)).toBe(50);
    expect(levelScore(6, 22)).toBe(25);
    expect(levelScore(6, 200)).toBe(25);
    // Five levels at most 1000.
    expect(LEVELS.length * levelScore(1, 1)).toBe(1000);
  });

  it('has five weapons and the levels of the skeleton castle', () => {
    expect(WEAPONS).toEqual(['pumpkin', 'cluster', 'homing', 'beam', 'bomb']);
    // Pasi 22.10.: 5–8 skeletons a level.
    expect(LEVELS.map((l) => l.skeletons.length)).toEqual([5, 6, 6, 7, 8]);
    expect(totalSkeletons()).toBe(32);
    expect(C.attempts).toBe(2);
    // Moving skeletons only from level 3 (Pasi 22.10.).
    expect(LEVELS.slice(0, 2).some((l) => l.skeletons.some((s) => s.moves))).toBe(false);
    expect(LEVELS.slice(2).every((l) => l.skeletons.some((s) => s.moves))).toBe(true);
  });
});

describe('battle', () => {
  it('stands every skeleton and barrel on ground', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const b = new Battle(i);
      for (const s of b.skeletons) {
        expect(s.y, `${LEVELS[i].name}: luuranko ${s.id}`).toBeLessThan(C.levelHeight);
        expect(b.terrain.isSolid(s.x, s.y + 1)).toBe(true);
        expect(b.terrain.isSolid(s.x, s.y - SKELETON_H / 2)).toBe(false);
      }
      settle(b, 2);
      expect(b.skeletonsLeft()).toBe(LEVELS[i].skeletons.length);
    }
  });

  it('a pumpkin flies in an arc, explodes on the ground and leaves a hole', () => {
    const b = new Battle(0);
    const before = b.terrain.count();
    b.fire('pumpkin', 45, 0.4);
    expect(b.busy()).toBe(true);
    const events = settle(b);
    expect(events.some((e) => e.type === 'blast')).toBe(true);
    expect(b.terrain.count()).toBeLessThan(before);
    expect(b.trail.length).toBeGreaterThan(10);
    expect(b.busy()).toBe(false);
  });

  it('a skeleton breaks when the blast reaches it', () => {
    const b = new Battle(0);
    const s = b.skeletons[0];
    b.explode(s.x + 20, s.y - 10, C.blastRadius, false);
    expect(s.alive).toBe(false);
    expect(b.skeletonsLeft()).toBe(LEVELS[0].skeletons.length - 1);
  });

  it('a skeleton falls into the moat when the bridge is blown away (Pasi 22.10.)', () => {
    const b = new Battle(1);
    const onBridge = b.skeletons.find((sk) => sk.x === 1100)!;
    b.explode(onBridge.x - 60, onBridge.y + 8, 30, false);
    b.explode(onBridge.x + 60, onBridge.y + 8, 30, false);
    // The bridge under its feet is gone, the skeleton itself was out of reach.
    expect(onBridge.alive).toBe(true);
    b.terrain.carve(onBridge.x, onBridge.y + 8, 40, 1);
    settle(b);
    expect(onBridge.alive).toBe(false);
  });

  it('the beam goes straight through the ground and everything on its way', () => {
    const b = new Battle(0);
    const target = b.skeletons[0];
    const { x, y } = b.launch;
    const angle = (Math.atan2(y - (target.y - SKELETON_H / 2), target.x - x) * 180) / Math.PI;
    b.fire('beam', angle, 0);
    const events = settle(b);
    expect(events.some((e) => e.type === 'beam')).toBe(true);
    expect(target.alive).toBe(false);
  });

  it('a cluster pumpkin breaks into bomblets', () => {
    const b = new Battle(0);
    b.fire('cluster', 40, 0.45);
    const events = settle(b);
    expect(events.filter((e) => e.type === 'blast').length).toBe(1 + C.bombletCount);
  });

  it('a homing pumpkin turns towards the nearest skeleton', () => {
    const b = new Battle(0);
    // Far too weak to reach anything by itself.
    b.fire('homing', 60, 0.05);
    settle(b);
    expect(b.skeletonsLeft()).toBeLessThan(LEVELS[0].skeletons.length);
  });

  it('a big bomb makes a larger hole than a pumpkin', () => {
    const a = new Battle(0);
    const b = new Battle(0);
    const before = a.terrain.count();
    a.explode(600, 540, C.blastRadius, false);
    b.explode(600, 540, C.bombRadius, false);
    expect(before - b.terrain.count()).toBeGreaterThan(2 * (before - a.terrain.count()));
  });

  it('a barrel explodes a moment after it is hit, and takes skeletons near it with it', () => {
    const b = new Battle(2);
    const barrel = b.barrels[0];
    b.explode(barrel.x - 40, barrel.y - 20, 30, false);
    expect(barrel.fuse).not.toBeNull();
    const events = settle(b);
    expect(events.filter((e) => e.type === 'blast' && e.barrel).length).toBe(1);
    expect(barrel.alive).toBe(false);
  });

  it('moving skeletons take a few steps after a shot and stay on their feet', () => {
    const b = new Battle(2);
    const walker = b.skeletons.find((s) => s.moves)!;
    const x0 = walker.x;
    b.startWalks();
    settle(b);
    expect(walker.alive).toBe(true);
    expect(Math.abs(walker.x - x0)).toBeGreaterThan(C.walkDistance * 0.5);
    expect(b.terrain.isSolid(walker.x, walker.y + 1)).toBe(true);
    b.startWalks();
    settle(b);
    expect(Math.abs(walker.x - x0)).toBeLessThan(C.walkDistance * 0.5);
  });
});

describe('every level can be cleared', () => {
  it('each skeleton can be hit with one normal pumpkin from the start', { timeout: 240_000 }, () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const hit = new Set<number>();
      for (let angle = C.angleMin; angle <= C.angleMax; angle += 1) {
        for (let power = 0; power <= 1.0001; power += 0.025) {
          const b = new Battle(i);
          b.fire('pumpkin', angle, power);
          for (let t = 0; t < 6 && b.projectiles.length > 0; t += 1 / 60) b.step(1 / 60);
          for (const s of b.skeletons) if (!s.alive) hit.add(s.id);
        }
        if (hit.size === LEVELS[i].skeletons.length) break;
      }
      const missing = LEVELS[i].skeletons.map((s, k) => ({ x: s.x, id: k + 1 })).filter((s) => !hit.has(s.id));
      expect(missing, `${LEVELS[i].name}: näihin ei osu yhdellä kurpitsalla`).toEqual([]);
    }
  });

  it('launch speeds cover the level', () => {
    const v = launchVelocity(45, 1);
    // Flat-ground range at 45° and full power reaches beyond the level.
    expect((v.vx * -v.vy * 2) / C.gravity).toBeGreaterThan(C.levelWidth);
  });
});
