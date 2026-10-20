import { CONFIG } from '../config';
import type { NoiseOptions, Sfx, SfxName, ToneOptions } from './types';

/*
 * Sound effects synthesised with Web Audio: no sound files. Everything is
 * short, soft and quiet, because Pasi plays music at the same time
 * (master volume CONFIG.audio.masterVolume).
 *
 * Browser-only, but safe to import anywhere: nothing touches window until the
 * first sound is played, and every failure is swallowed (a missing sound must
 * never break the game).
 */

interface Engine {
  ctx: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
}

let engine: Engine | null = null;
let unavailable = false;
let activeVoices = 0;
const lastPlayed = new Map<SfxName, number>();

/** Never let a burst of sounds (e.g. a held key) pile up. */
const MAX_VOICES = 40;
/** The same named sound is not restarted faster than this (seconds). */
const MIN_REPEAT_GAP = 0.03;
/** Silence floor for exponential envelopes. */
const FLOOR = 0.0001;

function getEngine(): Engine | null {
  if (unavailable || typeof window === 'undefined') return null;
  try {
    if (!engine) {
      // Browsers only allow audio after the user has pressed a key; until then stay silent.
      const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
      if (activation && !activation.hasBeenActive) return null;
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        unavailable = true;
        return null;
      }
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = CONFIG.audio.masterVolume;
      master.connect(ctx.destination);
      engine = { ctx, master, noise: createNoiseBuffer(ctx) };
    }
    const state = engine.ctx.state as AudioContextState | 'interrupted';
    if (state === 'suspended' || state === 'interrupted') {
      engine.ctx.resume().catch(() => undefined);
    }
    return engine;
  } catch {
    unavailable = true;
    return null;
  }
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Track a node chain so the voice limit works and nodes are released. */
function track(source: AudioScheduledSourceNode, nodes: AudioNode[]): void {
  activeVoices++;
  source.onended = () => {
    activeVoices = Math.max(0, activeVoices - 1);
    for (const node of nodes) {
      try {
        node.disconnect();
      } catch {
        // already disconnected
      }
    }
  };
}

/** Gain with a soft attack and an exponential decay to silence at `end`. */
function envelope(ctx: AudioContext, start: number, attack: number, end: number, peak: number, hold = 0): GainNode {
  const gain = ctx.createGain();
  const top = Math.max(peak, FLOOR * 2);
  const attackEnd = start + Math.max(0.001, attack);
  const holdEnd = Math.min(Math.max(attackEnd, attackEnd + hold), end - 0.005);
  gain.gain.setValueAtTime(FLOOR, start);
  gain.gain.exponentialRampToValueAtTime(top, attackEnd);
  if (holdEnd > attackEnd) gain.gain.setValueAtTime(top, holdEnd);
  gain.gain.exponentialRampToValueAtTime(FLOOR, Math.max(end, holdEnd + 0.01));
  return gain;
}

interface VoiceOptions extends ToneOptions {
  /** Fraction of the duration the note stays at full volume before decaying (0..1). */
  hold?: number;
  /** Detune in cents. */
  detune?: number;
  /** Optional low-pass filter: cutoff at start, glide target, resonance. */
  lowpass?: { from: number; to?: number; q?: number };
  /** Vibrato depth in Hz and rate in Hz. */
  vibrato?: { depth: number; rate: number };
}

function voice(options: VoiceOptions): void {
  const audio = getEngine();
  if (!audio || activeVoices >= MAX_VOICES) return;
  const { ctx, master } = audio;
  const start = ctx.currentTime + Math.max(0, options.delay ?? 0) + 0.005;
  const duration = Math.max(0.02, options.duration);
  const end = start + duration;
  const volume = Math.min(Math.max(options.volume ?? 0.5, 0), 1);
  if (volume <= 0 || !(options.freq > 0)) return;

  const osc = ctx.createOscillator();
  osc.type = options.type ?? 'sine';
  osc.frequency.setValueAtTime(options.freq, start);
  if (options.slideTo !== undefined && options.slideTo > 0) {
    osc.frequency.exponentialRampToValueAtTime(options.slideTo, end);
  }
  if (options.detune) osc.detune.setValueAtTime(options.detune, start);

  const nodes: AudioNode[] = [osc];
  let tail: AudioNode = osc;

  if (options.vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = options.vibrato.rate;
    depth.gain.value = options.vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(start);
    lfo.stop(end + 0.05);
    nodes.push(lfo, depth);
  }

  if (options.lowpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = options.lowpass.q ?? 0.7;
    filter.frequency.setValueAtTime(options.lowpass.from, start);
    if (options.lowpass.to) filter.frequency.exponentialRampToValueAtTime(options.lowpass.to, start + duration * 0.6);
    tail.connect(filter);
    tail = filter;
    nodes.push(filter);
  }

  const gain = envelope(ctx, start, options.attack ?? 0.005, end, volume, (options.hold ?? 0) * duration);
  tail.connect(gain).connect(master);
  nodes.push(gain);

  track(osc, nodes);
  osc.start(start);
  osc.stop(end + 0.05);
}

interface BurstOptions extends NoiseOptions {
  attack?: number;
  /** Filter resonance. */
  q?: number;
  /** Glide the filter cutoff to this frequency over the duration (whooshes). */
  sweepTo?: number;
}

function burst(options: BurstOptions): void {
  const audio = getEngine();
  if (!audio || activeVoices >= MAX_VOICES) return;
  const { ctx, master, noise } = audio;
  const start = ctx.currentTime + Math.max(0, options.delay ?? 0) + 0.005;
  const duration = Math.max(0.01, options.duration);
  const end = start + duration;
  const volume = Math.min(Math.max(options.volume ?? 0.5, 0), 1);
  if (volume <= 0) return;

  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = options.filterType ?? 'lowpass';
  filter.Q.value = options.q ?? 1;
  filter.frequency.setValueAtTime(options.filterFreq ?? 1200, start);
  if (options.sweepTo) filter.frequency.exponentialRampToValueAtTime(options.sweepTo, end);
  const gain = envelope(ctx, start, options.attack ?? 0.002, end, volume);
  source.connect(filter).connect(gain).connect(master);

  track(source, [source, filter, gain]);
  // Random start point so repeated bursts do not sound identical.
  source.start(start, Math.random() * Math.max(0, noise.duration - duration - 0.1));
  source.stop(end + 0.05);
}

/** Small random pitch variation (±cents) so repeated UI sounds feel natural. */
function wobble(cents: number): number {
  return (Math.random() * 2 - 1) * cents;
}

/* Note frequencies (Hz). */
const NOTE = {
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  E6: 1318.51,
  G6: 1567.98,
} as const;

/** One soft brass-like note: two detuned saws through an opening low-pass filter. */
function brass(freq: number, delay: number, duration: number, volume: number): void {
  for (const detune of [-7, 7]) {
    voice({
      freq,
      duration,
      delay,
      type: 'sawtooth',
      volume,
      attack: 0.035,
      hold: 0.55,
      detune,
      lowpass: { from: 700, to: 2200, q: 1.2 },
      vibrato: duration > 0.5 ? { depth: 2.5, rate: 5.5 } : undefined,
    });
  }
}

const RECIPES: Record<SfxName, () => void> = {
  move: () => {
    voice({ freq: 1250, duration: 0.05, type: 'sine', volume: 0.16, attack: 0.002, detune: wobble(15) });
  },
  select: () => {
    voice({ freq: NOTE.E5, duration: 0.09, type: 'triangle', volume: 0.32, attack: 0.004 });
    voice({ freq: NOTE.B5, duration: 0.16, type: 'triangle', volume: 0.3, attack: 0.004, delay: 0.065 });
  },
  back: () => {
    voice({ freq: NOTE.A5, duration: 0.08, type: 'triangle', volume: 0.26, attack: 0.004 });
    voice({ freq: NOTE.E5, slideTo: NOTE.C5, duration: 0.16, type: 'triangle', volume: 0.24, attack: 0.004, delay: 0.06 });
  },
  error: () => {
    voice({ freq: 150, duration: 0.2, type: 'sawtooth', volume: 0.2, attack: 0.008, hold: 0.4, lowpass: { from: 650, q: 0.8 } });
    voice({ freq: 157, duration: 0.2, type: 'sawtooth', volume: 0.16, attack: 0.008, hold: 0.4, lowpass: { from: 520, q: 0.8 } });
  },
  type: () => {
    burst({ duration: 0.018, volume: 0.22, filterType: 'bandpass', filterFreq: 2600 + wobble(400), q: 2.5 });
    voice({ freq: 1900, duration: 0.025, type: 'sine', volume: 0.05, attack: 0.001, detune: wobble(40) });
  },
  erase: () => {
    burst({ duration: 0.02, volume: 0.15, filterType: 'bandpass', filterFreq: 1500 + wobble(200), q: 2 });
  },
  correct: () => {
    voice({ freq: NOTE.A5, duration: 0.32, type: 'triangle', volume: 0.3, attack: 0.003 });
    voice({ freq: NOTE.E6, duration: 0.28, type: 'sine', volume: 0.14, attack: 0.003, delay: 0.035 });
    voice({ freq: NOTE.A5 * 2, duration: 0.12, type: 'sine', volume: 0.05, attack: 0.002 });
  },
  wrong: () => {
    // A hollow wooden thud and a short bone rattle.
    voice({ freq: 170, slideTo: 85, duration: 0.2, type: 'sine', volume: 0.5, attack: 0.003 });
    voice({ freq: 340, slideTo: 170, duration: 0.07, type: 'triangle', volume: 0.12, attack: 0.002 });
    for (const [delay, freq] of [
      [0.03, 1700],
      [0.075, 2100],
      [0.115, 1500],
      [0.15, 1900],
    ] as const) {
      burst({ duration: 0.025, delay, volume: 0.18, filterType: 'bandpass', filterFreq: freq, q: 7 });
    }
  },
  success: () => {
    const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6];
    notes.forEach((freq, i) => {
      voice({ freq, duration: i === notes.length - 1 ? 0.45 : 0.22, type: 'triangle', volume: 0.26, attack: 0.004, delay: i * 0.075 });
    });
    voice({ freq: NOTE.G6, duration: 0.4, type: 'sine', volume: 0.06, attack: 0.01, delay: 0.24 });
  },
  fail: () => {
    voice({ freq: NOTE.A4, slideTo: 415, duration: 0.28, type: 'triangle', volume: 0.26, attack: 0.01, hold: 0.5 });
    voice({ freq: NOTE.F4, slideTo: 330, duration: 0.3, type: 'triangle', volume: 0.24, attack: 0.01, hold: 0.5, delay: 0.26 });
    voice({
      freq: NOTE.E4,
      slideTo: NOTE.D4 * 0.94,
      duration: 0.7,
      type: 'triangle',
      volume: 0.24,
      attack: 0.01,
      hold: 0.45,
      delay: 0.54,
      vibrato: { depth: 3, rate: 5 },
    });
  },
  start: () => {
    burst({ duration: 0.42, volume: 0.22, filterType: 'bandpass', filterFreq: 350, sweepTo: 3200, q: 1.4, attack: 0.18 });
    voice({ freq: 260, slideTo: 780, duration: 0.38, type: 'sine', volume: 0.1, attack: 0.15 });
  },
  result: () => {
    // Soft bell: a few slightly inharmonic partials with a long decay.
    voice({ freq: NOTE.C6, duration: 1.3, type: 'sine', volume: 0.24, attack: 0.004 });
    voice({ freq: NOTE.C6 * 2.01, duration: 0.8, type: 'sine', volume: 0.08, attack: 0.004 });
    voice({ freq: NOTE.C6 * 2.76, duration: 0.5, type: 'sine', volume: 0.05, attack: 0.004 });
    voice({ freq: NOTE.G5, duration: 1.1, type: 'triangle', volume: 0.1, attack: 0.004, delay: 0.09 });
  },
  pause: () => {
    voice({ freq: 700, slideTo: 420, duration: 0.14, type: 'sine', volume: 0.24, attack: 0.005 });
  },
  unpause: () => {
    voice({ freq: 420, slideTo: 700, duration: 0.14, type: 'sine', volume: 0.24, attack: 0.005 });
  },
  tick: () => {
    voice({ freq: 1100, duration: 0.05, type: 'sine', volume: 0.2, attack: 0.002 });
    burst({ duration: 0.012, volume: 0.08, filterType: 'bandpass', filterFreq: 3200, q: 3 });
  },
  drumroll: () => {
    // About two seconds of soft snare strokes, slowly getting louder.
    const length = 2.0;
    for (let t = 0; t < length; t += 0.042) {
      const progress = t / length;
      burst({
        duration: 0.05,
        delay: t + Math.random() * 0.006,
        volume: 0.06 + progress * progress * 0.24 + Math.random() * 0.02,
        filterType: 'bandpass',
        filterFreq: 1700 + Math.random() * 300,
        q: 0.9,
      });
    }
  },
  reveal: () => {
    burst({ duration: 1.5, volume: 0.2, filterType: 'highpass', filterFreq: 6000, attack: 0.004 });
    burst({ duration: 0.7, volume: 0.1, filterType: 'bandpass', filterFreq: 9000, q: 1.5, attack: 0.004 });
    voice({ freq: NOTE.C6 * 2, duration: 1.2, type: 'sine', volume: 0.05, attack: 0.01, delay: 0.02 });
    voice({ freq: NOTE.E6 * 2, duration: 1.0, type: 'sine', volume: 0.035, attack: 0.01, delay: 0.05 });
  },
  fanfare: () => {
    // "Ta-ta-ta-taa, ta-taaa": G4 C5 E5 G5, E5, then a held C major chord.
    const v = 0.075;
    brass(NOTE.G4, 0, 0.14, v);
    brass(NOTE.C5, 0.15, 0.14, v);
    brass(NOTE.E5, 0.3, 0.14, v);
    brass(NOTE.G5, 0.45, 0.36, v);
    brass(NOTE.E5, 0.83, 0.14, v);
    for (const freq of [NOTE.C5, NOTE.E5, NOTE.G5]) brass(freq, 0.98, 1.05, v * 0.8);
    brass(NOTE.C6, 0.98, 1.05, v * 0.55);
  },
};

/** The game's sound effects. Every call is fire-and-forget and never throws. */
export const sfx: Sfx = {
  play(name: SfxName): void {
    try {
      const audio = getEngine();
      if (!audio) return;
      const now = audio.ctx.currentTime;
      const last = lastPlayed.get(name);
      if (last !== undefined && now - last < MIN_REPEAT_GAP && now >= last) return;
      lastPlayed.set(name, now);
      RECIPES[name]?.();
    } catch {
      // Sound is decoration only.
    }
  },

  tone(options: ToneOptions): void {
    try {
      voice(options);
    } catch {
      // Sound is decoration only.
    }
  },

  noise(options: NoiseOptions): void {
    try {
      burst(options);
    } catch {
      // Sound is decoration only.
    }
  },
};
