import { CONFIG } from '../../config';
import { LEVELS, type LevelDef, type Theme } from './levels';

/*
 * Platformer rules (CLAUDE.md, game 6; Pasi 21.10.) as pure functions: the
 * level maps, the hunter's movement and collisions, the whip, distance along
 * the level and the points. No Phaser here, so everything can be unit-tested.
 * Positions: x = centre, y = feet (bottom) unless said otherwise.
 */

const C = CONFIG.tasohyppely;

export const TILE = 48;
/** The hunter's hitbox (smaller than the picture, to be fair). */
export const HUNTER_W = 28;
export const HUNTER_H = 84;
export const HUNTER_CROUCH_H = 54;
/** Hand height above the feet for a side lash: standing and crouching. */
export const WHIP_HAND_Y = 58;
export const WHIP_CROUCH_HAND_Y = 26;
export const WHIP_THICKNESS = 22;
/** Width and thickness of a moving platform. */
export const MOVER_W = 2 * TILE;
export const MOVER_H = 18;

export type EnemyKind = 'zombie' | 'bat' | 'raven' | 'armor' | 'skull' | 'spider' | 'wisp' | 'mushroom' | 'wolf' | 'skeleton';
export type ItemKind = 'heart' | 'whip' | 'dagger';

const ENEMY_CHARS: Readonly<Record<string, EnemyKind>> = {
  z: 'zombie',
  b: 'bat',
  r: 'raven',
  a: 'armor',
  s: 'skull',
  k: 'spider',
  o: 'wisp',
  m: 'mushroom',
  f: 'wolf',
};
const CANDLE_CHARS: Readonly<Record<string, ItemKind | null>> = { i: null, h: 'heart', u: 'whip', t: 'dagger' };
const KNOWN_CHARS = new Set(['.', '#', '=', 'C', '~', ':', 'P', 'S', 'G', 'B', ...Object.keys(ENEMY_CHARS), ...Object.keys(CANDLE_CHARS)]);

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Candle {
  id: number;
  /** Centre of the candle. */
  x: number;
  y: number;
  drop: ItemKind | null;
}

export interface EnemySpawn {
  id: number;
  kind: EnemyKind;
  /** Centre x of its tile, and the bottom of its tile (feet of walkers, the top for hanging ones is y - TILE). */
  x: number;
  y: number;
}

export interface Mover {
  id: number;
  axis: 'x' | 'y';
  /** Top-left corner at the start of its track, and how far it travels. */
  x: number;
  y: number;
  length: number;
}

export interface Pendulum {
  id: number;
  /** Pivot point and the distance from it to the centre of the blade. */
  x: number;
  y: number;
  length: number;
  /** Swings start at different moments so neighbouring blades are not in step. */
  phase: number;
}

export interface Section {
  /** Left and right edge of the chunk in game units. */
  left: number;
  right: number;
  /** How much of the level's distance it is worth (tiles walked plus tiles climbed). */
  weight: number;
  /** Climbing chunk: the surfaces (y) where the climb starts and ends. */
  climb: { fromY: number; toY: number } | null;
}

export interface Level {
  index: number;
  name: string;
  theme: Theme;
  cols: number;
  rows: number;
  width: number;
  height: number;
  /** Tile characters, grid[row][col]. Movers, enemies and other markers are replaced by '.'. */
  grid: string[][];
  start: { x: number; y: number };
  /** The gate at the end (centre x, bottom), or null in the last level. */
  gate: { x: number; y: number } | null;
  /** The head witch's arena (last level). */
  arena: { left: number; right: number; floorY: number } | null;
  candles: Candle[];
  enemies: EnemySpawn[];
  movers: Mover[];
  pendulums: Pendulum[];
  /** Crumbling floor tiles as "col,row". */
  crumbles: Array<{ col: number; row: number }>;
  sections: Section[];
  totalWeight: number;
}

/** Turn a level definition into a level. Throws (in Finnish) when the map is broken. */
export function parseLevel(def: LevelDef, index: number): Level {
  const rows = Math.max(...def.chunks.map((chunk) => chunk.rows.length));
  const grid: string[][] = Array.from({ length: rows }, () => []);
  const sections: Section[] = [];
  def.chunks.forEach((chunk, chunkIndex) => {
    const width = Math.max(...chunk.rows.map((row) => row.length));
    if (chunk.rows.some((row) => row.length !== width)) {
      throw new Error(`Kenttä "${def.name}", pala ${chunkIndex + 1}: rivit ovat eri pitkiä.`);
    }
    const left = grid[0].length;
    const offset = rows - chunk.rows.length;
    for (let r = 0; r < rows; r++) {
      const line = r < offset ? '.'.repeat(width) : chunk.rows[r - offset];
      grid[r].push(...line.split(''));
    }
    const climb = chunk.climb ? { fromY: (chunk.climb[0] + offset) * TILE, toY: (chunk.climb[1] + offset) * TILE } : null;
    const weight = width + (chunk.climb ? Math.abs(chunk.climb[0] - chunk.climb[1]) : 0);
    sections.push({ left: left * TILE, right: (left + width) * TILE, weight, climb });
  });
  const cols = grid[0].length;

  let start: Level['start'] | null = null;
  let gate: Level['gate'] = null;
  let arenaLeft: number | null = null;
  const candles: Candle[] = [];
  const enemies: EnemySpawn[] = [];
  const movers: Mover[] = [];
  const pendulums: Pendulum[] = [];
  const crumbles: Level['crumbles'] = [];
  let id = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (!KNOWN_CHARS.has(ch)) throw new Error(`Kenttä "${def.name}": tuntematon merkki "${ch}" (rivi ${r + 1}, sarake ${c + 1}).`);
      const cx = c * TILE + TILE / 2;
      const bottom = (r + 1) * TILE;
      if (ch === 'S') start = { x: cx, y: bottom };
      else if (ch === 'G') gate = { x: cx, y: bottom };
      else if (ch === 'B') arenaLeft = c * TILE;
      else if (ch === 'P') pendulums.push({ id: id++, x: cx, y: r * TILE, length: 0, phase: pendulums.length * 0.37 });
      else if (ch in CANDLE_CHARS) candles.push({ id: id++, x: cx, y: r * TILE + TILE / 2, drop: CANDLE_CHARS[ch] });
      else if (ch in ENEMY_CHARS) enemies.push({ id: id++, kind: ENEMY_CHARS[ch], x: cx, y: bottom });
      else if (ch === 'C') crumbles.push({ col: c, row: r });
      else if (ch === '~' && grid[r][c - 1] !== '~') {
        let end = c;
        while (grid[r][end + 1] === '~') end++;
        movers.push({ id: id++, axis: 'x', x: c * TILE, y: r * TILE, length: Math.max(0, (end + 1 - c) * TILE - MOVER_W) });
      } else if (ch === ':' && grid[r - 1]?.[c] !== ':') {
        let end = r;
        while (grid[end + 1]?.[c] === ':') end++;
        movers.push({ id: id++, axis: 'y', x: c * TILE, y: r * TILE, length: (end - r) * TILE });
      }
    }
  }
  // A blade swings at head height above the floor, platform or moving platform under it: crouching gets under it.
  for (const p of pendulums) {
    const col = Math.floor(p.x / TILE);
    let floor = p.y + TILE * 7;
    for (let r = Math.floor(p.y / TILE) + 1; r < rows; r++) {
      if ('#=C~'.includes(grid[r][col])) {
        floor = r * TILE;
        break;
      }
    }
    p.length = Math.max(TILE * 2, floor - BLADE_CLEARANCE - p.y);
  }
  // Only the ground stays in the grid; everything else lives in its own list.
  for (const row of grid) {
    for (let c = 0; c < cols; c++) if (!'#=C'.includes(row[c])) row[c] = '.';
  }
  if (!start) throw new Error(`Kenttä "${def.name}": aloituspaikka S puuttuu.`);
  if (!gate && arenaLeft === null) throw new Error(`Kenttä "${def.name}": maali G tai areena B puuttuu.`);

  const height = rows * TILE;
  const level: Level = {
    index,
    name: def.name,
    theme: def.theme,
    cols,
    rows,
    width: cols * TILE,
    height,
    grid,
    start,
    gate,
    arena: arenaLeft === null ? null : { left: arenaLeft, right: cols * TILE, floorY: 0 },
    candles,
    enemies,
    movers,
    pendulums,
    crumbles,
    sections,
    totalWeight: 0,
  };
  // The distance ends at the gate, or where the arena begins.
  const end = gate ? (gate as { x: number }).x : arenaLeft;
  if (end !== null) {
    for (const section of sections) {
      if (section.left >= end) section.weight = 0;
      else if (section.right > end) {
        section.weight -= (section.right - end) / TILE;
        section.right = end;
      }
    }
  }
  if (level.arena) level.arena.floorY = surfaceBelow(level, level.arena.left + TILE * 2, 0) ?? height;
  level.totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);
  return level;
}

let parsed: Level[] | null = null;

/** The three levels, parsed once. */
export function getLevels(): Level[] {
  parsed ??= LEVELS.map((def, i) => parseLevel(def, i));
  return parsed;
}

// ---------------------------------------------------------------- tiles

export function tileAt(level: Level, col: number, row: number): string {
  if (col < 0 || col >= level.cols) return '#';
  if (row < 0 || row >= level.rows) return '.';
  return level.grid[row][col];
}

/** The first standable surface (y) at or below `fromY` in column x, ignoring movers. */
export function surfaceBelow(level: Level, x: number, fromY: number): number | null {
  const col = Math.floor(x / TILE);
  for (let row = Math.max(0, Math.floor(fromY / TILE)); row < level.rows; row++) {
    if (tileAt(level, col, row) !== '.') return row * TILE;
  }
  return null;
}

/** Moving platforms at time t (seconds of play): top-left corner and size. */
export function moverRect(mover: Mover, t: number): Rect {
  const travel = moverOffset(mover.length, t);
  return {
    x: mover.axis === 'x' ? mover.x + travel : mover.x,
    y: mover.axis === 'y' ? mover.y + travel : mover.y,
    w: MOVER_W,
    h: MOVER_H,
  };
}

/** Back and forth along the track, starting from its left or top end. */
export function moverOffset(length: number, t: number): number {
  if (length <= 0) return 0;
  const phase = (t * C.moverSpeed) % (length * 2);
  return phase <= length ? phase : length * 2 - phase;
}

/** Height of the blade's end of the rod above the floor under the pivot; the blade reaches down to about 60 (a crouch is 54). */
export const BLADE_CLEARANCE = 100;
/** The dangerous part of a blade: a circle this far beyond the end of the rod. */
export const BLADE_REACH = 18;
export const BLADE_RADIUS = 22;

/** Blade swing angle (radians, 0 = straight down) at time t. */
export function pendulumAngle(p: Pendulum, t: number): number {
  const amplitude = (C.pendulumAngle * Math.PI) / 180;
  return amplitude * Math.sin(((t / C.pendulumSeconds) * 2 + p.phase) * Math.PI);
}

/** End of the rod (where the blade hangs) at time t, or the centre of the blade's dangerous part with `extra` = BLADE_REACH. */
export function bladePoint(p: Pendulum, t: number, extra = 0): { x: number; y: number } {
  const a = pendulumAngle(p, t);
  return { x: p.x + Math.sin(a) * (p.length + extra), y: p.y + Math.cos(a) * (p.length + extra) };
}

// ---------------------------------------------------------------- the world for movement

/** What moving bodies collide with right now. */
export interface World {
  level: Level;
  /** Crumbling tiles that are gone at the moment ("col,row"). */
  gone: ReadonlySet<string>;
  /** Moving platforms now. */
  platforms: ReadonlyArray<{ id: number; rect: Rect }>;
}

export function crumbleKey(col: number, row: number): string {
  return `${col},${row}`;
}

/** Walls, floors and ceilings. */
export function isSolid(world: World, col: number, row: number): boolean {
  const ch = tileAt(world.level, col, row);
  if (ch === '#') return true;
  return ch === 'C' && !world.gone.has(crumbleKey(col, row));
}

/** Platforms that are stood on from above only. */
export function isOneWay(world: World, col: number, row: number): boolean {
  return tileAt(world.level, col, row) === '=';
}

/** A tile that can be stood on (solid or platform). */
export function isStandable(world: World, col: number, row: number): boolean {
  return isSolid(world, col, row) || isOneWay(world, col, row);
}

// ---------------------------------------------------------------- the hunter

export type Lash = 'side' | 'low' | 'up';

export interface Hunter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  /** What the feet stand on: a tile, a moving platform (id) or nothing. */
  support: { kind: 'tile'; col: number; row: number } | { kind: 'mover'; id: number } | null;
  crouching: boolean;
  /** Jumps used since leaving the ground (2 = the double jump is spent). */
  jumps: number;
  /** Seconds since the feet left the ground (for the late jump), and since the last jump press. */
  airTime: number;
  jumpBuffer: number;
  /** The jump key is still held after this jump (a release cuts the rise). */
  jumpHeld: boolean;
  /** Falling through platforms down to this y (↓ + Space), or null. */
  dropUntil: number | null;
  /** The current lash: time since it started, and its direction. */
  lash: { t: number; kind: Lash } | null;
  /** Controls are off during a knockback. */
  knockback: number;
  invulnerable: number;
}

export interface HunterInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  lashPressed: boolean;
}

export const NO_INPUT: HunterInput = { left: false, right: false, up: false, down: false, jumpHeld: false, jumpPressed: false, lashPressed: false };

export function newHunter(x: number, y: number): Hunter {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    support: null,
    crouching: false,
    jumps: 0,
    airTime: 0,
    jumpBuffer: 0,
    jumpHeld: false,
    dropUntil: null,
    lash: null,
    knockback: 0,
    invulnerable: 0,
  };
}

export function hunterHeight(h: Hunter): number {
  return h.crouching ? HUNTER_CROUCH_H : HUNTER_H;
}

export function hunterRect(h: Hunter): Rect {
  const height = hunterHeight(h);
  return { x: h.x - HUNTER_W / 2, y: h.y - height, w: HUNTER_W, h: height };
}

export const LASH_TOTAL = C.whipWindupSeconds + C.whipActiveSeconds + C.whipRecoverSeconds;

/** True while the lash can hurt. */
export function lashActive(h: Hunter): boolean {
  return h.lash !== null && h.lash.t >= C.whipWindupSeconds && h.lash.t < C.whipWindupSeconds + C.whipActiveSeconds;
}

/** The area the whip hurts right now (null when it is not lashing). Whip level 1..3. */
export function whipRect(h: Hunter, whipLevel: number): Rect | null {
  if (!h.lash || !lashActive(h)) return null;
  const reach = C.whipReach[Math.min(C.whipReach.length, Math.max(1, whipLevel)) - 1];
  if (h.lash.kind === 'up') {
    const top = h.y - HUNTER_H - reach + 10;
    return { x: h.x + h.facing * 6 - WHIP_THICKNESS / 2, y: top, w: WHIP_THICKNESS, h: reach };
  }
  const handY = h.y - (h.lash.kind === 'low' ? WHIP_CROUCH_HAND_Y : WHIP_HAND_Y);
  const from = h.x + h.facing * 8;
  return { x: h.facing > 0 ? from : from - reach, y: handY - WHIP_THICKNESS / 2, w: reach, h: WHIP_THICKNESS };
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Is there ground anywhere below x (a pit has none)? Used so a knockback never throws the hunter into a pit. */
export function groundBelow(world: World, x: number, fromY: number): boolean {
  const col = Math.floor(x / TILE);
  for (let row = Math.max(0, Math.floor(fromY / TILE)); row < world.level.rows; row++) {
    if (isStandable(world, col, row)) return true;
  }
  return world.platforms.some((p) => x >= p.rect.x && x <= p.rect.x + p.rect.w && p.rect.y >= fromY - 4);
}

export interface StepEvents {
  jumped: boolean;
  doubleJumped: boolean;
  landed: boolean;
  lashStarted: Lash | null;
  bumpedHead: boolean;
}

/**
 * Move the hunter by one step (dt ≤ 1/60 s): input, gravity, collisions with
 * tiles and moving platforms. The hunter is carried by the platform under
 * the feet (pass how far it moved since the last step in `carry`).
 */
export function stepHunter(h: Hunter, input: HunterInput, dt: number, world: World, carry: { dx: number; dy: number } = { dx: 0, dy: 0 }): StepEvents {
  const events: StepEvents = { jumped: false, doubleJumped: false, landed: false, lashStarted: null, bumpedHead: false };
  const controls = h.knockback <= 0;
  h.invulnerable = Math.max(0, h.invulnerable - dt);
  h.knockback = Math.max(0, h.knockback - dt);
  h.jumpBuffer = Math.max(0, h.jumpBuffer - dt);
  if (input.jumpPressed && controls) h.jumpBuffer = C.jumpBufferSeconds;

  // Riding a moving platform.
  if (h.support?.kind === 'mover' && (carry.dx !== 0 || carry.dy !== 0)) {
    moveX(h, carry.dx, world);
    h.y += carry.dy;
  }

  // The lash.
  if (h.lash) {
    h.lash.t += dt;
    if (h.lash.t >= LASH_TOTAL) h.lash = null;
  }
  if (controls && input.lashPressed && !h.lash) {
    const kind: Lash = input.up && !h.crouching ? 'up' : h.crouching ? 'low' : 'side';
    h.lash = { t: 0, kind };
    events.lashStarted = kind;
  }
  const lashing = h.lash !== null;

  // Crouching (on the ground only; standing up needs room above).
  const wantsCrouch = controls && input.down && h.onGround && !input.jumpPressed;
  if (wantsCrouch && !h.crouching) {
    if (!h.lash) h.crouching = true;
  } else if (!wantsCrouch && h.crouching && headroom(h, world)) {
    if (!h.lash || h.lash.kind !== 'low') h.crouching = false;
  }
  if (!h.onGround && h.crouching && headroom(h, world)) h.crouching = false;

  // Running: feet stay planted while lashing on the ground or crouching.
  let dir = 0;
  if (controls) {
    if (input.left && !input.right) dir = -1;
    else if (input.right && !input.left) dir = 1;
    if (dir !== 0 && !lashing) h.facing = dir as 1 | -1;
  }
  const planted = h.onGround && (lashing || h.crouching);
  if (controls) {
    const target = planted ? 0 : dir * C.runSpeed;
    const accel = h.onGround ? C.groundAccel : C.airAccel;
    h.vx = approach(h.vx, target, accel * dt);
  }

  // Jumping: from the ground (or just after leaving it), or once more in the air.
  if (h.jumpBuffer > 0 && controls) {
    const onPlatform = h.onGround && h.support !== null && (h.support.kind === 'mover' || isOneWay(world, h.support.col, h.support.row));
    if (input.down && onPlatform) {
      // ↓ + Space drops through the platform.
      h.dropUntil = h.y + 6;
      h.onGround = false;
      h.support = null;
      h.crouching = false;
      h.jumpBuffer = 0;
      h.jumps = 1;
    } else if ((h.onGround || h.airTime < C.coyoteSeconds) && h.jumps === 0) {
      h.vy = -C.jumpSpeed;
      h.jumps = 1;
      h.onGround = false;
      h.support = null;
      h.crouching = false;
      h.jumpHeld = true;
      h.jumpBuffer = 0;
      events.jumped = true;
    } else if (!h.onGround && h.jumps < 2 && input.jumpPressed) {
      h.vy = -C.doubleJumpSpeed;
      h.jumps = 2;
      h.jumpHeld = true;
      h.jumpBuffer = 0;
      events.doubleJumped = true;
    }
  }
  // Letting go early makes a lower jump.
  if (h.jumpHeld && !input.jumpHeld) {
    h.jumpHeld = false;
    if (h.vy < 0) h.vy *= C.jumpCutFactor;
  }

  h.vy = Math.min(C.maxFallSpeed, h.vy + C.gravity * dt);

  // A knockback never carries the hunter over a pit.
  let dx = h.vx * dt;
  if (!controls && dx !== 0 && !groundBelow(world, h.x + dx + Math.sign(dx) * HUNTER_W * 0.5, h.y - 4)) {
    dx = 0;
    h.vx = 0;
  }
  if (moveX(h, dx, world)) h.vx = 0;

  const wasOnGround = h.onGround;
  const vertical = moveY(h, h.vy * dt, world);
  if (vertical === 'ceiling') {
    h.vy = Math.max(0, h.vy);
    events.bumpedHead = true;
  }
  if (h.dropUntil !== null && h.y > h.dropUntil + TILE) h.dropUntil = null;

  h.support = findSupport(h, world);
  h.onGround = h.support !== null && h.vy >= 0;
  if (h.onGround) {
    if (!wasOnGround) events.landed = true;
    h.vy = 0;
    h.jumps = 0;
    h.airTime = 0;
    h.dropUntil = null;
  } else {
    h.airTime += dt;
    // Running off a ledge uses up the first jump once the late-jump moment has passed.
    if (h.jumps === 0 && h.airTime >= C.coyoteSeconds) h.jumps = 1;
  }
  return events;
}

function approach(value: number, target: number, amount: number): number {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}

/** Room to stand up? */
function headroom(h: Hunter, world: World): boolean {
  const r0 = Math.floor((h.y - HUNTER_H) / TILE);
  const r1 = Math.floor((h.y - HUNTER_CROUCH_H - 1) / TILE);
  const c0 = Math.floor((h.x - HUNTER_W / 2 + 1) / TILE);
  const c1 = Math.floor((h.x + HUNTER_W / 2 - 1) / TILE);
  for (let c = c0; c <= c1; c++) {
    for (let r = r0; r <= r1; r++) if (isSolid(world, c, r)) return false;
  }
  return true;
}

/** Sideways movement against walls. Returns true when a wall stopped it. */
function moveX(h: Hunter, dx: number, world: World): boolean {
  if (dx === 0) return false;
  const height = hunterHeight(h);
  const r0 = Math.floor((h.y - height + 1) / TILE);
  const r1 = Math.floor((h.y - 1) / TILE);
  const half = HUNTER_W / 2;
  let x = h.x + dx;
  let blocked = false;
  if (dx > 0) {
    const col = Math.floor((x + half) / TILE);
    for (let r = r0; r <= r1; r++) {
      if (isSolid(world, col, r)) {
        x = col * TILE - half - 0.01;
        blocked = true;
        break;
      }
    }
  } else {
    const col = Math.floor((x - half) / TILE);
    for (let r = r0; r <= r1; r++) {
      if (isSolid(world, col, r)) {
        x = (col + 1) * TILE + half + 0.01;
        blocked = true;
        break;
      }
    }
  }
  h.x = x;
  return blocked;
}

/** Vertical movement: lands on floors, platforms and moving platforms, bumps into ceilings. */
function moveY(h: Hunter, dy: number, world: World): 'floor' | 'ceiling' | null {
  if (dy === 0) return null;
  const height = hunterHeight(h);
  const c0 = Math.floor((h.x - HUNTER_W / 2 + 1) / TILE);
  const c1 = Math.floor((h.x + HUNTER_W / 2 - 1) / TILE);
  if (dy < 0) {
    const top = h.y - height;
    const newTop = top + dy;
    const row = Math.floor(newTop / TILE);
    if (row !== Math.floor(top / TILE) || newTop < 0) {
      for (let c = c0; c <= c1; c++) {
        if (isSolid(world, c, row)) {
          h.y = (row + 1) * TILE + height;
          return 'ceiling';
        }
      }
    }
    h.y += dy;
    return null;
  }
  const from = h.y;
  const to = h.y + dy;
  let landY: number | null = null;
  // Tile surfaces crossed on the way down.
  for (let row = Math.floor(from / TILE + 1e-6); row * TILE <= to; row++) {
    const surface = row * TILE;
    if (surface < from - 1e-6) continue;
    for (let c = c0; c <= c1; c++) {
      const oneWay = isOneWay(world, c, row);
      if (isSolid(world, c, row) || (oneWay && (h.dropUntil === null || surface > h.dropUntil))) {
        landY = surface;
        break;
      }
    }
    if (landY !== null) break;
  }
  for (const p of world.platforms) {
    const surface = p.rect.y;
    if (surface < from - 1e-6 || surface > to) continue;
    if (h.dropUntil !== null && surface <= h.dropUntil) continue;
    if (h.x + HUNTER_W / 2 <= p.rect.x || h.x - HUNTER_W / 2 >= p.rect.x + p.rect.w) continue;
    if (landY === null || surface < landY) landY = surface;
  }
  if (landY !== null) {
    h.y = landY;
    return 'floor';
  }
  h.y = to;
  return null;
}

/** What is right under the feet (tile or moving platform), if anything. */
function findSupport(h: Hunter, world: World): Hunter['support'] {
  const left = h.x - HUNTER_W / 2 + 1;
  const right = h.x + HUNTER_W / 2 - 1;
  for (const p of world.platforms) {
    if (Math.abs(p.rect.y - h.y) < 0.5 && right > p.rect.x && left < p.rect.x + p.rect.w) {
      if (h.dropUntil !== null && p.rect.y <= h.dropUntil) continue;
      return { kind: 'mover', id: p.id };
    }
  }
  const rowF = h.y / TILE;
  const row = Math.round(rowF);
  if (Math.abs(rowF - row) * TILE > 0.5) return null;
  // Prefer the tile under the middle of the feet.
  const cols = [Math.floor(h.x / TILE), Math.floor(left / TILE), Math.floor(right / TILE)];
  for (const c of cols) {
    if (isSolid(world, c, row)) return { kind: 'tile', col: c, row };
    if (isOneWay(world, c, row) && (h.dropUntil === null || row * TILE > h.dropUntil)) return { kind: 'tile', col: c, row };
  }
  return null;
}

/** Both feet on solid, still ground (not crumbling, not moving): a safe place to come back to after a pit. */
export function safeFooting(h: Hunter, world: World): boolean {
  if (!h.onGround || h.support?.kind !== 'tile') return false;
  const row = h.support.row;
  const left = Math.floor((h.x - HUNTER_W) / TILE);
  const right = Math.floor((h.x + HUNTER_W) / TILE);
  for (let c = left; c <= right; c++) {
    const ch = tileAt(world.level, c, row);
    if (ch !== '#' && ch !== '=') return false;
  }
  return true;
}

/** Fallen below the bottom of the level: a pit. */
export function inPit(h: Hunter, level: Level): boolean {
  return h.y - HUNTER_H > level.height + 20;
}

// ---------------------------------------------------------------- distance and points

/** How far along the level (0..1) the position is: chunk by chunk, climbing chunks by height. */
export function levelProgress(level: Level, x: number, y: number): number {
  if (level.totalWeight <= 0) return 0;
  let done = 0;
  for (const s of level.sections) {
    if (x >= s.right) {
      done += s.weight;
      continue;
    }
    if (x < s.left || s.weight === 0) break;
    const width = (s.right - s.left) / TILE;
    const across = Math.min(1, Math.max(0, (x - s.left) / (s.right - s.left))) * width;
    let up = 0;
    if (s.climb) {
      const span = s.climb.toY - s.climb.fromY;
      up = Math.min(1, Math.max(0, (y - s.climb.fromY) / span)) * Math.abs(span / TILE);
    }
    done += Math.min(s.weight, across + up);
    break;
  }
  return Math.min(1, done / level.totalWeight);
}

export interface ScoreInput {
  /** Levels completed (0..3; reaching the arena does not complete the last level). */
  levelsDone: number;
  /** Best progress in the current level (0..1). */
  progress: number;
  candlesBroken: number;
  candlesTotal: number;
  /** Share of the head witch's health taken (0..1). */
  bossShare: number;
}

/** Points (Pasi 21.10.): distance 600 (200 per level), candles 100 (share of all), head witch 300 (share of her health taken). */
export function score(s: ScoreInput): number {
  const levels = getLevels().length;
  const distance = Math.min(1, (s.levelsDone + Math.min(1, Math.max(0, s.progress))) / levels);
  const candles = s.candlesTotal > 0 ? Math.min(1, s.candlesBroken / s.candlesTotal) : 0;
  const boss = Math.min(1, Math.max(0, s.bossShare));
  const total = distance * C.distancePoints + candles * C.candlePoints + boss * C.bossPoints;
  return Math.min(CONFIG.maxScore, Math.round(total));
}

/** All candles of all levels (the candle points are a share of these). */
export function totalCandles(): number {
  return getLevels().reduce((sum, level) => sum + level.candles.length, 0);
}

/** Damage of one lash at a whip level (1..3). */
export function whipDamage(whipLevel: number): number {
  return C.whipDamage[Math.min(C.whipDamage.length, Math.max(1, whipLevel)) - 1];
}
