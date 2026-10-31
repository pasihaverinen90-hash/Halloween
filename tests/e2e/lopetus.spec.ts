import { expect, test } from '@playwright/test';
import {
  answerRiddle,
  createPlayer,
  expectNoRuntimeErrors,
  openFreeplay,
  openGame,
  press,
  savedData,
  sceneState,
  startFreeplayGame,
  waitForScene,
  waitForState,
} from './helpers';

/*
 * Pasi 31.10.: Ctrl + Q ends a game at once. In the tournament the points of
 * that moment count and the next game starts; in freeplay it goes back to the menu.
 */

test('Ctrl + Q: turnauksessa pisteet jäävät voimaan ja seuraava peli alkaa', async ({ page }) => {
  test.setTimeout(240_000);
  await openGame(page);
  await createPlayer(page, 'Lopettaja');

  // A puzzle: one riddle answered, then Ctrl + Q
  await press(page, 'Enter');
  await waitForScene(page, 'Arvoitukset');
  await waitForState(page, 'Arvoitukset', (s) => s.phase === 'answering');
  await answerRiddle(page, 'correct');
  const riddle = (await sceneState(page, 'Arvoitukset')).total;
  expect(riddle).toBeGreaterThan(0);
  await page.keyboard.press('Control+KeyQ');
  await waitForScene(page, 'Instructions');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('lentopeli');
  expect((await savedData(page)).players[0].games.arvoitukset).toMatchObject({ finished: true, attempts: [riddle] });

  // An action game in the middle of its first attempt: the other attempt is skipped
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Lentopeli');
  await press(page, 'Space');
  await waitForState(page, 'Lentopeli', (s) => s.points > 0);
  await page.keyboard.press('Control+KeyQ');
  await waitForScene(page, 'Instructions');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('raiskinta');
  const flight = (await savedData(page)).players[0].games.lentopeli;
  expect(flight).toMatchObject({ finished: true });
  expect(flight.attempts).toHaveLength(1);
  expect(flight.attempts[0]).toBeGreaterThan(0);
  await expectNoRuntimeErrors(page);
});

test('Ctrl + Q: freeplayssä takaisin valikkoon ilman top-listaa', async ({ page }) => {
  await openGame(page);
  await openFreeplay(page);
  await startFreeplayGame(page, 'hirsipuu', 'Hirsipuu');
  await page.keyboard.press('Control+KeyQ');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles[0]).toEqual({ id: 'hirsipuu', record: null });
  await expectNoRuntimeErrors(page);
});
