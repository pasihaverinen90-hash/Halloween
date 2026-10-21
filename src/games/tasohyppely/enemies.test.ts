import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { bossHittable, bossShare, hitBoss, newBoss, pillarHits, PILLAR_WARNING, updateBoss, type Arena, type Boss, type BossContext } from './boss';
import { enemyRect, newEnemy, updateEnemy, updateShot, type Enemy, type EnemyContext, type Shot } from './enemies';
import { parseLevel, TILE, type EnemyKind, type World } from './logic';

const C = CONFIG.tasohyppely;
const DT = 1 / 60;

const LEVEL = parseLevel(
  {
    name: 'Testi',
    theme: 'linna',
    chunks: [
      {
        rows: [
          '##############################',
          '..............................',
          '..............................',
          '..............................',
          '..............................',
          '.S...........................G',
          '##############################',
        ],
      },
    ],
  },
  0,
);
const WORLD: World = { level: LEVEL, gone: new Set(), platforms: [] };
const FLOOR = 6 * TILE;

function enemy(kind: EnemyKind, col: number, row = 5): Enemy {
  return newEnemy({ id: 1, kind, x: col * TILE + TILE / 2, y: (row + 1) * TILE });
}

/** Run an enemy with the hunter standing still at column `hunterCol`. Returns the shots it fired. */
function run(e: Enemy, hunterCol: number, seconds: number): Shot[] {
  const shots: Shot[] = [];
  const hx = hunterCol * TILE + TILE / 2;
  const c: EnemyContext = { dt: DT, hx, hy: FLOOR, hcy: FLOOR - 42, world: WORLD, shoot: (s) => shots.push(s), viewLeft: 0, viewRight: LEVEL.width };
  for (let i = 0; i < seconds * 60; i++) updateEnemy(e, c);
  return shots;
}

describe('enemies', () => {
  it('zombies stay underground until the hunter comes near, then rise and shamble towards him', () => {
    const far = enemy('zombie', 25);
    run(far, 2, 2);
    expect(far.state).toBe('idle');
    expect(enemyRect(far)).toBeNull();
    const near = enemy('zombie', 12);
    run(near, 8, 0.3);
    expect(near.state).toBe('rise');
    run(near, 8, 1.5);
    expect(near.state).toBe('move');
    expect(near.x).toBeLessThan(12 * TILE + TILE / 2);
    expect(enemyRect(near)!.h).toBe(80);
  });

  it('armours throw axes in an arc at the hunter now and then', () => {
    const a = enemy('armor', 14);
    const shots = run(a, 8, 6);
    expect(shots.length).toBeGreaterThanOrEqual(2);
    expect(shots[0].kind).toBe('axe');
    expect(shots[0].vx).toBeLessThan(0);
    expect(shots[0].vy).toBeLessThan(0);
  });

  it('mushrooms puff two spores at a time', () => {
    const m = enemy('mushroom', 14);
    const shots = run(m, 8, 3);
    expect(shots.length % 2).toBe(0);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every((s) => s.kind === 'spore')).toBe(true);
  });

  it('wolves howl and then charge fast', () => {
    const w = enemy('wolf', 14);
    run(w, 8, 0.2);
    expect(w.state).toBe('rise');
    const x = w.x;
    run(w, 8, 0.6);
    expect(w.state).toBe('move');
    expect(x - w.x).toBeGreaterThan(TILE);
  });

  it('spiders drop from the ceiling when the hunter walks under them, and climb back', () => {
    const s = enemy('spider', 8, 1);
    const top = s.y;
    run(s, 8, 0.5);
    expect(s.y).toBeGreaterThan(top + TILE * 2);
    run(s, 20, 4);
    expect(s.y).toBe(top);
  });

  it('bats and skulls fly past and are gone once they leave the view', () => {
    for (const kind of ['bat', 'skull'] as const) {
      const e = enemy(kind, 10, 3);
      const c: EnemyContext = { dt: DT, hx: 6 * TILE, hy: FLOOR, hcy: FLOOR - 42, world: WORLD, shoot: () => undefined, viewLeft: 4 * TILE, viewRight: 20 * TILE };
      for (let i = 0; i < 600; i++) updateEnemy(e, c);
      expect(e.state).toBe('gone');
    }
  });

  it('projectiles stop at walls and floors', () => {
    const s: Shot = { kind: 'axe', x: 5 * TILE, y: FLOOR - 60, vx: 0, vy: 0, gravity: 1250, radius: 14, life: 4 };
    let alive = true;
    for (let i = 0; i < 120 && alive; i++) alive = updateShot(s, DT, WORLD);
    expect(alive).toBe(false);
    expect(s.y).toBeLessThan(FLOOR + TILE);
  });
});

describe('head witch', () => {
  const arena: Arena = { left: 0, right: 27 * TILE, floorY: 20 * TILE };

  function fight(b: Boss, seconds: number, hx = 10 * TILE): { shots: Shot[]; summoned: string[] } {
    const shots: Shot[] = [];
    const summoned: string[] = [];
    const c: BossContext = { dt: DT, hx, hcy: arena.floorY - 42, arena, shoot: (s) => shots.push(s), summon: (kind) => summoned.push(kind), cue: () => undefined };
    for (let i = 0; i < seconds * 60; i++) updateBoss(b, c);
    return { shots, summoned };
  }

  it('flies in, then attacks with magic orbs, swoops and rests low', () => {
    const b = newBoss(arena);
    expect(bossHittable(b)).toBe(false);
    fight(b, 2.5);
    expect(b.mode).toBe('hover');
    const modes = new Set<string>();
    const shots: Shot[] = [];
    for (let i = 0; i < 30; i++) {
      shots.push(...fight(b, 0.5).shots);
      modes.add(b.mode);
    }
    expect(shots.some((s) => s.kind === 'orb')).toBe(true);
    expect(modes.has('swoop')).toBe(true);
    expect(modes.has('rest')).toBe(true);
  });

  it('grows angrier at 2/3 and 1/3 of her health and then calls ravens, skeletons and fire pillars', () => {
    const b = newBoss(arena);
    fight(b, 2.5);
    const hits = (n: number): void => {
      for (let i = 0; i < n; i++) {
        b.hitCooldown = 0;
        if (b.mode === 'rage') fight(b, 1.5);
        hitBoss(b, 1);
      }
    };
    hits(C.bossHealth / 3);
    expect(b.stage).toBe(2);
    expect(b.mode).toBe('rage');
    const summoned: string[] = [];
    for (let i = 0; i < 40; i++) summoned.push(...fight(b, 0.5).summoned);
    expect(summoned).toContain('raven');
    expect(summoned).toContain('skeleton');
    hits(C.bossHealth / 3);
    expect(b.stage).toBe(3);
    let burned = false;
    for (let i = 0; i < 80 && !burned; i++) {
      fight(b, 0.25, 10 * TILE);
      burned = b.pillars.some((p) => p.t >= PILLAR_WARNING) && pillarHits(b, 10 * TILE);
    }
    expect(burned).toBe(true);
  });

  it('gives her points as the share of health taken, and falls at zero', () => {
    const b = newBoss(arena);
    fight(b, 2.5);
    b.hp = 2;
    expect(bossShare(b)).toBeCloseTo((C.bossHealth - 2) / C.bossHealth, 5);
    b.hitCooldown = 0;
    hitBoss(b, 2);
    expect(b.mode).toBe('dead');
    expect(bossShare(b)).toBe(1);
    expect(hitBoss(b, 1)).toBe(false);
  });

  it('one lash is one hit, and a lash knocks her out of a swoop', () => {
    const b = newBoss(arena);
    fight(b, 2.5);
    expect(hitBoss(b, 1)).toBe(true);
    expect(hitBoss(b, 1)).toBe(false);
    b.hitCooldown = 0;
    b.mode = 'swoop';
    b.plan = { attack: 'swoop', fromX: b.x, toX: 2 * TILE, fromY: b.y, fired: false };
    hitBoss(b, 1);
    expect(b.mode).toBe('recoil');
  });
});
