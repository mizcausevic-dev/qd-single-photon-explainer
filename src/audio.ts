import { DURATION } from "./timeline";
import type { Cue } from "./timeline";

export interface Stems {
  music: AudioBuffer;
  sfx: AudioBuffer;
}

function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 20261020;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = seed / 4294967296 * 2 - 1;
  }
  return buffer;
}

function tone(
  context: BaseAudioContext,
  destination: AudioNode,
  options: {
    type: OscillatorType;
    frequency: number;
    endFrequency?: number;
    start: number;
    duration: number;
    gain: number;
    attack: number;
    release: number;
  },
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, options.start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, options.start + options.duration);
  }
  const attackEnd = options.start + options.attack;
  const releaseStart = options.start + Math.max(options.attack, options.duration - options.release);
  gain.gain.setValueAtTime(0.0001, options.start);
  gain.gain.linearRampToValueAtTime(options.gain, attackEnd);
  gain.gain.setValueAtTime(options.gain, releaseStart);
  gain.gain.linearRampToValueAtTime(0.0001, options.start + options.duration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration + 0.02);
}

function buildMusic(context: BaseAudioContext): void {
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.linearRampToValueAtTime(0.9, 0.6);
  master.gain.setValueAtTime(0.9, 32.6);
  master.gain.linearRampToValueAtTime(0.0001, DURATION);
  master.connect(context.destination);

  const bed = context.createBiquadFilter();
  bed.type = "lowpass";
  bed.frequency.setValueAtTime(420, 0);
  bed.frequency.linearRampToValueAtTime(900, 17);
  bed.frequency.linearRampToValueAtTime(520, 33);
  bed.connect(master);

  const voices: Array<{ frequency: number; detune?: number; gain: number; start: number }> = [
    { frequency: 73.42, gain: 0.05, start: 0 },
    { frequency: 73.42, detune: 7, gain: 0.02, start: 0 },
    { frequency: 110, gain: 0.026, start: 4.2 },
    { frequency: 146.83, gain: 0.018, start: 9.6 },
    { frequency: 220, gain: 0.012, start: 16.8 },
  ];
  for (const voice of voices) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = voice.frequency;
    if (voice.detune) oscillator.detune.value = voice.detune;
    gain.gain.setValueAtTime(0.0001, voice.start);
    gain.gain.linearRampToValueAtTime(voice.gain, voice.start + 1.4);
    gain.gain.setValueAtTime(voice.gain, 32.4);
    gain.gain.linearRampToValueAtTime(0.0001, 33.8);
    oscillator.connect(gain);
    gain.connect(bed);
    oscillator.start(0);
    oscillator.stop(DURATION);
  }

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer(context);
  noise.loop = true;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(480, 0);
  band.frequency.linearRampToValueAtTime(760, 18);
  band.Q.value = 0.7;
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, 0);
  noiseGain.gain.linearRampToValueAtTime(0.012, 3);
  noiseGain.gain.linearRampToValueAtTime(0.02, 18);
  noiseGain.gain.linearRampToValueAtTime(0.0001, 33.5);
  noise.connect(band);
  band.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(0);
  noise.stop(DURATION);
}

function buildSfx(context: BaseAudioContext, cues: readonly Cue[]): void {
  const master = context.createGain();
  master.gain.value = 1;
  master.connect(context.destination);
  for (const cue of cues) {
    if (cue.kind === "prep") {
      tone(context, master, {
        type: "sine",
        frequency: 196,
        endFrequency: 392,
        start: cue.t,
        duration: 1.15,
        gain: 0.045,
        attack: 0.08,
        release: 0.35,
      });
    } else if (cue.kind === "emission") {
      tone(context, master, {
        type: "triangle",
        frequency: 494,
        start: cue.t,
        duration: 2.4,
        gain: 0.032,
        attack: 0.28,
        release: 1.1,
      });
    } else if (cue.kind === "collection") {
      const source = context.createBufferSource();
      source.buffer = noiseBuffer(context);
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 1.2;
      filter.frequency.setValueAtTime(420, cue.t);
      filter.frequency.linearRampToValueAtTime(1100, cue.t + 0.8);
      filter.frequency.linearRampToValueAtTime(540, cue.t + 1.7);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, cue.t);
      gain.gain.linearRampToValueAtTime(0.03, cue.t + 0.2);
      gain.gain.linearRampToValueAtTime(0.0001, cue.t + 1.75);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(cue.t);
      source.stop(cue.t + 1.8);
    } else if (cue.kind === "click") {
      tone(context, master, {
        type: "sine",
        frequency: 620,
        start: cue.t,
        duration: 0.09,
        gain: 0.05,
        attack: 0.005,
        release: 0.07,
      });
    } else if (cue.kind === "histogram") {
      tone(context, master, {
        type: "sine",
        frequency: 293.66,
        start: cue.t,
        duration: 1.7,
        gain: 0.02,
        attack: 0.12,
        release: 0.6,
      });
      tone(context, master, {
        type: "sine",
        frequency: 370,
        start: cue.t,
        duration: 1.7,
        gain: 0.016,
        attack: 0.18,
        release: 0.7,
      });
    }
  }
}

export async function renderStems(cues: readonly Cue[]): Promise<Stems> {
  const rate = 44100;
  const length = Math.ceil(DURATION * rate);
  const musicContext = new OfflineAudioContext(2, length, rate);
  const sfxContext = new OfflineAudioContext(2, length, rate);
  buildMusic(musicContext);
  buildSfx(sfxContext, cues);
  const [music, sfx] = await Promise.all([musicContext.startRendering(), sfxContext.startRendering()]);
  return { music, sfx };
}

export class PresentationAudio {
  private context: AudioContext | null = null;
  private stems: Stems | null = null;
  private rendering: Promise<void> | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private master: GainNode | null = null;
  muted = false;
  musicLevel = 0.75;
  sfxLevel = 0.8;
  started = false;

  constructor(private readonly cues: readonly Cue[]) {}

  private applyGains(): void {
    if (!this.master || !this.musicGain || !this.sfxGain) return;
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.musicGain.gain.value = this.musicLevel;
    this.sfxGain.gain.value = this.sfxLevel;
  }

  async arm(): Promise<void> {
    if (this.started) return;
    const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    this.context = new Context();
    this.master = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.context.destination);
    this.applyGains();
    this.started = true;
    if (this.context.state === "suspended") await this.context.resume();
    this.rendering = renderStems(this.cues).then((stems) => {
      this.stems = stems;
    });
    await this.rendering;
  }

  async playFrom(offset: number): Promise<void> {
    await this.arm();
    if (!this.context || !this.stems || !this.musicGain || !this.sfxGain) return;
    if (this.context.state === "suspended") await this.context.resume();
    this.stopSources();
    const remaining = DURATION - offset;
    if (remaining < 0.04) return;
    const when = this.context.currentTime + 0.02;
    this.sources = [this.stems.music, this.stems.sfx].map((buffer, index) => {
      const source = this.context!.createBufferSource();
      source.buffer = buffer;
      source.connect(index === 0 ? this.musicGain! : this.sfxGain!);
      source.start(when, offset, remaining);
      return source;
    });
  }

  stopSources(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    this.sources = [];
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGains();
  }

  setMusic(level: number): void {
    this.musicLevel = level;
    this.applyGains();
  }

  setSfx(level: number): void {
    this.sfxLevel = level;
    this.applyGains();
  }
}
