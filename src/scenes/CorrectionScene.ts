import Phaser from 'phaser';
import { CONFIG } from '../config';
import { backupSummary, parseBackup } from '../core/backup';
import { getDb } from '../core/db';
import { BACKUP_FILE_ACCEPT, downloadBackupFile, downloadResultsCsv, pickTextFile } from '../core/files';
import { gameStatus, isPlayerDone, playerTotal, recordScore } from '../core/scores';
import { session } from '../core/session';
import { sfx } from '../core/sfx';
import type { PlayerRecord } from '../core/types';
import { GAMES, GAME_IDS } from '../games/registry';
import { confirmDialog, infoDialog, promptText } from '../ui/dialogs';
import { addKeyHints, type KeyHintBar } from '../ui/hints';
import { onKeys } from '../ui/input';
import { addDim } from '../ui/overlay';
import { H, W } from '../ui/screen';
import { COLORS, CSS, FONTS, TEXT } from '../ui/theme';
import { showToast } from '../ui/toast';
import { MenuList, type MenuItem } from '../ui/widgets/MenuList';
import { drawPanel } from '../ui/widgets/panel';
import { addAdminHeader, fi } from './admin/common';
import { SCENES } from './keys';
import { switchTo } from './nav';
import { continueTournament } from './tournament';

type Mode = 'menu' | 'grid' | 'popup' | 'busy';

/** JSON backup files are in use (Pasi 20.10.: turned off, see CONFIG.storage.jsonBackups). */
const BACKUPS: boolean = CONFIG.storage.jsonBackups;

type ActionId = 'results' | 'continue' | 'backup' | 'import' | 'csv' | 'deletePlayer' | 'clear' | 'exit';

const ALL_ACTIONS: Array<MenuItem & { id: ActionId; help: string }> = [
  { id: 'results', label: 'Tulokset ja korjaukset', help: 'Kaikki tulokset taulukkona. Valitse ruutu ja paina Enter: voit muuttaa tai poistaa tuloksen tai antaa pelin uudelleen.' },
  { id: 'continue', label: 'Jatka kesken jäänyttä vuoroa', help: 'Jos selain suljettiin tai peli jumittui, pelaaja pääsee jatkamaan siitä, mihin jäi.' },
  { id: 'backup', label: 'Lataa varmuuskopio', help: 'Tallentaa kaikki tulokset tiedostoon Lataukset-kansioon.' },
  { id: 'import', label: 'Tuo varmuuskopio', help: 'Palauttaa tulokset varmuuskopiotiedostosta. Nykyisistä tuloksista ladataan ensin varmuuskopio.' },
  { id: 'csv', label: 'Vie tulokset CSV-tiedostona', help: 'Tulostaulukko, jonka voi avata Excelissä tai muussa taulukkolaskentaohjelmassa.' },
  { id: 'deletePlayer', label: 'Poista pelaaja', help: 'Poistaa pelaajan ja kaikki hänen tuloksensa, esimerkiksi testipelaajan.' },
  {
    id: 'clear',
    label: 'Tyhjennä kaikki tulokset',
    help: `Poistaa kaikki pelaajat ja tulokset. Kysytään kahdesti.${BACKUPS ? ' Ennen tyhjennystä ladataan varmuuskopio.' : ''}`,
  },
  { id: 'exit', label: 'Poistu korjaustilasta', help: 'Palaa aloitusnäkymään.' },
];
const ACTIONS = ALL_ACTIONS.filter((action) => BACKUPS || (action.id !== 'backup' && action.id !== 'import'));

const GRID_TOP = 150;
const GRID_ROW_H = 42;
const GRID_ROWS = 10;
const NAME_W = 210;
const TOTAL_W = 120;

/** Korjaustila (Ctrl + Shift + K + password): fix results, continue turns, backups. */
export class CorrectionScene extends Phaser.Scene {
  private mode: Mode = 'menu';
  private menu!: MenuList;
  private menuLayer!: Phaser.GameObjects.Container;
  private info!: Phaser.GameObjects.Container;
  private grid!: Phaser.GameObjects.Container;
  private popup: Phaser.GameObjects.Container | null = null;
  private popupMenu: MenuList | null = null;
  private popupCancel: (() => void) | null = null;
  /** The view shown behind an open popup. */
  private popupBase: Mode = 'menu';
  private hints!: KeyHintBar;
  private row = 0;
  private col = 0;
  private scroll = 0;
  private leaving = false;

  constructor() {
    super(SCENES.Correction);
  }

  create(): void {
    this.mode = 'menu';
    this.popup = null;
    this.popupMenu = null;
    this.leaving = false;
    addAdminHeader(this, 'Korjaustila', CSS.red);

    this.menuLayer = this.add.container(0, 0);
    this.menu = new MenuList(this, 262, 130, ACTIONS, {
      width: 440,
      itemHeight: 52,
      gap: 8,
      fontSize: 23,
      onSelect: (index) => this.runAction(index),
      onChange: () => this.renderInfo(),
    });
    this.menuLayer.add(this.menu);
    this.info = this.add.container(0, 0);
    this.grid = this.add.container(0, 0).setVisible(false);
    this.hints = addKeyHints(this, []);

    onKeys(
      this,
      {
        ArrowUp: () => this.gridMove(-1, 0),
        ArrowDown: () => this.gridMove(1, 0),
        ArrowLeft: () => this.gridMove(0, -1),
        ArrowRight: () => this.gridMove(0, 1),
        Enter: () => (this.mode === 'grid' ? (this.openCellActions(), true) : false),
        Escape: () => this.onEscape(),
      },
      { allowRepeat: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] },
    );
    this.setMode('menu');
  }

  getTestState(): unknown {
    return {
      mode: this.mode,
      action: ACTIONS[this.menu?.index ?? 0]?.label ?? null,
      cell: this.mode === 'grid' ? { player: this.players()[this.row]?.name ?? null, gameId: GAMES[this.col]?.id ?? null } : null,
      popup: this.popupMenu ? this.popupMenu.selectedItem?.label ?? null : null,
      players: this.players().map((p) => ({ name: p.name, total: playerTotal(p, GAME_IDS), done: isPlayerDone(p, GAME_IDS) })),
    };
  }

  private players(): PlayerRecord[] {
    return getDb().players();
  }

  // ------------------------------------------------------------- modes

  private setMode(mode: Mode): void {
    this.mode = mode;
    const base = mode === 'popup' ? this.popupBase : mode;
    this.menu.setEnabled(mode === 'menu');
    this.menuLayer.setVisible(base !== 'grid');
    this.info.setVisible(base !== 'grid');
    this.grid.setVisible(base === 'grid');
    if (mode === 'menu') {
      this.renderInfo();
      this.hints.setHints([
        ['↑↓', 'Valitse'],
        ['Enter', 'Valitse'],
        ['Esc', 'Poistu'],
      ]);
    } else if (mode === 'grid') {
      this.renderGrid();
      this.hints.setHints([
        ['←→↑↓', 'Valitse ruutu'],
        ['Enter', 'Muokkaa'],
        ['Esc', 'Takaisin'],
      ]);
    } else if (mode === 'popup') {
      this.hints.setHints([
        ['↑↓', 'Valitse'],
        ['Enter', 'Valitse'],
        ['Esc', 'Peruuta'],
      ]);
    }
  }

  private onEscape(): boolean {
    if (this.mode === 'popup') {
      sfx.play('back');
      this.closePopup();
      this.popupCancel?.();
      return true;
    }
    if (this.mode === 'grid') {
      sfx.play('back');
      this.setMode('menu');
      return true;
    }
    if (this.mode === 'menu') {
      this.exit();
      return true;
    }
    return false;
  }

  private exit(): void {
    if (this.leaving) return;
    this.leaving = true;
    switchTo(this, SCENES.Start);
  }

  // ------------------------------------------------------------- info panel

  private renderInfo(): void {
    this.info.removeAll(true);
    const db = getDb();
    const left = 520;
    const width = 720;
    this.info.add(drawPanel(this, left, 130, width, 488, { radius: 18 }));
    const action = ACTIONS[this.menu.index] ?? ACTIONS[0];
    this.info.add(
      this.add.text(left + 28, 156, action.help, { ...TEXT.body, fontSize: '24px', wordWrap: { width: width - 56 }, lineSpacing: 4 }),
    );
    const players = this.players();
    const unfinished = players.filter((p) => !isPlayerDone(p, GAME_IDS));
    const lines = [
      `Pelaajia: ${players.length}`,
      `Kaikki pelit pelanneita: ${players.length - unfinished.length}`,
      `Vuoro kesken: ${unfinished.length === 0 ? '–' : unfinished.map((p) => p.name).join(', ')}`,
      `Tallennus: ${db.saveProblem ? `EI TOIMI – ${BACKUPS ? 'lataa varmuuskopio' : 'vie tulokset CSV-tiedostona'}!` : 'kunnossa'}`,
    ];
    this.info.add(
      this.add.text(left + 28, 290, lines.join('\n'), { ...TEXT.body, fontSize: '22px', color: CSS.muted, lineSpacing: 10, wordWrap: { width: width - 56 } }),
    );
    const problem = db.loadProblem ?? db.saveProblem;
    if (problem) {
      this.info.add(this.add.text(left + 28, 470, problem, { ...TEXT.bodyBold, fontSize: '20px', color: CSS.red, wordWrap: { width: width - 56 } }));
    }
  }

  // ------------------------------------------------------------- actions

  private runAction(index: number): void {
    if (this.mode !== 'menu') return;
    switch (ACTIONS[index]?.id) {
      case 'results':
        this.row = 0;
        this.col = 0;
        this.scroll = 0;
        if (this.players().length === 0) {
          showToast(this, 'Pelaajia ei vielä ole.', 'info');
          return;
        }
        this.setMode('grid');
        return;
      case 'continue':
        this.continueTurn();
        return;
      case 'backup':
        this.downloadBackup();
        return;
      case 'import':
        void this.importBackup();
        return;
      case 'csv':
        if (downloadResultsCsv(getDb().data, GAMES)) showToast(this, 'Tulostaulukko (CSV) ladattu.', 'success');
        else showToast(this, 'CSV-tiedoston lataus ei onnistunut.', 'error');
        return;
      case 'deletePlayer':
        this.deletePlayer();
        return;
      case 'clear':
        void this.clearAll();
        return;
      case 'exit':
        this.exit();
        return;
    }
  }

  private downloadBackup(): void {
    if (downloadBackupFile(getDb().data)) showToast(this, 'Varmuuskopio ladattu Lataukset-kansioon.', 'success');
    else showToast(this, 'Varmuuskopion lataus ei onnistunut.', 'error');
  }

  private continueTurn(): void {
    const unfinished = this.players().filter((p) => !isPlayerDone(p, GAME_IDS));
    if (unfinished.length === 0) {
      void infoDialog(this, 'Ei keskeneräisiä vuoroja', 'Kaikki pelaajat ovat pelanneet kaikki pelit.');
      return;
    }
    this.openPopup(
      'Kenen vuoroa jatketaan?',
      unfinished.map((p) => ({ label: p.name, detail: `${GAME_IDS.filter((id) => gameStatus(p.games[id]) === 'finished').length}/${GAME_IDS.length} peliä pelattu` })),
      (i) => this.startTurn(unfinished[i]),
    );
  }

  private startTurn(player: PlayerRecord): void {
    session.playerId = player.id;
    this.leaving = true;
    continueTournament(this);
  }

  private async importBackup(): Promise<void> {
    this.setMode('busy');
    const file = await pickTextFile(BACKUP_FILE_ACCEPT);
    if (!this.scene.isActive() && !this.scene.isPaused()) return;
    this.setMode('menu');
    if (!file) return;
    const parsed = parseBackup(file.text);
    if (!parsed.ok) {
      await infoDialog(this, 'Tiedostoa ei voitu tuoda', parsed.error);
      return;
    }
    const ok = await confirmDialog(this, {
      title: 'Tuodaanko varmuuskopio?',
      message: `${file.name}\n${backupSummary(parsed.data, GAME_IDS)}\n\nNykyiset tulokset korvataan. Nykyisistä tuloksista ladataan ensin varmuuskopio.`,
      confirmLabel: 'Tuo',
      danger: true,
    });
    if (!ok) return;
    downloadBackupFile(getDb().data);
    try {
      getDb().replaceAll(parsed.data);
      showToast(this, 'Varmuuskopio tuotiin.', 'success');
    } catch (error) {
      await infoDialog(this, 'Tuonti epäonnistui', error instanceof Error ? error.message : String(error));
    }
    this.renderInfo();
  }

  private deletePlayer(): void {
    const players = this.players();
    if (players.length === 0) {
      showToast(this, 'Pelaajia ei ole.', 'info');
      return;
    }
    this.openPopup(
      'Kuka poistetaan?',
      players.map((p) => ({ label: p.name, detail: `${fi(playerTotal(p, GAME_IDS))} p` })),
      (i) => void this.confirmDeletePlayer(players[i]),
    );
  }

  private async confirmDeletePlayer(player: PlayerRecord): Promise<void> {
    const ok = await confirmDialog(this, {
      title: 'Poistetaanko pelaaja?',
      message: `${player.name} ja kaikki hänen tuloksensa poistetaan.`,
      confirmLabel: 'Poista',
      danger: true,
    });
    if (!ok) return;
    getDb().deletePlayer(player.id);
    showToast(this, `${player.name} poistettiin.`, 'success');
    this.renderInfo();
  }

  private async clearAll(): Promise<void> {
    const first = await confirmDialog(this, {
      title: 'Tyhjennetäänkö kaikki tulokset?',
      message: `Kaikki pelaajat ja tulokset poistetaan.${BACKUPS ? ' Ennen tyhjennystä ladataan varmuuskopio.' : ''}`,
      confirmLabel: 'Jatka',
      danger: true,
    });
    if (!first) return;
    const second = await confirmDialog(this, {
      title: 'Oletko aivan varma?',
      message: BACKUPS ? 'Tätä ei voi perua. Varmuuskopiosta tulokset voi tuoda takaisin.' : 'Tätä ei voi perua.',
      confirmLabel: 'Tyhjennä kaikki',
      cancelLabel: 'Peruuta',
      defaultChoice: 'cancel',
      danger: true,
    });
    if (!second) return;
    if (BACKUPS) downloadBackupFile(getDb().data);
    getDb().clearAll();
    showToast(this, 'Kaikki tulokset tyhjennettiin.', 'success');
    this.renderInfo();
  }

  // ------------------------------------------------------------- grid

  private gridMove(dRow: number, dCol: number): boolean {
    if (this.mode !== 'grid') return false;
    const rows = this.players().length;
    const nextRow = Math.min(rows - 1, Math.max(0, this.row + dRow));
    const nextCol = Math.min(GAMES.length - 1, Math.max(0, this.col + dCol));
    if (nextRow === this.row && nextCol === this.col) return true;
    this.row = nextRow;
    this.col = nextCol;
    if (this.row < this.scroll) this.scroll = this.row;
    if (this.row >= this.scroll + GRID_ROWS) this.scroll = this.row - GRID_ROWS + 1;
    sfx.play('move');
    this.renderGrid();
    return true;
  }

  private renderGrid(): void {
    this.grid.removeAll(true);
    const players = this.players();
    if (players.length === 0) {
      this.setMode('menu');
      return;
    }
    this.row = Math.min(this.row, players.length - 1);
    const gameW = Math.min(170, Math.floor((W - 120 - NAME_W - TOTAL_W) / Math.max(1, GAMES.length)));
    const tableW = NAME_W + GAMES.length * gameW + TOTAL_W;
    const left = W / 2 - tableW / 2;
    const visibleRows = Math.min(GRID_ROWS, players.length);
    this.grid.add(drawPanel(this, left - 16, GRID_TOP - 16, tableW + 32, 56 + visibleRows * GRID_ROW_H + 24, { radius: 16 }));
    const headerY = GRID_TOP + 14;
    this.grid.add(this.add.text(left + 12, headerY, 'Pelaaja', { ...TEXT.small, fontStyle: '800' }).setOrigin(0, 0.5));
    GAMES.forEach((game, i) => {
      this.grid.add(
        this.add.text(left + NAME_W + i * gameW + gameW / 2, headerY, game.genre, { ...TEXT.small, fontStyle: '800', fontSize: '17px' }).setOrigin(0.5),
      );
    });
    this.grid.add(this.add.text(left + tableW - 12, headerY, 'Yhteensä', { ...TEXT.small, fontStyle: '800' }).setOrigin(1, 0.5));

    players.slice(this.scroll, this.scroll + GRID_ROWS).forEach((player, i) => {
      const rowIndex = this.scroll + i;
      const y = GRID_TOP + 56 + i * GRID_ROW_H;
      if (rowIndex % 2 === 0) this.grid.add(this.add.rectangle(W / 2, y, tableW, GRID_ROW_H - 4, COLORS.panelLight, 0.4));
      this.grid.add(
        this.add
          .text(left + 12, y, player.name, { ...TEXT.body, fontSize: '22px', color: rowIndex === this.row ? CSS.orange : CSS.bone })
          .setOrigin(0, 0.5),
      );
      GAMES.forEach((game, c) => {
        const x = left + NAME_W + c * gameW + gameW / 2;
        if (rowIndex === this.row && c === this.col) {
          const box = this.add.graphics();
          box.lineStyle(3, COLORS.orange, 1);
          box.strokeRoundedRect(x - gameW / 2 + 4, y - GRID_ROW_H / 2 + 3, gameW - 8, GRID_ROW_H - 6, 8);
          this.grid.add(box);
        }
        this.grid.add(this.add.text(x, y, this.cellText(player, game.id), { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '22px', color: CSS.bone }).setOrigin(0.5));
      });
      this.grid.add(
        this.add.text(left + tableW - 12, y, fi(playerTotal(player, GAME_IDS)), { ...TEXT.bodyBold, fontSize: '22px' }).setOrigin(1, 0.5),
      );
    });
    const legendY = GRID_TOP + 56 + visibleRows * GRID_ROW_H + 26;
    const more = players.length > GRID_ROWS ? ` · Rivit ${this.scroll + 1}–${this.scroll + visibleRows}/${players.length}` : '';
    this.grid.add(this.add.text(W / 2, legendY, `–  pelaamatta     *  kesken     ✎  muutettu käsin${more}`, { ...TEXT.small }).setOrigin(0.5));
  }

  private cellText(player: PlayerRecord, gameId: string): string {
    const record = player.games[gameId];
    const status = gameStatus(record);
    if (status === 'unplayed') return '–';
    const score = recordScore(record);
    const value = score === null ? '0' : fi(score);
    if (record?.manualScore !== null && record?.manualScore !== undefined) return `${value} ✎`;
    if (status === 'inProgress') return score === null ? 'kesken' : `${value}*`;
    return value;
  }

  private openCellActions(): void {
    const player = this.players()[this.row];
    const game = GAMES[this.col];
    if (!player || !game) return;
    sfx.play('select');
    const record = player.games[game.id];
    const played = gameStatus(record) !== 'unplayed';
    const score = recordScore(record);
    this.openPopup(
      `${player.name} – ${game.name}: ${played ? `${fi(score ?? 0)} p` : 'pelaamatta'}`,
      [
        { label: 'Muuta tulosta', detail: '0–1000' },
        { label: 'Poista tulos', disabled: !played },
        { label: 'Anna peli uudelleen', disabled: !played },
        { label: 'Peruuta' },
      ],
      (i) => {
        if (i === 0) void this.editScore(player, game.id, game.name);
        else if (i === 1) void this.removeResult(player, game.id, game.name);
        else if (i === 2) void this.giveAgain(player, game.id, game.name);
      },
      'grid',
    );
  }

  private async editScore(player: PlayerRecord, gameId: string, gameName: string): Promise<void> {
    const current = recordScore(player.games[gameId]);
    const value = await promptText(this, {
      title: 'Muuta tulosta',
      message: `${player.name} – ${gameName}`,
      initial: current === null ? '' : String(current),
      maxLength: 4,
      allow: /^[0-9]$/,
      validate: (text) => {
        if (text === '') return 'Kirjoita pistemäärä.';
        const n = Number(text);
        return Number.isInteger(n) && n >= 0 && n <= CONFIG.maxScore ? null : `Pisteiden pitää olla 0–${CONFIG.maxScore}.`;
      },
    });
    if (value === null) return;
    getDb().setManualScore(player.id, gameId, Number(value));
    showToast(this, `Tulos muutettu: ${player.name}, ${fi(Number(value))} p.`, 'success');
    this.renderGrid();
  }

  private async removeResult(player: PlayerRecord, gameId: string, gameName: string): Promise<void> {
    const ok = await confirmDialog(this, {
      title: 'Poistetaanko tulos?',
      message: `${player.name} – ${gameName}\nTulos poistetaan, ja peli näkyy pelaajalle pelaamattomana.`,
      confirmLabel: 'Poista',
      danger: true,
    });
    if (!ok) return;
    getDb().deleteRecord(player.id, gameId);
    showToast(this, 'Tulos poistettiin.', 'success');
    this.renderGrid();
  }

  private async giveAgain(player: PlayerRecord, gameId: string, gameName: string): Promise<void> {
    const ok = await confirmDialog(this, {
      title: 'Annetaanko peli uudelleen?',
      message: `Pelaajan ${player.name} tulos pelissä ${gameName} poistetaan, ja hän pääsee pelaamaan pelin uudelleen.`,
      confirmLabel: 'Anna uudelleen',
      danger: true,
    });
    if (!ok) return;
    getDb().deleteRecord(player.id, gameId);
    const now = await confirmDialog(this, {
      title: 'Aloitetaanko vuoro nyt?',
      message: `Pelaaja ${player.name} pääsee heti valikkoon pelaamaan.`,
      confirmLabel: 'Aloita nyt',
      cancelLabel: 'Myöhemmin',
      defaultChoice: 'confirm',
    });
    if (now) {
      const fresh = getDb().getPlayer(player.id);
      if (fresh) this.startTurn(fresh);
      return;
    }
    showToast(this, 'Peli annettiin uudelleen. Vuoron voi jatkaa myöhemmin.', 'success');
    this.renderGrid();
  }

  // ------------------------------------------------------------- popup chooser

  private openPopup(title: string, items: MenuItem[], onChoose: (index: number) => void, returnTo: Mode = 'menu'): void {
    this.closePopup();
    const container = this.add.container(0, 0).setDepth(50);
    const dim = addDim(this, 0.7);
    const height = 120 + items.length * 62;
    const top = Math.max(100, H / 2 - height / 2);
    const panel = drawPanel(this, W / 2 - 330, top, 660, height, { radius: 18, borderWidth: 3, glow: true, alpha: 1 });
    const heading = this.add
      .text(W / 2, top + 44, title, { ...TEXT.heading, fontSize: '30px', color: CSS.orange, align: 'center', wordWrap: { width: 600 } })
      .setOrigin(0.5);
    container.add([dim, panel, heading]);
    this.popupCancel = () => this.setMode(returnTo);
    this.popupBase = returnTo;
    this.popupMenu = new MenuList(this, W / 2, top + 84, items, {
      width: 580,
      itemHeight: 52,
      gap: 10,
      fontSize: 24,
      onSelect: (index) => {
        const last = items[index]?.label === 'Peruuta';
        this.closePopup();
        this.setMode(returnTo);
        if (!last) onChoose(index);
      },
    });
    container.add(this.popupMenu);
    this.popup = container;
    this.setMode('popup');
  }

  private closePopup(): void {
    this.popupMenu = null;
    this.popup?.destroy(true);
    this.popup = null;
  }
}
