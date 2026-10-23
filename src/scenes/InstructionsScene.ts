import Phaser from 'phaser';
import { getDb } from '../core/db';
import { session } from '../core/session';
import { getGame } from '../games/registry';
import type { GameDefinition } from '../games/types';
import { addBackdrop } from '../ui/backdrop';
import { addKeyCap, addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { addAsset } from '../ui/place';
import { W } from '../ui/screen';
import { CSS, FONTS, TEXT } from '../ui/theme';
import { drawPanel } from '../ui/widgets/panel';
import { attemptCount, planAttempts, type AttemptPlan } from './attemptFlow';
import { SCENES, type InstructionsData } from './keys';
import { switchTo } from './nav';

const LEFT_X = 60;
const LEFT_W = 430;
const RIGHT_X = 556;
const RIGHT_W = 664;
const TOP = 138;
const BOTTOM = 626;

const fi = (n: number): string => n.toLocaleString('fi-FI');

/** Ohjeruutu: keys, rules and scoring of one game. Static; Enter starts, Esc goes back. */
export class InstructionsScene extends Phaser.Scene {
  private def: GameDefinition | undefined;
  private plan: AttemptPlan | null = null;
  private leaving = false;
  private gameId = '';

  constructor() {
    super(SCENES.Instructions);
  }

  init(data: InstructionsData): void {
    this.gameId = data?.gameId ?? '';
    this.leaving = false;
  }

  create(): void {
    const db = getDb();
    this.def = getGame(this.gameId);
    const player = session.playerId ? db.getPlayer(session.playerId) : undefined;
    if (!player) {
      switchTo(this, SCENES.Start);
      return;
    }
    const def = this.def;
    this.plan = def ? planAttempts(def.kind, db.getRecord(player.id, def.id), attemptCount(def)) : null;
    if (!def || !this.plan || this.plan.finished) {
      switchTo(this, SCENES.Menu);
      return;
    }

    addBackdrop(this, { dim: 0.5 });
    this.add.text(W / 2, 58, def.name, { ...TEXT.title, fontSize: '66px' }).setOrigin(0.5);
    this.add.text(W / 2, 106, def.genre, { ...TEXT.heading, fontSize: '28px', color: CSS.muted }).setOrigin(0.5);
    addAsset(this, def.preview, 60 + 86, 66, { width: 172, height: 96 });

    this.buildLeft(def, this.plan);
    this.buildRight(def, this.plan);

    addKeyHints(this, [
      ['Enter', 'Aloita peli'],
      ['Esc', 'Takaisin valikkoon'],
    ]);
    onKeys(this, {
      Enter: () => this.go(SCENES.GameHost),
      Escape: () => this.go(SCENES.Menu),
    });
  }

  getTestState(): unknown {
    return { gameId: this.def?.id ?? null, resumes: this.plan?.resumes ?? false, next: this.plan?.next ?? null };
  }

  private go(key: string): void {
    if (this.leaving || !this.def) return;
    this.leaving = true;
    switchTo(this, key, key === SCENES.GameHost ? { gameId: this.def.id } : undefined);
  }

  /** Keys and scoring on the left; the font shrinks if a game's texts would not fit. */
  private buildLeft(def: GameDefinition, plan: AttemptPlan): void {
    drawPanel(this, LEFT_X - 20, TOP - 8, LEFT_W + 40, BOTTOM - TOP + 16, { radius: 16 });
    const attemptRule =
      def.instructions.attemptRule ??
      (plan.kind === 'action'
        ? `${plan.total} yritystä. Paras jää voimaan.`
        : 'Yksi kierros.');
    const scoreLines = [...def.instructions.scoring, attemptRule];
    const keys: Array<[string, string]> = [...def.instructions.keys];

    for (const size of [24, 22, 20, 18]) {
      const objects: Phaser.GameObjects.GameObject[] = [];
      let y = TOP + 8;
      const heading = (text: string): void => {
        const t = this.add.text(LEFT_X, y, text, { ...TEXT.heading, fontSize: `${size + 8}px`, color: CSS.orange });
        objects.push(t);
        y += t.height + 8;
      };
      heading('Näppäimet');
      for (const [key, action] of keys) {
        const cap = addKeyCap(this, LEFT_X, y + 18, key);
        const label = this.add
          .text(LEFT_X + Math.max(cap.width, 64) + 14, y + 18, action, { ...TEXT.body, fontSize: `${size}px`, wordWrap: { width: LEFT_W - 90 } })
          .setOrigin(0, 0.5);
        objects.push(cap, label);
        // Rows tighten with the font, so a game with many keys still fits.
        y += size >= 22 ? 46 : 40;
      }
      y += 14;
      heading('Pisteet');
      y = this.bullets(objects, scoreLines, LEFT_X, y, LEFT_W, size);
      if (y <= BOTTOM || size === 18) return;
      for (const object of objects) object.destroy();
    }
  }

  /** Goal and rules on the right; the font shrinks if a game's texts would not fit. */
  private buildRight(def: GameDefinition, plan: AttemptPlan): void {
    drawPanel(this, RIGHT_X - 20, TOP - 8, RIGHT_W + 40, BOTTOM - TOP + 16, { radius: 16 });
    let note: string | null = null;
    if (plan.kind === 'puzzle' && plan.resumes) note = 'Peli jatkuu siitä, mihin se jäi.';
    else if (plan.kind === 'action' && plan.done > 0) {
      const left = plan.total - plan.done;
      note = `Jäljellä ${left} ${left === 1 ? 'yritys' : 'yritystä'}. Paras tähän asti: ${fi(plan.best ?? 0)} p.`;
    }

    for (const size of [26, 24, 22, 20, 18]) {
      const objects: Phaser.GameObjects.GameObject[] = [];
      let y = TOP + 8;
      const heading = (text: string): void => {
        const t = this.add.text(RIGHT_X, y, text, { ...TEXT.heading, fontSize: `${size + 8}px`, color: CSS.orange });
        objects.push(t);
        y += t.height + 6;
      };
      heading('Tavoite');
      const goal = this.add.text(RIGHT_X, y, def.instructions.goal, { ...TEXT.body, fontSize: `${size}px`, wordWrap: { width: RIGHT_W } });
      objects.push(goal);
      y += goal.height + 18;
      heading('Säännöt');
      y = this.bullets(objects, def.instructions.rules, RIGHT_X, y, RIGHT_W, size);
      if (note) {
        const t = this.add.text(RIGHT_X, y + 4, note, { ...TEXT.bodyBold, fontSize: `${size}px`, color: CSS.orange, wordWrap: { width: RIGHT_W } });
        objects.push(t);
        y += t.height + 10;
      }
      if (y <= BOTTOM || size === 18) return;
      for (const object of objects) object.destroy();
    }
  }

  /** Bulleted lines; returns the y below them. */
  private bullets(objects: Phaser.GameObjects.GameObject[], lines: string[], x: number, y: number, width: number, size: number): number {
    for (const line of lines) {
      const dot = this.add.text(x + 2, y, '•', { fontFamily: FONTS.ui, fontStyle: '800', fontSize: `${size}px`, color: CSS.orange });
      const text = this.add.text(x + 26, y, line, { ...TEXT.body, fontSize: `${size}px`, wordWrap: { width: width - 26 } });
      objects.push(dot, text);
      y += text.height + 6;
    }
    return y + 6;
  }
}
