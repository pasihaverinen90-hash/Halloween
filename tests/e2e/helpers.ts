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
