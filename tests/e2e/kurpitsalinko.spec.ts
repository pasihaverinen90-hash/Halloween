import { expect, test, type Page } from '@playwright/test';
import { createPlayer, expectNoRuntimeErrors, openGame, press, savedData, sceneState, selectGame, waitForScene, waitForState } from './helpers';

/** Run code against the catapult scene (test helpers and its state). */
async function catapult<T>(page: Page, fn: string): Promise<T> {
  return page.evaluate((body) => {
    const scene = (window.__peli!.game as any).scene.getScene('Kurpitsalinko');
    return new Function('scene', body)(scene);
  }, fn) as Promise<T>;
}

async function startAttempt(page: Page): Promise<void> {
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Kurpitsalinko');
  await waitForState(page, 'Kurpitsalinko', (s) => s.phase === 'aim');
}

test('kurpitsalinko: kulma, voima, laukaus, aseet, kentät ja kolme yritystä', async ({ page }) => {
  test.setTimeout(480_000);
  await openGame(page);
  await createPlayer(page, 'Piirittäjä');
  await selectGame(page, 'kurpitsalinko');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');

  // Yritys 1/3
  await startAttempt(page);
  expect(await sceneState(page, 'Kurpitsalinko')).toMatchObject({ level: 0, shots: 0, left: 2, angle: 40, weapon: 'pumpkin' });
  await page.screenshot({ path: '/tmp/kuvat/kl-tahtays.png' });

  // Ylänuoli nostaa kulmaa, alanuoli laskee
  await page.keyboard.down('ArrowUp');
  await waitForState(page, 'Kurpitsalinko', (s) => s.angle > 45);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowDown');
  await waitForState(page, 'Kurpitsalinko', (s) => s.angle < 42);
  await page.keyboard.up('ArrowDown');

  // Välilyönti pohjassa: voima nousee, irti päästäessä kurpitsa lähtee
  await page.keyboard.down('Space');
  await waitForState(page, 'Kurpitsalinko', (s) => s.charging && s.power > 0.2);
  await page.keyboard.up('Space');
  await waitForState(page, 'Kurpitsalinko', (s) => s.shots === 1 && s.phase !== 'aim');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/kuvat/kl-lento.png' });
  await waitForState(page, 'Kurpitsalinko', (s) => s.phase === 'aim', 60_000);

  // Numerot valitsevat aseen; erikoisasetta saa käyttää kerran kentässä
  await press(page, '4');
  expect((await sceneState(page, 'Kurpitsalinko')).weapon).toBe('beam');
  const aimState = await sceneState(page, 'Kurpitsalinko');
  const target = aimState.skeletons.find((sk: { alive: boolean }) => sk.alive);
  const launch = await catapult<{ x: number; y: number }>(page, 'return scene.battle.launch');
  const beamAngle = (Math.atan2(launch.y - (target.y - 36), target.x - launch.x) * 180) / Math.PI;
  await catapult(page, `scene.angle = ${beamAngle}`);
  await page.keyboard.down('Space');
  await waitForState(page, 'Kurpitsalinko', (s) => s.charging);
  await page.keyboard.up('Space');
  // The beam goes through everything in its line, maybe more than one skeleton.
  await waitForState(page, 'Kurpitsalinko', (s) => s.shots === 2 && s.left < aimState.left);
  await page.screenshot({ path: '/tmp/kuvat/kl-sade.png' });
  await waitForState(page, 'Kurpitsalinko', (s) => s.phase === 'aim' || s.phase === 'levelDone', 60_000);
  if ((await sceneState(page, 'Kurpitsalinko')).phase === 'aim') {
    expect(await sceneState(page, 'Kurpitsalinko')).toMatchObject({ weapon: 'pumpkin', ammo: { beam: 0, cluster: 1 } });
    await press(page, '4');
    expect((await sceneState(page, 'Kurpitsalinko')).weapon).toBe('pumpkin');
  }

  // Kaikki aseet lähtevät
  for (const weapon of ['cluster', 'homing', 'bomb']) {
    const before = (await sceneState(page, 'Kurpitsalinko')).shots;
    await catapult(page, `scene.debugFire('${weapon}', 50, 0.5)`);
    await waitForState(page, 'Kurpitsalinko', (s) => s.shots === before + 1);
    await waitForState(page, 'Kurpitsalinko', (s) => s.phase === 'aim' || s.phase === 'levelDone', 60_000);
    if ((await sceneState(page, 'Kurpitsalinko')).phase === 'levelDone') break;
  }

  // Loput kentät: luurangot kaatuvat testin apurilla. Hutilaukaukset laskevat pisteitä.
  await catapult(page, 'scene.shots += 25');
  for (let level = (await sceneState(page, 'Kurpitsalinko')).level; level < 5; level++) {
    await waitForState(page, 'Kurpitsalinko', (s) => s.level === level && (s.phase === 'aim' || s.phase === 'levelDone' || s.phase === 'intro'), 60_000);
    if (level === 4) await page.screenshot({ path: '/tmp/kuvat/kl-holvi.png' });
    await catapult(page, 'scene.debugClearLevel()');
    await waitForState(page, 'Kurpitsalinko', (s) => s.level > level || s.phase === 'won', 60_000);
  }
  await waitForScene(page, 'AttemptResult', 120_000);
  let result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'action', attempt: 1, total: 3, isFinal: false });
  // 15 luurankoa, vähintään 25 laukausta: 1000 × 15 ÷ laukaukset
  expect(result.score).toBeLessThanOrEqual(600);
  expect(result.score).toBeGreaterThan(300);
  await press(page, 'Enter');

  // Yritykset 2 ja 3: kentät alkavat alusta, ja yksi laukaus per luuranko antaa 1000
  await startAttempt(page);
  expect(await sceneState(page, 'Kurpitsalinko')).toMatchObject({ level: 0, shots: 0, left: 2 });
  for (let level = 0; level < 5; level++) {
    await waitForState(page, 'Kurpitsalinko', (s) => s.level === level && s.phase !== 'levelDone', 60_000);
    await catapult(page, 'scene.shots += scene.battle.skeletonsLeft(); scene.debugClearLevel()');
    await waitForState(page, 'Kurpitsalinko', (s) => s.level > level || s.phase === 'won', 60_000);
  }
  await waitForScene(page, 'AttemptResult', 120_000);
  result = await sceneState(page, 'AttemptResult');
  // 1000 pistettä päättää pelin heti
  expect(result).toMatchObject({ attempt: 2, score: 1000, isFinal: true });
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  const record = (await savedData(page)).players[0].games.kurpitsalinko;
  expect(record.attempts).toHaveLength(2);
  expect(record.finished).toBe(true);
  await expectNoRuntimeErrors(page);
});
