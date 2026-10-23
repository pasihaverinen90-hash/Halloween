import { expect, test, type Page } from '@playwright/test';
import { expectNoRuntimeErrors, press, savedData, sceneState, startTournamentAt, waitForScene, waitForState } from './helpers';

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

test('tasohyppely: liikkuminen, ruoska, ei taukoa, kynttilä ja kolikko, zombi, kuoppa, esineet, kauppa, jatkaminen kentän alusta ja päänoita', async ({ page }) => {
  test.setTimeout(480_000);
  await startTournamentAt(page, 'Metsästäjä', 'tasohyppely');
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

  // Esc ei pysäytä kentän aikaa (Pasi 23.10.: taukoa ei ole)
  await press(page, 'Escape', 400);
  const afterEsc = (await sceneState(page, 'Tasohyppely')).time;
  await waitForState(page, 'Tasohyppely', (s) => s.time > afterEsc);

  // Kynttilä: ruoska sammuttaa sen, ja siitä saa pisteitä ja kolikon (alun lyönti on voinut jo osua yhteen)
  const candlesBefore = (await sceneState(page, 'Tasohyppely')).candles;
  await platformer(page, 'const c = scene.level.candles[0]; scene.debugPlace(c.x - 40, c.y + 72); scene.hunter.facing = 1;');
  await waitForState(page, 'Tasohyppely', (s) => s.onGround);
  await expect
    .poll(
      async () => {
        await press(page, 'x', 400);
        return (await sceneState(page, 'Tasohyppely')).candles;
      },
      { timeout: 30_000 },
    )
    .toBe(candlesBefore + 1);
  const candles = candlesBefore + 1;
  expect(await sceneState(page, 'Tasohyppely')).toMatchObject({ coins: candles });
  expect((await sceneState(page, 'Tasohyppely')).points).toBeGreaterThan(0);

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

  // C heittää tikarin, ja tikarinippu tuo viisi lisää (Pasi 22.10.: alussa 10)
  expect((await sceneState(page, 'Tasohyppely')).daggers).toBe(10);
  await press(page, 'c', 50);
  await waitForState(page, 'Tasohyppely', (s) => s.daggers === 9);
  await platformer(page, "scene.debugDrop('dagger')");
  await waitForState(page, 'Tasohyppely', (s) => s.daggers === 14);

  // Maaliportista seuraavaan kenttään: ensin kauppa, ja sydämet ovat taas täynnä
  await platformer(page, 'scene.debugHurt(2); const g = scene.level.gate; scene.debugPlace(g.x - 90, g.y);');
  expect((await sceneState(page, 'Tasohyppely')).health).toBe(2.5);
  await page.keyboard.down('ArrowRight');
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'levelDone');
  await page.keyboard.up('ArrowRight');
  await waitForState(page, 'Tasohyppely', (s) => s.level === 1 && s.phase === 'shop', 60_000);
  expect(await sceneState(page, 'Tasohyppely')).toMatchObject({ levelsDone: 1, health: 5, whip: 2, candles, coins: candles, shop: { index: 0 } });

  // Kahdella kolikolla ei saa mitään
  await platformer(page, 'scene.debugCoins(2)');
  await press(page, 'Enter', 300);
  expect(await sceneState(page, 'Tasohyppely')).toMatchObject({ coins: 2, daggers: 14 });
  // Kolikoilla saa tikareita (enintään 15), lisäsydämen, paremman ruoskan ja teroituksen
  await platformer(page, 'scene.debugCoins(30)');
  await press(page, 'Enter', 300);
  await waitForState(page, 'Tasohyppely', (s) => s.daggers === 15 && s.coins === 27);
  await press(page, 'ArrowDown', 300);
  await press(page, 'Enter', 300);
  await waitForState(page, 'Tasohyppely', (s) => s.maxHealth === 6 && s.health === 6 && s.coins === 21);
  await press(page, 'ArrowDown', 300);
  await press(page, 'Enter', 300);
  await waitForState(page, 'Tasohyppely', (s) => s.whip === 3 && s.coins === 13);
  await press(page, 'ArrowDown', 300);
  await press(page, 'Enter', 300);
  await waitForState(page, 'Tasohyppely', (s) => s.sharpen === 1 && s.coins === 7);
  await press(page, 'ArrowDown', 300);
  await press(page, 'Enter', 300);
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'play');
  expect((await sceneState(page, 'Tasohyppely')).points).toBeGreaterThanOrEqual(200);

  // Sydämet loppuvat linnassa: yritys päättyy
  await platformer(page, 'scene.debugHurt(10)');
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'dead');
  await waitForScene(page, 'AttemptResult', 120_000);
  let result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ kind: 'action', attempt: 1, total: 3, isFinal: false });
  expect(result.score).toBeGreaterThanOrEqual(200);
  await press(page, 'Enter');

  // Yritys 2/3 jatkuu linnan alusta tavaroilla, jotka olivat kentän alkaessa (ostokset perutaan)
  await waitForScene(page, 'AttemptIntro');
  expect(await sceneState(page, 'AttemptIntro')).toMatchObject({ attempt: 2, total: 3, note: 'Jatkat kentän 2 alusta: Linna' });
  await press(page, 'Enter');
  await waitForScene(page, 'Tasohyppely');
  expect(await sceneState(page, 'Tasohyppely')).toMatchObject({
    phase: 'shop',
    level: 1,
    levelsDone: 1,
    whip: 2,
    daggers: 14,
    coins: candles,
    sharpen: 0,
    maxHealth: 5,
    candles,
  });
  // Ylös valinnasta pääsee suoraan jatkamaan
  await press(page, 'ArrowUp', 300);
  await press(page, 'Enter', 300);
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'play');

  // Päänoita: areenalle tultaessa taistelu alkaa, ja viimeinen osuma kaataa sen. Silloin peli päättyy.
  await platformer(page, 'scene.debugBoss(); scene.hunter.invulnerable = 999;');
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'boss' && s.boss !== null);
  await waitForState(page, 'Tasohyppely', (s) => s.boss.mode !== 'enter', 120_000);
  await platformer(page, 'scene.debugBreakCandles(); scene.debugBossHealth(1); scene.hunter.facing = 1; scene.debugBossInFront();');
  await press(page, 'x', 50);
  await waitForState(page, 'Tasohyppely', (s) => s.phase === 'won');
  const won = await sceneState(page, 'Tasohyppely');
  expect(won.points).toBeGreaterThanOrEqual(900);
  await waitForScene(page, 'AttemptResult', 120_000);
  result = await sceneState(page, 'AttemptResult');
  expect(result).toMatchObject({ attempt: 2, total: 3, isFinal: true, score: won.points });
  await press(page, 'Enter');

  // Turnaus jatkuu seuraavaan peliin (Pasi 23.10.)
  await waitForScene(page, 'Instructions');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('kurpitsalinko');
  const record = (await savedData(page)).players[0].games.tasohyppely;
  expect(record.attempts).toHaveLength(2);
  expect(record.finished).toBe(true);
  expect(record).not.toHaveProperty('carry');
  expect(Math.max(...record.attempts)).toBe(won.points);
  await expectNoRuntimeErrors(page);
});
