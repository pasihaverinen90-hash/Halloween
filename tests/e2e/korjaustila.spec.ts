import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import {
  activeScenes,
  createPlayer,
  expectNoRuntimeErrors,
  riddles,
  openCorrection,
  openGame,
  press,
  savedData,
  savedEvening,
  sceneState,
  typeText,
  waitForScene,
  waitForState,
} from './helpers';

const EVENING = savedEvening([
  { id: 'a', name: 'Aino', games: riddles(800), finished: true },
  { id: 'b', name: 'Eero', games: riddles(600), finished: true },
  { id: 'c', name: 'Testi', games: riddles(100), finished: true },
]);

/** Move the correction menu to the action with this label and press Enter. */
async function chooseAction(page: Page, label: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    if ((await sceneState(page, 'Correction')).action === label) break;
    await press(page, 'ArrowDown', 120);
  }
  expect((await sceneState(page, 'Correction')).action).toBe(label);
  await press(page, 'Enter', 400);
}

/** Answer the open dialog: confirm or cancel (moves to the right button first). */
async function answerDialog(page: Page, confirm: boolean): Promise<void> {
  await waitForScene(page, 'Dialog');
  const state = await sceneState(page, 'Dialog');
  const wanted = confirm ? state.buttons[0] : state.buttons[state.buttons.length - 1];
  if (state.selected !== wanted) await press(page, 'ArrowLeft', 150);
  expect((await sceneState(page, 'Dialog')).selected).toBe(wanted);
  await press(page, 'Enter', 150);
  // Wait until this dialog has closed and the scene below (or the next dialog) takes keys again
  await expect
    .poll(async () => {
      const active = await activeScenes(page);
      // The dialog may close between the two reads; then there is no state to compare.
      const dialog = active.includes('Dialog') ? await sceneState(page, 'Dialog') : null;
      if (dialog) return dialog.message !== state.message;
      return active.some((key) => key !== 'Dialog');
    }, { timeout: 30_000 })
    .toBe(true);
  await page.waitForTimeout(400);
}

test('Ctrl+Shift+K kesken pelin: peli odottaa, ja peruutus palaa peliin ennallaan', async ({ page }) => {
  await openGame(page);
  await createPlayer(page, 'Keskeyttäjä');
  await press(page, 'Enter');
  await waitForScene(page, 'Arvoitukset');
  await waitForState(page, 'Arvoitukset', (s) => s.phase === 'answering' && s.elapsedMs > 0);
  await page.keyboard.press('Control+Shift+KeyK');
  await waitForScene(page, 'Password');
  const paused = await sceneState(page, 'Arvoitukset');
  await typeText(page, 'xyz'); // goes to the password field, not to the game
  await page.waitForTimeout(800);
  expect(await sceneState(page, 'Arvoitukset')).toEqual(paused);
  await press(page, 'Escape', 400);
  await waitForScene(page, 'Arvoitukset');
  await waitForState(page, 'Arvoitukset', (s) => s.elapsedMs > paused.elapsedMs || s.phase !== 'answering');
  expect((await sceneState(page, 'Arvoitukset')).index).toBe(paused.index);
  await expectNoRuntimeErrors(page);
});

test('tuloksen muutos, poisto ja pelin antaminen uudelleen', async ({ page }) => {
  await openGame(page, EVENING);
  await openCorrection(page);
  await chooseAction(page, 'Tulokset ja korjaukset');
  expect((await sceneState(page, 'Correction')).mode).toBe('grid');

  // Aino: muuta tulosta → 640
  await press(page, 'Enter', 400);
  expect((await sceneState(page, 'Correction')).popup).toBe('Muuta tulosta');
  await press(page, 'Enter');
  await waitForScene(page, 'Prompt');
  for (let i = 0; i < 4; i++) await press(page, 'Backspace', 60);
  await typeText(page, '1500');
  await press(page, 'Enter', 300);
  expect((await sceneState(page, 'Prompt')).error).toMatch(/0–1000/);
  for (let i = 0; i < 4; i++) await press(page, 'Backspace', 60);
  await typeText(page, '640');
  await press(page, 'Enter', 150);
  await waitForScene(page, 'Correction');
  expect((await savedData(page)).players[0].games.arvoitukset).toMatchObject({ manualScore: 640, finished: true });

  // Aino: poista tulos
  await press(page, 'Enter', 400);
  await press(page, 'ArrowDown');
  expect((await sceneState(page, 'Correction')).popup).toBe('Poista tulos');
  await press(page, 'Enter');
  await answerDialog(page, true);
  expect((await savedData(page)).players[0].games.arvoitukset).toBeUndefined();

  // Eero: anna peli uudelleen ja aloita vuoro heti
  await press(page, 'ArrowDown');
  expect((await sceneState(page, 'Correction')).cell).toEqual({ player: 'Eero', gameId: 'arvoitukset' });
  await press(page, 'Enter', 400);
  await press(page, 'ArrowDown');
  await press(page, 'ArrowDown');
  expect((await sceneState(page, 'Correction')).popup).toBe('Anna peli uudelleen');
  await press(page, 'Enter');
  await answerDialog(page, true);
  await answerDialog(page, true); // "Aloita nyt"
  // Pasi 23.10.: Eero's tournament continues with the game given again
  await waitForScene(page, 'Instructions');
  expect(await sceneState(page, 'Instructions')).toMatchObject({ gameId: 'arvoitukset', resumes: false });
  expect((await savedData(page)).players[1].games.arvoitukset).toBeUndefined();
  expect((await savedData(page)).players[1].finishedAt).toBeNull();
  await expectNoRuntimeErrors(page);
});

test('kesken jäänyt vuoro jatkuu korjaustilasta seuraavasta turnauspelistä', async ({ page }) => {
  await openGame(page, savedEvening([{ id: 'k', name: 'Katkonainen', games: riddles(300) }]));
  // Declining the offer to continue at the lock, the turn can still be continued in correction mode.
  await openCorrection(page);
  await chooseAction(page, 'Jatka kesken jäänyttä vuoroa');
  expect((await sceneState(page, 'Correction')).popup).toBe('Katkonainen');
  await press(page, 'Enter');
  await waitForScene(page, 'Instructions');
  expect((await sceneState(page, 'Instructions')).gameId).toBe('lentopeli');
  await expectNoRuntimeErrors(page);
});

test('ei JSON-varmuuskopioita; CSV, pelaajan poisto ja tyhjennys kahdella vahvistuksella', async ({ page }) => {
  await openGame(page, EVENING);
  await openCorrection(page);
  const downloads: string[] = [];
  page.on('download', (d) => downloads.push(d.suggestedFilename()));

  // Pasi 20.10.: JSON-varmuuskopiot pois käytöstä, joten valikossa ei ole niitä
  const labels: string[] = [(await sceneState(page, 'Correction')).action];
  for (let i = 0; i < 8; i++) {
    await press(page, 'ArrowDown', 120);
    labels.push((await sceneState(page, 'Correction')).action);
  }
  expect([...new Set(labels)]).toEqual([
    'Tulokset ja korjaukset',
    'Jatka kesken jäänyttä vuoroa',
    'Vie tulokset CSV-tiedostona',
    'Poista pelaaja',
    'Tyhjennä kaikki tulokset',
    'Poistu korjaustilasta',
  ]);
  for (let i = 0; i < 8; i++) await press(page, 'ArrowUp', 120);

  const csvDownload = page.waitForEvent('download');
  await chooseAction(page, 'Vie tulokset CSV-tiedostona');
  const csvFile = await csvDownload;
  expect(csvFile.suggestedFilename()).toMatch(/^halloween-tulokset-.*\.csv$/);
  const csv = await readFile((await csvFile.path())!, 'utf8');
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv.slice(1).split('\r\n').slice(0, 2)).toEqual(['Sija;Nimi;Enteet;Yölento;Kiirastuli;MonsterSlayer3000;Piiritys;Yhteensä', '1;Aino;800;;;;;800']);

  // Pelaajan poisto
  await chooseAction(page, 'Poista pelaaja');
  await press(page, 'ArrowDown');
  await press(page, 'ArrowDown');
  expect((await sceneState(page, 'Correction')).popup).toBe('Testi');
  await press(page, 'Enter');
  await answerDialog(page, true);
  expect((await savedData(page)).players.map((p: { name: string }) => p.name)).toEqual(['Aino', 'Eero']);

  // Tyhjennys: toinen vahvistus peruttuna mitään ei tapahdu
  await chooseAction(page, 'Tyhjennä kaikki tulokset');
  await answerDialog(page, true);
  await answerDialog(page, false);
  expect((await savedData(page)).players).toHaveLength(2);
  // Kahdesti vahvistettuna tulokset tyhjenevät, eikä varmuuskopiota ladata
  await chooseAction(page, 'Tyhjennä kaikki tulokset');
  await answerDialog(page, true);
  await answerDialog(page, true);
  expect((await savedData(page)).players).toEqual([]);
  expect(downloads).toEqual([csvFile.suggestedFilename()]);

  await chooseAction(page, 'Poistu korjaustilasta');
  await waitForScene(page, 'Start');
  await expectNoRuntimeErrors(page);
});
