import { CONFIG } from '../../config';

/*
 * Shooter rules (CLAUDE.md, game 4; Pasi 20.10.) as pure functions. The enemy
 * waves are the same for every player and every attempt: they are generated
 * from a fixed seed. Enemy paths depend only on the time since they appeared,
 * so "destroyed enemies as a share of all" is fair for everyone.
 */

const C = CONFIG.raiskinta;

/** Layout in game space. */
export const FIELD_W = 1280;
export const FIELD_H = 720;
/** Centre of the pope; he moves sideways only. */
export const POPE_Y = 606;
export const POPE_MIN_X = 50;
export const POPE_MAX_X = FIELD_W - 50;
/** Pope's hitbox half sizes (smaller than the picture, to be fair). */
export const POPE_HALF_W = 24;
export const POPE_HALF_H = 36;
/** Enemies below this have passed the pope and are gone. */
export const EXIT_Y = FIELD_H + 60;

export type EnemyKind = 'ghost' | 'bat' | 'pumpkin' | 'skeleton' | 'ark' | 'grail';
export type BoostKind = 'rapid' | 'spread' | 'shield';
export const BOOSTS: readonly BoostKind[] = ['rapid', 'spread', 'shield'];

/** Hits needed to destroy each enemy with the basic weapon. */
export const ENEMY_HP: Record<EnemyKind, number> = { ghost: 1, bat: 1, pumpkin: 3, skeleton: 2, ark: 5, grail: 5 };
/** Collision radius of each enemy. */
export const ENEMY_RADIUS: Record<EnemyKind, number> = { ghost: 26, bat: 24, pumpkin: 28, skeleton: 24, ark: 42, grail: 30 };
/** Enemies that shoot back. */
export const SHOOTERS: ReadonlySet<EnemyKind> = new Set<EnemyKind>(['pumpkin', 'skeleton']);
/** Holy objects: shooting one improves the weapon. */
export const SPECIALS: ReadonlySet<EnemyKind> = new Set<EnemyKind>(['ark', 'grail']);

export interface FormationSlot {
  id: number;
  row: number;
  col: number;
  rows: number;
  cols: number;
}

/** One enemy of the schedule. */
export interface Spawn {
  id: number;
  /** Seconds of play when it appears. */
  t: number;
  kind: EnemyKind;
  /** Where it enters (centre x), or the centre of its formation. */
  x: number;
  /** Sideways direction at the start. */
  dir: 1 | -1;
  /** Skeletons march in a block like in the classics. */
  formation: FormationSlot | null;
  /** Destroying it drops this boost. */
  drop: BoostKind | null;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 0 at the start, rising evenly to 1 when the last enemies appear. */
export function difficultyAt(t: number): number {
  return clamp(t / C.lastSpawnSeconds, 0, 1);
}

function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Formation layout: distance between skeletons, sideways sway and the step down at each turn. */
const FORMATION_DX = 76;
const FORMATION_DY = 66;
const FORMATION_SWAY = 160;
const FORMATION_STEP = 56;
const FORMATION_ENTRY = 2.5;

type Wave = 'ghosts' | 'bats' | 'pumpkins' | 'skeletons';

function pickWave(d: number, previous: Wave | null, random: () => number): Wave {
  const weights: Record<Wave, number> = {
    ghosts: lerp(4, 2, d),
    bats: lerp(2, 2.5, d),
    pumpkins: lerp(1, 2, d),
    skeletons: lerp(1.5, 2.5, d),
  };
  if (previous) weights[previous] *= 0.4;
  const waves = Object.keys(weights) as Wave[];
  let roll = random() * waves.reduce((sum, w) => sum + weights[w], 0);
  for (const wave of waves) {
    roll -= weights[wave];
    if (roll < 0) return wave;
  }
  return 'ghosts';
}

/** All enemies of an attempt in the order they appear. Same for everyone, every time. */
export function buildSchedule(): Spawn[] {
  const random = seededRandom(20261031);
  const list: Array<Omit<Spawn, 'id' | 'drop'>> = [];
  let formations = 0;
  let previous: Wave | null = null;
  for (let t = 2.5; t <= C.lastSpawnSeconds; ) {
    const d = difficultyAt(t);
    const wave = pickWave(d, previous, random);
    previous = wave;
    const dir: 1 | -1 = random() < 0.5 ? 1 : -1;
    if (wave === 'ghosts') {
      const n = 3 + Math.round(2 * d) + (random() < 0.3 ? 1 : 0);
      const left = 120 + random() * 300;
      const step = (FIELD_W - 240 - left) / Math.max(1, n - 1);
      for (let i = 0; i < n; i++) list.push({ t: t + i * 0.35, kind: 'ghost', x: Math.round(left + i * step), dir, formation: null });
    } else if (wave === 'bats') {
      const n = 3 + Math.round(3 * d);
      for (let i = 0; i < n; i++) list.push({ t: t + i * 0.3, kind: 'bat', x: dir > 0 ? 70 : FIELD_W - 70, dir, formation: null });
    } else if (wave === 'pumpkins') {
      const n = 1 + (d > 0.3 ? 1 : 0) + (d > 0.7 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const x = Math.round(lerp(220, FIELD_W - 220, n === 1 ? random() : i / (n - 1)));
        list.push({ t: t + i * 0.6, kind: 'pumpkin', x, dir: i % 2 === 0 ? dir : (-dir as 1 | -1), formation: null });
      }
    } else {
      const cols = 4 + Math.round(2 * d);
      const rows = d > 0.6 ? 3 : 2;
      const half = ((cols - 1) * FORMATION_DX) / 2 + FORMATION_SWAY + 40;
      const x = Math.round(lerp(half, FIELD_W - half, random()));
      const id = formations++;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) list.push({ t, kind: 'skeleton', x, dir, formation: { id, row, col, rows, cols } });
      }
    }
    t += lerp(C.waveGapStart, C.waveGapEnd, d) * (0.8 + 0.4 * random());
  }
  C.specialTimes.forEach((t, i) => {
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    list.push({ t, kind: i % 2 === 0 ? 'ark' : 'grail', x: dir > 0 ? -80 : FIELD_W + 80, dir, formation: null });
  });
  list.sort((a, b) => a.t - b.t);

  // Every boostEverySeconds one ordinary enemy carries a boost, in turn rapid fire, spread shot and shield.
  let nextDrop = C.boostEverySeconds * 0.6;
  let drops = 0;
  return list.map((spawn, id) => {
    let drop: BoostKind | null = null;
    if (spawn.t >= nextDrop && !SPECIALS.has(spawn.kind)) {
      drop = BOOSTS[drops++ % BOOSTS.length];
      nextDrop += C.boostEverySeconds;
    }
    return { ...spawn, t: Math.round(spawn.t * 100) / 100, id, drop };
  });
}

export const SCHEDULE: readonly Spawn[] = buildSchedule();
/** Every enemy and holy object of an attempt. Destroying all of them gives the full enemy points. */
export const ENEMY_TOTAL = SCHEDULE.length;

/**
 * Where an enemy is `age` seconds after it appeared, or null when it has
 * left the field. Paths are fixed, so they are the same for everyone.
 */
export function enemyPosition(spawn: Spawn, age: number): { x: number; y: number } | null {
  const d = difficultyAt(spawn.t);
  let x: number;
  let y: number;
  switch (spawn.kind) {
    case 'ghost': {
      // Drifts down, swaying gently.
      y = -40 + lerp(80, 115, d) * age;
      x = spawn.x + 70 * Math.sin(age * 2.2 + spawn.id);
      break;
    }
    case 'bat': {
      // Zigzags down, bouncing off the sides.
      y = -30 + lerp(140, 180, d) * age;
      x = bounce(spawn.x + spawn.dir * lerp(260, 320, d) * age, 40, FIELD_W - 40);
      break;
    }
    case 'pumpkin': {
      // Comes down, hovers and shoots for a while, then sinks away.
      const hoverY = 140 + (spawn.id % 3) * 50;
      const hover = 9;
      const down = Math.min(age, 2) / 2;
      y = -40 + (hoverY + 40) * (1 - (1 - down) * (1 - down));
      if (age > 2 + hover) y += 110 * (age - 2 - hover);
      x = spawn.x + spawn.dir * 130 * Math.sin(age * 0.8);
      break;
    }
    case 'skeleton': {
      // A marching block: sideways to one end, a step down, back to the other end.
      const f = spawn.formation!;
      const entry = Math.min(age, FORMATION_ENTRY) / FORMATION_ENTRY;
      const march = Math.max(0, age - FORMATION_ENTRY) * lerp(120, 150, d);
      const sway = FORMATION_SWAY - Math.abs(((march + FORMATION_SWAY) % (4 * FORMATION_SWAY)) - 2 * FORMATION_SWAY);
      const turns = Math.floor((march + FORMATION_SWAY) / (2 * FORMATION_SWAY));
      const top = lerp(-f.rows * FORMATION_DY, 110, entry) + turns * FORMATION_STEP + Math.max(0, age - FORMATION_ENTRY) * 6;
      x = spawn.x + spawn.dir * sway + (f.col - (f.cols - 1) / 2) * FORMATION_DX;
      y = top + f.row * FORMATION_DY;
      break;
    }
    default: {
      // The ark and the grail float slowly across the top.
      x = spawn.x + spawn.dir * 150 * age;
      y = 116 + 10 * Math.sin(age * 2);
      if ((spawn.dir > 0 && x > FIELD_W + 90) || (spawn.dir < 0 && x < -90)) return null;
      return { x, y };
    }
  }
  return y > EXIT_Y ? null : { x, y };
}

/** Moves back and forth between lo and hi like a ball between two walls. */
function bounce(v: number, lo: number, hi: number): number {
  const span = hi - lo;
  const p = (((v - lo) % (2 * span)) + 2 * span) % (2 * span);
  return lo + (p <= span ? p : 2 * span - p);
}

/** One barrel of the pope's weapon: sideways offset and angle (degrees from straight up). */
export interface Barrel {
  dx: number;
  angle: number;
}

/** Shots of one volley. Each ark or grail raises the level; the spread boost adds two wide shots. */
export function weaponPattern(level: number, spread: boolean): Barrel[] {
  const levels: Barrel[][] = [
    [{ dx: 0, angle: 0 }],
    [
      { dx: -10, angle: 0 },
      { dx: 10, angle: 0 },
    ],
    [
      { dx: 0, angle: 0 },
      { dx: -8, angle: -7 },
      { dx: 8, angle: 7 },
    ],
    [
      { dx: -10, angle: 0 },
      { dx: 10, angle: 0 },
      { dx: -12, angle: -9 },
      { dx: 12, angle: 9 },
    ],
    [
      { dx: 0, angle: 0 },
      { dx: -12, angle: 0 },
      { dx: 12, angle: 0 },
      { dx: -14, angle: -11 },
      { dx: 14, angle: 11 },
    ],
  ];
  const barrels = [...levels[clamp(Math.round(level), 1, levels.length) - 1]];
  if (spread) barrels.push({ dx: -16, angle: -22 }, { dx: 16, angle: 22 });
  return barrels;
}

/** Seconds between volleys. */
export function fireInterval(level: number, rapid: boolean): number {
  return 1 / ((C.fireRate + (level - 1) * C.fireRatePerLevel) * (rapid ? 2 : 1));
}

/** Seconds between an enemy's shots, and their speed, as the attempt goes on. */
export function enemyShotGap(t: number): number {
  return lerp(C.enemyShotGapStart, C.enemyShotGapEnd, difficultyAt(t));
}

export function enemyShotSpeed(t: number): number {
  return lerp(C.enemyShotSpeedStart, C.enemyShotSpeedEnd, difficultyAt(t));
}

/**
 * Points (Pasi 20.10.): destroyed enemies as a share of all of them (400),
 * survived time as a share of the time before the Devil (300) and 300 for
 * defeating the Devil.
 */
export function scoreOf(killed: number, seconds: number, bossDefeated: boolean): number {
  const enemies = Math.floor((C.enemyPoints * clamp(killed, 0, ENEMY_TOTAL)) / ENEMY_TOTAL);
  const survival = Math.floor((C.survivalPoints * clamp(seconds, 0, C.bossAfterSeconds)) / C.bossAfterSeconds);
  return Math.min(CONFIG.maxScore, enemies + survival + (bossDefeated ? C.bossPoints : 0));
}

/** True when a circle (bullet or enemy) touches the pope's hitbox. */
export function touchesPope(popeX: number, x: number, y: number, radius: number): boolean {
  const dx = Math.max(Math.abs(x - popeX) - POPE_HALF_W, 0);
  const dy = Math.max(Math.abs(y - POPE_Y) - POPE_HALF_H, 0);
  return dx * dx + dy * dy < radius * radius;
}

/** The Devil: health share 1 → 0 makes it faster and angrier. */
export function bossAttackGap(healthShare: number): number {
  return lerp(C.bossAttackGapEnd, C.bossAttackGapStart, clamp(healthShare, 0, 1));
}

/** Where the Devil is, `age` seconds after the interlude. It glides down, then sways from side to side. */
export function bossPosition(age: number, healthShare: number): { x: number; y: number } {
  const entry = Math.min(age, 3) / 3;
  const pace = lerp(1.15, 0.6, clamp(healthShare, 0, 1));
  return {
    x: FIELD_W / 2 + 380 * Math.sin(Math.max(0, age - 3) * pace * 0.8),
    y: lerp(-170, 176, 1 - (1 - entry) * (1 - entry)) + 16 * Math.sin(age * 1.7),
  };
}

/** The Devil's body for collisions (an ellipse). */
export const BOSS_RX = 96;
export const BOSS_RY = 86;

export function hitsBoss(bossX: number, bossY: number, x: number, y: number): boolean {
  const nx = (x - bossX) / BOSS_RX;
  const ny = (y - bossY) / BOSS_RY;
  return nx * nx + ny * ny <= 1;
}
