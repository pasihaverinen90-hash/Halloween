import Phaser from 'phaser';
import { CONFIG } from '../config';
import { getFreeplay } from '../core/freeplay';
import { isNameChar } from '../core/names';
import { sfx } from '../core/sfx';
import { SCENES, type FreeplayResultData } from '../scenes/keys';
import { addKeyHints, type KeyHintBar } from './hints';
import { onKeys } from './input';
import { addCenteredPanel, addDim } from './overlay';
import { H, W } from './screen';
import { CSS, TEXT } from './theme';
import { drawTopList } from './topList';
import { riseIn } from './widgets/motion';
import { TextInput } from './widgets/TextInput';

const fi = (n: number): string => n.toLocaleString('fi-FI');
const PANEL_W = 820;
const PANEL_H = 640;

/**
 * Freeplay result (Pasi 23.10.): the score, and arcade style a name only when
 * the result gets on the game's top 10. Enter plays again, Esc goes back to
 * the freeplay menu.
 */
export class FreeplayResultScene extends Phaser.Scene {
  private opts!: FreeplayResultData;
  private phase: 'name' | 'list' = 'list';
  private place: number | null = null;
  private saved: number | null = null;
  private nameField: TextInput | null = null;
  private listObjects: Phaser.GameObjects.GameObject[] = [];
  private hints!: KeyHintBar;
  private message!: Phaser.GameObjects.Text;
  private done = false;

  constructor() {
    super(SCENES.FreeplayResult);
  }

  init(data: FreeplayResultData): void {
    this.opts = data;
    this.done = false;
    this.saved = null;
    this.nameField = null;
    this.listObjects = [];
  }

  create(): void {
    this.scene.bringToTop();
    const d = this.opts;
    addDim(this, 0.75);
    addCenteredPanel(this, PANEL_W, PANEL_H);
    const top = H / 2 - PANEL_H / 2;
    const name = this.add.text(W / 2, top + 34, `${d.gameName.toLocaleUpperCase('fi-FI')} · FREE PLAY`, { ...TEXT.terminal, fontSize: '34px', color: CSS.muted }).setOrigin(0.5);
    const score = this.add.text(W / 2, top + 104, `${fi(d.score)} pistettä`, { ...TEXT.arcade, fontSize: '40px' }).setOrigin(0.5);
    this.message = this.add.text(W / 2, top + 168, '', { ...TEXT.bodyBold, fontSize: '28px', color: CSS.orange }).setOrigin(0.5);
    riseIn(this, name, 0);
    riseIn(this, score, 80);
    this.time.delayedCall(150, () => sfx.play('result'));

    this.place = getFreeplay().placeFor(d.gameId, d.score);
    // Pasi 24.10.: arcade style.
    const banner = this.add
      .text(W / 2, top + 68, this.place !== null ? 'NEW HIGH SCORE!' : 'GAME OVER', { ...TEXT.arcadeSmall, fontSize: '22px', color: this.place !== null ? CSS.gold : CSS.neonCyan })
      .setOrigin(0.5);
    if (this.place !== null) this.tweens.add({ targets: banner, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });
    this.hints = addKeyHints(this, []);
    if (this.place !== null) this.askName();
    else this.showList(`Ei top ${CONFIG.freeplay.topSize} -listalle. Yritä uudelleen!`);

    onKeys(this, {
      Enter: () => (this.phase === 'name' ? this.saveName() : this.finish(true)),
      Escape: () => (this.phase === 'name' ? this.showList('Tulosta ei tallennettu.') : this.finish(false)),
    });
  }

  getTestState(): unknown {
    return { gameId: this.opts?.gameId ?? null, score: this.opts?.score ?? 0, place: this.place, saved: this.saved, phase: this.phase };
  }

  private askName(): void {
    this.phase = 'name';
    const top = H / 2 - PANEL_H / 2;
    this.message.setText(`Pääsit top ${CONFIG.freeplay.topSize} -listalle, sijalle ${this.place}!`);
    const ask = this.add.text(W / 2, top + 250, 'KIRJOITA NIMESI', { ...TEXT.arcadeSmall, fontSize: '24px', color: CSS.bone }).setOrigin(0.5);
    this.nameField = new TextInput(this, W / 2, top + 330, { width: 520, maxLength: CONFIG.player.nameMaxLength, allow: isNameChar });
    this.listObjects.push(ask, this.nameField);
    this.hints.setHints([
      ['A–Ö', 'Kirjoita nimi'],
      ['Enter', 'Tallenna'],
      ['Esc', 'Älä tallenna'],
    ]);
  }

  private saveName(): void {
    const name = this.nameField?.value.trim() ?? '';
    if (!name) {
      this.nameField?.showError();
      sfx.play('error');
      return;
    }
    this.saved = getFreeplay().add(this.opts.gameId, name, this.opts.score);
    sfx.play('success');
    this.showList(this.saved !== null ? `${name}, sija ${this.saved}!` : 'Tulosta ei tallennettu.');
  }

  private showList(message: string): void {
    this.phase = 'list';
    for (const object of this.listObjects) object.destroy();
    this.message.setText(message);
    const top = H / 2 - PANEL_H / 2;
    this.listObjects = drawTopList(this, getFreeplay().top(this.opts.gameId), W / 2, top + 196, PANEL_W - 120, 38, this.saved === null ? null : this.saved - 1);
    this.hints.setHints([
      ['Enter', 'Pelaa uudelleen'],
      ['Esc', 'Valikkoon'],
    ]);
  }

  private finish(again: boolean): void {
    if (this.done) return;
    this.done = true;
    sfx.play('select');
    this.opts.onDone(again);
  }
}
