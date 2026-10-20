import { CONFIG } from '../../config';

/*
 * Shooter rules (CLAUDE.md, game 4; Pasi 20.10.) as pure functions. The enemy
 * waves are the same for every player and every attempt: they are generated
 * from a fixed seed. Enemy paths depend only on the time since they appeared
 * (imps also on where the pope was when they started their dive), so
 * "destroyed enemies as a share of all" is fair for everyone.
 */

const C = CONFIG.raiskinta;

/** Everything is drawn this much smaller than the pictures: the view is "further away". */
export const SCALE: number = C.viewScale;

/** Layout in game space. */
export const FIELD_W = 1280;
export const FIELD_H = 720;
/** The pope moves in the lower part of the screen. */
export const POPE_MIN_X = 40;
export const POPE_MAX_X = FIELD_W - 40;
export const POPE_MIN_Y = 300;
export const POPE_MAX_Y = 636;
export const POPE_START_Y = 600;
/** Pope's hitbox half sizes (smaller than the picture, to be fair). */
export const POPE_HALF_W = 24 * SCALE;
export const POPE_HALF_H = 36 * SCALE;
/** Enemies below this have passed the pope and are gone. */
export const EXIT_Y = FIELD_H + 60;

export type EnemyKind = 'ghost' | 'bat' | 'pumpkin' | 'skeleton' | 'imp' | 'reaper' | 'ark' | 'grail';
export type BoostKind = 'rapid' | 'spread' | 'shield';
export const BOOSTS: readonly BoostKind[] = ['rapid', 'spread', 'shield'];

/** Hits needed to destroy each enemy with the basic weapon. */
export const ENEMY_HP: Record<EnemyKind, number> = { ghost: 1, bat: 1, pumpkin: 3, skeleton: 2, imp: 2, reaper: 10, ark: 5, grail: 5 };
/** Collision radius of each enemy. */
export const ENEMY_RADIUS: Record<EnemyKind, number> = {
  ghost: 26 * SCALE,
  bat: 24 * SCALE,
  pumpkin: 28 * SCALE,
  skeleton: 24 * SCALE,
  imp: 24 * SCALE,
  reaper: 40 * SCALE,
  ark: 42 * SCALE,
  grail: 30 * SCALE,
};
/** Enemies that shoot back. */
export const SHOOTERS: ReadonlySet<EnemyKind> = new Set<EnemyKind>(['pumpkin', 'skeleton', 'reaper']);
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

/** An imp's dive: from where, which way (px/s) and when (age) it started. */
export interface Dive {
  x: number;
  y: number;
  vx: number;
  vy: number;
  at: number;
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
const FORMATION_DX = 76 * SCALE;
const FORMATION_DY = 66 * SCALE;
const FORMATION_SWAY = 170;
const FORMATION_STEP = 52;
const FORMATION_ENTRY = 2.2;
/** Imps hover this long after entering, then dive at the pope. */
export const IMP_HOVER = 1.4;
export const IMP_DIVE_SPEED = 430;
/** Reapers hover and shoot this long before they drift away. */
const REAPER_STAY = 13;

type Wave = 'ghosts' | 'bats' | 'pumpkins' | 'skeletons' | 'imps' | 'reapers';

/** How often each wave appears: [at the start, at the end]. The new, harder enemies join as the attempt goes on. */
const WAVE_WEIGHTS: Record<Wave, [number, number]> = {
  ghosts: [4, 1.5],
  bats: [2.5, 2],
  pumpkins: [1, 2],
  skeletons: [1.2, 1.8],
  imps: [0, 3],
  reapers: [0, 1.6],
};
/** The harder enemies start appearing only after this share of the attempt. */
const WAVE_FROM: Partial<Record<Wave, number>> = { imps: 0.12, reapers: 0.28 };

function pickWave(d: number, previous: Wave | null, random: () => number): Wave {
  const waves = Object.keys(WAVE_WEIGHTS) as Wave[];
  const weights = waves.map((w) => {
    if (d < (WAVE_FROM[w] ?? 0)) return 0;
    const weight = lerp(WAVE_WEIGHTS[w][0], WAVE_WEIGHTS[w][1], d);
    return w === previous ? weight * 0.4 : weight;
  });
  let roll = random() * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < waves.length; i++) {
    roll -= weights[i];
    if (roll < 0) return waves[i];
  }
  return 'ghosts';
}

/** All enemies of an attempt in the order they appear. Same for everyone, every time. */
export function buildSchedule(): Spawn[] {
  const random = seededRandom(20261031);
  const list: Array<Omit<Spawn, 'id' | 'drop'>> = [];
  let formations = 0;
  let previous: Wave | null = null;
  const push = (t: number, kind: EnemyKind, x: number, dir: 1 | -1, formation: FormationSlot | null = null): void => {
    list.push({ t, kind, x: Math.round(x), dir, formation });
  };
  for (let t = 2; t <= C.lastSpawnSeconds; ) {
    const d = difficultyAt(t);
    const wave = pickWave(d, previous, random);
    previous = wave;
    const dir: 1 | -1 = random() < 0.5 ? 1 : -1;
    if (wave === 'ghosts') {
      // A row, or a V pointing down
      const n = 4 + Math.round(4 * d);
      const left = 90 + random() * 260;
      const step = (FIELD_W - 180 - left) / Math.max(1, n - 1);
      const vee = random() < 0.4;
      for (let i = 0; i < n; i++) {
        const delay = vee ? Math.abs(i - (n - 1) / 2) * 0.25 : i * 0.25;
        push(t + delay, 'ghost', left + i * step, dir);
      }
    } else if (wave === 'bats') {
      const n = 4 + Math.round(4 * d);
      for (let i = 0; i < n; i++) push(t + i * 0.22, 'bat', dir > 0 ? 50 : FIELD_W - 50, dir);
    } else if (wave === 'pumpkins') {
      const n = 1 + Math.round(3 * d);
      for (let i = 0; i < n; i++) push(t + i * 0.4, 'pumpkin', lerp(200, FIELD_W - 200, n === 1 ? random() : i / (n - 1)), i % 2 === 0 ? dir : (-dir as 1 | -1));
    } else if (wave === 'skeletons') {
      const cols = 4 + Math.round(3 * d);
      const rows = d > 0.6 ? 3 : 2;
      const half = ((cols - 1) * FORMATION_DX) / 2 + FORMATION_SWAY + 30;
      const x = lerp(half, FIELD_W - half, random());
      const id = formations++;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) push(t, 'skeleton', x, dir, { id, row, col, rows, cols });
      }
    } else if (wave === 'imps') {
      const n = 3 + Math.round(3 * d);
      const left = 120 + random() * 300;
      const step = (FIELD_W - 240 - left) / Math.max(1, n - 1);
      for (let i = 0; i < n; i++) push(t + i * 0.3, 'imp', left + i * step, dir);
    } else {
      const n = d > 0.7 ? 2 : 1;
      for (let i = 0; i < n; i++) push(t + i * 1.5, 'reaper', n === 1 ? lerp(320, FIELD_W - 320, random()) : i === 0 ? 360 : FIELD_W - 360, i === 0 ? dir : (-dir as 1 | -1));
    }
    t += lerp(C.waveGapStart, C.waveGapEnd, d) * (0.8 + 0.4 * random());
  }
  C.specialTimes.forEach((t, i) => {
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    push(t, i % 2 === 0 ? 'ark' : 'grail', dir > 0 ? -80 : FIELD_W + 80, dir);
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

/** Where an imp aims its dive: at the pope, at a fixed speed. */
export function planDive(from: { x: number; y: number }, target: { x: number; y: number }, age: number): Dive {
  const angle = Math.atan2(Math.max(80, target.y - from.y), target.x - from.x);
  return { x: from.x, y: from.y, vx: Math.cos(angle) * IMP_DIVE_SPEED, vy: Math.sin(angle) * IMP_DIVE_SPEED, at: age };
}

/**
 * Where an enemy is `age` seconds after it appeared, or null when it has
 * left the field. Paths are fixed, so they are the same for everyone. An imp
 * dives along `dive` (straight down if none was planned).
 */
export function enemyPosition(spawn: Spawn, age: number, dive: Dive | null = null): { x: number; y: number } | null {
  const d = difficultyAt(spawn.t);
  let x: number;
  let y: number;
  switch (spawn.kind) {
    case 'ghost': {
      // Drifts down, swaying gently.
      y = -40 + lerp(90, 130, d) * age;
      x = spawn.x + 60 * Math.sin(age * 2.2 + spawn.id);
      break;
    }
    case 'bat': {
      // Zigzags down, bouncing off the sides.
      y = -30 + lerp(150, 200, d) * age;
      x = bounce(spawn.x + spawn.dir * lerp(280, 340, d) * age, 30, FIELD_W - 30);
      break;
    }
    case 'pumpkin': {
      // Comes down, hovers and shoots for a while, then sinks away.
      const hoverY = 110 + (spawn.id % 4) * 40;
      const hover = 8;
      const down = Math.min(age, 2) / 2;
      y = -40 + (hoverY + 40) * (1 - (1 - down) * (1 - down));
      if (age > 2 + hover) y += 120 * (age - 2 - hover);
      x = spawn.x + spawn.dir * 130 * Math.sin(age * 0.8);
      break;
    }
    case 'skeleton': {
      // A marching block: sideways to one end, a step down, back to the other end.
      const f = spawn.formation!;
      const entry = Math.min(age, FORMATION_ENTRY) / FORMATION_ENTRY;
      const march = Math.max(0, age - FORMATION_ENTRY) * lerp(130, 170, d);
      const sway = FORMATION_SWAY - Math.abs(((march + FORMATION_SWAY) % (4 * FORMATION_SWAY)) - 2 * FORMATION_SWAY);
      const turns = Math.floor((march + FORMATION_SWAY) / (2 * FORMATION_SWAY));
      const top = lerp(-f.rows * FORMATION_DY, 100, entry) + turns * FORMATION_STEP + Math.max(0, age - FORMATION_ENTRY) * 10;
      x = spawn.x + spawn.dir * sway + (f.col - (f.cols - 1) / 2) * FORMATION_DX;
      y = top + f.row * FORMATION_DY;
      break;
    }
    case 'imp': {
      // Drops in, hovers for a moment, then dives at the pope.
      if (age < IMP_HOVER) {
        const k = age / IMP_HOVER;
        y = -30 + (150 + (spawn.id % 3) * 30) * (1 - (1 - k) * (1 - k));
        x = spawn.x + spawn.dir * 30 * Math.sin(age * 6);
      } else {
        const start = { x: spawn.x + spawn.dir * 30 * Math.sin(IMP_HOVER * 6), y: 120 + (spawn.id % 3) * 30 };
        const path = dive ?? { ...start, vx: 0, vy: IMP_DIVE_SPEED, at: IMP_HOVER };
        x = path.x + path.vx * (age - path.at);
        y = path.y + path.vy * (age - path.at);
        if (x < -60 || x > FIELD_W + 60) return null;
      }
      break;
    }
    case 'reaper': {
      // Glides down slowly, sways and shoots, then drifts on downwards.
      const down = Math.min(age, 3) / 3;
      y = -60 + 230 * (1 - (1 - down) * (1 - down));
      if (age > REAPER_STAY) y += 70 * (age - REAPER_STAY);
      x = clamp(spawn.x + spawn.dir * 220 * Math.sin(age * 0.5), 80, FIELD_W - 80);
      break;
    }
    default: {
      // The ark and the grail float slowly across the top.
      x = spawn.x + spawn.dir * 150 * age;
      y = 112 + 10 * Math.sin(age * 2);
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
      { dx: -8, angle: 0 },
      { dx: 8, angle: 0 },
    ],
    [
      { dx: 0, angle: 0 },
      { dx: -6, angle: -7 },
      { dx: 6, angle: 7 },
    ],
    [
      { dx: -8, angle: 0 },
      { dx: 8, angle: 0 },
      { dx: -10, angle: -9 },
      { dx: 10, angle: 9 },
    ],
    [
      { dx: 0, angle: 0 },
      { dx: -9, angle: 0 },
      { dx: 9, angle: 0 },
      { dx: -11, angle: -11 },
      { dx: 11, angle: 11 },
    ],
  ];
  const barrels = [...levels[clamp(Math.round(level), 1, levels.length) - 1]];
  if (spread) barrels.push({ dx: -12, angle: -22 }, { dx: 12, angle: 22 });
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
export function touchesPope(popeX: number, popeY: number, x: number, y: number, radius: number): boolean {
  const dx = Math.max(Math.abs(x - popeX) - POPE_HALF_W, 0);
  const dy = Math.max(Math.abs(y - popeY) - POPE_HALF_H, 0);
  return dx * dx + dy * dy < radius * radius;
}

/*
 * The Devil. It grows angrier at 2/3 and 1/3 of its health: faster, with
 * more and nastier attacks.
 */

/** The Devil is drawn this much smaller than its picture. */
export const BOSS_SCALE = 0.85;
/** The Devil's body for collisions (an ellipse). */
export const BOSS_RX = 96 * BOSS_SCALE;
export const BOSS_RY = 86 * BOSS_SCALE;

export type BossAttack = 'fan' | 'aimed' | 'rain' | 'spiral' | 'ring' | 'summon' | 'charge' | 'vanish';

/** Attacks of each stage of anger, played in turn. */
export const BOSS_ATTACKS: readonly (readonly BossAttack[])[] = [
  ['fan', 'aimed', 'rain', 'fan', 'summon', 'aimed'],
  ['spiral', 'aimed', 'charge', 'fan', 'summon', 'ring', 'rain'],
  ['spiral', 'charge', 'ring', 'vanish', 'aimed', 'summon', 'rain', 'charge', 'fan'],
];

/** 1, 2 or 3: how angry the Devil is at this share of health. */
export function bossStage(healthShare: number): 1 | 2 | 3 {
  return healthShare > 2 / 3 ? 1 : healthShare > 1 / 3 ? 2 : 3;
}

export function bossAttackGap(healthShare: number): number {
  return lerp(C.bossAttackGapEnd, C.bossAttackGapStart, clamp(healthShare, 0, 1));
}

/** Where the Devil hovers, `age` seconds after the interlude. It glides down, then sways from side to side. */
export function bossPosition(age: number, healthShare: number): { x: number; y: number } {
  const entry = Math.min(age, 3) / 3;
  const pace = lerp(1.25, 0.6, clamp(healthShare, 0, 1));
  return {
    x: FIELD_W / 2 + 400 * Math.sin(Math.max(0, age - 3) * pace * 0.8),
    y: lerp(-170, 160, 1 - (1 - entry) * (1 - entry)) + 18 * Math.sin(age * 1.7),
  };
}

export function hitsBoss(bossX: number, bossY: number, x: number, y: number): boolean {
  const nx = (x - bossX) / BOSS_RX;
  const ny = (y - bossY) / BOSS_RY;
  return nx * nx + ny * ny <= 1;
}
