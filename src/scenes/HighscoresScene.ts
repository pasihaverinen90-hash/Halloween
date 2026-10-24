import Phaser from 'phaser';
import { CONFIG } from '../config';
import { getFreeplay } from '../core/freeplay';
import { sfx } from '../core/sfx';
import { ALL_GAMES } from '../games/registry';
import { addBackdrop } from '../ui/backdrop';
import { addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { W } from '../ui/screen';
import { CSS, TEXT } from '../ui/theme';
import { drawTopList } from '../ui/topList';
import { drawPanel } from '../ui/widgets/panel';
import { SCENES, type HighscoresData } from './keys';
import { switchTo } from './nav';

const TABLE_W = 760;
const TABLE_TOP = 214;

/** Freeplayn top-listat (Pasi 23.10.): everyone may look. ←/→ switch game, Esc back to the freeplay menu. */
export class HighscoresScene extends Phaser.Scene {
  private gameIndex = 0;
  private layer!: Phaser.GameObjects.Container;
  private leaving = false;

  constructor() {
    super(SCENES.Highscores);
  }

  init(data: HighscoresData): void {
    const index = ALL_GAMES.findIndex((g) => g.id === data?.gameId);
    if (index >= 0) this.gameIndex = index;
  }

  create(): void {
    this.leaving = false;
    addBackdrop(this, { dim: 0.45 });
    this.add.text(W / 2, 62, 'ENNÄTYKSET', { ...TEXT.arcade, fontSize: '44px' }).setOrigin(0.5);
    drawPanel(this, W / 2 - TABLE_W / 2 - 20, TABLE_TOP - 80, TABLE_W + 40, 530, { radius: 18 });
    this.layer = this.add.container(0, 0);
    this.render();
    addKeyHints(this, [
      ['←→', 'Vaihda peliä'],
      ['Esc', 'Takaisin'],
    ]);
    onKeys(this, {
      ArrowLeft: () => this.switchGame(-1),
      ArrowRight: () => this.switchGame(1),
      Escape: () => this.back(),
    });
  }

  getTestState(): unknown {
    const game = ALL_GAMES[this.gameIndex];
    return { gameId: game?.id ?? null, rows: game ? getFreeplay().top(game.id).map((e) => ({ name: e.name, score: e.score })) : [] };
  }

  private switchGame(step: number): void {
    this.gameIndex = (this.gameIndex + step + ALL_GAMES.length) % ALL_GAMES.length;
    sfx.play('move');
    this.render();
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    switchTo(this, SCENES.Menu);
  }

  private render(): void {
    this.layer.removeAll(true);
    const game = ALL_GAMES[this.gameIndex];
    if (!game) return;
    const left = W / 2 - TABLE_W / 2;
    this.layer.add([
      this.add
        .text(W / 2, TABLE_TOP - 44, `${game.name.toLocaleUpperCase('fi-FI')} (${game.genre.toLocaleLowerCase('fi-FI')})`, { ...TEXT.terminal, fontSize: '40px' })
        .setOrigin(0.5),
      this.add.text(left + TABLE_W, TABLE_TOP - 44, `${this.gameIndex + 1}/${ALL_GAMES.length}`, { ...TEXT.small }).setOrigin(1, 0.5),
    ]);
    const entries = getFreeplay().top(game.id);
    this.layer.add(drawTopList(this, entries, W / 2, TABLE_TOP, TABLE_W, 40));
    if (entries.length === 0) {
      this.layer.add(this.add.text(W / 2, TABLE_TOP + 10 * 40 + 22, 'Ei vielä tuloksia.', { ...TEXT.small, color: CSS.muted }).setOrigin(0.5));
    } else {
      this.layer.add(
        this.add
          .text(
            W / 2,
            TABLE_TOP + 10 * 40 + 22,
            game.freeplayUncapped ? 'Ei ylärajaa' : `Pisteitä enintään ${(CONFIG.maxScore * CONFIG.freeplay.scale).toLocaleString('fi-FI')}`,
            { ...TEXT.small },
          )
          .setOrigin(0.5),
      );
    }
  }
}
