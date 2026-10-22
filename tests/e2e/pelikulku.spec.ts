import { expect, test } from '@playwright/test';
import {
  activeScenes,
  createPlayer,
  expectNoRuntimeErrors,
  failHangmanWord,
  nextPlayer,
  openGame,
  playCatapultQuickly,
  playCrosswordQuickly,
  playFlightQuickly,
  playPlatformerQuickly,
  playRiddlesCorrectly,
  playShooterQuickly,
  press,
  savedData,
  sceneState,
  solveHangmanWord,
  typeText,
  waitForScene,
  waitForState,
} from './helpers';


test('kaksi pelaajaa pelaavat illan läpi hirsipuulla', async ({ page }) => {
  // Two players play every game: this takes a while in the test browser.
  test.setTimeout(900_000);
  await openGame(page);

  // Pelaaja 1: nimi ä- ja ö-kirjaimilla
  await createPlayer(page, 'Äijö Testi');
  expect(await sceneState(page, 'Menu')).toMatchObject({
    player: 'Äijö Testi',
    total: 0,
    tiles: [
      { id: 'hirsipuu', status: 'unplayed', score: null },
      { id: 'arvoitukset', status: 'unplayed', score: null },
      { id: 'lentopeli', status: 'unplayed', score: null },
      { id: 'raiskinta', status: 'unplayed', score: null },
      { id: 'ristikko', status: 'unplayed', score: null },
      { id: 'tasohyppely', status: 'unplayed', score: null },
      { id: 'kurpitsalinko', status: 'unplayed', score: null },
    ],
  });
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');
  await waitForScene(page, 'Hirsipuu');

  // Sana 1: kaksi väärää kirjainta → 200 − 2 × 25 = 150
  await solveHangmanWord(page, 'qw');
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

  await waitForScene(page, 'AttemptResult');
  expect(await sceneState(page, 'AttemptResult')).toMatchObject({ kind: 'puzzle', score: 750, best: 750, isFinal: true });
  const saved = await savedData(page);
  expect(saved.players[0].games.hirsipuu).toMatchObject({ attempts: [750], finished: true, checkpoint: null });

  // Valikossa hirsipuu on nyt harmaana ja arvoitukset valittuna
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect(await sceneState(page, 'Menu')).toMatchObject({ selected: 'arvoitukset', total: 750 });
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  const riddles = await playRiddlesCorrectly(page);
  expect(riddles).toBeGreaterThan(300);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).selected).toBe('lentopeli');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  const flight = await playFlightQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).selected).toBe('raiskinta');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  const shooter = await playShooterQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).selected).toBe('ristikko');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  const crossword = await playCrosswordQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).selected).toBe('tasohyppely');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  const platformer = await playPlatformerQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  expect((await sceneState(page, 'Menu')).selected).toBe('kurpitsalinko');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  const catapult = await playCatapultQuickly(page);

  // Kiitosnäkymä: tulokset ovat tallessa selaimessa, eikä varmuuskopiotiedostoa ladata (Pasi 20.10.)
  const downloads: string[] = [];
  page.on('download', (d) => downloads.push(d.suggestedFilename()));
  await press(page, 'Enter');
  await waitForScene(page, 'Thanks');
  expect(await sceneState(page, 'Thanks')).toMatchObject({ player: 'Äijö Testi', total: 750 + riddles + flight + shooter + crossword + platformer + catapult, backupOk: false });
  expect((await savedData(page)).players[0]).toMatchObject({ name: 'Äijö Testi', games: { hirsipuu: { attempts: [750] } } });

  // Seuraava pelaaja vaatii Pasin salasanan (Pasi 21.10.): peruutus jää kiitosnäkymään
  await press(page, 'Enter');
  await waitForScene(page, 'Password');
  await press(page, 'Escape');
  await waitForScene(page, 'Thanks');
  expect(await activeScenes(page)).not.toContain('Start');
  await nextPlayer(page);
  // Sama nimi pienillä kirjaimilla ei kelpaa
  await typeText(page, 'äijö testi');
  await press(page, 'Enter');
  expect((await sceneState(page, 'Start')).error).toMatch(/on jo käytössä/);
  for (let i = 0; i < 10; i++) await press(page, 'Backspace', 40);
  await createPlayer(page, 'Liisa');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');
  await waitForScene(page, 'Hirsipuu');
  for (let index = 0; index < 5; index++) {
    await waitForState(page, 'Hirsipuu', (s) => s.index === index && s.phase === 'guessing');
    await solveHangmanWord(page);
    await press(page, 'Enter');
  }
  await waitForScene(page, 'AttemptResult');
  expect((await sceneState(page, 'AttemptResult')).score).toBe(1000);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await playRiddlesCorrectly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await playFlightQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await playShooterQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await playCrosswordQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await playPlatformerQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await playCatapultQuickly(page);
  await press(page, 'Enter');
  await waitForScene(page, 'Thanks');
  expect((await savedData(page)).players.map((p: { name: string }) => p.name)).toEqual(['Äijö Testi', 'Liisa']);
  await page.waitForTimeout(500);
  expect(downloads).toEqual([]);
  await expectNoRuntimeErrors(page);
});

test('tauko pysäyttää hirsipuun, eikä mitään kulu tai katoa', async ({ page }) => {
  await openGame(page);
  await createPlayer(page, 'Taukoilija');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  await press(page, 'Enter');
  await waitForScene(page, 'Hirsipuu');
  await typeText(page, 'q');
  const before = await sceneState(page, 'Hirsipuu');

  await press(page, 'Escape', 400);
  expect(await sceneState(page, 'GameHost')).toMatchObject({ state: 'paused' });
  await waitForScene(page, 'Pause');
  await typeText(page, 'abc', 80);
  expect(await sceneState(page, 'Hirsipuu')).toEqual(before);

  await press(page, 'Enter', 400);
  expect(await sceneState(page, 'GameHost')).toMatchObject({ state: 'playing' });
  await waitForScene(page, 'Hirsipuu'); // the game scene resumes on the next frame
  await typeText(page, 'w');
  await waitForState(page, 'Hirsipuu', (s) => s.wrong.length > before.wrong.length);
  expect((await sceneState(page, 'Hirsipuu')).wrong).toEqual([...before.wrong, 'W']);

  // Esc again pauses, Esc resumes
  await press(page, 'Escape', 400);
  await press(page, 'Escape', 400);
  expect(await sceneState(page, 'GameHost')).toMatchObject({ state: 'playing' });
  await expectNoRuntimeErrors(page);
});
