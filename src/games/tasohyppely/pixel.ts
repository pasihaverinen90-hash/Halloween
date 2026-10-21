/*
 * Pixel art helper for the platformer (Pasi 21.10.: one art pixel is 3 × 3
 * points of the 1280×720 game space). Pictures are first painted into a small
 * grid of colours, which can get a dark outline, and then drawn as squares.
 * No Phaser: scripts/kuvalista.ts reads the images through assets.ts.
 */

export const P = 3;
export const OUTLINE = '#120a16';

export type Palette = Readonly<Record<string, string>>;

export class Pix {
  readonly w: number;
  readonly h: number;
  private readonly cells: Array<string | null>;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cells = new Array<string | null>(w * h).fill(null);
  }

  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.cells[y * this.w + x];
  }

  set(x: number, y: number, color: string | null): this {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y * this.w + x] = color;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, color: string | null): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, color);
    return this;
  }

  /** Horizontal line from x0 to x1 (inclusive). */
  hline(x0: number, x1: number, y: number, color: string): this {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, color);
    return this;
  }

  /** A line of single pixels (Bresenham). */
  line(x0: number, y0: number, x1: number, y1: number, color: string): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  /** Filled circle. */
  disc(cx: number, cy: number, r: number, color: string): this {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, color);
      }
    }
    return this;
  }

  /** Paint rows of characters; '.' and ' ' are left as they are. */
  grid(x: number, y: number, rows: readonly string[], palette: Palette): this {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const color = palette[row[i]];
        if (color) this.set(x + i, y + j, color);
      }
    });
    return this;
  }

  /** Dark outline around everything painted (pixels touching an empty pixel on a side). */
  outline(color = OUTLINE): this {
    const edge: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== null) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) edge.push(y * this.w + x);
      }
    }
    for (const i of edge) this.cells[i] = color;
    return this;
  }

  /** Draw as P × P squares at (ox, oy) in game units. */
  paint(ctx: CanvasRenderingContext2D, ox = 0, oy = 0, size = P): void {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const color = this.cells[y * this.w + x];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(ox + x * size, oy + y * size, size, size);
      }
    }
  }
}

/** Small deterministic random numbers, so a picture looks the same every time. */
export function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Draw `count` frames side by side: frame i is drawn by draw(pix, i) into its own w × h grid. */
export function frames(ctx: CanvasRenderingContext2D, count: number, w: number, h: number, draw: (pix: Pix, i: number) => void, outline = true): void {
  for (let i = 0; i < count; i++) {
    const pix = new Pix(w, h);
    draw(pix, i);
    if (outline) pix.outline();
    pix.paint(ctx, i * w * P, 0);
  }
}
