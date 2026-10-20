import type { AssetSpec } from '../types';

/*
 * Hangman images. Drawn by code in a simple hand-drawn style until Pasi
 * provides his own files (same names in public/assets/). No Phaser import:
 * scripts/kuvalista.ts reads this file to generate ASSETS.md.
 *
 * Layout (game space 1280×720): the gallows box sits at the left; the
 * skeleton hangs from the noose point NOOSE. Each part has a box centred at
 * NOOSE + offset, so replacement images of any size land in the right place.
 */

const BONE = '#efe5cc';
const BONE_SHADE = '#cdbf9c';
const INK = '#221829';
const WOOD = '#6b4a32';
const WOOD_DARK = '#3d2a1d';
const ROPE = '#c8a46a';

const SKELETON_STYLE =
  'Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.';

/** Where the skeleton hangs (game space). */
export const NOOSE = { x: 330, y: 220 } as const;

/** Gallows image box: top-left corner and size (game space). The noose is at (300, 120) inside it. */
export const GALLOWS_BOX = { x: 30, y: 100, width: 440, height: 560 } as const;

/** Skeleton parts in the order they appear (one per wrong letter): box size and centre relative to NOOSE. */
export const PART_LAYOUT: ReadonlyArray<{ width: number; height: number; dx: number; dy: number }> = [
  { width: 72, height: 84, dx: 0, dy: 44 }, // 1 pääkallo
  { width: 26, height: 150, dx: 0, dy: 161 }, // 2 kaula ja selkäranka
  { width: 112, height: 100, dx: 0, dy: 150 }, // 3 rintakehä
  { width: 100, height: 52, dx: 0, dy: 248 }, // 4 lantio
  { width: 56, height: 150, dx: -72, dy: 182 }, // 5 vasen käsivarsi
  { width: 56, height: 150, dx: 72, dy: 182 }, // 6 oikea käsivarsi
  { width: 50, height: 124, dx: -24, dy: 334 }, // 7 vasen jalka
  { width: 50, height: 124, dx: 24, dy: 334 }, // 8 oikea jalka
];

function outline(ctx: CanvasRenderingContext2D, width = 3): void {
  ctx.lineWidth = width;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/** A long bone with knobbly ends from (x1, y1) to (x2, y2). */
function bone(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const length = Math.hypot(x2 - x1, y2 - y1);
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.beginPath();
  const k = w * 0.62;
  ctx.moveTo(k, -w * 0.32);
  ctx.lineTo(length - k, -w * 0.28);
  ctx.arc(length - k * 0.55, -w * 0.32, k * 0.55, Math.PI, Math.PI * 2.25);
  ctx.arc(length - k * 0.55, w * 0.32, k * 0.55, -Math.PI * 0.25, Math.PI);
  ctx.lineTo(k, w * 0.3);
  ctx.arc(k * 0.55, w * 0.32, k * 0.55, 0, Math.PI * 1.25);
  ctx.arc(k * 0.55, -w * 0.32, k * 0.55, Math.PI * 0.75, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = BONE;
  ctx.fill();
  outline(ctx, 2.6);
  ctx.stroke();
  ctx.restore();
}

function skull(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.42, w * 0.44, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = BONE;
  ctx.fill();
  outline(ctx);
  ctx.stroke();
  // Jaw
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.26, h * 0.66, w * 0.52, h * 0.28, 8);
  ctx.fillStyle = BONE;
  ctx.fill();
  ctx.stroke();
  // Teeth
  ctx.lineWidth = 1.8;
  for (let i = 1; i < 5; i++) {
    const x = cx - w * 0.26 + (w * 0.52 * i) / 5;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.72);
    ctx.lineTo(x, h * 0.86);
    ctx.stroke();
  }
  // Eye sockets and nose
  ctx.fillStyle = INK;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * w * 0.17, h * 0.42, w * 0.12, h * 0.11, side * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.53);
  ctx.lineTo(cx - w * 0.05, h * 0.62);
  ctx.lineTo(cx + w * 0.05, h * 0.62);
  ctx.closePath();
  ctx.fill();
  // A small crack
  ctx.strokeStyle = BONE_SHADE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.1, h * 0.08);
  ctx.lineTo(cx + w * 0.16, h * 0.18);
  ctx.lineTo(cx + w * 0.12, h * 0.25);
  ctx.stroke();
}

function spine(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const count = 9;
  const seg = h / count;
  for (let i = 0; i < count; i++) {
    const y = i * seg + 2;
    ctx.beginPath();
    ctx.roundRect(w * 0.18, y, w * 0.64, seg - 4, 4);
    ctx.fillStyle = i % 2 === 0 ? BONE : BONE_SHADE;
    ctx.fill();
    outline(ctx, 2.2);
    ctx.stroke();
  }
}

function ribcage(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  outline(ctx, 3);
  for (let i = 0; i < 4; i++) {
    const y = h * 0.16 + i * h * 0.19;
    const spread = w * (0.42 - i * 0.04);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 6, y);
      ctx.quadraticCurveTo(cx + side * spread * 1.05, y - h * 0.05, cx + side * spread * 0.85, y + h * 0.14);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = BONE;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }
  // Breastbone
  ctx.beginPath();
  ctx.roundRect(cx - 6, h * 0.06, 12, h * 0.66, 5);
  ctx.fillStyle = BONE;
  ctx.fill();
  outline(ctx, 2.4);
  ctx.stroke();
}

function pelvis(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.12);
  ctx.bezierCurveTo(cx + w * 0.2, h * 0.02, cx + w * 0.48, h * 0.08, cx + w * 0.44, h * 0.48);
  ctx.bezierCurveTo(cx + w * 0.4, h * 0.82, cx + w * 0.16, h * 0.96, cx, h * 0.86);
  ctx.bezierCurveTo(cx - w * 0.16, h * 0.96, cx - w * 0.4, h * 0.82, cx - w * 0.44, h * 0.48);
  ctx.bezierCurveTo(cx - w * 0.48, h * 0.08, cx - w * 0.2, h * 0.02, cx, h * 0.12);
  ctx.closePath();
  ctx.fillStyle = BONE;
  ctx.fill();
  outline(ctx);
  ctx.stroke();
  ctx.fillStyle = INK;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * w * 0.2, h * 0.56, w * 0.09, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** An arm hanging down; mirrored for the right side. */
function arm(ctx: CanvasRenderingContext2D, w: number, h: number, mirrored: boolean): void {
  ctx.save();
  if (mirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  const shoulder = { x: w * 0.82, y: h * 0.05 };
  const elbow = { x: w * 0.46, y: h * 0.48 };
  const wrist = { x: w * 0.3, y: h * 0.84 };
  bone(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 12);
  bone(ctx, elbow.x, elbow.y, wrist.x, wrist.y, 10);
  // Hand: three bony fingers
  outline(ctx, 2.2);
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(wrist.x, wrist.y);
    ctx.lineTo(wrist.x + i * 7, wrist.y + h * 0.13);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = BONE;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

/** A leg hanging down; mirrored for the right side. */
function leg(ctx: CanvasRenderingContext2D, w: number, h: number, mirrored: boolean): void {
  ctx.save();
  if (mirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  const hip = { x: w * 0.62, y: h * 0.04 };
  const knee = { x: w * 0.48, y: h * 0.48 };
  const ankle = { x: w * 0.44, y: h * 0.86 };
  bone(ctx, hip.x, hip.y, knee.x, knee.y, 14);
  bone(ctx, knee.x, knee.y, ankle.x, ankle.y, 11);
  ctx.beginPath();
  ctx.ellipse(ankle.x - 7, ankle.y + 8, 13, 6, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = BONE;
  ctx.fill();
  outline(ctx, 2.4);
  ctx.stroke();
  ctx.restore();
}

function gallows(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const plank = (x: number, y: number, pw: number, ph: number): void => {
    ctx.beginPath();
    ctx.roundRect(x, y, pw, ph, 4);
    ctx.fillStyle = WOOD;
    ctx.fill();
    outline(ctx, 3);
    ctx.stroke();
    // Wood grain
    ctx.strokeStyle = WOOD_DARK;
    ctx.lineWidth = 1.4;
    const horizontal = pw > ph;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      if (horizontal) {
        ctx.moveTo(x + 10, y + (ph * i) / 3);
        ctx.lineTo(x + pw - 14, y + (ph * i) / 3 + 1);
      } else {
        ctx.moveTo(x + (pw * i) / 3, y + 10);
        ctx.lineTo(x + (pw * i) / 3 + 1, y + ph - 14);
      }
      ctx.stroke();
    }
  };
  // Mound and platform
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.985, w * 0.48, h * 0.05, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#1b1224';
  ctx.fill();
  plank(16, 530, w - 32, 24);
  plank(60, 30, 34, 510); // post
  plank(40, 28, 300, 30); // beam
  // Brace
  ctx.save();
  ctx.translate(92, 160);
  ctx.rotate(-Math.PI / 4);
  plank(0, -10, 140, 20);
  ctx.restore();
  // Rope and noose (noose point at 300, 120)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(300, 52);
  ctx.lineTo(300, 104);
  ctx.stroke();
  ctx.strokeStyle = ROPE;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(300, 116, 12, 16, 0, 0, Math.PI * 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = ROPE;
  ctx.lineWidth = 4;
  ctx.stroke();
  // Knot wraps
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(295, 84 + i * 6);
    ctx.lineTo(305, 87 + i * 6);
    ctx.stroke();
  }
}

function background(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a0614');
  sky.addColorStop(0.55, '#1b1030');
  sky.addColorStop(1, '#2a1636');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Pale moon behind the gallows
  const glow = ctx.createRadialGradient(250, 210, 60, 250, 210, 330);
  glow.addColorStop(0, 'rgba(220, 230, 255, 0.22)');
  glow.addColorStop(1, 'rgba(220, 230, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(250, 210, 120, 0, Math.PI * 2);
  ctx.fillStyle = '#d9dbe6';
  ctx.fill();
  ctx.fillStyle = 'rgba(120, 120, 150, 0.2)';
  for (const [x, y, r] of [
    [215, 180, 22],
    [290, 240, 16],
    [240, 270, 10],
    [300, 170, 9],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hill
  ctx.fillStyle = '#140c1f';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, 610);
  ctx.quadraticCurveTo(260, 560, 560, 640);
  ctx.quadraticCurveTo(900, 720, w, 650);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // Dry grass strokes
  ctx.strokeStyle = '#2d1f38';
  ctx.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % w;
    const base = 650 + ((i * 37) % 60);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x + ((i % 3) - 1) * 5, base - 14 - (i % 4) * 4);
    ctx.stroke();
  }
  // Ground fog
  const fog = ctx.createLinearGradient(0, 600, 0, h);
  fog.addColorStop(0, 'rgba(170, 160, 210, 0)');
  fog.addColorStop(1, 'rgba(170, 160, 210, 0.16)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 600, w, h - 600);
}

function preview(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0d0819');
  sky.addColorStop(1, '#2a1636');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Small moon and a few stars
  ctx.fillStyle = 'rgba(220, 225, 245, 0.18)';
  ctx.beginPath();
  ctx.arc(318, 42, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9dbe6';
  ctx.beginPath();
  ctx.arc(318, 42, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4ecd8';
  for (const [x, y] of [
    [170, 20],
    [230, 36],
    [262, 14],
    [200, 62],
    [350, 92],
  ]) {
    ctx.fillRect(x, y, 2, 2);
  }
  // Ground
  ctx.fillStyle = '#150d20';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, 182);
  ctx.quadraticCurveTo(180, 168, w, 186);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // Gallows with a half-built skeleton (gallows scaled to 0.33, noose at 300, 120)
  const scale = 0.33;
  const gx = 10;
  const gy = 10;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.scale(scale, scale);
  gallows(ctx, 440, 560);
  ctx.translate(300, 120);
  const parts: Array<[number, (c: CanvasRenderingContext2D, pw: number, ph: number) => void]> = [[1, spine], [2, ribcage], [0, skull]];
  for (const [i, draw] of parts) {
    const layout = PART_LAYOUT[i];
    ctx.save();
    ctx.translate(layout.dx - layout.width / 2, layout.dy - layout.height / 2);
    draw(ctx, layout.width, layout.height);
    ctx.restore();
  }
  ctx.restore();
  // Letter slots: two letters found
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const slots = ['', 'A', '', 'A', '', ''];
  slots.forEach((letter, i) => {
    const x = 186 + i * 30;
    ctx.fillStyle = '#efe5cc';
    ctx.fillRect(x - 11, 122, 22, 3);
    if (letter) {
      ctx.font = '400 30px "Patrick Hand", "Comic Sans MS", cursive';
      ctx.fillText(letter, x, 116);
    }
  });
  // Wrong guesses
  ctx.font = '800 17px "Nunito", sans-serif';
  ctx.fillStyle = '#e5484d';
  ctx.fillText('B   K   R', 260, 158);
}

export const PREVIEW: AssetSpec = {
  file: 'valikko-hirsipuu.png',
  width: 360,
  height: 200,
  title: 'Hirsipuun esikatselukuva valikkoon',
  prompt:
    'Pieni valikkokuva hirsipuupelille: yöllinen maisema, vasemmalla puinen hirsipuu, jonka köydessä roikkuu luurangon pääkallo, ' +
    'oikealla muutama arvattavan sanan kirjain ja tyhjä viiva. Selkeä ja tunnistettava pienenäkin.',
  style: 'Pelkistetty piirroskuva, tumma violetti yö, luunvalkoinen ja puun ruskea, ei lapsellinen.',
  transparent: false,
  draw: preview,
};

const part = (n: number, title: string, prompt: string, draw: AssetSpec['draw']): AssetSpec => {
  const layout = PART_LAYOUT[n - 1];
  return {
    file: `hirsipuu-luuranko-${n}.png`,
    width: layout.width,
    height: layout.height,
    title: `Luuranko, osa ${n}: ${title}`,
    prompt: `${prompt} Osa ${n}/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna.`,
    style: SKELETON_STYLE,
    transparent: true,
    draw,
  };
};

export const ASSETS: AssetSpec[] = [
  {
    file: 'hirsipuu-tausta.png',
    width: 1280,
    height: 720,
    title: 'Hirsipuun taustakuva',
    prompt:
      'Leveä yöllinen taustakuva hirsipuupeliin: tumma violetti taivas, vasemmalla suuri kalpea kuu, matala kukkula ja kuivaa ' +
      'heinää, maan rajassa ohutta usvaa. Kuvan vasen kolmannes jätetään rauhalliseksi, koska siihen piirretään hirsipuu ja ' +
      'luuranko, ja oikea puolisko tummaksi ja tasaiseksi, koska sen päällä on tekstiä. Älä piirrä kuvaan hirsipuuta, ihmisiä tai tekstiä.',
    style: 'Pelkistetty piirroskuva, tumma ja tunnelmallinen, ei lapsellinen.',
    transparent: false,
    draw: background,
  },
  {
    file: 'hirsipuu-teline.png',
    width: GALLOWS_BOX.width,
    height: GALLOWS_BOX.height,
    title: 'Hirsipuu (puinen teline)',
    prompt:
      'Vanha puinen hirsipuu sivulta katsottuna: pystypaalu vasemmalla, yläpalkki oikealle, vino tukipuu ja leveä lankkualusta ' +
      'pienen multakummun päällä. Yläpalkin oikeasta päästä roikkuu köysi, jonka päässä on silmukka. Silmukan keskikohta on noin ' +
      '68 % kuvan leveydestä vasemmalta ja 21 % korkeudesta ylhäältä. Ei luurankoa, ei ihmisiä.',
    style: 'Pelkistetty piirroskuva, paksut tummat ääriviivat, ruskea puu ja vaalea köysi.',
    transparent: true,
    draw: gallows,
  },
  part(1, 'pääkallo', 'Ihmisen pääkallo alaleukoineen, tummat silmäkuopat.', skull),
  part(2, 'kaula ja selkäranka', 'Pystysuora selkäranka kaulanikamista lantioon, nikamat erillisinä palasina.', spine),
  part(3, 'rintakehä', 'Rintakehä: rintalasta ja neljä paria kaarevia kylkiluita, ilman selkärankaa.', ribcage),
  part(4, 'lantio', 'Lantioluu edestä katsottuna, perhosen muotoinen.', pelvis),
  part(5, 'vasen käsivarsi', 'Kuvassa vasemmalla puolella oleva käsivarsi: olkaluu, kyynärvarren luut ja luiset sormet, roikkuu alaspäin.', (c, w, h) => arm(c, w, h, false)),
  part(6, 'oikea käsivarsi', 'Kuvassa oikealla puolella oleva käsivarsi: olkaluu, kyynärvarren luut ja luiset sormet, roikkuu alaspäin.', (c, w, h) => arm(c, w, h, true)),
  part(7, 'vasen jalka', 'Kuvassa vasemmalla puolella oleva jalka: reisiluu, sääriluu ja jalkaterä, roikkuu alaspäin.', (c, w, h) => leg(c, w, h, false)),
  part(8, 'oikea jalka', 'Kuvassa oikealla puolella oleva jalka: reisiluu, sääriluu ja jalkaterä, roikkuu alaspäin.', (c, w, h) => leg(c, w, h, true)),
];

/** The eight skeleton parts in order. */
export const SKELETON_PARTS: AssetSpec[] = ASSETS.filter((spec) => spec.file.startsWith('hirsipuu-luuranko-'));
export const BACKGROUND = ASSETS[0];
export const GALLOWS = ASSETS[1];
