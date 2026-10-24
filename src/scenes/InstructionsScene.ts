import Phaser from 'phaser';
import { CONFIG } from '../config';
import { getDb } from '../core/db';
import { session } from '../core/session';
import { GAME_IDS, getGame } from '../games/registry';
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
import { continueTournament } from './tournament';

const LEFT_X = 60;
const LEFT_W = 430;
const RIGHT_X = 556;
const RIGHT_W = 664;
const TOP = 138;
const BOTTOM = 626;

const fi = (n: number): string => n.toLocaleString('fi-FI');

/** Ohjeruutu: keys, rules and scoring of one game. Static; Enter starts. */
export class InstructionsScene extends Phaser.Scene {
  private def: GameDefinition | undefined;
  private plan: AttemptPlan | null = null;
  private leaving = false;
  private gameId = '';
  private freeplay = false;

  constructor() {
    super(SCENES.Instructions);
  }

  init(data: InstructionsData): void {
    this.gameId = data?.gameId ?? '';
    this.freeplay = data?.freeplay === true;
    this.leaving = false;
  }

  create(): void {
    const db = getDb();
    this.def = getGame(this.gameId);
    const player = session.playerId ? db.getPlayer(session.playerId) : undefined;
    if (!player && !this.freeplay) {
      switchTo(this, SCENES.Start);
      return;
    }
    const def = this.def;
    // Freeplay: one attempt every time, nothing remembered from earlier plays.
    const record = player && !this.freeplay && def ? db.getRecord(player.id, def.id) : undefined;
    this.plan = def ? planAttempts(def.kind, record, this.freeplay ? 1 : attemptCount(def)) : null;
    if (!def || !this.plan || this.plan.finished) {
      if (this.freeplay) switchTo(this, SCENES.Menu);
      else continueTournament(this);
      return;
    }

    addBackdrop(this, { dim: 0.5 });
    // Pasi 24.10.: neon arcade titles in the menus.
    this.add.text(W / 2, 54, def.name.toLocaleUpperCase('fi-FI'), { ...TEXT.arcade, fontSize: '36px' }).setOrigin(0.5);
    this.add.text(W / 2, 104, def.genre, { ...TEXT.terminal, fontSize: '30px', color: CSS.muted }).setOrigin(0.5);
    addAsset(this, def.preview, 60 + 86, 66, { width: 172, height: 96 });
    const index = this.freeplay ? -1 : GAME_IDS.indexOf(def.id);
    if (this.freeplay) {
      this.add.text(W - 60, 66, 'FREE PLAY', { ...TEXT.arcadeSmall, fontSize: '16px' }).setOrigin(1, 0.5);
    } else if (index >= 0) {
      this.add
        .text(W - 60, 66, `PELI ${index + 1}/${GAME_IDS.length}`, { ...TEXT.arcadeSmall, fontSize: '16px' })
        .setOrigin(1, 0.5);
    }

    this.buildLeft(def, this.plan);
    this.buildRight(def, this.plan);

    // Pasi 23.10.: the tournament goes from game to game, so there is no way back to a menu.
    if (this.freeplay) {
      addKeyHints(this, [
        ['Enter', 'Aloita peli'],
        ['Esc', 'Takaisin valikkoon'],
      ]);
      onKeys(this, { Enter: () => this.go(), Escape: () => this.back() });
    } else {
      addKeyHints(this, [['Enter', 'Aloita peli']]);
      onKeys(this, { Enter: () => this.go() });
    }
  }

  getTestState(): unknown {
    return { gameId: this.def?.id ?? null, freeplay: this.freeplay, resumes: this.plan?.resumes ?? false, next: this.plan?.next ?? null };
  }

  private go(): void {
    if (this.leaving || !this.def) return;
    this.leaving = true;
    switchTo(this, SCENES.GameHost, { gameId: this.def.id, freeplay: this.freeplay });
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    switchTo(this, SCENES.Menu);
  }

  /** Keys and scoring on the left; the font shrinks if a game's texts would not fit. */
  private buildLeft(def: GameDefinition, plan: AttemptPlan): void {
    drawPanel(this, LEFT_X - 20, TOP - 8, LEFT_W + 40, BOTTOM - TOP + 16, { radius: 16 });
    const limit = def.freeplayUncapped ? 'ei ylärajaa' : `pisteitä enintään ${fi(CONFIG.maxScore * CONFIG.freeplay.scale)}`;
    const attemptRule = this.freeplay
      ? `Freeplay: ${limit}. Parhaat pääsevät top ${CONFIG.freeplay.topSize} -listalle.`
      : (def.instructions.attemptRule ??
        (plan.kind === 'puzzle' ? 'Yksi kierros.' : plan.total === 1 ? 'Yksi yritys.' : `${plan.total} yritystä. Paras jää voimaan.`));
    const scoreLines = [...this.text(def).scoring, attemptRule];
    const keys: Array<[string, string]> = [...def.instructions.keys];

    for (const size of [24, 22, 20, 18]) {
      const objects: Phaser.GameObjects.GameObject[] = [];
      let y = TOP + 8;
      const heading = (text: string): void => {
        const t = this.add.text(LEFT_X, y + 4, text.toLocaleUpperCase('fi-FI'), { ...TEXT.arcadeSmall, fontSize: `${size - 6}px` });
        objects.push(t);
        y += t.height + 8;
      };
      heading('Näppäimet');
      for (const [key, action] of keys) {
        const cap = addKeyCap(this, LEFT_X, y + 18, key);
        // A wide key cap leaves less room, so the label wraps inside the panel.
        const labelX = LEFT_X + Math.max(cap.width, 64) + 14;
        const label = this.add
          .text(labelX, y + 18, action, { ...TEXT.body, fontSize: `${size}px`, wordWrap: { width: LEFT_X + LEFT_W - labelX } })
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
        const t = this.add.text(RIGHT_X, y + 4, text.toLocaleUpperCase('fi-FI'), { ...TEXT.arcadeSmall, fontSize: `${size - 6}px` });
        objects.push(t);
        y += t.height + 6;
      };
      heading('Tavoite');
      const goal = this.add.text(RIGHT_X, y, this.text(def).goal, { ...TEXT.body, fontSize: `${size}px`, wordWrap: { width: RIGHT_W } });
      objects.push(goal);
      y += goal.height + 18;
      heading('Säännöt');
      y = this.bullets(objects, this.text(def).rules, RIGHT_X, y, RIGHT_W, size);
      if (note) {
        const t = this.add.text(RIGHT_X, y + 4, note, { ...TEXT.bodyBold, fontSize: `${size}px`, color: CSS.orange, wordWrap: { width: RIGHT_W } });
        objects.push(t);
        y += t.height + 10;
      }
      if (y <= BOTTOM || size === 18) return;
      for (const object of objects) object.destroy();
    }
  }

  /** The game's texts, with freeplay's own where it plays differently there. */
  private text(def: GameDefinition): GameDefinition['instructions'] {
    return this.freeplay ? { ...def.instructions, ...def.freeplayInstructions } : def.instructions;
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
