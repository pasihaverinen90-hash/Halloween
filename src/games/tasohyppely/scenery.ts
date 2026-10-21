import type { Theme } from './levels';
import { frames, P, Pix, seeded } from './pixel';
import { drawCandle, drawHunter, drawWhip, drawZombie, HUNTER_FRAME } from './sprites';

/*
 * Pixel-art scenery of the three levels: ground tiles, skies, the far
 * landscape and small decorations. Drawn by code until Pasi provides his own
 * pictures. No Phaser here.
 */

interface TilePalette {
  fill: string;
  speck: string;
  stone: string;
  top: string;
  topLight: string;
  platform: string;
  platformLight: string;
  platformDark: string;
  crumble: string;
  crack: string;
  mover: string;
  moverLight: string;
}

const TILE_COLORS: Record<Theme, TilePalette> = {
  hautausmaa: {
    fill: '#3b2a24',
    speck: '#2a1d19',
    stone: '#5a5262',
    top: '#3f5f34',
    topLight: '#64904a',
    platform: '#6a6478',
    platformLight: '#8f88a2',
    platformDark: '#454054',
    crumble: '#5d5368',
    crack: '#2a2234',
    mover: '#6a4527',
    moverLight: '#8a5c34',
  },
  linna: {
    fill: '#454b63',
    speck: '#2b2f42',
    stone: '#575d78',
    top: '#5f6684',
    topLight: '#8088a8',
    platform: '#6a4527',
    platformLight: '#8a5c34',
    platformDark: '#3e2716',
    crumble: '#5a5f78',
    crack: '#22253a',
    mover: '#4a4f60',
    moverLight: '#7a8094',
  },
  metsa: {
    fill: '#2a221e',
    speck: '#1b1513',
    stone: '#4a4a48',
    top: '#2f5a34',
    topLight: '#4f8a44',
    platform: '#5b3b24',
    platformLight: '#7d5534',
    platformDark: '#3a2416',
    crumble: '#4a3020',
    crack: '#24160e',
    mover: '#4a5a4a',
    moverLight: '#6f8a6a',
  },
};

/** Tile frames, in order: surface, inside, platform, crumbling floor, moving platform (left half, right half). */
export const TILE_FRAMES = ['pinta', 'sisus', 'taso', 'sortuva lattia', 'liikkuva taso vasen', 'liikkuva taso oikea'] as const;

function soil(p: Pix, c: TilePalette, rand: () => number, theme: Theme): void {
  if (theme === 'linna') {
    // Stone bricks, every other row shifted.
    p.rect(0, 0, 16, 16, c.fill);
    for (let row = 0; row < 4; row++) {
      p.hline(0, 15, row * 4 + 3, c.speck);
      const shift = row % 2 === 0 ? 0 : 4;
      for (let x = shift; x < 16; x += 8) p.rect(x, row * 4, 1, 3, c.speck);
      p.set(((row * 5 + 2) % 16) + 0, row * 4 + 1, c.stone);
    }
    return;
  }
  // Soft soil: only small specks and pebbles, so the repeating tile does not show a pattern.
  p.rect(0, 0, 16, 16, c.fill);
  for (let i = 0; i < 26; i++) p.set(Math.floor(rand() * 16), Math.floor(rand() * 16), c.speck);
  for (let i = 0; i < 2; i++) p.set(Math.floor(rand() * 16), Math.floor(rand() * 12) + 4, c.stone);
  if (theme === 'metsa') p.set(Math.floor(rand() * 16), Math.floor(rand() * 10) + 5, '#4a3424').set(Math.floor(rand() * 16), Math.floor(rand() * 10) + 5, '#4a3424');
}

export function drawTiles(theme: Theme): (ctx: CanvasRenderingContext2D) => void {
  const c = TILE_COLORS[theme];
  return (ctx) =>
    frames(
      ctx,
      TILE_FRAMES.length,
      16,
      16,
      (p, i) => {
        const rand = seeded(17 + i * 31 + theme.length);
        if (i === 0 || i === 1) {
          soil(p, c, rand, theme);
          if (i === 0) {
            if (theme === 'linna') {
              p.rect(0, 0, 16, 2, c.topLight);
              p.rect(0, 2, 16, 1, c.top);
            } else {
              p.rect(0, 0, 16, 4, c.top);
              for (let x = 0; x < 16; x++) {
                if (x % 3 !== 1) p.set(x, 0, c.topLight);
                // Grass hanging over the edge of the soil.
                if (x % 4 === 0 || x % 7 === 3) p.set(x, 4, c.top);
              }
              p.set(3, 1, c.topLight).set(10, 1, c.topLight).set(13, 2, c.topLight);
            }
          }
          return;
        }
        if (i === 2) {
          // A slab or a branch at the top of the tile.
          p.rect(0, 0, 16, 5, c.platform);
          p.hline(0, 15, 0, c.platformLight);
          p.hline(0, 15, 4, c.platformDark);
          if (theme === 'metsa') p.set(4, 5, '#3f7a3a').set(5, 6, '#3f7a3a').set(12, 5, '#3f7a3a');
          else if (theme === 'linna') p.rect(7, 5, 2, 3, '#2a2236');
          else p.set(5, 2, c.platformDark).set(11, 1, c.platformDark);
          return;
        }
        if (i === 3) {
          p.rect(0, 0, 16, 16, c.crumble);
          p.rect(0, 0, 16, 1, c.platformLight);
          p.line(3, 0, 6, 6, c.crack).line(6, 6, 4, 11, c.crack).line(6, 6, 11, 9, c.crack).line(11, 9, 13, 15, c.crack).line(9, 2, 12, 4, c.crack);
          p.set(2, 13, c.crack).set(14, 3, c.crack);
          return;
        }
        // Moving platform halves: 6 pixels thick, bands at the outer ends.
        p.rect(0, 0, 16, 6, c.mover);
        p.hline(0, 15, 0, c.moverLight);
        p.hline(0, 15, 5, c.platformDark);
        const end = i === 4 ? 0 : 14;
        p.rect(end, 0, 2, 6, c.moverLight);
        p.set(i === 4 ? 4 : 11, 3, c.platformDark);
      },
      false,
    );
}

// ---------------------------------------------------------------- skies

interface SkyPalette {
  top: string;
  bottom: string;
  moon: string;
  moonShade: string;
  moonX: number;
  moonY: number;
  moonR: number;
}

const SKIES: Record<Theme, SkyPalette> = {
  hautausmaa: { top: '#140c2a', bottom: '#3a1f4a', moon: '#f3e6b0', moonShade: '#d8c890', moonX: 980, moonY: 150, moonR: 72 },
  linna: { top: '#0d1022', bottom: '#2c1a36', moon: '#d8504a', moonShade: '#a8343a', moonX: 260, moonY: 130, moonR: 58 },
  metsa: { top: '#06140f', bottom: '#163a30', moon: '#cfe8d8', moonShade: '#a8c8b8', moonX: 1040, moonY: 110, moonR: 46 },
};

function lerpColor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}

/** Night sky with a moon, in bands like old games. */
export function drawSky(theme: Theme): (ctx: CanvasRenderingContext2D, w: number, h: number) => void {
  const s = SKIES[theme];
  return (ctx, w, h) => {
    const band = 24;
    for (let y = 0; y < h; y += band) {
      ctx.fillStyle = lerpColor(s.top, s.bottom, y / h);
      ctx.fillRect(0, y, w, band);
    }
    const rand = seeded(theme.length * 101);
    for (let i = 0; i < 90; i++) {
      const x = Math.floor((rand() * w) / P) * P;
      const y = Math.floor((rand() * h * 0.6) / P) * P;
      ctx.fillStyle = rand() < 0.2 ? '#fff6d0' : 'rgba(230, 220, 255, 0.7)';
      ctx.fillRect(x, y, P, P);
    }
    // The moon, as big chunky pixels.
    const size = 6;
    for (let y = -s.moonR; y <= s.moonR; y += size) {
      for (let x = -s.moonR; x <= s.moonR; x += size) {
        const d = Math.hypot(x, y);
        if (d > s.moonR) continue;
        ctx.fillStyle = d > s.moonR - size * 1.5 || (x > s.moonR * 0.2 && y < -s.moonR * 0.1 && (x + y) % 18 === 0) ? s.moonShade : s.moon;
        ctx.fillRect(s.moonX + x, s.moonY + y, size, size);
      }
    }
    for (const [cx, cy, r] of [
      [-0.3, -0.2, 0.18],
      [0.25, 0.3, 0.14],
      [0.1, -0.45, 0.1],
    ]) {
      ctx.fillStyle = s.moonShade;
      for (let y = -r * s.moonR; y <= r * s.moonR; y += size) {
        for (let x = -r * s.moonR; x <= r * s.moonR; x += size) {
          if (Math.hypot(x, y) <= r * s.moonR) ctx.fillRect(Math.round((s.moonX + cx * s.moonR + x) / size) * size, Math.round((s.moonY + cy * s.moonR + y) / size) * size, size, size);
        }
      }
    }
    if (theme === 'metsa') {
      // Mist low over the trees.
      for (let y = h * 0.55; y < h; y += band) {
        ctx.fillStyle = `rgba(150, 200, 180, ${0.04 + ((y - h * 0.55) / h) * 0.12})`;
        ctx.fillRect(0, y, w, band);
      }
    }
  };
}

// ---------------------------------------------------------------- far landscapes (tile sideways)

/** Silhouettes far behind the level. They repeat seamlessly sideways. */
export function drawLandscape(theme: Theme): (ctx: CanvasRenderingContext2D, w: number, h: number) => void {
  return (ctx, w, h) => {
    const cols = Math.floor(w / P);
    const rows = Math.floor(h / P);
    const p = new Pix(cols, rows);
    const rand = seeded(theme.length * 7 + 3);
    if (theme === 'hautausmaa') {
      const far = '#24183c';
      const near = '#170f28';
      // Rolling hills (whole sine periods, so the picture repeats).
      for (let x = 0; x < cols; x++) {
        const hill = Math.round(rows * 0.45 + Math.sin((x / cols) * Math.PI * 4) * 10 + Math.sin((x / cols) * Math.PI * 10) * 4);
        p.rect(x, hill, 1, rows - hill, far);
      }
      // A chapel on a hill.
      const cx = Math.floor(cols * 0.3);
      const base = Math.round(rows * 0.45) - 4;
      p.rect(cx - 14, base - 22, 28, 26, far).rect(cx - 4, base - 44, 8, 22, far).rect(cx - 1, base - 52, 2, 8, far).rect(cx - 4, base - 49, 8, 2, far);
      p.rect(cx - 2, base - 36, 4, 6, '#3a2a54');
      // Dead trees and crosses in front.
      for (let i = 0; i < 9; i++) {
        const x = Math.floor((i + 0.3 + rand() * 0.4) * (cols / 9));
        const ground = Math.round(rows * 0.7 + Math.sin((x / cols) * Math.PI * 6) * 6);
        if (i % 3 === 0) {
          p.rect(x, ground - 30, 3, 30, near);
          p.line(x + 1, ground - 20, x - 10, ground - 34, near).line(x + 1, ground - 26, x + 12, ground - 40, near).line(x - 6, ground - 28, x - 9, ground - 38, near);
        } else {
          p.rect(x, ground - 12, 2, 12, near).rect(x - 3, ground - 9, 8, 2, near);
        }
      }
      for (let x = 0; x < cols; x++) {
        const ground = Math.round(rows * 0.7 + Math.sin((x / cols) * Math.PI * 6) * 6);
        p.rect(x, ground, 1, rows - ground, near);
      }
    } else if (theme === 'linna') {
      // The castle's inner wall: stone, pillars and tall moonlit windows, repeating every quarter.
      const wall = '#1d2132';
      const brick = '#171a28';
      const pillar = '#262b40';
      p.rect(0, 0, cols, rows, wall);
      for (let y = 0; y < rows; y += 6) {
        p.hline(0, cols - 1, y, brick);
        const shift = (y / 6) % 2 === 0 ? 0 : 6;
        for (let x = shift; x < cols; x += 12) p.rect(x, y, 1, 6, brick);
      }
      const period = Math.floor(cols / 4);
      for (let k = 0; k < 4; k++) {
        const x0 = k * period;
        p.rect(x0, 0, 10, rows, pillar).rect(x0 + 2, 0, 2, rows, '#30364e');
        const wx = x0 + Math.floor(period / 2) - 8;
        const wy = Math.floor(rows * 0.18);
        for (let y = 0; y < 70; y++) {
          for (let x = 0; x < 16; x++) {
            const dx = x - 7.5;
            if (y < 8 && dx * dx + (y - 8) * (y - 8) * 1.0 > 64) continue;
            p.set(wx + x, wy + y, y < 30 ? '#3d4370' : '#333a62');
          }
        }
        for (let x = 3; x < 16; x += 4) p.rect(wx + x, wy, 1, 70, '#14172a');
        p.rect(wx, wy + 34, 16, 1, '#14172a');
        // A red banner between the windows.
        const bx = x0 + Math.floor(period * 0.82);
        p.rect(bx, Math.floor(rows * 0.12), 10, 46, '#5a1622').rect(bx + 4, Math.floor(rows * 0.12) + 10, 2, 20, '#8a2a34');
        p.set(bx, Math.floor(rows * 0.12) + 46, '#5a1622').set(bx + 9, Math.floor(rows * 0.12) + 46, '#5a1622');
      }
    } else {
      const far = '#0f261d';
      const near = '#0a1a13';
      for (let x = 0; x < cols; x++) {
        const top = Math.round(rows * 0.3 + Math.sin((x / cols) * Math.PI * 8) * 8 + Math.sin((x / cols) * Math.PI * 22) * 3);
        p.rect(x, top, 1, rows - top, far);
      }
      for (let i = 0; i < 10; i++) {
        const x = Math.floor((i + 0.5) * (cols / 10) + (rand() - 0.5) * 12);
        const width = 6 + Math.floor(rand() * 5);
        p.rect(x, 0, width, rows, near);
        p.rect(x - 4, rows - 6, width + 8, 6, near);
        p.line(x, Math.floor(rows * 0.3), x - 14, Math.floor(rows * 0.18), near).line(x + width, Math.floor(rows * 0.4), x + width + 12, Math.floor(rows * 0.3), near);
      }
      for (let i = 0; i < 40; i++) p.set(Math.floor(rand() * cols), Math.floor(rows * 0.3 + rand() * rows * 0.6), rand() < 0.5 ? '#c8ff8a' : '#6fd0a0');
    }
    p.paint(ctx);
  };
}

// ---------------------------------------------------------------- decorations

export const DECOR_FRAMES: Record<Theme, readonly string[]> = {
  hautausmaa: ['hautakivi', 'risti', 'kurpitsalyhty', 'kuollut pensas'],
  linna: ['kallokasa', 'rikkinäinen pylväs', 'ketjut', 'kivipatsas'],
  metsa: ['saniainen', 'kanto ja sieniä', 'pensas', 'sammaloitunut kivi'],
};

/** Small things standing on the ground (no effect on play). 16 × 32 pixels a frame, 4 frames. */
export function drawDecor(theme: Theme): (ctx: CanvasRenderingContext2D) => void {
  return (ctx) =>
    frames(ctx, 4, 16, 32, (p, i) => {
      if (theme === 'hautausmaa') {
        if (i === 0) {
          p.rect(3, 16, 10, 16, '#6a6478').rect(4, 14, 8, 2, '#6a6478').rect(5, 13, 6, 1, '#6a6478');
          p.rect(4, 16, 1, 16, '#8f88a2').rect(6, 19, 4, 1, '#454054').rect(6, 22, 4, 1, '#454054').rect(5, 25, 5, 1, '#454054');
        } else if (i === 1) {
          p.rect(7, 12, 3, 20, '#5d5368').rect(3, 16, 11, 3, '#5d5368').rect(7, 12, 1, 20, '#7a708a');
        } else if (i === 2) {
          p.rect(3, 24, 10, 8, '#d8701c').rect(2, 26, 12, 5, '#d8701c').rect(4, 24, 2, 8, '#b85a12').rect(10, 24, 2, 8, '#b85a12');
          p.rect(7, 21, 2, 3, '#3f5f34');
          p.set(5, 26, '#ffe07a').set(10, 26, '#ffe07a').rect(5, 29, 6, 1, '#ffe07a').set(6, 28, '#ffe07a').set(9, 28, '#ffe07a');
        } else {
          p.line(8, 31, 8, 20, '#3a2a24').line(8, 24, 3, 18, '#3a2a24').line(8, 22, 13, 16, '#3a2a24').line(5, 21, 4, 15, '#3a2a24').line(11, 19, 13, 22, '#3a2a24');
          p.rect(5, 29, 7, 3, '#2a1d19');
        }
      } else if (theme === 'linna') {
        if (i === 0) {
          for (const [x, y] of [
            [2, 27],
            [7, 27],
            [12, 27],
            [4, 23],
            [10, 23],
            [7, 19],
          ]) {
            p.rect(x, y, 4, 4, '#e8dfc6').set(x + 1, y + 1, '#1a1124').set(x + 2, y + 1, '#1a1124').set(x + 1, y + 3, '#b3a78a');
          }
        } else if (i === 1) {
          p.rect(3, 26, 10, 6, '#575d78').rect(4, 10, 8, 16, '#454b63').rect(5, 10, 2, 16, '#6a7090');
          p.line(4, 10, 7, 7, '#454b63').line(7, 7, 9, 11, '#454b63').line(9, 11, 12, 8, '#454b63');
        } else if (i === 2) {
          for (let y = 0; y < 26; y += 2) {
            p.set(5, y, '#7a8094').set(6, y + 1, '#4a4f60');
            p.set(11, y + 4, '#7a8094').set(10, y + 5, '#4a4f60');
          }
          p.rect(9, 30, 4, 2, '#4a4f60');
        } else {
          p.rect(4, 28, 8, 4, '#575d78').rect(5, 14, 6, 14, '#6a7090').rect(5, 8, 6, 6, '#6a7090');
          p.set(6, 10, '#1d2132').set(9, 10, '#1d2132').rect(3, 16, 2, 8, '#575d78').rect(11, 16, 2, 8, '#575d78');
        }
      } else if (i === 0) {
        for (let k = 0; k < 5; k++) p.line(8, 31, 1 + k * 3.5, 18 + Math.abs(k - 2) * 2, k % 2 ? '#3f7a3a' : '#2f5a34');
      } else if (i === 1) {
        p.rect(3, 22, 10, 10, '#4a3424').rect(3, 22, 10, 2, '#6a4a30').rect(5, 23, 6, 1, '#8a6a44');
        p.rect(1, 27, 3, 2, '#7ac8ff').rect(2, 29, 1, 2, '#c8e0ff').rect(12, 25, 3, 2, '#7ac8ff').rect(13, 27, 1, 2, '#c8e0ff');
      } else if (i === 2) {
        p.disc(8, 25, 6.5, '#1f4a2a').disc(5, 23, 4, '#2f5a34').disc(11, 24, 4, '#2f5a34').set(6, 21, '#4f8a44').set(11, 22, '#4f8a44');
      } else {
        p.rect(2, 25, 12, 7, '#4a4a48').rect(4, 23, 8, 2, '#4a4a48').rect(3, 25, 3, 2, '#626260').rect(4, 22, 8, 2, '#3f7a3a').rect(2, 24, 3, 1, '#3f7a3a');
      }
    });
}

// ---------------------------------------------------------------- menu preview

/** Menu picture: the hunter lashes a zombie in a moonlit graveyard. */
export function drawPreview(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  drawSky('hautausmaa')(ctx, w, h);
  ctx.save();
  ctx.scale(0.5, 0.5);
  drawLandscape('hautausmaa')(ctx, w * 2, h * 1.2);
  ctx.restore();
  // Ground
  const ground = 160;
  ctx.save();
  ctx.translate(0, ground);
  for (let x = 0; x < w; x += 48) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, 48, 48);
    ctx.clip();
    ctx.translate(x, 0);
    drawTiles('hautausmaa')(ctx);
    ctx.restore();
  }
  ctx.restore();
  const frame = (draw: (c: CanvasRenderingContext2D) => void, index: number, fw: number, fh: number, x: number, y: number, flip = false): void => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, fw, fh);
    ctx.clip();
    if (flip) {
      ctx.translate(x + fw, y);
      ctx.scale(-1, 1);
      ctx.translate(-index * fw, 0);
    } else ctx.translate(x - index * fw, y);
    draw(ctx);
    ctx.restore();
  };
  frame(drawHunter, HUNTER_FRAME.lash, 72, 96, 70, ground - 96);
  frame((c) => drawWhip(c, [40, 40, 40]), 0, 168, 24, 70 + 63, ground - 66);
  frame(drawZombie, 0, 48, 96, 236, ground - 96, true);
  frame(drawCandle, 0, 24, 48, 20, ground - 100);
}
