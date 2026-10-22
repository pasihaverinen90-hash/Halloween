import type { Shape } from './terrain';

/*
 * The five levels of the skeleton castle (Pasi 22.10.), the same in every
 * attempt. Coordinates are in game units: a level is 2560 wide (about two
 * screens) and 720 high, with hills, valleys and obstacles so the skeletons
 * are not all in one line. Skeletons and barrels stand on the first surface
 * found below `fromY` at their x. Play-testing changes are made here.
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

const BEDROCK: Shape = { kind: 'rect', material: 'stone', x: 0, y: 690, w: 2560, h: 30 };

/** 1. Linnan edusta: rolling hills and a high hill in the middle; five skeletons standing still. */
const EDUSTA: LevelDef = {
  name: 'Linnan edusta',
  catapultX: 200,
  shapes: [
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [0, 560],
        [330, 560],
        [480, 530],
        [640, 485],
        [820, 420],
        [960, 330],
        [1100, 250],
        [1240, 320],
        [1370, 460],
        [1500, 565],
        [1640, 560],
        [1780, 450],
        [1940, 370],
        [2100, 420],
        [2250, 490],
        [2400, 500],
        [2560, 470],
        [2560, 720],
        [0, 720],
      ],
    },
    { kind: 'rect', material: 'stone', x: 1060, y: 236, w: 80, h: 18 },
    BEDROCK,
  ],
  water: [],
  skeletons: [{ x: 720 }, { x: 1100 }, { x: 1520 }, { x: 1950 }, { x: 2420 }],
  barrels: [],
};

/** 2. Vallihauta ja silta: a bridge over the moat, a hill, a floating rock and a tower on the far side. */
const VALLIHAUTA: LevelDef = {
  name: 'Vallihauta ja silta',
  catapultX: 200,
  shapes: [
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [0, 560],
        [420, 560],
        [600, 500],
        [760, 520],
        [860, 560],
        [900, 610],
        [900, 720],
        [0, 720],
      ],
    },
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [1300, 720],
        [1300, 610],
        [1340, 545],
        [1560, 545],
        [1720, 470],
        [1880, 410],
        [2030, 470],
        [2180, 545],
        [2560, 545],
        [2560, 720],
      ],
    },
    { kind: 'rect', material: 'wood', x: 880, y: 548, w: 440, h: 16 },
    // A rock floating above the moat.
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [1520, 250],
        [1720, 240],
        [1760, 270],
        [1680, 320],
        [1580, 320],
        [1500, 280],
      ],
    },
    { kind: 'rect', material: 'stone', x: 2340, y: 300, w: 130, h: 245 },
    BEDROCK,
  ],
  water: [{ x0: 900, x1: 1300, y: 640 }],
  skeletons: [{ x: 610 }, { x: 1100 }, { x: 1460 }, { x: 1640 }, { x: 1880 }, { x: 2405 }],
  barrels: [{ x: 2240 }],
};

/** 3. Linnanpiha: three towers of different heights, a terrace and skeletons walking between them. */
const PIHA: LevelDef = {
  name: 'Linnanpiha',
  catapultX: 200,
  shapes: [
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [0, 580],
        [700, 580],
        [760, 600],
        [2560, 600],
        [2560, 720],
        [0, 720],
      ],
    },
    { kind: 'rect', material: 'stone', x: 880, y: 330, w: 110, h: 270 },
    { kind: 'rect', material: 'earth', x: 1150, y: 500, w: 220, h: 100 },
    { kind: 'rect', material: 'stone', x: 1520, y: 250, w: 120, h: 350 },
    // A wooden walkway from the middle tower.
    { kind: 'rect', material: 'wood', x: 1640, y: 400, w: 240, h: 16 },
    { kind: 'rect', material: 'wood', x: 1864, y: 416, w: 16, h: 184 },
    { kind: 'rect', material: 'stone', x: 2140, y: 300, w: 110, h: 300 },
    BEDROCK,
  ],
  water: [],
  skeletons: [{ x: 935 }, { x: 1260, moves: true }, { x: 1580 }, { x: 1760, fromY: 300 }, { x: 2000, moves: true }, { x: 2195 }],
  barrels: [{ x: 1330 }, { x: 2080 }, { x: 2380 }],
};

/** 4. Muurit ja vartiotornit: a high wall, two wooden watchtowers, a hill and a ridge at the end. */
const MUURIT: LevelDef = {
  name: 'Muurit ja vartiotornit',
  catapultX: 200,
  shapes: [
    {
      kind: 'poly',
      material: 'earth',
      points: [
        [0, 600],
        [1450, 600],
        [1600, 470],
        [1750, 520],
        [2280, 600],
        [2400, 470],
        [2560, 440],
        [2560, 720],
        [0, 720],
      ],
    },
    { kind: 'rect', material: 'stone', x: 1000, y: 250, w: 150, h: 350 },
    // Watchtower 1
    { kind: 'rect', material: 'wood', x: 612, y: 396, w: 16, h: 204 },
    { kind: 'rect', material: 'wood', x: 708, y: 396, w: 16, h: 204 },
    { kind: 'rect', material: 'wood', x: 596, y: 380, w: 144, h: 16 },
    // Watchtower 2
    { kind: 'rect', material: 'wood', x: 1912, y: 386, w: 16, h: 200 },
    { kind: 'rect', material: 'wood', x: 2008, y: 386, w: 16, h: 200 },
    { kind: 'rect', material: 'wood', x: 1896, y: 370, w: 144, h: 16 },
    BEDROCK,
  ],
  water: [],
  skeletons: [
    { x: 668 },
    { x: 1075 },
    { x: 1300, moves: true },
    { x: 1600 },
    { x: 1968 },
    { x: 2200, moves: true },
    { x: 2470 },
  ],
  barrels: [{ x: 1380 }, { x: 2120 }],
};

/** 5. Hautaholvi: a crypt under a low, uneven ceiling with hanging pillars; flat shots needed. The vault is a stone mound with the night above it; the far end is a ruin open to the sky, reached with a high arc over the mound. */
const HOLVI: LevelDef = {
  name: 'Hautaholvi',
  catapultX: 200,
  shapes: [
    { kind: 'rect', material: 'earth', x: 0, y: 600, w: 2560, h: 120 },
    {
      kind: 'poly',
      material: 'stone',
      points: [
        [480, 130],
        [700, 110],
        [1300, 100],
        [1900, 140],
        [1950, 180],
        [1950, 290],
        [1700, 300],
        [1400, 260],
        [1100, 300],
        [800, 280],
        [480, 250],
      ],
    },
    // Broken walls of the ruin.
    { kind: 'rect', material: 'stone', x: 2420, y: 380, w: 40, h: 220 },
    { kind: 'rect', material: 'stone', x: 900, y: 545, w: 110, h: 55 },
    { kind: 'rect', material: 'stone', x: 1550, y: 545, w: 110, h: 55 },
    { kind: 'rect', material: 'stone', x: 2250, y: 545, w: 110, h: 55 },
    BEDROCK,
  ],
  water: [],
  skeletons: [
    { x: 760, fromY: 320, moves: true },
    { x: 955, fromY: 320 },
    { x: 1150, fromY: 320 },
    { x: 1450, fromY: 320, moves: true },
    { x: 1605, fromY: 320 },
    { x: 1800, fromY: 320 },
    { x: 2305, fromY: 330 },
    { x: 2460, fromY: 330, moves: true },
  ],
  barrels: [{ x: 1220, fromY: 320 }, { x: 1900, fromY: 320 }, { x: 2150, fromY: 330 }],
};

export const LEVELS: readonly LevelDef[] = [EDUSTA, VALLIHAUTA, PIHA, MUURIT, HOLVI];
