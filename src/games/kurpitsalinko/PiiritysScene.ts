import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { heldKeys, onChar, type HeldKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { applyCameraZoom, H, W, ZOOM } from '../../ui/screen';
import { COLORS, CSS, TEXT } from '../../ui/theme';
import { assetKey, type GameContext, type GameSceneData } from '../types';
import { ARM, BARREL, CATAPULT, CRYPT, EARTH, PROJECTILES, SKELETON, SKY, STONE, WARRIOR, WOOD } from './assets';
import { LEVELS } from './levels';
import { Battle, powerAt, score, SKELETON_H, totalSkeletons, WEAPONS, type BattleEvent, type Weapon } from './logic';
import type { Material, Shape } from './terrain';

const C = CONFIG.kurpitsalinko;
const LW = C.levelWidth;
const LH = C.levelHeight;
const TERRAIN_KEY = 'piiritys-maasto';
/** Zoom that shows the whole level while aiming. */
const OVERVIEW = W / LW;
/** The sky goes this far above the level, so high pumpkins and the zoomed-out view show sky. */
const SKY_ABOVE = 420;
/** The bottom of the level stays above the weapon bar (screen y). */
const LEVEL_BOTTOM_ON_SCREEN = 590;
const SHORT_NAMES: Record<Weapon, string> = { pumpkin: 'Kurpitsa', cluster: 'Rypäle', homing: 'Ohjautuva', beam: 'Säde', bomb: 'Pommi' };
const PROJECTILE_FRAME: Record<string, number> = { pumpkin: 0, cluster: 1, homing: 2, bomb: 3, bomblet: 4 };
const MATERIAL_ART: Record<Material, typeof EARTH> = { earth: EARTH, stone: STONE, wood: WOOD };

type Phase = 'intro' | 'aim' | 'flight' | 'walk' | 'levelDone' | 'won';

/**
 * Kurpitsalinko "Piiritys": the catapult throws pumpkins at the skeletons of
 * five castle levels. One attempt (all five levels); the core counts attempts.
 */
export class PiiritysScene extends Phaser.Scene {
  private ctx!: GameContext;
  private phase: Phase = 'intro';
  private phaseTime = 0;
  private levelIndex = 0;
  private battle!: Battle;
  private shots = 0;
  private angle: number = C.startAngle;
  private charging = false;
  private chargeTime = 0;
  private weapon: Weapon = 'pumpkin';
  /** Special weapons left in this level (Pasi 22.10.: each once a level). */
  private ammo: Record<Weapon, number> = { pumpkin: Infinity, cluster: 1, homing: 1, beam: 1, bomb: 1 };
  private previousTrail: Array<[number, number]> = [];
  private finished = false;
  private keys!: HeldKeys;
  private camX = 0;
  private camY = 0;
  private camZoom = OVERVIEW;
  private beams: Array<{ x0: number; y0: number; x1: number; y1: number; width: number; t: number }> = [];
  private bursts: Array<{ x: number; y: number; r: number; t: number; color: number }> = [];

  // Display
  private worldLayer!: Phaser.GameObjects.Layer;
  private hudLayer!: Phaser.GameObjects.Layer;
  private hudCam!: Phaser.Cameras.Scene2D.Camera;
  private sky!: Phaser.GameObjects.Image;
  private terrainTexture!: Phaser.Textures.CanvasTexture;
  private water!: Phaser.GameObjects.Graphics;
  private catapult!: Phaser.GameObjects.Image;
  private arm!: Phaser.GameObjects.Image;
  private warrior!: Phaser.GameObjects.Image;
  private aimLine!: Phaser.GameObjects.Graphics;
  private trail!: Phaser.GameObjects.Graphics;
  private effects!: Phaser.GameObjects.Graphics;
  private skeletonImages = new Map<number, Phaser.GameObjects.Image>();
  private barrelImages = new Map<number, Phaser.GameObjects.Image>();
  private projectileImages = new Map<number, Phaser.GameObjects.Image>();
  private levelText!: Phaser.GameObjects.Text;
  private shotText!: Phaser.GameObjects.Text;
  private leftText!: Phaser.GameObjects.Text;
  private aimText!: Phaser.GameObjects.Text;
  private powerBar!: Phaser.GameObjects.Graphics;
  private weaponBar!: Phaser.GameObjects.Graphics;
  private weaponTexts: Phaser.GameObjects.Text[] = [];
  private weaponIcons: Phaser.GameObjects.Image[] = [];
  private message!: Phaser.GameObjects.Text;
  private subMessage!: Phaser.GameObjects.Text;

  constructor() {
    super('Kurpitsalinko');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.phase = 'intro';
    this.phaseTime = 0;
    this.levelIndex = 0;
    this.shots = 0;
    this.angle = C.startAngle;
    this.charging = false;
    this.chargeTime = 0;
    this.weapon = 'pumpkin';
    this.previousTrail = [];
    this.finished = false;
    this.camZoom = OVERVIEW;
    this.beams = [];
    this.bursts = [];
    this.skeletonImages = new Map();
    this.barrelImages = new Map();
    this.projectileImages = new Map();
    this.weaponTexts = [];
    this.weaponIcons = [];
  }

  create(): void {
    this.worldLayer = this.add.layer();
    this.hudLayer = this.add.layer();
    this.hudCam = this.cameras.add(0, 0, undefined, undefined, false, 'hud');
    applyCameraZoom(this.hudCam);
    this.hudCam.ignore(this.worldLayer);
    this.cameras.main.ignore(this.hudLayer);

    this.sky = this.inWorld(addAsset(this, SKY, LW / 2, (LH - SKY_ABOVE) / 2, { fit: 'stretch', width: LW, height: LH + SKY_ABOVE }).setDepth(-10));
    const existing = this.textures.exists(TERRAIN_KEY) ? (this.textures.get(TERRAIN_KEY) as Phaser.Textures.CanvasTexture) : null;
    this.terrainTexture = existing ?? this.textures.createCanvas(TERRAIN_KEY, Math.round(LW * ZOOM), Math.round(LH * ZOOM))!;
    this.inWorld(this.add.image(0, 0, TERRAIN_KEY).setOrigin(0, 0).setDisplaySize(LW, LH).setDepth(0));
    this.water = this.inWorld(this.add.graphics().setDepth(1));
    this.trail = this.inWorld(this.add.graphics().setDepth(2));
    this.warrior = this.inWorld(addAsset(this, WARRIOR, 0, 0, { origin: [0.5, 1] }).setDepth(4));
    this.arm = this.inWorld(addAsset(this, ARM, 0, 0, { origin: [0.05, 0.5] }).setDepth(5));
    this.catapult = this.inWorld(addAsset(this, CATAPULT, 0, 0, { origin: [0.5, 1] }).setDepth(6));
    this.aimLine = this.inWorld(this.add.graphics().setDepth(7));
    this.effects = this.inWorld(this.add.graphics().setDepth(20));

    this.buildHud();
    this.keys = heldKeys(this, ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
    onChar(this, (char) => {
      const n = Number(char);
      if (Number.isInteger(n) && n >= 1 && n <= WEAPONS.length) this.choose(WEAPONS[n - 1]);
    });
    this.startLevel(0);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    this.phaseTime += dt;
    this.tick(dt);
    if (this.finished) return;
    this.draw(dt);
  }

  // ---------------------------------------------------------------- test hooks

  getTestState(): unknown {
    const b = this.battle;
    return {
      phase: this.phase,
      level: this.levelIndex,
      shots: this.shots,
      left: b.skeletonsLeft(),
      angle: Math.round(this.angle * 10) / 10,
      power: Math.round(this.power() * 100) / 100,
      charging: this.charging,
      weapon: this.weapon,
      ammo: { ...this.ammo, pumpkin: -1 },
      projectiles: b.projectiles.length,
      skeletons: b.skeletons.map((s) => ({ x: Math.round(s.x), y: Math.round(s.y), alive: s.alive })),
      points: this.points(),
    };
  }

  /** Test helper: fire at once (counts as a shot). */
  debugFire(weapon: Weapon, angle: number, power: number): void {
    if (this.phase === 'intro') this.phase = 'aim';
    this.weapon = weapon;
    this.angle = angle;
    this.fire(power);
  }

  /** Test helper: every skeleton of this level falls (no shots). */
  debugClearLevel(): void {
    for (const s of this.battle.skeletons) s.alive = false;
  }

  // ---------------------------------------------------------------- levels

  private startLevel(index: number): void {
    this.levelIndex = index;
    this.battle = new Battle(index);
    this.ammo = { pumpkin: Infinity, cluster: 1, homing: 1, beam: 1, bomb: 1 };
    this.weapon = 'pumpkin';
    this.previousTrail = [];
    this.charging = false;
    for (const img of [...this.skeletonImages.values(), ...this.barrelImages.values(), ...this.projectileImages.values()]) {
      this.tweens.killTweensOf(img);
      img.destroy();
    }
    this.skeletonImages.clear();
    this.barrelImages.clear();
    this.projectileImages.clear();
    const level = this.battle.level;
    const crypt = index === LEVELS.length - 1;
    this.sky.setTexture(assetKey(crypt ? CRYPT : SKY)).setDisplaySize(LW, LH + SKY_ABOVE);
    this.paintTerrain(level.shapes);

    const ground = this.battle.terrain.surfaceBelow(level.catapultX, 0) ?? LH - 100;
    this.catapult.setPosition(level.catapultX, ground);
    this.warrior.setPosition(level.catapultX - 70, ground);
    this.arm.setPosition(level.catapultX, ground - 70);
    for (const s of this.battle.skeletons) {
      this.skeletonImages.set(s.id, this.inWorld(addAsset(this, SKELETON, s.x, s.y, { origin: [0.5, 1], frame: 0 }).setDepth(8).setFlipX(false)));
    }
    for (const b of this.battle.barrels) {
      this.barrelImages.set(b.id, this.inWorld(addAsset(this, BARREL, b.x, b.y, { origin: [0.5, 1] }).setDepth(8)));
    }
    this.drawWater();
    this.phase = 'intro';
    this.phaseTime = 0;
    this.showMessage(`Kenttä ${index + 1}/${LEVELS.length}`, level.name);
    this.camZoom = OVERVIEW;
    this.camX = LW / 2;
    this.camY = LH + (H - LEVEL_BOTTOM_ON_SCREEN) / OVERVIEW - H / OVERVIEW / 2;
    this.refreshHud();
  }

  /** Paint the ground of the level from its shapes, each material with its pattern. */
  private paintTerrain(shapes: readonly Shape[]): void {
    const tex = this.terrainTexture;
    const ctx = tex.context;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, tex.width, tex.height);
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    for (const shape of shapes) {
      const art = MATERIAL_ART[shape.material];
      const source = this.textures.get(assetKey(art)).getSourceImage() as CanvasImageSource & { width: number };
      const pattern = ctx.createPattern(source, 'repeat');
      if (pattern) pattern.setTransform(new DOMMatrix().scale(art.width / source.width));
      ctx.beginPath();
      this.shapePath(ctx, shape);
      ctx.fillStyle = pattern ?? '#4a3326';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1a1124';
      ctx.stroke();
    }
    ctx.restore();
    tex.refresh();
  }

  private shapePath(ctx: CanvasRenderingContext2D, shape: Shape): void {
    if (shape.kind === 'rect') ctx.rect(shape.x, shape.y, shape.w, shape.h);
    else {
      shape.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
    }
  }

  /** Blow the same hole in the picture as in the ground (wood burns further). */
  private carvePicture(x: number, y: number, r: number): void {
    const ctx = this.terrainTexture.context;
    ctx.save();
    ctx.setTransform(ZOOM, 0, 0, ZOOM, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    const wood = this.battle.level.shapes.filter((s) => s.material === 'wood');
    if (wood.length > 0) {
      ctx.save();
      ctx.beginPath();
      for (const s of wood) this.shapePath(ctx, s);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(x, y, r * C.woodBlastFactor, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Scorched edge on what is left.
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(20, 10, 20, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.terrainTexture.refresh();
  }

  private carveBeam(x0: number, y0: number, x1: number, y1: number, width: number): void {
    const ctx = this.terrainTexture.context;
    ctx.save();
    ctx.setTransform(ZOOM, 0, 0, ZOOM, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = 'rgba(40, 20, 0, 0.5)';
    ctx.lineWidth = width + 12;
    ctx.stroke();
    ctx.restore();
    this.terrainTexture.refresh();
  }

  private drawWater(): void {
    const g = this.water.clear();
    for (const w of this.battle.level.water) {
      g.fillStyle(0x1f3a5a, 0.85).fillRect(w.x0, w.y, w.x1 - w.x0, LH - w.y);
      g.lineStyle(3, 0x6aa0c8, 0.8);
      for (let x = w.x0; x < w.x1; x += 40) g.lineBetween(x + 6, w.y + 6, x + 26, w.y + 6);
    }
  }

  // ---------------------------------------------------------------- the turn

  private tick(dt: number): void {
    switch (this.phase) {
      case 'intro':
        if (this.phaseTime > 1.4) {
          this.phase = 'aim';
          this.hideMessage();
          // A key held during the title does not fire at once.
          this.keys.takePress(' ');
        }
        break;
      case 'aim':
        this.aim(dt);
        break;
      case 'flight':
        this.battle.step(dt);
        this.handleEvents();
        if (!this.battle.busy()) {
          this.previousTrail = this.battle.trail;
          if (this.battle.skeletonsLeft() === 0) this.levelCleared();
          else {
            this.battle.startWalks();
            this.phase = 'walk';
            this.phaseTime = 0;
          }
        }
        break;
      case 'walk':
        this.battle.step(dt);
        this.handleEvents();
        if (!this.battle.busy()) {
          if (this.battle.skeletonsLeft() === 0) this.levelCleared();
          else {
            this.phase = 'aim';
            this.keys.takePress(' ');
          }
        }
        break;
      case 'levelDone':
        if (this.phaseTime > 1.8) {
          if (this.levelIndex + 1 < LEVELS.length) this.startLevel(this.levelIndex + 1);
          else this.allCleared();
        }
        break;
      case 'won':
        if (this.phaseTime > 2.6) this.end();
        break;
    }
    // A test or a quick shot may have cleared the level while aiming.
    if (this.phase === 'aim' && this.battle.skeletonsLeft() === 0) this.levelCleared();
  }

  private aim(dt: number): void {
    const k = this.keys;
    const turn = (k.isDown('ArrowUp') ? 1 : 0) - (k.isDown('ArrowDown') ? 1 : 0);
    const fine = (k.isDown('ArrowLeft') ? 1 : 0) - (k.isDown('ArrowRight') ? 1 : 0);
    this.angle = Phaser.Math.Clamp(this.angle + turn * C.angleSpeed * dt + fine * C.fineAngleSpeed * dt, C.angleMin, C.angleMax);
    const tapped = k.takePress(' ');
    if (k.isDown(' ')) {
      if (!this.charging) {
        this.charging = true;
        this.chargeTime = 0;
      } else this.chargeTime += dt;
    } else if (this.charging) {
      this.fire(this.power());
    } else if (tapped) {
      // A tap too quick for a single frame still fires, at the lowest power.
      this.fire(0);
    }
  }

  private power(): number {
    return this.charging ? powerAt(this.chargeTime) : 0;
  }

  private choose(weapon: Weapon): void {
    if (this.phase !== 'aim' && this.phase !== 'intro') return;
    if (this.ammo[weapon] <= 0) {
      this.ctx.sfx.play('error');
      return;
    }
    this.weapon = weapon;
    this.ctx.sfx.play('move');
    this.refreshHud();
  }

  private fire(power: number): void {
    this.charging = false;
    this.chargeTime = 0;
    const weapon = this.ammo[this.weapon] > 0 ? this.weapon : 'pumpkin';
    if (weapon !== 'pumpkin') this.ammo[weapon]--;
    this.shots++;
    this.battle.fire(weapon, this.angle, power);
    if (this.ammo[this.weapon] <= 0) this.weapon = 'pumpkin';
    this.phase = 'flight';
    this.phaseTime = 0;
    const sfx = this.ctx.sfx;
    if (weapon === 'beam') {
      sfx.tone({ freq: 180, slideTo: 1400, duration: 0.6, type: 'sawtooth', volume: 0.08 });
    } else {
      sfx.noise({ duration: 0.18, volume: 0.12, filterFreq: 400, filterType: 'lowpass' });
      sfx.noise({ duration: 0.35, volume: 0.05, filterFreq: 1800, filterType: 'bandpass', delay: 0.05 });
    }
    // The arm swings forward.
    this.tweens.killTweensOf(this.arm);
    this.arm.setAngle(30);
    this.tweens.add({ targets: this.arm, angle: -this.angle - 20, duration: 140, ease: 'Back.Out' });
    this.handleEvents();
    this.refreshHud();
  }

  private handleEvents(): void {
    const sfx = this.ctx.sfx;
    const events = this.battle.takeEvents();
    for (const e of events) this.showEvent(e, sfx);
    if (events.length > 0) this.refreshHud();
  }

  private showEvent(e: BattleEvent, sfx: GameContext['sfx']): void {
    switch (e.type) {
      case 'blast': {
        this.carvePicture(e.x, e.y, e.r);
        this.bursts.push({ x: e.x, y: e.y, r: e.r, t: 0, color: e.barrel ? 0xffd04a : 0xff8a1f });
        const big = e.r >= C.barrelRadius;
        sfx.noise({ duration: big ? 0.7 : 0.4, volume: big ? 0.2 : 0.14, filterFreq: big ? 260 : 500, filterType: 'lowpass' });
        this.cameras.main.shake(big ? 260 : 140, big ? 0.008 : 0.004);
        break;
      }
      case 'beam':
        this.carveBeam(e.x0, e.y0, e.x1, e.y1, e.width);
        this.beams.push({ ...e, t: 0 });
        break;
      case 'kill': {
        const img = this.skeletonImages.get(e.id);
        if (img) {
          this.skeletonImages.delete(e.id);
          this.boneBurst(img.x, img.y - SKELETON_H / 2);
          this.tweens.add({ targets: img, alpha: 0, angle: 90, duration: 300, onComplete: () => img.destroy() });
        }
        sfx.noise({ duration: 0.25, volume: 0.1, filterFreq: 3000, filterType: 'highpass', delay: 0.05 });
        sfx.tone({ freq: 700, slideTo: 300, duration: 0.25, type: 'triangle', volume: 0.06 });
        break;
      }
      case 'splash':
        sfx.noise({ duration: 0.4, volume: 0.1, filterFreq: 900, filterType: 'bandpass' });
        this.bursts.push({ x: e.x, y: e.y, r: 30, t: 0, color: 0x9ad0f0 });
        break;
      case 'bomblets':
        sfx.tone({ freq: 500, slideTo: 900, duration: 0.15, type: 'square', volume: 0.05 });
        break;
      case 'miss':
        break;
    }
  }

  private levelCleared(): void {
    this.phase = 'levelDone';
    this.phaseTime = 0;
    this.charging = false;
    this.ctx.sfx.play('success');
    this.showMessage('Kenttä tyhjä!', this.levelIndex + 1 < LEVELS.length ? `Seuraavaksi: ${LEVELS[this.levelIndex + 1].name}` : '');
  }

  private allCleared(): void {
    this.phase = 'won';
    this.phaseTime = 0;
    this.ctx.sfx.play('fanfare');
    this.showMessage('Kaikki luurangot kaatuivat!', `${this.shots} laukausta`);
  }

  private points(): number {
    return score(totalSkeletons(), Math.max(this.shots, 1));
  }

  private end(): void {
    if (this.finished) return;
    this.finished = true;
    this.ctx.finish(this.points());
  }

  // ---------------------------------------------------------------- drawing

  private draw(dt: number): void {
    const b = this.battle;
    // Skeletons and barrels
    for (const s of b.skeletons) {
      const img = this.skeletonImages.get(s.id);
      if (!img || !s.alive) continue;
      const walking = s.walkLeft > 0 && s.fallFrom === null;
      img.setPosition(s.x, s.y).setFrame(walking ? 1 + (Math.floor(this.time.now / 160) % 2) : 0).setFlipX(walking && s.dir > 0);
      img.setAngle(s.fallFrom !== null ? Math.sin(this.time.now / 60) * 12 : 0);
    }
    for (const barrel of b.barrels) {
      const img = this.barrelImages.get(barrel.id);
      if (!img) continue;
      if (!barrel.alive) {
        this.barrelImages.delete(barrel.id);
        img.destroy();
        continue;
      }
      img.setPosition(barrel.x, barrel.y);
      img.setTint(barrel.fuse !== null && Math.floor(this.time.now / 60) % 2 === 0 ? 0xffd04a : 0xffffff);
    }
    // Projectiles
    const seen = new Set<number>();
    for (const p of b.projectiles) {
      seen.add(p.id);
      let img = this.projectileImages.get(p.id);
      if (!img) {
        img = this.inWorld(addAsset(this, PROJECTILES, p.x, p.y, { frame: PROJECTILE_FRAME[p.kind] }).setDepth(9));
        this.projectileImages.set(p.id, img);
      }
      img.setPosition(p.x, p.y).setRotation(p.kind === 'homing' ? Math.atan2(p.vy, p.vx) : p.age * 8);
    }
    for (const [id, img] of this.projectileImages) {
      if (!seen.has(id)) {
        img.destroy();
        this.projectileImages.delete(id);
      }
    }

    // Aim line, previous shot and effects
    const launch = b.launch;
    const aiming = this.phase === 'aim';
    this.aimLine.clear();
    if (aiming) {
      const a = (this.angle * Math.PI) / 180;
      const len = 90;
      this.aimLine.lineStyle(4, 0xffd04a, 0.9).lineBetween(launch.x, launch.y, launch.x + Math.cos(a) * len, launch.y - Math.sin(a) * len);
      this.aimLine.fillStyle(0xffd04a, 1).fillCircle(launch.x + Math.cos(a) * len, launch.y - Math.sin(a) * len, 5);
    }
    if (!this.charging) this.arm.setAngle(aiming ? -this.angle - 20 : this.arm.angle);
    else this.arm.setAngle(-this.angle + 40 * this.power());
    this.trail.clear();
    const dots = this.phase === 'flight' ? b.trail : this.previousTrail;
    const alpha = this.phase === 'flight' ? 0.55 : 0.4;
    let last: [number, number] | null = null;
    for (const point of dots) {
      if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < 18) continue;
      this.trail.fillStyle(0xffe0a0, alpha).fillCircle(point[0], point[1], 3);
      last = point;
    }

    const g = this.effects.clear();
    for (const beam of this.beams) {
      beam.t += dt;
      const fade = Math.max(0, 1 - beam.t / C.beamSeconds);
      g.lineStyle(beam.width + 18, 0xff8a1f, 0.35 * fade).lineBetween(beam.x0, beam.y0, beam.x1, beam.y1);
      g.lineStyle(beam.width, 0xffd04a, 0.85 * fade).lineBetween(beam.x0, beam.y0, beam.x1, beam.y1);
      g.lineStyle(beam.width / 3, 0xffffff, fade).lineBetween(beam.x0, beam.y0, beam.x1, beam.y1);
    }
    this.beams = this.beams.filter((beam) => beam.t < C.beamSeconds);
    for (const burst of this.bursts) {
      burst.t += dt;
      const u = burst.t / 0.45;
      g.fillStyle(burst.color, Math.max(0, 0.7 * (1 - u))).fillCircle(burst.x, burst.y, burst.r * (0.5 + u * 0.7));
      g.fillStyle(0xfff0c0, Math.max(0, 0.8 * (1 - u * 2))).fillCircle(burst.x, burst.y, burst.r * 0.45);
    }
    this.bursts = this.bursts.filter((burst) => burst.t < 0.45);

    this.updateCamera(dt);
    this.refreshPower();
  }

  private boneBurst(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const bit = this.inWorld(this.add.rectangle(x, y, 10, 4, 0xece4cc).setDepth(19).setStrokeStyle(1.5, 0x1a1124));
      const a = (i / 10) * Math.PI * 2;
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(a) * (30 + (i % 3) * 14),
        y: y + Math.sin(a) * 30 + 40,
        angle: 180 + i * 40,
        alpha: 0,
        duration: 650,
        onComplete: () => bit.destroy(),
      });
    }
  }

  private updateCamera(dt: number): void {
    const p = this.battle.projectiles[0];
    let zoom = OVERVIEW;
    let cx = LW / 2;
    let cy = LH / 2;
    if (this.phase === 'flight' && p) {
      zoom = 1;
      cx = p.x;
      cy = p.y;
    }
    const k = Math.min(1, dt * 4);
    this.camZoom += (zoom - this.camZoom) * k;
    const viewW = W / this.camZoom;
    const viewH = H / this.camZoom;
    cx = Phaser.Math.Clamp(cx, viewW / 2, LW - viewW / 2);
    // The bottom of the level sits just above the weapon bar; above the level there is sky.
    const lowest = LH + (H - LEVEL_BOTTOM_ON_SCREEN) / this.camZoom - viewH / 2;
    cy = this.phase === 'flight' && p ? Phaser.Math.Clamp(cy, -SKY_ABOVE + viewH / 2, lowest) : lowest;
    this.camX += (cx - this.camX) * k;
    this.camY += (cy - this.camY) * k;
    const cam = this.cameras.main;
    cam.setZoom(ZOOM * this.camZoom);
    cam.centerOn(this.camX, this.camY);
  }

  // ---------------------------------------------------------------- HUD

  private buildHud(): void {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.night, 0.72);
    panel.fillRoundedRect(16, 12, 420, 92, 14);
    panel.fillRoundedRect(W - 336, 12, 320, 74, 14);
    this.levelText = this.add.text(32, 36, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.bone }).setOrigin(0, 0.5);
    this.aimText = this.add.text(32, 66, '', { ...TEXT.bodyBold, fontSize: '19px', color: CSS.gold }).setOrigin(0, 0.5);
    this.powerBar = this.add.graphics();
    this.shotText = this.add.text(W - 32, 34, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.orange }).setOrigin(1, 0.5);
    this.leftText = this.add.text(W - 32, 64, '', { ...TEXT.bodyBold, fontSize: '19px', color: CSS.bone }).setOrigin(1, 0.5);
    this.weaponBar = this.add.graphics();
    WEAPONS.forEach((weapon, i) => {
      const x = W / 2 + (i - 2) * 190;
      if (weapon !== 'beam') {
        this.weaponIcons.push(addAsset(this, PROJECTILES, x - 64, 620, { frame: PROJECTILE_FRAME[weapon], width: 30, height: 30 }));
      }
      this.weaponTexts.push(this.add.text(x - 42, 620, '', { ...TEXT.bodyBold, fontSize: '18px', color: CSS.bone }).setOrigin(0, 0.5));
    });
    this.message = this.add.text(W / 2, H / 2 - 70, '', { ...TEXT.title, fontSize: '70px', align: 'center' }).setOrigin(0.5).setVisible(false);
    this.subMessage = this.add.text(W / 2, H / 2 + 6, '', { ...TEXT.heading, fontSize: '38px', align: 'center' }).setOrigin(0.5).setVisible(false);
    this.subMessage.setShadow(0, 3, '#000000', 8, true, true);
    addKeyHints(this, [
      ['↑↓', 'Kulma'],
      ['←→', 'Tarkka kulma'],
      ['Välilyönti', 'Lataa ja päästä irti'],
      ['1–5', 'Ase'],
      ['Esc', 'Tauko'],
    ]);
    // Everything made so far (except the world) belongs to the HUD camera.
    const layers: unknown[] = [this.worldLayer, this.hudLayer];
    for (const obj of [...this.children.list]) {
      if (!layers.includes(obj) && !this.worldLayer.exists(obj)) this.hudLayer.add(obj);
    }
  }

  private refreshHud(): void {
    if (!this.levelText) return;
    this.levelText.setText(`Kenttä ${this.levelIndex + 1}/${LEVELS.length}: ${this.battle.level.name}`);
    this.shotText.setText(`Laukaukset: ${this.shots}`);
    this.leftText.setText(`Luurankoja jäljellä: ${this.battle.skeletonsLeft()}`);
    const g = this.weaponBar.clear();
    WEAPONS.forEach((weapon, i) => {
      const x = W / 2 + (i - 2) * 190;
      const selected = weapon === this.weapon;
      const left = this.ammo[weapon];
      g.fillStyle(selected ? COLORS.panelLight : COLORS.night, selected ? 0.95 : 0.7).fillRoundedRect(x - 88, 594, 176, 52, 10);
      if (selected) g.lineStyle(3, COLORS.orange, 1).strokeRoundedRect(x - 88, 594, 176, 52, 10);
      if (weapon === 'beam') {
        g.fillStyle(0xffd04a, left > 0 ? 1 : 0.3).fillRect(x - 78, 616, 28, 6);
        g.fillStyle(0xffffff, left > 0 ? 1 : 0.3).fillRect(x - 78, 618, 28, 2);
      }
      const count = weapon === 'pumpkin' ? '∞' : `${left}`;
      this.weaponTexts[i].setText(`${i + 1} ${SHORT_NAMES[weapon]} ${count}`).setColor(left > 0 ? CSS.bone : CSS.grey);
    });
    this.weaponIcons.forEach((icon, i) => {
      const weapon = WEAPONS.filter((w) => w !== 'beam')[i];
      icon.setAlpha(this.ammo[weapon] > 0 ? 1 : 0.35);
    });
  }

  private refreshPower(): void {
    this.aimText.setText(`Kulma ${Math.round(this.angle)}°   Voima`);
    const g = this.powerBar.clear();
    const x = 32 + this.aimText.width + 12;
    g.fillStyle(COLORS.panelLight, 1).fillRoundedRect(x, 58, 150, 16, 6);
    const p = this.power();
    if (p > 0) g.fillStyle(p > 0.85 ? COLORS.red : COLORS.orange, 1).fillRoundedRect(x, 58, Math.max(8, 150 * p), 16, 6);
  }

  private showMessage(title: string, sub: string): void {
    this.tweens.killTweensOf([this.message, this.subMessage]);
    this.message.setText(title).setVisible(true).setAlpha(1).setScale(0.7);
    this.subMessage.setText(sub).setVisible(sub !== '').setAlpha(1);
    this.tweens.add({ targets: this.message, scale: 1, duration: 420, ease: 'Back.Out' });
  }

  private hideMessage(): void {
    this.tweens.killTweensOf([this.message, this.subMessage]);
    this.tweens.add({ targets: [this.message, this.subMessage], alpha: 0, duration: 300 });
  }

  private inWorld<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.worldLayer.add(obj);
    return obj;
  }
}
