import type Phaser from 'phaser';
import { getDb } from '../core/db';
import { gameStatus } from '../core/scores';
import { session } from '../core/session';
import { GAMES } from '../games/registry';
import { SCENES } from './keys';
import { switchTo } from './nav';

/**
 * Pasi 23.10.: the tournament plays its games one after another in a fixed
 * order. Go to the current player's next unplayed game, or to the thanks
 * screen when every game is played.
 */
export function continueTournament(from: Phaser.Scene): void {
  const player = session.playerId ? getDb().getPlayer(session.playerId) : undefined;
  if (!player) {
    switchTo(from, SCENES.Start);
    return;
  }
  const next = GAMES.find((game) => gameStatus(player.games[game.id]) !== 'finished');
  if (next) switchTo(from, SCENES.Instructions, { gameId: next.id });
  else switchTo(from, SCENES.Thanks);
}
