import { expect, test, type Page } from '@playwright/test';
import { expectNoRuntimeErrors, press, savedData, sceneState, startTournamentAt, waitForScene, waitForState } from './helpers';

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

test('räiskintä: liikkuminen, ei taukoa, boosti, liitonarkku, malja, pyhä vesi, Paholainen ja kaksi yritystä', async ({ page }) => {
  test.setTimeout(420_000);
  await startTournamentAt(page, 'Ampuja', 'raiskinta');
  await press(page, 'Enter');

  // Yritys 1
  await startAttempt(page);
  expect(await sceneState(page, 'Raiskinta')).toMatchObject({ phase: 'playing', health: 10, weapon: 1, popeX: 640, popeY: 600 });
  await page.keyboard.down('ArrowLeft');
  await waitForState(page, 'Raiskinta', (s) => s.popeX < 560);
  await page.keyboard.up('ArrowLeft');
  const stopped = (await sceneState(page, 'Raiskinta')).popeX;
  await page.waitForTimeout(400);
  expect((await sceneState(page, 'Raiskinta')).popeX).toBe(stopped);
  // Paavi liikkuu myös ylös ja alas
  await page.keyboard.down('ArrowUp');
  await waitForState(page, 'Raiskinta', (s) => s.popeY < 540);
  await page.keyboard.up('ArrowUp');

  // Esc ei pysäytä aikaa (Pasi 23.10.: taukoa ei ole)
  await waitForState(page, 'Raiskinta', (s) => s.time > 1);
  await press(page, 'Escape', 400);
  const afterEsc = (await sceneState(page, 'Raiskinta')).time;
  await waitForState(page, 'Raiskinta', (s) => s.time > afterEsc);

  // Pudonnut boosti kerätään koskettamalla. Testin ajaksi paavi ei ammu itse, ja suojakehä pitää hänet hengissä.
  await shooter(page, 'scene.boosts.shield = 999; scene.fireCooldown = 99999;');
  await shooter(page, "scene.debugDrop('rapid')");
  await waitForState(page, 'Raiskinta', (s) => s.boosts.rapid > 0);

  // Liitonarkku parantaa asetta, pyhä malja tuo suojapallon (ensimmäiset 14 ja 27 sekunnin kohdalla)
  await shooter(page, 'scene.debugSkip(13)');
  await expect.poll(() => shooter<boolean>(page, "return scene.enemies.some((e) => e.spawn.kind === 'ark')"), { timeout: 60_000 }).toBe(true);
  await shooter(page, "scene.kill(scene.enemies.find((e) => e.spawn.kind === 'ark'))");
  expect(await sceneState(page, 'Raiskinta')).toMatchObject({ weapon: 2, orbs: 0 });
  await shooter(page, 'scene.debugSkip(26)');
  await expect.poll(() => shooter<boolean>(page, "return scene.enemies.some((e) => e.spawn.kind === 'grail')"), { timeout: 60_000 }).toBe(true);
  await shooter(page, "scene.kill(scene.enemies.find((e) => e.spawn.kind === 'grail'))");
  expect(await sceneState(page, 'Raiskinta')).toMatchObject({ weapon: 2, orbs: 1 });

  // Pyhä vesi (välilyönti) tuhoaa näkyvät viholliset
  await waitForState(page, 'Raiskinta', (s) => s.enemies >= 3);
  const beforeWater = await sceneState(page, 'Raiskinta');
  expect(beforeWater.holyWater).toBe(3);
  await press(page, 'Space', 400);
  await waitForState(page, 'Raiskinta', (s) => s.holyWater === 2);
  const afterWater = await sceneState(page, 'Raiskinta');
  expect(afterWater.killed).toBeGreaterThan(beforeWater.killed);

  // Osumat vievät kestoa
  const before = (await sceneState(page, 'Raiskinta')).health;
  await shooter(page, 'scene.debugHurt(3)');
  expect((await sceneState(page, 'Raiskinta')).health).toBe(before - 3);
  // Kultainen risti palauttaa yhden
  await shooter(page, "scene.debugDrop('life')");
  await waitForState(page, 'Raiskinta', (s) => s.health === before - 2);
  await shooter(page, 'scene.boosts.shield = 999');

  // Välitekstin jälkeen Paholainen; viimeinen osuma kaataa sen
  await shooter(page, 'scene.debugSkip(119)');
  await waitForState(page, 'Raiskinta', (s) => s.phase === 'interlude');
  await waitForState(page, 'Raiskinta', (s) => s.phase === 'boss', 120_000);
  await shooter(page, 'scene.fireCooldown = 0; scene.popeX = 640; scene.popeY = 420; scene.debugBossHealth(1)');
  await waitForState(page, 'Raiskinta', (s) => s.phase === 'won', 120_000);
  const won = await sceneState(page, 'Raiskinta');
  await waitForScene(page, 'AttemptResult', 120_000);
  let result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'action', attempt: 1, total: 2, isFinal: false, score: won.points });
  expect(result.score).toBeGreaterThanOrEqual(600);
  await press(page, 'Enter');

  // Yritys 2 (Pasi 23.10.: kaksi yritystä): paavi kaatuu heti
  for (const attempt of [2]) {
    await startAttempt(page);
    expect(await sceneState(page, 'Raiskinta')).toMatchObject({ health: 10, weapon: 1, killed: 0 });
    await shooter(page, 'scene.debugHurt(10)');
    await waitForScene(page, 'AttemptResult', 120_000);
    result = await sceneState(page, 'AttemptResult');
    expect(result).toMatchObject({ attempt, isFinal: attempt === 2 });
    expect(result.score).toBeLessThan(20);
    await press(page, 'Enter');
  }
  // Turnaus jatkuu seuraavaan peliin (Pasi 23.10.)
  await waitForScene(page, 'Instructions');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('tasohyppely');
  const record = (await savedData(page)).players[0].games.raiskinta;
  expect(record.attempts).toHaveLength(2);
  expect(record.finished).toBe(true);
  expect((await savedData(page)).players[0].games.raiskinta).toMatchObject({ finished: true, attempts: expect.arrayContaining([won.points]) });
  await expectNoRuntimeErrors(page);
});
