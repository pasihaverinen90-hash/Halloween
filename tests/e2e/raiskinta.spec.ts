import { expect, test, type Page } from '@playwright/test';
import { createPlayer, expectNoRuntimeErrors, openGame, press, savedData, sceneState, selectGame, waitForScene, waitForState } from './helpers';

/** Run code against the shooter scene (test helpers and its state). */
async function shooter<T>(page: Page, fn: string): Promise<T> {
  return page.evaluate((body) => {
    const scene = (window.__peli!.game as any).scene.getScene('Raiskinta');
    return new Function('scene', body)(scene);
  }, fn) as Promise<T>;
}

async function startAttempt(page: Page): Promise<void> {
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Raiskinta');
}

test('räiskintä: liikkuminen, tauko, boosti, liitonarkku, Paholainen ja kolme yritystä', async ({ page }) => {
  test.setTimeout(420_000);
  await openGame(page);
  await createPlayer(page, 'Ampuja');
  await selectGame(page, 'raiskinta');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');

  // Yritys 1
  await startAttempt(page);
  expect(await sceneState(page, 'Raiskinta')).toMatchObject({ phase: 'playing', health: 10, weapon: 1, popeX: 640 });
  await page.keyboard.down('ArrowLeft');
  await waitForState(page, 'Raiskinta', (s) => s.popeX < 560);
  await page.keyboard.up('ArrowLeft');
  const stopped = (await sceneState(page, 'Raiskinta')).popeX;
  await page.waitForTimeout(400);
  expect((await sceneState(page, 'Raiskinta')).popeX).toBe(stopped);

  // Tauko pysäyttää ajan
  await waitForState(page, 'Raiskinta', (s) => s.time > 1);
  await press(page, 'Escape', 400);
  const paused = (await sceneState(page, 'Raiskinta')).time;
  await page.waitForTimeout(800);
  expect((await sceneState(page, 'Raiskinta')).time).toBe(paused);
  await press(page, 'Enter', 400);
  await waitForState(page, 'Raiskinta', (s) => s.time > paused);

  // Boostin kantaja: tuhotaan, ja paavi kerää boostin
  await shooter(page, 'scene.debugSkip(11)');
  await waitForState(page, 'Raiskinta', (s) => s.enemies > 0);
  await expect
    .poll(() => shooter<boolean>(page, 'return scene.enemies.some((e) => e.spawn.drop)'), { timeout: 60_000 })
    .toBe(true);
  await shooter(page, 'const e = scene.enemies.find((e) => e.spawn.drop); scene.kill(e); scene.popeX = e.x;');
  await waitForState(page, 'Raiskinta', (s) => s.boosts.rapid > 0);

  // Liitonarkku parantaa asetta
  await shooter(page, 'scene.debugSkip(30)');
  await expect.poll(() => shooter<boolean>(page, "return scene.enemies.some((e) => e.spawn.kind === 'ark')"), { timeout: 60_000 }).toBe(true);
  await shooter(page, "scene.kill(scene.enemies.find((e) => e.spawn.kind === 'ark'))");
  expect(await sceneState(page, 'Raiskinta')).toMatchObject({ weapon: 2 });

  // Osumat vievät kestoa
  const before = (await sceneState(page, 'Raiskinta')).health;
  await shooter(page, 'scene.debugHurt(3)');
  expect((await sceneState(page, 'Raiskinta')).health).toBe(before - 3);

  // Välitekstin jälkeen Paholainen; viimeinen osuma kaataa sen
  await shooter(page, 'scene.debugSkip(179)');
  await waitForState(page, 'Raiskinta', (s) => s.phase === 'interlude');
  await waitForState(page, 'Raiskinta', (s) => s.phase === 'boss', 120_000);
  await shooter(page, 'scene.debugBossHealth(1)');
  await waitForState(page, 'Raiskinta', (s) => s.phase === 'won', 120_000);
  const won = await sceneState(page, 'Raiskinta');
  await waitForScene(page, 'AttemptResult', 120_000);
  let result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'action', attempt: 1, total: 3, isFinal: false, score: won.points });
  expect(result.score).toBeGreaterThanOrEqual(600);
  await press(page, 'Enter');

  // Yritykset 2 ja 3: paavi kaatuu heti
  for (const attempt of [2, 3]) {
    await startAttempt(page);
    expect(await sceneState(page, 'Raiskinta')).toMatchObject({ health: 10, weapon: 1, killed: 0 });
    await shooter(page, 'scene.debugHurt(10)');
    await waitForScene(page, 'AttemptResult', 120_000);
    result = await sceneState(page, 'AttemptResult');
    expect(result).toMatchObject({ attempt, isFinal: attempt === 3 });
    expect(result.score).toBeLessThan(20);
    await press(page, 'Enter');
  }
  await waitForScene(page, 'Menu');
  const record = (await savedData(page)).players[0].games.raiskinta;
  expect(record.attempts).toHaveLength(3);
  expect(record.finished).toBe(true);
  expect((await sceneState(page, 'Menu')).tiles[3]).toEqual({ id: 'raiskinta', status: 'finished', score: won.points });
  await expectNoRuntimeErrors(page);
});
