/**
 * All tunable numbers in one place: scoring formulas, time limits and
 * difficulty settings. Adjust these after play-testing; nothing else in the
 * code should hard-code such values.
 */
export const CONFIG = {
  /** Every game awards 0..maxScore points. A perfect run gives exactly this. */
  maxScore: 1000,

  attempts: {
    /** Action games: this many attempts in a row, the best one counts. */
    action: 3,
    /** Puzzle games (hangman, picture riddles, crossword): one round. */
    puzzle: 1,
  },

  player: {
    /** Longest allowed player name (characters). */
    nameMaxLength: 16,
  },

  security: {
    /**
     * Iterated SHA-256 of salt + Pasi's password (see core/password.ts).
     * The plain password is deliberately not stored anywhere in the code.
     */
    passwordSalt: 'e5b862c359942f6666efe3b9',
    passwordIterations: 20000,
    passwordHash: '2d20322b33a729ab2f51c1d8c226a07710b52718944b615275b1bf45d697b29f',
  },

  storage: {
    /** localStorage key for all results. Changing it starts from empty results. */
    key: 'halloween-peli-ilta:v1',
  },

  audio: {
    /** Master volume of generated sound effects (0..1). Keep low so Pasi's music stays audible. */
    masterVolume: 0.22,
  },

  ui: {
    /** Confirm keys are ignored this long after a screen opens, so a held/double Enter cannot skip it. */
    inputGuardMs: 250,
  },

  /** 1. Hirsipuu */
  hirsipuu: {
    /** Words or phrases per round; content/hirsipuu.txt must contain exactly this many. */
    wordsPerRound: 5,
    /** Points for a solved word with no wrong letters. */
    pointsPerWord: 200,
    /** Each wrong letter reduces the word's points by this much. */
    penaltyPerWrongLetter: 25,
    /** The word fails on this many wrong letters (one skeleton part per wrong letter). */
    maxWrongLetters: 8,
  },

  /** 2. Kuva-arvoitukset */
  arvoitukset: {
    /** Riddles per round; content/kuva-arvoitukset.txt must contain exactly this many. */
    riddlesPerRound: 10,
    /** How many of them are multiple choice (the rest are open answers). CLAUDE.md: half. */
    multipleChoiceCount: 5,
    /** Seconds per riddle. */
    secondsPerRiddle: 20,
    /** Points for a correct answer at once … */
    maxPoints: 100,
    /** … falling evenly to this at the end of the time. */
    minPoints: 50,
    /** Each wrong answer to an open riddle reduces the points by this much (not below 0). */
    wrongAnswerPenalty: 20,
    /** The ticking sound plays during the last seconds. */
    tickFromSecondsLeft: 5,
  },

  /** 3. Lentopeli. Distances are in pixels of the 1280-wide game space. */
  lentopeli: {
    /** The finish is this many seconds of flight away for a flight without crashes. */
    goalSeconds: 90,
    /** The first seconds are easy: slower speed, wide openings and calmer obstacles. */
    easySeconds: 20,
    /** Flying speed at the start (px/s) … */
    startSpeed: 270,
    /** … rising to this at the hardest. */
    maxSpeed: 460,
    /** Distance after the easy part over which speed, openings and obstacles reach their hardest. */
    rampDistance: 20000,
    /** Speed builds up again after a crash (px/s²). */
    acceleration: 260,
    /** Gravity (px/s²), the upward kick of one Space press (px/s) and the fastest fall (px/s). */
    gravity: 1500,
    flapVelocity: -470,
    maxFallSpeed: 650,
    /** Distance between obstacles: easy → hard. */
    gateSpacingEasy: 520,
    gateSpacingHard: 350,
    /** Height of the opening the witch must fit through: easy → hard. */
    gapEasy: 240,
    gapHard: 165,
    /** How far the route may move up or down from one obstacle to the next (px): easy → hard. Never more than the witch can fly. */
    routeSwingEasy: 150,
    routeSwingHard: 320,
    /**
     * How often each obstacle appears (relative weights), easy → hard:
     * gate = hanging cage and an inquisitor below, tower = only an inquisitor (fly over),
     * hanging = only a cage (fly under), bats = a flock of bats flying towards the witch (over or under).
     */
    obstacleMixEasy: { gate: 6, tower: 2, hanging: 2, bats: 2 },
    obstacleMixHard: { gate: 4, tower: 1, hanging: 1, bats: 4 },
    /** Bats fly towards the witch at this share of her speed. */
    batSpeedShare: 0.6,
    /** A black cat waits about every n seconds of flight, in an awkward spot (none near the finish). */
    catEverySeconds: 22,
    /** Cats are extra lives; at most this many. */
    maxCats: 3,
    /** After losing a cat the witch cannot be hit for this long (and until she is clear of the obstacle). */
    invulnerableSeconds: 1.5,
  },
} as const;
