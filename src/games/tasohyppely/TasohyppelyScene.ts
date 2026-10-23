import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { heldKeys, onChar, onKeys, type HeldKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { applyCameraZoom, H, W, ZOOM } from '../../ui/screen';
import { COLORS, CSS, TEXT } from '../../ui/theme';
import { assetKey, type AssetSpec, type GameContext, type GameSceneData } from '../types';
import {
  ARMOR,
  ASSETS,
  AXE,
  BAT,
  BLADE,
  CANDLE,
  COIN,
  DAGGER,
  DAGGER_ITEM,
  GATE,
  HEART_ITEM,
  HUD_HEART,
  HUNTER,
  MUSHROOM,
  ORB,
  RAVEN,
  SKELETON,
  SKULL,
  SPIDER,
  SPORE,
  THEMES,
  WHIP,
  WHIP_ITEM,
  WISP,
  WITCH,
  WOLF,
  ZOMBIE,
} from './assets';
import { bossHarmful, bossHittable, bossRect, bossShare, hitBoss, newBoss, PILLAR_FIRE, PILLAR_HALF_W, PILLAR_WARNING, pillarHits, updateBoss, type Boss } from './boss';
import { enemyRect, newEnemy, riseShare, updateEnemy, updateShot, WALKERS, type Enemy, type Shot } from './enemies';
import {
  BLADE_RADIUS,
  BLADE_REACH,
  bladePoint,
  crumbleKey,
  getLevels,
  HUNTER_H,
  hunterRect,
  inPit,
  isStandable,
  lashActive,
  levelProgress,
  moverRect,
  newHunter,
  overlaps,
  pendulumAngle,
  safeFooting,
  score,
  stepHunter,
  TILE,
  tileAt,
  totalCandles,
  whipDamage,
  whipRect,
  type EnemyKind,
  type Hunter,
  type HunterInput,
  type ItemKind,
  type Level,
  type Rect,
  type World,
} from './logic';
import { seeded } from './pixel';
import { DECOR_FRAMES } from './scenery';
import { buy, damageFactor, freshRun, MAX_WHIP, maxHealth, offer, readRunState, SHOP_ITEMS, WHIP_NAMES, type RunState } from './shop';
import { HUNTER_FRAME } from './sprites';

const C = CONFIG.tasohyppely;
/** Room below the level for the key hints. */
const BOTTOM_MARGIN = 60;
const STEP = 1 / 60;

type Phase = 'shop' | 'intro' | 'play' | 'levelDone' | 'boss' | 'won' | 'dead';

const ENEMY_ART: Record<EnemyKind, AssetSpec> = {
  zombie: ZOMBIE,
  bat: BAT,
  raven: RAVEN,
  armor: ARMOR,
  skull: SKULL,
  spider: SPIDER,
  wisp: WISP,
  mushroom: MUSHROOM,
  wolf: WOLF,
  skeleton: SKELETON,
};

interface Item {
  kind: ItemKind;
  x: number;
  y: number;
  vy: number;
  resting: boolean;
  t: number;
  image: Phaser.GameObjects.Image;
}

interface CrumbleTile {
  col: number;
  row: number;
  state: 'solid' | 'shaking' | 'gone';
  t: number;
  image: Phaser.GameObjects.Image;
}

/**
 * Tasohyppely: the vampire hunter runs, jumps and lashes his way through the
 * graveyard, the castle and the witch's forest, and fights the head witch.
 * One attempt; the core counts the attempts. An attempt starts from the level
 * where the previous one ended (ctx.carry, Pasi 22.10.), and the start of
 * every level is saved, so an interrupted attempt resumes there.
 */
export class TasohyppelyScene extends Phaser.Scene {
  private ctx!: GameContext;
  private phase: Phase = 'intro';
  private phaseTime = 0;
  private levelIndex = 0;
  private level!: Level;
  /** Seconds of play in this level (moving platforms and blades follow it). */
  private levelTime = 0;
  private hunter: Hunter = newHunter(0, 0);
  private world!: World;
  private keys!: HeldKeys;
  private lashQueued = false;
  private throwQueued = false;
  /** Throwing daggers left, flying daggers and the time until the next throw. */
  private daggers: number = C.daggersStart;
  private flying: Array<{ x: number; y: number; vx: number; image: Phaser.GameObjects.Image }> = [];
  private throwCooldown = 0;
  /** The hunter shows the throwing pose this much longer. */
  private throwPose = 0;
  /** Enemies the current lash has already hit (each lash hits each enemy once). */
  private struck = new Set<number>();
  private health: number = C.maxHealth;
  private whipLevel = 1;
  /** Coins from candles, and what has been bought with them (Pasi 22.10.). */
  private coins = 0;
  private extraHearts = 0;
  private sharpen = 0;
  /** Where this attempt starts, and the hunter's things at the start of the current level (handed on after a fall). */
  private startRun: RunState = freshRun();
  private levelStart: RunState = freshRun();
  private shopIndex = 0;
  private levelsDone = 0;
  private bestProgress = 0;
  private candlesBroken = 0;
  private broken = new Set<number>();
  private whipDroppedHere = false;
  private guaranteeArmed = false;
  private lastSafe = { x: 0, y: 0 };
  private enemies: Enemy[] = [];
  private shots: Array<Shot & { image: Phaser.GameObjects.Image }> = [];
  private items: Item[] = [];
  private crumbles = new Map<string, CrumbleTile>();
  private boss: Boss | null = null;
  private nextId = 100000;
  private finished = false;
  private random!: Phaser.Math.RandomDataGenerator;
  private camX = 0;
  private camY = 0;
  private lookAhead = 0;

  // Display
  private worldLayer!: Phaser.GameObjects.Layer;
  private hudLayer!: Phaser.GameObjects.Layer;
  private hudCam!: Phaser.Cameras.Scene2D.Camera;
  private levelObjects: Phaser.GameObjects.GameObject[] = [];
  private sky!: Phaser.GameObjects.Image;
  private landscape!: Phaser.GameObjects.TileSprite;
  private hunterImage!: Phaser.GameObjects.Image;
  private whipImage!: Phaser.GameObjects.Image;
  private enemyImages = new Map<number, Phaser.GameObjects.Image>();
  private candleImages = new Map<number, Phaser.GameObjects.Image>();
  private moverImages = new Map<number, Phaser.GameObjects.Image[]>();
  private bladeImages = new Map<number, Phaser.GameObjects.Image>();
  private threads!: Phaser.GameObjects.Graphics;
  private effects!: Phaser.GameObjects.Graphics;
  private bossImage: Phaser.GameObjects.Image | null = null;
  private hearts: Phaser.GameObjects.Image[] = [];
  private whipText!: Phaser.GameObjects.Text;
  private daggerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image;
  private candleText!: Phaser.GameObjects.Text;
  private shopLayer!: Phaser.GameObjects.Container;
  private shopCoins!: Phaser.GameObjects.Text;
  private shopRows: Array<{ box: Phaser.GameObjects.Graphics; name: Phaser.GameObjects.Text; info: Phaser.GameObjects.Text; price: Phaser.GameObjects.Text }> = [];
  private progressBar!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossLabel!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private subMessage!: Phaser.GameObjects.Text;
  private shown = { health: -1, maxHealth: -1, whip: -1, daggers: -1, coins: -1, candles: '', level: -1, progress: -1, boss: -1 };

  constructor() {
    super('Tasohyppely');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.phase = 'intro';
    this.phaseTime = 0;
    this.levelIndex = 0;
    this.levelTime = 0;
    this.lashQueued = false;
    this.throwQueued = false;
    this.flying = [];
    this.throwCooldown = 0;
    this.throwPose = 0;
    this.struck = new Set();
    // An interrupted attempt resumes at the start of its level; otherwise continue from where the last attempt ended.
    this.startRun = readRunState(this.ctx.checkpoint.initial) ?? readRunState(this.ctx.carry) ?? freshRun();
    this.levelStart = this.startRun;
    this.applyRun(this.startRun);
    this.health = maxHealth(this.startRun);
    this.shopIndex = 0;
    this.shopRows = [];
    this.levelsDone = this.startRun.level;
    this.bestProgress = 0;
    this.broken = new Set();
    this.whipDroppedHere = false;
    this.guaranteeArmed = false;
    this.enemies = [];
    this.shots = [];
    this.items = [];
    this.crumbles = new Map();
    this.boss = null;
    this.nextId = 100000;
    this.finished = false;
    this.levelObjects = [];
    this.enemyImages = new Map();
    this.candleImages = new Map();
    this.moverImages = new Map();
    this.bladeImages = new Map();
    this.bossImage = null;
    this.hearts = [];
    this.lookAhead = 0;
    this.shown = { health: -1, maxHealth: -1, whip: -1, daggers: -1, coins: -1, candles: '', level: -1, progress: -1, boss: -1 };
  }

  create(): void {
    this.random = new Phaser.Math.RandomDataGenerator([String(Date.now()), String(Math.random())]);
    // Pixel art stays sharp when scaled.
    for (const spec of ASSETS) this.textures.get(assetKey(spec)).setFilter(Phaser.Textures.FilterMode.NEAREST);

    // The world scrolls with the main camera; the HUD has a camera of its own.
    this.worldLayer = this.add.layer();
    this.hudLayer = this.add.layer();
    this.hudCam = this.cameras.add(0, 0, undefined, undefined, false, 'hud');
    applyCameraZoom(this.hudCam);
    this.hudCam.ignore(this.worldLayer);
    this.cameras.main.ignore(this.hudLayer);
    this.cameras.main.setRoundPixels(true);

    const offset = this.fixedOffset();
    this.sky = this.inWorld(this.add.image(W / 2 + offset.x, H / 2 + offset.y, assetKey(THEMES.hautausmaa.sky)).setScrollFactor(0).setDepth(-100));
    this.landscape = this.inWorld(this.add.tileSprite(W / 2 + offset.x, H / 2 + offset.y, W, H, assetKey(THEMES.hautausmaa.landscape)).setScrollFactor(0).setDepth(-90));
    this.threads = this.inWorld(this.add.graphics().setDepth(9));
    this.effects = this.inWorld(this.add.graphics().setDepth(30));
    this.hunterImage = this.inWorld(addAsset(this, HUNTER, 0, 0, { origin: [0.5, 1] }).setDepth(20));
    this.whipImage = this.inWorld(addAsset(this, WHIP, 0, 0, { origin: [0, 0.5] }).setDepth(21).setVisible(false));

    this.buildHud();
    // The shop's keys come first: there the arrows choose (in the order they are pressed, together with Enter),
    // and while playing these handlers pass the keys on to the hunter.
    onKeys(
      this,
      {
        ArrowUp: () => (this.phase === 'shop' ? this.shopMove(-1) : false),
        ArrowDown: () => (this.phase === 'shop' ? this.shopMove(1) : false),
        Enter: () => (this.phase === 'shop' ? this.shopEnter() : false),
      },
      { allowRepeat: ['ArrowUp', 'ArrowDown'] },
    );
    this.keys = heldKeys(this, ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);
    onChar(this, (char) => {
      const key = char.toLowerCase();
      if (key === 'x') this.lashQueued = true;
      else if (key === 'c') this.throwQueued = true;
    });
    this.enterLevel(this.startRun.level);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    this.phaseTime += dt;
    const steps = Math.max(1, Math.ceil(dt / STEP - 1e-6));
    const step = dt / steps;
    const input = this.readInput();
    for (let i = 0; i < steps; i++) {
      this.tick(step, i === 0 ? input : { ...input, jumpPressed: false, lashPressed: false });
      if (this.finished) return;
    }
    this.draw();
  }

  // ---------------------------------------------------------------- test hooks

  getTestState(): unknown {
    const h = this.hunter;
    return {
      phase: this.phase,
      time: Math.round(this.levelTime * 100) / 100,
      level: this.levelIndex,
      levelsDone: this.levelsDone,
      x: Math.round(h.x),
      y: Math.round(h.y),
      vx: Math.round(h.vx),
      vy: Math.round(h.vy),
      onGround: h.onGround,
      crouching: h.crouching,
      lashing: h.lash?.kind ?? null,
      facing: h.facing,
      health: this.health,
      maxHealth: this.heartCap(),
      whip: this.whipLevel,
      coins: this.coins,
      sharpen: this.sharpen,
      shop: this.phase === 'shop' ? { index: this.shopIndex, offers: SHOP_ITEMS.map((item) => offer(this.run(), item)) } : null,
      daggers: this.daggers,
      flyingDaggers: this.flying.length,
      invulnerable: h.invulnerable > 0,
      candles: this.candlesBroken,
      candlesHere: this.broken.size,
      candlesTotal: totalCandles(),
      progress: Math.round(this.bestProgress * 1000) / 1000,
      points: this.points(),
      enemies: this.enemies.filter((e) => e.state !== 'gone').length,
      items: this.items.map((i) => i.kind),
      boss: this.boss ? { hp: this.boss.hp, maxHp: this.boss.maxHp, stage: this.boss.stage, mode: this.boss.mode } : null,
      start: this.level.start,
      gate: this.level.gate,
      arena: this.level.arena,
    };
  }

  /** Test helper: move the hunter (feet position) without walking there. */
  debugPlace(x: number, y: number): void {
    const h = this.hunter;
    h.x = x;
    h.y = y;
    h.vx = 0;
    h.vy = 0;
    h.onGround = false;
    h.support = null;
    if (this.phase === 'intro') this.beginPlay();
    this.camX = this.cameraTargetX();
    this.camY = this.cameraTargetY();
  }

  /** Test helper: jump to the start of a level (0..2), as if the earlier ones were done (no shop). */
  debugLevel(index: number): void {
    this.enterLevel(index);
    this.closeShop();
    this.beginPlay();
  }

  /** Test helper: this many coins. */
  debugCoins(n: number): void {
    this.coins = n;
    if (this.phase === 'shop') this.refreshShop();
  }

  /** Test helper: straight into the head witch's arena. */
  debugBoss(): void {
    this.debugLevel(2);
    const arena = this.level.arena!;
    this.debugPlace(arena.left + TILE * 4, arena.floorY);
  }

  debugHurt(n: number): void {
    // Hits do not count in the shop or while the level's name is shown.
    this.closeShop();
    this.beginPlay();
    for (let i = 0; i < n; i++) {
      this.hunter.invulnerable = 0;
      this.hurt(this.hunter.x - this.hunter.facing);
    }
  }

  debugBossHealth(hp: number): void {
    if (this.boss) this.boss.hp = Math.max(1, Math.min(this.boss.maxHp, hp));
  }

  debugWhip(level: number): void {
    this.whipLevel = Phaser.Math.Clamp(level, 1, MAX_WHIP);
  }

  /** Test helper: break every candle of this level. */
  debugBreakCandles(): void {
    for (const candle of this.level.candles) this.breakCandle(candle.id);
  }

  /** Test helper: drop an item onto the hunter. */
  debugDrop(kind: ItemKind): void {
    this.dropItem(kind, this.hunter.x, this.hunter.y - 60);
  }

  /** Test helper: bring the head witch right in front of the hunter, at the height of a side lash. */
  debugBossInFront(): void {
    const b = this.boss;
    if (!b || b.mode === 'dead') return;
    // A spent cast keeps her still for a second.
    b.mode = 'cast';
    b.t = 0;
    b.plan = { attack: 'orbs', fromX: b.x, toX: b.x, fromY: b.y, fired: true };
    b.x = this.hunter.x + this.hunter.facing * 70;
    b.y = this.hunter.y - 58;
  }

  // ---------------------------------------------------------------- levels

  /** Hearts at the start of a level. */
  private heartCap(): number {
    return maxHealth({ extraHearts: this.extraHearts });
  }

  /** Damage multiplier from sharpening. */
  private damageBoost(): number {
    return damageFactor({ sharpen: this.sharpen });
  }

  /** The hunter's things right now, as a run state for this level. */
  private run(): RunState {
    return {
      level: this.levelIndex,
      whip: this.whipLevel,
      daggers: this.daggers,
      coins: this.coins,
      extraHearts: this.extraHearts,
      sharpen: this.sharpen,
      candles: this.candlesBroken - this.broken.size,
    };
  }

  private applyRun(run: RunState): void {
    this.whipLevel = run.whip;
    this.daggers = run.daggers;
    this.coins = run.coins;
    this.extraHearts = run.extraHearts;
    this.sharpen = run.sharpen;
    this.candlesBroken = run.candles;
  }

  /**
   * Arrive at a level: remember the hunter's things (saved, and handed to the
   * next attempt after a fall), build the level and open the shop before
   * levels 2 and 3.
   */
  private enterLevel(index: number): void {
    this.levelIndex = index;
    this.levelsDone = index;
    this.broken = new Set();
    this.levelStart = this.run();
    this.ctx.checkpoint.save(this.levelStart);
    this.startLevel(index);
    if (index > 0) this.openShop();
  }

  private startLevel(index: number): void {
    this.levelIndex = index;
    this.level = getLevels()[index];
    const level = this.level;
    for (const obj of this.levelObjects) {
      this.tweens.killTweensOf(obj);
      obj.destroy();
    }
    this.levelObjects = [];
    for (const shot of this.shots) shot.image.destroy();
    for (const item of this.items) item.image.destroy();
    for (const d of this.flying) d.image.destroy();
    this.flying = [];
    this.enemyImages.clear();
    this.candleImages.clear();
    this.moverImages.clear();
    this.bladeImages.clear();
    this.bossImage = null;
    this.shots = [];
    this.items = [];
    this.crumbles = new Map();
    this.boss = null;
    this.levelTime = 0;
    this.bestProgress = 0;
    this.broken = new Set();
    this.whipDroppedHere = false;
    this.guaranteeArmed = false;
    // Pasi 21.10.: full health at the start of every level (more with bought hearts).
    this.health = this.heartCap();
    this.world = { level, gone: new Set(), platforms: [] };
    this.hunter = newHunter(level.start.x, level.start.y);
    this.lastSafe = { ...level.start };
    this.enemies = level.enemies.map((spawn) => newEnemy(spawn));

    const theme = THEMES[level.theme];
    this.sky.setTexture(assetKey(theme.sky));
    this.sky.setDisplaySize(W, H);
    this.landscape.setTexture(assetKey(theme.landscape));
    const frame = this.textures.getFrame(assetKey(theme.landscape));
    const scale = theme.landscape.height / frame.height;
    this.landscape.setSize(W, theme.landscape.height).setTileScale(scale, scale);
    this.buildTiles();
    this.buildDecor();
    for (const candle of level.candles) {
      this.candleImages.set(candle.id, this.levelObject(addAsset(this, CANDLE, candle.x, candle.y).setDepth(5)));
    }
    if (level.gate) this.levelObject(addAsset(this, GATE, level.gate.x, level.gate.y, { origin: [0.5, 1] }).setDepth(3));
    for (const mover of level.movers) {
      const parts = [4, 5].map((f) => this.levelObject(addAsset(this, theme.tiles, 0, 0, { frame: f, origin: [0, 0] }).setDepth(6)));
      this.moverImages.set(mover.id, parts);
    }
    for (const p of level.pendulums) {
      this.bladeImages.set(p.id, this.levelObject(addAsset(this, BLADE, p.x, p.y, { origin: [0.5, 0.12] }).setDepth(8)));
    }
    for (const enemy of this.enemies) this.addEnemyImage(enemy);

    this.camX = this.cameraTargetX();
    this.camY = this.cameraTargetY();
    this.phase = 'intro';
    this.phaseTime = 0;
    this.showMessage(`Kenttä ${index + 1}/3`, level.name);
    this.updatePlatforms();
    this.draw();
  }

  private beginPlay(): void {
    if (this.phase !== 'intro') return;
    this.phase = 'play';
    this.phaseTime = 0;
    this.hideMessage();
    if (this.levelIndex === 0) this.ctx.sfx.play('start');
  }

  private completeLevel(): void {
    this.phase = 'levelDone';
    this.phaseTime = 0;
    this.levelsDone = this.levelIndex + 1;
    this.bestProgress = 0;
    this.ctx.sfx.play('success');
    this.showMessage('Kenttä läpäisty!', this.levelIndex + 1 < 3 ? `Seuraavaksi: ${getLevels()[this.levelIndex + 1].name}` : '');
  }

  // ---------------------------------------------------------------- the game step

  private readInput(): HunterInput {
    const k = this.keys;
    const input: HunterInput = {
      left: k.isDown('ArrowLeft'),
      right: k.isDown('ArrowRight'),
      up: k.isDown('ArrowUp'),
      down: k.isDown('ArrowDown'),
      jumpHeld: k.isDown(' '),
      jumpPressed: k.takePress(' '),
      lashPressed: this.lashQueued,
    };
    this.lashQueued = false;
    return input;
  }

  private tick(dt: number, input: HunterInput): void {
    switch (this.phase) {
      case 'intro':
        if (this.phaseTime > 1.6) this.beginPlay();
        return;
      case 'levelDone':
        if (this.phaseTime > 1.8) this.enterLevel(this.levelIndex + 1);
        return;
      case 'shop':
        return;
      case 'won':
        this.stepBoss(dt);
        if (this.phaseTime > 3) this.end();
        return;
      case 'dead':
        this.hunter.vy = Math.min(C.maxFallSpeed, this.hunter.vy + C.gravity * dt * 0.6);
        this.hunter.y += this.hunter.vy * dt;
        if (this.phaseTime > 1.8) this.end();
        return;
      default:
        break;
    }

    this.levelTime += dt;
    const before = new Map(this.world.platforms.map((p) => [p.id, p.rect]));
    this.updatePlatforms();
    this.updateCrumbles(dt);
    const h = this.hunter;
    let carry = { dx: 0, dy: 0 };
    if (h.support?.kind === 'mover') {
      const id = h.support.id;
      const now = this.world.platforms.find((p) => p.id === id)?.rect;
      const was = before.get(id);
      if (now && was) carry = { dx: now.x - was.x, dy: now.y - was.y };
    }
    const events = stepHunter(h, input, dt, this.world, carry);
    if (this.phase === 'boss') h.x = Math.max(this.level.arena!.left + 16, h.x);
    this.soundEvents(events);

    if (h.onGround) {
      if (safeFooting(h, this.world)) this.lastSafe = { x: h.x, y: h.y };
      if (this.phase === 'play') {
        this.bestProgress = Math.max(this.bestProgress, levelProgress(this.level, h.x, h.y));
        if (!this.whipDroppedHere && this.whipLevel < MAX_WHIP && this.bestProgress >= C.whipGuaranteeAt) this.guaranteeArmed = true;
      }
    }
    if (inPit(h, this.level)) {
      this.fellInPit();
      if (this.isOver()) return;
    }

    this.throwDagger(dt);
    this.updateEnemies(dt);
    this.updateShots(dt);
    this.updateItems(dt);
    this.updateDaggers(dt);
    this.checkLash();
    this.checkHazards();
    if (this.phase === 'boss') this.stepBoss(dt);

    if (this.phase === 'play') {
      const gate = this.level.gate;
      if (gate && Math.abs(h.x - gate.x) < 30 && Math.abs(h.y - gate.y) < TILE) this.completeLevel();
      const arena = this.level.arena;
      if (arena && h.x > arena.left + TILE * 2.5 && h.onGround) this.startBoss();
    }
  }

  private updatePlatforms(): void {
    this.world.platforms = this.level.movers.map((m) => ({ id: m.id, rect: moverRect(m, this.levelTime) }));
  }

  private updateCrumbles(dt: number): void {
    const h = this.hunter;
    if (h.onGround && h.support?.kind === 'tile') {
      const row = h.support.row;
      for (let col = Math.floor((h.x - 13) / TILE); col <= Math.floor((h.x + 13) / TILE); col++) {
        const tile = this.crumbles.get(crumbleKey(col, row));
        if (tile && tile.state === 'solid') {
          tile.state = 'shaking';
          tile.t = 0;
          this.ctx.sfx.noise({ duration: 0.12, volume: 0.08, filterFreq: 500 });
        }
      }
    }
    for (const [key, tile] of this.crumbles) {
      tile.t += dt;
      if (tile.state === 'shaking') {
        tile.image.setX(tile.col * TILE + (Math.floor(tile.t * 30) % 2 === 0 ? -2 : 2));
        if (tile.t >= C.crumbleSeconds) {
          tile.state = 'gone';
          tile.t = 0;
          this.world.gone = new Set([...this.world.gone, key]);
          tile.image.setVisible(false);
          this.burst(tile.col * TILE + TILE / 2, tile.row * TILE + TILE / 2, 0x6a5a50, 10);
          this.ctx.sfx.noise({ duration: 0.25, volume: 0.12, filterFreq: 300 });
        }
      } else if (tile.state === 'gone' && tile.t >= C.crumbleRespawnSeconds) {
        const rect = { x: tile.col * TILE, y: tile.row * TILE, w: TILE, h: TILE };
        if (overlaps(rect, hunterRect(h))) continue;
        tile.state = 'solid';
        const gone = new Set(this.world.gone);
        gone.delete(key);
        this.world.gone = gone;
        tile.image.setVisible(true).setX(tile.col * TILE).setAlpha(0);
        this.tweens.add({ targets: tile.image, alpha: 1, duration: 300 });
      }
    }
  }

  private soundEvents(events: ReturnType<typeof stepHunter>): void {
    const sfx = this.ctx.sfx;
    if (events.jumped) sfx.tone({ freq: 300, slideTo: 520, duration: 0.12, type: 'square', volume: 0.06 });
    if (events.doubleJumped) sfx.tone({ freq: 480, slideTo: 820, duration: 0.14, type: 'square', volume: 0.06 });
    if (events.landed) sfx.noise({ duration: 0.05, volume: 0.06, filterFreq: 600 });
    if (events.lashStarted) {
      this.struck.clear();
      sfx.noise({ duration: 0.12, volume: 0.1, filterFreq: 2400, filterType: 'bandpass', delay: 0.07 });
      sfx.tone({ freq: 1500, slideTo: 2400, duration: 0.05, type: 'triangle', volume: 0.05, delay: 0.1 });
    }
  }

  private fellInPit(): void {
    this.ctx.sfx.play('fail');
    this.damage(C.hitDamage);
    if (this.health <= 0) {
      this.die();
      return;
    }
    const h = this.hunter;
    h.x = this.lastSafe.x;
    h.y = this.lastSafe.y;
    h.vx = 0;
    h.vy = 0;
    h.lash = null;
    h.knockback = 0;
    h.invulnerable = C.invulnerableSeconds;
    this.camX = this.cameraTargetX();
    this.camY = this.cameraTargetY();
  }

  private damage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  /** A hit by an enemy, a projectile or a blade (source = where it came from). */
  private hurt(sourceX: number): void {
    const h = this.hunter;
    if (h.invulnerable > 0 || (this.phase !== 'play' && this.phase !== 'boss')) return;
    this.damage(C.hitDamage);
    this.cameras.main.shake(180, 0.005);
    this.ctx.sfx.tone({ freq: 220, slideTo: 110, duration: 0.2, type: 'sawtooth', volume: 0.1 });
    if (this.health <= 0) {
      this.die();
      return;
    }
    h.invulnerable = C.invulnerableSeconds;
    h.knockback = C.knockbackSeconds;
    const away = h.x >= sourceX ? 1 : -1;
    h.vx = away * C.knockbackSpeed;
    h.vy = -C.knockbackLift;
    h.onGround = false;
    h.support = null;
    h.lash = null;
    h.crouching = false;
    h.jumps = 1;
  }

  private die(): void {
    this.phase = 'dead';
    this.phaseTime = 0;
    this.hunter.vy = -420;
    this.hunter.lash = null;
    this.ctx.sfx.play('fail');
    this.showMessage('Yritys päättyi', 'Sydämet loppuivat.');
  }

  /** The attempt is over (the hunter fell for good). */
  private isOver(): boolean {
    return this.phase === 'dead';
  }

  private points(): number {
    return score({
      levelsDone: this.levelsDone,
      progress: this.bestProgress,
      candlesBroken: this.candlesBroken,
      candlesTotal: totalCandles(),
      bossShare: this.boss ? bossShare(this.boss) : 0,
    });
  }

  private end(): void {
    if (this.finished) return;
    this.finished = true;
    // The witch fell: nothing is left to play. Otherwise the next attempt continues from the start of this level.
    if (this.phase === 'won') this.ctx.finish(this.points(), { complete: true });
    else this.ctx.finish(this.points(), { carry: this.levelStart });
  }

  // ---------------------------------------------------------------- enemies, shots and items

  private enemyContext(dt: number): Parameters<typeof updateEnemy>[1] {
    const h = this.hunter;
    return {
      dt,
      hx: h.x,
      hy: h.y,
      hcy: h.y - HUNTER_H / 2,
      world: this.world,
      shoot: (shot) => this.addShot(shot),
      viewLeft: this.camX,
      viewRight: this.camX + W,
    };
  }

  private updateEnemies(dt: number): void {
    const c = this.enemyContext(dt);
    const hr = hunterRect(this.hunter);
    for (const e of this.enemies) {
      if (e.state === 'gone') continue;
      // Enemies far away wait (they wake up when the hunter comes near).
      if (e.state === 'idle' && Math.abs(e.x - this.hunter.x) > W * 1.2) continue;
      const before = e.state;
      updateEnemy(e, c);
      const after = e.state as Enemy['state'];
      if (before === 'idle' && after !== 'idle') this.enemyWakes(e);
      if (after === 'gone') {
        this.removeEnemyImage(e, false);
        continue;
      }
      const rect = enemyRect(e);
      if (rect && overlaps(rect, hr)) this.hurt(e.x);
    }
  }

  private enemyWakes(e: Enemy): void {
    const sfx = this.ctx.sfx;
    if (e.kind === 'zombie' || e.kind === 'skeleton') sfx.noise({ duration: 0.5, volume: 0.08, filterFreq: 220, filterType: 'lowpass' });
    else if (e.kind === 'bat') sfx.tone({ freq: 2100, slideTo: 2900, duration: 0.07, volume: 0.06 });
    else if (e.kind === 'raven') sfx.tone({ freq: 700, slideTo: 420, duration: 0.18, type: 'sawtooth', volume: 0.05 });
    else if (e.kind === 'wolf') sfx.tone({ freq: 380, slideTo: 620, duration: 0.45, type: 'triangle', volume: 0.07 });
    else if (e.kind === 'spider') sfx.tone({ freq: 900, slideTo: 300, duration: 0.2, type: 'triangle', volume: 0.05 });
  }

  private addShot(shot: Shot): void {
    const spec = shot.kind === 'axe' ? AXE : shot.kind === 'spore' ? SPORE : ORB;
    const image = this.levelObject(addAsset(this, spec, shot.x, shot.y).setDepth(25));
    this.shots.push({ ...shot, image });
    if (shot.kind === 'axe') this.ctx.sfx.noise({ duration: 0.15, volume: 0.06, filterFreq: 1500 });
    else if (shot.kind === 'spore') this.ctx.sfx.noise({ duration: 0.18, volume: 0.05, filterFreq: 800, filterType: 'lowpass' });
  }

  private updateShots(dt: number): void {
    const hr = hunterRect(this.hunter);
    this.shots = this.shots.filter((s) => {
      const alive = updateShot(s, dt, this.world);
      if (alive && circleHits(s.x, s.y, s.radius, hr)) {
        this.hurt(s.x);
        this.removeShot(s);
        return false;
      }
      if (!alive) this.removeShot(s);
      return alive;
    });
  }

  private removeShot(s: Shot & { image: Phaser.GameObjects.Image }): void {
    this.tweens.killTweensOf(s.image);
    s.image.destroy();
  }

  private dropItem(kind: ItemKind, x: number, y: number): void {
    if (kind === 'whip') {
      this.whipDroppedHere = true;
      this.guaranteeArmed = false;
    }
    const spec = kind === 'whip' ? WHIP_ITEM : kind === 'dagger' ? DAGGER_ITEM : HEART_ITEM;
    const image = this.levelObject(addAsset(this, spec, x, y).setDepth(12));
    this.items.push({ kind, x, y, vy: -260, resting: false, t: 0, image });
  }

  private updateItems(dt: number): void {
    const hr = hunterRect(this.hunter);
    this.items = this.items.filter((item) => {
      item.t += dt;
      if (!item.resting) {
        item.vy = Math.min(700, item.vy + 1400 * dt);
        const next = item.y + item.vy * dt;
        const col = Math.floor(item.x / TILE);
        const row = Math.floor((next + 12) / TILE);
        if (item.vy > 0 && isStandable(this.world, col, row) && item.y + 12 <= row * TILE + 1) {
          item.y = row * TILE - 12;
          item.resting = true;
        } else item.y = next;
        if (item.y > this.level.height + TILE) {
          item.image.destroy();
          return false;
        }
      }
      item.image.setPosition(item.x, item.y + (item.resting ? Math.sin(item.t * 4) * 3 - 3 : 0));
      if (overlaps({ x: item.x - 14, y: item.y - 14, w: 28, h: 28 }, hr)) {
        this.collect(item);
        return false;
      }
      return true;
    });
  }

  private collect(item: Item): void {
    this.tweens.killTweensOf(item.image);
    item.image.destroy();
    if (item.kind === 'dagger') {
      this.daggers = Math.min(C.daggersMax, this.daggers + C.daggersPerPickup);
      this.ctx.sfx.tone({ freq: 900, slideTo: 1400, duration: 0.15, type: 'triangle', volume: 0.07 });
      this.floatText(item.x, item.y - 30, `+${C.daggersPerPickup} tikaria`, CSS.silver);
      return;
    }
    if (item.kind === 'whip' && this.whipLevel < MAX_WHIP) {
      this.whipLevel++;
      this.ctx.sfx.tone({ freq: 520, slideTo: 1040, duration: 0.35, type: 'square', volume: 0.08 });
      this.ctx.sfx.tone({ freq: 780, slideTo: 1560, duration: 0.35, type: 'triangle', volume: 0.06, delay: 0.12 });
      this.floatText(item.x, item.y - 30, WHIP_NAMES[this.whipLevel - 1] + '!', CSS.gold);
      return;
    }
    // A whip upgrade with the whip already full becomes half a heart (Pasi 21.10.).
    this.health = Math.min(this.heartCap(), this.health + C.heartHeal);
    this.ctx.sfx.play('correct');
    this.floatText(item.x, item.y - 30, '+½', CSS.red);
  }

  // ---------------------------------------------------------------- throwing daggers

  private throwDagger(dt: number): void {
    const h = this.hunter;
    const wanted = this.throwQueued;
    this.throwQueued = false;
    this.throwPose = Math.max(0, this.throwPose - dt);
    this.throwCooldown = Math.max(0, this.throwCooldown - dt);
    if (!wanted || this.throwCooldown > 0 || h.knockback > 0 || h.lash) return;
    if (this.daggers <= 0) {
      this.ctx.sfx.play('error');
      return;
    }
    this.daggers--;
    this.throwCooldown = C.daggerCooldown;
    this.throwPose = 0.18;
    const y = h.y - (h.crouching ? 26 : 58);
    const x = h.x + h.facing * 24;
    const image = this.levelObject(addAsset(this, DAGGER, x, y).setDepth(22).setFlipX(h.facing < 0));
    this.flying.push({ x, y, vx: h.facing * C.daggerSpeed, image });
    this.ctx.sfx.noise({ duration: 0.1, volume: 0.08, filterFreq: 3000, filterType: 'bandpass' });
  }

  private updateDaggers(dt: number): void {
    this.flying = this.flying.filter((d) => {
      d.x += d.vx * dt;
      d.image.setPosition(d.x, d.y);
      const rect = { x: d.x - 14, y: d.y - 6, w: 28, h: 12 };
      const gone = (): boolean => {
        this.tweens.killTweensOf(d.image);
        d.image.destroy();
        return false;
      };
      if (tileAt(this.level, Math.floor(d.x / TILE), Math.floor(d.y / TILE)) === '#' || d.x < this.camX - TILE || d.x > this.camX + W + TILE) return gone();
      for (const e of this.enemies) {
        if (e.state === 'gone') continue;
        const er = enemyRect(e);
        if (!er || !overlaps(rect, er)) continue;
        e.hp -= C.daggerDamage * this.damageBoost();
        e.flash = 0.12;
        this.ctx.sfx.noise({ duration: 0.06, volume: 0.12, filterFreq: 1800 });
        if (e.hp <= 0) this.killEnemy(e);
        return gone();
      }
      for (const candle of this.level.candles) {
        if (!this.broken.has(candle.id) && overlaps(rect, { x: candle.x - 12, y: candle.y - 18, w: 24, h: 42 })) {
          this.breakCandle(candle.id);
          return gone();
        }
      }
      if (this.boss && bossHittable(this.boss) && overlaps(rect, bossRect(this.boss))) {
        hitBoss(this.boss, C.daggerDamage * this.damageBoost());
        this.ctx.sfx.noise({ duration: 0.1, volume: 0.16, filterFreq: 1400 });
        if (this.boss.mode === 'dead') this.bossDefeated();
        return gone();
      }
      return true;
    });
  }

  // ---------------------------------------------------------------- the whip and the dangers

  private checkLash(): void {
    const h = this.hunter;
    if (!lashActive(h) || !h.lash) return;
    const rect = whipRect(h, this.whipLevel);
    if (!rect) return;
    const damage = whipDamage(this.whipLevel) * this.damageBoost();
    for (const e of this.enemies) {
      if (e.state === 'gone' || this.struck.has(e.id)) continue;
      const er = enemyRect(e);
      if (!er || !overlaps(rect, er)) continue;
      this.struck.add(e.id);
      e.hp -= damage;
      e.flash = 0.12;
      this.ctx.sfx.noise({ duration: 0.06, volume: 0.12, filterFreq: 1800 });
      if (e.hp <= 0) this.killEnemy(e);
      else e.x += h.facing * 10;
    }
    for (const candle of this.level.candles) {
      if (this.broken.has(candle.id)) continue;
      if (overlaps(rect, { x: candle.x - 12, y: candle.y - 18, w: 24, h: 42 })) this.breakCandle(candle.id);
    }
    this.shots = this.shots.filter((s) => {
      if (!circleHits(s.x, s.y, s.radius + 4, rect)) return true;
      this.burst(s.x, s.y, 0xffffff, 6);
      this.removeShot(s);
      return false;
    });
    if (this.boss && bossHittable(this.boss) && overlaps(rect, bossRect(this.boss))) {
      if (hitBoss(this.boss, damage)) {
        this.ctx.sfx.noise({ duration: 0.1, volume: 0.16, filterFreq: 1400 });
        this.ctx.sfx.tone({ freq: 300, slideTo: 180, duration: 0.15, type: 'square', volume: 0.07 });
        if (this.boss.mode === 'dead') this.bossDefeated();
      }
    }
  }

  private killEnemy(e: Enemy): void {
    e.state = 'gone';
    this.removeEnemyImage(e, true);
    this.ctx.sfx.tone({ freq: 500, slideTo: 160, duration: 0.18, type: 'triangle', volume: 0.08 });
    if (e.summoned) return;
    const y = WALKERS.has(e.kind) ? e.y - 40 : e.y;
    if (this.guaranteeArmed && this.whipLevel < MAX_WHIP) {
      this.dropItem('whip', e.x, y);
    } else if (this.random.frac() < C.dropChance) {
      const roll = this.random.frac();
      const whip = this.whipLevel < MAX_WHIP ? C.whipDropShare : 0;
      this.dropItem(roll < whip ? 'whip' : roll < whip + C.daggerDropShare ? 'dagger' : 'heart', e.x, y);
    }
  }

  private breakCandle(id: number): void {
    if (this.broken.has(id)) return;
    const candle = this.level.candles.find((c) => c.id === id);
    if (!candle) return;
    this.broken.add(id);
    this.candlesBroken++;
    const image = this.candleImages.get(id);
    image?.destroy();
    this.candleImages.delete(id);
    this.burst(candle.x, candle.y - 8, 0xffb030, 10);
    // Pasi 22.10.: every candle gives a coin for the shop.
    this.coins += C.coinsPerCandle;
    this.floatText(candle.x, candle.y - 30, `+${C.coinsPerCandle}`, CSS.gold);
    const coin = this.inWorld(addAsset(this, COIN, candle.x, candle.y - 10).setDepth(32));
    this.tweens.add({ targets: coin, y: candle.y - 70, alpha: 0, duration: 650, ease: 'Sine.Out', onComplete: () => coin.destroy() });
    this.ctx.sfx.tone({ freq: 880, slideTo: 1320, duration: 0.12, type: 'triangle', volume: 0.07 });
    if (candle.drop) this.dropItem(candle.drop === 'whip' && this.whipLevel >= MAX_WHIP ? 'heart' : candle.drop, candle.x, candle.y);
  }

  private checkHazards(): void {
    const hr = hunterRect(this.hunter);
    for (const p of this.level.pendulums) {
      const point = bladePoint(p, this.levelTime, BLADE_REACH);
      if (circleHits(point.x, point.y, BLADE_RADIUS, hr)) this.hurt(point.x);
    }
    if (this.boss) {
      if (bossHarmful(this.boss) && overlaps(bossRect(this.boss), hr)) this.hurt(this.boss.x);
      if (pillarHits(this.boss, this.hunter.x)) this.hurt(this.hunter.x - this.hunter.facing);
    }
  }

  // ---------------------------------------------------------------- the head witch

  private startBoss(): void {
    const arena = this.level.arena!;
    this.phase = 'boss';
    this.phaseTime = 0;
    this.boss = newBoss(arena);
    this.bossImage = this.levelObject(addAsset(this, WITCH, this.boss.x, this.boss.y).setDepth(18));
    this.showMessage('Päänoita!', '', 1.6);
    this.ctx.sfx.tone({ freq: 140, slideTo: 70, duration: 1.4, type: 'sawtooth', volume: 0.1 });
  }

  private stepBoss(dt: number): void {
    const b = this.boss;
    if (!b) return;
    const arena = this.level.arena!;
    updateBoss(b, {
      dt,
      hx: this.hunter.x,
      hcy: this.hunter.y - HUNTER_H / 2,
      arena,
      shoot: (shot) => this.addShot(shot),
      summon: (kind, x, y) => {
        const e = newEnemy({ id: this.nextId++, kind, x, y }, true);
        this.enemies.push(e);
        this.addEnemyImage(e);
        if (kind === 'skeleton') this.ctx.sfx.noise({ duration: 0.5, volume: 0.08, filterFreq: 220, filterType: 'lowpass' });
      },
      cue: (name) => this.bossCue(name),
    });
  }

  private bossCue(name: 'laugh' | 'cast' | 'swoop' | 'rage' | 'pillar' | 'fire'): void {
    const sfx = this.ctx.sfx;
    if (name === 'laugh' || name === 'rage') {
      for (let i = 0; i < 4; i++) sfx.tone({ freq: 620 - i * 40, slideTo: 760 - i * 40, duration: 0.12, type: 'square', volume: 0.06, delay: i * 0.14 });
      if (name === 'rage') {
        this.cameras.main.shake(400, 0.008);
        this.cameras.main.flash(250, 160, 60, 220);
      }
    } else if (name === 'cast') sfx.tone({ freq: 400, slideTo: 900, duration: 0.5, type: 'sine', volume: 0.08 });
    else if (name === 'swoop') sfx.noise({ duration: 0.8, volume: 0.08, filterFreq: 900, filterType: 'bandpass' });
    else if (name === 'pillar') sfx.tone({ freq: 200, slideTo: 400, duration: 0.8, type: 'triangle', volume: 0.08 });
    else sfx.noise({ duration: 0.3, volume: 0.1, filterFreq: 600 });
  }

  private bossDefeated(): void {
    this.phase = 'won';
    this.phaseTime = 0;
    for (const e of this.enemies) if (e.state !== 'gone') this.killEnemy(e);
    for (const s of this.shots) this.removeShot(s);
    this.shots = [];
    this.cameras.main.flash(500, 255, 240, 200);
    this.ctx.sfx.play('fanfare');
    this.showMessage('Päänoita kaatui!', 'Metsä on vapaa.');
  }

  // ---------------------------------------------------------------- drawing

  private draw(): void {
    this.updateCamera();
    const h = this.hunter;
    const t = this.levelTime;

    // Hunter
    this.hunterImage.setPosition(Math.round(h.x), Math.round(h.y)).setFlipX(h.facing < 0).setFrame(this.hunterFrame());
    this.hunterImage.setAlpha(h.invulnerable > 0 && this.phase !== 'dead' && Math.floor(this.time.now / 70) % 2 === 0 ? 0.35 : 1);
    if (this.phase === 'dead') this.hunterImage.setAngle(-h.facing * Math.min(90, this.phaseTime * 220));
    else this.hunterImage.setAngle(0);
    this.drawWhip();

    // Moving platforms and crumbling floors
    for (const p of this.world.platforms) {
      const parts = this.moverImages.get(p.id);
      parts?.[0].setPosition(p.rect.x, p.rect.y);
      parts?.[1].setPosition(p.rect.x + TILE, p.rect.y);
    }

    // Swinging blades and spider threads
    this.threads.clear();
    for (const p of this.level.pendulums) {
      const point = bladePoint(p, t);
      this.threads.lineStyle(6, 0x2a2236, 1).lineBetween(p.x, p.y, point.x, point.y);
      this.threads.lineStyle(2, 0x7a8094, 1).lineBetween(p.x, p.y, point.x, point.y);
      this.threads.fillStyle(0x4a4f60, 1).fillCircle(p.x, p.y + 4, 7);
      this.bladeImages.get(p.id)?.setPosition(point.x, point.y).setRotation(-pendulumAngle(p, t));
    }
    for (const e of this.enemies) {
      if (e.kind === 'spider' && e.state !== 'gone') {
        this.threads.lineStyle(2, 0xd8d0e8, 0.6).lineBetween(e.x, e.homeY - 14, e.x, e.y - 10);
      }
    }

    // Candles flicker
    const flicker = Math.floor(this.time.now / 160) % 2;
    for (const image of this.candleImages.values()) image.setFrame(flicker);

    // Enemies
    for (const e of this.enemies) this.drawEnemy(e);
    for (const s of this.shots) {
      s.image.setPosition(s.x, s.y);
      if (s.kind === 'axe') s.image.setRotation(this.time.now / 60);
      if (s.kind === 'orb') s.image.setFrame(Math.floor(this.time.now / 120) % 2);
    }

    // Head witch and her fire pillars
    this.effects.clear();
    if (this.boss && this.bossImage) {
      const b = this.boss;
      const frame = b.mode === 'dead' ? 3 : b.flash > 0 ? 3 : b.mode === 'cast' || b.mode === 'pillars' || b.mode === 'rage' ? 2 : Math.floor(this.time.now / 160) % 2;
      this.bossImage.setPosition(b.x, b.y).setFlipX(b.facing < 0).setFrame(frame);
      if (b.flash > 0) this.bossImage.setTintFill(0xffffff);
      else this.bossImage.clearTint();
      this.bossImage.setAlpha(b.mode === 'dead' ? Math.max(0, 1 - this.phaseTime / 2.5) : 1);
      if (b.mode === 'dead') this.bossImage.setAngle(this.phaseTime * 200);
      const floor = this.level.arena!.floorY;
      for (const p of b.pillars) {
        if (p.t < PILLAR_WARNING) {
          const pulse = 0.35 + 0.35 * Math.sin(p.t * 20);
          this.effects.fillStyle(0x8fdc5a, pulse).fillRect(p.x - PILLAR_HALF_W, floor - 8, PILLAR_HALF_W * 2, 8);
        } else {
          const life = (p.t - PILLAR_WARNING) / PILLAR_FIRE;
          const alpha = life < 0.8 ? 0.9 : (1 - life) * 4.5;
          this.effects.fillStyle(0x3fd06a, alpha * 0.55).fillRect(p.x - PILLAR_HALF_W - 6, floor - 520, PILLAR_HALF_W * 2 + 12, 520);
          this.effects.fillStyle(0xb6f07a, alpha).fillRect(p.x - PILLAR_HALF_W + 6, floor - 520, PILLAR_HALF_W * 2 - 12, 520);
          this.effects.fillStyle(0xffffff, alpha * 0.8).fillRect(p.x - 6, floor - 520, 12, 520);
        }
      }
    }

    // Parallax
    const offset = this.fixedOffset();
    const lowest = this.level.height + BOTTOM_MARGIN - H;
    const lift = (lowest - this.camY) * 0.25;
    const theme = THEMES[this.level.theme];
    this.landscape.setPosition(W / 2 + offset.x, H - theme.landscape.height / 2 + offset.y + lift);
    this.landscape.tilePositionX = (this.camX * 0.35) / this.landscape.tileScaleX;

    this.refreshHud();
  }

  private hunterFrame(): number {
    const h = this.hunter;
    if (this.phase === 'dead' || h.knockback > 0) return HUNTER_FRAME.hurt;
    if (h.lash) {
      const windup = h.lash.t < C.whipWindupSeconds;
      if (h.lash.kind === 'low') return windup ? HUNTER_FRAME.crouch : HUNTER_FRAME.lashLow;
      if (windup) return HUNTER_FRAME.windup;
      return h.lash.kind === 'up' ? HUNTER_FRAME.lashUp : HUNTER_FRAME.lash;
    }
    if (this.throwPose > 0) return h.crouching ? HUNTER_FRAME.lashLow : HUNTER_FRAME.lash;
    if (h.crouching) return HUNTER_FRAME.crouch;
    if (!h.onGround) return HUNTER_FRAME.jump;
    if (Math.abs(h.vx) > 30) {
      const cycle = [1, 2, 3, 2];
      return cycle[Math.floor(this.time.now / 110) % cycle.length];
    }
    return HUNTER_FRAME.idle;
  }

  private drawWhip(): void {
    const h = this.hunter;
    const active = h.lash !== null && lashActive(h) && this.phase !== 'dead';
    this.whipImage.setVisible(active);
    if (!active || !h.lash) return;
    this.whipImage.setFrame(this.whipLevel - 1);
    if (h.lash.kind === 'up') {
      this.whipImage.setOrigin(0, 0.5).setFlipX(false).setAngle(-90).setPosition(h.x + h.facing * 5, h.y - HUNTER_H - 10);
      return;
    }
    const handY = h.y - (h.lash.kind === 'low' ? 28 : 57);
    const left = h.facing < 0;
    this.whipImage.setAngle(0).setOrigin(left ? 1 : 0, 0.5).setFlipX(left).setPosition(h.x + h.facing * 27, handY);
  }

  private drawEnemy(e: Enemy): void {
    const image = this.enemyImages.get(e.id);
    if (!image || e.state === 'gone') return;
    const now = this.time.now;
    const step = Math.floor(now / 180) % 2;
    let frame = 0;
    let y = e.y;
    let rise = 1;
    switch (e.kind) {
      case 'zombie':
      case 'skeleton': {
        rise = riseShare(e);
        image.setVisible(rise > 0);
        frame = e.state === 'move' ? step : 0;
        y = e.y + (1 - rise) * image.displayHeight;
        break;
      }
      case 'bat':
        frame = e.state === 'idle' ? 0 : 1 + (Math.floor(now / 90) % 2);
        break;
      case 'raven':
        frame = e.state === 'idle' ? 0 : 1 + (Math.floor(now / 100) % 2);
        break;
      case 'armor':
        frame = e.state === 'attack' ? 2 : step;
        break;
      case 'wolf':
        frame = e.state === 'idle' || e.state === 'rise' ? 0 : e.state === 'return' ? 1 : 1 + (Math.floor(now / 90) % 2);
        break;
      case 'mushroom':
        frame = e.state === 'attack' ? 1 : 0;
        break;
      default:
        frame = step;
    }
    image.setFrame(frame).setPosition(Math.round(e.x), Math.round(y)).setFlipX(e.facing < 0);
    // A rising zombie shows only the part above the ground.
    if (rise < 1) image.setCrop(0, 0, image.frame.realWidth, image.frame.realHeight * rise);
    else if (image.isCropped) image.setCrop();
    if (e.kind === 'wisp') image.setAlpha(0.75 + Math.sin(now / 150) * 0.2);
    if (e.flash > 0) image.setTintFill(0xffffff);
    else image.clearTint();
  }

  private addEnemyImage(e: Enemy): void {
    const spec = ENEMY_ART[e.kind];
    const image = addAsset(this, spec, e.x, e.y, { origin: WALKERS.has(e.kind) ? [0.5, 1] : [0.5, 0.5] }).setDepth(15);
    this.enemyImages.set(e.id, this.levelObject(image));
    this.drawEnemy(e);
  }

  private removeEnemyImage(e: Enemy, defeated: boolean): void {
    const image = this.enemyImages.get(e.id);
    if (!image) return;
    this.enemyImages.delete(e.id);
    if (!defeated) {
      image.destroy();
      return;
    }
    this.burst(image.x, image.y - (image.originY === 1 ? image.displayHeight / 2 : 0), 0xf4ecd8, 12);
    image.setTintFill(0xffffff);
    this.tweens.add({ targets: image, alpha: 0, scaleX: image.scaleX * 1.3, scaleY: image.scaleY * 0.6, duration: 260, onComplete: () => image.destroy() });
  }

  private updateCamera(): void {
    const h = this.hunter;
    const arena = this.level.arena;
    if ((this.phase === 'boss' || this.phase === 'won') && arena) {
      const target = arena.left + (arena.right - arena.left - W) / 2;
      this.camX += (target - this.camX) * 0.08;
      this.camY += (this.level.height + BOTTOM_MARGIN - H - this.camY) * 0.08;
    } else if (this.phase !== 'dead') {
      this.lookAhead += (h.facing * 70 - this.lookAhead) * 0.04;
      this.camX += (this.cameraTargetX() - this.camX) * 0.15;
      this.camY += (this.cameraTargetY() - this.camY) * 0.1;
    }
    this.cameras.main.centerOn(this.camX + W / 2, this.camY + H / 2);
  }

  private cameraTargetX(): number {
    const max = Math.max(0, this.level.width - W);
    return Phaser.Math.Clamp(this.hunter.x - W * 0.42 + this.lookAhead, 0, max);
  }

  private cameraTargetY(): number {
    const max = this.level.height + BOTTOM_MARGIN - H;
    return Phaser.Math.Clamp(this.hunter.y - H * 0.64, Math.min(0, max), max);
  }

  /** Where a scrollFactor(0) object must be placed to appear at screen (0, 0) under the main camera's zoom. */
  private fixedOffset(): { x: number; y: number } {
    return { x: (W * (ZOOM - 1)) / 2, y: (H * (ZOOM - 1)) / 2 };
  }

  private buildTiles(): void {
    const level = this.level;
    const spec = THEMES[level.theme].tiles;
    const key = assetKey(spec);
    const frameFor = (col: number, row: number): number | null => {
      const ch = tileAt(level, col, row);
      if (ch === '#') return tileAt(level, col, row - 1) === '#' || tileAt(level, col, row - 1) === 'C' ? 1 : 0;
      if (ch === '=') return 2;
      return null;
    };
    for (let row = 0; row < level.rows; row++) {
      let col = 0;
      while (col < level.cols) {
        const frame = frameFor(col, row);
        if (frame === null) {
          col++;
          continue;
        }
        let end = col;
        while (end + 1 < level.cols && frameFor(end + 1, row) === frame) end++;
        const width = (end - col + 1) * TILE;
        const tile = this.add.tileSprite(col * TILE + width / 2, row * TILE + TILE / 2, width, TILE, key, frame);
        const f = this.textures.getFrame(key, frame);
        tile.setTileScale(TILE / f.width, TILE / f.height);
        this.levelObject(tile.setDepth(frame === 2 ? 4 : 2));
        col = end + 1;
      }
    }
    for (const c of level.crumbles) {
      const image = this.levelObject(addAsset(this, spec, c.col * TILE, c.row * TILE, { frame: 3, origin: [0, 0] }).setDepth(3));
      this.crumbles.set(crumbleKey(c.col, c.row), { col: c.col, row: c.row, state: 'solid', t: 0, image });
    }
  }

  /** Small decorations on the ground; the same every time. */
  private buildDecor(): void {
    const level = this.level;
    const spec = THEMES[level.theme].decor;
    const rand = seeded(level.index * 977 + 13);
    const busy = new Set<number>();
    for (const thing of [...level.candles, ...level.enemies, level.start, ...(level.gate ? [level.gate] : [])]) {
      const col = Math.floor(thing.x / TILE);
      for (let c = col - 1; c <= col + 1; c++) busy.add(c);
    }
    let last = -10;
    for (let col = 0; col < level.cols; col++) {
      for (let row = 1; row < level.rows; row++) {
        if (tileAt(level, col, row) !== '#' || tileAt(level, col, row - 1) !== '.' || tileAt(level, col, row - 2) !== '.') continue;
        const roll = rand();
        if (busy.has(col) || col - last < 3 || roll > 0.22) continue;
        let indoors = false;
        for (let r = row - 3; r >= Math.max(0, row - 12); r--) if (tileAt(level, col, r) === '#') indoors = true;
        if (level.theme === 'linna' ? !indoors : indoors) continue;
        last = col;
        const frame = Math.floor(rand() * DECOR_FRAMES[level.theme].length);
        this.levelObject(addAsset(this, spec, col * TILE + TILE / 2, row * TILE, { frame, origin: [0.5, 1] }).setDepth(1).setAlpha(0.92));
      }
    }
  }

  // ---------------------------------------------------------------- HUD

  private buildHud(): void {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.night, 0.72);
    panel.fillRoundedRect(16, 12, 300, 108, 14);
    panel.fillRoundedRect(W - 316, 12, 300, 82, 14);
    panel.fillRoundedRect(W / 2 - 200, 12, 400, 56, 14);
    // Room for the bought extra hearts too.
    for (let i = 0; i < C.maxHealth + C.shop.extraHeartsMax; i++) this.hearts.push(addAsset(this, HUD_HEART, 42 + i * 34, 38, { width: 30, height: 27, frame: 0 }));
    this.whipText = this.add.text(30, 72, '', { ...TEXT.bodyBold, fontSize: '19px', color: CSS.gold }).setOrigin(0, 0.5);
    this.daggerText = this.add.text(30, 100, '', { ...TEXT.bodyBold, fontSize: '19px', color: CSS.silver }).setOrigin(0, 0.5);
    this.levelText = this.add.text(W / 2, 30, '', { ...TEXT.bodyBold, fontSize: '22px', color: CSS.bone }).setOrigin(0.5, 0.5);
    this.progressBar = this.add.graphics();
    // Pasi 22.10.: no points during play; coins instead.
    this.coinIcon = addAsset(this, COIN, W - 140, 38, { width: 26, height: 26 });
    this.coinText = this.add.text(W - 30, 38, '', { ...TEXT.bodyBold, fontSize: '26px', color: CSS.gold }).setOrigin(1, 0.5);
    this.candleText = this.add.text(W - 30, 72, '', { ...TEXT.bodyBold, fontSize: '19px', color: CSS.bone }).setOrigin(1, 0.5);
    this.bossBar = this.add.graphics();
    this.bossLabel = this.add.text(W / 2, 96, 'Päänoita', { ...TEXT.bodyBold, fontSize: '20px', color: CSS.red }).setOrigin(0.5, 0.5).setVisible(false);
    this.bossLabel.setShadow(0, 2, '#000000', 4, true, true);
    this.message = this.add.text(W / 2, H / 2 - 70, '', { ...TEXT.title, fontSize: '72px', align: 'center' }).setOrigin(0.5).setVisible(false);
    this.subMessage = this.add.text(W / 2, H / 2 + 6, '', { ...TEXT.heading, fontSize: '40px', align: 'center' }).setOrigin(0.5).setVisible(false);
    this.subMessage.setShadow(0, 3, '#000000', 8, true, true);
    this.buildShop();
    addKeyHints(this, [
      ['←→', 'Liiku'],
      ['Välilyönti', 'Hyppää'],
      ['X', 'Lyö'],
      ['↑ + X', 'Ylös'],
      ['C', 'Tikari'],
      ['↓', 'Kyyristy'],
    ]);
    // Everything made so far (except the world) belongs to the HUD camera.
    const layers: unknown[] = [this.worldLayer, this.hudLayer];
    for (const obj of [...this.children.list]) {
      if (!layers.includes(obj) && !this.worldLayer.exists(obj)) this.hudLayer.add(obj);
    }
  }

  private refreshHud(): void {
    const cap = this.heartCap();
    if (this.health !== this.shown.health || cap !== this.shown.maxHealth) {
      this.shown.health = this.health;
      this.shown.maxHealth = cap;
      this.hearts.forEach((heart, i) => heart.setVisible(i < cap).setFrame(this.health >= i + 1 ? 0 : this.health >= i + 0.5 ? 1 : 2));
    }
    if (this.whipLevel !== this.shown.whip) {
      this.shown.whip = this.whipLevel;
      this.whipText.setText(`${WHIP_NAMES[this.whipLevel - 1]} (${this.whipLevel}/${MAX_WHIP})`);
    }
    if (this.daggers !== this.shown.daggers) {
      this.shown.daggers = this.daggers;
      this.daggerText.setText(`Tikarit: ${this.daggers}`).setAlpha(this.daggers > 0 ? 1 : 0.5);
    }
    if (this.coins !== this.shown.coins) {
      this.shown.coins = this.coins;
      this.coinText.setText(`Kolikot: ${this.coins}`);
      this.coinIcon.setX(this.coinText.x - this.coinText.width - 22);
    }
    const candles = `Kynttilät: ${this.broken.size}/${this.level.candles.length}`;
    if (candles !== this.shown.candles) {
      this.shown.candles = candles;
      this.candleText.setText(candles);
    }
    if (this.levelIndex !== this.shown.level) {
      this.shown.level = this.levelIndex;
      this.levelText.setText(`Kenttä ${this.levelIndex + 1}/3: ${this.level.name}`);
    }
    const progress = this.phase === 'levelDone' ? 1 : this.level.arena && this.boss ? 1 : this.bestProgress;
    if (progress !== this.shown.progress) {
      this.shown.progress = progress;
      const g = this.progressBar.clear();
      g.fillStyle(COLORS.panelLight, 1).fillRoundedRect(W / 2 - 170, 50, 340, 8, 4);
      if (progress > 0) g.fillStyle(COLORS.orange, 1).fillRoundedRect(W / 2 - 170, 50, Math.max(8, 340 * progress), 8, 4);
    }
    const bossHp = this.boss && this.boss.mode !== 'enter' ? this.boss.hp / this.boss.maxHp : -1;
    if (bossHp !== this.shown.boss) {
      this.shown.boss = bossHp;
      const g = this.bossBar.clear();
      this.bossLabel.setVisible(bossHp >= 0);
      if (bossHp >= 0) {
        g.fillStyle(COLORS.night, 0.75).fillRoundedRect(W / 2 - 260, 110, 520, 24, 10);
        g.fillStyle(COLORS.panelLight, 1).fillRoundedRect(W / 2 - 250, 116, 500, 12, 6);
        if (bossHp > 0) g.fillStyle(COLORS.red, 1).fillRoundedRect(W / 2 - 250, 116, Math.max(12, 500 * bossHp), 12, 6);
        g.fillStyle(COLORS.night, 1);
        for (const mark of [1 / 3, 2 / 3]) g.fillRect(W / 2 - 250 + 500 * mark - 1.5, 112, 3, 20);
      }
    }
  }

  // ---------------------------------------------------------------- the shop (Pasi 22.10.)

  private buildShop(): void {
    const box = this.add.container(0, 0).setVisible(false);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.97).fillRoundedRect(W / 2 - 430, 88, 860, 556, 20);
    panel.lineStyle(3, COLORS.border, 1).strokeRoundedRect(W / 2 - 430, 88, 860, 556, 20);
    box.add([this.add.rectangle(W / 2, H / 2, W, H, COLORS.night, 0.7), panel]);
    box.add(this.add.text(W / 2, 132, 'Kauppa', { ...TEXT.title, fontSize: '58px' }).setOrigin(0.5));
    this.shopCoins = this.add.text(W / 2, 188, '', { ...TEXT.bodyBold, fontSize: '26px', color: CSS.gold }).setOrigin(0.5);
    box.add(this.shopCoins);
    for (let i = 0; i <= SHOP_ITEMS.length; i++) {
      const y = 222 + i * 76;
      const row = {
        box: this.add.graphics(),
        name: this.add.text(W / 2 - 392, y + 22, '', { ...TEXT.bodyBold, fontSize: '25px', color: CSS.bone }).setOrigin(0, 0.5),
        info: this.add.text(W / 2 - 392, y + 50, '', { ...TEXT.body, fontSize: '19px', color: CSS.muted }).setOrigin(0, 0.5),
        price: this.add.text(W / 2 + 392, y + 36, '', { ...TEXT.bodyBold, fontSize: '25px', color: CSS.gold }).setOrigin(1, 0.5),
      };
      box.add([row.box, row.name, row.info, row.price]);
      this.shopRows.push(row);
    }
    box.add(this.add.text(W / 2, 616, '↑ ↓ valitse     Enter osta tai jatka', { ...TEXT.body, fontSize: '20px', color: CSS.muted }).setOrigin(0.5));
    this.shopLayer = box;
  }

  private openShop(): void {
    this.phase = 'shop';
    this.phaseTime = 0;
    this.shopIndex = 0;
    this.tweens.killTweensOf([this.message, this.subMessage]);
    this.message.setVisible(false);
    this.subMessage.setVisible(false);
    this.shopLayer.setVisible(true);
    this.refreshShop();
  }

  private closeShop(): void {
    if (this.phase !== 'shop') return;
    this.shopLayer.setVisible(false);
    this.phase = 'intro';
    this.phaseTime = 0;
    this.showMessage(`Kenttä ${this.levelIndex + 1}/3`, this.level.name);
  }

  private shopMove(step: number): boolean {
    const rows = SHOP_ITEMS.length + 1;
    this.shopIndex = (this.shopIndex + rows + step) % rows;
    this.ctx.sfx.play('move');
    this.refreshShop();
    return true;
  }

  /** Enter in the shop: buy the chosen item, or go on to the level. */
  private shopEnter(): boolean {
    if (this.shopIndex >= SHOP_ITEMS.length) {
      this.ctx.sfx.play('select');
      this.closeShop();
      return true;
    }
    const item = SHOP_ITEMS[this.shopIndex];
    const next = buy(this.run(), item);
    if (!next) {
      this.ctx.sfx.play('error');
      return true;
    }
    this.whipLevel = next.whip;
    this.daggers = next.daggers;
    this.coins = next.coins;
    this.extraHearts = next.extraHearts;
    this.sharpen = next.sharpen;
    if (item === 'heart') this.health = this.heartCap();
    this.ctx.sfx.play('correct');
    this.refreshShop();
    return true;
  }

  private refreshShop(): void {
    const run = this.run();
    this.shopCoins.setText(`Kolikot: ${this.coins}`);
    this.shopRows.forEach((row, i) => {
      const selected = i === this.shopIndex;
      const y = 222 + i * 76;
      row.box.clear();
      row.box.fillStyle(selected ? COLORS.panelLight : COLORS.bg, selected ? 1 : 0.6).fillRoundedRect(W / 2 - 410, y, 820, 68, 12);
      if (selected) row.box.lineStyle(3, COLORS.orange, 1).strokeRoundedRect(W / 2 - 410, y, 820, 68, 12);
      if (i === SHOP_ITEMS.length) {
        row.name.setText(`Jatka kenttään ${this.levelIndex + 1}: ${this.level.name}`).setColor(CSS.orange);
        row.info.setText('Jäljelle jääneet kolikot säilyvät seuraavaan kauppaan.');
        row.price.setText('');
        return;
      }
      const o = offer(run, SHOP_ITEMS[i]);
      row.name.setText(o.count ? `${o.name}  (${o.count})` : o.name).setColor(o.soldOut ? CSS.grey : CSS.bone);
      row.info.setText(o.description);
      row.price.setText(o.soldOut ? 'Täynnä' : `${o.price} kolikkoa`).setColor(o.affordable ? CSS.gold : CSS.grey);
    });
  }

  private showMessage(title: string, sub: string, hideAfter = 0): void {
    this.tweens.killTweensOf([this.message, this.subMessage]);
    this.message.setText(title).setVisible(true).setAlpha(1).setScale(0.7);
    this.subMessage.setText(sub).setVisible(sub !== '').setAlpha(1);
    this.tweens.add({ targets: this.message, scale: 1, duration: 420, ease: 'Back.Out' });
    if (hideAfter > 0) this.time.delayedCall(hideAfter * 1000, () => this.hideMessage());
  }

  private hideMessage(): void {
    this.tweens.killTweensOf([this.message, this.subMessage]);
    this.tweens.add({ targets: [this.message, this.subMessage], alpha: 0, duration: 300 });
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.inWorld(this.add.text(x, y, text, { ...TEXT.bodyBold, fontSize: '22px', color }).setOrigin(0.5).setDepth(40));
    label.setShadow(0, 2, '#000000', 4, true, true);
    this.tweens.add({ targets: label, y: y - 40, alpha: 0, duration: 800, onComplete: () => label.destroy() });
  }

  private burst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const size = 6;
      const bit = this.inWorld(this.add.rectangle(x, y, size, size, color).setDepth(31));
      const angle = (i / count) * Math.PI * 2 + this.random.frac();
      const distance = 26 + this.random.frac() * 30;
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 380,
        onComplete: () => bit.destroy(),
      });
    }
  }

  private inWorld<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.worldLayer.add(obj);
    return obj;
  }

  /** A world object that belongs to the current level (destroyed when the level changes). */
  private levelObject<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.inWorld(obj);
    this.levelObjects.push(obj);
    return obj;
  }
}

function circleHits(x: number, y: number, r: number, rect: Rect): boolean {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
