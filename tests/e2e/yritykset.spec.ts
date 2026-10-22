import { expect, test } from '@playwright/test';
import { createPlayer, expectNoRuntimeErrors, openGame, press, savedData, sceneState, selectGame, waitForScene } from './helpers';

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
  await createPlayer(page, 'Yrittäjä');
  expect((await sceneState(page, 'Menu')).tiles.map((t: { id: string }) => t.id)).toEqual(['hirsipuu', 'arvoitukset', 'lentopeli', 'raiskinta', 'ristikko', 'tasohyppely', 'kurpitsalinko', 'testipeli']);
  await selectGame(page, 'testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
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

  // Takaisin valikkoon: testipeli harmaana, hirsipuu yhä pelattavissa
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles).toEqual([
    { id: 'hirsipuu', status: 'unplayed', score: null },
    { id: 'arvoitukset', status: 'unplayed', score: null },
    { id: 'lentopeli', status: 'unplayed', score: null },
    { id: 'raiskinta', status: 'unplayed', score: null },
    { id: 'ristikko', status: 'unplayed', score: null },
    { id: 'tasohyppely', status: 'unplayed', score: null },
    { id: 'kurpitsalinko', status: 'unplayed', score: null },
    { id: 'testipeli', status: 'finished', score: 900 },
  ]);
  // Pelattua peliä ei voi valita uudelleen
  await selectGame(page, 'testipeli');
  await press(page, 'Enter', 500);
  expect(await page.evaluate(() => window.__peli!.activeScenes())).toContain('Menu');
  await expectNoRuntimeErrors(page);
});

test('keskeytynyt toimintapeli jatkuu seuraavasta yrityksestä', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__peli!.addTestActionGame());
  await createPlayer(page, 'Katkos');
  await selectGame(page, 'testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  await setScore(page, 500);
  await press(page, 'Enter');
  await waitForScene(page, 'Testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptResult');
  // Kesken toista yritystä palataan valikkoon korjaustilan kautta (peli "jumittui")
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
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles.find((t: { id: string }) => t.id === 'testipeli')).toEqual({ id: 'testipeli', status: 'inProgress', score: 500 });
  await selectGame(page, 'testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  expect(await sceneState(page, 'AttemptIntro')).toEqual({ attempt: 2, total: 3, best: 500 });
  await expectNoRuntimeErrors(page);
});
