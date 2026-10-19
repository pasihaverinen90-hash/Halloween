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
} as const;
