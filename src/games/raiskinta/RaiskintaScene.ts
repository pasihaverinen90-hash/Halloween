import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { heldKeys, type HeldKeys } from '../../ui/input';
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
  DEVIL,
  FIREBALL,
  GHOST,
  GRAIL,
  LIFE,
  POPE,
  PUMPKIN,
  SHIELD,
  SKELETON,
} from './assets';
import {
  bossAttackGap,
  bossPosition,
  ENEMY_HP,
  ENEMY_RADIUS,
  ENEMY_TOTAL,
  enemyPosition,
  enemyShotGap,
  enemyShotSpeed,
  fireInterval,
  hitsBoss,
  POPE_MAX_X,
  POPE_MIN_X,
  POPE_Y,
  SCHEDULE,
  scoreOf,
  SHOOTERS,
  SPECIALS,
  touchesPope,
  weaponPattern,
  type BoostKind,
  type EnemyKind,
  type Spawn,
} from './logic';

const C = CONFIG.raiskinta;

const ENEMY_ART: Record<EnemyKind, AssetSpec> = { ghost: GHOST, bat: BAT, pumpkin: PUMPKIN, skeleton: SKELETON, ark: ARK, grail: GRAIL };
const BOOST_ART: Record<BoostKind, AssetSpec> = { rapid: BOOST_RAPID, spread: BOOST_SPREAD, shield: BOOST_SHIELD };
const BOOST_NAMES: Record<BoostKind, string> = { rapid: 'Nopea tuli', spread: 'Hajaammus', shield: 'Suojakehä' };
/** Colour of the burst when an enemy is destroyed. */
const BURST: Record<EnemyKind, number> = { ghost: 0xdfe9ff, bat: 0x9a7cc8, pumpkin: 0xff9a2e, skeleton: 0xece4d0, ark: COLORS.gold, grail: COLORS.gold };

const BAR_X = 330;
const BAR_W = 470;
const BAR_Y = 34;
const SHOT_SPEED = C.shotSpeed;
const BOLT_RADIUS = 7;

type Phase = 'playing' | 'interlude' | 'boss' | 'won' | 'dead';

interface Enemy {
  spawn: Spawn;
  hp: number;
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  shootIn: number;
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

/** Reuses images of one kind (bullets come and go many times a second). */
class ImagePool {
  private free: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly spec: AssetSpec,
    private readonly depth: number,
  ) {}

  take(x: number, y: number): Phaser.GameObjects.Image {
    const image = this.free.pop() ?? addAsset(this.scene, this.spec, x, y).setDepth(this.depth);
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
  private enemies: Enemy[] = [];
  private shots: Bullet[] = [];
  private bullets: Bullet[] = [];
  private items: Item[] = [];
  private popeX = W / 2;
  private health: number = C.maxHealth;
  private invulnerable = 0;
  private weaponLevel = 1;
  private boosts: Record<BoostKind, number> = { rapid: 0, spread: 0, shield: 0 };
  private fireCooldown = 0;
  private killed = 0;
  private bossDefeated = false;
  private bossAge = 0;
  private bossHealth: number = C.bossHealth;
  private bossAttackIn = 0;
  private bossAttacks = 0;
  private interludeLeft = 0;
  private finished = false;
  private random!: Phaser.Math.RandomDataGenerator;

  private keys!: HeldKeys;
  private bg!: Phaser.GameObjects.TileSprite;
  private pope!: Phaser.GameObjects.Image;
  private shield!: Phaser.GameObjects.Image;
  private boss: Phaser.GameObjects.Image | null = null;
  private bolts!: ImagePool;
  private fireballs!: ImagePool;
  private bones!: ImagePool;
  private barFill!: Phaser.GameObjects.Graphics;
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
    this.enemies = [];
    this.shots = [];
    this.bullets = [];
    this.items = [];
    this.popeX = W / 2;
    this.health = C.maxHealth;
    this.invulnerable = 0;
    this.weaponLevel = 1;
    this.boosts = { rapid: 0, spread: 0, shield: 0 };
    this.fireCooldown = 0.4;
    this.killed = 0;
    this.bossDefeated = false;
    this.bossAge = 0;
    this.bossHealth = C.bossHealth;
    this.bossAttackIn = 0;
    this.bossAttacks = 0;
    this.interludeLeft = 0;
    this.finished = false;
    this.boss = null;
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
    this.bg.setTileScale(W / frame.width, W / frame.width);

    this.bolts = new ImagePool(this, BOLT, 3);
    this.fireballs = new ImagePool(this, FIREBALL, 6);
    this.bones = new ImagePool(this, BONE, 6);
    this.shield = addAsset(this, SHIELD, this.popeX, POPE_Y).setDepth(5).setVisible(false);
    this.pope = addAsset(this, POPE, this.popeX, POPE_Y).setDepth(4);

    this.buildHud();
    addKeyHints(this, [
      ['←→', 'Liiku'],
      ['Esc', 'Tauko'],
    ]);
    this.keys = heldKeys(this, ['ArrowLeft', 'ArrowRight']);
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
      popeX: Math.round(this.popeX),
    };
  }

  /** Test helper: jump ahead in the attempt. Enemies skipped this way are missed. */
  debugSkip(seconds: number): void {
    for (const enemy of [...this.enemies]) this.removeEnemy(enemy);
    this.playTime = Phaser.Math.Clamp(seconds, 0, C.bossAfterSeconds);
    while (this.nextSpawn < SCHEDULE.length && SCHEDULE[this.nextSpawn].t < this.playTime) this.nextSpawn++;
  }

  /** Test helper: the pope takes n hits. */
  debugHurt(n: number): void {
    for (let i = 0; i < n && this.phase !== 'dead'; i++) {
      this.invulnerable = 0;
      this.boosts.shield = 0;
      this.hurt();
    }
  }

  /** Test helper: set the Devil's health. */
  debugBossHealth(health: number): void {
    this.bossHealth = health;
  }

  private points(): number {
    return scoreOf(this.killed, this.playTime, this.bossDefeated);
  }

  // ---------------------------------------------------------------- pope

  private movePope(dt: number): void {
    const dir = (this.keys.isDown('ArrowRight') ? 1 : 0) - (this.keys.isDown('ArrowLeft') ? 1 : 0);
    this.popeX = Phaser.Math.Clamp(this.popeX + dir * C.popeSpeed * dt, POPE_MIN_X, POPE_MAX_X);
    this.pope.setX(this.popeX).setAngle(dir * 6);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.pope.setAlpha(this.invulnerable > 0 && Math.floor(this.invulnerable * 11) % 2 === 0 ? 0.35 : 1);
    for (const kind of Object.keys(this.boosts) as BoostKind[]) this.boosts[kind] = Math.max(0, this.boosts[kind] - dt);
    const shielded = this.boosts.shield > 0;
    this.shield.setVisible(shielded).setPosition(this.popeX, POPE_Y);
    if (shielded) this.shield.setAlpha(this.boosts.shield < 1.5 && Math.floor(this.boosts.shield * 8) % 2 === 0 ? 0.3 : 0.9);
  }

  private fire(dt: number): void {
    this.fireCooldown -= dt;
    if (this.fireCooldown > 0) return;
    const interval = fireInterval(this.weaponLevel, this.boosts.rapid > 0);
    this.fireCooldown = Math.max(this.fireCooldown + interval, interval * 0.5);
    for (const barrel of weaponPattern(this.weaponLevel, this.boosts.spread > 0)) {
      const angle = Phaser.Math.DegToRad(barrel.angle);
      const sprite = this.bolts.take(this.popeX + barrel.dx, POPE_Y - 56).setRotation(angle);
      this.shots.push({
        sprite,
        pool: this.bolts,
        x: this.popeX + barrel.dx,
        y: POPE_Y - 56,
        vx: Math.sin(angle) * SHOT_SPEED,
        vy: -Math.cos(angle) * SHOT_SPEED,
        radius: BOLT_RADIUS,
        spin: 0,
      });
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
    this.burst(this.popeX, POPE_Y, 0xffffff, 16);
    this.tweens.add({ targets: this.pope, angle: 90, alpha: 0.3, y: POPE_Y + 20, duration: 700, ease: 'Quad.In' });
    this.shield.setVisible(false);
    this.time.delayedCall(1800, () => this.end());
  }

  private end(): void {
    if (this.finished) return;
    this.finished = true;
    this.ctx.finish(this.points());
  }

  // ---------------------------------------------------------------- enemies

  private spawnDue(): void {
    while (this.nextSpawn < SCHEDULE.length && SCHEDULE[this.nextSpawn].t <= this.playTime) {
      const spawn = SCHEDULE[this.nextSpawn++];
      const pos = enemyPosition(spawn, this.playTime - spawn.t) ?? { x: spawn.x, y: -60 };
      const sprite = addAsset(this, ENEMY_ART[spawn.kind], pos.x, pos.y).setDepth(SPECIALS.has(spawn.kind) ? 2 : 3);
      const gap = enemyShotGap(spawn.t);
      const shootIn = spawn.kind === 'skeleton' ? gap * (2 + this.random.frac() * 5) : gap * (0.6 + this.random.frac() * 0.6);
      this.enemies.push({ spawn, hp: ENEMY_HP[spawn.kind], sprite, x: pos.x, y: pos.y, shootIn });
      if (SPECIALS.has(spawn.kind)) this.ctx.sfx.tone({ freq: 660, slideTo: 990, duration: 0.5, type: 'sine', volume: 0.15 });
    }
  }

  private moveEnemies(dt: number): void {
    for (const enemy of [...this.enemies]) {
      const pos = enemyPosition(enemy.spawn, this.playTime - enemy.spawn.t);
      if (!pos) {
        this.removeEnemy(enemy);
        continue;
      }
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.sprite.setPosition(pos.x, pos.y);
      if (this.phase !== 'playing' || !SHOOTERS.has(enemy.spawn.kind) || pos.y < 60 || pos.y > 470) continue;
      enemy.shootIn -= dt;
      if (enemy.shootIn > 0) continue;
      const gap = enemyShotGap(this.playTime);
      enemy.shootIn = enemy.spawn.kind === 'skeleton' ? gap * (2.5 + this.random.frac() * 3) : gap * (0.7 + this.random.frac() * 0.6);
      this.enemyShoot(enemy);
    }
  }

  private enemyShoot(enemy: Enemy): void {
    const speed = enemyShotSpeed(this.playTime);
    if (enemy.spawn.kind === 'pumpkin') {
      // A fireball aimed at the pope
      const angle = Math.atan2(POPE_Y - enemy.y, this.popeX - enemy.x);
      this.addBullet(this.fireballs, enemy.x, enemy.y + 20, Math.cos(angle) * speed, Math.sin(angle) * speed, 11, 0);
    } else {
      // A bone thrown down, a little towards the pope
      const vx = Phaser.Math.Clamp((this.popeX - enemy.x) * 0.25, -90, 90);
      this.addBullet(this.bones, enemy.x, enemy.y + 20, vx, speed * 0.9, 10, 9);
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
    const { kind, drop } = enemy.spawn;
    this.killed += 1;
    this.burst(enemy.x, enemy.y, BURST[kind], SPECIALS.has(kind) ? 18 : 8);
    this.ctx.sfx.tone({ freq: 520, slideTo: 240, duration: 0.12, type: 'triangle', volume: 0.16 });
    if (drop) this.items.push({ kind: drop, sprite: addAsset(this, BOOST_ART[drop], enemy.x, enemy.y).setDepth(2), x: enemy.x, y: enemy.y });
    if (SPECIALS.has(kind)) {
      const before = this.weaponLevel;
      this.weaponLevel = Math.min(C.maxWeaponLevel, this.weaponLevel + 1);
      const name = kind === 'ark' ? 'Liitonarkku' : 'Pyhä malja';
      this.floatText(enemy.x, enemy.y, this.weaponLevel > before ? `${name}: ase paranee!` : name, CSS.gold);
      this.ctx.sfx.play('success');
    }
    this.removeEnemy(enemy);
  }

  // ---------------------------------------------------------------- bullets, items and hits

  private moveBullets(list: Bullet[], dt: number): void {
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      if (b.spin) b.sprite.rotation += b.spin * dt;
      if (b.y < -40 || b.y > H + 40 || b.x < -40 || b.x > W + 40) {
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
      item.y += 130 * dt;
      item.sprite.setPosition(item.x, item.y);
      if (item.y > H + 30) this.removeItem(item);
    }
  }

  private removeItem(item: Item): void {
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
    item.sprite.destroy();
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
      if (!used && this.boss && this.phase === 'boss' && this.bossAge > 1.5 && hitsBoss(this.boss.x, this.boss.y, shot.x, shot.y)) {
        this.hitBoss();
        used = true;
      }
      if (used) {
        shot.pool.give(shot.sprite);
        this.shots.splice(i, 1);
      }
    }
    if (this.phase === 'dead' || this.phase === 'won') return;
    // Enemy bullets and enemies against the pope
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!touchesPope(this.popeX, b.x, b.y, b.radius)) continue;
      if (this.invulnerable > 0 && this.boosts.shield <= 0) continue;
      b.pool.give(b.sprite);
      this.bullets.splice(i, 1);
      this.hurt();
    }
    for (const enemy of [...this.enemies]) {
      if (!touchesPope(this.popeX, enemy.x, enemy.y, ENEMY_RADIUS[enemy.spawn.kind] * 0.8)) continue;
      if (this.boosts.shield > 0) {
        this.kill(enemy); // the shield smites whatever touches it
      } else if (this.invulnerable <= 0) {
        this.burst(enemy.x, enemy.y, BURST[enemy.spawn.kind], 8);
        this.removeEnemy(enemy);
        this.hurt();
      }
    }
    // Boosts
    for (const item of [...this.items]) {
      if (!touchesPope(this.popeX, item.x, item.y, 22)) continue;
      this.boosts[item.kind] = item.kind === 'shield' ? C.shieldSeconds : C.boostSeconds;
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
    const pos = bossPosition(0, 1);
    this.boss = addAsset(this, DEVIL, pos.x, pos.y).setDepth(3);
    this.ctx.sfx.tone({ freq: 170, slideTo: 80, duration: 1.1, type: 'sawtooth', volume: 0.2 });
    this.ctx.sfx.tone({ freq: 120, slideTo: 60, duration: 1.1, type: 'square', volume: 0.1, delay: 0.25 });
  }

  private updateBoss(dt: number): void {
    if (!this.boss) return;
    this.bossAge += dt;
    const share = this.bossHealth / C.bossHealth;
    const pos = bossPosition(this.bossAge, share);
    this.boss.setPosition(pos.x, pos.y);
    this.bossAttackIn -= dt;
    if (this.bossAttackIn > 0) return;
    this.bossAttackIn = bossAttackGap(share);
    this.bossAttack(pos.x, pos.y, share);
  }

  private bossAttack(x: number, y: number, share: number): void {
    const speed = share > 0.6 ? 260 : share > 0.25 ? 300 : 330;
    const pattern = this.bossAttacks++ % 3;
    if (pattern === 0 || (pattern === 2 && share > 0.6)) {
      // A fan of fireballs
      const count = share > 0.6 ? 5 : share > 0.25 ? 7 : 9;
      for (let i = 0; i < count; i++) {
        const angle = Phaser.Math.DegToRad(90 + (i - (count - 1) / 2) * (100 / (count - 1)));
        this.addBullet(this.fireballs, x, y + 70, Math.cos(angle) * speed, Math.sin(angle) * speed, 11, 0);
      }
    } else if (pattern === 1) {
      // Fireballs aimed at the pope
      const count = share > 0.6 ? 1 : share > 0.25 ? 2 : 3;
      const aim = Math.atan2(POPE_Y - y, this.popeX - x);
      for (let i = 0; i < count; i++) {
        const angle = aim + (i - (count - 1) / 2) * 0.16;
        this.addBullet(this.fireballs, x, y + 60, Math.cos(angle) * speed * 1.15, Math.sin(angle) * speed * 1.15, 11, 0);
      }
    } else {
      // Fire rains from the sky
      for (let i = 0; i < 6; i++) this.addBullet(this.fireballs, 80 + this.random.frac() * (W - 160), -20 - i * 40, 0, speed * 0.9, 11, 0);
    }
    this.ctx.sfx.noise({ duration: 0.2, volume: 0.12, filterFreq: 500 });
  }

  private hitBoss(): void {
    if (!this.boss || this.phase !== 'boss') return;
    this.bossHealth = Math.max(0, this.bossHealth - 1);
    this.boss.setTintFill(0xffe0a0);
    this.time.delayedCall(50, () => this.boss?.active && this.boss.clearTint());
    if (this.bossHealth > 0) return;

    this.phase = 'won';
    this.bossDefeated = true;
    this.clearBullets(this.bullets);
    const boss = this.boss;
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 220, () => this.burst(boss.x + Phaser.Math.Between(-90, 90), boss.y + Phaser.Math.Between(-70, 70), i % 2 ? COLORS.orange : COLORS.red, 14));
    }
    this.tweens.add({ targets: boss, alpha: 0, scale: boss.scale * 1.3, angle: 12, duration: 1400, delay: 400 });
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
      const dist = 30 + Math.random() * 30;
      const dot = this.add.circle(x, y, 3 + Math.random() * 4, color, 1).setDepth(7);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 380 + Math.random() * 200,
        ease: 'Quad.Out',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private floatText(x: number, y: number, message: string, color: string): void {
    const text = this.add
      .text(Phaser.Math.Clamp(x, 200, W - 200), y, message, { ...TEXT.bodyBold, fontSize: '28px', color })
      .setOrigin(0.5)
      .setDepth(17);
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
    const parts = [`Ase ${this.weaponLevel}/${C.maxWeaponLevel}`];
    for (const kind of Object.keys(this.boosts) as BoostKind[]) {
      if (this.boosts[kind] > 0) parts.push(`${BOOST_NAMES[kind]} ${Math.ceil(this.boosts[kind])} s`);
    }
    const status = parts.join('   ');
    if (status !== this.shownStatus) {
      this.shownStatus = status;
      this.statusText.setText(status);
    }
  }
}
