import type Phaser from 'phaser';

/*
 * Shared look of the whole evening: generic Halloween night (the real theme is
 * decided later). Use these instead of ad-hoc colours and fonts.
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
} as const;

/** Font stacks. The web fonts are bundled (see main.ts) and loaded before the game starts. */
export const FONTS = {
  /** Gothic display font for titles. */
  title: '"Grenze Gotisch", Georgia, serif',
  /** Clear UI font for everything else. */
  ui: '"Nunito", "Segoe UI", Arial, sans-serif',
  /** Hand-drawn look for drawn-style games (hangman letters, hints). */
  hand: '"Patrick Hand", "Segoe Print", "Comic Sans MS", cursive',
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
  /** Hand-drawn game text. */
  hand: {
    fontFamily: FONTS.hand,
    fontSize: '34px',
    color: CSS.bone,
  },
} satisfies Record<string, Style>;
