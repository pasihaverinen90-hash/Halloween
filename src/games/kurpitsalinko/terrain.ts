/*
 * Destructible ground of the catapult game as a grid of small cells (no
 * Phaser, so it can be unit-tested). Shapes from the level are rasterised
 * into the grid; explosions carve circles out of it. The picture on screen
 * is drawn from the same shapes and carved with the same circles.
 */

export type Material = 'earth' | 'stone' | 'wood';

export const CELL = 4;
const MATERIAL_CODE: Record<Material, number> = { earth: 1, stone: 2, wood: 3 };
const CODE_MATERIAL: Array<Material | null> = [null, 'earth', 'stone', 'wood'];

export type Shape =
  | { kind: 'poly'; points: ReadonlyArray<readonly [number, number]>; material: Material }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; material: Material };

function insidePoly(points: ReadonlyArray<readonly [number, number]>, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function insideShape(shape: Shape, x: number, y: number): boolean {
  if (shape.kind === 'rect') return x >= shape.x && x < shape.x + shape.w && y >= shape.y && y < shape.y + shape.h;
  return insidePoly(shape.points, x, y);
}

export class Terrain {
  readonly width: number;
  readonly height: number;
  readonly cols: number;
  readonly rows: number;
  private readonly cells: Uint8Array;

  constructor(width: number, height: number, shapes: readonly Shape[] = []) {
    this.width = width;
    this.height = height;
    this.cols = Math.ceil(width / CELL);
    this.rows = Math.ceil(height / CELL);
    this.cells = new Uint8Array(this.cols * this.rows);
    for (const shape of shapes) this.fill(shape);
  }

  /** Copy (the level starts the same for every attempt). */
  clone(): Terrain {
    const copy = new Terrain(this.width, this.height);
    copy.cells.set(this.cells);
    return copy;
  }

  private fill(shape: Shape): void {
    const code = MATERIAL_CODE[shape.material];
    for (let r = 0; r < this.rows; r++) {
      const y = (r + 0.5) * CELL;
      for (let c = 0; c < this.cols; c++) {
        if (insideShape(shape, (c + 0.5) * CELL, y)) this.cells[r * this.cols + c] = code;
      }
    }
  }

  materialAt(x: number, y: number): Material | null {
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return null;
    return CODE_MATERIAL[this.cells[r * this.cols + c]];
  }

  isSolid(x: number, y: number): boolean {
    return this.materialAt(x, y) !== null;
  }

  /** Any solid cell in a horizontal span at height y. */
  solidSpan(x0: number, x1: number, y: number): boolean {
    for (let x = x0; x <= x1; x += CELL) if (this.isSolid(x, y)) return true;
    return this.isSolid(x1, y);
  }

  /** The first solid surface at or below fromY in column x, or null (a hole all the way down). */
  surfaceBelow(x: number, fromY = 0): number | null {
    const c = Math.floor(x / CELL);
    if (c < 0 || c >= this.cols) return null;
    for (let r = Math.max(0, Math.floor(fromY / CELL)); r < this.rows; r++) {
      if (this.cells[r * this.cols + c] !== 0) return r * CELL;
    }
    return null;
  }

  /**
   * Blow a hole: every cell whose centre is within the radius goes (wood
   * within radius × woodFactor). Returns how many cells were removed.
   */
  carve(x: number, y: number, radius: number, woodFactor = 1): number {
    const reach = radius * Math.max(1, woodFactor);
    const c0 = Math.max(0, Math.floor((x - reach) / CELL));
    const c1 = Math.min(this.cols - 1, Math.floor((x + reach) / CELL));
    const r0 = Math.max(0, Math.floor((y - reach) / CELL));
    const r1 = Math.min(this.rows - 1, Math.floor((y + reach) / CELL));
    let removed = 0;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * this.cols + c;
        const code = this.cells[i];
        if (code === 0) continue;
        const d = Math.hypot((c + 0.5) * CELL - x, (r + 0.5) * CELL - y);
        const limit = code === MATERIAL_CODE.wood ? radius * woodFactor : radius;
        if (d <= limit) {
          this.cells[i] = 0;
          removed++;
        }
      }
    }
    return removed;
  }

  /** Number of solid cells (for tests). */
  count(): number {
    let n = 0;
    for (const v of this.cells) if (v !== 0) n++;
    return n;
  }
}
