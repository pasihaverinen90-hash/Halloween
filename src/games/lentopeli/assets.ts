import { drawBat as bat } from '../shared/bat';
import type { AssetSpec } from '../types';

/*
 * Flying game images, drawn by code in a simple outlined style until Pasi
 * provides his own (same names in public/assets/). No Phaser import:
 * scripts/kuvalista.ts reads this file to generate ASSETS.md.
 */

const INK = '#1a1124';
const STYLE = 'Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.';

function outline(ctx: CanvasRenderingContext2D, width = 3): void {
  ctx.lineWidth = width;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function sky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#060312');
  g.addColorStop(0.6, '#1a0f33');
  g.addColorStop(1, '#3a1a3f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = '#f4ecd8';
  for (let i = 0; i < 160; i++) {
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    const r = rnd() < 0.1 ? 1.6 : 0.8;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h * 0.7, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const mx = w * 0.72;
  const my = h * 0.26;
  const glow = ctx.createRadialGradient(mx, my, 40, mx, my, 300);
  glow.addColorStop(0, 'rgba(255, 230, 180, 0.3)');
  glow.addColorStop(1, 'rgba(255, 230, 180, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f6e7bf';
  ctx.beginPath();
  ctx.arc(mx, my, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(170, 130, 80, 0.2)';
  for (const [dx, dy, r] of [
    [-28, -20, 18],
    [24, 14, 13],
    [-6, 34, 9],
  ]) {
    ctx.beginPath();
    ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Distant hills, a castle and a church; tiles seamlessly left to right. */
function farHills(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const wave = (x: number): number => Math.sin((x / w) * Math.PI * 4) * 22 + Math.sin((x / w) * Math.PI * 10) * 9;
  ctx.fillStyle = '#21123a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * 0.55 + wave(x));
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // Castle
  ctx.fillStyle = '#170c2a';
  const cx = w * 0.3;
  const base = h * 0.55 + wave(cx);
  ctx.fillRect(cx - 70, base - 70, 140, 80);
  for (const [tx, th] of [
    [-70, 130],
    [40, 110],
    [-10, 160],
  ]) {
    ctx.fillRect(cx + tx, base - th, 30, th);
    ctx.beginPath();
    ctx.moveTo(cx + tx - 6, base - th);
    ctx.lineTo(cx + tx + 15, base - th - 34);
    ctx.lineTo(cx + tx + 36, base - th);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 200, 110, 0.6)';
  ctx.fillRect(cx - 3, base - 120, 8, 12);
  ctx.fillRect(cx + 50, base - 80, 8, 12);
  // Church with a spire
  ctx.fillStyle = '#170c2a';
  const kx = w * 0.78;
  const kb = h * 0.55 + wave(kx);
  ctx.fillRect(kx - 40, kb - 50, 80, 60);
  ctx.fillRect(kx + 20, kb - 110, 26, 120);
  ctx.beginPath();
  ctx.moveTo(kx + 16, kb - 110);
  ctx.lineTo(kx + 33, kb - 170);
  ctx.lineTo(kx + 50, kb - 110);
  ctx.closePath();
  ctx.fill();
}

/** Ground strip with grass and small gravestones; tiles seamlessly. */
function ground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#140b1f';
  ctx.fillRect(0, 10, w, h - 10);
  ctx.fillStyle = '#24163a';
  ctx.fillRect(0, 6, w, 8);
  ctx.strokeStyle = '#2f2050';
  ctx.lineWidth = 2;
  for (let x = 4; x < w; x += 23) {
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x - 4 + ((x * 7) % 9), 0);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a1d40';
  for (const x of [140, 520, 860, 1150]) {
    ctx.beginPath();
    ctx.moveTo(x - 14, 40);
    ctx.lineTo(x - 14, 22);
    ctx.arc(x, 22, 14, Math.PI, 0);
    ctx.lineTo(x + 14, 40);
    ctx.closePath();
    ctx.fill();
  }
}

function witch(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 150, h / 100);
  outline(ctx);
  // Broom stick and bristles
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(18, 72);
  ctx.lineTo(140, 62);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a34';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#c9a25a';
  ctx.beginPath();
  ctx.moveTo(30, 66);
  ctx.lineTo(2, 54);
  ctx.lineTo(0, 74);
  ctx.lineTo(4, 92);
  ctx.lineTo(30, 80);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 2.5);
  ctx.stroke();
  // Cloak
  ctx.fillStyle = '#3b1f5e';
  ctx.beginPath();
  ctx.moveTo(86, 40);
  ctx.quadraticCurveTo(50, 44, 26, 62);
  ctx.quadraticCurveTo(52, 60, 60, 72);
  ctx.lineTo(96, 70);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  ctx.stroke();
  // Body and arm
  ctx.fillStyle = '#4a2a72';
  ctx.beginPath();
  ctx.ellipse(90, 52, 16, 20, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(98, 52);
  ctx.lineTo(118, 62);
  ctx.stroke();
  // Head, hair and hat
  ctx.fillStyle = '#b8d49a';
  ctx.beginPath();
  ctx.arc(100, 30, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff8a1f';
  ctx.beginPath();
  ctx.moveTo(90, 26);
  ctx.quadraticCurveTo(72, 34, 70, 48);
  ctx.quadraticCurveTo(84, 38, 92, 36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#20122f';
  ctx.beginPath();
  ctx.ellipse(98, 22, 22, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(86, 20);
  ctx.lineTo(96, -2);
  ctx.lineTo(84, 0);
  ctx.lineTo(110, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Eye
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(105, 29, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function cat(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 70, h / 60);
  // Warm glow so the black cat stands out against the night sky
  const glow = ctx.createRadialGradient(34, 34, 4, 34, 34, 34);
  glow.addColorStop(0, 'rgba(255, 214, 110, 0.55)');
  glow.addColorStop(1, 'rgba(255, 214, 110, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 70, 60);
  ctx.fillStyle = '#0d0912';
  ctx.strokeStyle = '#4a3578';
  ctx.lineWidth = 2;
  // Tail
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.quadraticCurveTo(68, 46, 62, 28);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#0d0912';
  ctx.stroke();
  // Body and head
  ctx.beginPath();
  ctx.ellipse(36, 44, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(24, 24, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(13, 18);
  ctx.lineTo(13, 4);
  ctx.lineTo(22, 13);
  ctx.moveTo(26, 13);
  ctx.lineTo(35, 4);
  ctx.lineTo(35, 19);
  ctx.fill();
  // Light rim around head and body
  ctx.strokeStyle = '#a996e0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(36, 44, 18, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(24, 24, 13, Math.PI * 0.75, Math.PI * 2.25);
  ctx.stroke();
  // Eyes
  ctx.fillStyle = '#ffd23f';
  for (const ex of [19, 29]) {
    ctx.beginPath();
    ctx.ellipse(ex, 23, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#0d0912';
  for (const ex of [19, 29]) ctx.fillRect(ex - 0.8, 19.5, 1.6, 7);
  ctx.restore();
}

function inquisitor(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 100, h / 150);
  outline(ctx);
  // Robe
  ctx.fillStyle = '#5a1420';
  ctx.beginPath();
  ctx.moveTo(50, 30);
  ctx.quadraticCurveTo(22, 70, 18, 148);
  ctx.lineTo(82, 148);
  ctx.quadraticCurveTo(78, 70, 50, 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Hood (pointed) with dark face
  ctx.fillStyle = '#2a0a12';
  ctx.beginPath();
  ctx.moveTo(50, 2);
  ctx.lineTo(30, 52);
  ctx.quadraticCurveTo(50, 60, 70, 52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffcf6b';
  ctx.beginPath();
  ctx.arc(44, 40, 2.4, 0, Math.PI * 2);
  ctx.arc(56, 40, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Arm with torch
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(66, 74);
  ctx.lineTo(88, 52);
  ctx.stroke();
  ctx.strokeStyle = '#6b4a32';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(84, 66);
  ctx.lineTo(92, 26);
  ctx.stroke();
  const flame = ctx.createRadialGradient(93, 16, 2, 93, 18, 16);
  flame.addColorStop(0, '#fff3c4');
  flame.addColorStop(0.5, '#ffb03a');
  flame.addColorStop(1, 'rgba(255, 90, 20, 0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.ellipse(93, 16, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rope belt and cross
  ctx.strokeStyle = '#c8a46a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 96);
  ctx.lineTo(70, 96);
  ctx.moveTo(50, 70);
  ctx.lineTo(50, 90);
  ctx.moveTo(43, 77);
  ctx.lineTo(57, 77);
  ctx.stroke();
  ctx.restore();
}

/** Stone pillar segment; tiles vertically. */
function pillar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#3d3450';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#231c33';
  ctx.lineWidth = 3;
  const rows = 4;
  for (let r = 0; r <= rows; r++) {
    const y = (r * h) / rows;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    const offset = r % 2 === 0 ? w / 2 : w / 4;
    ctx.beginPath();
    ctx.moveTo(offset, y);
    ctx.lineTo(offset, y + h / rows);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(0, 0, w * 0.3, h);
  ctx.strokeStyle = '#1a1124';
  ctx.lineWidth = 4;
  ctx.strokeRect(1, -2, w - 2, h + 4);
}

function cage(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.scale(w / 96, h / 120);
  ctx.strokeStyle = '#1a1124';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(48, 0);
  ctx.lineTo(48, 14);
  ctx.stroke();
  ctx.fillStyle = 'rgba(30, 18, 50, 0.6)';
  ctx.beginPath();
  ctx.moveTo(14, 36);
  ctx.quadraticCurveTo(48, 6, 82, 36);
  ctx.lineTo(82, 110);
  ctx.lineTo(14, 110);
  ctx.closePath();
  ctx.fill();
  // A bat inside
  ctx.fillStyle = '#0d0912';
  ctx.beginPath();
  ctx.moveTo(48, 64);
  ctx.quadraticCurveTo(36, 54, 26, 62);
  ctx.quadraticCurveTo(34, 66, 36, 74);
  ctx.quadraticCurveTo(42, 70, 48, 76);
  ctx.quadraticCurveTo(54, 70, 60, 74);
  ctx.quadraticCurveTo(62, 66, 70, 62);
  ctx.quadraticCurveTo(60, 54, 48, 64);
  ctx.fill();
  // Bars
  ctx.strokeStyle = '#6d6380';
  ctx.lineWidth = 4;
  for (const x of [14, 31, 48, 65, 82]) {
    ctx.beginPath();
    ctx.moveTo(x, x === 48 ? 14 : 30 - Math.abs(48 - x) * 0.2);
    ctx.lineTo(x, 110);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(14, 36);
  ctx.quadraticCurveTo(48, 6, 82, 36);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(10, 110);
  ctx.lineTo(86, 110);
  ctx.moveTo(12, 72);
  ctx.lineTo(84, 72);
  ctx.stroke();
  ctx.restore();
}

/** Chain links; tiles vertically. */
function chain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeStyle = '#1a1124';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.25, w * 0.3, h * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#6d6380';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = '#1a1124';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(w / 2, h * 0.5);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.strokeStyle = '#6d6380';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function finish(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const portal = ctx.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.8);
  portal.addColorStop(0, 'rgba(230, 200, 255, 0.95)');
  portal.addColorStop(0.4, 'rgba(140, 80, 230, 0.75)');
  portal.addColorStop(1, 'rgba(60, 20, 120, 0)');
  ctx.fillStyle = portal;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.55, w * 0.34, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stone arch
  ctx.strokeStyle = '#1a1124';
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h);
  ctx.lineTo(w * 0.12, h * 0.3);
  ctx.quadraticCurveTo(w / 2, -h * 0.05, w * 0.88, h * 0.3);
  ctx.lineTo(w * 0.88, h);
  ctx.stroke();
  ctx.strokeStyle = '#5a4f72';
  ctx.lineWidth = 26;
  ctx.stroke();
  // Pumpkins at the feet
  for (const x of [w * 0.12, w * 0.88]) {
    ctx.fillStyle = '#ff8a1f';
    ctx.beginPath();
    ctx.ellipse(x, h - 20, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a3a06';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.moveTo(x - 9, h - 24);
    ctx.lineTo(x - 4, h - 30);
    ctx.lineTo(x + 1, h - 24);
    ctx.fill();
  }
}

function preview(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  sky(ctx, w, h);
  ctx.save();
  ctx.translate(0, h - 22);
  ground(ctx, w, 22);
  ctx.restore();
  const at = (x: number, y: number, draw: () => void): void => {
    ctx.save();
    ctx.translate(x, y);
    draw();
    ctx.restore();
  };
  // Obstacle pair: chain + cage above, inquisitor on a pillar below
  at(251, 0, () => chain(ctx, 14, 40));
  at(234, 36, () => cage(ctx, 48, 60));
  at(241, 166, () => pillar(ctx, 34, 14));
  at(236, 114, () => inquisitor(ctx, 44, 54));
  at(36, 66, () => witch(ctx, 126, 84));
  at(306, 92, () => cat(ctx, 36, 31));
  at(296, 24, () => bat(ctx, 48, 32));
  at(318, 52, () => bat(ctx, 36, 24));
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
  'valikko-lentopeli.png',
  360,
  200,
  'Lentopelin esikatselukuva valikkoon',
  'Pieni valikkokuva lentopelille: noita lentää luudalla yötaivaalla kohti aukkoa, jonka yläpuolella roikkuu häkki ja alapuolella seisoo kaapuun pukeutunut inkvisiittori soihtu kädessä. Oikealta lentää vastaan pari lepakkoa. Täysikuu taustalla.',
  false,
  preview,
);

export const SKY = spec(
  'lentopeli-tausta.png',
  1280,
  720,
  'Lentopelin taivas',
  'Leveä yötaivas: tummanvioletti liukuväri, tähtiä ja oikealla ylhäällä suuri täysikuu hehkuineen. Ei maata, ei rakennuksia, ei tekstiä.',
  false,
  sky,
);

export const FAR = spec(
  'lentopeli-kaukaiset.png',
  1280,
  260,
  'Kaukaiset kukkulat, linna ja kirkko',
  'Kaukaisia kukkuloita siluettina, niillä pieni linna torneineen ja kirkko suippoine torneineen. Kuva toistuu vaakasuunnassa saumattomasti: vasen ja oikea reuna jatkuvat toisiinsa.',
  true,
  farHills,
);

export const GROUND = spec(
  'lentopeli-maa.png',
  1280,
  80,
  'Maa',
  'Kapea tumma maakaistale, jossa kuivaa heinää ja muutama pieni hautakivi. Kuva toistuu vaakasuunnassa saumattomasti.',
  false,
  ground,
);

export const WITCH = spec(
  'lentopeli-noita.png',
  150,
  100,
  'Noita luudalla',
  'Noita lentää luudalla oikealle: suippo musta hattu, violetti viitta liehuu, oranssit hiukset, vaaleanvihreät kasvot. Ystävällinen mutta ei lapsellinen.',
  true,
  witch,
);

export const CAT = spec(
  'lentopeli-kissa.png',
  70,
  60,
  'Musta kissa',
  'Istuva musta kissa keltaisin silmin ja kiemuraisella hännällä, sivulta katsottuna.',
  true,
  cat,
);

export const INQUISITOR = spec(
  'lentopeli-inkvisiittori.png',
  100,
  150,
  'Inkvisiittori',
  'Keksitty keskiaikainen noitavainoaja: tummanpunainen kaapu, suippo huppu jonka alta näkyvät vain hehkuvat silmät, palava soihtu kädessä, seisoo edestä katsottuna. Ei oikea henkilö.',
  true,
  inquisitor,
);

export const PILLAR = spec(
  'lentopeli-pylvas.png',
  80,
  100,
  'Kivipylväs (pala)',
  'Pala harmaata kivipylvästä edestä katsottuna, tiilimäiset kivet. Kuva toistuu pystysuunnassa saumattomasti: ylä- ja alareuna jatkuvat toisiinsa.',
  true,
  pillar,
);

export const CAGE = spec(
  'lentopeli-hakki.png',
  96,
  120,
  'Riippuva häkki',
  'Ruosteinen rautahäkki, joka roikkuu ylhäältä, sisällä lepakko. Edestä katsottuna.',
  true,
  cage,
);

export const CHAIN = spec(
  'lentopeli-ketju.png',
  28,
  56,
  'Ketju (pala)',
  'Pala pystysuoraa rautaketjua. Kuva toistuu pystysuunnassa saumattomasti.',
  true,
  chain,
);

export const BAT = spec(
  'lentopeli-lepakko.png',
  84,
  56,
  'Lepakko',
  'Lepakko lentää suoraan katsojaa kohti siivet levällään: tumma violetti siipikalvo, jonka alareuna on aaltoileva, pienet terävät korvat ja hehkuvat oranssit silmät. Ohut vaalea ääriviiva erottaa sen yötaivaasta. Peli heiluttaa siipiä itse, joten yksi kuva riittää.',
  true,
  bat,
);

export const FINISH = spec(
  'lentopeli-maali.png',
  240,
  560,
  'Maali: maaginen portti',
  'Korkea kivinen kaariportti, jonka keskellä hehkuu violetti taikaportaali. Portin juurella kaksi kurpitsalyhtyä. Edestä katsottuna.',
  true,
  finish,
);

export const ASSETS: AssetSpec[] = [SKY, FAR, GROUND, WITCH, CAT, INQUISITOR, PILLAR, CAGE, CHAIN, BAT, FINISH];
