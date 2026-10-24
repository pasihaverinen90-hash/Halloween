import type Phaser from 'phaser';

/*
 * Shared look of the whole evening: a Halloween night, and in the menus the
 * neon arcade of Spooky Arcade 3000 (Pasi 24.10.). Use these instead of
 * ad-hoc colours and fonts.
 */

/** Colours as numbers for Graphics/fills. */
export const COLORS = {
  night: 0x0b0716,
  bg: 0x150d27,
  panel: 0x22163b,
  panelLight: 0x2f2052,
  border: 0x4a3578,
  orange: 0xff8a1f,
  orangeDark: 0xb95a0c,
  green: 0x8fdc5a,
  red: 0xe5484d,
  bone: 0xf4ecd8,
  muted: 0xa597c4,
  grey: 0x5e5673,
  gold: 0xf5c542,
  silver: 0xc9d1d9,
  bronze: 0xcd8a4b,
  black: 0x000000,
  /** Pasi 24.10.: neon arcade look of the menus (Spooky Arcade 3000). */
  neonPink: 0xff3fd8,
  neonCyan: 0x3ff7ff,
  neonPurple: 0x9b5cff,
} as const;

/** The same colours as CSS strings for Text styles. */
export const CSS = {
  night: '#0b0716',
  bg: '#150d27',
  panel: '#22163b',
  panelLight: '#2f2052',
  border: '#4a3578',
  orange: '#ff8a1f',
  orangeDark: '#b95a0c',
  green: '#8fdc5a',
  red: '#e5484d',
  bone: '#f4ecd8',
  muted: '#a597c4',
  grey: '#5e5673',
  gold: '#f5c542',
  silver: '#c9d1d9',
  bronze: '#cd8a4b',
  black: '#000000',
  neonPink: '#ff3fd8',
  neonCyan: '#3ff7ff',
  neonPurple: '#9b5cff',
} as const;

/** Font stacks. The web fonts are bundled (see main.ts) and loaded before the game starts. */
export const FONTS = {
  /** Gothic display font for titles. */
  title: '"Grenze Gotisch", Georgia, serif',
  /** Clear UI font for everything else. */
  ui: '"Nunito", "Segoe UI", Arial, sans-serif',
  /** Hand-drawn look for drawn-style games (hangman letters, hints). */
  hand: '"Patrick Hand", "Segoe Print", "Comic Sans MS", cursive',
  /** Pasi 24.10.: 8-bit arcade font of the menus' titles and big words. Wide: keep the texts short. */
  arcade: '"Press Start 2P", "Courier New", monospace',
  /** Narrow old-terminal font for the menus' smaller arcade texts (e.g. game names on tiles). */
  terminal: '"VT323", "Courier New", monospace',
  /** Colour emojis, bundled so they look the same on every computer. */
  emoji: '"Twemoji", "Segoe UI Emoji", "Apple Color Emoji", sans-serif',
} as const;

type Style = Phaser.Types.GameObjects.Text.TextStyle;

/** Text style presets. Spread and override: { ...TEXT.body, color: CSS.orange }. */
export const TEXT = {
  /** Big screen titles. */
  title: {
    fontFamily: FONTS.title,
    fontStyle: '800',
    fontSize: '76px',
    color: CSS.orange,
    stroke: '#2a0e00',
    strokeThickness: 6,
    shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 12, fill: true, stroke: true },
  },
  /** Section headings. */
  heading: {
    fontFamily: FONTS.title,
    fontStyle: '600',
    fontSize: '46px',
    color: CSS.bone,
  },
  /** Normal text. */
  body: {
    fontFamily: FONTS.ui,
    fontSize: '26px',
    color: CSS.bone,
  },
  bodyBold: {
    fontFamily: FONTS.ui,
    fontStyle: '800',
    fontSize: '26px',
    color: CSS.bone,
  },
  /** Secondary text. */
  small: {
    fontFamily: FONTS.ui,
    fontSize: '20px',
    color: CSS.muted,
  },
  /** Key hints at the bottom of the screen, e.g. "Enter – Aloita". */
  hint: {
    fontFamily: FONTS.ui,
    fontStyle: '700',
    fontSize: '20px',
    color: CSS.muted,
  },
  /**
   * Neon arcade titles of the menus (Pasi 24.10.: Spooky Arcade 3000): pink
   * pixel letters glowing cyan. Not used inside the games.
   */
  arcade: {
    fontFamily: FONTS.arcade,
    fontSize: '48px',
    color: CSS.neonPink,
    stroke: '#2a0638',
    strokeThickness: 4,
    // A soft glow only around the letters; a strong one turns into a box with the square pixel letters.
    shadow: { offsetX: 0, offsetY: 0, color: 'rgba(63, 247, 255, 0.55)', blur: 10, fill: true, stroke: false },
  },
  /** Smaller neon pixel text: labels such as INSERT COIN or PLAYER 1 READY. */
  arcadeSmall: {
    fontFamily: FONTS.arcade,
    fontSize: '20px',
    color: CSS.neonCyan,
    shadow: { offsetX: 0, offsetY: 0, color: 'rgba(63, 247, 255, 0.45)', blur: 6, fill: true },
  },
  /** Old-terminal text for names on the menus' tiles. */
  terminal: {
    fontFamily: FONTS.terminal,
    fontSize: '32px',
    color: CSS.bone,
  },
  /** Hand-drawn game text. */
  hand: {
    fontFamily: FONTS.hand,
    fontSize: '34px',
    color: CSS.bone,
  },
} satisfies Record<string, Style>;

/** Drawing order of the shared UI layers inside a scene (game content uses the default 0). */
export const DEPTH = {
  /** Shared background image (addBackdrop). */
  backdrop: -100,
  /** Optional darkening layer over the background. */
  backdropDim: -99,
  /** Key hints at the bottom of the screen (addKeyHints). */
  hints: 900,
  /** Old picture tube lines over the menus (addBackdrop). */
  scanlines: 1000,
  /** Short messages near the top (showToast). */
  toast: 2000,
} as const;
