import { expect, test, type Page } from '@playwright/test';
import {
  activeScenes,
  createPlayer,
  expectNoRuntimeErrors,
  nextPlayer,
  openGame,
  playCatapultQuickly,
  playFlightQuickly,
  playPlatformerQuickly,
  playRiddlesCorrectly,
  playShooterQuickly,
  press,
  savedData,
  sceneState,
  TOURNAMENT,
  typeText,
  waitForScene,
  waitForState,
} from './helpers';

/** Play the tournament's games one after another from the first instruction screen. Returns each game's score. */
async function playTournament(page: Page): Promise<number[]> {
  const play: Record<string, (page: Page) => Promise<number>> = {
    arvoitukset: playRiddlesCorrectly,
    lentopeli: playFlightQuickly,
    raiskinta: playShooterQuickly,
    tasohyppely: playPlatformerQuickly,
    kurpitsalinko: playCatapultQuickly,
  };
  const scores: number[] = [];
  for (const id of TOURNAMENT) {
    await waitForScene(page, 'Instructions');
    expect((await sceneState(page, 'Instructions')).gameId).toBe(id);
    scores.push(await play[id](page));
    await press(page, 'Enter');
  }
  return scores;
}

test('kaksi pelaajaa pelaavat turnauksen läpi', async ({ page }) => {
  // Two players play every game: this takes a while in the test browser.
  test.setTimeout(900_000);
  await openGame(page);

  // Pelaaja 1: nimi ä- ja ö-kirjaimilla. Pasi 23.10.: turnauksen pelit tulevat peräkkäin kiinteässä järjestyksessä.
  await createPlayer(page, 'Äijö Testi');
  const downloads: string[] = [];
  page.on('download', (d) => downloads.push(d.suggestedFilename()));
  const scores = await playTournament(page);
  expect(scores[0]).toBeGreaterThan(300);

  // Kiitosnäkymä: tulokset ovat tallessa selaimessa, eikä varmuuskopiotiedostoa ladata (Pasi 20.10.)
  await waitForScene(page, 'Thanks');
  expect(await sceneState(page, 'Thanks')).toMatchObject({ player: 'Äijö Testi', total: scores.reduce((a, b) => a + b, 0), backupOk: false });
  expect((await savedData(page)).players[0]).toMatchObject({ name: 'Äijö Testi', games: { arvoitukset: { attempts: [scores[0]] } } });

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
  await playTournament(page);
  await waitForScene(page, 'Thanks');
  expect((await savedData(page)).players.map((p: { name: string }) => p.name)).toEqual(['Äijö Testi', 'Liisa']);
  await page.waitForTimeout(500);
  expect(downloads).toEqual([]);
  await expectNoRuntimeErrors(page);
});

test('peliä ei voi pysäyttää Escillä eikä ikkunasta poistumalla (Pasi 23.10.)', async ({ page }) => {
  await openGame(page);
  await createPlayer(page, 'Taukoilija');
  await press(page, 'Enter');
  await waitForScene(page, 'Arvoitukset');
  await waitForState(page, 'Arvoitukset', (s) => s.phase === 'answering' && s.elapsedMs > 0);

  await press(page, 'Escape', 400);
  await page.evaluate(() => {
    const game = window.__peli!.game as any;
    game.events.emit('blur');
    game.events.emit('hidden');
    game.events.emit('visible');
    game.events.emit('focus');
  });
  const after = (await sceneState(page, 'Arvoitukset')).elapsedMs;
  expect(await sceneState(page, 'GameHost')).toMatchObject({ state: 'playing' });
  expect(await activeScenes(page)).toContain('Arvoitukset');
  await waitForState(page, 'Arvoitukset', (s) => s.elapsedMs > after || s.phase !== 'answering');
  await expectNoRuntimeErrors(page);
});
