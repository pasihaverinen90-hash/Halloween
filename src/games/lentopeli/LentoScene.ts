import Phaser from 'phaser';
import { CONFIG } from '../../config';
import { addKeyHints } from '../../ui/hints';
import { onKeys } from '../../ui/input';
import { addAsset } from '../../ui/place';
import { H, W } from '../../ui/screen';
import { COLORS, CSS, TEXT } from '../../ui/theme';
import { assetKey, type AssetSpec, type GameContext, type GameSceneData } from '../types';
import { BAT, CAGE, CAT, CHAIN, FAR, FINISH, GROUND, INQUISITOR, PILLAR, SKY, WITCH } from './assets';
import {
  BAT_HEIGHT,
  blockScreenX,
  buildCourse,
  ENDLESS_DISTANCE,
  endlessPoints,
  distancePoints,
  GOAL_DISTANCE,
  GROUND_Y,
  hitsColumn,
  reachesCat,
  stepWitch,
  targetSpeed,
  WITCH_RADIUS,
  WITCH_X,
  type Block,
  type Column,
} from './logic';

const C = CONFIG.lentopeli;

/** The course is the same every time, so it is built once per kind (the endless one is long). */
const courses = new Map<boolean, Column[]>();
function courseFor(endless: boolean): Column[] {
  let course = courses.get(endless);
  if (!course) {
    course = buildCourse(endless);
    courses.set(endless, course);
  }
  return course;
}
const BAR_X = 380;
const BAR_W = 520;
const BAR_Y = 34;

type Phase = 'ready' | 'flying' | 'crashing' | 'finished';

interface ColumnView {
  /** Cages, chains, inquisitors and pillars: they stay in place. */
  container: Phaser.GameObjects.Container;
  /** Bats fly towards the witch, so they move faster across the screen. */
  bats: Phaser.GameObjects.Container | null;
  cat: Phaser.GameObjects.Image | null;
  /** The bats have squeaked when they flew into view. */
  heard: boolean;
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

/** Flying game: Space lifts the witch; avoid the obstacles and bats, collect black cats, reach the gate. One attempt. */
export class LentoScene extends Phaser.Scene {
  private ctx!: GameContext;
  /** Freeplay's endless flight (Pasi 23.10.): no finish, the speed keeps growing, points without a limit. */
  private endless = false;
  /** Where the course ends: the finish, or the far end of the endless course. */
  private goal = GOAL_DISTANCE;
  private course: Column[] = [];
  private phase: Phase = 'ready';
  private distance = 0;
  private speed = 0;
  private y = 300;
  private vy = 0;
  private cats = 0;
  private invulnerable = 0;
  private collected = new Set<number>();
  private views = new Map<number, ColumnView>();
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
    this.endless = this.ctx.freeplay;
    this.goal = this.endless ? ENDLESS_DISTANCE : GOAL_DISTANCE;
    this.course = courseFor(this.endless);
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

    this.speed = Math.min(targetSpeed(this.distance, this.endless), this.speed + C.acceleration * dt);
    this.distance = Math.min(this.goal, this.distance + this.speed * dt);
    const step = stepWitch(this.y, this.vy, dt, WITCH_RADIUS);
    this.y = step.y;
    this.vy = step.vy;
    this.witch.setY(this.y).setRotation(Phaser.Math.Clamp(this.vy / 900, -0.35, 0.5));

    if (this.invulnerable > 0) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      // Stay protected until clear of the obstacle that was hit.
      if (this.invulnerable === 0 && this.touchingObstacle()) this.invulnerable = 0.2;
      this.witch.setAlpha(this.invulnerable > 0 && Math.floor(time / 90) % 2 === 0 ? 0.35 : 1);
    } else if (this.touchingObstacle()) {
      this.hit();
    }
    this.collectCats();
    this.layout();
    if (this.distance >= this.goal) this.reachGoal();
  }

  getTestState(): unknown {
    const next = this.course.find((c) => c.x + 40 >= this.distance);
    return {
      phase: this.phase,
      distance: Math.round(this.distance),
      goal: this.goal,
      endless: this.endless,
      speed: Math.round(this.speed),
      y: Math.round(this.y),
      cats: this.cats,
      invulnerable: this.invulnerable > 0,
      points: this.points(),
      next: next ? { index: next.index, x: next.x, pattern: next.pattern, openings: next.openings, catY: next.catY } : null,
    };
  }

  /** Test helper: move the witch (distance along the course and height) without flying there. */
  debugPlace(distance: number, y: number): void {
    this.distance = Phaser.Math.Clamp(distance, 0, this.goal);
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

  /** Points at this moment, for ending the game with Ctrl + Q (Pasi 31.10.). */
  currentScore(): number {
    return this.points();
  }

  private points(): number {
    if (this.endless) return endlessPoints(this.distance);
    return distancePoints(this.distance, this.phase === 'finished');
  }

  private touchingObstacle(): boolean {
    for (const column of this.course) {
      if (column.x < this.distance - 150) continue;
      if (column.x > this.distance + 150) break;
      if (hitsColumn(column, this.distance, this.y)) return true;
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
    for (const column of this.course) {
      if (column.x > this.distance + 80) break;
      if (column.catY === null || this.collected.has(column.index) || !reachesCat(column, this.distance, this.y)) continue;
      this.collected.add(column.index);
      this.cats = Math.min(C.maxCats, this.cats + 1);
      this.ctx.sfx.play('correct');
      const view = this.views.get(column.index);
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
      .text(W / 2, H / 2 - 60, this.endless ? 'Rata loppui! Huikea lento!' : 'Maalissa! 1 000 pistettä', { ...TEXT.title, fontSize: '72px' })
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
    this.finishGate.setX(WITCH_X + (this.goal - this.distance) + 60);
    for (const column of this.course) {
      const sx = WITCH_X + (column.x - this.distance);
      const visible = sx > -160 && sx < W + 160;
      let view = this.views.get(column.index);
      if (visible && !view) {
        view = this.buildColumn(column);
        this.views.set(column.index, view);
      } else if (!visible && view) {
        this.destroyView(view);
        this.views.delete(column.index);
        continue;
      }
      if (view) {
        view.container.setX(sx);
        view.cat?.setX(sx);
        if (view.bats) {
          const bx = blockScreenX(column, 'bats', this.distance);
          view.bats.setX(bx);
          if (!view.heard && bx < W - 40 && this.phase === 'flying') {
            view.heard = true;
            this.ctx.sfx.tone({ freq: 2100, slideTo: 2900, duration: 0.07, type: 'sine', volume: 0.1 });
          }
        }
      }
      if (sx > W + 160) break;
    }
    this.refreshHud();
  }

  private destroyView(view: ColumnView): void {
    const parts = [view.container, ...(view.bats ? [view.bats, ...view.bats.list] : []), ...(view.cat ? [view.cat] : [])];
    this.tweens.killTweensOf(parts);
    view.container.destroy();
    view.bats?.destroy();
    view.cat?.destroy();
  }

  private buildColumn(column: Column): ColumnView {
    const container = this.add.container(0, 0).setDepth(2);
    let bats: Phaser.GameObjects.Container | null = null;
    for (const block of column.blocks) {
      if (block.kind === 'cage') this.addCage(container, block);
      else if (block.kind === 'inquisitor') this.addInquisitor(container, block);
      else bats = this.addBats(block, bats ?? this.add.container(WITCH_X + W * 2, 0).setDepth(3));
    }
    let cat: Phaser.GameObjects.Image | null = null;
    if (column.catY !== null && !this.collected.has(column.index)) {
      const cy = column.catY;
      cat = addAsset(this, CAT, 0, cy).setDepth(3);
      this.tweens.add({ targets: cat, y: cy - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    return { container, bats, cat, heard: false };
  }

  /** A chain from the sky and a cage hanging at the bottom of the block. */
  private addCage(container: Phaser.GameObjects.Container, block: Block): void {
    const cageTop = block.bottom - CAGE.height;
    if (cageTop > 0) container.add(addTile(this, CHAIN, 0, cageTop / 2, CHAIN.width, cageTop, true));
    container.add(addAsset(this, CAGE, 0, block.bottom, { origin: [0.5, 1] }));
  }

  /** An inquisitor standing on a stone pillar that reaches the ground. */
  private addInquisitor(container: Phaser.GameObjects.Container, block: Block): void {
    container.add(addAsset(this, INQUISITOR, 0, block.top, { origin: [0.5, 0] }));
    const pillarTop = block.top + INQUISITOR.height - 6;
    if (pillarTop < GROUND_Y) container.add(addTile(this, PILLAR, 0, (pillarTop + GROUND_Y) / 2, PILLAR.width, GROUND_Y - pillarTop, true));
  }

  /** A flock of bats filling the block, flapping their wings. */
  private addBats(block: Block, flock: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
    const count = Math.max(1, Math.round((block.bottom - block.top) / BAT_HEIGHT));
    const step = (block.bottom - block.top) / count;
    for (let i = 0; i < count; i++) {
      const bat = addAsset(this, BAT, i % 2 === 0 ? -8 : 10, block.top + step * (i + 0.5));
      flock.add(bat);
      const scaleY = bat.scaleY;
      this.tweens.add({ targets: bat, scaleY: scaleY * 0.55, duration: 130 + i * 17, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    return flock;
  }

  private buildHud(): void {
    const bar = this.add.graphics().setDepth(20);
    bar.fillStyle(COLORS.night, 0.75);
    bar.fillRoundedRect(BAR_X - 14, BAR_Y - 20, BAR_W + 28, 40, 14);
    bar.fillStyle(COLORS.panelLight, 1);
    bar.fillRoundedRect(BAR_X, BAR_Y - 6, BAR_W, 12, 6);
    this.barFill = this.add.graphics().setDepth(21);
    const label = this.add.text(BAR_X + BAR_W + 22, BAR_Y, 'Maali', { ...TEXT.bodyBold, fontSize: '20px', color: CSS.gold }).setOrigin(0, 0.5).setDepth(21);
    this.marker = addAsset(this, WITCH, BAR_X, BAR_Y, { width: 54, height: 36 }).setDepth(22);
    // The endless flight has no finish to show progress to.
    if (this.endless) for (const object of [bar, this.barFill, label, this.marker]) object.setVisible(false);
    this.pointsText = this.add.text(36, BAR_Y, '', { ...TEXT.bodyBold, fontSize: '26px', color: CSS.orange }).setOrigin(0, 0.5).setDepth(21);
    for (let i = 0; i < C.maxCats; i++) {
      this.catIcons.push(addAsset(this, CAT, W - 48 - i * 46, BAR_Y, { width: 40, height: 34 }).setDepth(21));
    }
    this.refreshHud();
  }

  private refreshHud(): void {
    const share = this.distance / this.goal;
    this.barFill.clear();
    this.barFill.fillStyle(COLORS.orange, 1);
    if (share > 0) this.barFill.fillRoundedRect(BAR_X, BAR_Y - 6, Math.max(12, BAR_W * share), 12, 6);
    this.marker.setX(BAR_X + BAR_W * share);
    // Freeplay shows its own points (×10), as on the result screen.
    const shown = this.endless ? Math.round(this.points() * CONFIG.freeplay.scale) : this.points();
    this.pointsText.setText(`Pisteet: ${shown.toLocaleString('fi-FI')}`);
    this.catIcons.forEach((icon, i) => icon.setAlpha(i < this.cats ? 1 : 0.3).setTint(i < this.cats ? 0xffffff : 0x8877aa));
  }
}
