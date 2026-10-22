import { gaussian, mulberry32 } from "./math";

/**
 * Phenomenological detection-record model.
 * These probabilities are synthetic knobs, not measured device performance.
 */
export interface ModelParams {
  seed: number;
  cycles: number;
  /** Probability the selected transition is prepared. */
  pPrep: number;
  /** Given preparation, probability one photon enters the collected-mode model. */
  pCollected: number;
  /** Given a collected photon, probability it is transmitted through rejection and collection optics. */
  pTransmit: number;
  /** Given arrival at a detector, probability of a click. */
  pDetect: number;
  /**
   * Given one collected photon, probability a second photon is added.
   * Effective multiphoton term only. Not a biexciton, charged exciton, or two-photon excitation.
   */
  pExtra: number;
  /** Per detector, per pulse, background click probability. */
  pBackground: number;
  /** Full width of the uniform background time offset, in repetition periods. */
  backgroundSpread: number;
  /** Gaussian timing standard deviation, in repetition periods. */
  sigmaPeriods: number;
  /** Equal half-width for every integrated peak, in repetition periods. */
  windowHalfWidth: number;
}

export const MODEL: ModelParams = {
  seed: 20261020,
  cycles: 12000,
  pPrep: 0.7,
  pCollected: 0.4,
  pTransmit: 0.75,
  pDetect: 0.8,
  pExtra: 0.018,
  pBackground: 0.003,
  backgroundSpread: 0.12,
  sigmaPeriods: 0.035,
  windowHalfWidth: 0.18,
};

export const DEMO_SEED = 20261021;
export const DEMO_COUNT = 12;

export const TAU_MIN = -2.5;
export const TAU_MAX = 2.5;
export const BIN_WIDTH = 0.02;
export const BIN_COUNT = Math.round((TAU_MAX - TAU_MIN) / BIN_WIDTH);
export const PEAKS = [-2, -1, 0, 1, 2] as const;

export interface DemoWindow {
  index: number;
  click: boolean;
}

export interface HistogramResult {
  counts: number[];
  areas: Record<(typeof PEAKS)[number], number>;
  windowBins: number;
  sideMean: number;
  /** A(0) / mean side area. Null when the side reference is empty. */
  g2: number | null;
  pairCount: number;
  cycles: number;
  clicksA: number;
  clicksB: number;
  signalClicks: number;
  backgroundClicks: number;
  model: ModelParams;
}

export function binCenter(index: number): number {
  return TAU_MIN + (index + 0.5) * BIN_WIDTH;
}

export function binIndex(tau: number): number | null {
  if (tau < TAU_MIN || tau >= TAU_MAX) return null;
  const index = Math.floor((tau - TAU_MIN) / BIN_WIDTH);
  if (index < 0 || index >= BIN_COUNT) return null;
  return index;
}

export function windowBinIndices(center: number, half: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < BIN_COUNT; i++) {
    const c = binCenter(i);
    if (c >= center - half && c <= center + half) indices.push(i);
  }
  return indices;
}

export function areaInWindow(counts: number[], center: number, half: number): number {
  let sum = 0;
  for (const index of windowBinIndices(center, half)) sum += counts[index];
  return sum;
}

export function accumulatePairs(clicksA: readonly number[], clicksB: readonly number[]): {
  counts: number[];
  pairCount: number;
} {
  const counts = new Array<number>(BIN_COUNT).fill(0);
  const a = clicksA;
  const b = clicksB;
  let pairCount = 0;
  let j0 = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = a[i] + TAU_MIN;
    const hi = a[i] + TAU_MAX;
    while (j0 < b.length && b[j0] < lo) j0++;
    for (let j = j0; j < b.length && b[j] < hi; j++) {
      const index = binIndex(b[j] - a[i]);
      if (index === null) continue;
      counts[index] += 1;
      pairCount += 1;
    }
  }
  return { counts, pairCount };
}

export function summarize(counts: number[], model: ModelParams, meta: Omit<HistogramResult, "counts" | "areas" | "windowBins" | "sideMean" | "g2" | "pairCount"> & { pairCount: number }): HistogramResult {
  const areas = {} as HistogramResult["areas"];
  for (const peak of PEAKS) {
    areas[peak] = areaInWindow(counts, peak, model.windowHalfWidth);
  }
  const sideMean = (areas[-2] + areas[-1] + areas[1] + areas[2]) / 4;
  const g2 = sideMean > 0 ? areas[0] / sideMean : null;
  return {
    counts,
    areas,
    windowBins: windowBinIndices(0, model.windowHalfWidth).length,
    sideMean,
    g2,
    pairCount: meta.pairCount,
    cycles: meta.cycles,
    clicksA: meta.clicksA,
    clicksB: meta.clicksB,
    signalClicks: meta.signalClicks,
    backgroundClicks: meta.backgroundClicks,
    model,
  };
}

function pushClick(target: number[], time: number): void {
  target.push(time);
}

export function generateExperiment(model: ModelParams = MODEL): HistogramResult {
  const rng = mulberry32(model.seed);
  const clicksA: number[] = [];
  const clicksB: number[] = [];
  let signalClicks = 0;
  let backgroundClicks = 0;

  for (let cycle = 0; cycle < model.cycles; cycle++) {
    const prepared = rng() < model.pPrep;
    const collected = rng() < model.pCollected;
    const extra = rng() < model.pExtra;
    const photonCount = prepared && collected ? (extra ? 2 : 1) : 0;

    for (let photon = 0; photon < photonCount; photon++) {
      const transmitted = rng() < model.pTransmit;
      const detected = rng() < model.pDetect;
      const branchA = rng() < 0.5;
      const time = cycle + gaussian(rng) * model.sigmaPeriods;
      if (transmitted && detected) {
        pushClick(branchA ? clicksA : clicksB, time);
        signalClicks += 1;
      }
    }

    if (rng() < model.pBackground) {
      clicksA.push(cycle + (rng() - 0.5) * model.backgroundSpread);
      backgroundClicks += 1;
    }
    if (rng() < model.pBackground) {
      clicksB.push(cycle + (rng() - 0.5) * model.backgroundSpread);
      backgroundClicks += 1;
    }
  }

  clicksA.sort((p, q) => p - q);
  clicksB.sort((p, q) => p - q);
  const { counts, pairCount } = accumulatePairs(clicksA, clicksB);
  return summarize(counts, model, {
    pairCount,
    cycles: model.cycles,
    clicksA: clicksA.length,
    clicksB: clicksB.length,
    signalClicks,
    backgroundClicks,
    model,
  });
}

/** Single-detector illustrated cycles. Not the histogram sample. */
export function generateDemoWindows(count = DEMO_COUNT, seed = DEMO_SEED, model: ModelParams = MODEL): DemoWindow[] {
  const rng = mulberry32(seed);
  const windows: DemoWindow[] = [];
  for (let index = 0; index < count; index++) {
    const prepared = rng() < model.pPrep;
    const collected = rng() < model.pCollected;
    const transmitted = rng() < model.pTransmit;
    const detected = rng() < model.pDetect;
    const background = rng() < model.pBackground;
    windows.push({
      index,
      click: (prepared && collected && transmitted && detected) || background,
    });
  }
  return windows;
}
