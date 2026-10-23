import { CONFIG } from '../../config';
import { LEVELS, type LevelDef } from './levels';
import { Terrain } from './terrain';

/*
 * Catapult rules (CLAUDE.md, game 7; Pasi 22.10.) as plain data and
 * functions: one level's battle (pumpkins in flight, explosions, falling and
 * walking skeletons, barrels) and the points. No Phaser here.
 * Positions: skeletons and barrels by their feet (x = centre, y = bottom).
 */

const C = CONFIG.kurpitsalinko;

export type Weapon = 'pumpkin' | 'cluster' | 'homing' | 'beam' | 'bomb';
/** Pasi 22.10.: five weapons, chosen with 1–5. The normal pumpkin never runs out; each special one once a level. */
export const WEAPONS: readonly Weapon[] = ['pumpkin', 'cluster', 'homing', 'beam', 'bomb'];
export const WEAPON_NAMES: Record<Weapon, string> = {
  pumpkin: 'Kurpitsa',
  cluster: 'Rypälekurpitsa',
  homing: 'Ohjautuva kurpitsa',
  beam: 'Kurpitsasäde',
  bomb: 'Kurpitsapommi',
};

export const SKELETON_W = 28;
export const SKELETON_H = 72;
export const BARREL_W = 34;
export const BARREL_H = 42;

type ProjectileKind = 'pumpkin' | 'cluster' | 'bomblet' | 'homing' | 'bomb';

export interface Projectile {
  id: number;
  kind: ProjectileKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

export interface Skeleton {
  id: number;
  x: number;
  y: number;
  vy: number;
  alive: boolean;
  /** Height where the current fall began, or null when standing. */
  fallFrom: number | null;
  moves: boolean;
  /** Walking: distance still to go, and which way. */
  walkLeft: number;
  dir: 1 | -1;
}

export interface Barrel {
  id: number;
  x: number;
  y: number;
  vy: number;
  alive: boolean;
  /** Seconds until it explodes after being hit, or null. */
  fuse: number | null;
}

/** A crate with a special weapon inside (Pasi 23.10.); `alive` = still closed. */
export interface Crate extends Barrel {
  weapon: Exclude<Weapon, 'pumpkin'>;
  amount: number;
}

/** A floating −1 or −3 that takes shots off the level's count (Pasi 23.10.). */
export interface Token {
  id: number;
  x: number;
  y: number;
  value: number;
  taken: boolean;
}

export const CRATE_W = 40;
export const CRATE_H = 36;

export type BattleEvent =
  | { type: 'blast'; x: number; y: number; r: number; barrel: boolean }
  | { type: 'crate'; x: number; y: number; weapon: Exclude<Weapon, 'pumpkin'>; amount: number }
  | { type: 'token'; x: number; y: number; value: number }
  | { type: 'beam'; x0: number; y0: number; x1: number; y1: number; width: number }
  | { type: 'kill'; id: number; x: number; y: number; how: 'blast' | 'fall' | 'water' | 'out' }
  | { type: 'splash'; x: number; y: number }
  | { type: 'miss' }
  | { type: 'bomblets'; x: number; y: number };

/** The catapult's launch point: the end of its arm. */
export function launchPoint(level: LevelDef, terrain: Terrain): { x: number; y: number } {
  const ground = terrain.surfaceBelow(level.catapultX, 0) ?? C.levelHeight - 100;
  return { x: level.catapultX + 34, y: ground - 92 };
}

/** Launch velocity for an angle (degrees above the horizon) and power 0..1. */
export function launchVelocity(angleDeg: number, power: number): { vx: number; vy: number } {
  const speed = C.minSpeed + (C.maxSpeed - C.minSpeed) * Math.min(1, Math.max(0, power));
  const a = (angleDeg * Math.PI) / 180;
  return { vx: Math.cos(a) * speed, vy: -Math.sin(a) * speed };
}

/** Pasi 22.10.: power swings up and down while Space is held. Held seconds → power 0..1. */
export function powerAt(heldSeconds: number): number {
  const half = C.powerSwingSeconds / 2;
  const t = heldSeconds % C.powerSwingSeconds;
  return t <= half ? t / half : 2 - t / half;
}

/**
 * Points of one level (Pasi 22.10., 23.10. more forgiving): 200 when the shots
 * are at most the skeletons + 3, then less in steps (CONFIG.kurpitsalinko.pointSteps).
 */
export function levelScore(skeletons: number, shots: number): number {
  const extra = shots - skeletons;
  for (const step of C.pointSteps) if (extra <= step.extra) return step.points;
  return C.fewestPoints;
}

export function totalSkeletons(): number {
  return LEVELS.reduce((sum, level) => sum + level.skeletons.length, 0);
}

const baseTerrains = new Map<number, Terrain>();

/** The level's untouched ground (built once, copied for every battle). */
export function levelTerrain(index: number): Terrain {
  let base = baseTerrains.get(index);
  if (!base) {
    base = new Terrain(C.levelWidth, C.levelHeight, LEVELS[index].shapes);
    baseTerrains.set(index, base);
  }
  return base.clone();
}

function rectCircle(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number): boolean {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}

/** One level being played. */
export class Battle {
  readonly index: number;
  readonly level: LevelDef;
  readonly terrain: Terrain;
  skeletons: Skeleton[];
  barrels: Barrel[];
  crates: Crate[];
  tokens: Token[];
  projectiles: Projectile[] = [];
  /** Things that happened since the last takeEvents() (for pictures and sounds). */
  private events: BattleEvent[] = [];
  /** The beam glows this long; the turn waits for it. */
  private beamLeft = 0;
  private nextId = 1;
  /** The path of the shot in flight (for the dotted line of the previous shot). */
  trail: Array<[number, number]> = [];

  constructor(index: number) {
    this.index = index;
    this.level = LEVELS[index];
    this.terrain = levelTerrain(index);
    this.skeletons = this.level.skeletons.map((s, i) => ({
      id: i + 1,
      x: s.x,
      y: this.terrain.surfaceBelow(s.x, s.fromY ?? 0) ?? C.levelHeight,
      vy: 0,
      alive: true,
      fallFrom: null,
      moves: s.moves === true,
      walkLeft: 0,
      dir: -1,
    }));
    this.barrels = this.level.barrels.map((b, i) => ({
      id: 100 + i,
      x: b.x,
      y: this.terrain.surfaceBelow(b.x, b.fromY ?? 0) ?? C.levelHeight,
      vy: 0,
      alive: true,
      fuse: null,
    }));
    this.crates = this.level.crates.map((c, i) => ({
      id: 200 + i,
      x: c.x,
      y: this.terrain.surfaceBelow(c.x, c.fromY ?? 0) ?? C.levelHeight,
      vy: 0,
      alive: true,
      fuse: null,
      weapon: c.weapon,
      amount: c.amount,
    }));
    this.tokens = this.level.tokens.map((t, i) => ({ id: 300 + i, x: t.x, y: t.y, value: t.value, taken: false }));
  }

  get launch(): { x: number; y: number } {
    return launchPoint(this.level, this.terrain);
  }

  takeEvents(): BattleEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  skeletonsLeft(): number {
    return this.skeletons.filter((s) => s.alive).length;
  }

  /** Something is still flying, falling, walking, burning or about to explode. */
  busy(): boolean {
    return (
      this.projectiles.length > 0 ||
      this.beamLeft > 0 ||
      this.barrels.some((b) => b.alive && (b.fuse !== null || b.vy !== 0)) ||
      this.crates.some((c) => c.alive && c.vy !== 0) ||
      this.skeletons.some((s) => s.alive && (s.fallFrom !== null || s.walkLeft > 0))
    );
  }

  /** Fire a weapon. The beam acts at once; the others fly. */
  fire(weapon: Weapon, angleDeg: number, power: number): void {
    const { x, y } = this.launch;
    this.trail = [[x, y]];
    if (weapon === 'beam') {
      this.fireBeam(x, y, angleDeg);
      return;
    }
    const v = launchVelocity(angleDeg, power);
    this.projectiles.push({ id: this.nextId++, kind: weapon, x, y, vx: v.vx, vy: v.vy, age: 0 });
  }

  private fireBeam(x0: number, y0: number, angleDeg: number): void {
    const a = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(a);
    const dy = -Math.sin(a);
    const half = C.beamWidth / 2;
    let x = x0;
    let y = y0;
    // Straight through everything to the edge of the level.
    while (x >= -20 && x <= C.levelWidth + 20 && y >= -20 && y <= C.levelHeight + 20) {
      this.terrain.carve(x, y, half);
      for (const s of this.skeletons) {
        if (s.alive && rectCircle(x, y, half, s.x - SKELETON_W / 2, s.y - SKELETON_H, SKELETON_W, SKELETON_H)) this.kill(s, 'blast');
      }
      for (const b of this.barrels) {
        if (b.alive && b.fuse === null && rectCircle(x, y, half, b.x - BARREL_W / 2, b.y - BARREL_H, BARREL_W, BARREL_H)) b.fuse = C.barrelDelay;
      }
      for (const c of this.crates) {
        if (c.alive && rectCircle(x, y, half, c.x - CRATE_W / 2, c.y - CRATE_H, CRATE_W, CRATE_H)) this.openCrate(c);
      }
      this.collectTokens(x, y);
      this.trail.push([x, y]);
      x += dx * 6;
      y += dy * 6;
    }
    this.events.push({ type: 'beam', x0, y0, x1: x, y1: y, width: C.beamWidth });
    this.beamLeft = C.beamSeconds;
  }

  /** Advance by dt seconds (small steps inside). */
  step(dt: number): void {
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.tick(h);
  }

  private tick(dt: number): void {
    this.beamLeft = Math.max(0, this.beamLeft - dt);
    for (const p of [...this.projectiles]) this.moveProjectile(p, dt);
    for (const b of this.barrels) {
      if (!b.alive) continue;
      if (b.fuse !== null) {
        b.fuse -= dt;
        if (b.fuse <= 0) {
          b.alive = false;
          this.explode(b.x, b.y - BARREL_H / 2, C.barrelRadius, true);
          continue;
        }
      }
      this.fall(b, dt);
    }
    for (const c of this.crates) if (c.alive) this.fall(c, dt);
    for (const s of this.skeletons) {
      if (!s.alive) continue;
      this.fall(s, dt);
      if (s.alive && s.fallFrom === null && s.walkLeft > 0) this.walk(s, dt);
    }
  }

  private openCrate(c: Crate): void {
    c.alive = false;
    this.events.push({ type: 'crate', x: c.x, y: c.y - CRATE_H / 2, weapon: c.weapon, amount: c.amount });
  }

  private collectTokens(x: number, y: number): void {
    for (const t of this.tokens) {
      if (!t.taken && Math.hypot(t.x - x, t.y - y) <= C.tokenRadius) {
        t.taken = true;
        this.events.push({ type: 'token', x: t.x, y: t.y, value: t.value });
      }
    }
  }

  private moveProjectile(p: Projectile, dt: number): void {
    p.age += dt;
    // Pasi 23.10.: the homing pumpkin flies freely until it starts to come down, then turns hard
    // towards the nearest living skeleton.
    const target = p.kind === 'homing' && p.vy > 0 ? this.nearestSkeleton(p.x, p.y, C.homingRange) : null;
    if (target) {
      const want = Math.atan2(target.y - SKELETON_H / 2 - p.y, target.x - p.x);
      const have = Math.atan2(p.vy, p.vx);
      let turn = want - have;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      const a = have + Math.max(-C.homingTurn * dt, Math.min(C.homingTurn * dt, turn));
      const speed = Math.max(C.homingSpeed, Math.hypot(p.vx, p.vy));
      p.vx = Math.cos(a) * speed;
      p.vy = Math.sin(a) * speed;
    } else {
      p.vy += C.gravity * dt;
    }
    if (p.kind === 'homing' && p.age > C.homingSeconds) {
      this.explodeProjectile(p);
      return;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind !== 'bomblet' && this.projectiles[0] === p) this.trail.push([p.x, p.y]);
    this.collectTokens(p.x, p.y);

    // Into the moat: it sinks without exploding.
    for (const w of this.level.water) {
      if (p.x >= w.x0 && p.x <= w.x1 && p.y >= w.y) {
        this.remove(p);
        this.events.push({ type: 'splash', x: p.x, y: w.y });
        return;
      }
    }
    if (p.x < -60 || p.x > C.levelWidth + 60 || p.y > C.levelHeight + 60) {
      this.remove(p);
      this.events.push({ type: 'miss' });
      return;
    }
    const hitsThing =
      this.skeletons.some((s) => s.alive && rectCircle(p.x, p.y, 8, s.x - SKELETON_W / 2, s.y - SKELETON_H, SKELETON_W, SKELETON_H)) ||
      this.barrels.some((b) => b.alive && rectCircle(p.x, p.y, 8, b.x - BARREL_W / 2, b.y - BARREL_H, BARREL_W, BARREL_H)) ||
      this.crates.some((c) => c.alive && rectCircle(p.x, p.y, 8, c.x - CRATE_W / 2, c.y - CRATE_H, CRATE_W, CRATE_H));
    if (hitsThing || this.terrain.isSolid(p.x, p.y)) this.explodeProjectile(p);
  }

  private explodeProjectile(p: Projectile): void {
    this.remove(p);
    if (p.kind === 'bomb') {
      this.explode(p.x, p.y, C.bombRadius, false);
    } else if (p.kind === 'bomblet') {
      this.explode(p.x, p.y, C.bombletRadius, false);
    } else if (p.kind === 'cluster') {
      this.explode(p.x, p.y, C.bombletRadius, false);
      this.events.push({ type: 'bomblets', x: p.x, y: p.y });
      for (let i = 0; i < C.bombletCount; i++) {
        const spread = (i / (C.bombletCount - 1) - 0.5) * 2;
        this.projectiles.push({ id: this.nextId++, kind: 'bomblet', x: p.x, y: p.y - 14, vx: spread * 230 + p.vx * 0.15, vy: -430 + Math.abs(spread) * 90, age: 0 });
      }
    } else {
      this.explode(p.x, p.y, C.blastRadius, false);
    }
  }

  private remove(p: Projectile): void {
    this.projectiles = this.projectiles.filter((q) => q !== p);
  }

  /** A blast: a hole in the ground, skeletons near it fall apart, barrels near it are lit. */
  explode(x: number, y: number, r: number, barrel: boolean): void {
    this.terrain.carve(x, y, r, C.woodBlastFactor);
    for (const s of this.skeletons) {
      if (s.alive && rectCircle(x, y, r * 0.85, s.x - SKELETON_W / 2, s.y - SKELETON_H, SKELETON_W, SKELETON_H)) this.kill(s, 'blast');
    }
    for (const b of this.barrels) {
      if (b.alive && b.fuse === null && rectCircle(x, y, r * 0.85, b.x - BARREL_W / 2, b.y - BARREL_H, BARREL_W, BARREL_H)) b.fuse = C.barrelDelay;
    }
    for (const c of this.crates) {
      if (c.alive && rectCircle(x, y, r * 0.85, c.x - CRATE_W / 2, c.y - CRATE_H, CRATE_W, CRATE_H)) this.openCrate(c);
    }
    this.events.push({ type: 'blast', x, y, r, barrel });
  }

  private kill(s: Skeleton, how: 'blast' | 'fall' | 'water' | 'out'): void {
    s.alive = false;
    s.walkLeft = 0;
    this.events.push({ type: 'kill', id: s.id, x: s.x, y: s.y, how });
  }

  private supported(x: number, y: number, half: number): boolean {
    return this.terrain.solidSpan(x - half, x + half, y + 1);
  }

  /** Gravity for skeletons and barrels whose ground was blown away. */
  private fall(t: Skeleton | Barrel, dt: number): void {
    const half = ('dir' in t ? SKELETON_W : BARREL_W) / 2 - 4;
    if (this.supported(t.x, t.y, half) && t.vy === 0) {
      if ('fallFrom' in t) t.fallFrom = null;
      return;
    }
    if ('fallFrom' in t && t.fallFrom === null) t.fallFrom = t.y;
    t.vy = Math.min(900, t.vy + C.gravity * dt);
    let move = t.vy * dt;
    while (move > 0) {
      const d = Math.min(2, move);
      if (this.supported(t.x, t.y, half)) break;
      t.y += d;
      move -= d;
    }
    const landed = this.supported(t.x, t.y, half);
    const inWater = this.level.water.some((w) => t.x >= w.x0 && t.x <= w.x1 && t.y >= w.y);
    if ('fallFrom' in t) {
      if (inWater) return this.kill(t, 'water');
      if (t.y > C.levelHeight + 20) return this.kill(t, 'out');
      if (landed) {
        const height = t.y - (t.fallFrom ?? t.y);
        t.vy = 0;
        t.fallFrom = null;
        if (height > C.fallBreak) this.kill(t, 'fall');
      }
    } else {
      if (inWater || t.y > C.levelHeight + 20) {
        t.alive = false;
        t.fuse = null;
        return;
      }
      if (landed) t.vy = 0;
    }
  }

  /** After every shot, the moving skeletons take a few steps (from level 3, Pasi 22.10.). */
  startWalks(): void {
    for (const s of this.skeletons) {
      if (s.alive && s.moves) s.walkLeft = C.walkDistance;
    }
  }

  private walk(s: Skeleton, dt: number): void {
    let go = Math.min(s.walkLeft, 70 * dt);
    s.walkLeft -= go;
    while (go > 0) {
      const d = Math.min(1, go);
      go -= d;
      const nx = s.x + s.dir * d;
      const front = nx + s.dir * (SKELETON_W / 2);
      // A wall turns it around; a small step is climbed; a drop is not walked off.
      let ny = s.y;
      while (ny > s.y - 10 && this.terrain.isSolid(front, ny - 1)) ny -= 1;
      const wall = this.terrain.isSolid(front, ny - 1) || this.terrain.solidSpan(front - 1, front + 1, ny - SKELETON_H + 8);
      let below = ny;
      while (below < s.y + 10 && !this.terrain.isSolid(nx, below + 1)) below += 1;
      const ledge = !this.terrain.isSolid(nx, below + 1);
      const outside = nx < this.level.catapultX + 220 || nx > C.levelWidth - 30;
      if (wall || ledge || outside) {
        s.dir = s.dir === 1 ? -1 : 1;
        continue;
      }
      s.x = nx;
      s.y = below;
    }
    if (s.walkLeft <= 0) s.dir = s.dir === 1 ? -1 : 1;
  }

  private nearestSkeleton(x: number, y: number, range = Infinity): Skeleton | null {
    let best: Skeleton | null = null;
    let bestD = range;
    for (const s of this.skeletons) {
      if (!s.alive) continue;
      const d = Math.hypot(s.x - x, s.y - SKELETON_H / 2 - y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }
}

export function levelCount(): number {
  return LEVELS.length;
}
