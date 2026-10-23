import { expect, test } from '@playwright/test';
import { createPlayer, expectNoRuntimeErrors, openGame, press, savedData, sceneState, waitForScene } from './helpers';

/*
 * The three-attempt flow of action games, tested with an invisible test-only
 * action game (src/testGame.ts) until the first real action game exists.
 */

async function setScore(page: import('@playwright/test').Page, score: number): Promise<void> {
  await page.evaluate((s) => (window.__peliTestScore = s), score);
}

test('toimintapelissä on kolme yritystä putkeen ja paras jää voimaan', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__peli!.addTestActionGame());
  // The test game is the tournament's first game
  await createPlayer(page, 'Yrittäjä');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('testipeli');
  await press(page, 'Enter');

  // Yritys 1/3
  await waitForScene(page, 'AttemptIntro');
  expect(await sceneState(page, 'AttemptIntro')).toEqual({ attempt: 1, total: 3, best: null });
  await setScore(page, 400);
  await press(page, 'Enter');
  await waitForScene(page, 'Testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptResult');
  expect(await sceneState(page, 'AttemptResult')).toMatchObject({ attempt: 1, score: 400, best: 400, isFinal: false });
  expect((await savedData(page)).players[0].games.testipeli).toMatchObject({ attempts: [400], finished: false });

  // Yritys 2/3: Enter pohjassa ei saa ohittaa mitään
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  expect(await sceneState(page, 'AttemptIntro')).toEqual({ attempt: 2, total: 3, best: 400 });
  await setScore(page, 250);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.down('Enter'); // auto-repeat
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await waitForScene(page, 'Testipeli');
  expect(await sceneState(page, 'Testipeli')).toEqual({ finished: false });
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptResult');
  expect(await sceneState(page, 'AttemptResult')).toMatchObject({ attempt: 2, score: 250, best: 400, isFinal: false });

  // Yritys 3/3
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  expect(await sceneState(page, 'AttemptIntro')).toEqual({ attempt: 3, total: 3, best: 400 });
  await setScore(page, 900);
  await press(page, 'Enter');
  await waitForScene(page, 'Testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptResult');
  expect(await sceneState(page, 'AttemptResult')).toMatchObject({ attempt: 3, score: 900, best: 900, isFinal: true });
  expect((await savedData(page)).players[0].games.testipeli).toMatchObject({ attempts: [400, 250, 900], finished: true });

  // Turnaus jatkuu seuraavaan peliin (Pasi 23.10.), eikä pelattuun peliin pääse takaisin
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('arvoitukset');
  await press(page, 'Escape', 500);
  expect(await page.evaluate(() => window.__peli!.activeScenes())).toContain('Instructions');
  await expectNoRuntimeErrors(page);
});

test('keskeytynyt toimintapeli jatkuu seuraavasta yrityksestä', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__peli!.addTestActionGame());
  await createPlayer(page, 'Katkos');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  await setScore(page, 500);
  await press(page, 'Enter');
  await waitForScene(page, 'Testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptResult');
  // Kesken toista yritystä vuoro jatkuu korjaustilan kautta (peli "jumittui")
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Testipeli');
  await page.keyboard.press('Control+Shift+KeyK');
  await waitForScene(page, 'Password');
  await page.keyboard.type('Pasi1234');
  await press(page, 'Enter');
  await waitForScene(page, 'Correction');
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await press(page, 'Enter'); // the only unfinished player
  await waitForScene(page, 'Instructions');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  expect(await sceneState(page, 'AttemptIntro')).toEqual({ attempt: 2, total: 3, best: 500 });
  await expectNoRuntimeErrors(page);
});
