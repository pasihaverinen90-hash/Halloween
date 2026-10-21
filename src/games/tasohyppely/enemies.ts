import { isSolid, isStandable, TILE, type EnemyKind, type EnemySpawn, type Rect, type World } from './logic';

/*
 * Enemy behaviour as plain data and functions (no Phaser), Pasi 21.10.:
 * graveyard zombies rise from the ground, bats swoop and ravens dive; castle
 * armours throw axes, skulls fly in waves and spiders drop from the ceiling;
 * in the forest wisps float after the hunter, mushrooms shoot spores and
 * wolves charge. Skeletons are raised by the head witch.
 * Enemies wake when the hunter comes near; defeated ones never come back.
 */

/** Hits of the basic whip each enemy takes (Pasi 21.10.: most fall to one lash). */
export const ENEMY_HP: Record<EnemyKind, number> = {
  zombie: 1,
  bat: 1,
  raven: 1,
  armor: 3,
  skull: 1,
  spider: 1,
  wisp: 1,
  mushroom: 2,
  wolf: 2,
  skeleton: 1,
};

/** Hitbox width and height. Walkers stand on their feet (y), the rest are centred on y. */
const SIZE: Record<EnemyKind, [number, number]> = {
  zombie: [30, 80],
  bat: [34, 22],
  raven: [34, 26],
  armor: [36, 88],
  skull: [34, 32],
  spider: [30, 24],
  wisp: [26, 26],
  mushroom: [40, 40],
  wolf: [60, 40],
  skeleton: [30, 82],
};

export const WALKERS: ReadonlySet<EnemyKind> = new Set<EnemyKind>(['zombie', 'armor', 'mushroom', 'wolf', 'skeleton']);

export type EnemyState = 'idle' | 'rise' | 'move' | 'attack' | 'return' | 'gone';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  state: EnemyState;
  /** Seconds in the current state. */
  t: number;
  /** Seconds until the next attack (throwers, shooters, chargers). */
  cooldown: number;
  /** Fixed target of a dive (ravens). */
  target: { x: number; y: number } | null;
  /** Flashes white for a moment after a hit. */
  flash: number;
  /** Witch's helpers fly or walk straight in from the side of the arena. */
  summoned: boolean;
}

export type ShotKind = 'axe' | 'spore' | 'orb';

export interface Shot {
  kind: ShotKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  radius: number;
  /** Seconds left before it fades away. */
  life: number;
}

export interface EnemyContext {
  dt: number;
  /** Hunter's feet and the centre of the body. */
  hx: number;
  hy: number;
  hcy: number;
  world: World;
  shoot(shot: Shot): void;
  /** Visible part of the level (left, right), so flyers that left it can go. */
  viewLeft: number;
  viewRight: number;
}

export function newEnemy(spawn: EnemySpawn, summoned = false): Enemy {
  const hanging = spawn.kind === 'bat' || spawn.kind === 'spider';
  const floating = spawn.kind === 'skull' || spawn.kind === 'wisp';
  // Hanging enemies hang from the top of their tile, floating ones sit in its middle.
  // Ravens are centred too: they sit on the ground with their feet at the bottom of the tile.
  const y = hanging ? spawn.y - TILE + SIZE[spawn.kind][1] / 2 + 2 : floating ? spawn.y - TILE / 2 : spawn.kind === 'raven' ? spawn.y - 21 : spawn.y;
  return {
    id: spawn.id,
    kind: spawn.kind,
    x: spawn.x,
    y,
    homeX: spawn.x,
    homeY: y,
    vx: 0,
    vy: 0,
    facing: -1,
    hp: ENEMY_HP[spawn.kind],
    state: 'idle',
    t: 0,
    // Throwers and shooters wait a moment after waking; spiders drop at once.
    cooldown: spawn.kind === 'spider' ? 0 : 0.8,
    target: null,
    flash: 0,
    summoned,
  };
}

/** The area that hurts the hunter (and that the whip can hit), or null when it cannot be hit (underground, gone). */
export function enemyRect(e: Enemy): Rect | null {
  if (e.state === 'gone') return null;
  const [w, h] = SIZE[e.kind];
  if (e.kind === 'zombie' || e.kind === 'skeleton') {
    if (e.state === 'idle') return null;
    const risen = e.state === 'rise' ? Math.min(1, e.t / RISE_SECONDS) : 1;
    if (risen < 0.35) return null;
    return { x: e.x - w / 2, y: e.y - h * risen, w, h: h * risen };
  }
  if (WALKERS.has(e.kind)) return { x: e.x - w / 2, y: e.y - h, w, h };
  return { x: e.x - w / 2, y: e.y - h / 2, w, h };
}

/** How far up from the ground a rising zombie or skeleton is (0..1), for drawing. */
export function riseShare(e: Enemy): number {
  if (e.state === 'idle') return 0;
  if (e.state === 'rise') return Math.min(1, e.t / RISE_SECONDS);
  return 1;
}

const RISE_SECONDS = 0.8;

function setState(e: Enemy, state: EnemyState): void {
  e.state = state;
  e.t = 0;
}

function near(e: Enemy, c: EnemyContext, dx: number, dy: number): boolean {
  return Math.abs(c.hx - e.x) < dx && Math.abs(c.hy - e.y) < dy;
}

/** Can a walker take a step in direction dir (ground ahead, no wall)? */
function canWalk(e: Enemy, dir: number, world: World): boolean {
  const ahead = e.x + dir * (SIZE[e.kind][0] / 2 + 6);
  const col = Math.floor(ahead / TILE);
  const row = Math.round(e.y / TILE);
  if (isSolid(world, col, row - 1)) return false;
  return isStandable(world, col, row);
}

/** One step of an enemy. Flyers that leave the view for good, and dead enemies, become 'gone'. */
export function updateEnemy(e: Enemy, c: EnemyContext): void {
  const dt = c.dt;
  e.t += dt;
  e.flash = Math.max(0, e.flash - dt);
  e.cooldown = Math.max(0, e.cooldown - dt);
  if (e.state === 'gone') return;
  switch (e.kind) {
    case 'zombie':
    case 'skeleton':
      return riser(e, c, e.kind === 'zombie' ? 55 : 75);
    case 'bat':
      return bat(e, c);
    case 'raven':
      return raven(e, c);
    case 'armor':
      return armor(e, c);
    case 'skull':
      return skull(e, c);
    case 'spider':
      return spider(e, c);
    case 'wisp':
      return wisp(e, c);
    case 'mushroom':
      return mushroom(e, c);
    case 'wolf':
      return wolf(e, c);
  }
}

/** Zombies and skeletons: rise from the ground when the hunter comes near, then shamble towards him. */
function riser(e: Enemy, c: EnemyContext, speed: number): void {
  if (e.state === 'idle') {
    if (e.summoned || near(e, c, TILE * 6.5, TILE * 3)) {
      setState(e, 'rise');
      e.facing = c.hx < e.x ? -1 : 1;
    }
    return;
  }
  if (e.state === 'rise') {
    if (e.t >= RISE_SECONDS) setState(e, 'move');
    return;
  }
  // Turn towards the hunter now and then, and at walls and ledges.
  if (e.t > 2.5 && Math.abs(c.hx - e.x) > TILE * 1.5) {
    e.facing = c.hx < e.x ? -1 : 1;
    e.t = 0;
  }
  if (!canWalk(e, e.facing, c.world)) e.facing = e.facing === 1 ? -1 : 1;
  else e.x += e.facing * speed * c.dt;
}

/** Bats: hang until the hunter is near, then flutter towards him in waves, past him and away. */
function bat(e: Enemy, c: EnemyContext): void {
  if (e.state === 'idle') {
    if (near(e, c, TILE * 6, TILE * 5)) {
      setState(e, 'move');
      e.facing = c.hx < e.x ? -1 : 1;
    }
    return;
  }
  e.x += e.facing * 175 * c.dt;
  // The middle of the wave sinks towards the hunter's chest.
  e.homeY += Math.sign(c.hcy - e.homeY) * Math.min(Math.abs(c.hcy - e.homeY), 110 * c.dt);
  e.y = e.homeY + Math.sin(e.t * 5) * 34;
  if (e.x < c.viewLeft - TILE * 3 || e.x > c.viewRight + TILE * 3) setState(e, 'gone');
}

/** Ravens: sit until the hunter is near, hop up and dive straight at where he was. */
function raven(e: Enemy, c: EnemyContext): void {
  if (e.state === 'idle') {
    e.facing = c.hx < e.x ? -1 : 1;
    if (e.summoned || near(e, c, TILE * 7, TILE * 6)) setState(e, 'rise');
    return;
  }
  if (e.state === 'rise') {
    e.y -= 160 * c.dt;
    if (e.t >= 0.45) {
      setState(e, 'attack');
      e.target = { x: c.hx, y: c.hcy };
      const dx = e.target.x - e.x;
      const dy = e.target.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = e.summoned ? 280 : 320;
      e.vx = (dx / len) * speed;
      e.vy = (dy / len) * speed;
      e.facing = dx < 0 ? -1 : 1;
    }
    return;
  }
  e.x += e.vx * c.dt;
  e.y += e.vy * c.dt;
  // After passing the target the dive flattens out.
  if (e.t > 0.5) e.vy *= Math.pow(0.2, c.dt);
  if (e.x < c.viewLeft - TILE * 3 || e.x > c.viewRight + TILE * 3 || e.t > 6) setState(e, 'gone');
}

/** Armours: walk back and forth and stop now and then to throw an axe in an arc at the hunter. */
function armor(e: Enemy, c: EnemyContext): void {
  const close = near(e, c, TILE * 8, TILE * 4);
  if (e.state === 'attack') {
    e.facing = c.hx < e.x ? -1 : 1;
    if (e.t >= 0.45 && e.cooldown === 0) {
      const distance = Math.min(TILE * 7, Math.abs(c.hx - e.x));
      c.shoot({ kind: 'axe', x: e.x + e.facing * 14, y: e.y - 70, vx: e.facing * (90 + distance * 0.75), vy: -560, gravity: 1250, radius: 14, life: 4 });
      e.cooldown = 2.6;
    }
    if (e.t >= 0.8) setState(e, 'move');
    return;
  }
  if (e.state === 'idle' && close) setState(e, 'move');
  if (close && e.cooldown === 0) {
    setState(e, 'attack');
    return;
  }
  if (Math.abs(e.x - e.homeX) > TILE * 3 && Math.sign(e.x - e.homeX) === e.facing) e.facing = e.facing === 1 ? -1 : 1;
  if (!canWalk(e, e.facing, c.world)) e.facing = e.facing === 1 ? -1 : 1;
  else e.x += e.facing * 42 * c.dt;
}

/** Flaming skulls: once in view, fly towards the hunter in a wave, through walls. */
function skull(e: Enemy, c: EnemyContext): void {
  if (e.state === 'idle') {
    if (near(e, c, TILE * 12, TILE * 8)) {
      setState(e, 'move');
      e.facing = c.hx < e.x ? -1 : 1;
    }
    return;
  }
  e.x += e.facing * 150 * c.dt;
  e.homeY += Math.sign(c.hcy - e.homeY) * Math.min(Math.abs(c.hcy - e.homeY), 45 * c.dt);
  e.y = e.homeY + Math.sin(e.t * 3.4) * 58;
  if (e.x < c.viewLeft - TILE * 3 || e.x > c.viewRight + TILE * 3) setState(e, 'gone');
}

/** Spiders: hang from the ceiling and drop down on their thread when the hunter walks under them. */
function spider(e: Enemy, c: EnemyContext): void {
  if (e.state === 'idle') {
    if (Math.abs(c.hx - e.x) < TILE * 1.4 && c.hy > e.y && c.hy - e.y < TILE * 9 && e.cooldown === 0) setState(e, 'attack');
    return;
  }
  if (e.state === 'attack') {
    const bottom = Math.min(c.hcy, dropLimit(e, c.world));
    e.y = Math.min(bottom, e.y + 430 * c.dt);
    if (e.t > 1.1) setState(e, 'return');
    return;
  }
  e.y = Math.max(e.homeY, e.y - 130 * c.dt);
  if (e.y <= e.homeY) {
    setState(e, 'idle');
    e.cooldown = 1.2;
  }
}

/** Lowest point a spider drops to: just above the floor under it. */
function dropLimit(e: Enemy, world: World): number {
  const col = Math.floor(e.x / TILE);
  for (let row = Math.floor(e.homeY / TILE) + 1; row < world.level.rows; row++) {
    if (isStandable(world, col, row)) return row * TILE - 20;
  }
  return e.homeY + TILE * 6;
}

/** Will-o'-the-wisps: bob in place, then float slowly after the hunter, through walls. */
function wisp(e: Enemy, c: EnemyContext): void {
  if (e.state === 'idle') {
    e.y = e.homeY + Math.sin(e.t * 2.5) * 8;
    if (near(e, c, TILE * 7.5, TILE * 6)) setState(e, 'move');
    return;
  }
  const dx = c.hx - e.x;
  const dy = c.hcy - e.y;
  const len = Math.hypot(dx, dy) || 1;
  e.x += (dx / len) * 72 * c.dt;
  e.y += (dy / len) * 72 * c.dt + Math.sin(e.t * 4) * 20 * c.dt;
  e.facing = dx < 0 ? -1 : 1;
}

/** Poison mushrooms: stand still and puff two spores in arcs towards the hunter now and then. */
function mushroom(e: Enemy, c: EnemyContext): void {
  if (!near(e, c, TILE * 9, TILE * 6)) return;
  e.facing = c.hx < e.x ? -1 : 1;
  if (e.state === 'attack') {
    if (e.t >= 0.35 && e.cooldown === 0) {
      const distance = Math.min(TILE * 7, Math.abs(c.hx - e.x));
      for (const share of [0.55, 1]) {
        c.shoot({ kind: 'spore', x: e.x, y: e.y - 34, vx: e.facing * (60 + distance * share * 0.95), vy: -470, gravity: 1050, radius: 9, life: 4 });
      }
      e.cooldown = 2.4;
    }
    if (e.t >= 0.6) setState(e, 'idle');
    return;
  }
  if (e.cooldown === 0) setState(e, 'attack');
}

/** Wolves: sit until the hunter is near, howl, and charge at him; brake, turn and charge again. */
function wolf(e: Enemy, c: EnemyContext): void {
  if (e.state === 'idle') {
    e.facing = c.hx < e.x ? -1 : 1;
    if (near(e, c, TILE * 8, TILE * 2.5)) setState(e, 'rise');
    return;
  }
  if (e.state === 'rise') {
    // The howl: a short warning before the charge.
    if (e.t >= 0.5) {
      setState(e, 'move');
      e.facing = c.hx < e.x ? -1 : 1;
    }
    return;
  }
  if (e.state === 'move') {
    const passed = (c.hx - e.x) * e.facing < -TILE * 3;
    if (!canWalk(e, e.facing, c.world) || passed || e.t > 3) {
      setState(e, 'return');
      return;
    }
    e.x += e.facing * 300 * c.dt;
    return;
  }
  // Braking and turning around.
  if (e.t >= 0.6) {
    setState(e, 'move');
    e.facing = c.hx < e.x ? -1 : 1;
  }
}

/** Move a projectile. Returns false when it is gone (hit a wall or the ground, or faded). */
export function updateShot(s: Shot, dt: number, world: World): boolean {
  s.life -= dt;
  s.vy += s.gravity * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  if (s.life <= 0) return false;
  if (s.kind !== 'orb' && isSolid(world, Math.floor(s.x / TILE), Math.floor(s.y / TILE))) return false;
  return s.y < world.level.height + TILE * 2;
}
