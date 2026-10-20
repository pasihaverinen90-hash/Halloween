import Phaser from 'phaser';
import { getDb } from '../core/db';
import { hasAnyScore, isPlayerDone } from '../core/scores';
import { GAME_IDS } from '../games/registry';
import { addKeyHints } from '../ui/hints';
import { onKeys } from '../ui/input';
import { W } from '../ui/screen';
import { CSS, TEXT } from '../ui/theme';
import { MenuList } from '../ui/widgets/MenuList';
import { addAdminHeader } from './admin/common';
import { SCENES } from './keys';
import { switchTo } from './nav';

const ITEMS = [
  { label: 'Palkintojenjako', detail: 'Kolme parasta korokkeille', key: SCENES.Podium },
  { label: 'Tulokset pelin mukaan', detail: 'Kunkin pelin top-lista', key: SCENES.GameResults },
  { label: 'Tulokset pelaajan mukaan', detail: 'Yhden pelaajan kaikki pelit', key: SCENES.PlayerResults },
  { label: 'Takaisin alkuun', detail: 'Lukitsee tulokset', key: SCENES.Start },
];

/** Tulosnäkymien valikko (opened with Pasi's password from the start screen). */
export class ResultsMenuScene extends Phaser.Scene {
  private menu!: MenuList;
  private leaving = false;

  constructor() {
    super(SCENES.ResultsMenu);
  }

  create(): void {
    this.leaving = false;
    addAdminHeader(this, 'Tulokset');
    const players = getDb().players();
    const scored = players.filter((p) => hasAnyScore(p, GAME_IDS)).length;
    const done = players.filter((p) => isPlayerDone(p, GAME_IDS)).length;
    this.add
      .text(W / 2, 128, `Pelaajia: ${players.length} · Tuloksia antaneita: ${scored} · Kaikki pelit pelanneita: ${done}`, {
        ...TEXT.body,
        color: CSS.muted,
      })
      .setOrigin(0.5);

    this.menu = new MenuList(this, W / 2, 190, ITEMS, {
      width: 640,
      itemHeight: 76,
      gap: 16,
      fontSize: 32,
      onSelect: (index) => this.go(ITEMS[index].key),
    });
    addKeyHints(this, [
      ['↑↓', 'Valitse'],
      ['Enter', 'Avaa'],
      ['Esc', 'Takaisin alkuun'],
    ]);
    onKeys(this, { Escape: () => this.go(SCENES.Start) });
  }

  getTestState(): unknown {
    return { selected: this.menu?.index ?? -1 };
  }

  private go(key: string): void {
    if (this.leaving) return;
    this.leaving = true;
    switchTo(this, key);
  }
}
