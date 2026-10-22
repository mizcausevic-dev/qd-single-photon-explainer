import type { Vec3 } from "./math";

/**
 * Illustrative geometry only. Lengths are scene units, not layer thicknesses,
 * wavelengths, or a fabrication design.
 */
export const LAYOUT = {
  hostRadius: 0.5,
  shellRadius: 0.66,
  qdRadius: 0.1,
  qdY: 0,
  cavityHalf: 0.28,
  lowerDbr: { y0: -1.48, y1: -0.28, layers: 12 },
  upperDbr: { y0: 0.28, y1: 1.22, layers: 8 },
  substrateY: -1.66,
  substrateHeight: 0.36,
  lensY: 2.05,
  irisY: 2.7,
  polarizerY: 3.15,
  detectorFaceY: 3.97,
  detectorBodyY: 4.22,
  pathEndY: 3.95,
  hbtOrigin: { x: 2.15, y: 1.55, z: 0 } as Vec3,
} as const;

/** Relative cavity-mode intensity schematic. Maximum at y = 0. */
export function modeIntensity(y: number): number {
  const envelope = Math.exp(-(y * y) / (2 * 0.2 * 0.2));
  const standing = Math.cos((Math.PI * y) / 0.4) ** 2;
  return envelope * standing;
}

export function demoCardPosition(index: number): Vec3 {
  return {
    x: -1.45 + index * 0.3,
    y: -1.22,
    z: 1.15,
  };
}
