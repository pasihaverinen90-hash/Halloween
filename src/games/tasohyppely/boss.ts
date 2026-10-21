import { CONFIG } from '../../config';
import type { Shot } from './enemies';
import { TILE, type Rect } from './logic';

/*
 * The head witch at the end of the forest (Pasi 21.10.: medium difficulty,
 * three stages, she calls ravens and skeletons to help). She flies on her
 * broom high in the arena and comes down now and then: swooping across at
 * head height (crouch under it or lash her), and resting low (jump and lash).
 * She grows angrier at 2/3 and 1/3 of her health. No Phaser here.
 */

const C = CONFIG.tasohyppely;

export type BossMode = 'enter' | 'hover' | 'cast' | 'swoop' | 'recoil' | 'rest' | 'pillars' | 'rage' | 'dead';
type Attack = 'orbs' | 'swoop' | 'rest' | 'ravens' | 'skeletons' | 'pillars';

/** Attacks in turn, by stage. */
const ROTATION: Record<1 | 2 | 3, Attack[]> = {
  1: ['orbs', 'swoop', 'rest', 'orbs', 'rest', 'swoop'],
  2: ['orbs', 'ravens', 'swoop', 'rest', 'skeletons', 'orbs', 'rest'],
  3: ['pillars', 'orbs', 'swoop', 'ravens', 'rest', 'pillars', 'skeletons', 'swoop', 'rest'],
};

export interface Pillar {
  x: number;
  /** Seconds since it was announced: a warning first, then fire. */
  t: number;
}

export const PILLAR_WARNING = 0.95;
export const PILLAR_FIRE = 0.6;
export const PILLAR_HALF_W = 26;

export interface Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  stage: 1 | 2 | 3;
  mode: BossMode;
  t: number;
  /** Seconds until the next attack while hovering. */
  attackIn: number;
  attackIndex: number;
  /** One lash = one hit. */
  hitCooldown: number;
  flash: number;
  facing: 1 | -1;
  /** The current attack's plan. */
  plan: { attack: Attack; fromX: number; toX: number; fromY: number; fired: boolean } | null;
  pillars: Pillar[];
  /** Hover drifts around this point. */
  drift: number;
}

export interface Arena {
  left: number;
  right: number;
  floorY: number;
}

export interface BossContext {
  dt: number;
  hx: number;
  hcy: number;
  arena: Arena;
  shoot(shot: Shot): void;
  summon(kind: 'raven' | 'skeleton', x: number, y: number): void;
  /** Sound cues for the scene. */
  cue(name: 'laugh' | 'cast' | 'swoop' | 'rage' | 'pillar' | 'fire'): void;
}

export function newBoss(arena: Arena): Boss {
  return {
    x: arena.right + TILE * 2,
    y: hoverY(arena),
    hp: C.bossHealth,
    maxHp: C.bossHealth,
    stage: 1,
    mode: 'enter',
    t: 0,
    attackIn: 1.2,
    attackIndex: 0,
    hitCooldown: 0,
    flash: 0,
    facing: -1,
    plan: null,
    pillars: [],
    drift: 0,
  };
}

function hoverY(arena: Arena): number {
  return arena.floorY - 300;
}

/** Inner edges of the arena for her flying. */
function bounds(arena: Arena): { min: number; max: number; mid: number } {
  const min = arena.left + 110;
  const max = arena.right - TILE - 110;
  return { min, max, mid: (min + max) / 2 };
}

/** Her body: touching it hurts, and the whip hits it. */
export function bossRect(b: Boss): Rect {
  return { x: b.x - 30, y: b.y - 40, w: 60, h: 76 };
}

/** Can the whip hurt her right now? */
export function bossHittable(b: Boss): boolean {
  return b.hitCooldown <= 0 && b.mode !== 'enter' && b.mode !== 'rage' && b.mode !== 'dead';
}

/** Does touching her hurt the hunter right now? */
export function bossHarmful(b: Boss): boolean {
  return b.mode !== 'enter' && b.mode !== 'dead';
}

/** Share of her health taken (0..1): the head witch's points (Pasi 21.10.). */
export function bossShare(b: Boss): number {
  return (b.maxHp - b.hp) / b.maxHp;
}

function setMode(b: Boss, mode: BossMode): void {
  b.mode = mode;
  b.t = 0;
}

function speedFactor(b: Boss): number {
  return b.stage === 1 ? 1 : b.stage === 2 ? 1.2 : 1.4;
}

function attackGap(b: Boss): number {
  const share = (b.stage - 1) / 2;
  return C.bossAttackGapStart + (C.bossAttackGapEnd - C.bossAttackGapStart) * share;
}

/** A whip hit. Returns true when it hurt her. */
export function hitBoss(b: Boss, damage: number): boolean {
  if (!bossHittable(b)) return false;
  b.hp = Math.max(0, b.hp - damage);
  b.hitCooldown = C.bossHitCooldown;
  b.flash = 0.15;
  if (b.hp <= 0) {
    setMode(b, 'dead');
    b.pillars = [];
    return true;
  }
  const stage: 1 | 2 | 3 = b.hp <= b.maxHp / 3 ? 3 : b.hp <= (b.maxHp * 2) / 3 ? 2 : 1;
  if (stage !== b.stage) {
    b.stage = stage;
    b.attackIndex = 0;
    b.plan = null;
    setMode(b, 'rage');
  } else if (b.mode === 'swoop') {
    // A lash knocks her out of the swoop.
    setMode(b, 'recoil');
  }
  return true;
}

export function updateBoss(b: Boss, c: BossContext): void {
  const dt = c.dt;
  b.t += dt;
  b.hitCooldown = Math.max(0, b.hitCooldown - dt);
  b.flash = Math.max(0, b.flash - dt);
  updatePillars(b, c);
  const { min, max, mid } = bounds(c.arena);
  const top = hoverY(c.arena);
  if (b.mode !== 'swoop') b.facing = c.hx < b.x ? -1 : 1;

  switch (b.mode) {
    case 'enter': {
      b.x += (mid + 160 - b.x) * Math.min(1, dt * 2.2);
      b.y = top + Math.sin(b.t * 2) * 14;
      if (b.t > 2.2) {
        c.cue('laugh');
        setMode(b, 'hover');
      }
      return;
    }
    case 'hover': {
      b.drift += dt * 0.7 * speedFactor(b);
      const goalX = mid + Math.sin(b.drift) * (max - mid) * 0.85;
      b.x += (goalX - b.x) * Math.min(1, dt * 1.6);
      b.y += (top + Math.sin(b.t * 2.2) * 22 - b.y) * Math.min(1, dt * 3);
      b.attackIn -= dt;
      if (b.attackIn <= 0) startAttack(b, c);
      return;
    }
    case 'cast': {
      const plan = b.plan!;
      if (!plan.fired && b.t >= 0.6) {
        plan.fired = true;
        if (plan.attack === 'orbs') fireOrbs(b, c);
        else if (plan.attack === 'ravens') summonRavens(b, c);
        else summonSkeletons(b, c);
      }
      if (b.t >= 1.0) backToHover(b);
      return;
    }
    case 'swoop': {
      const plan = b.plan!;
      const duration = 1.7 / speedFactor(b);
      const u = Math.min(1, b.t / duration);
      const low = c.arena.floorY - 96;
      b.x = plan.fromX + (plan.toX - plan.fromX) * u;
      b.y = plan.fromY + (low - plan.fromY) * Math.sin(u * Math.PI);
      b.facing = plan.toX < plan.fromX ? -1 : 1;
      if (u >= 1) backToHover(b);
      return;
    }
    case 'recoil': {
      b.y += (top - b.y) * Math.min(1, dt * 3);
      if (b.t >= 0.9) backToHover(b);
      return;
    }
    case 'rest': {
      // Down low for a while: the moment to jump and lash.
      const low = c.arena.floorY - 160;
      const stay = 1.9 - (b.stage - 1) * 0.3;
      if (b.t < 0.7) b.y += (low - b.y) * Math.min(1, dt * 5);
      else if (b.t < 0.7 + stay) b.y = low + Math.sin(b.t * 3) * 8;
      else b.y += (top - b.y) * Math.min(1, dt * 4);
      if (b.t >= 1.5 + stay) backToHover(b);
      return;
    }
    case 'pillars': {
      b.y += (top - 70 - b.y) * Math.min(1, dt * 3);
      const plan = b.plan!;
      if (!plan.fired && b.t >= 0.5) {
        plan.fired = true;
        c.cue('pillar');
        const spacing = (max - min) / 4;
        const offset = ((c.hx - min) % spacing + spacing) % spacing;
        for (let i = 0; i < 5; i++) {
          const x = min + offset + spacing * (i - 0.5);
          if (x >= c.arena.left + 30 && x <= c.arena.right - TILE - 30) b.pillars.push({ x, t: 0 });
        }
        // Always one right under the hunter.
        if (!b.pillars.some((p) => Math.abs(p.x - c.hx) < PILLAR_HALF_W)) b.pillars.push({ x: c.hx, t: 0 });
      }
      if (b.t >= 0.5 + PILLAR_WARNING + PILLAR_FIRE + 0.2) backToHover(b);
      return;
    }
    case 'rage': {
      b.y += (top - 40 - b.y) * Math.min(1, dt * 3);
      if (b.t < dt * 1.5) c.cue('rage');
      if (b.t >= 1.3) backToHover(b);
      return;
    }
    case 'dead': {
      b.y = Math.min(c.arena.floorY - 30, b.y + 160 * dt);
      return;
    }
  }
}

function backToHover(b: Boss): void {
  b.plan = null;
  b.attackIn = attackGap(b);
  setMode(b, 'hover');
}

function startAttack(b: Boss, c: BossContext): void {
  const list = ROTATION[b.stage];
  const attack = list[b.attackIndex % list.length];
  b.attackIndex++;
  const { min, max, mid } = bounds(c.arena);
  b.plan = { attack, fromX: b.x, toX: b.x < mid ? max : min, fromY: b.y, fired: false };
  if (attack === 'swoop') {
    c.cue('swoop');
    setMode(b, 'swoop');
  } else if (attack === 'rest') setMode(b, 'rest');
  else if (attack === 'pillars') setMode(b, 'pillars');
  else {
    c.cue('cast');
    setMode(b, 'cast');
  }
}

function fireOrbs(b: Boss, c: BossContext): void {
  const count = b.stage === 1 ? 3 : 5;
  const speed = b.stage === 1 ? 230 : b.stage === 2 ? 260 : 290;
  const spread = 0.22;
  const aim = Math.atan2(c.hcy - b.y, c.hx - b.x);
  for (let i = 0; i < count; i++) {
    const a = aim + (i - (count - 1) / 2) * spread;
    c.shoot({ kind: 'orb', x: b.x, y: b.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, gravity: 0, radius: 12, life: 6 });
  }
  c.cue('fire');
}

function summonRavens(b: Boss, c: BossContext): void {
  const fromLeft = c.hx > (c.arena.left + c.arena.right) / 2;
  const x = fromLeft ? c.arena.left + 20 : c.arena.right - TILE - 20;
  const count = b.stage === 2 ? 3 : 4;
  for (let i = 0; i < count; i++) c.summon('raven', x, c.arena.floorY - 140 - i * 70);
}

function summonSkeletons(b: Boss, c: BossContext): void {
  const left = c.arena.left + TILE;
  const right = c.arena.right - TILE * 2;
  const count = b.stage === 2 ? 2 : 3;
  const xs = [c.hx - TILE * 4, c.hx + TILE * 4, c.hx - TILE * 7].slice(0, count);
  for (const x of xs) c.summon('skeleton', Math.min(right, Math.max(left, x)), c.arena.floorY);
}

function updatePillars(b: Boss, c: BossContext): void {
  for (const p of b.pillars) {
    const before = p.t;
    p.t += c.dt;
    if (before < PILLAR_WARNING && p.t >= PILLAR_WARNING) c.cue('fire');
  }
  b.pillars = b.pillars.filter((p) => p.t < PILLAR_WARNING + PILLAR_FIRE);
}

/** Does a burning pillar hit the hunter at x? */
export function pillarHits(b: Boss, x: number): boolean {
  return b.pillars.some((p) => p.t >= PILLAR_WARNING && Math.abs(p.x - x) < PILLAR_HALF_W + 10);
}
