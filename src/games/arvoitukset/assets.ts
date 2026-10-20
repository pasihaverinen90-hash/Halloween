import type { AssetSpec } from '../types';

/*
 * Riddle images. Each picture riddle has ONE image (Pasi's), referenced by
 * file name in content/kuva-arvoitukset.txt. Until Pasi's files exist, the
 * images are drawn with emojis. No Phaser import: scripts/kuvalista.ts reads
 * this file to generate ASSETS.md.
 */

const EMOJI_FONT = '"Twemoji", "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
const PICTURE_STYLE =
  'Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta.';

/** Box of a picture riddle image (game space). With extra text ("+ Ö") the image box is narrower. */
export const PICTURE_BOX = { width: 600, height: 280 } as const;
export const PICTURE_BOX_WITH_TEXT = { width: 420, height: 280 } as const;

/** Placeholder: emojis on a card, joined with plus signs. */
function emojiCard(parts: string[]): AssetSpec['draw'] {
  return (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2b1d47');
    grad.addColorStop(1, '#1a1030');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 22);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4a3578';
    ctx.stroke();
    const size = Math.min(h * 0.55, (w * 0.8) / Math.max(1, parts.length * 1.25));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const step = w / (parts.length * 2);
    parts.forEach((part, i) => {
      const x = step * (1 + i * 2);
      ctx.font = `${size}px ${EMOJI_FONT}`;
      ctx.fillText(part, x, h / 2 + size * 0.05);
      if (i < parts.length - 1) {
        ctx.font = `800 ${size * 0.6}px "Nunito", sans-serif`;
        ctx.fillStyle = '#f4ecd8';
        ctx.fillText('+', step * (2 + i * 2), h / 2);
      }
    });
  };
}

function picture(file: string, title: string, prompt: string, parts: string[], withText = false): AssetSpec {
  const box = withText ? PICTURE_BOX_WITH_TEXT : PICTURE_BOX;
  return {
    file,
    width: box.width,
    height: box.height,
    title,
    prompt,
    style: PICTURE_STYLE,
    transparent: false,
    draw: emojiCard(parts),
  };
}

/** The picture riddle images, keyed by file name (referenced from the content file). */
export const PICTURES: AssetSpec[] = [
  picture(
    'arvoitus-ihmissusi.png',
    'Kuva-arvoitus: ihminen + susi',
    'Kuva-arvoitus, jonka vastaus on IHMISSUSI: vasemmalla tavallinen ihminen seisomassa, keskellä iso plusmerkki ja oikealla harmaa susi. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia.',
    ['🧍', '🐺'],
  ),
  picture(
    'arvoitus-verikuu.png',
    'Kuva-arvoitus: veripisara + kuu',
    'Kuva-arvoitus, jonka vastaus on VERIKUU: vasemmalla iso punainen veripisara, keskellä plusmerkki ja oikealla täysikuu. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia.',
    ['🩸', '🌕'],
  ),
  picture(
    'arvoitus-silmamuna.png',
    'Kuva-arvoitus: silmä + kananmuna',
    'Kuva-arvoitus, jonka vastaus on SILMÄMUNA: vasemmalla ihmisen silmä, keskellä plusmerkki ja oikealla valkoinen kananmuna. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia.',
    ['👁️', '🥚'],
  ),
  picture(
    'arvoitus-hirvi.png',
    'Kuva-arvoitus: hirvi (peli lisää perään + Ö)',
    'Kuva-arvoitus, jonka vastaus on HIRVIÖ: komea hirvi isoine sarvineen sivulta katsottuna. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia, sillä peli lisää kuvan perään itse "+ Ö".',
    ['🫎'],
    true,
  ),
  picture(
    'arvoitus-kummitusjuna.png',
    'Kuva-arvoitus: kummitus + juna',
    'Kuva-arvoitus, jonka vastaus on KUMMITUSJUNA: vasemmalla valkoinen lakanakummitus, keskellä plusmerkki ja oikealla vanha höyryjuna. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia.',
    ['👻', '🚂'],
  ),
];

/** Emojis drawn by the placeholders (their font is loaded before the game starts). */
export const PICTURE_EMOJIS = '🧍🐺🩸🌕👁️🥚🫎👻🚂🔮';

function background(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#0d0818');
  wall.addColorStop(0.7, '#1c1030');
  wall.addColorStop(1, '#120a1f');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);
  // Faint wallpaper diamonds
  ctx.strokeStyle = 'rgba(160, 120, 220, 0.05)';
  ctx.lineWidth = 1.5;
  for (let x = -40; x < w + 40; x += 80) {
    for (let y = -40; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(x, y + 40);
      ctx.lineTo(x + 40, y);
      ctx.lineTo(x + 80, y + 40);
      ctx.lineTo(x + 40, y + 80);
      ctx.closePath();
      ctx.stroke();
    }
  }
  // Curtains on both sides
  for (const side of [0, 1]) {
    for (let i = 0; i < 5; i++) {
      const x0 = side === 0 ? i * 26 : w - (i + 1) * 26;
      const grad = ctx.createLinearGradient(x0, 0, x0 + 26, 0);
      grad.addColorStop(0, '#3a0f22');
      grad.addColorStop(0.5, '#5c1a33');
      grad.addColorStop(1, '#2a0a18');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0 + 26, 0);
      ctx.quadraticCurveTo(x0 + 26 + (side === 0 ? 10 : -10) * i * 0.4, h * 0.6, x0 + 26, h);
      ctx.lineTo(x0, h);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Candles in the bottom corners
  for (const cx of [190, w - 190]) {
    const glow = ctx.createRadialGradient(cx, h - 150, 10, cx, h - 150, 220);
    glow.addColorStop(0, 'rgba(255, 170, 70, 0.28)');
    glow.addColorStop(1, 'rgba(255, 170, 70, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 230, h - 380, 460, 380);
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(cx - 14, h - 130, 28, 110);
    ctx.fillStyle = '#ffcf6b';
    ctx.beginPath();
    ctx.ellipse(cx, h - 146, 8, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.ellipse(cx, h - 142, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Table edge
  ctx.fillStyle = '#1a0f12';
  ctx.fillRect(0, h - 22, w, 22);
}

function preview(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#120a22');
  bg.addColorStop(1, '#2a1636');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // Table cloth
  ctx.fillStyle = '#3a0f22';
  ctx.fillRect(0, h - 40, w, 40);
  // Stand
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 50, h - 40);
  ctx.lineTo(w / 2 + 50, h - 40);
  ctx.lineTo(w / 2 + 32, h - 62);
  ctx.lineTo(w / 2 - 32, h - 62);
  ctx.closePath();
  ctx.fill();
  // Crystal ball
  const ball = ctx.createRadialGradient(w / 2 - 18, 76, 8, w / 2, 96, 66);
  ball.addColorStop(0, '#d9c8ff');
  ball.addColorStop(0.45, '#7a5ccf');
  ball.addColorStop(1, '#22144a');
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(w / 2, 96, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 64px "Grenze Gotisch", Georgia, serif';
  ctx.fillStyle = 'rgba(255, 240, 210, 0.92)';
  ctx.fillText('?', w / 2, 100);
  // Floating hints
  ctx.font = `30px ${EMOJI_FONT}`;
  ctx.fillText('🦇', 58, 54);
  ctx.fillText('🎃', w - 58, 60);
  ctx.fillText('👻', 70, h - 74);
  ctx.fillText('🕯️', w - 66, h - 76);
}

export const PREVIEW: AssetSpec = {
  file: 'valikko-arvoitukset.png',
  width: 360,
  height: 200,
  title: 'Kuva-arvoitusten esikatselukuva valikkoon',
  prompt:
    'Pieni valikkokuva arvoituspelille: pöydällä hehkuva ennustajan kristallipallo, jonka sisällä on iso kysymysmerkki. Ympärillä tummaa ja muutama pieni Halloween-kuvio, kuten lepakko ja kurpitsa.',
  style: 'Pelkistetty piirroskuva, tumma violetti, kristallipallon pehmeä hehku, ei lapsellinen.',
  transparent: false,
  draw: preview,
};

export const BACKGROUND: AssetSpec = {
  file: 'arvoitukset-tausta.png',
  width: 1280,
  height: 720,
  title: 'Kuva-arvoitusten taustakuva',
  prompt:
    'Leveä taustakuva ennustajan salongista: tumma seinä, jossa haalea kuvioitu tapetti, molemmissa reunoissa tummanpunaiset samettiverhot ja alanurkissa palavat kynttilät. Kuvan keskiosa on tasaisen tumma, koska sen päällä näkyvät arvoitukset ja vastausvaihtoehdot. Ei ihmisiä eikä tekstiä.',
  style: 'Pelkistetty piirroskuva, tumma ja tunnelmallinen, ei lapsellinen.',
  transparent: false,
  draw: background,
};

export const ASSETS: AssetSpec[] = [BACKGROUND, ...PICTURES];
