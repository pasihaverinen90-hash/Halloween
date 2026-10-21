import { expect, test, type Page } from '@playwright/test';
import { createPlayer, expectNoRuntimeErrors, openGame, press, savedData, sceneState, selectGame, waitForScene, waitForState } from './helpers';

/** Run code against the platformer scene (test helpers and its state). */
async function platformer<T>(page: Page, fn: string): Promise<T> {
  return page.evaluate((body) => {
    const scene = (window.__peli!.game as any).scene.getScene('Tasohyppely');
    return new Function('scene', body)(scene);
  }, fn) as Promise<T>;
}

async function startAttempt(page: Page): Promise<void> {
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Tasohyppely');
}

test('tasohyppely: liikkuminen, hyppy, ruoska, tauko, kynttilä, zombi, kuoppa, esineet, kentät, päänoita ja kolme yritystä', async ({ page }) => {
  test.setTimeout(480_000);
  await openGame(page);
  await createPlayer(page, 'Metsästäjä');
  await selectGame(page, 'tasohyppely');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');

  // Yritys 1 alkaa hautausmaalta täysillä sydämillä
  await startAttempt(page);
  expect(await sceneState(page, 'Tasohyppely')).toMatchObject({ level: 0, health: 5, whip: 1, candles: 0, points: 0 });
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'play');
  const start = await sceneState(page, 'Tasohyppely');

  // Oikea nuoli juoksee, ja pysähtyy kun nuolen päästää
  await page.keyboard.down('ArrowRight');
  await waitForState(page, 'Tasohyppely', (s) => s.x > start.x + 60);
  await page.keyboard.up('ArrowRight');
  await waitForState(page, 'Tasohyppely', (s) => s.vx === 0);

  // Välilyönti hyppää, ja hahmo laskeutuu takaisin
  await page.keyboard.down('Space');
  await waitForState(page, 'Tasohyppely', (s) => !s.onGround && s.y < start.y - 40);
  await page.keyboard.up('Space');
  await waitForState(page, 'Tasohyppely', (s) => s.onGround && s.y === start.y);

  // X lyö ruoskalla
  await press(page, 'x', 50);
  await waitForState(page, 'Tasohyppely', (s) => s.lashing === 'side');

  // Tauko pysäyttää kentän ajan
  await press(page, 'Escape', 400);
  const paused = (await sceneState(page, 'Tasohyppely')).time;
  await page.waitForTimeout(800);
  expect((await sceneState(page, 'Tasohyppely')).time).toBe(paused);
  await press(page, 'Enter', 400);
  await waitForState(page, 'Tasohyppely', (s) => s.time > paused);

  // Kynttilä: ruoska sammuttaa sen ja tuo pisteitä
  await platformer(page, 'const c = scene.level.candles[0]; scene.debugPlace(c.x - 40, c.y + 72); scene.hunter.facing = 1;');
  await waitForState(page, 'Tasohyppely', (s) => s.onGround);
  await press(page, 'x', 50);
  await waitForState(page, 'Tasohyppely', (s) => s.candles === 1 && s.points > 0);

  // Zombi nousee maasta, kun sen lähelle tulee, ja kaatuu yhdestä lyönnistä
  const zombie = await platformer<{ x: number; y: number }>(page, "const z = scene.enemies.find((e) => e.kind === 'zombie'); return { x: z.x, y: z.y };");
  await platformer(page, `scene.debugPlace(${zombie.x - 110}, ${zombie.y}); scene.hunter.facing = 1; scene.hunter.invulnerable = 999;`);
  const enemiesBefore = (await sceneState(page, 'Tasohyppely')).enemies;
  await expect
    .poll(
      async () => {
        await press(page, 'x', 250);
        return (await sceneState(page, 'Tasohyppely')).enemies;
      },
      { timeout: 60_000 },
    )
    .toBeLessThan(enemiesBefore);

  // Kuoppa vie sydämen ja palauttaa reunalle
  await platformer(page, 'scene.hunter.invulnerable = 0; scene.debugPlace(35 * 48 + 48, 600);');
  await waitForState(page, 'Tasohyppely', (s) => s.health === 4 && s.onGround && s.y === 720);

  // Esineet: puolikas sydän ja ruoskan päivitys
  await platformer(page, "scene.debugDrop('heart')");
  await waitForState(page, 'Tasohyppely', (s) => s.health === 4.5);
  await platformer(page, "scene.debugDrop('whip')");
  await waitForState(page, 'Tasohyppely', (s) => s.whip === 2);

  // Maaliportista seuraavaan kenttään, jossa sydämet ovat taas täynnä
  await platformer(page, 'scene.debugHurt(2); const g = scene.level.gate; scene.debugPlace(g.x - 90, g.y);');
  expect((await sceneState(page, 'Tasohyppely')).health).toBe(2.5);
  await page.keyboard.down('ArrowRight');
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'levelDone');
  await page.keyboard.up('ArrowRight');
  await waitForState(page, 'Tasohyppely', (s) => s.level === 1, 60_000);
  expect(await sceneState(page, 'Tasohyppely')).toMatchObject({ levelsDone: 1, health: 5, whip: 2, candles: 1 });
  expect((await sceneState(page, 'Tasohyppely')).points).toBeGreaterThanOrEqual(200);

  // Päänoita: areenalle tultaessa taistelu alkaa, ja viimeinen osuma kaataa sen
  await platformer(page, 'scene.debugBoss(); scene.hunter.invulnerable = 999;');
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'boss' && s.boss !== null);
  await waitForState(page, 'Tasohyppely', (s) => s.boss.mode !== 'enter', 120_000);
  await platformer(page, 'scene.debugBreakCandles(); scene.debugBossHealth(1); scene.hunter.facing = 1; scene.debugBossInFront();');
  await press(page, 'x', 50);
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'won');
  const won = await sceneState(page, 'Tasohyppely');
  expect(won.points).toBeGreaterThanOrEqual(900);
  await waitForScene(page, 'AttemptResult', 120_000);
  let result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'action', attempt: 1, total: 3, isFinal: false, score: won.points });
  await press(page, 'Enter');

  // Yritykset 2 ja 3 alkavat taas hautausmaalta perusruoskalla, ja sydänten loppuminen päättää ne
  for (const attempt of [2, 3]) {
    await startAttempt(page);
    expect(await sceneState(page, 'Tasohyppely')).toMatchObject({ level: 0, health: 5, whip: 1, candles: 0 });
    await waitForState(page, 'Tasohyppely', (s) => s.phase === 'play');
    await platformer(page, 'scene.debugHurt(5)');
    await waitForState(page, 'Tasohyppely', (s) => s.phase === 'dead');
    await waitForScene(page, 'AttemptResult', 120_000);
    result = await sceneState(page, 'AttemptResult');
    expect(result).toMatchObject({ attempt, isFinal: attempt === 3 });
    expect(result.score).toBeLessThan(20);
    await press(page, 'Enter');
  }
  await waitForScene(page, 'Menu');
  const record = (await savedData(page)).players[0].games.tasohyppely;
  expect(record.attempts).toHaveLength(3);
  expect(record.finished).toBe(true);
  const tile = (await sceneState(page, 'Menu')).tiles.find((t: { id: string }) => t.id === 'tasohyppely');
  expect(tile).toEqual({ id: 'tasohyppely', status: 'finished', score: won.points });
  await expectNoRuntimeErrors(page);
});
