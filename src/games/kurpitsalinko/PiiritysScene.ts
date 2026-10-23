import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { heldKeys, onChar, type HeldKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { applyCameraZoom, H, W, ZOOM } from '../../ui/screen';
import { COLORS, CSS, TEXT } from '../../ui/theme';
import { assetKey, type GameContext, type GameSceneData } from '../types';
import { ARM, BARREL, CATAPULT, CRATE, CRYPT, EARTH, PROJECTILES, SKELETON, SKY, STONE, TOKENS, WARRIOR, WOOD } from './assets';
import { LEVELS } from './levels';
import { Battle, levelScore, powerAt, SKELETON_H, WEAPON_NAMES, WEAPONS, type BattleEvent, type Weapon } from './logic';
import type { Material, Shape } from './terrain';

const C = CONFIG.kurpitsalinko;
const LW = C.levelWidth;
const LH = C.levelHeight;
const TERRAIN_KEY = 'piiritys-maasto';
/** Camera zoom while aiming (the start of a level) and while a pumpkin flies. */
const AIM_ZOOM: number = C.aimZoom;
const FLIGHT_ZOOM: number = C.flightZoom;
/** The catapult arm lies back (left and down) while loaded and swings up over the top when it throws. */
const ARM_REST = 155;
const ARM_THROWN = 290;
/** Minimap of the whole level at the top of the screen (Pasi 22.10.). */
const MAP_W = 400;
const MAP_H = Math.round((MAP_W * LH) / LW);
const MAP_X = W / 2 - MAP_W / 2;
const MAP_Y = 14;
const MAP_KEY = 'piiritys-kartta';
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
  /** Shots in this attempt and in this level, and the points of the levels cleared (Pasi 22.10.: 200 a level). */
  private shots = 0;
  private levelShots = 0;
  private levelPoints: number[] = [];
  /** While aiming, A and D move the camera along the level (Pasi 22.10.). */
  private panX: number | null = null;
  private mapDirty = false;
  private angle: number = C.startAngle;
  private charging = false;
  private chargeTime = 0;
  private weapon: Weapon = 'pumpkin';
  /** Special weapons left in this attempt (Pasi 23.10.: they carry over from level to level). */
  private ammo: Record<Weapon, number> = { pumpkin: Infinity, ...CONFIG.kurpitsalinko.startAmmo };
  /** The previous shot's power and angle, shown on the power bar and as a faint line (Pasi 23.10.). */
  private lastPower: number | null = null;
  private lastAngle: number | null = null;
  private previousTrail: Array<[number, number]> = [];
  private finished = false;
  private keys!: HeldKeys;
  private camX = 0;
  private camY = 0;
  private camZoom = AIM_ZOOM;
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
  private crateImages = new Map<number, Phaser.GameObjects.Image>();
  private tokenImages = new Map<number, Phaser.GameObjects.Image>();
  private projectileImages = new Map<number, Phaser.GameObjects.Image>();
  private levelText!: Phaser.GameObjects.Text;
  private shotText!: Phaser.GameObjects.Text;
  private leftText!: Phaser.GameObjects.Text;
  private aimText!: Phaser.GameObjects.Text;
  private powerBar!: Phaser.GameObjects.Graphics;
  private weaponBar!: Phaser.GameObjects.Graphics;
  private weaponTexts: Phaser.GameObjects.Text[] = [];
  private weaponIcons: Phaser.GameObjects.Image[] = [];
  private mapTexture!: Phaser.Textures.CanvasTexture;
  private mapDots!: Phaser.GameObjects.Graphics;
  private loaded!: Phaser.GameObjects.Image;
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
    this.levelShots = 0;
    this.levelPoints = [];
    this.panX = null;
    this.angle = C.startAngle;
    this.charging = false;
    this.chargeTime = 0;
    this.weapon = 'pumpkin';
    this.ammo = { pumpkin: Infinity, ...C.startAmmo };
    this.lastPower = null;
    this.lastAngle = null;
    this.previousTrail = [];
    this.finished = false;
    this.camZoom = AIM_ZOOM;
    this.beams = [];
    this.bursts = [];
    this.skeletonImages = new Map();
    this.barrelImages = new Map();
    this.crateImages = new Map();
    this.tokenImages = new Map();
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
    this.loaded = this.inWorld(addAsset(this, PROJECTILES, 0, 0, { frame: 0 }).setDepth(5.5));
    this.aimLine = this.inWorld(this.add.graphics().setDepth(7));
    this.effects = this.inWorld(this.add.graphics().setDepth(20));

    this.buildHud();
    this.keys = heldKeys(this, ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'a', 'A', 'd', 'D']);
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
      levelShots: this.levelShots,
      levelPoints: [...this.levelPoints],
      panning: this.panX !== null,
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

  /** Test helper: every skeleton of this level falls, as if this many shots had been used. */
  debugClearLevel(shotsUsed = 0): void {
    this.shots += shotsUsed;
    this.levelShots += shotsUsed;
    for (const s of this.battle.skeletons) s.alive = false;
  }

  // ---------------------------------------------------------------- levels

  private startLevel(index: number): void {
    this.levelIndex = index;
    this.battle = new Battle(index);
    // Pasi 23.10.: the special weapons carry over; every new level brings a few more.
    if (index > 0) for (const [weapon, more] of Object.entries(C.ammoPerLevel)) this.ammo[weapon as Weapon] += more;
    this.weapon = 'pumpkin';
    this.levelShots = 0;
    this.lastPower = null;
    this.lastAngle = null;
    this.panX = null;
    this.previousTrail = [];
    this.charging = false;
    for (const img of [
      ...this.skeletonImages.values(),
      ...this.barrelImages.values(),
      ...this.crateImages.values(),
      ...this.tokenImages.values(),
      ...this.projectileImages.values(),
    ]) {
      this.tweens.killTweensOf(img);
      img.destroy();
    }
    this.skeletonImages.clear();
    this.barrelImages.clear();
    this.crateImages.clear();
    this.tokenImages.clear();
    this.projectileImages.clear();
    const level = this.battle.level;
    const crypt = index === LEVELS.length - 1;
    this.sky.setTexture(assetKey(crypt ? CRYPT : SKY)).setDisplaySize(LW, LH + SKY_ABOVE);
    this.paintTerrain(level.shapes);

    const ground = this.battle.terrain.surfaceBelow(level.catapultX, 0) ?? LH - 100;
    this.catapult.setPosition(level.catapultX, ground);
    this.warrior.setPosition(level.catapultX - 125, ground);
    this.arm.setPosition(level.catapultX, ground - 70).setAngle(ARM_REST);
    for (const s of this.battle.skeletons) {
      this.skeletonImages.set(s.id, this.inWorld(addAsset(this, SKELETON, s.x, s.y, { origin: [0.5, 1], frame: 0 }).setDepth(8).setFlipX(false)));
    }
    for (const b of this.battle.barrels) {
      this.barrelImages.set(b.id, this.inWorld(addAsset(this, BARREL, b.x, b.y, { origin: [0.5, 1] }).setDepth(8)));
    }
    for (const c of this.battle.crates) {
      this.crateImages.set(c.id, this.inWorld(addAsset(this, CRATE, c.x, c.y, { origin: [0.5, 1] }).setDepth(8)));
    }
    for (const t of this.battle.tokens) {
      const img = this.inWorld(addAsset(this, TOKENS, t.x, t.y, { frame: t.value === 3 ? 1 : 0 }).setDepth(9));
      this.tweens.add({ targets: img, y: t.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.tokenImages.set(t.id, img);
    }
    this.drawWater();
    this.phase = 'intro';
    this.phaseTime = 0;
    this.showMessage(`Kenttä ${index + 1}/${LEVELS.length}`, level.name);
    this.camZoom = AIM_ZOOM;
    this.camX = this.homeX(AIM_ZOOM);
    this.camY = LH + (H - LEVEL_BOTTOM_ON_SCREEN) / AIM_ZOOM - H / AIM_ZOOM / 2;
    this.paintMap();
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
    const pan = (k.isDown('d') || k.isDown('D') ? 1 : 0) - (k.isDown('a') || k.isDown('A') ? 1 : 0);
    if (pan !== 0) this.panX = (this.panX ?? this.camX) + pan * C.panSpeed * dt;
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
    this.levelShots++;
    this.panX = null;
    this.battle.fire(weapon, this.angle, power);
    this.lastPower = weapon === 'beam' ? this.lastPower : power;
    this.lastAngle = this.angle;
    // After a special weapon the normal pumpkin is chosen again, so the rare ones are not used by accident.
    this.weapon = 'pumpkin';
    this.phase = 'flight';
    this.phaseTime = 0;
    const sfx = this.ctx.sfx;
    if (weapon === 'beam') {
      sfx.tone({ freq: 180, slideTo: 1400, duration: 0.6, type: 'sawtooth', volume: 0.08 });
    } else {
      sfx.noise({ duration: 0.18, volume: 0.12, filterFreq: 400, filterType: 'lowpass' });
      sfx.noise({ duration: 0.35, volume: 0.05, filterFreq: 1800, filterType: 'bandpass', delay: 0.05 });
    }
    // The arm swings up over the top, and comes back down for the next pumpkin.
    this.tweens.killTweensOf(this.arm);
    this.arm.angle = ARM_REST + 10 * this.armPull;
    this.tweens.add({
      targets: this.arm,
      angle: ARM_THROWN,
      duration: 160,
      ease: 'Quad.In',
      onComplete: () => this.tweens.add({ targets: this.arm, angle: ARM_REST, duration: 600, delay: 250, ease: 'Sine.InOut' }),
    });
    this.handleEvents();
    this.refreshHud();
  }

  private handleEvents(): void {
    const sfx = this.ctx.sfx;
    const events = this.battle.takeEvents();
    for (const e of events) this.showEvent(e, sfx);
    if (this.mapDirty) {
      this.mapDirty = false;
      this.paintMap();
    }
    if (events.length > 0) this.refreshHud();
  }

  private showEvent(e: BattleEvent, sfx: GameContext['sfx']): void {
    switch (e.type) {
      case 'blast': {
        this.carvePicture(e.x, e.y, e.r);
        this.mapDirty = true;
        this.bursts.push({ x: e.x, y: e.y, r: e.r, t: 0, color: e.barrel ? 0xffd04a : 0xff8a1f });
        const big = e.r >= C.barrelRadius;
        sfx.noise({ duration: big ? 0.7 : 0.4, volume: big ? 0.2 : 0.14, filterFreq: big ? 260 : 500, filterType: 'lowpass' });
        this.cameras.main.shake(big ? 260 : 140, big ? 0.008 : 0.004);
        break;
      }
      case 'beam':
        this.carveBeam(e.x0, e.y0, e.x1, e.y1, e.width);
        this.mapDirty = true;
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
      case 'crate': {
        this.ammo[e.weapon] += e.amount;
        this.floatText(e.x, e.y - 30, `+${e.amount} ${WEAPON_NAMES[e.weapon]}`, CSS.gold);
        sfx.tone({ freq: 660, slideTo: 1320, duration: 0.3, type: 'triangle', volume: 0.08 });
        const img = [...this.crateImages.entries()].find(([, image]) => Math.abs(image.x - e.x) < 2);
        if (img) {
          this.crateImages.delete(img[0]);
          this.tweens.add({ targets: img[1], alpha: 0, scale: img[1].scale * 1.4, duration: 300, onComplete: () => img[1].destroy() });
        }
        break;
      }
      case 'token': {
        this.levelShots = Math.max(0, this.levelShots - e.value);
        this.floatText(e.x, e.y - 30, `Laukauksia −${e.value}`, e.value === 3 ? CSS.gold : CSS.green);
        sfx.tone({ freq: 880, slideTo: 1760, duration: 0.25, type: 'sine', volume: 0.08 });
        sfx.tone({ freq: 1320, slideTo: 2200, duration: 0.25, type: 'sine', volume: 0.06, delay: 0.1 });
        const token = this.battle.tokens.find((t) => t.x === e.x && t.y === e.y);
        const img = token ? this.tokenImages.get(token.id) : undefined;
        if (token && img) {
          this.tokenImages.delete(token.id);
          this.tweens.killTweensOf(img);
          this.tweens.add({ targets: img, alpha: 0, scale: img.scale * 1.8, duration: 350, onComplete: () => img.destroy() });
        }
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
    const points = levelScore(this.battle.level.skeletons.length, this.levelShots);
    this.levelPoints.push(points);
    this.ctx.sfx.play('success');
    this.showMessage('Kenttä tyhjä!', `${this.levelShots} laukausta`);
  }

  private allCleared(): void {
    this.phase = 'won';
    this.phaseTime = 0;
    this.ctx.sfx.play('fanfare');
    this.showMessage('Kaikki luurangot kaatuivat!', `${this.shots} laukausta`);
  }

  private points(): number {
    return this.levelPoints.reduce((sum, p) => sum + p, 0);
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
    for (const c of b.crates) {
      const img = this.crateImages.get(c.id);
      if (!img) continue;
      if (!c.alive) {
        // Lost in the moat (an opened crate is removed when it opens).
        this.crateImages.delete(c.id);
        img.destroy();
        continue;
      }
      img.setPosition(c.x, c.y);
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
    if (aiming && this.lastAngle !== null) {
      const a = (this.lastAngle * Math.PI) / 180;
      this.aimLine.lineStyle(3, 0xffffff, 0.35).lineBetween(launch.x, launch.y, launch.x + Math.cos(a) * 80, launch.y - Math.sin(a) * 80);
    }
    if (aiming) {
      const a = (this.angle * Math.PI) / 180;
      const len = 90;
      this.aimLine.lineStyle(4, 0xffd04a, 0.9).lineBetween(launch.x, launch.y, launch.x + Math.cos(a) * len, launch.y - Math.sin(a) * len);
      this.aimLine.fillStyle(0xffd04a, 1).fillCircle(launch.x + Math.cos(a) * len, launch.y - Math.sin(a) * len, 5);
    }
    // Pulling back while the power swings; the chosen pumpkin waits in the bucket.
    if (aiming && !this.tweens.isTweening(this.arm)) this.arm.setAngle(ARM_REST + 10 * this.armPull);
    const bucket = Phaser.Math.DegToRad(this.arm.angle);
    const reach = ARM.width * 0.84;
    this.loaded
      .setVisible(aiming || this.phase === 'intro')
      .setFrame(PROJECTILE_FRAME[this.weapon === 'beam' ? 'homing' : this.weapon] ?? 0)
      .setPosition(this.arm.x + Math.cos(bucket) * reach, this.arm.y + Math.sin(bucket) * reach - 10);
    if (this.weapon === 'beam') this.loaded.setTint(0xffd04a);
    else this.loaded.clearTint();
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

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.inWorld(this.add.text(x, y, text, { ...TEXT.bodyBold, fontSize: '30px', color }).setOrigin(0.5).setDepth(40));
    label.setShadow(0, 2, '#000000', 6, true, true);
    this.tweens.add({ targets: label, y: y - 60, alpha: 0, delay: 500, duration: 900, onComplete: () => label.destroy() });
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

  /** Camera x that shows the catapult near the left edge. */
  private homeX(zoom: number): number {
    return this.battle.level.catapultX - 160 + W / zoom / 2;
  }

  /** How far the arm is pulled back while charging (0..1). */
  private get armPull(): number {
    return this.charging ? this.power() : 0;
  }

  private updateCamera(dt: number): void {
    const p = this.battle.projectiles[0];
    const flying = this.phase === 'flight' && p !== undefined;
    const zoom = flying ? FLIGHT_ZOOM : AIM_ZOOM;
    const k = Math.min(1, dt * 4);
    this.camZoom += (zoom - this.camZoom) * k;
    const viewW = W / this.camZoom;
    const viewH = H / this.camZoom;
    let cx = flying ? p.x : (this.panX ?? this.homeX(this.camZoom));
    cx = Phaser.Math.Clamp(cx, viewW / 2, LW - viewW / 2);
    if (this.panX !== null) this.panX = cx;
    // The bottom of the level sits just above the weapon bar; above the level there is sky.
    const lowest = LH + (H - LEVEL_BOTTOM_ON_SCREEN) / this.camZoom - viewH / 2;
    const cy = flying ? Phaser.Math.Clamp(p.y, -SKY_ABOVE + viewH / 2, lowest) : lowest;
    // Panning with A and D follows the keys at once.
    const kx = this.panX !== null ? 1 : k;
    this.camX += (cx - this.camX) * kx;
    this.camY += (cy - this.camY) * k;
    const cam = this.cameras.main;
    cam.setZoom(ZOOM * this.camZoom);
    cam.centerOn(this.camX, this.camY);
    this.drawMapDots(viewW, viewH);
  }

  // ---------------------------------------------------------------- minimap (Pasi 22.10.)

  /** The ground of the whole level, small, from the ground cells. */
  private paintMap(): void {
    if (!this.mapTexture) return;
    const tex = this.mapTexture;
    const ctx = tex.context;
    const w = tex.width;
    const h = tex.height;
    const image = ctx.createImageData(w, h);
    const colors: Record<string, [number, number, number]> = { earth: [122, 90, 64], stone: [138, 138, 160], wood: [160, 112, 58] };
    const t = this.battle.terrain;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const m = t.materialAt(((x + 0.5) / w) * LW, ((y + 0.5) / h) * LH);
        const i = (y * w + x) * 4;
        if (m) {
          const [r, g, b] = colors[m];
          image.data[i] = r;
          image.data[i + 1] = g;
          image.data[i + 2] = b;
          image.data[i + 3] = 255;
        }
      }
    }
    for (const water of this.battle.level.water) {
      for (let y = Math.floor((water.y / LH) * h); y < h; y++) {
        for (let x = Math.floor((water.x0 / LW) * w); x < Math.ceil((water.x1 / LW) * w); x++) {
          const i = (y * w + x) * 4;
          if (image.data[i + 3] === 0) image.data.set([50, 90, 140, 255], i);
        }
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(image, 0, 0);
    tex.refresh();
  }

  private drawMapDots(viewW: number, viewH: number): void {
    const g = this.mapDots.clear();
    const sx = MAP_W / LW;
    const sy = MAP_H / LH;
    const b = this.battle;
    g.fillStyle(0xff8a1f, 1).fillRect(MAP_X + b.level.catapultX * sx - 4, MAP_Y + (b.launch.y + 60) * sy - 4, 8, 8);
    for (const s of b.skeletons) {
      if (s.alive) g.fillStyle(0xf4ecd8, 1).fillCircle(MAP_X + s.x * sx, MAP_Y + (s.y - 30) * sy, 3.5);
    }
    for (const barrel of b.barrels) {
      if (barrel.alive) g.fillStyle(0xe5484d, 1).fillCircle(MAP_X + barrel.x * sx, MAP_Y + (barrel.y - 20) * sy, 2.5);
    }
    for (const c of b.crates) {
      if (c.alive) g.fillStyle(0xc08040, 1).fillRect(MAP_X + c.x * sx - 3, MAP_Y + (c.y - 18) * sy - 3, 6, 6);
    }
    for (const t of b.tokens) {
      if (!t.taken) g.fillStyle(t.value === 3 ? 0xf5c542 : 0x8fdc5a, 1).fillCircle(MAP_X + t.x * sx, MAP_Y + Math.max(0, t.y) * sy, 3);
    }
    for (const p of b.projectiles) g.fillStyle(0xffd04a, 1).fillCircle(MAP_X + p.x * sx, MAP_Y + Math.max(0, p.y) * sy, 3);
    // What the camera shows now.
    const left = this.camX - viewW / 2;
    const top = Math.max(0, this.camY - viewH / 2);
    g.lineStyle(2, 0xffffff, 0.8).strokeRect(MAP_X + left * sx, MAP_Y + top * sy, viewW * sx, Math.min(LH - top, viewH) * sy);
  }


  // ---------------------------------------------------------------- HUD

  private buildHud(): void {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.night, 0.72);
    panel.fillRoundedRect(16, 12, 410, 92, 14);
    panel.fillRoundedRect(W - 418, 12, 402, 74, 14);
    this.levelText = this.add.text(32, 36, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.bone }).setOrigin(0, 0.5);
    this.aimText = this.add.text(32, 66, '', { ...TEXT.bodyBold, fontSize: '19px', color: CSS.gold }).setOrigin(0, 0.5);
    this.powerBar = this.add.graphics();
    this.shotText = this.add.text(W - 32, 34, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.orange }).setOrigin(1, 0.5);
    this.leftText = this.add.text(W - 32, 64, '', { ...TEXT.bodyBold, fontSize: '19px', color: CSS.bone }).setOrigin(1, 0.5);
    // Minimap between the panels: the ground of the whole level, skeletons, barrels and the camera's view.
    panel.fillRoundedRect(MAP_X - 8, MAP_Y - 6, MAP_W + 16, MAP_H + 12, 10);
    const existingMap = this.textures.exists(MAP_KEY) ? (this.textures.get(MAP_KEY) as Phaser.Textures.CanvasTexture) : null;
    this.mapTexture = existingMap ?? this.textures.createCanvas(MAP_KEY, Math.round(MAP_W * ZOOM), Math.round(MAP_H * ZOOM))!;
    this.add.image(MAP_X, MAP_Y, MAP_KEY).setOrigin(0, 0).setDisplaySize(MAP_W, MAP_H);
    this.mapDots = this.add.graphics();
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
      ['A / D', 'Katso'],
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
    // Shots in this level, and how many still give the full 200 points.
    this.shotText.setText(`Laukaukset: ${this.levelShots} / ${this.battle.level.skeletons.length + C.pointSteps[0].extra}`);
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
    // The previous shot's power as a white mark (Pasi 23.10.).
    if (this.lastPower !== null) {
      const mx = x + 150 * this.lastPower;
      g.fillStyle(0xffffff, 1).fillRect(mx - 1.5, 53, 3, 26);
      g.fillTriangle(mx - 6, 50, mx + 6, 50, mx, 57);
    }
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
