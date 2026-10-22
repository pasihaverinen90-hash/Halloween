import type { Shape } from './terrain';

/*
 * The five levels of the skeleton castle (Pasi 22.10.), the same in every
 * attempt. Coordinates are in game units: a level is 1920 wide (one and a
 * half screens) and 720 high. Skeletons and barrels stand on the first
 * surface found below `fromY` at their x. Play-testing changes are made here.
 */

export interface LevelDef {
  name: string;
  /** The catapult stands on the ground at this x, on the left. */
  catapultX: number;
  shapes: Shape[];
  /** Water (the moat): anything that falls in is lost. */
  water: Array<{ x0: number; x1: number; y: number }>;
  skeletons: Array<{ x: number; fromY?: number; moves?: boolean }>;
  barrels: Array<{ x: number; fromY?: number }>;
}

/** 1. Linnan edusta: an open hill, two skeletons standing still. */
const EDUSTA: LevelDef = {
  name: 'Linnan edusta',
  catapultX: 130,
  shapes: [
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [0, 560],
        [320, 560],
        [520, 525],
        [780, 470],
        [980, 490],
        [1180, 560],
        [1420, 530],
        [1640, 480],
        [1920, 500],
        [1920, 720],
        [0, 720],
      ],
    },
    { kind: 'rect', material: 'stone', x: 0, y: 680, w: 1920, h: 40 },
  ],
  water: [],
  skeletons: [{ x: 860 }, { x: 1620 }],
  barrels: [],
};

/** 2. Vallihauta ja silta: a wooden bridge over the moat; break it and the skeleton falls into the water. */
const VALLIHAUTA: LevelDef = {
  name: 'Vallihauta ja silta',
  catapultX: 130,
  shapes: [
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [0, 560],
        [740, 560],
        [800, 610],
        [800, 720],
        [0, 720],
      ],
    },
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [1150, 720],
        [1150, 610],
        [1200, 545],
        [1920, 545],
        [1920, 720],
      ],
    },
    { kind: 'rect', material: 'wood', x: 760, y: 548, w: 420, h: 16 },
    { kind: 'rect', material: 'stone', x: 1760, y: 300, w: 160, h: 245 },
  ],
  water: [{ x0: 800, x1: 1150, y: 640 }],
  skeletons: [{ x: 975 }, { x: 1560 }],
  barrels: [],
};

/** 3. Linnanpiha torneineen: two stone towers; one skeleton hides behind the first and walks. */
const PIHA: LevelDef = {
  name: 'Linnanpiha',
  catapultX: 130,
  shapes: [
    { kind: 'rect', material: 'earth', x: 0, y: 580, w: 1920, h: 140 },
    { kind: 'rect', material: 'stone', x: 1000, y: 330, w: 110, h: 250 },
    { kind: 'rect', material: 'stone', x: 1460, y: 280, w: 110, h: 300 },
    { kind: 'rect', material: 'stone', x: 0, y: 680, w: 1920, h: 40 },
  ],
  water: [],
  skeletons: [{ x: 1055 }, { x: 1260, moves: true }, { x: 1515 }],
  barrels: [{ x: 1330 }],
};

/** 4. Muurit ja vartiotornit: a high wall, a wooden watchtower and skeletons behind them. */
const MUURIT: LevelDef = {
  name: 'Muurit ja vartiotornit',
  catapultX: 130,
  shapes: [
    { kind: 'rect', material: 'earth', x: 0, y: 570, w: 1920, h: 150 },
    { kind: 'rect', material: 'stone', x: 820, y: 300, w: 140, h: 270 },
    // Watchtower: two legs and a platform of wood.
    { kind: 'rect', material: 'wood', x: 1282, y: 382, w: 16, h: 188 },
    { kind: 'rect', material: 'wood', x: 1386, y: 382, w: 16, h: 188 },
    { kind: 'rect', material: 'wood', x: 1266, y: 366, w: 152, h: 16 },
    { kind: 'rect', material: 'stone', x: 0, y: 680, w: 1920, h: 40 },
  ],
  water: [],
  skeletons: [{ x: 890 }, { x: 1342 }, { x: 1110, moves: true }, { x: 1760, moves: true }],
  barrels: [{ x: 1170 }, { x: 1680 }],
};

/** 5. Hautaholvi: a crypt under a low stone ceiling, so the shots must be flat. */
const HOLVI: LevelDef = {
  name: 'Hautaholvi',
  catapultX: 130,
  shapes: [
    { kind: 'rect', material: 'earth', x: 0, y: 600, w: 1920, h: 120 },
    {
      kind: 'poly',
      material: 'stone',
      points: [
        [420, 0],
        [1920, 0],
        [1920, 300],
        [1500, 280],
        [1000, 300],
        [600, 280],
        [420, 250],
      ],
    },
    { kind: 'rect', material: 'stone', x: 900, y: 545, w: 110, h: 55 },
    { kind: 'rect', material: 'stone', x: 1420, y: 545, w: 110, h: 55 },
    { kind: 'rect', material: 'stone', x: 0, y: 680, w: 1920, h: 40 },
  ],
  water: [],
  skeletons: [{ x: 760, fromY: 320, moves: true }, { x: 955, fromY: 320 }, { x: 1220, fromY: 320, moves: true }, { x: 1700, fromY: 320 }],
  barrels: [{ x: 1290, fromY: 320 }, { x: 1620, fromY: 320 }],
};

export const LEVELS: readonly LevelDef[] = [EDUSTA, VALLIHAUTA, PIHA, MUURIT, HOLVI];
