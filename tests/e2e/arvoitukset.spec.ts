import { expect, test, type Page } from '@playwright/test';
import {
  answerRiddle,
  createPlayer,
  expectNoRuntimeErrors,
  openGame,
  press,
  savedData,
  sceneState,
  typeText,
  unlock,
  waitForScene,
  waitForState,
} from './helpers';

async function startRiddles(page: Page, name: string): Promise<void> {
  await openGame(page);
  // Pasi 23.10.: the tournament starts with the riddles
  await createPlayer(page, name);
  expect((await sceneState(page, 'Instructions')).gameId).toBe('arvoitukset');
  await press(page, 'Enter');
  await waitForScene(page, 'Arvoitukset');
}

async function waitRiddle(page: Page, index: number): Promise<any> {
  await waitForState(page, 'Arvoitukset', (s) => s.index === index && s.phase === 'answering');
  return sceneState(page, 'Arvoitukset');
}

test('arvoitukset: pisteet, väärät vastaukset, ei taukoa ja aikaraja', async ({ page }) => {
  await startRiddles(page, 'Arvaaja');
  let total = 0;

  // 1: oikea vastaus nopeasti → täydet tai lähes täydet pisteet (täydet 3 sekunnin sisällä)
  expect((await waitRiddle(page, 0)).kind).toBe('monivalinta');
  await answerRiddle(page, 'correct');
  let state = await sceneState(page, 'Arvoitukset');
  expect(state.outcome).toBe('correct');
  expect(state.total).toBeGreaterThanOrEqual(60);
  expect(state.total).toBeLessThanOrEqual(100);
  total = state.total;
  await press(page, 'Enter');

  // 2: väärä monivalinta → 0
  expect((await waitRiddle(page, 1)).kind).toBe('monivalinta');
  await answerRiddle(page, 'wrong');
  state = await sceneState(page, 'Arvoitukset');
  expect(state).toMatchObject({ outcome: 'wrong', total });
  await press(page, 'Enter');

  // 3: avoin, ensin väärin (−20) ja sitten oikein
  expect((await waitRiddle(page, 2)).kind).toBe('avoin');
  await answerRiddle(page, 'wrong');
  state = await sceneState(page, 'Arvoitukset');
  expect(state).toMatchObject({ outcome: 'correct', wrong: 1 });
  expect(state.total - total).toBeGreaterThanOrEqual(30);
  expect(state.total - total).toBeLessThanOrEqual(80);
  total = state.total;
  await press(page, 'Enter');

  // 4: Esc ei pysäytä aikaa (Pasi 23.10.), ja aika loppuu → 0
  await waitRiddle(page, 3);
  await press(page, 'Escape', 300);
  expect(await sceneState(page, 'GameHost')).toMatchObject({ state: 'playing' });
  const afterEsc = (await sceneState(page, 'Arvoitukset')).elapsedMs;
  await waitForState(page, 'Arvoitukset', (s) => s.elapsedMs > afterEsc || s.phase === 'done');
  await typeText(page, 'en tiedä'); // not submitted
  await waitForState(page, 'Arvoitukset', (s) => s.phase === 'done', 180_000);
  state = await sceneState(page, 'Arvoitukset');
  expect(state).toMatchObject({ outcome: 'timeout', total });
  await press(page, 'Enter');

  // 5–10 oikein
  for (let index = 4; index < 10; index++) {
    await waitRiddle(page, index);
    await answerRiddle(page, 'correct');
    await press(page, 'Enter');
  }
  await waitForScene(page, 'AttemptResult');
  const result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'puzzle', isFinal: true });
  expect(result.score).toBeGreaterThan(total + 6 * 30 - 1);
  expect((await savedData(page)).players[0].games.arvoitukset).toMatchObject({ attempts: [result.score], finished: true });
  await expectNoRuntimeErrors(page);
});

test('kesken jäänyt arvoituskierros jatkuu samasta arvoituksesta', async ({ page }) => {
  await startRiddles(page, 'Katkonainen');
  for (const index of [0, 1]) {
    await waitRiddle(page, index);
    await answerRiddle(page, 'correct');
    await press(page, 'Enter');
  }
  await waitRiddle(page, 2);
  await typeText(page, 'ei tämä');
  await press(page, 'Enter', 400);
  const before = await sceneState(page, 'Arvoitukset');
  expect(before).toMatchObject({ index: 2, wrong: 1 });
  expect(before.scores).toHaveLength(2);

  // Pasi's password opens the game again, and it offers to continue the unfinished turn.
  await page.reload();
  await unlock(page, true);
  expect(await sceneState(page, 'Instructions')).toMatchObject({ gameId: 'arvoitukset', resumes: true });
  await press(page, 'Enter');
  await waitForScene(page, 'Arvoitukset');
  const after = await sceneState(page, 'Arvoitukset');
  expect(after).toMatchObject({ index: 2, wrong: 1, scores: before.scores, phase: 'answering' });
  expect(after.elapsedMs).toBeGreaterThanOrEqual(Math.floor(before.elapsedMs / 1000) * 1000 - 1);
  await expectNoRuntimeErrors(page);
});
