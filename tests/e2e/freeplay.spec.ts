import { expect, test } from '@playwright/test';
import {
  activeScenes,
  expectNoRuntimeErrors,
  failHangmanWord,
  openFreeplay,
  openGame,
  PASSWORD,
  press,
  savedData,
  sceneState,
  selectGame,
  solveHangmanWord,
  startFreeplayGame,
  typeText,
  unlock,
  waitForScene,
  waitForState,
} from './helpers';

/*
 * Pasi 23.10.: freeplay opens with Pasi's password and stays open. Every game
 * may be played again and again; points are 0–10 000, and arcade style a name
 * is asked only for a result that gets on the game's top 10.
 */

const FREEPLAY_KEY = 'halloween-peli-ilta:freeplay:v1';

test('freeplay: salasana, hirsipuu, top 10 -lista nimen kanssa, ennätykset ja auki pysyminen', async ({ page }) => {
  test.setTimeout(300_000);
  await openGame(page);

  // Freeplay opens with the password; Esc in the password prompt stays on the start screen
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await waitForScene(page, 'Password');
  expect(await sceneState(page, 'Password')).toMatchObject({ title: 'Avaa freeplay' });
  await press(page, 'Escape');
  await waitForScene(page, 'Start');
  await openFreeplay(page);
  const menu = await sceneState(page, 'Menu');
  expect(menu.tiles.map((t: { id: string }) => t.id)).toEqual(['hirsipuu', 'arvoitukset', 'lentopeli', 'raiskinta', 'ristikko', 'tasohyppely', 'kurpitsalinko', 'ennatykset']);
  expect(menu.tiles[0]).toEqual({ id: 'hirsipuu', record: null });

  // The instruction screen goes back to the freeplay menu with Esc
  await selectGame(page, 'hirsipuu');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Escape');
  await waitForScene(page, 'Menu');
  await startFreeplayGame(page, 'hirsipuu', 'Hirsipuu');

  // Sana 1: kaksi väärää kirjainta → 200 − 2 × 25 = 150 (Q ja X eivät ole yhdessäkään sanassa)
  await solveHangmanWord(page, 'qx');
  expect(await sceneState(page, 'Hirsipuu')).toMatchObject({ index: 0, total: 150, phase: 'wordDone' });
  await press(page, 'Enter');
  // Sana 2: kahdeksas väärä kirjain kaataa sanan → 0
  await waitForState(page, 'Hirsipuu', (s) => s.index === 1 && s.phase === 'guessing');
  await failHangmanWord(page);
  expect(await sceneState(page, 'Hirsipuu')).toMatchObject({ total: 150 });
  await press(page, 'Enter');
  // Sana 3: saman kirjaimen kokeileminen uudelleen ei maksa mitään
  await waitForState(page, 'Hirsipuu', (s) => s.index === 2 && s.phase === 'guessing');
  const third = await sceneState(page, 'Hirsipuu');
  const first = (third.phrase as string).match(/[A-ZÅÄÖ]/)![0].toLocaleLowerCase('fi-FI');
  await typeText(page, first + first, 120);
  expect(await sceneState(page, 'Hirsipuu')).toMatchObject({ tried: [first.toLocaleUpperCase('fi-FI')], wrong: [] });
  await solveHangmanWord(page);
  expect((await sceneState(page, 'Hirsipuu')).total).toBe(350);
  await press(page, 'Enter');
  // Sanat 4 ja 5 täydellisesti
  for (const index of [3, 4]) {
    await waitForState(page, 'Hirsipuu', (s) => s.index === index && s.phase === 'guessing');
    await solveHangmanWord(page);
    await press(page, 'Enter');
  }

  // 750 → 7 500 freeplay points; the empty list asks a name
  await waitForScene(page, 'FreeplayResult');
  expect(await sceneState(page, 'FreeplayResult')).toMatchObject({ gameId: 'hirsipuu', score: 7500, place: 1, phase: 'name' });
  await press(page, 'Enter', 300); // an empty name is not saved
  expect((await sceneState(page, 'FreeplayResult')).phase).toBe('name');
  await typeText(page, 'Äijö');
  await press(page, 'Enter');
  await waitForState(page, 'FreeplayResult', (s) => s.phase === 'list');
  expect((await sceneState(page, 'FreeplayResult')).saved).toBe(1);

  // Enter plays the same game again; Esc on the name skips saving
  await press(page, 'Enter');
  await waitForScene(page, 'Hirsipuu');
  for (let index = 0; index < 5; index++) {
    await waitForState(page, 'Hirsipuu', (s) => s.index === index && s.phase === 'guessing');
    await solveHangmanWord(page);
    await press(page, 'Enter');
  }
  await waitForScene(page, 'FreeplayResult');
  expect(await sceneState(page, 'FreeplayResult')).toMatchObject({ score: 10000, place: 1, phase: 'name' });
  await press(page, 'Escape');
  await waitForState(page, 'FreeplayResult', (s) => s.phase === 'list');
  expect((await sceneState(page, 'FreeplayResult')).saved).toBeNull();
  await press(page, 'Escape');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).tiles[0]).toEqual({ id: 'hirsipuu', record: 7500 });

  // Ennätykset: everyone may look, ←/→ switch game
  await selectGame(page, 'ennatykset');
  await press(page, 'Enter');
  await waitForScene(page, 'Highscores');
  expect(await sceneState(page, 'Highscores')).toEqual({ gameId: 'hirsipuu', rows: [{ name: 'Äijö', score: 7500 }] });
  await press(page, 'ArrowRight');
  expect(await sceneState(page, 'Highscores')).toEqual({ gameId: 'arvoitukset', rows: [] });
  await press(page, 'Escape');
  await waitForScene(page, 'Menu');
  await press(page, 'Escape');
  await waitForScene(page, 'Start');

  // Freeplay results are not tournament results, and freeplay stays open after a reload
  expect((await savedData(page))?.players ?? []).toEqual([]);
  await page.reload();
  await unlock(page);
  expect((await sceneState(page, 'Start')).selected).toBe(0);
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect(await activeScenes(page)).not.toContain('Password');
  await expectNoRuntimeErrors(page);
});

test('freeplay: täydelle top-listalle ei pääse heikommalla tuloksella, eikä nimeä kysytä', async ({ page }) => {
  const full = Array.from({ length: 10 }, (_, i) => ({ name: `Mestari ${i + 1}`, score: 9000 - i, at: '2026-10-31T19:00:00.000Z' }));
  await page.goto('./');
  await page.evaluate(
    ([key, value]) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    [FREEPLAY_KEY, JSON.stringify({ open: true, lists: { testipeli: full } })] as const,
  );
  await page.reload();
  await waitForScene(page, 'Password');
  await typeText(page, PASSWORD);
  await press(page, 'Enter');
  await waitForScene(page, 'Start');
  await page.evaluate(() => window.__peli!.addTestActionGame());
  await openFreeplay(page);
  await page.evaluate(() => (window.__peliTestScore = 300));
  await startFreeplayGame(page, 'testipeli', 'Testipeli');
  await press(page, 'Enter');
  await waitForScene(page, 'FreeplayResult');
  expect(await sceneState(page, 'FreeplayResult')).toMatchObject({ gameId: 'testipeli', score: 3000, place: null, phase: 'list' });
  await press(page, 'Escape');
  await waitForScene(page, 'Menu');
  await expectNoRuntimeErrors(page);
});

test('freeplay: loputon lentopeli jatkuu maalin ohi, ja pisteillä ei ole ylärajaa', async ({ page }) => {
  await openGame(page);
  await openFreeplay(page);
  await startFreeplayGame(page, 'lentopeli', 'Lentopeli');
  const start = await sceneState(page, 'Lentopeli');
  expect(start.endless).toBe(true);
  await press(page, 'Space');
  // Far past the tournament's finish (about 18 500), straight into an inquisitor
  const placed = await page.evaluate(() => {
    const scene = (window.__peli!.game as any).scene.getScene('Lentopeli');
    const gate = scene.course.find((c: any) => c.x > 30000 && c.pattern === 'gate');
    scene.debugPlace(gate.x - 10, gate.blocks[1].top + 40);
    return gate.x;
  });
  expect(placed).toBeLessThan(start.goal);
  await waitForScene(page, 'FreeplayResult', 120_000);
  const result = await sceneState(page, 'FreeplayResult');
  expect(result).toMatchObject({ gameId: 'lentopeli', place: 1 });
  // Pasi 24.10.: a third of the tournament scale, so about 5 400 at 30 000 px
  expect(result.score).toBeGreaterThan(4500);
  expect(result.score).toBeLessThan(10000);
  await expectNoRuntimeErrors(page);
});

test('freeplay: kuva-arvoituksissa on myös freeplayn omat arvoitukset (Pasi 23.10.)', async ({ page }) => {
  await openGame(page);
  await openFreeplay(page);
  await startFreeplayGame(page, 'arvoitukset', 'Arvoitukset');
  expect(await sceneState(page, 'Arvoitukset')).toMatchObject({ index: 0, count: 13 });
  await expectNoRuntimeErrors(page);
});
