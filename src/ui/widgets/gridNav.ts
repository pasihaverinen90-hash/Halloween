/*
 * Pure navigation helpers for keyboard-driven grids and lists (no Phaser).
 */

export type GridDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Move the selection in a grid that is filled row by row (the last row may be
 * shorter). Up/down never wrap. Left/right step through the items in order,
 * continuing on the previous/next row, and stop at the first/last item.
 * Moving down from a row whose column is missing in the shorter last row
 * lands on the last item. Returns -1 for an empty grid, otherwise an index in
 * 0..count-1.
 */
export function moveInGrid(index: number, count: number, columns: number, dir: GridDirection): number {
  if (!Number.isFinite(count) || count < 1) return -1;
  const total = Math.floor(count);
  const cols = Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 1;
  const current = Number.isFinite(index) ? Math.min(Math.max(Math.floor(index), 0), total - 1) : 0;

  switch (dir) {
    case 'left':
      return current > 0 ? current - 1 : current;
    case 'right':
      return current < total - 1 ? current + 1 : current;
    case 'up':
      return current - cols >= 0 ? current - cols : current;
    case 'down': {
      if (current + cols < total) return current + cols;
      const row = Math.floor(current / cols);
      const lastRow = Math.floor((total - 1) / cols);
      return row < lastRow ? total - 1 : current;
    }
    default:
      return current;
  }
}

/** Anything with an optional disabled flag (menu items, buttons). */
export interface Selectable {
  disabled?: boolean;
}

/** Index of the first selectable item, or -1 when none can be selected. */
export function firstEnabled(items: readonly Selectable[]): number {
  return items.findIndex((item) => !item.disabled);
}

/** Index of the last selectable item, or -1 when none can be selected. */
export function lastEnabled(items: readonly Selectable[]): number {
  for (let i = items.length - 1; i >= 0; i--) if (!items[i].disabled) return i;
  return -1;
}

/**
 * Step through a vertical list, skipping disabled items. `step` is the number
 * of items to move (negative = up). With `wrap`, moving past either end
 * continues from the other end; without it the selection stops at the last
 * selectable item in that direction. Returns `index` when nothing else can be
 * selected, and the first selectable item when `index` is not selectable.
 */
export function moveInList(items: readonly Selectable[], index: number, step: number, wrap: boolean): number {
  const count = items.length;
  if (count === 0) return -1;
  if (!Number.isInteger(index) || index < 0 || index >= count || items[index].disabled) {
    return step < 0 ? lastEnabled(items) : firstEnabled(items);
  }
  const direction = step > 0 ? 1 : -1;
  let remaining = Number.isFinite(step) ? Math.abs(Math.trunc(step)) : 0;
  let current = index;
  let probe = index;
  while (remaining > 0) {
    probe += direction;
    if (probe < 0 || probe >= count) {
      if (!wrap) break;
      probe = probe < 0 ? count - 1 : 0;
    }
    // Back where we started: there is no other selectable item.
    if (probe === current) break;
    if (!items[probe].disabled) {
      current = probe;
      remaining--;
    }
  }
  return current;
}
