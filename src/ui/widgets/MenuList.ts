import Phaser from 'phaser';
import { sfx } from '../../core/sfx';
import { onKeys } from '../input';
import { COLORS, CSS, FONTS } from '../theme';
import { firstEnabled, moveInList } from './gridNav';
import { paintPanel } from './panel';

/*
 * Vertical menu: ↑/↓ move the selection (wrapping, skipping disabled items),
 * Enter chooses. Used by the start screen, results views and correction mode.
 */

export interface MenuItem {
  label: string;
  /** Smaller muted text on the right, e.g. "Vaatii salasanan". */
  detail?: string;
  /** Greyed out; Enter plays the error sound. */
  disabled?: boolean;
}

export interface MenuListOptions {
  /** Width of every item. */
  width: number;
  /** Height of one item. Default 60. */
  itemHeight?: number;
  /** Space between items. Default 10. */
  gap?: number;
  /** Label font size. Default 28. */
  fontSize?: number;
  /** Selection wraps from the last item to the first. Default true. */
  wrap?: boolean;
  /** Pasi 24.10.: neon arcade look (pixel font, pink and cyan) for the start screen. Default false. */
  arcade?: boolean;
  /** Item selected at the start. Default: the first enabled item. */
  initialIndex?: number;
  /** Enter on an enabled item. */
  onSelect: (index: number, item: MenuItem) => void;
  /** The selection moved. */
  onChange?: (index: number, item: MenuItem) => void;
}

interface Row {
  panel: Phaser.GameObjects.Graphics;
  marker: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
  detail: Phaser.GameObjects.Text | null;
}

/** A keyboard menu. (x, y) = centre of the top edge of the first item. */
export class MenuList extends Phaser.GameObjects.Container {
  private items: MenuItem[] = [];
  private rows: Row[] = [];
  private selected = -1;
  private enabled = true;
  private readonly opts: Required<Omit<MenuListOptions, 'initialIndex' | 'onChange'>> & Pick<MenuListOptions, 'onChange'>;
  private unsubscribe: (() => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, items: MenuItem[], opts: MenuListOptions) {
    super(scene, x, y);
    this.opts = {
      width: opts.width,
      itemHeight: opts.itemHeight ?? 60,
      gap: opts.gap ?? 10,
      fontSize: opts.fontSize ?? 28,
      wrap: opts.wrap ?? true,
      arcade: opts.arcade ?? false,
      onSelect: opts.onSelect,
      onChange: opts.onChange,
    };
    scene.add.existing(this);
    this.setItems(items, opts.initialIndex);
    this.listen();
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.unsubscribe?.());
  }

  /** Index of the selected item (-1 when nothing can be selected). */
  get index(): number {
    return this.selected;
  }

  get selectedItem(): MenuItem | undefined {
    return this.items[this.selected];
  }

  /** Total height of the list in pixels. */
  get listHeight(): number {
    const n = this.items.length;
    return n === 0 ? 0 : n * this.opts.itemHeight + (n - 1) * this.opts.gap;
  }

  /** Replace the items. The selection stays on the same index when possible. */
  setItems(items: MenuItem[], index = this.selected): this {
    for (const row of this.rows) {
      row.panel.destroy();
      row.marker.destroy();
      row.label.destroy();
      row.detail?.destroy();
    }
    this.items = items.slice();
    this.rows = this.items.map((item, i) => this.buildRow(item, i));
    const valid = index >= 0 && index < this.items.length && !this.items[index].disabled;
    this.selected = valid ? index : firstEnabled(this.items);
    this.redraw();
    return this;
  }

  /** Select an item without sound. */
  setIndex(index: number): this {
    if (index >= 0 && index < this.items.length && !this.items[index].disabled) {
      this.selected = index;
      this.redraw();
    }
    return this;
  }

  /** Suspend or restore keyboard control (e.g. while another part of the screen has focus). */
  setEnabled(on: boolean): this {
    this.enabled = on;
    this.redraw();
    return this;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  private listen(): void {
    this.unsubscribe = onKeys(
      this.scene,
      {
        ArrowUp: () => this.move(-1),
        ArrowDown: () => this.move(1),
        Enter: () => this.choose(),
      },
      { allowRepeat: ['ArrowUp', 'ArrowDown'] },
    );
  }

  /** Returns false when the list is inactive, so the key stays available to other parts of the screen. */
  private move(step: number): boolean {
    if (!this.enabled || !this.visible || this.items.length === 0) return false;
    const next = moveInList(this.items, this.selected, step, this.opts.wrap);
    if (next === this.selected || next < 0) return true;
    this.selected = next;
    sfx.play('move');
    this.redraw();
    this.opts.onChange?.(next, this.items[next]);
    return true;
  }

  private choose(): boolean {
    if (!this.enabled || !this.visible) return false;
    const item = this.items[this.selected];
    if (!item || item.disabled) {
      sfx.play('error');
      return true;
    }
    sfx.play('select');
    this.opts.onSelect(this.selected, item);
    return true;
  }

  private buildRow(item: MenuItem, i: number): Row {
    const { width, itemHeight, gap, fontSize, arcade } = this.opts;
    const top = i * (itemHeight + gap);
    const midY = top + itemHeight / 2;
    const panel = this.scene.add.graphics({ x: -width / 2, y: top });
    // The pixel font is much wider, so it is drawn smaller.
    const labelFont = arcade
      ? { fontFamily: FONTS.arcade, fontSize: `${Math.round(fontSize * 0.75)}px` }
      : { fontFamily: FONTS.ui, fontStyle: '800', fontSize: `${fontSize}px` };
    const marker = this.scene.add
      .text(-width / 2 + 26, midY, arcade ? '>' : '▸', { ...labelFont, color: arcade ? CSS.neonCyan : CSS.orange })
      .setOrigin(0.5, 0.5);
    const label = this.scene.add.text(-width / 2 + 50, midY, item.label, { ...labelFont, color: CSS.bone }).setOrigin(0, 0.5);
    let detail: Phaser.GameObjects.Text | null = null;
    if (item.detail) {
      detail = this.scene.add
        .text(width / 2 - 22, midY, item.detail, {
          fontFamily: FONTS.ui,
          fontStyle: '700',
          fontSize: `${Math.round(fontSize * 0.7)}px`,
          color: CSS.muted,
        })
        .setOrigin(1, 0.5);
    }
    this.add([panel, marker, label]);
    if (detail) this.add(detail);
    return { panel, marker, label, detail };
  }

  private redraw(): void {
    const { width, itemHeight, arcade } = this.opts;
    const accent = arcade ? COLORS.neonPink : COLORS.orange;
    this.rows.forEach((row, i) => {
      const item = this.items[i];
      const isSelected = i === this.selected && this.enabled;
      paintPanel(row.panel, width, itemHeight, {
        fill: isSelected ? COLORS.panelLight : COLORS.panel,
        border: isSelected ? accent : arcade ? COLORS.neonPurple : COLORS.border,
        borderWidth: isSelected ? 3 : 2,
        radius: arcade ? 4 : 12,
        alpha: item.disabled ? 0.6 : 0.94,
        glow: isSelected ? (arcade ? COLORS.neonPink : true) : false,
      });
      row.marker.setVisible(isSelected);
      row.label.setColor(item.disabled ? CSS.grey : isSelected ? (arcade ? CSS.neonCyan : CSS.orange) : CSS.bone);
      row.detail?.setColor(item.disabled ? CSS.grey : CSS.muted);
    });
  }
}
