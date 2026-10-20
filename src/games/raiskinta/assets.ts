import { drawBat } from '../shared/bat';
import type { AssetSpec } from '../types';

/*
 * Shooter images, drawn by code in a simple outlined style until Pasi
 * provides his own (same names in public/assets/). No Phaser import:
 * scripts/kuvalista.ts reads this file to generate ASSETS.md.
 */

const INK = '#1a1124';
const STYLE = 'Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.';
const GOLD = '#f2c14e';
const GOLD_DARK = '#b8862b';

function outline(ctx: CanvasRenderingContext2D, width = 3): void {
  ctx.lineWidth = width;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/** Draws the shape, fills it and outlines it. */
function shape(ctx: CanvasRenderingContext2D, fill: string, path: () => void, line = 3): void {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  outline(ctx, line);
  ctx.stroke();
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A graveyard seen from above at an angle; tiles seamlessly from top to bottom. */
function graveyard(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#1b1426';
  ctx.fillRect(0, 0, w, h);
  const rnd = seeded(11);
  // Draws an item and its copy across the top/bottom seam, so the picture tiles.
  const wrapped = (y: number, size: number, draw: (yy: number) => void): void => {
    draw(y);
    if (y + size > h) draw(y - h);
    if (y - size < 0) draw(y + h);
  };
  // Darker patches of grass
  for (let i = 0; i < 40; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 40 + rnd() * 90;
    wrapped(y, r, (yy) => {
      ctx.fillStyle = 'rgba(34, 52, 38, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, yy, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // A winding path through the middle (the wave repeats exactly once per tile)
  const pathX = (y: number): number => w / 2 + Math.sin((y / h) * Math.PI * 2) * 90;
  ctx.fillStyle = '#2c2233';
  ctx.beginPath();
  for (let y = 0; y <= h; y += 8) ctx.lineTo(pathX(y) - 56, y);
  for (let y = h; y >= 0; y -= 8) ctx.lineTo(pathX(y) + 56, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2f42';
  for (let y = 10; y < h; y += 46) {
    for (const dx of [-26, 18]) {
      ctx.beginPath();
      ctx.ellipse(pathX(y) + dx + ((y * 13) % 11) - 5, y, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Grass tufts
  ctx.strokeStyle = '#2e4a33';
  ctx.lineWidth = 2;
  for (let i = 0; i < 260; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    if (Math.abs(x - pathX(y)) < 60) continue;
    wrapped(y, 10, (yy) => {
      ctx.beginPath();
      ctx.moveTo(x - 4, yy);
      ctx.lineTo(x - 6, yy - 8);
      ctx.moveTo(x, yy);
      ctx.lineTo(x, yy - 10);
      ctx.moveTo(x + 4, yy);
      ctx.lineTo(x + 6, yy - 8);
      ctx.stroke();
    });
  }
  // Gravestones and crosses in loose rows on both sides of the path
  for (let row = 0; row < 9; row++) {
    const baseY = row * (h / 9) + 30;
    for (let i = 0; i < 9; i++) {
      const y = baseY + (rnd() - 0.5) * 24;
      const x = 50 + i * 145 + (rnd() - 0.5) * 50;
      if (Math.abs(x - pathX(y)) < 110) continue;
      const kind = rnd();
      wrapped(y, 50, (yy) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x + 6, yy + 4, 22, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        if (kind < 0.6) {
          shape(ctx, '#5a5368', () => {
            ctx.moveTo(x - 15, yy);
            ctx.lineTo(x - 15, yy - 26);
            ctx.arc(x, yy - 26, 15, Math.PI, 0);
            ctx.lineTo(x + 15, yy);
            ctx.closePath();
          }, 2.5);
          ctx.strokeStyle = '#3e3849';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 7, yy - 26);
          ctx.lineTo(x + 7, yy - 26);
          ctx.moveTo(x - 7, yy - 19);
          ctx.lineTo(x + 5, yy - 19);
          ctx.stroke();
        } else if (kind < 0.85) {
          shape(ctx, '#4d4759', () => {
            ctx.rect(x - 4, yy - 38, 8, 38);
            ctx.rect(x - 14, yy - 30, 28, 8);
          }, 2.5);
        } else {
          // A grave mound with flowers
          shape(ctx, '#3b2c30', () => ctx.ellipse(x, yy - 8, 24, 11, 0, 0, Math.PI * 2), 2.5);
          ctx.fillStyle = '#5d4f6b';
          for (const fx of [-10, 0, 9]) {
            ctx.beginPath();
            ctx.arc(x + fx, yy - 11 + (fx % 3), 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }
  }
  // Dim everything, so the enemies stand out against the ground
  ctx.fillStyle = 'rgba(12, 8, 20, 0.38)';
  ctx.fillRect(0, 0, w, h);
  // Mist
  for (let i = 0; i < 10; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    wrapped(y, 80, (yy) => {
      const g = ctx.createRadialGradient(x, yy, 0, x, yy, 160);
      g.addColorStop(0, 'rgba(200, 190, 230, 0.07)');
      g.addColorStop(1, 'rgba(200, 190, 230, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 160, yy - 160, 320, 320);
    });
  }
}

/** Invented pope character: white robe, red cape, tall mitre and a golden crosier. */
function pope(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 90, h / 110);
  glow(ctx, 45, 60, 52, 'rgba(255, 236, 170, 0.25)');
  // Crosier (behind the hand)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(72, 104);
  ctx.lineTo(72, 22);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(66, 20, 7, 0, Math.PI * 1.25, true);
  outline(ctx, 7);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.stroke();
  glow(ctx, 70, 14, 12, 'rgba(255, 245, 200, 0.9)');
  // Robe
  shape(ctx, '#f4f1ea', () => {
    ctx.moveTo(30, 44);
    ctx.quadraticCurveTo(18, 80, 14, 106);
    ctx.lineTo(76, 106);
    ctx.quadraticCurveTo(70, 80, 60, 44);
    ctx.closePath();
  });
  ctx.fillStyle = GOLD;
  ctx.fillRect(41, 58, 8, 47);
  // Cape over the shoulders
  shape(ctx, '#b3263a', () => {
    ctx.moveTo(26, 46);
    ctx.quadraticCurveTo(45, 36, 64, 46);
    ctx.quadraticCurveTo(70, 58, 62, 64);
    ctx.quadraticCurveTo(45, 70, 28, 64);
    ctx.quadraticCurveTo(20, 58, 26, 46);
    ctx.closePath();
  });
  // Hand on the crosier
  shape(ctx, '#f1c9a5', () => ctx.arc(70, 62, 6, 0, Math.PI * 2), 2.5);
  // Head
  shape(ctx, '#f1c9a5', () => ctx.arc(45, 36, 12, 0, Math.PI * 2));
  ctx.fillStyle = 'rgba(230, 120, 120, 0.5)';
  ctx.beginPath();
  ctx.arc(37, 40, 3, 0, Math.PI * 2);
  ctx.arc(53, 40, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(40.5, 35, 1.8, 0, Math.PI * 2);
  ctx.arc(49.5, 35, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(45, 40, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  // Mitre with a golden cross
  shape(ctx, '#f7f3e8', () => {
    ctx.moveTo(33, 27);
    ctx.quadraticCurveTo(31, 10, 45, 0);
    ctx.quadraticCurveTo(59, 10, 57, 27);
    ctx.closePath();
  });
  ctx.fillStyle = GOLD;
  ctx.fillRect(33, 23, 24, 4);
  ctx.fillRect(43.5, 7, 3, 14);
  ctx.fillRect(39.5, 11, 11, 3);
  ctx.restore();
}

function ghost(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 64, h / 70);
  glow(ctx, 32, 32, 32, 'rgba(180, 220, 255, 0.35)');
  shape(ctx, '#e8f0ff', () => {
    ctx.moveTo(8, 64);
    ctx.lineTo(8, 30);
    ctx.quadraticCurveTo(8, 4, 32, 4);
    ctx.quadraticCurveTo(56, 4, 56, 30);
    ctx.lineTo(56, 64);
    ctx.quadraticCurveTo(50, 56, 44, 64);
    ctx.quadraticCurveTo(38, 56, 32, 64);
    ctx.quadraticCurveTo(26, 56, 20, 64);
    ctx.quadraticCurveTo(14, 56, 8, 64);
    ctx.closePath();
  });
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(23, 27, 5, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(41, 27, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(32, 44, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A jack-o'-lantern flying on small bat wings. */
function pumpkin(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 70, h / 64);
  glow(ctx, 35, 36, 34, 'rgba(255, 150, 40, 0.35)');
  for (const side of [-1, 1]) {
    shape(ctx, '#2b1842', () => {
      ctx.moveTo(35 + side * 16, 30);
      ctx.quadraticCurveTo(35 + side * 30, 12, 35 + side * 34, 18);
      ctx.quadraticCurveTo(35 + side * 30, 26, 35 + side * 33, 34);
      ctx.quadraticCurveTo(35 + side * 26, 30, 35 + side * 20, 38);
      ctx.closePath();
    }, 2);
  }
  shape(ctx, '#e8741e', () => ctx.ellipse(35, 38, 22, 20, 0, 0, Math.PI * 2));
  ctx.strokeStyle = '#a84d10';
  ctx.lineWidth = 2;
  for (const rx of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.ellipse(35 + rx, 38, 6, 19, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  shape(ctx, '#4f7a2e', () => ctx.rect(32, 14, 6, 8), 2);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(24, 34);
  ctx.lineTo(30, 28);
  ctx.lineTo(32, 36);
  ctx.closePath();
  ctx.moveTo(46, 34);
  ctx.lineTo(40, 28);
  ctx.lineTo(38, 36);
  ctx.closePath();
  ctx.moveTo(22, 44);
  ctx.lineTo(48, 44);
  ctx.lineTo(44, 50);
  ctx.lineTo(39, 47);
  ctx.lineTo(35, 51);
  ctx.lineTo(31, 47);
  ctx.lineTo(26, 50);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function skeleton(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 56, h / 70);
  const bone = '#ece4d0';
  ctx.lineCap = 'round';
  const limb = (x1: number, y1: number, x2: number, y2: number): void => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = bone;
    ctx.lineWidth = 4;
    ctx.stroke();
  };
  // Arms raised, legs apart
  limb(20, 30, 8, 18);
  limb(8, 18, 6, 6);
  limb(36, 30, 48, 18);
  limb(48, 18, 50, 6);
  limb(24, 52, 18, 68);
  limb(32, 52, 38, 68);
  limb(28, 26, 28, 52);
  // Ribs and pelvis
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  for (const y of [32, 38, 44]) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.quadraticCurveTo(28, y + 4, 36, y);
    ctx.stroke();
  }
  ctx.strokeStyle = bone;
  ctx.lineWidth = 2.5;
  for (const y of [32, 38, 44]) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.quadraticCurveTo(28, y + 4, 36, y);
    ctx.stroke();
  }
  shape(ctx, bone, () => ctx.ellipse(28, 52, 9, 4, 0, 0, Math.PI * 2), 2);
  // Skull with glowing eyes
  shape(ctx, bone, () => {
    ctx.arc(28, 13, 11, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineTo(34, 26);
    ctx.lineTo(22, 26);
    ctx.closePath();
  }, 2.5);
  ctx.fillStyle = '#d63b3b';
  ctx.beginPath();
  ctx.arc(24, 13, 3, 0, Math.PI * 2);
  ctx.arc(32, 13, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillRect(25, 22, 6, 1.6);
  ctx.restore();
}

/** A golden chest with carrying poles and winged figures on the lid (an invented, simple design). */
function ark(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 110, h / 72);
  glow(ctx, 55, 40, 55, 'rgba(255, 220, 120, 0.45)');
  shape(ctx, '#7a5a2a', () => ctx.rect(4, 44, 102, 6), 2);
  shape(ctx, GOLD, () => ctx.rect(22, 30, 66, 36));
  ctx.strokeStyle = GOLD_DARK;
  ctx.lineWidth = 2;
  ctx.strokeRect(27, 35, 56, 26);
  shape(ctx, GOLD, () => ctx.rect(18, 24, 74, 8), 2.5);
  for (const side of [-1, 1]) {
    shape(ctx, '#ffe08a', () => {
      ctx.moveTo(55 + side * 6, 24);
      ctx.quadraticCurveTo(55 + side * 14, 4, 55 + side * 34, 6);
      ctx.quadraticCurveTo(55 + side * 30, 14, 55 + side * 34, 18);
      ctx.quadraticCurveTo(55 + side * 26, 22, 55 + side * 22, 24);
      ctx.closePath();
    }, 2);
  }
  ctx.restore();
}

/** A shining golden chalice. */
function grail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 60, h / 76);
  glow(ctx, 30, 30, 34, 'rgba(255, 230, 150, 0.55)');
  ctx.strokeStyle = 'rgba(255, 240, 190, 0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(30 + Math.cos(a) * 20, 26 + Math.sin(a) * 20);
    ctx.lineTo(30 + Math.cos(a) * 29, 26 + Math.sin(a) * 29);
    ctx.stroke();
  }
  shape(ctx, GOLD, () => {
    ctx.moveTo(12, 12);
    ctx.lineTo(48, 12);
    ctx.quadraticCurveTo(48, 40, 30, 42);
    ctx.quadraticCurveTo(12, 40, 12, 12);
    ctx.closePath();
  });
  shape(ctx, GOLD, () => {
    ctx.rect(27, 42, 6, 18);
    ctx.ellipse(30, 66, 15, 6, 0, 0, Math.PI * 2);
  }, 2.5);
  ctx.fillStyle = '#c23b5a';
  ctx.beginPath();
  ctx.arc(30, 26, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b7bc2';
  ctx.beginPath();
  ctx.arc(20, 22, 2.5, 0, Math.PI * 2);
  ctx.arc(40, 22, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The Devil: an invented, menacing horned figure with bat wings and a trident. */
function devil(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 260, h / 240);
  glow(ctx, 130, 120, 130, 'rgba(255, 70, 30, 0.35)');
  // Wings
  for (const side of [-1, 1]) {
    shape(ctx, '#3a0d18', () => {
      ctx.moveTo(130 + side * 40, 90);
      ctx.quadraticCurveTo(130 + side * 90, 10, 130 + side * 126, 30);
      ctx.quadraticCurveTo(130 + side * 108, 60, 130 + side * 124, 92);
      ctx.quadraticCurveTo(130 + side * 100, 84, 130 + side * 96, 116);
      ctx.quadraticCurveTo(130 + side * 76, 104, 130 + side * 66, 134);
      ctx.closePath();
    });
  }
  // Trident
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(214, 236);
  ctx.lineTo(214, 70);
  ctx.stroke();
  ctx.strokeStyle = '#9a9aa8';
  ctx.lineWidth = 5;
  ctx.stroke();
  shape(ctx, '#9a9aa8', () => {
    ctx.moveTo(194, 92);
    ctx.lineTo(196, 56);
    ctx.lineTo(202, 80);
    ctx.lineTo(210, 80);
    ctx.lineTo(214, 46);
    ctx.lineTo(218, 80);
    ctx.lineTo(226, 80);
    ctx.lineTo(232, 56);
    ctx.lineTo(234, 92);
    ctx.closePath();
  }, 2.5);
  // Body
  shape(ctx, '#b3202c', () => {
    ctx.moveTo(84, 236);
    ctx.quadraticCurveTo(76, 160, 100, 128);
    ctx.lineTo(160, 128);
    ctx.quadraticCurveTo(184, 160, 176, 236);
    ctx.closePath();
  });
  shape(ctx, '#b3202c', () => ctx.ellipse(208, 150, 14, 12, 0, 0, Math.PI * 2), 2.5);
  ctx.strokeStyle = '#7d1520';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(130, 150);
  ctx.lineTo(130, 200);
  ctx.moveTo(110, 170);
  ctx.quadraticCurveTo(130, 178, 150, 170);
  ctx.stroke();
  // Head and horns
  for (const side of [-1, 1]) {
    shape(ctx, '#e8dcc0', () => {
      ctx.moveTo(130 + side * 26, 64);
      ctx.quadraticCurveTo(130 + side * 56, 52, 130 + side * 58, 16);
      ctx.quadraticCurveTo(130 + side * 40, 40, 130 + side * 14, 50);
      ctx.closePath();
    });
  }
  shape(ctx, '#c4222f', () => {
    ctx.moveTo(98, 70);
    ctx.quadraticCurveTo(98, 42, 130, 42);
    ctx.quadraticCurveTo(162, 42, 162, 70);
    ctx.quadraticCurveTo(160, 110, 130, 132);
    ctx.quadraticCurveTo(100, 110, 98, 70);
    ctx.closePath();
  });
  // Brows, glowing eyes, grin with fangs, pointed beard
  ctx.fillStyle = '#ffd23f';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(130 + side * 8, 76);
    ctx.lineTo(130 + side * 26, 68);
    ctx.lineTo(130 + side * 24, 80);
    ctx.closePath();
    ctx.fill();
  }
  glow(ctx, 112, 76, 14, 'rgba(255, 220, 80, 0.6)');
  glow(ctx, 148, 76, 14, 'rgba(255, 220, 80, 0.6)');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(104, 64);
  ctx.lineTo(126, 72);
  ctx.moveTo(156, 64);
  ctx.lineTo(134, 72);
  ctx.stroke();
  shape(ctx, '#2a0a10', () => {
    ctx.moveTo(110, 96);
    ctx.quadraticCurveTo(130, 112, 150, 96);
    ctx.quadraticCurveTo(130, 104, 110, 96);
    ctx.closePath();
  }, 2.5);
  ctx.fillStyle = '#f4f1ea';
  for (const fx of [118, 140]) {
    ctx.beginPath();
    ctx.moveTo(fx, 99);
    ctx.lineTo(fx + 3, 106);
    ctx.lineTo(fx + 6, 100);
    ctx.closePath();
    ctx.fill();
  }
  shape(ctx, '#3a0d18', () => {
    ctx.moveTo(122, 118);
    ctx.lineTo(130, 146);
    ctx.lineTo(138, 118);
    ctx.closePath();
  }, 2);
  ctx.restore();
}

function holyBolt(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255, 255, 240, 1)');
  g.addColorStop(0.5, 'rgba(255, 226, 120, 0.95)');
  g.addColorStop(1, 'rgba(255, 190, 60, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.3, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}

function fireball(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#fff3b0');
  g.addColorStop(0.35, '#ffb02e');
  g.addColorStop(0.75, '#e2421c');
  g.addColorStop(1, 'rgba(160, 20, 10, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
  ctx.fill();
}

function bone(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 32, h / 14);
  shape(ctx, '#ece4d0', () => {
    ctx.rect(7, 5, 18, 4);
    for (const [x, y] of [
      [6, 4],
      [6, 10],
      [26, 4],
      [26, 10],
    ]) {
      ctx.moveTo(x + 3.5, y);
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    }
  }, 1.5);
  ctx.restore();
}

/** Round badge for a boost. */
function badge(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, symbol: () => void): void {
  ctx.save();
  ctx.scale(w / 48, h / 48);
  glow(ctx, 24, 24, 24, 'rgba(255, 255, 255, 0.35)');
  shape(ctx, color, () => ctx.arc(24, 24, 18, 0, Math.PI * 2));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(24, 24, 14.5, 0, Math.PI * 2);
  ctx.stroke();
  symbol();
  ctx.restore();
}

function boostRapid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  badge(ctx, w, h, '#c2412c', () => {
    shape(ctx, '#ffe066', () => {
      ctx.moveTo(27, 10);
      ctx.lineTo(16, 27);
      ctx.lineTo(23, 27);
      ctx.lineTo(20, 38);
      ctx.lineTo(32, 20);
      ctx.lineTo(25, 20);
      ctx.closePath();
    }, 2);
  });
}

function boostSpread(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  badge(ctx, w, h, '#2f6fb3', () => {
    ctx.strokeStyle = '#fff6d5';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const a of [-0.5, 0, 0.5]) {
      ctx.moveTo(24, 34);
      ctx.lineTo(24 + Math.sin(a) * 18, 34 - Math.cos(a) * 20);
    }
    ctx.stroke();
  });
}

function boostShield(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  badge(ctx, w, h, '#8a5ac2', () => {
    ctx.strokeStyle = '#ffe08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(24, 22, 11, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.arc(24, 32, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** A ring of golden light around the pope while the shield boost lasts. */
function shieldRing(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.min(w, h) / 2);
  g.addColorStop(0, 'rgba(255, 230, 140, 0)');
  g.addColorStop(0.8, 'rgba(255, 230, 140, 0.35)');
  g.addColorStop(1, 'rgba(255, 230, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 240, 180, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2 - 8, h / 2 - 8, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** One point of the pope's endurance (a small golden cross). */
function lifeCross(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 22, h / 26);
  shape(ctx, GOLD, () => {
    ctx.rect(8, 2, 6, 22);
    ctx.rect(2, 7, 18, 6);
  }, 2);
  ctx.restore();
}

function preview(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 1280, h / 720);
  graveyard(ctx, 1280, 720);
  ctx.restore();
  ctx.fillStyle = 'rgba(10, 5, 20, 0.35)';
  ctx.fillRect(0, 0, w, h);
  const at = (x: number, y: number, draw: () => void): void => {
    ctx.save();
    ctx.translate(x, y);
    draw();
    ctx.restore();
  };
  at(130, 4, () => devil(ctx, 100, 92));
  at(40, 70, () => ghost(ctx, 36, 40));
  at(270, 66, () => pumpkin(ctx, 44, 40));
  at(222, 106, () => drawBat(ctx, 44, 30));
  at(60, 118, () => skeleton(ctx, 30, 38));
  at(300, 16, () => grail(ctx, 30, 38));
  ctx.fillStyle = 'rgba(255, 236, 160, 0.9)';
  for (const [x, y] of [
    [180, 96],
    [180, 118],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 3, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  at(158, 132, () => pope(ctx, 50, 62));
}

const spec = (file: string, width: number, height: number, title: string, prompt: string, transparent: boolean, draw: AssetSpec['draw']): AssetSpec => ({
  file,
  width,
  height,
  title,
  prompt,
  style: STYLE,
  transparent,
  draw,
});

export const PREVIEW = spec(
  'valikko-raiskinta.png',
  360,
  200,
  'Räiskinnän esikatselukuva valikkoon',
  'Pieni valikkokuva räiskintäpelille: ylhäältä päin nähty yöllinen hautausmaa, alalaidassa valkoasuinen paavihahmo kultaisen paimensauvan kanssa ampuu valonsäteitä ylöspäin, ylhäällä aaveita, lentävä kurpitsalyhty, lepakko ja luuranko, keskellä ylhäällä uhkaava sarvipäinen Paholainen. Keksitty hahmo, ei oikea paavi.',
  false,
  preview,
);

export const BACKGROUND = spec(
  'raiskinta-hautausmaa.png',
  1280,
  720,
  'Hautausmaa ylhäältä päin',
  'Yöllinen hautausmaa vinosti ylhäältä päin nähtynä: tumma ruoho, mutkitteleva kivipolku keskellä, hautakiviä, ristejä ja hautakumpuja riveissä, ohutta usvaa. Kuva toistuu pystysuunnassa saumattomasti: ylä- ja alareuna jatkuvat toisiinsa. Ei hahmoja.',
  false,
  graveyard,
);

export const POPE = spec(
  'raiskinta-paavi.png',
  90,
  110,
  'Paavi',
  'Keksitty, hyväntahtoinen paavihahmo edestä: valkoinen kaapu kultaisella raidalla, punainen olkaviitta, korkea valkoinen hiippa jossa kultainen risti, punaiset posket, kädessä kultainen paimensauva jonka kärki hehkuu. Ei mikään oikea paavi.',
  true,
  pope,
);

export const GHOST = spec('raiskinta-haamu.png', 64, 70, 'Aave', 'Valkoinen lakanamainen aave mustin silmin ja avoimin suin, aaltoileva helma, kylmä sininen hehku.', true, ghost);

export const BAT = spec(
  'raiskinta-lepakko.png',
  70,
  46,
  'Lepakko',
  'Lepakko lentää suoraan katsojaa kohti siivet levällään: tumma violetti siipikalvo, aaltoileva alareuna, pienet terävät korvat ja hehkuvat oranssit silmät. Ohut vaalea ääriviiva.',
  true,
  drawBat,
);

export const PUMPKIN = spec(
  'raiskinta-kurpitsa.png',
  70,
  64,
  'Lentävä kurpitsalyhty',
  'Oranssi kurpitsalyhty, jonka kaiverretut kasvot hehkuvat keltaisina ja jolla on pienet tummat lepakonsiivet. Ilkikurinen ilme.',
  true,
  pumpkin,
);

export const SKELETON = spec(
  'raiskinta-luuranko.png',
  56,
  70,
  'Luuranko',
  'Luuranko edestä kädet ylhäällä ja jalat harallaan, punaisina hehkuvat silmäkuopat, luunvalkoinen.',
  true,
  skeleton,
);

export const ARK = spec(
  'raiskinta-liitonarkku.png',
  110,
  72,
  'Liitonarkku',
  'Kultainen arkku, jonka sivuilla kantotangot ja kannella kaksi siivekästä kultaista hahmoa vastakkain, ympärillä lämmin hehku. Yksinkertainen oma tulkinta.',
  true,
  ark,
);

export const GRAIL = spec('raiskinta-malja.png', 60, 76, 'Pyhä malja', 'Kultainen malja jalokivin, ympärillä säteilevä valo.', true, grail);

export const DEVIL = spec(
  'raiskinta-paholainen.png',
  260,
  240,
  'Paholainen (loppuvastus)',
  'Keksitty uhkaava Paholainen edestä: punainen iho, suuret kaartuvat sarvet, keltaisina hehkuvat silmät, ilkeä virne torahampain, suippo musta parta, levitetyt lepakonsiivet ja kolmikärkinen hanko kädessä. Pelottava mutta ei verinen.',
  true,
  devil,
);

export const BOLT = spec('raiskinta-valo.png', 14, 34, 'Paavin valonsäde', 'Pystysuora kirkas valonsäde: valkoinen kärki, kultainen hehku joka häipyy alaspäin.', true, holyBolt);

export const FIREBALL = spec('raiskinta-tulipallo.png', 28, 28, 'Tulipallo', 'Pyöreä tulipallo: keltainen keskus, oranssi ja punainen reuna, pehmeä hehku.', true, fireball);

export const BONE = spec('raiskinta-luu.png', 32, 14, 'Heitetty luu', 'Pieni luunvalkoinen luu vaakasuunnassa, nuppimaiset päät.', true, bone);

export const BOOST_RAPID = spec('raiskinta-boosti-tuli.png', 48, 48, 'Boosti: nopea tuli', 'Pyöreä punainen merkki, jossa keltainen salama.', true, boostRapid);

export const BOOST_SPREAD = spec('raiskinta-boosti-haja.png', 48, 48, 'Boosti: hajaammus', 'Pyöreä sininen merkki, jossa kolme vaaleaa sädettä viuhkana.', true, boostSpread);

export const BOOST_SHIELD = spec('raiskinta-boosti-suoja.png', 48, 48, 'Boosti: suojakehä', 'Pyöreä violetti merkki, jossa kultainen sädekehä.', true, boostShield);

export const SHIELD = spec('raiskinta-suojakeha.png', 130, 140, 'Suojakehä', 'Läpikuultava kultainen valorengas, joka ympäröi hahmon. Keskusta läpinäkyvä.', true, shieldRing);

export const LIFE = spec('raiskinta-kesto.png', 22, 26, 'Kestopiste (pieni risti)', 'Pieni kultainen risti mustalla ääriviivalla.', true, lifeCross);

export const ASSETS: AssetSpec[] = [BACKGROUND, POPE, GHOST, BAT, PUMPKIN, SKELETON, ARK, GRAIL, DEVIL, BOLT, FIREBALL, BONE, BOOST_RAPID, BOOST_SPREAD, BOOST_SHIELD, SHIELD, LIFE];
