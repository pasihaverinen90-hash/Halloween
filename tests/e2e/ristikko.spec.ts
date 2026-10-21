import { expect, test, type Page } from '@playwright/test';
import {
  createPlayer,
  expectNoRuntimeErrors,
  openCorrection,
  openGame,
  press,
  savedData,
  sceneState,
  selectGame,
  typeText,
  waitForScene,
  waitForState,
} from './helpers';

/** Run code against the crossword scene (its state and the Crossword object). */
async function crossword<T>(page: Page, body: string): Promise<T> {
  return page.evaluate((b) => new Function('scene', 'x', b)(...(() => {
    const scene = (window.__peli!.game as any).scene.getScene('Ristikko');
    return [scene, scene.crossword];
  })()), body) as Promise<T>;
}

/** The letters still to type in the current word (locked cells are skipped when typing). */
async function openLetters(page: Page): Promise<string> {
  return crossword<string>(page, 'return x.cellsOf(x.currentWord()).filter((k) => !x.locked(k)).map((k) => x.solution.get(k)).join("")');
}

async function startCrossword(page: Page, name: string): Promise<void> {
  await openGame(page);
  await createPlayer(page, name);
  await selectGame(page, 'ristikko');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');
  await waitForScene(page, 'Ristikko', 60_000);
}

test('ristikko: oikea ja väärä sana, vihje, hiiri ja koko ristikon ratkaisu', async ({ page }) => {
  test.setTimeout(300_000);
  await startCrossword(page, 'Ristikoija');
  const start = await sceneState(page, 'Ristikko');
  expect(start).toMatchObject({ phase: 'playing', solved: 0, word: 0, filled: 0, prompt: false });
  expect(start.total).toBeGreaterThanOrEqual(16);

  // Ensimmäinen sana oikein → lukittuu, ja kohdistin siirtyy seuraavaan sanaan
  await typeText(page, (await openLetters(page)).toLocaleLowerCase('fi-FI'), 60);
  await waitForState(page, 'Ristikko', (s) => s.solved === 1);
  expect((await sceneState(page, 'Ristikko')).word).not.toBe(0);

  // Väärä sana: väärät kirjaimet poistuvat ja aikaa lähtee 5 sekuntia
  const wrongWord = (await sceneState(page, 'Ristikko')).word;
  const before = (await sceneState(page, 'Ristikko')).secondsLeft;
  await typeText(page, 'q'.repeat((await openLetters(page)).length), 60);
  await waitForState(page, 'Ristikko', (s) => s.secondsLeft <= before - 5);
  expect(await sceneState(page, 'Ristikko')).toMatchObject({ solved: 1, word: wrongWord });

  // Vihje: Enter kahdesti paljastaa 3 satunnaista puuttuvaa kirjainta (−10 s)
  await press(page, 'Enter', 300);
  expect((await sceneState(page, 'Ristikko')).prompt).toBe(true);
  const beforeReveal = (await sceneState(page, 'Ristikko')).secondsLeft;
  await press(page, 'Enter', 300);
  await waitForState(page, 'Ristikko', (s) => s.revealed === 3);
  expect((await sceneState(page, 'Ristikko')).secondsLeft).toBeLessThanOrEqual(beforeReveal - 10);

  // Hiirellä valitaan ruutu
  const target = await crossword<{ row: number; col: number; x: number; y: number }>(
    page,
    'const w = scene.layout.words[scene.layout.words.length - 1]; const p = scene.cellCenter(w.row, w.col); return { row: w.row, col: w.col, x: p.x, y: p.y };',
  );
  await page.mouse.click(target.x, target.y);
  await waitForState(page, 'Ristikko', (s) => s.row === target.row && s.col === target.col);

  // Loput sanat oikein
  const total = start.total as number;
  for (let i = 0; i < total; i++) {
    const solved = await crossword<boolean>(page, `return x.solved.has(${i})`);
    if (solved) continue;
    await crossword(page, `x.selectWord(${i}); scene.redraw();`);
    const letters = await openLetters(page);
    await typeText(page, letters.toLocaleLowerCase('fi-FI'), 40);
    await expect.poll(() => crossword<boolean>(page, `return x.solved.has(${i})`), { timeout: 30_000 }).toBe(true);
  }
  await waitForScene(page, 'AttemptResult', 60_000);
  const result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'puzzle', isFinal: true });
  expect(result.score).toBeGreaterThanOrEqual(600);
  expect(result.score).toBeLessThanOrEqual(1000);
  expect((await savedData(page)).players[0].games.ristikko).toMatchObject({ attempts: [result.score], finished: true, checkpoint: null });
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles[4]).toEqual({ id: 'ristikko', status: 'finished', score: result.score });
  await expectNoRuntimeErrors(page);
});

test('kesken jäänyt ristikko jatkuu samasta kohdasta sivun uudelleenlatauksen jälkeen', async ({ page }) => {
  test.setTimeout(240_000);
  await startCrossword(page, 'Katkoristikko');
  await typeText(page, (await openLetters(page)).toLocaleLowerCase('fi-FI'), 60);
  await waitForState(page, 'Ristikko', (s) => s.solved === 1);
  await typeText(page, (await openLetters(page)).slice(0, 1).toLocaleLowerCase('fi-FI'), 60);
  const before = await sceneState(page, 'Ristikko');
  await page.waitForTimeout(500);

  await page.reload();
  await waitForScene(page, 'Start');
  await openCorrection(page);
  for (let i = 0; i < 10 && (await sceneState(page, 'Correction')).action !== 'Jatka kesken jäänyttä vuoroa'; i++) await press(page, 'ArrowDown', 120);
  await press(page, 'Enter', 400);
  await press(page, 'Enter'); // the only unfinished player
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles[4]).toMatchObject({ id: 'ristikko', status: 'inProgress' });
  await selectGame(page, 'ristikko');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');
  await waitForScene(page, 'Ristikko', 60_000);
  const after = await sceneState(page, 'Ristikko');
  expect(after).toMatchObject({ solved: 1, filled: before.filled, row: before.row, col: before.col, dir: before.dir });
  expect(Math.abs(after.secondsLeft - before.secondsLeft)).toBeLessThan(30);
  await expectNoRuntimeErrors(page);
});
