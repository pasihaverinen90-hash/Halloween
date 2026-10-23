import type { AssetSpec } from '../types';

/*
 * Catapult game images, drawn by code in a simple outlined style until Pasi
 * provides his own (same names in public/assets/). No Phaser import:
 * scripts/kuvalista.ts reads this file to generate ASSETS.md.
 */

const INK = '#1a1124';
const STYLE = 'Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.';

function outline(ctx: CanvasRenderingContext2D, width = 3): void {
  ctx.lineWidth = width;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/** Draws the path, fills it and outlines it. */
function shape(ctx: CanvasRenderingContext2D, fill: string, path: () => void, line = 3): void {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  outline(ctx, line);
  ctx.stroke();
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function nightSky(ctx: CanvasRenderingContext2D, w: number, h: number, top: string, bottom: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const rnd = seeded(7);
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(240, 230, 255, ${0.3 + rnd() * 0.6})`;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h * 0.6, 0.8 + rnd() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The night over the skeleton castle: moon, and the castle far behind. */
function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  nightSky(ctx, w, h, '#120a26', '#3b1f45');
  const moonY = h * 0.22;
  const glow = ctx.createRadialGradient(1500, moonY, 20, 1500, moonY, 220);
  glow.addColorStop(0, 'rgba(255, 236, 190, 0.35)');
  glow.addColorStop(1, 'rgba(255, 236, 190, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(1200, moonY - 220, 600, 440);
  shape(ctx, '#f3e6b8', () => ctx.arc(1500, moonY, 70, 0, Math.PI * 2), 0);
  ctx.fillStyle = 'rgba(200, 180, 140, 0.5)';
  for (const [x, y, r] of [
    [1478, moonY - 20, 14],
    [1525, moonY + 25, 10],
    [1510, moonY - 30, 7],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // The castle on the horizon.
  ctx.fillStyle = '#1d1230';
  const base = h * 0.82;
  ctx.fillRect(1100, base - 120, 700, 200);
  for (const [x, top, width] of [
    [1100, 220, 70],
    [1300, 170, 80],
    [1520, 200, 70],
    [1730, 150, 80],
  ]) {
    ctx.fillRect(x, base - top, width, top);
    ctx.beginPath();
    ctx.moveTo(x - 10, base - top);
    ctx.lineTo(x + width / 2, base - top - 70);
    ctx.lineTo(x + width + 10, base - top);
    ctx.closePath();
    ctx.fill();
  }
  for (let x = 1100; x < 1800; x += 40) ctx.fillRect(x, base - 140, 22, 20);
  ctx.fillStyle = 'rgba(255, 190, 90, 0.7)';
  for (const [x, y] of [
    [1325, base - 120],
    [1550, base - 150],
    [1760, base - 100],
    [1200, base - 60],
  ]) {
    ctx.fillRect(x, y, 10, 18);
  }
  // Low hills in front of it.
  ctx.fillStyle = '#170e25';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 40) ctx.lineTo(x, h * 0.86 - Math.sin(x / 260) * 30 - Math.sin(x / 90) * 8);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

/** Inside the crypt: dark stone, torches. */
function drawCrypt(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0d0a14');
  g.addColorStop(1, '#24182c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(80, 70, 100, 0.35)';
  ctx.lineWidth = 2;
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    for (let x = (y / 40) % 2 === 0 ? 0 : 40; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 40);
      ctx.stroke();
    }
  }
  for (const x of [520, 980, 1440]) {
    const glow = ctx.createRadialGradient(x, 380, 5, x, 380, 160);
    glow.addColorStop(0, 'rgba(255, 170, 70, 0.4)');
    glow.addColorStop(1, 'rgba(255, 170, 70, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 160, 220, 320, 320);
    shape(ctx, '#4a3a2a', () => ctx.rect(x - 5, 380, 10, 34), 2);
    shape(ctx, '#ffb030', () => {
      ctx.moveTo(x, 352);
      ctx.quadraticCurveTo(x + 12, 370, x, 382);
      ctx.quadraticCurveTo(x - 12, 370, x, 352);
    }, 2);
  }
  // The open night at the entrance on the left.
  ctx.fillStyle = 'rgba(60, 40, 90, 0.6)';
  ctx.fillRect(0, 0, 400, h);
}

/** Tiling ground patterns. */
function drawEarth(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#4a3326';
  ctx.fillRect(0, 0, w, h);
  const rnd = seeded(3);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = rnd() < 0.5 ? '#3a271d' : '#5a3f2e';
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 6, 2 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 6; i++) {
    const x = rnd() * (w - 20) + 10;
    const y = rnd() * (h - 20) + 10;
    shape(ctx, '#6a6070', () => ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI * 2), 1.5);
  }
}

function drawStone(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#4c4a5e';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2a2838';
  ctx.lineWidth = 3;
  const rowH = h / 4;
  for (let r = 0; r < 4; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * rowH);
    ctx.lineTo(w, r * rowH);
    ctx.stroke();
    const shift = r % 2 === 0 ? 0 : w / 4;
    for (let x = shift; x < w; x += w / 2) {
      ctx.beginPath();
      ctx.moveTo(x, r * rowH);
      ctx.lineTo(x, (r + 1) * rowH);
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let r = 0; r < 4; r++) ctx.fillRect(0, r * rowH + 3, w, 4);
}

function drawWood(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#4a2f18';
  ctx.lineWidth = 2;
  for (let y = h / 2; y < h; y += h / 2) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (const x of [w * 0.3, w * 0.8]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a1a10';
  for (const x of [w * 0.1, w * 0.55]) {
    ctx.beginPath();
    ctx.arc(x, h * 0.25, 2, 0, Math.PI * 2);
    ctx.arc(x, h * 0.75, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Wooden catapult frame and wheels (the arm is a picture of its own). */
function drawCatapult(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  shape(ctx, '#6a4527', () => ctx.rect(10, h - 34, w - 20, 16));
  shape(ctx, '#7d5534', () => {
    ctx.moveTo(w * 0.35, h - 30);
    ctx.lineTo(w * 0.5, 14);
    ctx.lineTo(w * 0.65, h - 30);
    ctx.closePath();
  });
  shape(ctx, '#4a2f18', () => ctx.arc(w * 0.5, 18, 8, 0, Math.PI * 2));
  for (const x of [28, w - 28]) {
    shape(ctx, '#5b3b24', () => ctx.arc(x, h - 16, 15, 0, Math.PI * 2));
    shape(ctx, '#8a6a44', () => ctx.arc(x, h - 16, 4, 0, Math.PI * 2), 2);
  }
}

/** The catapult arm with the bucket at its end, pointing right from the pivot (left end). */
function drawArm(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  shape(ctx, '#8a5c34', () => ctx.rect(4, h / 2 - 5, w - 26, 10));
  shape(ctx, '#5b3b24', () => {
    ctx.moveTo(w - 32, h / 2 - 11);
    ctx.quadraticCurveTo(w - 16, h / 2 + 14, w - 2, h / 2 - 11);
    ctx.closePath();
  });
}

/** Pumpkin-headed warrior who works the catapult (Pasi 22.10.). */
function drawWarrior(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  // Legs and boots
  shape(ctx, '#2b2533', () => ctx.rect(cx - 12, h - 34, 9, 28));
  shape(ctx, '#2b2533', () => ctx.rect(cx + 3, h - 34, 9, 28));
  shape(ctx, '#3a2416', () => ctx.rect(cx - 15, h - 8, 13, 8));
  shape(ctx, '#3a2416', () => ctx.rect(cx + 2, h - 8, 13, 8));
  // Armoured body and a dark cloak
  shape(ctx, '#2a1a3a', () => {
    ctx.moveTo(cx - 20, h - 30);
    ctx.lineTo(cx - 14, h - 68);
    ctx.lineTo(cx + 14, h - 68);
    ctx.lineTo(cx + 20, h - 30);
    ctx.closePath();
  });
  shape(ctx, '#7a8094', () => ctx.rect(cx - 12, h - 66, 24, 28));
  shape(ctx, '#5a3a22', () => ctx.rect(cx - 13, h - 42, 26, 6), 2);
  // Arm reaching for the catapult
  shape(ctx, '#7a8094', () => ctx.rect(cx + 8, h - 62, 18, 8));
  // Pumpkin head with a carved face
  shape(ctx, '#e8781e', () => ctx.ellipse(cx, h - 82, 20, 16, 0, 0, Math.PI * 2));
  ctx.strokeStyle = '#b85a12';
  ctx.lineWidth = 2;
  for (const dx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.ellipse(cx + dx, h - 82, 4, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  shape(ctx, '#3f5f34', () => ctx.rect(cx - 3, h - 100, 6, 7), 2);
  ctx.fillStyle = '#ffe07a';
  for (const dx of [-8, 8]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx - 4, h - 82);
    ctx.lineTo(cx + dx, h - 89);
    ctx.lineTo(cx + dx + 4, h - 82);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx - 10, h - 76);
  ctx.lineTo(cx + 10, h - 76);
  ctx.lineTo(cx + 5, h - 71);
  ctx.lineTo(cx, h - 74);
  ctx.lineTo(cx - 5, h - 71);
  ctx.closePath();
  ctx.fill();
}

/** Skeleton guard of the castle: standing, walking 1, walking 2. */
function drawSkeleton(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const fw = w / 3;
  for (let i = 0; i < 3; i++) {
    const cx = i * fw + fw / 2;
    const bone = '#ece4cc';
    const legs = i === 0 ? [0, 0] : i === 1 ? [-6, 6] : [6, -6];
    for (const [k, dx] of legs.entries()) {
      const hip = cx + (k === 0 ? -5 : 5);
      shape(ctx, bone, () => {
        ctx.moveTo(hip, h - 32);
        ctx.lineTo(hip + dx, h - 4);
      }, 0);
      outline(ctx, 6);
      ctx.beginPath();
      ctx.moveTo(hip, h - 32);
      ctx.lineTo(hip + dx, h - 4);
      ctx.stroke();
      ctx.strokeStyle = bone;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // Spine and ribs
    shape(ctx, bone, () => ctx.rect(cx - 2, h - 56, 4, 26), 2);
    for (let y = h - 54; y < h - 34; y += 6) {
      shape(ctx, bone, () => ctx.ellipse(cx, y, 10, 2.5, 0, 0, Math.PI * 2), 1.5);
    }
    shape(ctx, bone, () => ctx.ellipse(cx, h - 31, 9, 4, 0, 0, Math.PI * 2), 1.5);
    // Arms holding a rusty spear
    outline(ctx, 5);
    ctx.beginPath();
    ctx.moveTo(cx - 9, h - 52);
    ctx.lineTo(cx - 14, h - 36);
    ctx.moveTo(cx + 9, h - 52);
    ctx.lineTo(cx + 13, h - 38);
    ctx.stroke();
    ctx.strokeStyle = bone;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    outline(ctx, 3);
    ctx.beginPath();
    ctx.moveTo(cx + 16, h - 8);
    ctx.lineTo(cx + 16, h - 70);
    ctx.strokeStyle = '#6a4527';
    ctx.stroke();
    shape(ctx, '#8a8a96', () => {
      ctx.moveTo(cx + 11, h - 68);
      ctx.lineTo(cx + 16, h - 80);
      ctx.lineTo(cx + 21, h - 68);
      ctx.closePath();
    }, 2);
    // Skull
    shape(ctx, bone, () => ctx.ellipse(cx, h - 66, 9, 9, 0, 0, Math.PI * 2), 2);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(cx - 3.5, h - 67, 2.6, 0, Math.PI * 2);
    ctx.arc(cx + 3.5, h - 67, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 3, h - 61, 6, 1.5);
  }
}

function drawBarrel(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  shape(ctx, '#7a3a22', () => {
    ctx.moveTo(6, 4);
    ctx.quadraticCurveTo(0, h / 2, 6, h - 4);
    ctx.lineTo(w - 6, h - 4);
    ctx.quadraticCurveTo(w, h / 2, w - 6, 4);
    ctx.closePath();
  });
  for (const y of [10, h - 12]) shape(ctx, '#3a3440', () => ctx.rect(3, y - 3, w - 6, 6), 2);
  ctx.fillStyle = '#f5c542';
  ctx.font = `bold ${Math.round(h * 0.32)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', w / 2, h / 2 + 1);
}

/** Weapon crate (Pasi 23.10.): a wooden box with a pumpkin mark. */
function drawCrate(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  shape(ctx, '#8a5c34', () => ctx.rect(3, 3, w - 6, h - 6));
  ctx.strokeStyle = '#5b3b24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(w - 4, h - 4);
  ctx.moveTo(w - 4, 4);
  ctx.lineTo(4, h - 4);
  ctx.stroke();
  outline(ctx, 3);
  ctx.strokeRect(3, 3, w - 6, h - 6);
  shape(ctx, '#ef7d1e', () => ctx.ellipse(w / 2, h / 2, w * 0.2, h * 0.18, 0, 0, Math.PI * 2), 2);
  shape(ctx, '#3f5f34', () => ctx.rect(w / 2 - 2, h / 2 - h * 0.18 - 4, 4, 5), 1.5);
}

/** Floating symbols that take shots off the count (Pasi 23.10.): −2 and −5. */
function drawTokens(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const fw = w / 2;
  for (const [i, label, color, glowColor] of [
    [0, '−2', '#8fdc5a', 'rgba(143, 220, 90, 0.35)'],
    [1, '−5', '#f5c542', 'rgba(245, 197, 66, 0.4)'],
  ] as const) {
    const cx = i * fw + fw / 2;
    const cy = h / 2;
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, fw / 2);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - fw / 2, 0, fw, h);
    shape(ctx, '#1d1230', () => ctx.arc(cx, cy, fw * 0.32, 0, Math.PI * 2), 3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, fw * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `800 ${Math.round(fw * 0.32)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 1);
  }
}

/** The five projectiles side by side: pumpkin, cluster pumpkin, homing pumpkin, bomb, bomblet. */
function drawProjectiles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const fw = w / 5;
  const pumpkin = (cx: number, cy: number, r: number, color: string, stem = '#3f5f34'): void => {
    shape(ctx, color, () => ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, Math.PI * 2), 2.5);
    ctx.strokeStyle = 'rgba(90, 40, 0, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.4, r * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
    shape(ctx, stem, () => ctx.rect(cx - 2, cy - r - 4, 4, 6), 1.5);
  };
  const face = (cx: number, cy: number, r: number): void => {
    ctx.fillStyle = '#ffe07a';
    for (const dx of [-r * 0.35, r * 0.35]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx - 3, cy - 1);
      ctx.lineTo(cx + dx, cy - 6);
      ctx.lineTo(cx + dx + 3, cy - 1);
      ctx.fill();
    }
    ctx.fillRect(cx - r * 0.4, cy + r * 0.25, r * 0.8, 3);
  };
  // 1. Pumpkin
  pumpkin(fw * 0.5, h / 2, 13, '#ef7d1e');
  face(fw * 0.5, h / 2, 13);
  // 2. Cluster: small pumpkins stuck together
  for (const [dx, dy] of [
    [-6, 4],
    [6, 4],
    [0, -5],
  ]) {
    pumpkin(fw * 1.5 + dx, h / 2 + dy, 8, '#f09a2a');
  }
  // 3. Homing: green glow and a fiery tail
  ctx.fillStyle = 'rgba(143, 220, 90, 0.35)';
  ctx.beginPath();
  ctx.arc(fw * 2.5, h / 2, 17, 0, Math.PI * 2);
  ctx.fill();
  shape(ctx, '#ffb030', () => {
    ctx.moveTo(fw * 2.5 - 10, h / 2 - 5);
    ctx.lineTo(fw * 2.5 - 18, h / 2);
    ctx.lineTo(fw * 2.5 - 10, h / 2 + 5);
    ctx.closePath();
  }, 1.5);
  pumpkin(fw * 2.5 + 2, h / 2, 11, '#8fdc5a', '#2f5a34');
  face(fw * 2.5 + 2, h / 2, 11);
  // 4. Bomb: big dark pumpkin with a fuse
  pumpkin(fw * 3.5, h / 2 + 2, 15, '#3a2a44', '#5a3a22');
  ctx.strokeStyle = '#c8a060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fw * 3.5, h / 2 - 13);
  ctx.quadraticCurveTo(fw * 3.5 + 8, h / 2 - 18, fw * 3.5 + 6, h / 2 - 16);
  ctx.stroke();
  ctx.fillStyle = '#ffd04a';
  ctx.beginPath();
  ctx.arc(fw * 3.5 + 7, h / 2 - 17, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8a1f';
  ctx.fillRect(fw * 3.5 - 6, h / 2, 12, 3);
  // 5. Bomblet
  pumpkin(fw * 4.5, h / 2, 7, '#f09a2a');
}

/** Menu picture: the catapult throws a pumpkin at skeletons on a castle wall. */
function drawPreview(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 1920, h / 1140);
  drawSky(ctx, 1920, 1140);
  ctx.restore();
  ctx.fillStyle = '#4a3326';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, 160);
  ctx.quadraticCurveTo(120, 150, 200, 165);
  ctx.lineTo(w, 160);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3f5f34';
  ctx.fillRect(0, 156, w, 5);
  shape(ctx, '#4c4a5e', () => ctx.rect(250, 80, 60, 82));
  ctx.save();
  ctx.translate(30, 112);
  ctx.scale(0.5, 0.5);
  drawCatapult(ctx, 140, 90);
  ctx.restore();
  ctx.save();
  ctx.translate(4, 112);
  ctx.scale(0.5, 0.5);
  drawWarrior(ctx, 60, 100);
  ctx.restore();
  ctx.save();
  ctx.translate(264, 22);
  ctx.scale(0.75, 0.75);
  ctx.beginPath();
  ctx.rect(0, 0, 44, 80);
  ctx.clip();
  drawSkeleton(ctx, 132, 80);
  ctx.restore();
  ctx.setLineDash([4, 7]);
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(78, 112);
  ctx.quadraticCurveTo(150, 10, 205, 60);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(196, 46);
  ctx.beginPath();
  ctx.rect(0, 0, 36, 36);
  ctx.clip();
  drawProjectiles(ctx, 180, 36);
  ctx.restore();
}

function spec(file: string, title: string, prompt: string, width: number, height: number, draw: AssetSpec['draw'], transparent = true, frames?: AssetSpec['frames']): AssetSpec {
  return { file, title, prompt, style: STYLE, transparent, width, height, frames, draw };
}

export const SKY = spec('piiritys-taivas.png', 'Taivas ja luurankolinna', 'Yötaivas, iso kuu oikealla ylhäällä ja luurankolinnan siluetti kaukana horisontissa kuvan alaosassa. Kuva on kentän levyinen.', 1920, 1140, drawSky, false);
export const CRYPT = spec('piiritys-holvi.png', 'Hautaholvin tausta', 'Hautaholvin tumma kiviseinä ja palavia soihtuja. Vasen reuna on avoin yö.', 1920, 720, drawCrypt, false);
export const EARTH = spec('piiritys-maa.png', 'Maa (toistuva kuvio)', 'Tummaa multaa ja kiviä, kuvio toistuu saumattomasti joka suuntaan.', 128, 128, drawEarth, false);
export const STONE = spec('piiritys-kivi.png', 'Kivi (toistuva kuvio)', 'Linnan kivitiiliä, kuvio toistuu saumattomasti joka suuntaan.', 128, 128, drawStone, false);
export const WOOD = spec('piiritys-puu.png', 'Puu (toistuva kuvio)', 'Vaakasuoria puulankkuja nauloineen, kuvio toistuu saumattomasti joka suuntaan.', 128, 32, drawWood, false);
export const CATAPULT = spec('piiritys-katapultti.png', 'Katapultti', 'Puinen katapultin runko pyörineen sivulta. Heittovarsi piirretään erikseen.', 140, 90, drawCatapult);
export const ARM = spec('piiritys-katapultin-varsi.png', 'Katapultin heittovarsi', 'Katapultin heittovarsi ja kauha sivulta. Varsi osoittaa oikealle, ja kiinnityskohta on vasemmassa reunassa.', 110, 24, drawArm);
export const WARRIOR = spec('piiritys-soturi.png', 'Kurpitsapäinen soturi', 'Soturi, jolla on kaiverrettu kurpitsa päänä, haarniska ja tumma viitta. Katsoo oikealle.', 60, 100, drawWarrior);
export const SKELETON = spec('piiritys-luuranko.png', 'Luurankovartija', 'Luurankovartija, jolla on ruosteinen keihäs. Katsoo vasemmalle.', 44, 80, drawSkeleton, true, { count: 3, order: 'seisoo, kävely 1, kävely 2' });
export const BARREL = spec('piiritys-tynnyri.png', 'Ruutitynnyri', 'Punertava ruutitynnyri, jossa on keltainen huutomerkki.', 40, 48, drawBarrel);
export const PROJECTILES = spec(
  'piiritys-ammukset.png',
  'Ammukset',
  'Viisi kurpitsa-ammusta vierekkäin: tavallinen kurpitsa, kolmen pikkukurpitsan rypäle, vihreänä hehkuva ohjautuva kurpitsa, iso tumma kurpitsapommi sytytyslankoineen ja pieni pikkukurpitsa.',
  36,
  36,
  drawProjectiles,
  true,
  { count: 5, order: 'kurpitsa, rypälekurpitsa, ohjautuva kurpitsa, kurpitsapommi, pikkukurpitsa' },
);
export const CRATE = spec('piiritys-laatikko.png', 'Aselaatikko', 'Puinen laatikko, jonka kyljessä on kurpitsamerkki. Räjähdys avaa sen.', 40, 36, drawCrate);
export const TOKENS = spec('piiritys-merkit.png', 'Laukausmerkit −2 ja −5', 'Ilmassa leijuvat hehkuvat merkit: vihreä ympyrä, jossa on teksti −2, ja kultainen ympyrä, jossa on teksti −5.', 64, 64, drawTokens, true, {
  count: 2,
  order: '−2, −5',
});
export const PREVIEW = spec('piiritys-esikatselu.png', 'Valikon esikatselukuva', 'Katapultti heittää kurpitsan kohti linnan muurilla seisovaa luurankoa yöllä.', 360, 200, drawPreview, false);

export const ASSETS: AssetSpec[] = [SKY, CRYPT, EARTH, STONE, WOOD, CATAPULT, ARM, WARRIOR, SKELETON, BARREL, CRATE, TOKENS, PROJECTILES];
