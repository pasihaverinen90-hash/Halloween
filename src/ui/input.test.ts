import { EventEmitter } from 'node:events';
import type Phaser from 'phaser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../config';
import { guardInput, isPlainKey, isPrintableChar, markHandled, onChar, onKeys, wasHandled } from './input';

let clock = 1000;

beforeEach(() => {
  clock = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface FakeKeyOptions {
  repeat?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altGraph?: boolean;
  timeStamp?: number;
}

function keyEvent(key: string, options: FakeKeyOptions = {}): KeyboardEvent {
  return {
    key,
    repeat: options.repeat ?? false,
    ctrlKey: options.ctrlKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
    timeStamp: options.timeStamp ?? clock,
    getModifierState: (name: string) => name === 'AltGraph' && (options.altGraph ?? false),
  } as unknown as KeyboardEvent;
}

/** Just enough of a Phaser scene for the helpers: keyboard emitter, scene events and status. */
function fakeScene(key = 'Test') {
  const keyboard = new EventEmitter();
  const events = new EventEmitter();
  let running = true;
  const scene = {
    input: { keyboard },
    sys: { events, canInput: () => running, settings: { key } },
  } as unknown as Phaser.Scene;
  return {
    scene,
    /** Dispatch like Phaser does: to the keyboard plugin of a running scene. */
    deliver(event: KeyboardEvent) {
      if (running) keyboard.emit('keydown', event);
      return event;
    },
    press(key: string, options: FakeKeyOptions = {}) {
      return this.deliver(keyEvent(key, options));
    },
    pause() {
      running = false;
      events.emit('pause');
    },
    resume() {
      running = true;
      events.emit('resume');
    },
    shutdown() {
      running = false;
      events.emit('shutdown');
      keyboard.removeAllListeners();
    },
    restart() {
      running = true;
    },
  };
}

describe('key filters', () => {
  it('accepts plain keys and AltGr characters, rejects Ctrl/Alt/Meta', () => {
    expect(isPlainKey(keyEvent('a'))).toBe(true);
    expect(isPlainKey(keyEvent('A', { shiftKey: true }))).toBe(true);
    expect(isPlainKey(keyEvent('k', { ctrlKey: true }))).toBe(false);
    expect(isPlainKey(keyEvent('ArrowLeft', { altKey: true }))).toBe(false);
    expect(isPlainKey(keyEvent('r', { metaKey: true }))).toBe(false);
    // Windows reports AltGr as Ctrl + Alt.
    expect(isPlainKey(keyEvent('@', { ctrlKey: true, altKey: true, altGraph: true }))).toBe(true);
  });

  it('recognises single printable characters', () => {
    for (const ch of ['a', 'Ä', 'ö', 'å', ' ', '?', '-', '7', '€']) expect(isPrintableChar(ch)).toBe(true);
    for (const key of ['Enter', 'Dead', 'Shift', 'ArrowUp', '', '\n', '\u007f']) expect(isPrintableChar(key)).toBe(false);
  });

  it('marks events as handled', () => {
    const event = keyEvent('Enter');
    expect(wasHandled(event)).toBe(false);
    markHandled(event);
    expect(wasHandled(event)).toBe(true);
  });
});

describe('onKeys', () => {
  it('ignores Enter, Space and Esc for the start-up guard, other keys at once', () => {
    const fake = fakeScene();
    const calls: string[] = [];
    onKeys(fake.scene, {
      Enter: () => calls.push('Enter'),
      ' ': () => calls.push('Space'),
      Escape: () => calls.push('Esc'),
      ArrowDown: () => calls.push('Down'),
    });
    clock += 10;
    fake.press('Enter');
    fake.press(' ');
    fake.press('Escape');
    fake.press('ArrowDown');
    expect(calls).toEqual(['Down']);

    clock += CONFIG.ui.inputGuardMs;
    fake.press('Enter');
    fake.press(' ');
    fake.press('Escape');
    expect(calls).toEqual(['Down', 'Enter', 'Space', 'Esc']);
  });

  it('ignores keys pressed before the handler existed', () => {
    const fake = fakeScene();
    clock += 500;
    const early = keyEvent('ArrowDown', { timeStamp: clock - 5 });
    const handler = vi.fn();
    onKeys(fake.scene, { ArrowDown: handler });
    fake.deliver(early);
    expect(handler).not.toHaveBeenCalled();
    fake.press('ArrowDown');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores auto-repeat unless the key opts in', () => {
    const fake = fakeScene();
    clock += 1000;
    const enter = vi.fn();
    const down = vi.fn();
    onKeys(fake.scene, { Enter: enter, ArrowDown: down }, { allowRepeat: ['ArrowDown'] });
    fake.press('Enter', { repeat: true });
    fake.press('ArrowDown', { repeat: true });
    expect(enter).not.toHaveBeenCalled();
    expect(down).toHaveBeenCalledTimes(1);
  });

  it('ignores modified keys but not Shift', () => {
    const fake = fakeScene();
    clock += 1000;
    const tab = vi.fn();
    onKeys(fake.scene, { Tab: tab });
    fake.press('Tab', { ctrlKey: true });
    fake.press('Tab', { altKey: true });
    expect(tab).not.toHaveBeenCalled();
    fake.press('Tab', { shiftKey: true });
    expect(tab).toHaveBeenCalledTimes(1);
  });

  it('uses every event only once, across scenes and repeated dispatch', () => {
    const first = fakeScene('A');
    const second = fakeScene('B');
    const a = vi.fn();
    const b = vi.fn();
    onKeys(first.scene, { Enter: a });
    onKeys(second.scene, { Enter: b });
    clock += 1000;
    const event = first.press('Enter');
    second.deliver(event);
    first.deliver(event); // Phaser can re-dispatch queued events within a frame
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    expect(wasHandled(event)).toBe(true);
  });

  it('passes the key on when a handler returns false', () => {
    const host = fakeScene('Host');
    const overlay = fakeScene('Overlay');
    const hostEnter = vi.fn(() => false);
    const overlayEnter = vi.fn();
    onKeys(host.scene, { Enter: hostEnter });
    onKeys(overlay.scene, { Enter: overlayEnter });
    clock += 1000;
    const event = host.press('Enter');
    overlay.deliver(event);
    expect(hostEnter).toHaveBeenCalledTimes(1);
    expect(overlayEnter).toHaveBeenCalledTimes(1);
    expect(wasHandled(event)).toBe(true);
  });

  it('leaves keys without a handler unhandled', () => {
    const fake = fakeScene();
    clock += 1000;
    onKeys(fake.scene, { Enter: vi.fn() });
    expect(wasHandled(fake.press('Escape'))).toBe(false);
    expect(wasHandled(fake.press('toString'))).toBe(false);
  });

  it('gets nothing while paused and ignores events older than the resume', () => {
    const fake = fakeScene();
    const enter = vi.fn();
    onKeys(fake.scene, { Enter: enter });
    clock += 1000;
    fake.pause();
    fake.press('Enter');
    const closingEnter = keyEvent('Enter', { timeStamp: clock });
    clock += 5;
    fake.resume();
    fake.deliver(closingEnter); // the Enter that closed the overlay above
    expect(enter).not.toHaveBeenCalled();
    clock += 5;
    fake.press('Enter');
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it('stops after unsubscribe', () => {
    const fake = fakeScene();
    clock += 1000;
    const enter = vi.fn();
    const off = onKeys(fake.scene, { Enter: enter });
    off();
    off();
    fake.press('Enter');
    expect(enter).not.toHaveBeenCalled();
  });

  it('starts a fresh guard when the scene restarts', () => {
    const fake = fakeScene();
    onKeys(fake.scene, { Enter: vi.fn() });
    clock += 1000;
    fake.shutdown();
    fake.restart();
    const enter = vi.fn();
    onKeys(fake.scene, { Enter: enter });
    clock += 10;
    fake.press('Enter');
    expect(enter).not.toHaveBeenCalled();
    clock += CONFIG.ui.inputGuardMs;
    fake.press('Enter');
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it('guardInput re-arms the confirm guard', () => {
    const fake = fakeScene();
    clock += 1000;
    const enter = vi.fn();
    onKeys(fake.scene, { Enter: enter });
    guardInput(fake.scene, 200);
    clock += 100;
    fake.press('Enter');
    expect(enter).not.toHaveBeenCalled();
    clock += 150;
    fake.press('Enter');
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it('treats implausible event timestamps as "now"', () => {
    const fake = fakeScene();
    clock += 1000;
    const down = vi.fn();
    onKeys(fake.scene, { ArrowDown: down });
    clock += 1;
    fake.press('ArrowDown', { timeStamp: 0 });
    fake.press('ArrowDown', { timeStamp: Date.now() });
    expect(down).toHaveBeenCalledTimes(2);
  });

  it('accepts legacy key names', () => {
    const fake = fakeScene();
    const esc = vi.fn();
    onKeys(fake.scene, { Escape: esc });
    clock += 1000;
    fake.press('Esc');
    expect(esc).toHaveBeenCalledTimes(1);
  });
});

describe('onChar', () => {
  it('passes printable characters including Finnish letters and space', () => {
    const fake = fakeScene();
    const typed: string[] = [];
    onChar(fake.scene, (ch) => typed.push(ch));
    clock += 1;
    for (const key of ['P', 'ä', 'Ö', 'å', '1', '?']) fake.press(key);
    clock += CONFIG.ui.inputGuardMs;
    fake.press(' ');
    expect(typed).toEqual(['P', 'ä', 'Ö', 'å', '1', '?', ' ']);
  });

  it('ignores named keys, dead keys, repeats and Ctrl shortcuts but allows AltGr', () => {
    const fake = fakeScene();
    clock += 1000;
    const typed: string[] = [];
    onChar(fake.scene, (ch) => typed.push(ch));
    fake.press('Enter');
    fake.press('Backspace');
    fake.press('Dead');
    fake.press('a', { repeat: true });
    fake.press('c', { ctrlKey: true });
    fake.press('@', { ctrlKey: true, altKey: true, altGraph: true });
    expect(typed).toEqual(['@']);
  });

  it('does not take keys already used by onKeys in the same scene', () => {
    const fake = fakeScene();
    const space = vi.fn();
    const typed: string[] = [];
    onKeys(fake.scene, { ' ': space });
    onChar(fake.scene, (ch) => typed.push(ch));
    clock += 1000;
    fake.press(' ');
    expect(space).toHaveBeenCalledTimes(1);
    expect(typed).toEqual([]);
  });
});
