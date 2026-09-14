/**
 * A short, upbeat chiptune loop, synthesised live with the Web Audio API.
 *
 * Generated rather than shipped as an audio file on purpose: there is no
 * track to license or host, nothing extra to download before the page is
 * usable, and the whole piece is a few kilobytes of note data. Browser-only
 * — construct it from an event handler, never during render or on the
 * server.
 *
 * The piece is eight bars at 116 BPM over I–V–vi–IV in C major: a bouncy
 * bass, a sixteenth-note arpeggio, light drums, and a melody that plays over
 * the first four bars and rests for the next four so the loop breathes.
 *
 * Timing follows the usual lookahead pattern: a fast timer schedules every
 * note due in the next fraction of a second against the audio clock, so
 * playback stays steady even when the main thread is busy.
 */

const BPM = 116;
/** One sixteenth note, in seconds. */
const STEP = 60 / BPM / 4;
const STEPS_PER_BAR = 16;
const BARS = 8;
const LOOKAHEAD_SECONDS = 0.15;
const TICK_MS = 25;
/** Deliberately quiet: background music, not the main event. */
const MASTER_VOLUME = 0.16;

interface Chord {
  /** Bass root, as a MIDI note number. */
  root: number;
  /** Three chord tones for the arpeggio, as MIDI note numbers. */
  tones: [number, number, number];
}

const PROGRESSION: Chord[] = [
  { root: 48, tones: [72, 76, 79] }, // C
  { root: 43, tones: [71, 74, 79] }, // G
  { root: 45, tones: [72, 76, 81] }, // Am
  { root: 41, tones: [72, 77, 81] }, // F
];

/** Indexes into [tone 0, tone 1, tone 2, tone 0 an octave up], per sixteenth. */
const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 3, 2, 1];

/** [step, MIDI note, length in steps], one row per chord of the progression. */
const MELODY: Array<Array<[number, number, number]>> = [
  [[0, 76, 2], [2, 79, 2], [4, 84, 3], [8, 79, 2], [10, 76, 2], [12, 74, 4]],
  [[0, 74, 2], [2, 79, 2], [4, 83, 3], [8, 81, 2], [10, 79, 2], [12, 74, 4]],
  [[0, 84, 2], [2, 83, 2], [4, 81, 4], [8, 76, 2], [10, 81, 2], [12, 84, 4]],
  [[0, 81, 3], [3, 79, 1], [4, 77, 4], [8, 72, 2], [10, 77, 2], [12, 76, 4]],
];

const BASS_STEPS = new Map([
  [0, 0],
  [3, 0],
  [6, 7],
  [8, 0],
  [11, 0],
  [14, 7],
]); // step -> semitones above the root
const KICK_STEPS = new Set([0, 8, 10]);
const SNARE_STEPS = new Set([4, 12]);

function midiToHz(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

export function isMusicSupported(): boolean {
  return typeof window !== "undefined" && typeof window.AudioContext === "function";
}

export class ChiptuneLoop {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private leadBus: GainNode | null = null;
  private bassBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private suspendTimer: number | null = null;
  private step = 0;
  private nextStepTime = 0;

  async start(): Promise<void> {
    const ctx = this.ensureGraph();
    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    await ctx.resume();

    this.fadeTo(MASTER_VOLUME, 0.8);
    if (this.timer !== null) return;

    this.step = 0;
    this.nextStepTime = ctx.currentTime + 0.05;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (!this.ctx) return;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.fadeTo(0, 0.3);
    // Suspend once the fade has finished, so a stopped loop costs nothing.
    this.suspendTimer = window.setTimeout(() => {
      this.suspendTimer = null;
      void this.ctx?.suspend();
    }, 400);
  }

  dispose(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.timer = null;
    this.suspendTimer = null;
    void this.ctx?.close();
    this.ctx = null;
  }

  private ensureGraph(): AudioContext {
    if (this.ctx) return this.ctx;

    const ctx = new AudioContext();
    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(ctx.destination);

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(compressor);

    // Square waves are harsh on their own; a gentle low-pass rounds them off.
    const leadFilter = ctx.createBiquadFilter();
    leadFilter.type = "lowpass";
    leadFilter.frequency.value = 3200;
    leadFilter.connect(master);
    const leadBus = ctx.createGain();
    leadBus.connect(leadFilter);

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 900;
    bassFilter.connect(master);
    const bassBus = ctx.createGain();
    bassBus.connect(bassFilter);

    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.leadBus = leadBus;
    this.bassBus = bassBus;
    this.noise = noise;
    return ctx;
  }

  private fadeTo(target: number, seconds: number): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(target, now + seconds);
  }

  private tick(): void {
    if (!this.ctx) return;
    while (this.nextStepTime < this.ctx.currentTime + LOOKAHEAD_SECONDS) {
      this.playStep(this.step, this.nextStepTime);
      this.nextStepTime += STEP;
      this.step = (this.step + 1) % (STEPS_PER_BAR * BARS);
    }
  }

  private playStep(step: number, time: number): void {
    const bar = Math.floor(step / STEPS_PER_BAR);
    const beat = step % STEPS_PER_BAR;
    const chordIndex = bar % PROGRESSION.length;
    const chord = PROGRESSION[chordIndex];
    const isLastBar = bar === BARS - 1;

    // Drums, with a little snare roll into the top of the loop.
    if (KICK_STEPS.has(beat)) this.kick(time);
    if (SNARE_STEPS.has(beat) || (isLastBar && beat >= 13)) {
      this.snare(time, isLastBar && beat >= 13 ? 0.18 + (beat - 13) * 0.06 : 0.3);
    }
    if (beat % 2 === 0) this.hat(time, beat % 4 === 2 ? 0.07 : 0.04);

    const bassInterval = BASS_STEPS.get(beat);
    if (bassInterval !== undefined) {
      this.tone(this.bassBus, "square", midiToHz(chord.root + bassInterval), time, STEP * 1.6, 0.22);
    }

    const arpIndex = ARP_PATTERN[beat];
    const arpNote = arpIndex === 3 ? chord.tones[0] + 12 : chord.tones[arpIndex];
    this.tone(this.leadBus, "square", midiToHz(arpNote), time, STEP * 0.8, 0.035);

    // Melody over the first half of the loop only.
    if (bar < PROGRESSION.length) {
      for (const [noteStep, note, length] of MELODY[chordIndex]) {
        if (noteStep === beat) {
          this.tone(this.leadBus, "triangle", midiToHz(note), time, STEP * length * 0.92, 0.3);
          this.tone(this.leadBus, "square", midiToHz(note), time, STEP * length * 0.92, 0.05);
        }
      }
    }
  }

  private tone(
    bus: GainNode | null,
    type: OscillatorType,
    frequency: number,
    time: number,
    duration: number,
    peak: number
  ): void {
    if (!this.ctx || !bus) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(peak, time + 0.008);
    env.gain.exponentialRampToValueAtTime(peak * 0.55, time + Math.min(0.08, duration * 0.5));
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(env).connect(bus);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private kick(time: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    env.gain.setValueAtTime(0.9, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    osc.connect(env).connect(this.master);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  private snare(time: number, peak: number): void {
    this.noiseHit(time, "bandpass", 1800, 0.13, peak);
  }

  private hat(time: number, peak: number): void {
    this.noiseHit(time, "highpass", 7000, 0.045, peak);
  }

  private noiseHit(
    time: number,
    filterType: BiquadFilterType,
    frequency: number,
    duration: number,
    peak: number
  ): void {
    if (!this.ctx || !this.master || !this.noise) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(peak, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter).connect(env).connect(this.master);
    source.start(time);
    source.stop(time + duration + 0.02);
  }
}
