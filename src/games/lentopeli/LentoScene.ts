import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { onKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { H, W } from '../../ui/screen';
import { COLORS, CSS, TEXT } from '../../ui/theme';
import { assetKey, type AssetSpec, type GameContext, type GameSceneData } from '../types';
import { CAGE, CAT, CHAIN, FAR, FINISH, GROUND, INQUISITOR, PILLAR, SKY, WITCH } from './assets';
import {
  buildCourse,
  distancePoints,
  GATE_WIDTH,
  GOAL_DISTANCE,
  GROUND_Y,
  hitsGate,
  stepWitch,
  targetSpeed,
  WITCH_X,
  type Gate,
} from './logic';

const C = CONFIG.lentopeli;
const WITCH_RADIUS = 24;
/** Witch hitbox half sizes (smaller than the picture, to be fair). */
const HIT_HALF_W = 26;
const HIT_HALF_H = 16;
const CAT_PICKUP = 46;
const BAR_X = 380;
const BAR_W = 520;
const BAR_Y = 34;

type Phase = 'ready' | 'flying' | 'crashing' | 'finished';

interface GateView {
  container: Phaser.GameObjects.Container;
  cat: Phaser.GameObjects.Image | null;
}

/** A tiling image sized by the spec, so replacement pictures of any resolution tile at the right size. */
function addTile(scene: Phaser.Scene, spec: AssetSpec, x: number, y: number, w: number, h: number, vertical: boolean): Phaser.GameObjects.TileSprite {
  const key = assetKey(spec);
  const tile = scene.add.tileSprite(x, y, w, h, key);
  const frame = scene.textures.getFrame(key);
  const scale = vertical ? spec.width / frame.width : spec.height / frame.height;
  tile.setTileScale(scale, scale);
  return tile;
}

/** Flying game: Space lifts the witch; avoid the obstacles, collect black cats, reach the gate. One attempt. */
export class LentoScene extends Phaser.Scene {
  private ctx!: GameContext;
  private course: Gate[] = [];
  private phase: Phase = 'ready';
  private distance = 0;
  private speed = 0;
  private y = 300;
  private vy = 0;
  private cats = 0;
  private invulnerable = 0;
  private collected = new Set<number>();
  private views = new Map<number, GateView>();
  private finished = false;

  private far!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.TileSprite;
  private witch!: Phaser.GameObjects.Image;
  private finishGate!: Phaser.GameObjects.Image;
  private barFill!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Image;
  private catIcons: Phaser.GameObjects.Image[] = [];
  private pointsText!: Phaser.GameObjects.Text;
  private readyText!: Phaser.GameObjects.Text;

  constructor() {
    super('Lentopeli');
  }

  init(data: GameSceneData): void {
    this.ctx = data.ctx;
    this.course = buildCourse();
    this.phase = 'ready';
    this.distance = 0;
    this.speed = 0;
    this.y = 300;
    this.vy = 0;
    this.cats = 0;
    this.invulnerable = 0;
    this.collected = new Set();
    this.views = new Map();
    this.catIcons = [];
    this.finished = false;
  }

  create(): void {
    addAsset(this, SKY, W / 2, H / 2, { fit: 'cover' });
    this.far = addTile(this, FAR, W / 2, GROUND_Y - FAR.height / 2 + 20, W, FAR.height, false);
    this.finishGate = addAsset(this, FINISH, -1000, GROUND_Y, { origin: [0.5, 1] });
    this.witch = addAsset(this, WITCH, WITCH_X, this.y).setDepth(5);
    this.ground = addTile(this, GROUND, W / 2, GROUND_Y + (H - GROUND_Y) / 2, W, H - GROUND_Y, false).setDepth(4);
    this.ground.setTileScale((H - GROUND_Y) / this.textures.getFrame(assetKey(GROUND)).height);

    this.buildHud();
    this.readyText = this.add
      .text(W / 2, H / 2 + 90, 'Paina välilyöntiä, niin noita lähtee lentoon!', { ...TEXT.heading, fontSize: '40px', align: 'center' })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: this.readyText, alpha: { from: 1, to: 0.5 }, duration: 900, yoyo: true, repeat: -1 });
    addKeyHints(this, [
      ['Välilyönti', 'Lennä ylöspäin'],
      ['Esc', 'Tauko'],
    ]);
    onKeys(this, { ' ': () => this.flap(), ArrowUp: () => this.flap() });
    this.layout();
  }

  override update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    if (this.phase === 'ready') {
      this.y = 300 + Math.sin(time / 300) * 8;
      this.witch.setY(this.y);
      return;
    }
    if (this.phase === 'crashing') {
      this.vy = Math.min(C.maxFallSpeed * 1.4, this.vy + C.gravity * dt);
      this.y = Math.min(GROUND_Y - 10, this.y + this.vy * dt);
      this.witch.setY(this.y).setAngle(this.witch.angle + 360 * dt);
      return;
    }
    if (this.phase !== 'flying') return;

    this.speed = Math.min(targetSpeed(this.distance), this.speed + C.acceleration * dt);
    this.distance = Math.min(GOAL_DISTANCE, this.distance + this.speed * dt);
    const step = stepWitch(this.y, this.vy, dt, WITCH_RADIUS);
    this.y = step.y;
    this.vy = step.vy;
    this.witch.setY(this.y).setRotation(Phaser.Math.Clamp(this.vy / 900, -0.35, 0.5));

    if (this.invulnerable > 0) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      // Stay protected until clear of the obstacle that was hit.
      if (this.invulnerable === 0 && this.touchingGate()) this.invulnerable = 0.2;
      this.witch.setAlpha(this.invulnerable > 0 && Math.floor(time / 90) % 2 === 0 ? 0.35 : 1);
    } else if (this.touchingGate()) {
      this.hit();
    }
    this.collectCats();
    this.layout();
    if (this.distance >= GOAL_DISTANCE) this.reachGoal();
  }

  getTestState(): unknown {
    const next = this.course.find((g) => g.x + GATE_WIDTH / 2 >= this.distance);
    return {
      phase: this.phase,
      distance: Math.round(this.distance),
      goal: GOAL_DISTANCE,
      speed: Math.round(this.speed),
      y: Math.round(this.y),
      cats: this.cats,
      invulnerable: this.invulnerable > 0,
      points: this.points(),
      nextGate: next ? { index: next.index, x: next.x, gapTop: next.gapTop, gapBottom: next.gapBottom, hasCat: next.hasCat } : null,
    };
  }

  /** Test helper: move the witch (distance along the course and height) without flying there. */
  debugPlace(distance: number, y: number): void {
    this.distance = Phaser.Math.Clamp(distance, 0, GOAL_DISTANCE);
    this.y = y;
    this.vy = 0;
    if (this.phase === 'ready') this.start();
    this.layout();
  }

  // ---------------------------------------------------------------- flying

  private flap(): void {
    if (this.phase === 'ready') this.start();
    if (this.phase !== 'flying') return;
    this.vy = C.flapVelocity;
    this.ctx.sfx.tone({ freq: 420, slideTo: 640, duration: 0.12, type: 'triangle', volume: 0.25 });
  }

  private start(): void {
    this.phase = 'flying';
    this.tweens.killTweensOf(this.readyText);
    this.readyText.destroy();
    this.ctx.sfx.play('start');
  }

  private points(): number {
    return distancePoints(this.distance, this.phase === 'finished');
  }

  private touchingGate(): boolean {
    for (const gate of this.course) {
      const sx = WITCH_X + (gate.x - this.distance);
      if (sx < WITCH_X - 120) continue;
      if (sx > WITCH_X + 120) break;
      if (hitsGate(gate, sx, this.y, HIT_HALF_W, HIT_HALF_H)) return true;
    }
    return false;
  }

  private hit(): void {
    this.cameras.main.shake(220, 0.006);
    if (this.cats > 0) {
      this.cats -= 1;
      this.speed = 0;
      this.invulnerable = C.invulnerableSeconds;
      this.ctx.sfx.play('wrong');
      this.refreshHud();
      return;
    }
    this.phase = 'crashing';
    this.vy = -200;
    this.ctx.sfx.play('fail');
    this.time.delayedCall(1300, () => this.end());
  }

  private collectCats(): void {
    for (const gate of this.course) {
      if (!gate.hasCat || this.collected.has(gate.index)) continue;
      const sx = WITCH_X + (gate.x - this.distance);
      if (sx > WITCH_X + 80) break;
      if (sx < WITCH_X - 80) continue;
      const cy = (gate.gapTop + gate.gapBottom) / 2;
      if (Math.hypot(sx - WITCH_X, cy - this.y) > CAT_PICKUP) continue;
      this.collected.add(gate.index);
      this.cats = Math.min(C.maxCats, this.cats + 1);
      this.ctx.sfx.play('correct');
      const view = this.views.get(gate.index);
      if (view?.cat) {
        const icon = view.cat;
        view.cat = null;
        this.tweens.add({ targets: icon, y: icon.y - 40, alpha: 0, scale: 1.4, duration: 300, onComplete: () => icon.destroy() });
      }
      this.refreshHud();
    }
  }

  private reachGoal(): void {
    if (this.phase !== 'flying') return;
    this.phase = 'finished';
    this.ctx.sfx.play('fanfare');
    this.refreshHud();
    const text = this.add
      .text(W / 2, H / 2 - 60, 'Maalissa! 1 000 pistettä', { ...TEXT.title, fontSize: '72px' })
      .setOrigin(0.5)
      .setDepth(10);
    text.setScale(0.6);
    this.tweens.add({ targets: text, scale: 1, duration: 500, ease: 'Back.Out' });
    this.tweens.add({ targets: this.witch, x: W + 200, y: this.y - 80, duration: 1600, ease: 'Sine.In' });
    this.time.delayedCall(2200, () => this.end());
  }

  private end(): void {
    if (this.finished) return;
    this.finished = true;
    this.ctx.finish(this.points());
  }

  // ---------------------------------------------------------------- drawing

  private layout(): void {
    this.far.tilePositionX = (this.distance * 0.3) / this.far.tileScaleX;
    this.ground.tilePositionX = this.distance / this.ground.tileScaleX;
    this.finishGate.setX(WITCH_X + (GOAL_DISTANCE - this.distance) + 60);
    for (const gate of this.course) {
      const sx = WITCH_X + (gate.x - this.distance);
      const visible = sx > -160 && sx < W + 160;
      let view = this.views.get(gate.index);
      if (visible && !view) {
        view = this.buildGate(gate);
        this.views.set(gate.index, view);
      } else if (!visible && view) {
        this.tweens.killTweensOf([view.container, ...(view.cat ? [view.cat] : [])]);
        view.container.destroy();
        view.cat?.destroy();
        this.views.delete(gate.index);
        continue;
      }
      if (view) {
        view.container.setX(sx);
        view.cat?.setX(sx);
      }
      if (sx > W + 160) break;
    }
    this.refreshHud();
  }

  private buildGate(gate: Gate): GateView {
    const container = this.add.container(0, 0).setDepth(2);
    // Above: a chain from the sky and a hanging cage
    const cageTop = gate.gapTop - CAGE.height;
    if (cageTop > 0) container.add(addTile(this, CHAIN, 0, cageTop / 2, CHAIN.width, cageTop, true));
    container.add(addAsset(this, CAGE, 0, gate.gapTop, { origin: [0.5, 1] }));
    // Below: an inquisitor standing on a stone pillar
    container.add(addAsset(this, INQUISITOR, 0, gate.gapBottom, { origin: [0.5, 0] }));
    const pillarTop = gate.gapBottom + INQUISITOR.height - 6;
    if (pillarTop < GROUND_Y) container.add(addTile(this, PILLAR, 0, (pillarTop + GROUND_Y) / 2, PILLAR.width, GROUND_Y - pillarTop, true));
    let cat: Phaser.GameObjects.Image | null = null;
    if (gate.hasCat && !this.collected.has(gate.index)) {
      const cy = (gate.gapTop + gate.gapBottom) / 2;
      cat = addAsset(this, CAT, 0, cy).setDepth(3);
      this.tweens.add({ targets: cat, y: cy - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    return { container, cat };
  }

  private buildHud(): void {
    const bar = this.add.graphics().setDepth(20);
    bar.fillStyle(COLORS.night, 0.75);
    bar.fillRoundedRect(BAR_X - 14, BAR_Y - 20, BAR_W + 28, 40, 14);
    bar.fillStyle(COLORS.panelLight, 1);
    bar.fillRoundedRect(BAR_X, BAR_Y - 6, BAR_W, 12, 6);
    this.barFill = this.add.graphics().setDepth(21);
    this.add.text(BAR_X + BAR_W + 22, BAR_Y, 'Maali', { ...TEXT.bodyBold, fontSize: '20px', color: CSS.gold }).setOrigin(0, 0.5).setDepth(21);
    this.marker = addAsset(this, WITCH, BAR_X, BAR_Y, { width: 54, height: 36 }).setDepth(22);
    this.pointsText = this.add.text(36, BAR_Y, '', { ...TEXT.bodyBold, fontSize: '26px', color: CSS.orange }).setOrigin(0, 0.5).setDepth(21);
    for (let i = 0; i < C.maxCats; i++) {
      this.catIcons.push(addAsset(this, CAT, W - 48 - i * 46, BAR_Y, { width: 40, height: 34 }).setDepth(21));
    }
    this.refreshHud();
  }

  private refreshHud(): void {
    const share = this.distance / GOAL_DISTANCE;
    this.barFill.clear();
    this.barFill.fillStyle(COLORS.orange, 1);
    if (share > 0) this.barFill.fillRoundedRect(BAR_X, BAR_Y - 6, Math.max(12, BAR_W * share), 12, 6);
    this.marker.setX(BAR_X + BAR_W * share);
    this.pointsText.setText(`Pisteet: ${this.points().toLocaleString('fi-FI')}`);
    this.catIcons.forEach((icon, i) => icon.setAlpha(i < this.cats ? 1 : 0.3).setTint(i < this.cats ? 0xffffff : 0x8877aa));
  }
}
