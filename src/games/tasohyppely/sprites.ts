import { frames, Pix, type Palette } from './pixel';

/*
 * Pixel-art characters and items of the platformer, drawn by code until Pasi
 * provides his own pictures (same names in public/assets/). Every function
 * draws all animation frames side by side. Characters face right; the game
 * mirrors them. No Phaser: scripts/kuvalista.ts reads these through assets.ts.
 */

// ---------------------------------------------------------------- the hunter

const HAIR = '#eceaf4';
const HAIR_D = '#b4b0c8';
const SKIN = '#f1d3bd';
const SKIN_D = '#c99c84';
const COAT = '#8e2433';
const COAT_D = '#5c1420';
const COAT_L = '#b8414f';
const SCARF = '#5d6274';
const SCARF_L = '#7e8498';
const PANTS = '#2b2533';
const BOOT = '#5b3b24';
const BOOT_L = '#7d5534';
const BELT = '#2a1c14';
const BUCKLE = '#e0b54a';
const EYE = '#1a1124';

/** Hunter frames, in order (also the order Pasi's replacement picture must have). */
export const HUNTER_FRAMES = ['seisoo', 'juoksee 1', 'juoksee 2', 'juoksee 3', 'hyppää', 'kyykistyy', 'nostaa ruoskan', 'lyö', 'lyö kyykyssä', 'lyö ylöspäin', 'saa osuman'] as const;
export const HUNTER_FRAME = { idle: 0, run: [1, 2, 3], jump: 4, crouch: 5, windup: 6, lash: 7, lashLow: 8, lashUp: 9, hurt: 10 } as const;

type Legs = 'stand' | 'apart' | 'pass' | 'jump' | 'crouch' | 'hurt';
type Arm = 'down' | 'forward' | 'back' | 'raised' | 'strike' | 'up' | 'out';

function hunterHead(p: Pix, dx: number, dy: number): void {
  // Hair, face and an eye looking right.
  p.rect(9 + dx, 1 + dy, 6, 3, HAIR);
  p.rect(9 + dx, 4 + dy, 2, 5, HAIR);
  p.rect(11 + dx, 4 + dy, 4, 5, SKIN);
  p.rect(14 + dx, 3 + dy, 1, 2, HAIR);
  p.set(12 + dx, 3 + dy, HAIR_D);
  p.set(10 + dx, 2 + dy, HAIR_D);
  p.set(13 + dx, 5 + dy, EYE);
  p.set(11 + dx, 7 + dy, SKIN_D);
  p.rect(8 + dx, 5 + dy, 1, 3, HAIR_D);
  // Scarf, its end flying behind.
  p.rect(9 + dx, 9 + dy, 6, 2, SCARF);
  p.hline(10 + dx, 13 + dx, 9 + dy, SCARF_L);
  p.rect(7 + dx, 10 + dy, 2, 2, SCARF);
}

function hunterTorso(p: Pix, dx: number, dy: number): void {
  p.rect(9 + dx, 11 + dy, 6, 7, COAT);
  p.rect(12 + dx, 11 + dy, 1, 6, COAT_L);
  p.rect(9 + dx, 11 + dy, 1, 7, COAT_D);
  p.rect(9 + dx, 17 + dy, 6, 1, BELT);
  p.set(12 + dx, 17 + dy, BUCKLE);
}

/** Coat tails below the belt; `flare` pushes the back tail out (running, jumping). */
function hunterTails(p: Pix, dx: number, dy: number, flare: number, length = 7): void {
  p.rect(8 + dx - flare, 18 + dy, 3 + flare, length, COAT);
  p.rect(8 + dx - flare, 18 + dy, 1, length, COAT_D);
  p.rect(13 + dx, 18 + dy, 3, length - 1, COAT);
  p.rect(15 + dx, 18 + dy, 1, length - 1, COAT_L);
}

function hunterLegs(p: Pix, legs: Legs): void {
  const boot = (x: number, y: number, w = 4): void => {
    p.rect(x, y, w, 4 - (y > 27 ? y - 28 : 0), BOOT);
    p.rect(x, y, w, 1, BOOT_L);
  };
  switch (legs) {
    case 'stand':
      p.rect(10, 21, 2, 7, PANTS);
      p.rect(12, 21, 2, 7, PANTS);
      boot(9, 28, 3);
      boot(12, 28, 4);
      return;
    case 'apart':
      p.rect(9, 21, 2, 6, PANTS);
      p.rect(8, 25, 2, 3, PANTS);
      p.rect(13, 21, 2, 4, PANTS);
      p.rect(14, 24, 2, 4, PANTS);
      boot(6, 28, 4);
      boot(14, 28, 4);
      return;
    case 'pass':
      p.rect(11, 21, 2, 7, PANTS);
      p.rect(13, 21, 2, 5, PANTS);
      boot(10, 28, 4);
      p.rect(13, 26, 4, 2, BOOT);
      return;
    case 'jump':
      p.rect(9, 20, 3, 4, PANTS);
      p.rect(8, 23, 3, 2, BOOT);
      p.rect(13, 20, 3, 3, PANTS);
      p.rect(14, 22, 3, 3, PANTS);
      p.rect(15, 25, 3, 2, BOOT);
      return;
    case 'crouch':
      p.rect(10, 25, 6, 2, PANTS);
      p.rect(9, 27, 2, 2, PANTS);
      p.rect(14, 27, 2, 1, PANTS);
      boot(8, 28, 4);
      boot(13, 28, 4);
      return;
    case 'hurt':
      p.rect(9, 21, 2, 7, PANTS);
      p.rect(12, 21, 2, 7, PANTS);
      boot(7, 28, 4);
      boot(12, 28, 4);
      return;
  }
}

function hunterArm(p: Pix, arm: Arm, dx: number, dy: number, back: boolean): void {
  const c = back ? COAT_D : COAT_L;
  const hand = back ? SKIN_D : SKIN;
  const x = (back ? 8 : 13) + dx;
  switch (arm) {
    case 'down':
      p.rect(x, 11 + dy, 2, 7, c);
      p.rect(x, 18 + dy, 2, 2, hand);
      return;
    case 'forward':
      p.rect(x + 1, 11 + dy, 2, 6, c);
      p.rect(x + 2, 17 + dy, 2, 2, hand);
      return;
    case 'back':
      p.rect(x - 1, 11 + dy, 2, 6, c);
      p.rect(x - 2, 17 + dy, 2, 2, hand);
      return;
    case 'raised':
      // Whip raised behind the head, ready to lash.
      p.rect(x - 2, 7 + dy, 2, 5, c);
      p.rect(x - 4, 5 + dy, 3, 2, c);
      p.rect(x - 5, 3 + dy, 2, 2, hand);
      return;
    case 'strike':
      p.rect(x + 1, 12 + dy, 6, 2, c);
      p.rect(x + 7, 12 + dy, 2, 2, hand);
      return;
    case 'up':
      p.rect(x, 2 + dy, 2, 10, c);
      p.rect(x, 0 + dy, 2, 2, hand);
      return;
    case 'out':
      if (back) {
        p.rect(x - 3, 10 + dy, 4, 2, c);
        p.rect(x - 5, 9 + dy, 2, 2, hand);
      } else {
        p.rect(x + 1, 9 + dy, 3, 2, c);
        p.rect(x + 4, 8 + dy, 2, 2, hand);
      }
      return;
  }
}

function hunterPose(p: Pix, legs: Legs, front: Arm, back: Arm, opts: { dx?: number; dy?: number; flare?: number; tails?: number } = {}): void {
  const dx = opts.dx ?? 0;
  const dy = opts.dy ?? 0;
  hunterArm(p, back, dx, dy, true);
  hunterTails(p, dx, dy, opts.flare ?? 0, opts.tails ?? 7);
  hunterLegs(p, legs);
  hunterTorso(p, dx, dy);
  hunterHead(p, dx, dy);
  hunterArm(p, front, dx, dy, false);
}

/** Vampire hunter (Pasi 21.10.): white hair, long dark red coat, grey scarf, leather boots. 24 × 32 pixels a frame. */
export function drawHunter(ctx: CanvasRenderingContext2D): void {
  frames(ctx, HUNTER_FRAMES.length, 24, 32, (p, i) => {
    switch (i) {
      case 0:
        return hunterPose(p, 'stand', 'down', 'down');
      case 1:
        return hunterPose(p, 'apart', 'forward', 'back', { flare: 2 });
      case 2:
        return hunterPose(p, 'pass', 'down', 'down', { dy: -1, flare: 1 });
      case 3:
        return hunterPose(p, 'apart', 'back', 'forward', { flare: 2 });
      case 4:
        return hunterPose(p, 'jump', 'forward', 'out', { dy: -1, flare: 3, tails: 6 });
      case 5:
        return hunterPose(p, 'crouch', 'forward', 'down', { dy: 9, flare: 1, tails: 3 });
      case 6:
        return hunterPose(p, 'stand', 'raised', 'down', { dx: -1 });
      case 7:
        return hunterPose(p, 'apart', 'strike', 'back', { dx: 1, flare: 1 });
      case 8:
        return hunterPose(p, 'crouch', 'strike', 'down', { dy: 9, flare: 1, tails: 3 });
      case 9:
        return hunterPose(p, 'stand', 'up', 'down');
      default:
        return hunterPose(p, 'hurt', 'out', 'out', { dx: -1, dy: 1 });
    }
  });
}

/** The whip in five levels (Pasi 21.10.): leather, spiked chain, silver, flaming, lightning. 56 × 8 pixels a frame, the handle end on the left. */
export function drawWhip(ctx: CanvasRenderingContext2D, lengths: readonly number[]): void {
  frames(
    ctx,
    5,
    56,
    8,
    (p, i) => {
      const length = Math.min(55, lengths[i]);
      const wave = (x: number): number => 4 + Math.round(Math.sin((x / length) * Math.PI * 1.5) * (i === 1 || i === 2 ? 0.6 : 1.2));
      for (let x = 0; x < length; x++) {
        const y = i === 4 ? 4 + ((Math.floor(x / 3) % 2) * 2 - 1) : wave(x);
        if (i === 0) {
          p.set(x, y, x % 3 === 0 ? '#5b3b24' : '#8a5a34');
        } else if (i === 1) {
          // Iron links with spikes.
          p.set(x, y, x % 2 === 0 ? '#9aa0b0' : '#5c6272');
          if (x % 5 === 0) p.set(x, y - 1, '#c8ccd8').set(x, y + 1, '#c8ccd8');
        } else if (i === 2) {
          p.set(x, y, x % 2 === 0 ? '#f4f8ff' : '#b8c8e0');
          if (x % 6 === 3) p.set(x, y - 1, '#e0f0ff');
        } else if (i === 3) {
          p.set(x, y, x % 2 === 0 ? '#ffd24a' : '#ff8a1f');
          if (x % 3 === 0) p.set(x, y - 1, '#ffb030');
          if (x % 5 === 2) p.set(x, y + 1, '#e5484d');
        } else {
          // Lightning: a white-hot zigzag with a blue glow.
          p.set(x, y, '#ffffff');
          p.set(x, y - 1, '#8fd8ff').set(x, y + 1, '#4aa8ff');
        }
      }
      // Handle.
      p.rect(0, 3, 3, 3, i === 2 ? '#7a6a8a' : '#3a2416');
      const tipY = i === 4 ? 4 : wave(length);
      p.set(length, tipY, ['#a8784a', '#e8ecf4', '#ffffff', '#fff4b0', '#e0f8ff'][i]);
    },
    false,
  );
}

/** Throwing dagger flying to the right: 10 × 4 pixels. */
export function drawDagger(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { s: '#e6ebf2', d: '#9aa0b0', h: '#5b3b24', g: '#e0b54a' };
  frames(ctx, 1, 10, 4, (p) => p.grid(0, 0, ['..g.......', 'hhgssssss.', 'hhgdddddds', '..g.......'], pal), false);
}

/** A bundle of five daggers (a pick-up): 10 × 10 pixels. */
export function drawDaggerItem(ctx: CanvasRenderingContext2D): void {
  frames(ctx, 1, 10, 10, (p) => {
    for (let k = 0; k < 3; k++) {
      p.line(1 + k, 8 - k * 0, 8, 1 + k * 2, '#c8ccd8');
      p.set(1 + k, 8, '#5b3b24').set(2 + k, 8, '#5b3b24');
    }
    p.set(8, 1, '#ffffff');
    p.rect(3, 6, 3, 1, '#e0b54a');
  });
}

// ---------------------------------------------------------------- graveyard enemies

/** Zombie: green-grey skin, torn clothes, arms forward. 16 × 32 pixels, 2 walking frames. */
export function drawZombie(ctx: CanvasRenderingContext2D): void {
  const skin = '#7f9c6b';
  const skinD = '#5a7650';
  const cloth = '#4a4766';
  const clothD = '#34314c';
  frames(ctx, 2, 16, 32, (p, i) => {
    // Legs
    if (i === 0) {
      p.rect(5, 21, 2, 8, clothD).rect(9, 21, 2, 8, clothD);
      p.rect(4, 29, 3, 3, skinD).rect(9, 29, 3, 3, skinD);
    } else {
      p.rect(6, 21, 2, 8, clothD).rect(8, 21, 2, 6, clothD);
      p.rect(5, 29, 3, 3, skinD).rect(9, 27, 3, 2, skinD);
    }
    // Body, ragged hem
    p.rect(4, 11, 8, 10, cloth);
    p.set(4, 21, cloth).set(7, 21, cloth).set(10, 21, cloth);
    p.rect(5, 13, 1, 3, clothD).rect(9, 16, 2, 1, clothD);
    // Head hanging forward
    p.rect(6, 3, 6, 7, skin);
    p.rect(6, 3, 6, 1, skinD);
    p.set(10, 5, '#ffe07a').set(8, 5, '#ffe07a');
    p.rect(8, 8, 3, 1, '#2a1f24');
    p.set(6, 6, skinD);
    // Arms reaching forward
    p.rect(9, 12, 6, 2, skin);
    p.rect(9, 15, 6, 2, skinD);
    p.set(15, 12, skinD).set(15, 15, skin);
  });
}

/** Bat: 16 × 12 pixels: hanging asleep, wings up, wings down. */
export function drawBat(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { d: '#2e2140', m: '#4b3767', e: '#ff4a3a', w: '#efe6d6' };
  const art = [
    ['......d..d......', '......dddd......', '.....mmddmm.....', '.....mmddmm.....', '.....mmddmm.....', '.....mmddmm.....', '......mddm......', '......deed......', '......dwwd......', '.......dd.......', '................', '................'],
    ['m..............m', 'mm............mm', 'mmm..d....d..mmm', 'mmmm.dddddd.mmmm', '.mmmmdeddedmmmm.', '..mmmddddddmmm..', '...mmddwwddmm...', '....m.dddd.m....', '......dddd......', '.......dd.......', '................', '................'],
    ['................', '................', '.....d....d.....', '.....dddddd.....', '....ddeddedd....', '..mmmddddddmmm..', '.mmmmddwwddmmmm.', 'mmmmm.dddd.mmmmm', 'mmm...dddd...mmm', 'mm.....dd.....mm', 'm..............m', '................'],
  ];
  frames(ctx, 3, 16, 12, (p, i) => p.grid(0, 0, art[i], pal));
}

/** Raven: 16 × 14 pixels: sitting, wings up, wings down. Faces right. */
export function drawRaven(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { k: '#17151f', b: '#33334f', y: '#e0a83a', e: '#e5484d' };
  const art = [
    ['................', '................', '................', '..........kk....', '.........kkkky..', '.........kekyy..', '....kkkkkkkk....', '..kkbbbbkkkk....', '.kkbbbbbkkk.....', 'kk..kkkkkk......', '.....kkkk.......', '......y.y.......', '......y.y.......', '................'],
    ['.....kk.........', '....kbbk........', '....kbbbk.......', '.....kbbbk.kk...', '......kbbkkkkky.', '.......kkkekkyy.', '..kkkkkkkkkk....', 'kkk..kkkkkk.....', '.......kk.......', '................', '................', '................', '................', '................'],
    ['................', '................', '................', '...........kk...', '..........kkkky.', '..kkkkkkkkkekyy.', 'kkk.kbbbbkkk....', '....kbbbbk......', '.....kbbbk......', '......kbbk......', '.......kk.......', '................', '................', '................'],
  ];
  frames(ctx, 3, 16, 14, (p, i) => p.grid(0, 0, art[i], pal));
}

// ---------------------------------------------------------------- castle enemies

const STEEL = '#8a93a3';
const STEEL_D = '#5a6272';
const STEEL_L = '#c3cad6';

/** Armour: an empty suit of armour with a red plume. 20 × 32 pixels: walking 1, walking 2, throwing. */
export function drawArmor(ctx: CanvasRenderingContext2D): void {
  frames(ctx, 3, 20, 32, (p, i) => {
    // Legs
    if (i === 1) {
      p.rect(7, 22, 3, 7, STEEL_D).rect(11, 22, 3, 6, STEEL);
      p.rect(6, 29, 4, 3, STEEL_D).rect(11, 28, 5, 3, STEEL);
    } else {
      p.rect(6, 22, 3, 7, STEEL_D).rect(11, 22, 3, 7, STEEL);
      p.rect(5, 29, 4, 3, STEEL_D).rect(11, 29, 5, 3, STEEL);
    }
    // Skirt of plates and chest
    p.rect(5, 19, 10, 3, STEEL_D);
    p.rect(5, 10, 10, 9, STEEL);
    p.rect(6, 11, 2, 7, STEEL_L);
    p.rect(9, 10, 1, 9, STEEL_D);
    // Shoulders
    p.rect(3, 9, 4, 3, STEEL_L).rect(13, 9, 4, 3, STEEL_L);
    // Helmet with a slit and a plume
    p.rect(6, 3, 8, 7, STEEL);
    p.rect(7, 3, 2, 6, STEEL_L);
    p.rect(10, 6, 4, 1, '#120a16');
    p.set(12, 6, '#e5484d');
    p.rect(8, 0, 3, 3, '#c8283c').rect(6, 1, 2, 2, '#a01c30');
    // Arms: an axe raised to throw, or held at the side
    if (i === 2) {
      p.rect(14, 4, 2, 6, STEEL);
      p.rect(15, 0, 1, 5, '#6a4a2a');
      p.rect(16, 0, 3, 3, STEEL_L);
    } else {
      p.rect(14, 12, 2, 7, STEEL);
      p.rect(16, 13, 1, 9, '#6a4a2a');
      p.rect(17, 19, 2, 4, STEEL_L);
    }
    p.rect(3, 12, 2, 7, STEEL_D);
  });
}

/** Thrown axe: 10 × 10 pixels (the game spins it). */
export function drawAxe(ctx: CanvasRenderingContext2D): void {
  frames(ctx, 1, 10, 10, (p) => {
    p.line(2, 8, 7, 3, '#7a5233');
    p.line(2, 7, 6, 3, '#5b3b24');
    p.grid(4, 0, ['.sss.', 'sSSs.', 'sSS..', '.s...'], { s: STEEL_L, S: STEEL });
  });
}

/** Flaming skull: 16 × 16 pixels, 2 frames of flickering flames trailing behind (to the left). */
export function drawSkull(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { b: '#efe6cf', d: '#b8ad92', k: '#1a1124', f: '#ff8a1f', y: '#ffd04a', r: '#e5484d' };
  const flames = [
    ['....r...........', '..rff...........', '.rffy...........', 'rffyy...........', '.rffy...........', 'rffyy...........', '.rfy............', '..rf............'],
    ['..r.............', '.rff............', 'rffyy...........', '.rffy...........', 'rffyy...........', '.rffy...........', 'rfy.............', '.r..............'],
  ];
  const skull = ['..bbbbbb..', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbkkbbkkbb', 'bbkkbbkkbb', 'bbbbkkbbbb', '.dbbbbbbd.', '..bkbkbk..', '..bbbbbb..'];
  frames(ctx, 2, 16, 16, (p, i) => {
    p.grid(0, 4, flames[i], pal);
    p.grid(5, 3, skull, pal);
  });
}

/** Spider: 14 × 12 pixels, 2 frames of moving legs. */
export function drawSpider(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { k: '#1d1626', g: '#3a2f4a', r: '#e5484d', l: '#2a2236' };
  const art = [
    ['......kk......', '.....kggk.....', 'l...kkkkkk...l', '.l.kkgrrgkk.l.', '..lkkkkkkkkl..', 'llkkkkkkkkkkll', '..lkkkkkkkkl..', '.l.kkkkkkkk.l.', 'l..l.kkkk.l..l', '...l..rr..l...', '..l........l..', '..............'],
    ['......kk......', '.....kggk.....', '.l..kkkkkk..l.', 'l..kkgrrgkk..l', '.llkkkkkkkkll.', '..kkkkkkkkkk..', 'llkkkkkkkkkkll', '..lkkkkkkkkl..', '.l..l.kk.l..l.', 'l...l.rr.l...l', '....l....l....', '..............'],
  ];
  frames(ctx, 2, 14, 12, (p, i) => p.grid(0, 0, art[i], pal));
}

// ---------------------------------------------------------------- forest enemies

/** Will-o'-the-wisp: 12 × 12 pixels, 2 frames of a flickering cold light. */
export function drawWisp(ctx: CanvasRenderingContext2D): void {
  frames(
    ctx,
    2,
    12,
    12,
    (p, i) => {
      p.disc(5.5, 6, 5, '#1f8f7a');
      p.disc(5.5, 6, 3.6, '#3fd0a0');
      p.disc(5.5 + (i === 0 ? 0 : 0.5), 6, 2.2, '#9fffe0');
      p.disc(5.5, 6, 1, '#ffffff');
      p.set(i === 0 ? 2 : 9, 1, '#9fffe0').set(i === 0 ? 9 : 2, 10, '#3fd0a0');
    },
    false,
  );
}

/** Poison mushroom: purple cap with green spots and angry eyes. 16 × 16 pixels: still, puffing spores. */
export function drawMushroom(ctx: CanvasRenderingContext2D): void {
  frames(ctx, 2, 16, 16, (p, i) => {
    const squash = i === 1 ? 1 : 0;
    p.rect(5, 9 + squash, 6, 7 - squash, '#e3d6bc');
    p.rect(5, 9 + squash, 1, 7 - squash, '#b9a98c');
    p.set(6, 11 + squash, '#1a1124').set(9, 11 + squash, '#1a1124');
    p.rect(7, 13 + squash, 2, 1, '#6a2a3a');
    // Cap
    p.rect(2, 4 + squash, 12, 5, '#7a2a8a');
    p.rect(4, 2 + squash, 8, 2, '#7a2a8a');
    p.rect(1, 7 + squash, 14, 2, '#5c1d6a');
    p.set(5, 4 + squash, '#8fdc5a').set(10, 3 + squash, '#8fdc5a').set(12, 6 + squash, '#8fdc5a').set(3, 6 + squash, '#8fdc5a').set(8, 6 + squash, '#b6f07a');
    if (i === 1) p.set(7, 0, '#8fdc5a').set(9, 1, '#b6f07a').set(5, 0, '#b6f07a');
  });
}

/** Spore: 6 × 6 pixels. */
export function drawSpore(ctx: CanvasRenderingContext2D): void {
  frames(
    ctx,
    1,
    6,
    6,
    (p) => {
      p.disc(2.5, 2.5, 2.6, '#5aa83a');
      p.disc(2.5, 2.5, 1.6, '#b6f07a');
      p.set(2, 2, '#efffd0');
    },
    false,
  );
}

/** Wolf: dark grey with yellow eyes. 26 × 16 pixels: sitting and howling, running 1, running 2. */
export function drawWolf(ctx: CanvasRenderingContext2D): void {
  const fur = '#3b3b4d';
  const furD = '#272736';
  const furL = '#5d5d74';
  frames(ctx, 3, 26, 16, (p, i) => {
    if (i === 0) {
      // Sitting, head raised in a howl.
      p.rect(8, 7, 9, 7, fur).rect(7, 13, 11, 3, furD);
      p.rect(9, 8, 3, 5, furL);
      p.rect(14, 2, 4, 6, fur);
      p.rect(16, 0, 3, 3, fur).rect(18, 1, 3, 2, furL);
      p.set(15, 0, furD).set(17, 3, '#ffd04a');
      p.rect(3, 11, 5, 2, furD).set(2, 10, furD);
      p.rect(15, 12, 2, 4, furD);
      return;
    }
    const stride = i === 1;
    // Body stretched out
    p.rect(5, 5, 14, 6, fur);
    p.rect(6, 9, 11, 2, furL);
    p.rect(5, 5, 14, 1, furD);
    // Head and snout
    p.rect(18, 3, 5, 6, fur).rect(22, 5, 3, 3, fur);
    p.set(24, 7, furL).set(20, 4, '#ffd04a').set(19, 2, furD).set(21, 2, furD);
    p.rect(22, 8, 2, 1, '#efe6cf');
    // Tail
    p.rect(1, 4, 4, 2, fur).set(0, 3, furD);
    // Legs
    if (stride) {
      p.rect(4, 11, 2, 4, furD).rect(7, 11, 2, 3, furD).rect(15, 11, 2, 4, furD).rect(18, 11, 2, 3, furD);
      p.set(3, 15, furD).set(19, 14, furD);
    } else {
      p.rect(6, 11, 2, 4, furD).rect(9, 11, 2, 4, furD).rect(13, 11, 2, 4, furD).rect(16, 11, 2, 4, furD);
    }
  });
}

/** Skeleton raised by the head witch: 16 × 32 pixels, 2 walking frames. */
export function drawSkeleton(ctx: CanvasRenderingContext2D): void {
  const bone = '#e8dfc6';
  const boneD = '#b3a78a';
  frames(ctx, 2, 16, 32, (p, i) => {
    p.rect(6, 3, 6, 6, bone);
    p.set(7, 5, '#1a1124').set(10, 5, '#1a1124').rect(8, 7, 3, 1, boneD);
    p.rect(8, 9, 2, 3, boneD);
    // Ribs
    for (let y = 12; y <= 18; y += 2) p.hline(5, 12, y, bone);
    p.rect(8, 12, 1, 8, boneD);
    p.rect(6, 20, 6, 2, bone);
    // Arms reaching forward
    p.rect(10, 13, 5, 1, bone).rect(10, 15, 5, 1, bone);
    p.set(15, 13, boneD).set(15, 15, boneD);
    // Legs
    if (i === 0) {
      p.rect(6, 22, 1, 7, bone).rect(10, 22, 1, 7, bone);
      p.rect(5, 29, 3, 2, boneD).rect(10, 29, 3, 2, boneD);
    } else {
      p.rect(7, 22, 1, 7, bone).rect(9, 22, 1, 5, bone);
      p.rect(6, 29, 3, 2, boneD).rect(9, 27, 3, 2, boneD);
    }
  });
}

// ---------------------------------------------------------------- the head witch

/** Head witch on her broom: 32 × 32 pixels: flying 1, flying 2, casting, hurt. Faces right. */
export function drawWitch(ctx: CanvasRenderingContext2D): void {
  const robe = '#4a2a6a';
  const robeD = '#311a49';
  const robeL = '#6b3f94';
  const skin = '#8fbf6a';
  const skinD = '#6a9a4c';
  const hat = '#1d1626';
  const hair = '#9d9db0';
  frames(ctx, 4, 32, 32, (p, i) => {
    const bob = i === 1 ? 1 : 0;
    // Broom: handle and straw at the back.
    p.rect(4, 22 + bob, 24, 2, '#6a4527');
    p.rect(4, 22 + bob, 24, 1, '#8a5c34');
    p.rect(0, 19 + bob, 6, 8, '#c89a3a');
    p.rect(0, 20 + bob, 2, 6, '#a07a26');
    p.set(6, 20 + bob, '#c89a3a').set(6, 26 + bob, '#c89a3a');
    // Robe sitting on the broom, the hem fluttering.
    p.rect(10, 12 + bob, 10, 11, robe);
    p.rect(10, 12 + bob, 2, 11, robeD);
    p.rect(8 - (i === 1 ? 1 : 0), 20 + bob, 5, 6, robe);
    p.rect(14, 23 + bob, 6, 3, robeD);
    p.rect(15, 26 + bob, 3, 2, '#1d1626');
    // Hair and face.
    p.rect(11, 6 + bob, 9, 7, hair);
    p.rect(15, 7 + bob, 5, 5, skin);
    p.rect(19, 9 + bob, 2, 2, skin);
    p.set(21, 10 + bob, skinD);
    p.set(17, 8 + bob, '#ff4a3a');
    p.rect(16, 11 + bob, 3, 1, '#2a1a24');
    // Hat: wide brim and a bent point.
    p.rect(9, 5 + bob, 14, 2, hat);
    p.rect(12, 1 + bob, 6, 4, hat);
    p.rect(11, 0 + bob, 3, 2, hat);
    p.rect(12, 4 + bob, 6, 1, '#7a2a8a');
    // Arms
    if (i === 2) {
      // Casting: hand raised, magic glowing.
      p.rect(19, 8, 2, 6, robeL);
      p.rect(20, 5, 2, 3, skin);
      p.disc(22, 3, 2.5, '#e060ff');
      p.set(22, 3, '#ffffff');
    } else {
      p.rect(17, 14 + bob, 6, 2, robeL);
      p.rect(22, 15 + bob, 2, 3, skin);
    }
    if (i === 3) {
      // Hurt: thrown back, mouth open.
      p.rect(16, 11, 2, 2, '#1a1124');
      p.set(14, 9, '#ffffff');
    }
  });
}

/** Magic orb: 8 × 8 pixels, 2 pulsing frames. */
export function drawOrb(ctx: CanvasRenderingContext2D): void {
  frames(
    ctx,
    2,
    8,
    8,
    (p, i) => {
      p.disc(3.5, 3.5, i === 0 ? 3.6 : 3.2, '#9a2ad0');
      p.disc(3.5, 3.5, 2.4, '#e060ff');
      p.disc(3.5, 3.5, 1.1, '#ffffff');
    },
    false,
  );
}

// ---------------------------------------------------------------- items and the rest

/** Candle on an iron stand: 8 × 16 pixels, 2 frames of a flickering flame. */
export function drawCandle(ctx: CanvasRenderingContext2D): void {
  frames(ctx, 2, 8, 16, (p, i) => {
    p.rect(3, 13, 2, 2, '#4a4458');
    p.rect(1, 15, 6, 1, '#4a4458');
    p.rect(1, 11, 6, 2, '#6a6478');
    p.rect(2, 5, 4, 6, '#efe3c4');
    p.rect(2, 5, 1, 6, '#c9b98e');
    p.set(4, 4, '#3a2a2a');
    if (i === 0) p.grid(2, 0, ['..y.', '.yo.', '.oo.', '..r.'], { y: '#fff2a0', o: '#ffb030', r: '#ff8a1f' });
    else p.grid(2, 0, ['.y..', '.oy.', '.oo.', '.r..'], { y: '#fff2a0', o: '#ffb030', r: '#ff8a1f' });
  });
}

/** Half a heart (a pick-up that heals ½): 8 × 8 pixels. */
export function drawHeartItem(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { r: '#e5484d', l: '#ff8f8f', d: '#9a1f2a' };
  frames(ctx, 1, 8, 8, (p) => p.grid(0, 0, ['.rr.....', 'rlrr....', 'rlrr....', 'rrrr....', '.rrr....', '..rr....', '...r....', '........'], pal));
}

/** Whip upgrade: a golden coiled whip. 10 × 10 pixels. */
export function drawWhipItem(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { g: '#f5c542', y: '#fff0a0', b: '#b8862b', h: '#5b3b24' };
  frames(ctx, 1, 10, 10, (p) => p.grid(0, 0, ['..gggg....', '.gyyyyg...', 'gy....yg..', 'g..gg..g..', 'g.g..g.g..', 'g.g.b..g..', 'gy.gg.yg..', '.gyyyyg.hh', '..ggggbhh.', '.......h..'], pal));
}

/** Gold coin from a candle: 8 × 8 pixels. */
export function drawCoin(ctx: CanvasRenderingContext2D): void {
  const pal: Palette = { g: '#f5c542', d: '#b8862b', y: '#fff0a0', k: '#8a5e1a' };
  frames(ctx, 1, 8, 8, (p) => p.grid(0, 0, ['..gggg..', '.gyyggd.', 'gyggkgdd', 'gygkkgdd', 'gggkkgdd', 'ggggkgdd', '.gggddd.', '..dddd..'], pal));
}

/** Heart for the health bar: 10 × 9 pixels: full, half, empty. */
export function drawHudHeart(ctx: CanvasRenderingContext2D): void {
  const shape = ['.xx..xx..', 'xxxxxxxx.', 'xxxxxxxxx', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..', '...xxx...', '....x....', '.........'];
  frames(ctx, 3, 10, 9, (p, i) => {
    shape.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== 'x') continue;
        const full = i === 0 || (i === 1 && x <= 4);
        p.set(x, y, full ? (y < 3 && x % 4 === 1 ? '#ff8f8f' : '#e5484d') : '#3a2a44');
      }
    });
  });
}

/** Swinging blade: a steel crescent, 24 × 16 pixels (the rod is drawn by the game). */
export function drawBlade(ctx: CanvasRenderingContext2D): void {
  frames(ctx, 1, 24, 16, (p) => {
    for (let x = 1; x < 23; x++) {
      const t = (x - 11.5) / 11;
      const bottom = Math.round(14 - t * t * 8);
      const top = Math.round(6 - t * t * 4);
      for (let y = top; y <= bottom; y++) p.set(x, y, y >= bottom - 1 ? '#e6ebf2' : y >= bottom - 3 ? STEEL_L : STEEL);
    }
    p.rect(10, 0, 4, 7, STEEL_D);
    p.rect(11, 1, 2, 2, '#2a2e3a');
  });
}

/** Gate at the end of a level: a gothic arched door glowing from inside. 32 × 48 pixels. */
export function drawGate(ctx: CanvasRenderingContext2D): void {
  frames(ctx, 1, 32, 48, (p) => {
    const stone = '#5a5f78';
    const stoneD = '#3d4157';
    // Arch frame
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = x - 15.5;
        const archTop = y < 16 ? 16 - Math.sqrt(Math.max(0, 256 - dx * dx * 1.0)) : 0;
        if (y >= archTop + 0 && Math.abs(dx) <= 16) {
          const inner = Math.abs(dx) <= 11 && y >= archTop + 5;
          p.set(x, y, inner ? (y > 40 ? '#ffb030' : y > 28 ? '#ffd04a' : '#fff0a0') : (x + Math.floor(y / 4)) % 5 === 0 || y % 4 === 0 ? stoneD : stone);
        }
      }
    }
    // Iron bars over the light
    for (let x = 7; x <= 24; x += 4) p.rect(x, 6, 1, 42, '#2a2236');
    p.rect(4, 26, 24, 1, '#2a2236');
  });
}
