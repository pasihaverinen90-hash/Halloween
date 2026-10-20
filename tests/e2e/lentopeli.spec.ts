import { expect, test, type Page } from '@playwright/test';
import { createPlayer, expectNoRuntimeErrors, openGame, press, savedData, sceneState, waitForScene, waitForState } from './helpers';

/** Move the witch along the course (test helper of the scene). */
async function place(page: Page, distance: number, y: number): Promise<void> {
  await page.evaluate(([d, h]) => (window.__peli!.game as any).scene.getScene('Lentopeli').debugPlace(d, h), [distance, y]);
}

async function course(page: Page): Promise<Array<{ x: number; gapTop: number; gapBottom: number; hasCat: boolean }>> {
  return page.evaluate(() => (window.__peli!.game as any).scene.getScene('Lentopeli').course);
}

async function startAttempt(page: Page): Promise<void> {
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Lentopeli');
  expect((await sceneState(page, 'Lentopeli')).phase).toBe('ready');
}

test('lentopeli: törmäys, kissat ja maali kolmessa yrityksessä', async ({ page }) => {
  await openGame(page);
  await createPlayer(page, 'Lentäjä');
  await press(page, 'ArrowRight');
  await press(page, 'ArrowRight');
  expect((await sceneState(page, 'Menu')).selected).toBe('lentopeli');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');

  // Yritys 1: noita lähtee, liukuu maata pitkin ja törmää ensimmäiseen inkvisiittoriin ilman kissaa
  await startAttempt(page);
  await press(page, 'Space');
  expect((await sceneState(page, 'Lentopeli')).phase).toBe('flying');
  await waitForScene(page, 'AttemptResult', 180_000);
  let result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'action', attempt: 1, total: 3, isFinal: false });
  expect(result.score).toBeGreaterThan(10);
  expect(result.score).toBeLessThan(60);
  await press(page, 'Enter');

  // Yritys 2: kissa kerätään, törmäys vie kissan ja vauhdin, mutta lento jatkuu
  await startAttempt(page);
  const gates = await course(page);
  const catGate = gates.find((g) => g.hasCat)!;
  await place(page, catGate.x - 4, (catGate.gapTop + catGate.gapBottom) / 2);
  await waitForState(page, 'Lentopeli', (s) => s.cats === 1);
  const next = gates[gates.indexOf(catGate) + 1];
  await place(page, next.x - 10, next.gapTop - 30);
  await waitForState(page, 'Lentopeli', (s) => s.cats === 0);
  expect(await sceneState(page, 'Lentopeli')).toMatchObject({ phase: 'flying', invulnerable: true });
  await waitForScene(page, 'AttemptResult', 180_000);
  result = await sceneState(page, 'AttemptResult');
  expect(result.attempt).toBe(2);
  await press(page, 'Enter');

  // Yritys 3: maaliin → 1000 pistettä
  await startAttempt(page);
  const goal = (await sceneState(page, 'Lentopeli')).goal;
  await place(page, goal - 250, 360);
  await waitForScene(page, 'AttemptResult', 180_000);
  result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ attempt: 3, score: 1000, best: 1000, isFinal: true });
  const record = (await savedData(page)).players[0].games.lentopeli;
  expect(record.attempts).toHaveLength(3);
  expect(record.attempts[2]).toBe(1000);
  expect(record.finished).toBe(true);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles[2]).toEqual({ id: 'lentopeli', status: 'finished', score: 1000 });
  await expectNoRuntimeErrors(page);
});
