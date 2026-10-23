import { expect, test, type Page } from '@playwright/test';
import { createPlayer, expectNoRuntimeErrors, openGame, press, savedData, sceneState, selectGame, waitForScene, waitForState } from './helpers';

/** Move the witch along the course (test helper of the scene). */
async function place(page: Page, distance: number, y: number): Promise<void> {
  await page.evaluate(([d, h]) => (window.__peli!.game as any).scene.getScene('Lentopeli').debugPlace(d, h), [distance, y]);
}

interface Column {
  index: number;
  x: number;
  pattern: string;
  blocks: Array<{ kind: string; top: number; bottom: number }>;
  catY: number | null;
}

async function course(page: Page): Promise<Column[]> {
  return page.evaluate(() => (window.__peli!.game as any).scene.getScene('Lentopeli').course);
}

async function startAttempt(page: Page): Promise<void> {
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Lentopeli');
  expect((await sceneState(page, 'Lentopeli')).phase).toBe('ready');
}

test('lentopeli: törmäys, kissa, maali ja loput yritykset väliin', async ({ page }) => {
  await openGame(page);
  await createPlayer(page, 'Lentäjä');
  await selectGame(page, 'lentopeli');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');

  // Yritys 1: noita lähtee, liukuu maata pitkin ja törmää ensimmäiseen inkvisiittoriin ilman kissaa
  await startAttempt(page);
  await press(page, 'Space');
  expect((await sceneState(page, 'Lentopeli')).phase).toBe('flying');
  await waitForScene(page, 'AttemptResult', 180_000);
  let result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'action', attempt: 1, total: 2, isFinal: false });
  expect(result.score).toBeGreaterThan(10);
  expect(result.score).toBeLessThan(60);
  await press(page, 'Enter');

  // Yritys 2: kissa lepakoiden vieressä kerätään, törmäys vie kissan ja vauhdin, mutta lento jatkuu
  await startAttempt(page);
  const columns = await course(page);
  const catColumn = columns.find((c) => c.catY !== null)!;
  expect(catColumn.pattern).toBe('bats');
  await place(page, catColumn.x - 4, catColumn.catY!);
  await waitForState(page, 'Lentopeli', (s) => s.cats === 1);
  const next = columns[catColumn.index + 1];
  const block = next.blocks[0];
  await place(page, next.x - 10, Math.min(620, Math.max(100, (block.top + block.bottom) / 2)));
  await waitForState(page, 'Lentopeli', (s) => s.cats === 0);
  expect(await sceneState(page, 'Lentopeli')).toMatchObject({ phase: 'flying', invulnerable: true });

  // … ja maaliin → 1000 pistettä, eikä kolmatta yritystä tarvita
  const goal = (await sceneState(page, 'Lentopeli')).goal;
  await place(page, goal - 250, 360);
  await waitForScene(page, 'AttemptResult', 180_000);
  result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ attempt: 2, total: 2, score: 1000, best: 1000, isFinal: true });
  const record = (await savedData(page)).players[0].games.lentopeli;
  expect(record.attempts).toHaveLength(2);
  expect(record.attempts[1]).toBe(1000);
  expect(record.finished).toBe(true);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles[2]).toEqual({ id: 'lentopeli', status: 'finished', score: 1000 });
  await expectNoRuntimeErrors(page);
});
