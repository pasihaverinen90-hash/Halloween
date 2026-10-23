import { expect, test } from '@playwright/test';
import { activeScenes, expectNoRuntimeErrors, riddles, PASSWORD, press, savedEvening, sceneState, STORAGE_KEY, typeText, unlock, waitForScene } from './helpers';

/*
 * Pasi 21.10.: the game opens only with Pasi's password, every time the page
 * loads, so reloading gives no one a new round. An unfinished turn is offered.
 */

test('peli aukeaa vain salasanalla, eikä Esc ohita lukkoa', async ({ page }) => {
  await page.goto('./');
  await waitForScene(page, 'Password');
  expect(await sceneState(page, 'Password')).toMatchObject({ title: 'Avaa peli' });
  await press(page, 'Escape', 400);
  expect(await activeScenes(page)).toContain('Password');
  await typeText(page, 'väärä');
  await press(page, 'Enter', 400);
  expect((await sceneState(page, 'Password')).error).toMatch(/Väärä salasana/);
  expect(await activeScenes(page)).not.toContain('Start');
  await typeText(page, PASSWORD);
  await press(page, 'Enter');
  await waitForScene(page, 'Start');
  // Nothing of the lock is left running behind the start screen.
  expect(await activeScenes(page)).toEqual(['Start']);
  await expectNoRuntimeErrors(page);
});

test('kesken jäänyt vuoro: salasanan jälkeen sitä tarjotaan jatkettavaksi', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(savedEvening([{ id: 'p1', name: 'Kesken', games: riddles(500) }]))] as const,
  );
  await page.reload();
  await waitForScene(page, 'Password');
  await typeText(page, PASSWORD);
  await press(page, 'Enter');
  await waitForScene(page, 'Dialog');
  expect((await sceneState(page, 'Dialog')).message).toMatch(/Kesken/);
  await page.reload();
  // Pasi 23.10.: the turn continues straight from the next tournament game
  await unlock(page, true);
  expect((await sceneState(page, 'Instructions')).gameId).toBe('lentopeli');
  await expectNoRuntimeErrors(page);
});
