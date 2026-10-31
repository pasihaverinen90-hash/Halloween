import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { heldKeys, onKeys, type HeldKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { H, W } from '../../ui/screen';
import { COLORS, CSS, TEXT } from '../../ui/theme';
import { assetKey, type AssetSpec, type GameContext, type GameSceneData } from '../types';
import {
  ARK,
  BACKGROUND,
  BAT,
  BOLT,
  BONE,
  BOOST_RAPID,
  BOOST_SHIELD,
  BOOST_SPREAD,
  CURSE,
  DEVIL,
  FIREBALL,
  GHOST,
  GRAIL,
  HOLY_WATER,
  IMP,
  LIFE,
  ORB,
  POPE,
  PUMPKIN,
  REAPER,
  SHIELD,
  SKELETON,
} from './assets';
import {
  BOSS_ATTACKS,
  BOSS_RX,
  BOSS_SCALE,
  bossAttackGap,
  bossPosition,
  bossStage,
  difficultyAt,
  ENEMY_HP,
  ENEMY_RADIUS,
  ENEMY_TOTAL,
  enemyPosition,
  enemyShotGap,
  enemyShotSpeed,
  fireInterval,
  hitsBoss,
  IMP_HOVER,
  ORB_RADIUS,
  ORB_SPEED,
  orbPositions,
  planDive,
  POPE_MAX_X,
  POPE_MAX_Y,
  POPE_MIN_X,
  POPE_MIN_Y,
  POPE_START_Y,
  rollDrop,
  SCALE,
  SCHEDULE,
  scoreOf,
  SHOOTERS,
  SPECIALS,
  touchesPope,
  weaponPattern,
  type BossAttack,
  type BoostKind,
  type Dive,
  type EnemyKind,
  type Spawn,
} from './logic';

const C = CONFIG.raiskinta;

const ENEMY_ART: Record<EnemyKind, AssetSpec> = {
  ghost: GHOST,
  bat: BAT,
  pumpkin: PUMPKIN,
  skeleton: SKELETON,
  imp: IMP,
  reaper: REAPER,
  ark: ARK,
  grail: GRAIL,
};
const BOOST_ART: Record<BoostKind, AssetSpec> = { rapid: BOOST_RAPID, spread: BOOST_SPREAD, shield: BOOST_SHIELD, water: HOLY_WATER, life: LIFE };
const BOOST_NAMES: Record<BoostKind, string> = { rapid: 'Nopea tuli', spread: 'Hajaammus', shield: 'Suojakehä', water: 'Pyhä vesi +1', life: '+1 kesto' };
/** Boosts that last a while (holy water is kept until thrown, endurance is restored at once). */
type TimedBoost = Exclude<BoostKind, 'water' | 'life'>;
/** Colour of the burst when an enemy is destroyed. */
const BURST: Record<EnemyKind, number> = {
  ghost: 0xdfe9ff,
  bat: 0x9a7cc8,
  pumpkin: 0xff9a2e,
  skeleton: 0xece4d0,
  imp: 0x7dff8a,
  reaper: 0xb06bff,
  ark: COLORS.gold,
  grail: COLORS.gold,
};
/** Colour of the Devil's aura at each stage of anger. */
const AURA = [0xff8a1f, 0xff4a1f, 0xff1f3a];

const BAR_X = 330;
const BAR_W = 470;
const BAR_Y = 34;
/** Where the pope's light leaves the crosier, relative to his centre. */
const MUZZLE_Y = -56 * SCALE;

type Phase = 'playing' | 'interlude' | 'boss' | 'won' | 'dead';

interface Enemy {
  spawn: Spawn;
  hp: number;
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  /** Seconds since it appeared. */
  age: number;
  shootIn: number;
  /** A guardian orb hurts the enemy again only after this many seconds. */
  orbCooldown: number;
  dive: Dive | null;
  /** Called by the Devil: not one of the scheduled enemies, gives no points. */
  minion: boolean;
}

interface Bullet {
  sprite: Phaser.GameObjects.Image;
  pool: ImagePool;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  spin: number;
}

interface Item {
  kind: BoostKind;
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
}

/** Adds a picture at the shooter's scale (smaller than the picture's own size: the view is "further away"). */
function addScaled(scene: Phaser.Scene, spec: AssetSpec, x: number, y: number, scale = SCALE): Phaser.GameObjects.Image {
  return addAsset(scene, spec, x, y, { width: spec.width * scale, height: spec.height * scale });
}

/** Reuses images of one kind (bullets come and go many times a second). */
class ImagePool {
  private free: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly spec: AssetSpec,
    private readonly depth: number,
  ) {}

  take(x: number, y: number): Phaser.GameObjects.Image {
    const image = this.free.pop() ?? addScaled(this.scene, this.spec, x, y).setDepth(this.depth);
    return image.setPosition(x, y).setVisible(true).setActive(true).setAlpha(1).setRotation(0);
  }

  give(image: Phaser.GameObjects.Image): void {
    image.setVisible(false).setActive(false);
    this.free.push(image);
  }
}

/** Shooter: arrows move the pope, who fires by himself. Destroy enemies, survive until the Devil and defeat it. One attempt. */
export class RaiskintaScene extends Phaser.Scene {
  private ctx!: GameContext;
  private phase: Phase = 'playing';
  /** Seconds of play before the Devil (stops at bossAfterSeconds). */
  private playTime = 0;
  private nextSpawn = 0;
  private minions = 0;
  private enemies: Enemy[] = [];
  private shots: Bullet[] = [];
  private bullets: Bullet[] = [];
  private items: Item[] = [];
  private popeX = W / 2;
  private popeY = POPE_START_Y;
  private health: number = C.maxHealth;
  private invulnerable = 0;
  private weaponLevel = 1;
  private boosts: Record<TimedBoost, number> = { rapid: 0, spread: 0, shield: 0 };
  private holyWater: number = C.holyWaterStart;
  private orbCount = 0;
  private orbAngle = 0;
  private orbs: Phaser.GameObjects.Image[] = [];
  private bossOrbCooldown = 0;
  /** Seconds since the last drop (drops come at most every dropGapSeconds). */
  private sinceDrop = 0;
  /** Index of the next golden cross in CONFIG.raiskinta.lifeDropTimes. */
  private nextLifeDrop = 0;
  private fireCooldown = 0;
  private killed = 0;
  private bossDefeated = false;
  private bossAge = 0;
  private bossHealth: number = C.bossHealth;
  private bossStageNow: 1 | 2 | 3 = 1;
  private bossAttackIn = 0;
  private bossMoves = 0;
  /** Extra displacement of the Devil from its swaying path (charges, vanishing). */
  private bossOffset = { x: 0, y: 0 };
  private interludeLeft = 0;
  private finished = false;
  private random!: Phaser.Math.RandomDataGenerator;

  private keys!: HeldKeys;
  private bg!: Phaser.GameObjects.TileSprite;
  private pope!: Phaser.GameObjects.Image;
  private shield!: Phaser.GameObjects.Image;
  private boss: Phaser.GameObjects.Image | null = null;
  private aura: Phaser.GameObjects.Arc | null = null;
  private bolts!: ImagePool;
  private fireballs!: ImagePool;
  private bones!: ImagePool;
  private curses!: ImagePool;
  private barFill!: Phaser.GameObjects.Graphics;
  private barMarks!: Phaser.GameObjects.Graphics;
  private pointsText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private lives: Phaser.GameObjects.Image[] = [];
  private shownPoints = -1;
  private shownStatus = '';
  private shownHealth = -1;

  constructor() {
    super('Raiskinta');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.phase = 'playing';
    this.playTime = 0;
    this.nextSpawn = 0;
    this.minions = 0;
    this.enemies = [];
    this.shots = [];
    this.bullets = [];
    this.items = [];
    this.popeX = W / 2;
    this.popeY = POPE_START_Y;
    this.health = C.maxHealth;
    this.invulnerable = 0;
    this.weaponLevel = 1;
    this.boosts = { rapid: 0, spread: 0, shield: 0 };
    this.holyWater = C.holyWaterStart;
    this.orbCount = 0;
    this.orbAngle = 0;
    this.orbs = [];
    this.bossOrbCooldown = 0;
    this.sinceDrop = 0;
    this.nextLifeDrop = 0;
    this.fireCooldown = 0.4;
    this.killed = 0;
    this.bossDefeated = false;
    this.bossAge = 0;
    this.bossHealth = C.bossHealth;
    this.bossStageNow = 1;
    this.bossAttackIn = 0;
    this.bossMoves = 0;
    this.bossOffset = { x: 0, y: 0 };
    this.interludeLeft = 0;
    this.finished = false;
    this.boss = null;
    this.aura = null;
    this.lives = [];
    this.shownPoints = -1;
    this.shownStatus = '';
    this.shownHealth = -1;
    // The same seed every attempt: enemies shoot the same way for everyone who plays the same way.
    this.random = new Phaser.Math.RandomDataGenerator(['kiirastuli']);
  }

  create(): void {
    const key = assetKey(BACKGROUND);
    const frame = this.textures.getFrame(key);
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, key).setDepth(0);
    const tileScale = (W / frame.width) * SCALE;
    this.bg.setTileScale(tileScale, tileScale);

    this.bolts = new ImagePool(this, BOLT, 3);
    this.fireballs = new ImagePool(this, FIREBALL, 6);
    this.bones = new ImagePool(this, BONE, 6);
    this.curses = new ImagePool(this, CURSE, 6);
    this.shield = addScaled(this, SHIELD, this.popeX, this.popeY).setDepth(5).setVisible(false);
    this.pope = addScaled(this, POPE, this.popeX, this.popeY).setDepth(4);

    this.buildHud();
    addKeyHints(this, [
      ['←→↑↓', 'Liiku'],
      ['Välilyönti', 'Pyhä vesi'],
    ]);
    this.keys = heldKeys(this, ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
    onKeys(this, { ' ': () => this.throwHolyWater() });
    this.ctx.sfx.play('start');
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    this.bg.tilePositionY -= (C.scrollSpeed * dt) / this.bg.tileScaleY;
    if (this.phase === 'won' || this.phase === 'dead') {
      this.moveBullets(this.bullets, dt);
      return;
    }
    this.movePope(dt);
    this.moveOrbs(dt);
    this.sinceDrop += dt;
    this.fire(dt);
    if (this.phase === 'playing') {
      this.playTime = Math.min(C.bossAfterSeconds, this.playTime + dt);
      this.spawnDue();
      if (this.playTime >= C.bossAfterSeconds) this.startInterlude();
    } else if (this.phase === 'interlude') {
      this.interludeLeft -= dt;
      if (this.interludeLeft <= 0) this.startBoss();
    } else if (this.phase === 'boss') {
      this.updateBoss(dt);
    }
    this.moveEnemies(dt);
    this.moveBullets(this.shots, dt);
    this.moveBullets(this.bullets, dt);
    this.moveItems(dt);
    this.checkHits();
    this.refreshHud();
  }

  getTestState(): unknown {
    return {
      phase: this.phase,
      time: Math.round(this.playTime * 10) / 10,
      health: this.health,
      killed: this.killed,
      total: ENEMY_TOTAL,
      points: this.points(),
      weapon: this.weaponLevel,
      boosts: { ...this.boosts },
      enemies: this.enemies.length,
      bossHealth: this.phase === 'boss' || this.phase === 'won' ? this.bossHealth : null,
      bossStage: this.phase === 'boss' ? this.bossStageNow : null,
      orbs: this.orbCount,
      holyWater: this.holyWater,
      popeX: Math.round(this.popeX),
      popeY: Math.round(this.popeY),
    };
  }

  /** Test helper: jump ahead in the attempt. Enemies skipped this way are missed. */
  debugSkip(seconds: number): void {
    for (const enemy of [...this.enemies]) this.removeEnemy(enemy);
    this.playTime = Phaser.Math.Clamp(seconds, 0, C.bossAfterSeconds);
    // Also backwards, so a test can skip to a moment it has already passed.
    const next = SCHEDULE.findIndex((s) => s.t >= this.playTime);
    this.nextSpawn = next === -1 ? SCHEDULE.length : next;
  }

  /** Test helper: the pope takes n hits. */
  debugHurt(n: number): void {
    for (let i = 0; i < n && this.phase !== 'dead'; i++) {
      this.invulnerable = 0;
      this.boosts.shield = 0;
      this.hurt();
    }
  }

  /** Test helper: drop a boost just above the pope. */
  debugDrop(kind: BoostKind): void {
    this.dropItem(kind, this.popeX, this.popeY - 90);
  }

  /** Test helper: set the Devil's health. */
  debugBossHealth(health: number): void {
    this.bossHealth = health;
  }

  /** Points at this moment, for ending the game with Ctrl + Q (Pasi 31.10.). */
  currentScore(): number {
    return this.points(this.ctx.freeplay);
  }

  private points(exact = false): number {
    return scoreOf(this.killed, this.playTime, this.bossDefeated, exact);
  }

  // ---------------------------------------------------------------- pope

  private movePope(dt: number): void {
    const dx = (this.keys.isDown('ArrowRight') ? 1 : 0) - (this.keys.isDown('ArrowLeft') ? 1 : 0);
    const dy = (this.keys.isDown('ArrowDown') ? 1 : 0) - (this.keys.isDown('ArrowUp') ? 1 : 0);
    const step = (C.popeSpeed * dt) / (dx && dy ? Math.SQRT2 : 1);
    this.popeX = Phaser.Math.Clamp(this.popeX + dx * step, POPE_MIN_X, POPE_MAX_X);
    this.popeY = Phaser.Math.Clamp(this.popeY + dy * step, POPE_MIN_Y, POPE_MAX_Y);
    this.pope.setPosition(this.popeX, this.popeY).setAngle(dx * 6);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.pope.setAlpha(this.invulnerable > 0 && Math.floor(this.invulnerable * 11) % 2 === 0 ? 0.35 : 1);
    for (const kind of Object.keys(this.boosts) as TimedBoost[]) this.boosts[kind] = Math.max(0, this.boosts[kind] - dt);
    const shielded = this.boosts.shield > 0;
    this.shield.setVisible(shielded).setPosition(this.popeX, this.popeY);
    if (shielded) this.shield.setAlpha(this.boosts.shield < 1.5 && Math.floor(this.boosts.shield * 8) % 2 === 0 ? 0.3 : 0.9);
  }

  private fire(dt: number): void {
    this.fireCooldown -= dt;
    if (this.fireCooldown > 0) return;
    const interval = fireInterval(this.weaponLevel, this.boosts.rapid > 0);
    this.fireCooldown = Math.max(this.fireCooldown + interval, interval * 0.5);
    for (const barrel of weaponPattern(this.weaponLevel, this.boosts.spread > 0)) {
      const angle = Phaser.Math.DegToRad(barrel.angle);
      const x = this.popeX + barrel.dx;
      const y = this.popeY + MUZZLE_Y;
      const sprite = this.bolts.take(x, y).setRotation(angle);
      this.shots.push({ sprite, pool: this.bolts, x, y, vx: Math.sin(angle) * C.shotSpeed, vy: -Math.cos(angle) * C.shotSpeed, radius: 6, spin: 0 });
    }
  }

  private hurt(): void {
    if (this.boosts.shield > 0) {
      this.tweens.add({ targets: this.shield, scale: { from: this.shield.scale * 1.15, to: this.shield.scale }, duration: 160 });
      this.ctx.sfx.tone({ freq: 900, slideTo: 1300, duration: 0.08, type: 'sine', volume: 0.15 });
      return;
    }
    if (this.invulnerable > 0 || this.phase === 'dead' || this.phase === 'won') return;
    this.health = Math.max(0, this.health - 1);
    this.invulnerable = C.invulnerableSeconds;
    this.cameras.main.shake(200, 0.006);
    this.ctx.sfx.play('wrong');
    this.ctx.sfx.noise({ duration: 0.18, volume: 0.25, filterFreq: 700 });
    if (this.health === 0) this.die();
  }

  private die(): void {
    this.phase = 'dead';
    this.ctx.sfx.play('fail');
    this.burst(this.popeX, this.popeY, 0xffffff, 16);
    this.tweens.add({ targets: this.pope, angle: 90, alpha: 0.3, y: this.popeY + 20, duration: 700, ease: 'Quad.In' });
    this.shield.setVisible(false);
    this.time.delayedCall(1800, () => this.end());
  }

  private end(): void {
    if (this.finished) return;
    this.finished = true;
    this.ctx.finish(this.points(this.ctx.freeplay));
  }

  // ---------------------------------------------------------------- enemies

  private spawnDue(): void {
    while (this.nextSpawn < SCHEDULE.length && SCHEDULE[this.nextSpawn].t <= this.playTime) {
      const spawn = SCHEDULE[this.nextSpawn++];
      this.addEnemy(spawn, this.playTime - spawn.t, false);
      if (SPECIALS.has(spawn.kind)) this.ctx.sfx.tone({ freq: 660, slideTo: 990, duration: 0.5, type: 'sine', volume: 0.15 });
    }
  }

  private addEnemy(spawn: Spawn, age: number, minion: boolean): void {
    const pos = enemyPosition(spawn, age) ?? { x: spawn.x, y: -60 };
    const sprite = addScaled(this, ENEMY_ART[spawn.kind], pos.x, pos.y).setDepth(SPECIALS.has(spawn.kind) ? 2 : 3);
    const gap = enemyShotGap(spawn.t);
    const shootIn = spawn.kind === 'skeleton' ? gap * (2 + this.random.frac() * 5) : gap * (0.6 + this.random.frac() * 0.6);
    this.enemies.push({ spawn, hp: ENEMY_HP[spawn.kind], sprite, x: pos.x, y: pos.y, age, shootIn, orbCooldown: 0, dive: null, minion });
  }

  private moveEnemies(dt: number): void {
    for (const enemy of [...this.enemies]) {
      enemy.age += dt;
      enemy.orbCooldown = Math.max(0, enemy.orbCooldown - dt);
      if (enemy.spawn.kind === 'imp' && !enemy.dive && enemy.age >= IMP_HOVER) {
        enemy.dive = planDive({ x: enemy.x, y: enemy.y }, { x: this.popeX, y: this.popeY }, enemy.age);
        this.ctx.sfx.tone({ freq: 700, slideTo: 350, duration: 0.15, type: 'square', volume: 0.06 });
      }
      const pos = enemyPosition(enemy.spawn, enemy.age, enemy.dive);
      if (!pos) {
        this.removeEnemy(enemy);
        continue;
      }
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.sprite.setPosition(pos.x, pos.y);
      if (enemy.dive) enemy.sprite.setRotation(Math.atan2(enemy.dive.vy, enemy.dive.vx) - Math.PI / 2);
      if ((this.phase !== 'playing' && !enemy.minion) || !SHOOTERS.has(enemy.spawn.kind) || pos.y < 40 || pos.y > this.popeY - 100) continue;
      enemy.shootIn -= dt;
      if (enemy.shootIn > 0) continue;
      const gap = enemyShotGap(this.playTime);
      const kind = enemy.spawn.kind;
      enemy.shootIn = gap * (kind === 'skeleton' ? 2.5 + this.random.frac() * 3 : kind === 'reaper' ? 1.2 + this.random.frac() * 0.5 : 0.7 + this.random.frac() * 0.6);
      this.enemyShoot(enemy);
    }
  }

  private enemyShoot(enemy: Enemy): void {
    const speed = enemyShotSpeed(this.playTime);
    const aim = Math.atan2(this.popeY - enemy.y, this.popeX - enemy.x);
    if (enemy.spawn.kind === 'pumpkin') {
      // Fireballs aimed at the pope: one at first, three later
      const spread = difficultyAt(enemy.spawn.t) > 0.6 ? [-0.22, 0, 0.22] : [0];
      for (const a of spread) this.addBullet(this.fireballs, enemy.x, enemy.y + 14, Math.cos(aim + a) * speed, Math.sin(aim + a) * speed, 8, 0);
    } else if (enemy.spawn.kind === 'reaper') {
      // A fan of five curse orbs towards the pope
      for (let i = -2; i <= 2; i++) this.addBullet(this.curses, enemy.x, enemy.y + 20, Math.cos(aim + i * 0.2) * speed * 0.85, Math.sin(aim + i * 0.2) * speed * 0.85, 8, 0);
      this.ctx.sfx.tone({ freq: 300, slideTo: 200, duration: 0.18, type: 'sine', volume: 0.08 });
    } else {
      // A bone thrown down, a little towards the pope
      const vx = Phaser.Math.Clamp((this.popeX - enemy.x) * 0.25, -100, 100);
      this.addBullet(this.bones, enemy.x, enemy.y + 14, vx, speed * 0.9, 7, 9);
    }
  }

  private addBullet(pool: ImagePool, x: number, y: number, vx: number, vy: number, radius: number, spin: number): void {
    this.bullets.push({ sprite: pool.take(x, y), pool, x, y, vx, vy, radius, spin });
  }

  private removeEnemy(enemy: Enemy): void {
    const i = this.enemies.indexOf(enemy);
    if (i >= 0) this.enemies.splice(i, 1);
    this.tweens.killTweensOf(enemy.sprite);
    enemy.sprite.destroy();
  }

  private damage(enemy: Enemy): void {
    enemy.hp -= 1;
    if (enemy.hp > 0) {
      enemy.sprite.setTintFill(0xffffff);
      this.time.delayedCall(60, () => enemy.sprite.active && enemy.sprite.clearTint());
      this.ctx.sfx.noise({ duration: 0.04, volume: 0.1, filterFreq: 2600 });
      return;
    }
    this.kill(enemy);
  }

  private kill(enemy: Enemy): void {
    const { kind } = enemy.spawn;
    if (!enemy.minion) this.killed += 1;
    this.burst(enemy.x, enemy.y, BURST[kind], SPECIALS.has(kind) || kind === 'reaper' ? 18 : 8);
    this.ctx.sfx.tone({ freq: 520, slideTo: 240, duration: 0.12, type: 'triangle', volume: 0.16 });
    if (SPECIALS.has(kind)) {
      this.blessing(kind, enemy.x, enemy.y);
    } else if (this.nextLifeDrop < C.lifeDropTimes.length && this.playTime >= C.lifeDropTimes[this.nextLifeDrop]) {
      // Pasi 20.10.: a couple of extra lives along the way
      this.nextLifeDrop += 1;
      this.dropItem('life', enemy.x, enemy.y);
    } else {
      // Pasi 20.10.: any destroyed enemy may drop a boost
      const drop = rollDrop(this.random.frac(), this.random.frac(), this.sinceDrop, this.holyWater);
      if (drop) this.dropItem(drop, enemy.x, enemy.y);
    }
    this.removeEnemy(enemy);
  }

  /** A lasting upgrade from a holy object: the ark improves the weapon, the grail adds a guardian orb. */
  private blessing(kind: EnemyKind, x: number, y: number): void {
    let message: string;
    if (kind === 'ark' && this.weaponLevel < C.maxWeaponLevel) {
      this.weaponLevel += 1;
      message = 'Liitonarkku: ase paranee!';
    } else if (kind === 'grail' && this.orbCount < C.maxOrbs) {
      this.addOrb();
      message = 'Pyhä malja: suojapallo!';
    } else {
      this.holyWater = Math.min(C.holyWaterMax, this.holyWater + 1);
      message = `${kind === 'ark' ? 'Liitonarkku' : 'Pyhä malja'}: pyhää vettä!`;
    }
    this.floatText(x, y, message, CSS.gold);
    this.ctx.sfx.play('success');
  }

  private dropItem(kind: BoostKind, x: number, y: number): void {
    this.sinceDrop = 0;
    this.items.push({ kind, sprite: addScaled(this, BOOST_ART[kind], x, y, kind === 'life' ? 1.5 : 1).setDepth(2), x, y });
  }

  // ---------------------------------------------------------------- guardian orbs and holy water

  private addOrb(): void {
    this.orbCount += 1;
    this.orbs.push(addScaled(this, ORB, this.popeX, this.popeY, 1.4).setDepth(5));
  }

  private moveOrbs(dt: number): void {
    this.orbAngle += ORB_SPEED * dt;
    this.bossOrbCooldown = Math.max(0, this.bossOrbCooldown - dt);
    orbPositions(this.orbs.length, this.orbAngle, this.popeX, this.popeY).forEach((p, i) => this.orbs[i].setPosition(p.x, p.y));
  }

  /** Space: holy water hurts every enemy on screen and wipes out all their bullets. */
  private throwHolyWater(): void {
    if ((this.phase !== 'playing' && this.phase !== 'boss') || this.holyWater <= 0) return;
    this.holyWater -= 1;
    this.cameras.main.flash(300, 255, 245, 210);
    const ring = this.add.circle(this.popeX, this.popeY, 30, 0xbfe3ff, 0.5).setDepth(8);
    this.tweens.add({ targets: ring, scale: 30, alpha: 0, duration: 700, ease: 'Quad.Out', onComplete: () => ring.destroy() });
    this.ctx.sfx.tone({ freq: 880, slideTo: 1320, duration: 0.5, type: 'sine', volume: 0.2 });
    this.ctx.sfx.tone({ freq: 660, slideTo: 990, duration: 0.6, type: 'triangle', volume: 0.12, delay: 0.08 });
    this.ctx.sfx.noise({ duration: 0.5, volume: 0.2, filterFreq: 3000 });
    for (const b of this.bullets) this.burst(b.x, b.y, 0xbfe3ff, 3);
    this.clearBullets(this.bullets);
    for (const enemy of [...this.enemies]) {
      if (enemy.y < -20 || enemy.y > H + 20 || enemy.x < -20 || enemy.x > W + 20) continue;
      enemy.hp -= C.holyWaterDamage;
      if (enemy.hp <= 0) this.kill(enemy);
      else {
        enemy.sprite.setTintFill(0xbfe3ff);
        this.time.delayedCall(120, () => enemy.sprite.active && enemy.sprite.clearTint());
      }
    }
    if (this.bossHittable()) this.hitBoss(C.holyWaterBossDamage);
  }

  // ---------------------------------------------------------------- bullets, items and hits

  private moveBullets(list: Bullet[], dt: number): void {
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      if (b.spin) b.sprite.rotation += b.spin * dt;
      if (b.y < -60 || b.y > H + 40 || b.x < -40 || b.x > W + 40) {
        b.pool.give(b.sprite);
        list.splice(i, 1);
      }
    }
  }

  private clearBullets(list: Bullet[]): void {
    for (const b of list) b.pool.give(b.sprite);
    list.length = 0;
  }

  private moveItems(dt: number): void {
    for (const item of [...this.items]) {
      item.y += 120 * dt;
      item.sprite.setPosition(item.x, item.y);
      if (item.y > H + 30) this.removeItem(item);
    }
  }

  private removeItem(item: Item): void {
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
    item.sprite.destroy();
  }

  /** The attempt has ended (the pope fell or the Devil was defeated). */
  private isOver(): boolean {
    return this.phase === 'won' || this.phase === 'dead';
  }

  private bossHittable(): boolean {
    return !!this.boss && this.phase === 'boss' && this.bossAge > 1.5 && this.boss.alpha > 0.5;
  }

  private checkHits(): void {
    // The pope's light against enemies and the Devil
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      let used = false;
      for (const enemy of this.enemies) {
        const r = ENEMY_RADIUS[enemy.spawn.kind] + shot.radius;
        if ((enemy.x - shot.x) ** 2 + (enemy.y - shot.y) ** 2 > r * r) continue;
        this.damage(enemy);
        used = true;
        break;
      }
      if (!used && this.bossHittable() && hitsBoss(this.boss!.x, this.boss!.y, shot.x, shot.y)) {
        this.hitBoss();
        used = true;
      }
      if (used) {
        shot.pool.give(shot.sprite);
        this.shots.splice(i, 1);
      }
    }
    if (this.phase === 'dead' || this.phase === 'won') return;
    // Enemy bullets, enemies and the Devil against the pope
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!touchesPope(this.popeX, this.popeY, b.x, b.y, b.radius)) continue;
      if (this.invulnerable > 0 && this.boosts.shield <= 0) continue;
      b.pool.give(b.sprite);
      this.bullets.splice(i, 1);
      this.hurt();
    }
    // Guardian orbs stop bullets and hurt the enemies they touch
    for (const orb of this.orbs) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        const r = ORB_RADIUS + b.radius;
        if ((b.x - orb.x) ** 2 + (b.y - orb.y) ** 2 > r * r) continue;
        this.burst(b.x, b.y, COLORS.gold, 3);
        b.pool.give(b.sprite);
        this.bullets.splice(i, 1);
      }
      for (const enemy of [...this.enemies]) {
        const r = ORB_RADIUS + ENEMY_RADIUS[enemy.spawn.kind];
        if (enemy.orbCooldown > 0 || (enemy.x - orb.x) ** 2 + (enemy.y - orb.y) ** 2 > r * r) continue;
        enemy.orbCooldown = 0.3;
        this.damage(enemy);
      }
      if (this.bossOrbCooldown <= 0 && this.bossHittable() && hitsBoss(this.boss!.x, this.boss!.y, orb.x, orb.y)) {
        this.bossOrbCooldown = 0.3;
        this.hitBoss();
      }
      if (this.isOver()) return; // an orb gave the Devil its last hit
    }
    for (const enemy of [...this.enemies]) {
      if (!touchesPope(this.popeX, this.popeY, enemy.x, enemy.y, ENEMY_RADIUS[enemy.spawn.kind] * 0.8)) continue;
      if (this.boosts.shield > 0 && enemy.spawn.kind !== 'reaper') {
        this.kill(enemy); // the shield smites whatever touches it
      } else if (this.invulnerable <= 0 && this.boosts.shield <= 0) {
        if (enemy.spawn.kind !== 'reaper') {
          this.burst(enemy.x, enemy.y, BURST[enemy.spawn.kind], 8);
          this.removeEnemy(enemy);
        }
        this.hurt();
      }
    }
    if (this.bossHittable() && touchesPope(this.popeX, this.popeY, this.boss!.x, this.boss!.y, BOSS_RX * 0.8)) this.hurt();
    // Boosts
    for (const item of [...this.items]) {
      if (!touchesPope(this.popeX, this.popeY, item.x, item.y, 20)) continue;
      if (item.kind === 'water') this.holyWater = Math.min(C.holyWaterMax, this.holyWater + 1);
      else if (item.kind === 'life') this.health = Math.min(C.maxHealth, this.health + 1);
      else this.boosts[item.kind] = item.kind === 'shield' ? C.shieldSeconds : C.boostSeconds;
      this.floatText(item.x, item.y - 30, BOOST_NAMES[item.kind], CSS.bone);
      this.ctx.sfx.play('correct');
      this.removeItem(item);
    }
  }

  // ---------------------------------------------------------------- the Devil

  private startInterlude(): void {
    this.phase = 'interlude';
    this.interludeLeft = C.interludeSeconds;
    // Every remaining enemy flees; they count as missed.
    for (const enemy of [...this.enemies]) {
      const sprite = enemy.sprite;
      this.enemies.splice(this.enemies.indexOf(enemy), 1);
      this.tweens.add({ targets: sprite, y: sprite.y - 80, alpha: 0, duration: 700, onComplete: () => sprite.destroy() });
    }
    this.clearBullets(this.bullets);
    for (const item of [...this.items]) this.removeItem(item);

    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x2a0006, 1).setDepth(15).setAlpha(0);
    const text = this.add
      .text(W / 2, H / 2 - 40, 'Kaiken pahan alku ja juuri\nesittäytyy vihdoin…', { ...TEXT.title, fontSize: '64px', align: 'center', color: CSS.orange })
      .setOrigin(0.5)
      .setDepth(16)
      .setAlpha(0);
    const fadeMs = 700;
    const holdMs = Math.max(0, C.interludeSeconds * 1000 - 2 * fadeMs);
    this.tweens.add({ targets: shade, alpha: 0.6, duration: fadeMs, yoyo: true, hold: holdMs, onComplete: () => shade.destroy() });
    this.tweens.add({ targets: text, alpha: 1, duration: fadeMs, yoyo: true, hold: holdMs, onComplete: () => text.destroy() });
    this.ctx.sfx.noise({ duration: 2.5, volume: 0.3, filterFreq: 160, filterType: 'lowpass' });
    this.ctx.sfx.tone({ freq: 70, slideTo: 45, duration: 2.5, type: 'sawtooth', volume: 0.18 });
  }

  private startBoss(): void {
    this.phase = 'boss';
    this.bossAge = 0;
    this.bossAttackIn = 3.6;
    this.bossStageNow = 1;
    const pos = bossPosition(0, 1);
    this.aura = this.add.circle(pos.x, pos.y, BOSS_RX * 1.6, AURA[0], 0.18).setDepth(2);
    this.tweens.add({ targets: this.aura, scale: { from: 0.9, to: 1.1 }, alpha: { from: 0.12, to: 0.26 }, duration: 700, yoyo: true, repeat: -1 });
    this.boss = addScaled(this, DEVIL, pos.x, pos.y, BOSS_SCALE).setDepth(3);
    this.laugh();
  }

  /** A low, rolling "laugh". */
  private laugh(): void {
    for (let i = 0; i < 3; i++) this.ctx.sfx.tone({ freq: 160 - i * 15, slideTo: 90 - i * 10, duration: 0.28, type: 'sawtooth', volume: 0.16, delay: i * 0.3 });
  }

  private updateBoss(dt: number): void {
    if (!this.boss) return;
    this.bossAge += dt;
    const share = this.bossHealth / C.bossHealth;
    const base = bossPosition(this.bossAge, share);
    const x = base.x + this.bossOffset.x;
    const y = base.y + this.bossOffset.y;
    this.boss.setPosition(x, y);
    this.aura?.setPosition(x, y);

    const stage = bossStage(share);
    if (stage > this.bossStageNow) this.enrage(stage);

    this.bossAttackIn -= dt;
    if (this.bossAttackIn > 0) return;
    const attacks = BOSS_ATTACKS[stage - 1];
    const attack = attacks[this.bossMoves++ % attacks.length];
    this.bossAttackIn = bossAttackGap(share) + this.bossAttack(attack, x, y, stage);
  }

  private enrage(stage: 1 | 2 | 3): void {
    this.bossStageNow = stage;
    this.bossMoves = 0;
    this.bossAttackIn = 1.2;
    this.aura?.setFillStyle(AURA[stage - 1], 0.2);
    this.cameras.main.shake(400, 0.008);
    this.laugh();
    if (this.boss) this.tweens.add({ targets: this.boss, scale: this.boss.scale * 1.06, duration: 300, yoyo: true });
    this.floatText(W / 2, H / 2 - 120, stage === 2 ? 'Paholainen suuttuu!' : 'Paholainen raivostuu!', CSS.red);
  }

  /** Runs one attack and returns how many extra seconds it takes. */
  private bossAttack(attack: BossAttack, x: number, y: number, stage: 1 | 2 | 3): number {
    const speed = [250, 290, 330][stage - 1];
    const fire = (fx: number, fy: number, angle: number, v: number): void =>
      this.addBullet(this.fireballs, fx, fy, Math.cos(angle) * v, Math.sin(angle) * v, 9, 0);
    const later = (seconds: number, run: () => void): void => {
      this.time.delayedCall(seconds * 1000, () => this.phase === 'boss' && this.boss && run());
    };
    this.ctx.sfx.noise({ duration: 0.2, volume: 0.12, filterFreq: 500 });
    switch (attack) {
      case 'fan': {
        const count = [5, 7, 9][stage - 1];
        for (let i = 0; i < count; i++) fire(x, y + 60, Phaser.Math.DegToRad(90 + (i - (count - 1) / 2) * (110 / (count - 1))), speed);
        return 0;
      }
      case 'aimed': {
        const count = [3, 4, 5][stage - 1];
        for (let i = 0; i < count; i++) {
          later(i * 0.15, () => {
            const from = this.boss!;
            fire(from.x, from.y + 50, Math.atan2(this.popeY - from.y, this.popeX - from.x), speed * 1.25);
          });
        }
        return count * 0.15;
      }
      case 'rain': {
        const count = [8, 10, 13][stage - 1];
        for (let i = 0; i < count; i++) later(i * 0.12, () => fire(60 + this.random.frac() * (W - 120), -20, Math.PI / 2 + (this.random.frac() - 0.5) * 0.3, speed * 0.85));
        return count * 0.12;
      }
      case 'spiral': {
        // Arms of fire turning around the Devil
        const arms = stage === 3 ? 3 : 2;
        const steps = 28;
        for (let k = 0; k < steps; k++) {
          later(k * 0.07, () => {
            const from = this.boss!;
            for (let a = 0; a < arms; a++) fire(from.x, from.y + 20, k * 0.32 + (a * Math.PI * 2) / arms, 190);
          });
        }
        return steps * 0.07;
      }
      case 'ring': {
        const count = stage === 3 ? 20 : 16;
        for (let i = 0; i < count; i++) fire(x, y + 20, (i / count) * Math.PI * 2, speed * 0.8);
        return 0;
      }
      case 'summon': {
        // Imps called from the sky (they give no points)
        const count = stage + 2;
        for (let i = 0; i < count; i++) {
          const spawn: Spawn = { id: -(++this.minions), t: this.playTime, kind: 'imp', x: Phaser.Math.Clamp(x + (i - (count - 1) / 2) * 110, 80, W - 80), dir: i % 2 ? 1 : -1, formation: null };
          later(i * 0.15, () => this.addEnemy(spawn, 0, true));
        }
        this.boss!.setTintFill(0x7dff8a);
        later(0.15, () => this.boss!.clearTint());
        return 0.6;
      }
      case 'charge': {
        // A warning flash, then a swoop at the pope and back up
        const boss = this.boss!;
        boss.setTint(0xff6060);
        this.ctx.sfx.tone({ freq: 90, slideTo: 60, duration: 0.5, type: 'sawtooth', volume: 0.16 });
        later(0.5, () => {
          boss.clearTint();
          const base = bossPosition(this.bossAge + 0.6, this.bossHealth / C.bossHealth);
          const target = { x: this.popeX - base.x, y: Math.min(this.popeY - 90, 520) - base.y };
          this.tweens.add({
            targets: this.bossOffset,
            x: target.x,
            y: target.y,
            duration: 600,
            ease: 'Quad.In',
            onComplete: () => this.tweens.add({ targets: this.bossOffset, x: 0, y: 0, duration: 900, delay: 150, ease: 'Quad.Out' }),
          });
        });
        return 2.2;
      }
      case 'vanish': {
        // Fades away, appears somewhere else and bursts into a ring of fire
        const boss = this.boss!;
        this.tweens.add({ targets: this.devilParts(), alpha: 0, duration: 300 });
        later(0.5, () => {
          const base = bossPosition(this.bossAge, this.bossHealth / C.bossHealth);
          this.bossOffset.x = 200 + this.random.frac() * (W - 400) - base.x;
          this.bossOffset.y = this.random.frac() * 120 - 20;
          this.tweens.add({ targets: boss, alpha: 1, duration: 300 });
          this.tweens.add({ targets: this.aura, alpha: 0.2, duration: 300 });
        });
        later(0.85, () => {
          for (let i = 0; i < 18; i++) fire(boss.x, boss.y + 20, (i / 18) * Math.PI * 2, speed * 0.8);
        });
        later(2.4, () => this.tweens.add({ targets: this.bossOffset, x: 0, y: 0, duration: 1200, ease: 'Sine.InOut' }));
        return 1.4;
      }
    }
  }

  /** The Devil and its aura, for tweens that move both. */
  private devilParts(): Phaser.GameObjects.GameObject[] {
    return [this.boss, this.aura].filter((part): part is NonNullable<typeof part> => part !== null);
  }

  private hitBoss(damage = 1): void {
    if (!this.boss || this.phase !== 'boss') return;
    this.bossHealth = Math.max(0, this.bossHealth - damage);
    if (!this.boss.isTinted) {
      this.boss.setTintFill(0xffe0a0);
      this.time.delayedCall(50, () => this.boss?.active && this.boss.clearTint());
    }
    if (this.bossHealth > 0) return;

    this.phase = 'won';
    this.bossDefeated = true;
    this.clearBullets(this.bullets);
    for (const enemy of [...this.enemies]) this.removeEnemy(enemy);
    const boss = this.boss;
    this.tweens.killTweensOf(this.bossOffset);
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 200, () =>
        this.burst(boss.x + Phaser.Math.Between(-80, 80), boss.y + Phaser.Math.Between(-60, 60), i % 2 ? COLORS.orange : COLORS.red, 16),
      );
    }
    this.tweens.add({ targets: this.devilParts(), alpha: 0, scale: `*=1.3`, angle: 12, duration: 1400, delay: 400 });
    this.ctx.sfx.play('fanfare');
    const text = this.add.text(W / 2, H / 2 - 40, 'Paholainen kaatui!', { ...TEXT.title, fontSize: '80px' }).setOrigin(0.5).setDepth(16);
    text.setScale(0.6);
    this.tweens.add({ targets: text, scale: 1, duration: 500, ease: 'Back.Out' });
    this.time.delayedCall(3000, () => this.end());
  }

  // ---------------------------------------------------------------- effects and HUD

  private burst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 24 + Math.random() * 26;
      const dot = this.add.circle(x, y, 2.5 + Math.random() * 3, color, 1).setDepth(7);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 360 + Math.random() * 200,
        ease: 'Quad.Out',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private floatText(x: number, y: number, message: string, color: string): void {
    const text = this.add
      .text(Phaser.Math.Clamp(x, 220, W - 220), y, message, { ...TEXT.bodyBold, fontSize: '28px', color })
      .setOrigin(0.5)
      .setDepth(17);
    text.setShadow(0, 2, '#000000', 4, true, true);
    this.tweens.add({ targets: text, y: y - 60, alpha: 0, duration: 1600, delay: 500, onComplete: () => text.destroy() });
  }

  private buildHud(): void {
    const bar = this.add.graphics().setDepth(20);
    bar.fillStyle(COLORS.night, 0.75);
    bar.fillRoundedRect(BAR_X - 14, BAR_Y - 20, BAR_W + 28, 40, 14);
    bar.fillRoundedRect(20, BAR_Y - 20, 260, 40, 14);
    bar.fillRoundedRect(W - 30 - C.maxHealth * 26, BAR_Y - 20, C.maxHealth * 26 + 14, 40, 14);
    bar.fillStyle(COLORS.panelLight, 1);
    bar.fillRoundedRect(BAR_X, BAR_Y - 6, BAR_W, 12, 6);
    this.barFill = this.add.graphics().setDepth(21);
    this.barMarks = this.add.graphics().setDepth(22);
    this.add.text(BAR_X + BAR_W + 22, BAR_Y, 'Paholainen', { ...TEXT.bodyBold, fontSize: '20px', color: CSS.red }).setOrigin(0, 0.5).setDepth(21);
    this.pointsText = this.add.text(36, BAR_Y, '', { ...TEXT.bodyBold, fontSize: '26px', color: CSS.orange }).setOrigin(0, 0.5).setDepth(21);
    this.statusText = this.add.text(36, 76, '', { ...TEXT.bodyBold, fontSize: '20px', color: CSS.bone }).setOrigin(0, 0.5).setDepth(21);
    this.statusText.setShadow(0, 2, '#000000', 4, true, true);
    for (let i = 0; i < C.maxHealth; i++) {
      this.lives.push(addAsset(this, LIFE, W - 40 - i * 26, BAR_Y, { width: 20, height: 24 }).setDepth(21));
    }
    this.refreshHud();
  }

  private refreshHud(): void {
    const boss = this.phase === 'boss' || (this.phase === 'won' && this.bossDefeated);
    const share = boss ? this.bossHealth / C.bossHealth : this.playTime / C.bossAfterSeconds;
    this.barFill.clear();
    this.barFill.fillStyle(boss ? COLORS.red : COLORS.orange, 1);
    if (share > 0) this.barFill.fillRoundedRect(BAR_X, BAR_Y - 6, Math.max(12, BAR_W * share), 12, 6);
    this.barMarks.clear();
    if (boss) {
      // Marks where the Devil grows angrier
      this.barMarks.fillStyle(COLORS.night, 1);
      for (const mark of [1 / 3, 2 / 3]) this.barMarks.fillRect(BAR_X + BAR_W * mark - 1.5, BAR_Y - 8, 3, 16);
    }

    const points = this.points();
    if (points !== this.shownPoints) {
      this.shownPoints = points;
      this.pointsText.setText(`Pisteet: ${points.toLocaleString('fi-FI')}`);
    }
    if (this.health !== this.shownHealth) {
      this.shownHealth = this.health;
      // The rightmost cross goes first
      this.lives.forEach((life, i) => life.setAlpha(C.maxHealth - 1 - i < this.health ? 1 : 0.2));
    }
    const parts = [`Ase ${this.weaponLevel}/${C.maxWeaponLevel}`, `Pyhä vesi ${this.holyWater}`];
    if (this.orbCount > 0) parts.push(`Suojapallot ${this.orbCount}`);
    for (const kind of Object.keys(this.boosts) as TimedBoost[]) {
      if (this.boosts[kind] > 0) parts.push(`${BOOST_NAMES[kind]} ${Math.ceil(this.boosts[kind])} s`);
    }
    const status = parts.join('   ');
    if (status !== this.shownStatus) {
      this.shownStatus = status;
      this.statusText.setText(status);
    }
  }
}
