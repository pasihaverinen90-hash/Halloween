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

  /**
   * Freeplay (Pasi 23.10.): opened with Pasi's password, every game as often as
   * you like, and a top 10 list per game that everyone may see. Separate from
   * the tournament's results.
   */
  freeplay: {
    /** localStorage key of the freeplay lists. Changing it starts from empty lists. */
    key: 'halloween-peli-ilta:freeplay:v1',
    /** A game's 0..1000 is shown as 0..10 000 in freeplay, with one more digit of precision. */
    scale: 10,
    /** Length of each game's top list; a name is asked only for a result that gets on it. */
    topSize: 10,
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
    /**
     * Riddles of the tournament; content/kuva-arvoitukset.txt must contain exactly this many
     * (plus any "vain: freeplay" ones). Pasi 23.10.: 11 (8 films + 3 words), all open.
     */
    riddlesPerRound: 11,
    /** Seconds per riddle (Pasi 20.10.: 12, shorter than before). */
    secondsPerRiddle: 12,
    /** Points for a correct answer within the first fullPointsSeconds … */
    maxPoints: 100,
    fullPointsSeconds: 3,
    /** … then falling quickly and evenly to this at the end of the time (Pasi 20.10.). */
    minPoints: 0,
    /** Each wrong answer to an open riddle reduces the points by this much (not below 0). */
    wrongAnswerPenalty: 20,
    /** The ticking sound plays during the last seconds. */
    tickFromSecondsLeft: 5,
  },

  /** 3. Lentopeli. Distances are in pixels of the 1280-wide game space. */
  lentopeli: {
    /** Pasi 23.10.: two attempts (the evening was too long). */
    attempts: 2,
    /** The finish is this many seconds of flight away for a flight without crashes (Pasi 23.10.: 60, before 90). */
    goalSeconds: 60,
    /** The first seconds are easy: slower speed, wide openings and calmer obstacles. */
    easySeconds: 20,
    /** Flying speed at the start (px/s) … */
    startSpeed: 270,
    /** … rising to this at the hardest. */
    maxSpeed: 460,
    /** Distance after the easy part over which speed, openings and obstacles reach their hardest. */
    rampDistance: 20000,
    /**
     * Freeplay's endless flight (Pasi 23.10.): no finish, and after the hardest
     * point the speed keeps growing by this much (px/s) per pixel flown, up to
     * endlessMaxSpeed. The course is endlessSeconds of flight long.
     */
    endlessSpeedGrowth: 0.004,
    endlessMaxSpeed: 900,
    endlessSeconds: 420,
    /** Pasi 24.10.: the endless flight's points grow at this share of the tournament scale (the finish distance is worth 1000 × this). */
    endlessPointsShare: 1 / 3,
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
    /** A wrong word takes this many seconds off the remaining time. */
    wrongWordPenaltySeconds: 5,
    /** A hint reveals this many missing letters, chosen at random from the whole crossword, and costs this many seconds (Pasi 21.10.). */
    revealCount: 3,
    revealPenaltySeconds: 10,
    /** The second Enter must come within this many seconds of the first to give a hint (Pasi 20.10.: Enter twice). */
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
    /** Pasi 23.10.: two attempts (the evening was too long). */
    attempts: 2,
    /** The Devil arrives after this much play (Pasi 23.10.: 2 minutes, before 3). */
    bossAfterSeconds: 120,
    /** No new enemies after this, so the last ones can still be shot before the Devil. */
    lastSpawnSeconds: 108,
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
    lifeDropTimes: [33, 66, 99],
    /** Holy objects appear at these moments, in turn an ark (weapon) and a grail (guardian orb). */
    specialTimes: [14, 27, 43, 60, 77, 93, 106],
    /** Devil's health in basic shots, and seconds between its attacks (calm → furious). It grows angrier at 2/3 and 1/3 health. */
    bossHealth: 462,
    bossAttackGapStart: 1.5,
    bossAttackGapEnd: 0.75,
    /** Graveyard scrolling speed (px/s). */
    scrollSpeed: 60,
  },

  /**
   * 6. Tasohyppely. Distances in the 1280×720 game space (one tile = 48), times in seconds of play.
   * Rules: CLAUDE.md, game 6, and Pasi's choices 21.10. (EDISTYMINEN.md). The levels themselves are in src/games/tasohyppely/levels.ts.
   */
  tasohyppely: {
    /** Points (Pasi 21.10.): distance over the three levels (equal share per level), candles (share of all) and the head witch (share of her health taken). */
    distancePoints: 600,
    candlePoints: 100,
    bossPoints: 300,
    /** Health at the start of every level (Pasi 21.10.: 5, not 3). Pick-ups only heal, never above this. */
    maxHealth: 5,
    /** A hit by an enemy, a projectile or a blade, and a fall into a pit, each take this much. */
    hitDamage: 1,
    /** A heart pick-up heals this much. */
    heartHeal: 0.5,
    /** After a hit (or a fall into a pit) the hunter cannot be hit for this long. */
    invulnerableSeconds: 1.5,
    /** Small knockback after a hit (never into a pit), and how long the controls are off meanwhile. */
    knockbackSpeed: 230,
    knockbackLift: 330,
    knockbackSeconds: 0.25,

    /** Running speed and how quickly it is reached on the ground and in the air. */
    runSpeed: 270,
    groundAccel: 2600,
    airAccel: 1700,
    /** Jumping: gravity, the take-off speed (about 3 tiles high), the double jump (about 2 tiles more) and the fastest fall. */
    gravity: 2400,
    jumpSpeed: 830,
    doubleJumpSpeed: 700,
    maxFallSpeed: 960,
    /** Letting go of the jump key early cuts the rise to this share (a short hop). */
    jumpCutFactor: 0.45,
    /** A jump still works this long after running off a ledge, and a press this early before landing is remembered. */
    coyoteSeconds: 0.1,
    jumpBufferSeconds: 0.12,

    /** Whip levels (Pasi 21.10.: 5): reach in game units and damage per hit. Leather → spiked chain → silver → flaming → lightning. */
    whipReach: [100, 120, 140, 160, 180],
    whipDamage: [1, 1.25, 1.5, 1.75, 2],
    /** Whip timing: wind-up, the moment it hurts, recovery. */
    whipWindupSeconds: 0.09,
    whipActiveSeconds: 0.13,
    whipRecoverSeconds: 0.12,

    /** Enemies drop an item by chance (Pasi 21.10.: about every tenth). */
    dropChance: 0.1,
    /** Shares of random drops: a whip upgrade (while the whip can still improve) and daggers (Pasi 22.10.: half); the rest are half hearts. */
    whipDropShare: 0.25,
    daggerDropShare: 0.5,
    /** Throwing daggers (Pasi 21.10.: C throws, a limited number; 22.10.: 10 at the start): at the start, per pick-up and at most. */
    daggersStart: 10,
    daggersPerPickup: 5,
    daggersMax: 15,
    /** Dagger speed, seconds between throws, and damage (like the basic whip). */
    daggerSpeed: 650,
    daggerCooldown: 0.3,
    daggerDamage: 1,
    /** If the whip has not improved in a level by this share of the level, the next enemy defeated drops an upgrade (Pasi 21.10.). */
    whipGuaranteeAt: 0.5,

    /** Pasi 23.10.: 3 attempts (before 5); after a fall the next attempt continues from the start of the same level. */
    attempts: 3,
    /** Every candle gives this many coins (Pasi 22.10.), spent in the shop before levels 2 and 3. */
    coinsPerCandle: 1,
    /** Shop prices (coins) and limits (Pasi 22.10.). */
    shop: {
      daggerPrice: 3,
      daggerAmount: 5,
      /** An extra heart at the start of every level. */
      heartPrice: 6,
      extraHeartsMax: 3,
      /** The next whip level. */
      whipPrice: 8,
      /** Sharpening: whip and daggers do this much more damage per purchase. */
      sharpenPrice: 6,
      sharpenMax: 4,
      sharpenBonus: 0.25,
    },

    /** Crumbling floor: shakes this long after it is stepped on, then stays gone this long. */
    crumbleSeconds: 0.55,
    crumbleRespawnSeconds: 4,
    /** Moving platforms (units per second). */
    moverSpeed: 95,
    /** Swinging blades: swing angle each way (degrees) and the time of one full swing there and back. */
    pendulumAngle: 62,
    pendulumSeconds: 2.6,

    /** Head witch: health in hits of the basic whip; she grows angrier at 2/3 and 1/3 of it. */
    bossHealth: 30,
    /** Seconds between her attacks: calm → furious. */
    bossAttackGapStart: 2.2,
    bossAttackGapEnd: 1.3,
    /** After a whip hit she cannot be hit again for this long (one swing = one hit). */
    bossHitCooldown: 0.35,
  },

  /**
   * 7. Kurpitsalinko. Distances in game units (the level is 1920 × 720), times in seconds.
   * Rules: CLAUDE.md, game 7, and Pasi's choices 22.10. (EDISTYMINEN.md). The levels are in src/games/kurpitsalinko/levels.ts.
   */
  kurpitsalinko: {
    /** Pasi 23.10.: one attempt (before 2; the evening was too long). */
    attempts: 1,
    /** Pasi 22.10.: levels about two screens wide, with hills, valleys and obstacles. */
    levelWidth: 2560,
    levelHeight: 720,
    /** Falling speed gain of pumpkins, skeletons and barrels. */
    gravity: 900,
    /** Launch speed at no and full power. */
    minSpeed: 260,
    maxSpeed: 1520,
    /** Pasi 22.10.: the power swings up and down while Space is held; one full swing up and down takes this long. */
    powerSwingSeconds: 2.2,
    /** Aim angle limits (degrees above the horizon), and how fast ↑↓ and ←→ (fine) turn it. */
    angleMin: -10,
    angleMax: 85,
    angleSpeed: 50,
    fineAngleSpeed: 10,
    startAngle: 40,
    /** Blast radius of a normal pumpkin (Pasi 22.10.: about a skeleton's height), a big bomb and a cluster pumpkin's bomblet. */
    blastRadius: 52,
    bombRadius: 110,
    bombletRadius: 34,
    bombletCount: 5,
    /**
     * Homing pumpkin: flies freely until it starts to come down (Pasi 23.10.), then turns hard (radians per
     * second) towards the nearest living skeleton within this distance (Pasi 23.10.: more aggressive, anywhere in the level).
     */
    homingRange: 4000,
    homingTurn: 7,
    homingSpeed: 560,
    homingSeconds: 7,
    /** Pumpkin beam: width of the burnt corridor, and how long it glows. */
    beamWidth: 26,
    beamSeconds: 0.7,
    /**
     * Points per level (Pasi 22.10.; 23.10. more forgiving): 200 when the shots are at most skeletons + 3, then less in steps.
     * Each step: extra shots (beyond the skeletons) up to `extra` give `points`; more than all of them gives `fewest`.
     */
    levelPoints: 200,
    pointSteps: [
      // Pasi 23.10.: a little more forgiving, two more shots on every step.
      { extra: 3, points: 200 },
      { extra: 7, points: 150 },
      { extra: 12, points: 100 },
      { extra: 17, points: 50 },
    ],
    fewestPoints: 25,
    /** Camera while aiming and while a pumpkin flies, and how fast A and D move it while aiming. */
    aimZoom: 0.75,
    flightZoom: 0.85,
    panSpeed: 1100,
    /** A skeleton falling more than this breaks (Pasi 22.10.). */
    fallBreak: 110,
    /** Moving skeletons walk this far after each shot (from level 3, Pasi 22.10.). */
    walkDistance: 56,
    /**
     * Special weapons for the whole attempt (Pasi 23.10.): these at the start, and this many more at the
     * start of every following level. More come from crates in the levels.
     */
    startAmmo: { cluster: 3, homing: 2, beam: 1, bomb: 3 },
    ammoPerLevel: { cluster: 1, homing: 0, beam: 0, bomb: 0 },
    /** A floating −1 or −3 is collected by any projectile passing this close (Pasi 23.10.). */
    tokenRadius: 30,
    /** Wood burns away in a larger circle than earth and stone. */
    woodBlastFactor: 1.5,
    /** Barrels explode with this radius, a moment after they are hit. */
    barrelRadius: 80,
    barrelDelay: 0.18,
  },
} as const;
