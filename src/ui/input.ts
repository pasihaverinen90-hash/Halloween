import type Phaser from 'phaser';
import { CONFIG } from '../config';

/*
 * Keyboard helpers for every screen and game. Never use raw
 * this.input.keyboard.on(...) in screens or games; use these instead.
 *
 * Phaser hands each key event to EVERY running scene (in the order the scenes
 * were started), and an event can even reach the same scene twice when
 * several keys arrive within one frame. These helpers make every key press
 * count exactly once:
 *  - a handler that runs marks the event as handled, and every helper skips
 *    handled events (in all scenes);
 *  - events with Ctrl, Meta or Alt are ignored (AltGr characters are allowed);
 *  - auto-repeat is ignored unless a key opts in (e.g. arrows in menus);
 *  - stale events are ignored: a key pressed before the handler existed or
 *    before the scene was resumed never triggers it, and Enter, Space and Esc
 *    are ignored for CONFIG.ui.inputGuardMs after a screen opens, so a held or
 *    double-tapped Enter cannot skip a screen.
 * Handlers run only while their scene is running (not paused or sleeping).
 */

export type NamedKey =
  | 'Enter'
  | 'Escape'
  | 'Backspace'
  | 'Delete'
  | 'Tab'
  | ' '
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown';

const NAMED_KEYS: ReadonlySet<string> = new Set<NamedKey>([
  'Enter',
  'Escape',
  'Backspace',
  'Delete',
  'Tab',
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

/** Confirm/cancel keys get the extra start-up guard (CONFIG.ui.inputGuardMs). */
const GUARDED_KEYS: ReadonlySet<string> = new Set(['Enter', ' ', 'Escape']);

/** Legacy key names reported by some older browsers. */
const KEY_ALIASES: Readonly<Record<string, string>> = {
  Esc: 'Escape',
  Spacebar: ' ',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Del: 'Delete',
};

const HANDLED_FLAG = '__peliHandled';

/** Mark the event as used, so no other helper (in any scene) reacts to it. */
export function markHandled(event: KeyboardEvent): void {
  (event as unknown as Record<string, unknown>)[HANDLED_FLAG] = true;
}

/** True when a helper has already used this event. */
export function wasHandled(event: KeyboardEvent): boolean {
  return (event as unknown as Record<string, unknown>)[HANDLED_FLAG] === true;
}

/** No Ctrl, Meta or Alt held, except AltGr (which types characters such as @ € { on Finnish keyboards). */
export function isPlainKey(event: KeyboardEvent): boolean {
  const altGraph = typeof event.getModifierState === 'function' && event.getModifierState('AltGraph');
  if (altGraph) return true;
  return !event.ctrlKey && !event.metaKey && !event.altKey;
}

/** The event's layout-aware key ('ä', 'Ä', 'Enter', 'ArrowUp', ' ' …), legacy names normalised. */
export function keyOf(event: KeyboardEvent): string {
  return KEY_ALIASES[event.key] ?? event.key;
}

/** True for a single printable character (a letter, digit, space, punctuation…), false for 'Enter', 'Dead' etc. */
export function isPrintableChar(key: string): boolean {
  const chars = Array.from(key);
  if (chars.length !== 1) return false;
  const code = chars[0].codePointAt(0) ?? 0;
  return code >= 0x20 && code !== 0x7f && !(code >= 0x80 && code < 0xa0);
}

/** When the scene last (re)started or resumed, per key group. */
interface SceneGuard {
  /** Events older than this are ignored (all keys). */
  readyAt: number;
  /** Enter, Space and Esc: events older than this are ignored. */
  guardedReadyAt: number;
}

const guards = new WeakMap<Phaser.Scene, SceneGuard>();

/**
 * The scene's guard, created on first use in each run of the scene (normally
 * in create()) and refreshed whenever the scene resumes or wakes. Phaser
 * reuses scene objects, so the guard is forgotten when the scene shuts down.
 */
function guardFor(scene: Phaser.Scene): SceneGuard {
  const existing = guards.get(scene);
  if (existing) return existing;

  const now = performance.now();
  const guard: SceneGuard = { readyAt: now, guardedReadyAt: now + CONFIG.ui.inputGuardMs };
  const events = scene.sys.events;
  const refresh = (): void => {
    const time = performance.now();
    guard.readyAt = Math.max(guard.readyAt, time);
    guard.guardedReadyAt = Math.max(guard.guardedReadyAt, time);
  };
  const forget = (): void => {
    events.off('resume', refresh);
    events.off('wake', refresh);
    events.off('shutdown', forget);
    events.off('destroy', forget);
    if (guards.get(scene) === guard) guards.delete(scene);
  };
  // Phaser.Scenes.Events.RESUME / WAKE / SHUTDOWN / DESTROY
  events.on('resume', refresh);
  events.on('wake', refresh);
  events.once('shutdown', forget);
  events.once('destroy', forget);
  guards.set(scene, guard);
  return guard;
}

/**
 * Ignore Enter, Space and Esc in this scene for `ms` milliseconds from now.
 * Use it when a scene swaps to a new view without restarting (the guard is
 * applied automatically when a scene starts).
 */
export function guardInput(scene: Phaser.Scene, ms: number = CONFIG.ui.inputGuardMs): void {
  const guard = guardFor(scene);
  guard.guardedReadyAt = Math.max(guard.guardedReadyAt, performance.now() + ms);
}

/**
 * The event's time on the performance.now() clock. Implausible values (a
 * browser using another clock) count as "now" so input never gets stuck.
 */
function eventTime(event: KeyboardEvent): number {
  const now = performance.now();
  const time = event.timeStamp;
  if (!Number.isFinite(time) || time <= 0 || time > now + 1000 || time < now - 10000) return now;
  return time;
}

/**
 * Subscribe to keydown events of the scene with all the filtering above.
 * `take` returns true when it used the event (it is then marked handled).
 */
function listen(
  scene: Phaser.Scene,
  take: (event: KeyboardEvent, key: string) => boolean,
  repeatAllowed: (key: string) => boolean,
): () => void {
  const keyboard = scene.input?.keyboard;
  if (!keyboard) {
    console.warn(`Näppäimistö ei ole käytössä näkymässä ${scene.sys.settings.key}.`);
    return () => undefined;
  }
  const guard = guardFor(scene);
  const since = performance.now();

  const listener = (event: KeyboardEvent): void => {
    if (wasHandled(event)) return;
    // The scene may have been paused by an earlier handler of the same event.
    if (!scene.sys.canInput()) return;
    const key = keyOf(event);
    if (event.repeat && !repeatAllowed(key)) return;
    if (!isPlainKey(event)) return;
    const time = eventTime(event);
    if (time < since) return;
    if (time < (GUARDED_KEYS.has(key) ? guard.guardedReadyAt : guard.readyAt)) return;
    take(event, key);
  };

  keyboard.on('keydown', listener);
  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    keyboard.off('keydown', listener);
  };
}

/**
 * Handlers for named keys. Returns an unsubscribe function (listeners are
 * also removed automatically when the scene shuts down).
 * A handler that returns `false` did not use the key: the event is then not
 * marked handled and stays available to other scenes (e.g. an overlay).
 *
 * @example onKeys(this, { Enter: () => this.start(), Escape: () => this.back() });
 * @example onKeys(this, { ArrowUp: up, ArrowDown: down }, { allowRepeat: ['ArrowUp', 'ArrowDown'] });
 */
export function onKeys(
  scene: Phaser.Scene,
  handlers: Partial<Record<NamedKey, (event: KeyboardEvent) => unknown>>,
  options: { allowRepeat?: NamedKey[] } = {},
): () => void {
  const repeatable = new Set<string>(options.allowRepeat ?? []);
  return listen(
    scene,
    (event, key) => {
      if (!NAMED_KEYS.has(key) || !Object.prototype.hasOwnProperty.call(handlers, key)) return false;
      const handler = handlers[key as NamedKey];
      if (!handler) return false;
      if (handler(event) === false) return false;
      markHandled(event);
      return true;
    },
    (key) => repeatable.has(key),
  );
}

/**
 * Printable characters, one at a time (layout-aware: 'ä', 'Ä', '?', ' ' …).
 * Auto-repeat is ignored. Compare letters with toLocaleUpperCase('fi-FI').
 */
export function onChar(scene: Phaser.Scene, handler: (char: string, event: KeyboardEvent) => void): () => void {
  return listen(
    scene,
    (event, key) => {
      if (!isPrintableChar(key)) return false;
      markHandled(event);
      handler(key, event);
      return true;
    },
    () => false,
  );
}

/** Which of the watched keys are held down right now. */
export interface HeldKeys {
  isDown(key: NamedKey): boolean;
  /** True once for every new press of the key since the last call (a tap shorter than one frame still counts, and so does each of two quick taps). */
  takePress(key: NamedKey): boolean;
}

/**
 * Track keys that act while held (e.g. moving sideways). A key counts as held
 * from its keydown in this scene until its keyup. Everything is released when
 * the scene pauses, resumes or sleeps and when the window loses focus, so a
 * key let go during a pause never keeps moving the player.
 */
export function heldKeys(scene: Phaser.Scene, keys: NamedKey[]): HeldKeys {
  const watched = new Set<string>(keys);
  const down = new Set<string>();
  const keyboard = scene.input?.keyboard;
  if (!keyboard) {
    console.warn(`Näppäimistö ei ole käytössä näkymässä ${scene.sys.settings.key}.`);
    return { isDown: () => false, takePress: () => false };
  }
  /** Presses not taken yet, per key: two taps within one frame are two presses. */
  const pressed = new Map<string, number>();
  const onDown = (event: KeyboardEvent): void => {
    const key = keyOf(event);
    if (!watched.has(key) || wasHandled(event) || !isPlainKey(event) || !scene.sys.canInput()) return;
    markHandled(event);
    down.add(key);
    if (!event.repeat) pressed.set(key, (pressed.get(key) ?? 0) + 1);
  };
  const onUp = (event: KeyboardEvent): void => {
    down.delete(keyOf(event));
  };
  const releaseAll = (): void => {
    down.clear();
    pressed.clear();
  };
  const events = scene.sys.events;
  keyboard.on('keydown', onDown);
  keyboard.on('keyup', onUp);
  window.addEventListener('blur', releaseAll);
  for (const name of ['pause', 'resume', 'sleep', 'wake']) events.on(name, releaseAll);
  events.once('shutdown', () => {
    keyboard.off('keydown', onDown);
    keyboard.off('keyup', onUp);
    window.removeEventListener('blur', releaseAll);
    for (const name of ['pause', 'resume', 'sleep', 'wake']) events.off(name, releaseAll);
  });
  return {
    isDown: (key) => down.has(key),
    takePress: (key) => {
      const count = pressed.get(key) ?? 0;
      if (count <= 0) return false;
      if (count === 1) pressed.delete(key);
      else pressed.set(key, count - 1);
      return true;
    },
  };
}
