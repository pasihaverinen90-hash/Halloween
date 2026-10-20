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
    /**
     * JSON backup files: download on the thank-you screen and before importing or clearing,
     * and "Lataa varmuuskopio" / "Tuo varmuuskopio" in the correction mode.
     * Pasi 20.10.: turned off completely. Results are still saved in the browser, and CSV export stays.
     */
    jsonBackups: false,
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
    /** Seconds per riddle (Pasi 20.10.: 12, shorter than before). */
    secondsPerRiddle: 12,
    /** Points for a correct answer within the first fullPointsSeconds … */
    maxPoints: 100,
    fullPointsSeconds: 5,
    /** … then falling quickly and evenly to this at the end of the time (Pasi 20.10.). */
    minPoints: 0,
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

  /** 5. Ristikko. */
  ristikko: {
    /** The crossword is built from content/ristikko.txt, which has this many words (CLAUDE.md: over 15; Pasi 20.10.: 18). */
    minWords: 16,
    maxWords: 22,
    /** Word length in letters. */
    minLetters: 3,
    maxLetters: 13,
    /** The grid may be at most this many cells wide and high, so it fits the screen next to the clues. */
    maxCols: 22,
    maxRows: 16,
    /** Time for the whole crossword (CLAUDE.md: 10 minutes). */
    seconds: 600,
    /** A wrong word and each revealed letter take this many seconds off the remaining time. */
    wrongWordPenaltySeconds: 5,
    revealPenaltySeconds: 5,
    /** The second Enter must come within this many seconds of the first to reveal a letter (Pasi 20.10.: Enter twice). */
    revealConfirmSeconds: 3,
    /** Points: correct words as a share of all (60 %) and the remaining time (40 %). */
    wordPoints: 600,
    timePoints: 400,
    /** Full time points when the crossword is solved within this many seconds (Pasi 20.10.: 3 minutes), then evenly down to 0 at the end. */
    fullTimePointsWithinSeconds: 180,
  },

  /** 4. Räiskintä. Distances in pixels of the 1280×720 game space, times in seconds of play (pauses excluded). */
  raiskinta: {
    /** How big everything looks: under 1 shows the graveyard from further away (Pasi 20.10.: zoom out a little). */
    viewScale: 0.72,
    /** The Devil arrives after this much play (Pasi 20.10.: 3 minutes). */
    bossAfterSeconds: 180,
    /** No new enemies after this, so the last ones can still be shot before the Devil. */
    lastSpawnSeconds: 168,
    /** Length of the text before the Devil. */
    interludeSeconds: 5,
    /** Points: destroyed enemies (share of all), surviving until the Devil (share of the time) and defeating the Devil. */
    enemyPoints: 400,
    survivalPoints: 300,
    bossPoints: 300,
    /** The pope withstands this many hits. */
    maxHealth: 10,
    /** After a hit the pope cannot be hit for this long. */
    invulnerableSeconds: 1.5,
    /** Pope's speed (px/s); he moves sideways and up and down in the lower part of the screen. */
    popeSpeed: 560,
    /** Shots per second with the basic weapon; each weapon level adds a little. The rapid-fire boost doubles it. */
    fireRate: 4.5,
    fireRatePerLevel: 0.4,
    shotSpeed: 950,
    /** Weapon levels: 1 at the start, +1 for each ark of the covenant. */
    maxWeaponLevel: 5,
    /** Guardian orbs circling the pope: +1 for each holy grail, at most this many (Pasi 20.10.). */
    maxOrbs: 3,
    /** Holy water: thrown with Space, it hurts every enemy on screen and wipes out their bullets (Pasi 20.10.). */
    holyWaterStart: 3,
    holyWaterMax: 5,
    /** Damage to every enemy on screen (a reaper takes 8, everything else less) and to the Devil. */
    holyWaterDamage: 6,
    holyWaterBossDamage: 30,
    /** Seconds between enemy waves: at the start → at the end (Pasi 20.10.: many more enemies; this many is fine with the extra help). */
    waveGapStart: 2.5,
    waveGapEnd: 1.05,
    /** Enemy bullets (px/s) and how often a shooting enemy shoots (s): at the start → at the end. */
    enemyShotSpeedStart: 250,
    enemyShotSpeedEnd: 350,
    enemyShotGapStart: 2.4,
    enemyShotGapEnd: 1.3,
    /** Temporary boosts: a destroyed enemy drops one by chance (Pasi 20.10.), at most one per dropGapSeconds. */
    dropChance: 0.05,
    dropGapSeconds: 4,
    boostSeconds: 9,
    shieldSeconds: 7,
    /** A golden cross that restores one point of endurance drops from the first enemy destroyed after each of these moments (Pasi 20.10.). */
    lifeDropTimes: [50, 100, 150],
    /** Holy objects appear at these moments, in turn an ark (weapon) and a grail (guardian orb). */
    specialTimes: [20, 40, 65, 90, 115, 140, 160],
    /** Devil's health in basic shots, and seconds between its attacks (calm → furious). It grows angrier at 2/3 and 1/3 health. */
    bossHealth: 462,
    bossAttackGapStart: 1.5,
    bossAttackGapEnd: 0.75,
    /** Graveyard scrolling speed (px/s). */
    scrollSpeed: 60,
  },
} as const;
