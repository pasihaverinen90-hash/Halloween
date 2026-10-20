/**
 * Whose turn it is (in memory only). After a reload nobody's turn is active:
 * the start screen shows and Pasi continues an unfinished turn from
 * correction mode.
 */
export const session: { playerId: string | null } = { playerId: null };
