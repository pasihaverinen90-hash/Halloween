import type { AssetSpec } from '../types';

/*
 * Crossword images, drawn by code in a simple outlined style until Pasi
 * provides his own (same names in public/assets/). No Phaser import:
 * scripts/kuvalista.ts reads this file to generate ASSETS.md.
 */

const INK = '#1a1124';
const STYLE = 'Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.';

/** A cobweb in a corner: (x, y) is the corner, sx/sy point into the picture. */
function cobweb(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, sx: number, sy: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = 'rgba(220, 210, 240, 0.35)';
  ctx.lineWidth = 1.4;
  const spokes = 6;
  for (let i = 0; i <= spokes; i++) {
    const a = (i / spokes) * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    ctx.stroke();
  }
  for (let ring = 1; ring <= 5; ring++) {
    const r = (ring / 5) * size * 0.95;
    ctx.beginPath();
    for (let i = 0; i <= spokes; i++) {
      const a = (i / spokes) * (Math.PI / 2);
      const sag = i === 0 || i === spokes ? 1 : 0.9;
      const px = Math.cos(a) * r * sag;
      const py = Math.sin(a) * r * sag;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function spider(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, threadFrom: number): void {
  ctx.strokeStyle = 'rgba(220, 210, 240, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, threadFrom);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.12;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.1);
      ctx.quadraticCurveTo(x + side * size * 0.6, y - size * 0.3 + i * size * 0.25, x + side * size, y + size * 0.2 + i * size * 0.25);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#120a1c';
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.2, size * 0.38, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5a3d';
  ctx.beginPath();
  ctx.arc(x - size * 0.12, y, size * 0.07, 0, Math.PI * 2);
  ctx.arc(x + size * 0.12, y, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function candle(ctx: CanvasRenderingContext2D, x: number, base: number, height: number): void {
  const glow = ctx.createRadialGradient(x, base - height - 14, 2, x, base - height - 14, 110);
  glow.addColorStop(0, 'rgba(255, 200, 110, 0.35)');
  glow.addColorStop(1, 'rgba(255, 200, 110, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 110, base - height - 124, 220, 220);
  ctx.fillStyle = '#e9dcc0';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(x - 12, base - height, 24, height);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffcf5a';
  ctx.beginPath();
  ctx.moveTo(x, base - height - 30);
  ctx.quadraticCurveTo(x + 10, base - height - 12, x, base - height - 4);
  ctx.quadraticCurveTo(x - 10, base - height - 12, x, base - height - 30);
  ctx.fill();
}

/** A dark study: cobwebs in the corners, a spider and candles. The grid and clues are drawn on top. */
function background(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#120a22');
  g.addColorStop(1, '#24123a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  cobweb(ctx, 0, 0, 170, 1, 1);
  cobweb(ctx, w, 0, 150, -1, 1);
  spider(ctx, w - 60, 120, 16, 0);
  candle(ctx, 40, h, 70);
  candle(ctx, w - 40, h, 90);
}

function preview(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  background(ctx, w, h);
  const cell = 26;
  const cells: Array<[number, number, string]> = [
    [0, 1, 'K'], [1, 1, 'A'], [2, 1, 'L'], [3, 1, 'M'], [4, 1, 'A'],
    [2, 0, 'N'], [2, 2, 'K'], [2, 3, 'K'], [2, 4, 'I'],
    [4, 2, 'U'], [4, 3, 'R'], [4, 4, 'N'], [4, 5, 'A'],
  ];
  const ox = 110;
  const oy = 34;
  ctx.font = `bold ${cell * 0.62}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [col, row, letter] of cells) {
    const x = ox + col * cell;
    const y = oy + row * cell;
    ctx.fillStyle = '#efe3c8';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeRect(x, y, cell, cell);
    ctx.fillStyle = INK;
    ctx.fillText(letter, x + cell / 2, y + cell / 2 + 1);
  }
  spider(ctx, 70, 70, 12, 0);
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
  'valikko-ristikko.png',
  360,
  200,
  'Ristikon esikatselukuva valikkoon',
  'Pieni valikkokuva ristikkopelille: tummalla taustalla pala vanhan paperin värisiä ristikkoruutuja, joissa on kirjaimia, nurkassa hämähäkinseitti ja langassa roikkuva hämähäkki.',
  false,
  preview,
);

export const BACKGROUND = spec(
  'ristikko-tausta.png',
  1280,
  720,
  'Ristikon tausta',
  'Hämärä vanha työhuone: tumma violetti seinä, hämähäkinseitit yläkulmissa, oikeassa yläkulmassa langassa roikkuva hämähäkki ja alakulmissa palavat kynttilät. Keskiosa on rauhallinen, koska ristikko ja vihjeet piirretään sen päälle. Ei tekstiä.',
  false,
  background,
);

export const ASSETS: AssetSpec[] = [BACKGROUND];
