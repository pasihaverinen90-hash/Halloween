import { expect, test } from '@playwright/test';
import { expectNoRuntimeErrors, hangman, openGame, PASSWORD, press, savedEvening, sceneState, typeText, waitForScene, waitForState } from './helpers';

const EVENING = savedEvening([
  { id: 'a', name: 'Liisa', games: hangman(950), finished: true },
  { id: 'b', name: 'Matti', games: hangman(875), finished: true },
  { id: 'c', name: 'Äijö', games: hangman(875), finished: true },
  { id: 'd', name: 'Öhkö', games: hangman(700), finished: true },
  { id: 'e', name: 'Emma' },
]);

async function openResults(page: import('@playwright/test').Page): Promise<void> {
  // The start menu remembers its selection; move to "Tulokset" (index 1).
  if ((await sceneState(page, 'Start')).selected !== 1) await press(page, 'ArrowDown');
  expect((await sceneState(page, 'Start')).selected).toBe(1);
  await press(page, 'Enter');
  await waitForScene(page, 'Password');
  await typeText(page, PASSWORD);
  await press(page, 'Enter');
  await waitForScene(page, 'ResultsMenu');
}

test('tulokset aukeavat vain oikealla salasanalla', async ({ page }) => {
  await openGame(page, EVENING);
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await waitForScene(page, 'Password');
  await typeText(page, 'pasi1234');
  await press(page, 'Enter', 500);
  expect((await sceneState(page, 'Password')).error).toMatch(/Väärä salasana/);
  await press(page, 'Escape');
  await waitForScene(page, 'Start');
  expect(await page.evaluate(() => window.__peli!.activeScenes())).toEqual(['Start']);
  await openResults(page);
  await expectNoRuntimeErrors(page);
});

test('palkintojenjako paljastaa sijat yksi kerrallaan ja jakaa tasapisteet', async ({ page }) => {
  await openGame(page, EVENING);
  await openResults(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Podium');
  const intro = await sceneState(page, 'Podium');
  expect(intro.step).toBe('intro');
  // 950 → 1., 875 + 875 → jaettu 2., ei 3. sijaa (seuraava on 4.)
  expect(intro.places).toEqual([
    [{ name: 'Liisa', total: 950 }],
    [
      { name: 'Matti', total: 875 },
      { name: 'Äijö', total: 875 },
    ],
    [],
  ]);
  await press(page, 'Enter', 100);
  expect(await sceneState(page, 'Podium')).toMatchObject({ step: 'reveal2', busy: true });
  await press(page, 'Enter', 100); // ignored during the drumroll
  await waitForState(page, 'Podium', (s) => !s.busy, 120_000);
  expect((await sceneState(page, 'Podium')).step).toBe('reveal2');
  await press(page, 'Enter');
  await waitForState(page, 'Podium', (s) => s.step === 'reveal1' && !s.busy, 120_000);
  await press(page, 'Enter');
  expect((await sceneState(page, 'Podium')).step).toBe('standings');
  await press(page, 'Enter');
  await waitForScene(page, 'ResultsMenu');
  await expectNoRuntimeErrors(page);
});

test('tulokset pelin ja pelaajan mukaan', async ({ page }) => {
  await openGame(page, EVENING);
  await openResults(page);
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await waitForScene(page, 'GameResults');
  expect((await sceneState(page, 'GameResults')).rows).toEqual([
    { name: 'Liisa', score: 950, rank: 1, status: 'finished' },
    { name: 'Matti', score: 875, rank: 2, status: 'finished' },
    { name: 'Äijö', score: 875, rank: 2, status: 'finished' },
    { name: 'Öhkö', score: 700, rank: 4, status: 'finished' },
  ]);
  await press(page, 'Escape');
  await waitForScene(page, 'ResultsMenu');
  await press(page, 'ArrowDown');
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await waitForScene(page, 'PlayerResults');
  // Aakkosjärjestys: Emma, Liisa, Matti, Äijö, Öhkö
  expect(await sceneState(page, 'PlayerResults')).toEqual({ player: 'Emma', total: 0 });
  await press(page, 'ArrowRight');
  expect(await sceneState(page, 'PlayerResults')).toEqual({ player: 'Liisa', total: 950 });
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  expect(await sceneState(page, 'PlayerResults')).toEqual({ player: 'Öhkö', total: 700 });
  await press(page, 'Escape');
  await waitForScene(page, 'ResultsMenu');
  await press(page, 'Escape');
  await waitForScene(page, 'Start');
  await expectNoRuntimeErrors(page);
});
