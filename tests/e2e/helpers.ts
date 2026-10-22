import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/*
 * Helpers for driving the game with the keyboard. The game draws on a canvas,
 * so tests read what is on screen through window.__peli (src/testHooks.ts).
 */

export const STORAGE_KEY = 'halloween-peli-ilta:v1';
export const PASSWORD = 'Pasi1234';

/** Open the game with the given saved data (or empty results). */
export async function openGame(page: Page, data: unknown = null): Promise<void> {
  await page.goto('./');
  await page.evaluate(
    ([key, value]) => {
      window.localStorage.clear();
      if (value) window.localStorage.setItem(key as string, JSON.stringify(value));
    },
    [STORAGE_KEY, data] as const,
  );
  await page.reload();
  await unlock(page);
}

/**
 * Pasi's password opens the game (every page load). If a turn was left
 * unfinished, the game offers to continue it: continueTurn chooses.
 */
export async function unlock(page: Page, continueTurn = false): Promise<void> {
  await waitForScene(page, 'Password');
  await typeText(page, PASSWORD);
  await press(page, 'Enter');
  await expect
    .poll(async () => {
      const active = await activeScenes(page);
      return active.includes('Start') || active.includes('Dialog') || active.includes('Menu');
    }, { timeout: 30_000 })
    .toBe(true);
  if ((await activeScenes(page)).includes('Dialog')) {
    await page.waitForTimeout(350);
    const state = await sceneState(page, 'Dialog');
    const wanted = continueTurn ? state.buttons[0] : state.buttons[state.buttons.length - 1];
    if (state.selected !== wanted) await press(page, 'ArrowLeft', 150);
    await press(page, 'Enter');
  }
  await waitForScene(page, continueTurn ? 'Menu' : 'Start');
}

/** Thanks screen: Enter and Pasi's password let the next player in. */
export async function nextPlayer(page: Page): Promise<void> {
  await press(page, 'Enter');
  await waitForScene(page, 'Password');
  await typeText(page, PASSWORD);
  await press(page, 'Enter');
  await waitForScene(page, 'Start');
}

/** Wait until the scene is running (and past its short input guard). */
export async function waitForScene(page: Page, key: string, timeout = 30_000): Promise<void> {
  await page.waitForFunction((k) => window.__peli?.activeScenes().includes(k) ?? false, key, { timeout, polling: 100 });
  await page.waitForTimeout(350);
}

export async function activeScenes(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__peli?.activeScenes() ?? []);
}

/** getTestState() of a running scene. */
export async function sceneState<T = any>(page: Page, key: string): Promise<T> {
  return page.evaluate((k) => window.__peli?.sceneStates()[k], key) as Promise<T>;
}

/** Wait until a scene's test state satisfies the predicate (written as a string-free function of the state). */
export async function waitForState(page: Page, key: string, predicate: (state: any) => boolean, timeout = 60_000): Promise<void> {
  await expect.poll(async () => predicate(await sceneState(page, key)), { timeout, intervals: [100, 250, 500] }).toBe(true);
}

/** Saved data exactly as in localStorage. */
export async function savedData<T = any>(page: Page): Promise<T> {
  return page.evaluate(() => window.__peli?.saved()) as Promise<T>;
}

export async function runtimeErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__peli?.errors ?? []);
}

/** Press a key ('Enter', 'Escape', 'ArrowDown', …) and give the game a moment to react. */
export async function press(page: Page, key: string, pauseMs = 200): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForTimeout(pauseMs);
}

/**
 * Type text. Playwright cannot press keys that are not on a US keyboard
 * (ä, ö, å), so those are sent as synthetic keyboard events — the game only
 * looks at event.key, exactly as with a real Finnish keyboard.
 */
export async function typeText(page: Page, text: string, pauseMs = 50): Promise<void> {
  for (const char of text) {
    if (/^[\x20-\x7e]$/.test(char)) {
      await page.keyboard.press(char === ' ' ? 'Space' : char);
    } else {
      await page.evaluate((key) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      }, char);
    }
    await page.waitForTimeout(pauseMs);
  }
}

/** Create a player on the start screen and go to the menu. */
export async function createPlayer(page: Page, name: string): Promise<void> {
  await typeText(page, name);
  await press(page, 'Enter');
  await waitForScene(page, 'Menu');
}

/** Hangman: guess the given wrong letters, then every letter of the current phrase. */
export async function solveHangmanWord(page: Page, wrongLetters = ''): Promise<void> {
  await typeText(page, wrongLetters, 80);
  const state = await sceneState(page, 'Hirsipuu');
  const letters = [...new Set([...(state.phrase as string)].filter((c) => /[A-ZÅÄÖ]/.test(c)))];
  await typeText(page, letters.join('').toLocaleLowerCase('fi-FI'), 80);
  await waitForState(page, 'Hirsipuu', (s) => s.phase === 'wordDone' || s.phase === 'finished');
}

/** Hangman: fail the current word with eight wrong letters. */
export async function failHangmanWord(page: Page): Promise<void> {
  const state = await sceneState(page, 'Hirsipuu');
  const inWord = new Set([...(state.phrase as string)]);
  const wrong = [...'BCDFGJQWXZÅÖÄEMNOPRSTUVYHIKLA'].filter((c) => !inWord.has(c)).slice(0, 8);
  await typeText(page, wrong.join('').toLocaleLowerCase('fi-FI'), 80);
  await waitForState(page, 'Hirsipuu', (s) => s.phase === 'wordDone');
}

/** Open correction mode with Ctrl+Shift+K and the password. */
export async function openCorrection(page: Page): Promise<void> {
  await page.keyboard.press('Control+Shift+KeyK');
  await waitForScene(page, 'Password');
  await typeText(page, PASSWORD);
  await press(page, 'Enter');
  await waitForScene(page, 'Correction');
}

/** Fail the test if the game reported runtime errors. */
export async function expectNoRuntimeErrors(page: Page): Promise<void> {
  expect(await runtimeErrors(page)).toEqual([]);
}

/** Saved data with players in the given state (for tests that start mid-evening). */
export function savedEvening(players: Array<{ id: string; name: string; games?: Record<string, unknown>; finished?: boolean }>): unknown {
  const now = '2026-10-31T19:00:00.000Z';
  return {
    app: 'halloween-peli-ilta',
    version: 1,
    updatedAt: now,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: now,
      finishedAt: p.finished ? now : null,
      games: p.games ?? {},
    })),
  };
}

/** A finished hangman record with the given score. */
export function hangman(score: number, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { hirsipuu: { attempts: [score], finished: true, checkpoint: null, manualScore: null, updatedAt: '2026-10-31T19:00:00.000Z', ...extra } };
}

/**
 * Riddles: answer the current riddle. 'correct' picks/types the right answer,
 * 'wrong' picks a wrong option (multiple choice) or types a wrong answer once
 * before the right one (open). Waits until the result is shown.
 */
export async function answerRiddle(page: Page, how: 'correct' | 'wrong'): Promise<void> {
  const state = await sceneState(page, 'Arvoitukset');
  if (state.kind === 'monivalinta') {
    const target = how === 'correct' ? state.answers[0] : state.options.find((o: string) => o !== state.answers[0]);
    const index = state.options.indexOf(target);
    const moves = [[], ['ArrowRight'], ['ArrowDown'], ['ArrowDown', 'ArrowRight']][index];
    for (const key of moves) await press(page, key, 120);
    await press(page, 'Enter');
  } else {
    if (how === 'wrong') {
      await typeText(page, 'väärä vastaus');
      await press(page, 'Enter', 300);
    }
    await typeText(page, (state.answers[0] as string).toLocaleLowerCase('fi-FI'));
    await press(page, 'Enter');
  }
  await waitForState(page, 'Arvoitukset', (s) => s.phase === 'done');
}

/** Riddles: from the instruction screen, answer every riddle correctly. Returns the round score. */
export async function playRiddlesCorrectly(page: Page): Promise<number> {
  await press(page, 'Enter');
  await waitForScene(page, 'Arvoitukset');
  for (let index = 0; index < 10; index++) {
    await waitForState(page, 'Arvoitukset', (s) => s.index === index && s.phase === 'answering');
    await answerRiddle(page, 'correct');
    await press(page, 'Enter');
  }
  await waitForScene(page, 'AttemptResult');
  return (await sceneState(page, 'AttemptResult')).score as number;
}

/** Flying game: from the instruction screen, play three quick attempts (each crashes at the first obstacle). Returns the best score. */
export async function playFlightQuickly(page: Page): Promise<number> {
  await press(page, 'Enter');
  for (let attempt = 1; attempt <= 3; attempt++) {
    await waitForScene(page, 'AttemptIntro');
    await press(page, 'Enter');
    await waitForScene(page, 'Lentopeli');
    await press(page, 'Space');
    await page.evaluate(() => {
      const scene = (window.__peli!.game as any).scene.getScene('Lentopeli');
      const gate = scene.course[0]; // always a cage above and an inquisitor below
      scene.debugPlace(gate.x - 10, gate.blocks[1].top + 40);
    });
    await waitForScene(page, 'AttemptResult', 120_000);
    if (attempt < 3) await press(page, 'Enter');
  }
  return (await sceneState(page, 'AttemptResult')).best as number;
}

/** Menu: move the selection to the game with this id. */
export async function selectGame(page: Page, id: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const menu = await sceneState(page, 'Menu');
    if (menu.selected === id) return;
    const ids = menu.tiles.map((t: { id: string }) => t.id);
    await press(page, ids.indexOf(id) > ids.indexOf(menu.selected) ? 'ArrowRight' : 'ArrowLeft', 150);
  }
  expect((await sceneState(page, 'Menu')).selected).toBe(id);
}

/** Shooter: from the instruction screen, play three quick attempts (the pope falls at once). Returns the best score. */
export async function playShooterQuickly(page: Page): Promise<number> {
  await press(page, 'Enter');
  for (let attempt = 1; attempt <= 3; attempt++) {
    await waitForScene(page, 'AttemptIntro');
    await press(page, 'Enter');
    await waitForScene(page, 'Raiskinta');
    await page.evaluate(() => (window.__peli!.game as any).scene.getScene('Raiskinta').debugHurt(10));
    await waitForScene(page, 'AttemptResult', 120_000);
    if (attempt < 3) await press(page, 'Enter');
  }
  return (await sceneState(page, 'AttemptResult')).best as number;
}

/** Platformer: from the instruction screen, lose all hearts in every attempt (5, each continuing the last). Returns the best score. */
export async function playPlatformerQuickly(page: Page): Promise<number> {
  await press(page, 'Enter');
  for (;;) {
    await waitForScene(page, 'AttemptIntro');
    await press(page, 'Enter');
    await waitForScene(page, 'Tasohyppely');
    await page.evaluate(() => (window.__peli!.game as any).scene.getScene('Tasohyppely').debugHurt(99));
    await waitForScene(page, 'AttemptResult', 120_000);
    const result = await sceneState(page, 'AttemptResult');
    if (result.isFinal) return result.best as number;
    await press(page, 'Enter');
  }
}

/** Catapult: from the instruction screen, clear all five levels with one shot per skeleton (1000 ends the game). Returns the score. */
export async function playCatapultQuickly(page: Page): Promise<number> {
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptIntro');
  await press(page, 'Enter');
  await waitForScene(page, 'Kurpitsalinko');
  for (let level = 0; level < 5; level++) {
    await waitForState(page, 'Kurpitsalinko', (s) => s.level === level && s.phase !== 'levelDone', 60_000);
    await page.evaluate(() => {
      const scene = (window.__peli!.game as any).scene.getScene('Kurpitsalinko');
      scene.debugClearLevel(scene.battle.skeletonsLeft());
    });
    await waitForState(page, 'Kurpitsalinko', (s) => s.level > level || s.phase === 'won', 60_000);
  }
  await waitForScene(page, 'AttemptResult', 120_000);
  return (await sceneState(page, 'AttemptResult')).score as number;
}

/** Crossword: from the instruction screen, let the time run out at once. Returns the score. */
export async function playCrosswordQuickly(page: Page): Promise<number> {
  await press(page, 'Enter');
  await waitForScene(page, 'Ristikko', 60_000);
  await page.evaluate(() => {
    (window.__peli!.game as any).scene.getScene('Ristikko').crossword.secondsLeft = 0.2;
  });
  await waitForState(page, 'Ristikko', (s) => s.phase === 'timeout');
  await press(page, 'Enter');
  await waitForScene(page, 'AttemptResult');
  return (await sceneState(page, 'AttemptResult')).score as number;
}
