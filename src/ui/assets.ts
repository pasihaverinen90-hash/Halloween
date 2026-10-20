import type { AssetSpec } from '../games/types';

/*
 * Shared images of the menus and overlays. No Phaser import: this file is also
 * read by scripts/kuvalista.ts (Node) to generate ASSETS.md.
 */

/** Small deterministic random generator so the drawing looks the same every time. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGravestone(ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, kind: number): void {
  ctx.beginPath();
  if (kind === 0) {
    // Rounded top
    ctx.moveTo(x - w / 2, base);
    ctx.lineTo(x - w / 2, base - h + w / 2);
    ctx.arc(x, base - h + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w / 2, base);
  } else if (kind === 1) {
    // Cross
    const t = w * 0.32;
    ctx.rect(x - t / 2, base - h, t, h);
    ctx.rect(x - w / 2, base - h * 0.72, w, t);
  } else {
    // Pointed top
    ctx.moveTo(x - w / 2, base);
    ctx.lineTo(x - w / 2, base - h * 0.75);
    ctx.lineTo(x, base - h);
    ctx.lineTo(x + w / 2, base - h * 0.75);
    ctx.lineTo(x + w / 2, base);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBranch(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  depth: number,
): void {
  const bend = (rand() - 0.5) * 0.5;
  const ex = x + Math.cos(angle) * length;
  const ey = y + Math.sin(angle) * length;
  const cx = x + Math.cos(angle + bend) * length * 0.55;
  const cy = y + Math.sin(angle + bend) * length * 0.55;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, ex, ey);
  ctx.stroke();
  if (depth <= 0 || width < 1.2) return;
  const children = 2 + (rand() < 0.35 ? 1 : 0);
  for (let i = 0; i < children; i++) {
    const spread = (i - (children - 1) / 2) * (0.55 + rand() * 0.35);
    drawBranch(ctx, rand, ex, ey, angle + spread + (rand() - 0.5) * 0.3, length * (0.62 + rand() * 0.12), width * 0.62, depth - 1);
  }
}

/** The shared night background: sky, moon, hills, a bare tree, gravestones and fog. */
function drawNight(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const rand = seededRandom(31102026);

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#07040f');
  sky.addColorStop(0.45, '#160d2c');
  sky.addColorStop(0.78, '#2b1742');
  sky.addColorStop(1, '#3a1d3f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (let i = 0; i < 140; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.6;
    const r = rand() < 0.08 ? 1.6 : 0.5 + rand() * 0.8;
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = '#f4ecd8';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon with a soft glow
  const mx = w * 0.79;
  const my = h * 0.22;
  const mr = 74;
  const glow = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 4);
  glow.addColorStop(0, 'rgba(255, 226, 170, 0.32)');
  glow.addColorStop(0.35, 'rgba(255, 190, 120, 0.12)');
  glow.addColorStop(1, 'rgba(255, 190, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  const moon = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
  moon.addColorStop(0, '#fff6dc');
  moon.addColorStop(1, '#e9cf98');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(160, 120, 70, 0.18)';
  for (const [dx, dy, r] of [
    [-22, -14, 15],
    [18, 10, 11],
    [-6, 26, 8],
    [28, -26, 7],
    [-34, 16, 6],
  ]) {
    ctx.beginPath();
    ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thin clouds across the moon
  ctx.fillStyle = 'rgba(30, 18, 52, 0.55)';
  for (const [cx, cy, cw] of [
    [mx - 40, my + 30, 260],
    [mx + 120, my - 40, 180],
    [w * 0.25, h * 0.18, 300],
  ]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw / 2, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant hills
  const hills = (base: number, amp: number, color: string, phase: number): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) {
      const y = base + Math.sin(x / 210 + phase) * amp + Math.sin(x / 83 + phase * 2) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };
  hills(h * 0.7, 26, '#241338', 1.2);
  hills(h * 0.77, 20, '#1a0d29', 3.1);

  // Bare tree on the left
  ctx.strokeStyle = '#0a0612';
  ctx.lineCap = 'round';
  drawBranch(ctx, rand, 150, h, -Math.PI / 2 - 0.08, 170, 26, 5);

  // Ground
  ctx.fillStyle = '#0d0818';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * 0.86 + Math.sin(x / 140) * 8);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Gravestones
  ctx.fillStyle = '#0a0612';
  const stones: Array<[number, number, number, number]> = [
    [300, 34, 58, 0],
    [380, 26, 44, 1],
    [470, 30, 50, 2],
    [860, 36, 62, 0],
    [950, 28, 46, 1],
    [1050, 32, 54, 2],
    [1150, 26, 42, 0],
  ];
  for (const [x, sw, sh, kind] of stones) drawGravestone(ctx, x, h * 0.87 + Math.sin(x / 140) * 8 + 6, sw, sh, kind);

  // Fog
  for (let i = 0; i < 5; i++) {
    const y = h * (0.8 + i * 0.045);
    const fog = ctx.createLinearGradient(0, y - 30, 0, y + 30);
    fog.addColorStop(0, 'rgba(190, 170, 230, 0)');
    fog.addColorStop(0.5, `rgba(190, 170, 230, ${0.05 + i * 0.012})`);
    fog.addColorStop(1, 'rgba(190, 170, 230, 0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, y - 30, w, 60);
  }

  // Vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

export const YLEINEN_TAUSTA: AssetSpec = {
  file: 'yleinen-tausta.png',
  width: 1280,
  height: 720,
  title: 'Yleinen taustakuva',
  prompt:
    'Yöllinen Halloween-maisema leveänä taustakuvana: tumma violetinmusta tähtitaivas, oikeassa yläkulmassa suuri ' +
    'lämpimänkeltainen täysikuu pehmeine hehkuineen, kaukana matalia kukkuloita, vasemmalla lehdetön kiemurainen puu ' +
    'siluettina, maassa muutama hautakivi ja risti siluetteina ja matala usva maan rajassa. Kuvan keskiosa on rauhallinen ' +
    'ja tumma, koska sen päälle tulee tekstiä ja valikoita. Ei ihmisiä, ei tekstiä, ei tunnettuja hahmoja.',
  style: 'Pelkistetty piirroskuva, tumma ja tunnelmallinen mutta ei lapsellinen; violetti, musta ja kuunvalon oranssi.',
  transparent: false,
  draw: drawNight,
};

/** All shared images (games list their own in src/games/<id>/assets.ts). */
export const UI_ASSETS: AssetSpec[] = [YLEINEN_TAUSTA];
