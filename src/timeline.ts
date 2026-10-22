import { LAYOUT } from "./layout";
import { clamp, lerp, lerpV, smoothstep, sub, dot, cross, normalize, type Vec3 } from "./math";
import { DEMO_COUNT, type DemoWindow } from "./model";

export const DURATION = 34;
export const FPS = 30;
export const FRAME_COUNT = 1020;

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface Envelope {
  visible: number;
  center: number;
  sigma: number;
  absorbed: number;
}

export interface TimelineState {
  t: number;
  frame: number;
  shot: 1 | 2 | 3 | 4 | 5;
  camera: CameraPose;
  hostReveal: number;
  modeOverlay: number;
  levels: number;
  pulse: Envelope;
  pulseAreaOverPi: number;
  exciton: number;
  /** 0 on |G>, 1 on |X>. Authored marker, not a calculated population. */
  marker: number;
  wave: Envelope;
  selectedClick: number;
  demoVisible: number;
  hbt: number;
  histogram: number;
  centerHighlight: number;
  /** 0 none, 1 preparation, 2 emission, 3 coupling, 4 transmission, 5 detection. */
  stage: 0 | 1 | 2 | 3 | 4 | 5;
}

interface CamKey extends CameraPose {
  t: number;
}

const CAM_KEYS: CamKey[] = [
  { t: 0, position: { x: 4.6, y: 1.8, z: 10.2 }, target: { x: 0.15, y: 1.35, z: 0 }, fov: 34 },
  { t: 3.2, position: { x: 4.5, y: 1.78, z: 10.05 }, target: { x: 0.14, y: 1.32, z: 0 }, fov: 35 },
  { t: 5, position: { x: 2.5, y: 0.85, z: 4.7 }, target: { x: -0.05, y: 0.35, z: 0 }, fov: 32 },
  { t: 10, position: { x: 1.35, y: 0.55, z: 2.75 }, target: { x: -0.15, y: 0.2, z: 0 }, fov: 34 },
  { t: 17, position: { x: 1.7, y: 1.35, z: 3.7 }, target: { x: 0, y: 0.95, z: 0 }, fov: 34 },
  { t: 19.5, position: { x: 2.05, y: 2.35, z: 4.8 }, target: { x: 0.05, y: 2.55, z: 0 }, fov: 38 },
  { t: 25, position: { x: 2.1, y: 2.9, z: 4.6 }, target: { x: 0.1, y: 3.15, z: 0 }, fov: 36 },
  { t: 33, position: { x: 4.8, y: 1.7, z: 9.6 }, target: { x: 0.7, y: 1.25, z: 0 }, fov: 38 },
  { t: 34, position: { x: 4.8, y: 1.7, z: 9.6 }, target: { x: 0.7, y: 1.25, z: 0 }, fov: 38 },
];

export const SELECTED_CLICK_TIME = 23.75;
export const DEMO_START = 25.35;
export const DEMO_STEP = 0.42;

export const SHOTS = [
  { shot: 1, start: 0, end: 5, title: "Device and cavity" },
  { shot: 2, start: 5, end: 10, title: "Exciton preparation" },
  { shot: 3, start: 10, end: 17, title: "Radiative emission" },
  { shot: 4, start: 17, end: 25, title: "Collection" },
  { shot: 5, start: 25, end: 34, title: "Repetition and coincidences" },
] as const;

export function shotAt(t: number): TimelineState["shot"] {
  if (t < 5) return 1;
  if (t < 10) return 2;
  if (t < 17) return 3;
  if (t < 25) return 4;
  return 5;
}

export function frameAt(t: number): number {
  if (t >= DURATION) return FRAME_COUNT - 1;
  return Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(t * FPS)));
}

export function cameraAt(t: number): CameraPose {
  const keys = CAM_KEYS;
  if (t <= keys[0].t) return { position: keys[0].position, target: keys[0].target, fov: keys[0].fov };
  const last = keys[keys.length - 1];
  if (t >= last.t) return { position: last.position, target: last.target, fov: last.fov };
  let seg = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) {
      seg = i;
      break;
    }
  }
  const a = keys[seg];
  const b = keys[seg + 1];
  const u = (t - a.t) / (b.t - a.t);
  return {
    position: lerpV(a.position, b.position, u),
    target: lerpV(a.target, b.target, u),
    fov: lerp(a.fov, b.fov, u),
  };
}

/**
 * Vertical field of view that keeps the 16:9 horizontal coverage
 * when the stage is narrower than 16:9.
 */
export function fovForAspect(baseFov: number, aspect: number): number {
  const base = (baseFov * Math.PI) / 180;
  const referenceAspect = 16 / 9;
  if (aspect >= referenceAspect) return baseFov;
  const halfHRef = Math.tan(base / 2);
  const halfW = halfHRef * referenceAspect;
  const halfH = halfW / Math.max(aspect, 0.35);
  const fov = (2 * Math.atan(halfH) * 180) / Math.PI;
  return clamp(fov, baseFov, 68);
}

export function projectNdc(point: Vec3, pose: CameraPose, aspect: number): { x: number; y: number; depth: number } {
  const eye = pose.position;
  const zaxis = normalize(sub(eye, pose.target));
  const xaxis = normalize(cross({ x: 0, y: 1, z: 0 }, zaxis));
  const yaxis = cross(zaxis, xaxis);
  const v = sub(point, eye);
  const cx = dot(v, xaxis);
  const cy = dot(v, yaxis);
  const depth = -dot(v, zaxis);
  const fov = (fovForAspect(pose.fov, aspect) * Math.PI) / 180;
  const halfH = Math.tan(fov / 2) * depth;
  const halfW = halfH * aspect;
  return { x: cx / halfW, y: cy / halfH, depth };
}

function pulseAt(t: number): Envelope {
  if (t < 5.7 || t > 9.5) return { visible: 0, center: t < 6 ? 0 : 1, sigma: 0.16, absorbed: 0 };
  const travel = smoothstep(5.7, 8.05, t);
  let env = 1;
  if (t < 6.15) env = smoothstep(5.7, 6.15, t);
  if (t > 7.65) env = 1 - smoothstep(7.65, 8.55, t);
  return { visible: env, center: travel, sigma: 0.16, absorbed: 0 };
}

function areaOverPi(t: number): number {
  if (t <= 6.25) return 0;
  if (t >= 8.15) return 1;
  return smoothstep(6.25, 8.15, t);
}

function excitonAt(t: number): number {
  const prepared = areaOverPi(t);
  if (t < 10) return prepared;
  if (t >= 15.6) return 0;
  return prepared * (1 - smoothstep(10, 15.6, t));
}

function waveAt(t: number): Envelope {
  if (t < 10) return { visible: 0, center: 0.04, sigma: 0.07, absorbed: 0 };
  if (t < 17) {
    const u = (t - 10) / 7;
    return {
      visible: smoothstep(10, 11.3, t),
      center: lerp(0.04, 0.32, u),
      sigma: lerp(0.055, 0.13, u),
      absorbed: 0,
    };
  }
  if (t < 24.25) {
    const u = (t - 17) / (24.25 - 17);
    const absorbed = smoothstep(0.8, 1, u);
    return {
      visible: 1 - absorbed,
      center: lerp(0.32, 1, u),
      sigma: 0.1,
      absorbed,
    };
  }
  return { visible: 0, center: 1, sigma: 0.1, absorbed: 1 };
}

function stageAt(t: number, wave: Envelope): TimelineState["stage"] {
  if (t < 5 || t >= 25) return 0;
  if (t < 10) return 1;
  if (t < 17) return wave.center < 0.2 ? 2 : 3;
  if (wave.absorbed > 0.45) return 5;
  return 4;
}

export function stateAt(time: number): TimelineState {
  const safe = Number.isFinite(time) ? clamp(time, 0, DURATION) : 0;
  const wave = waveAt(safe);
  const exciton = excitonAt(safe);
  const demoVisible = safe < DEMO_START ? 0 : Math.min(DEMO_COUNT, Math.floor((safe - DEMO_START) / DEMO_STEP) + 1);
  return {
    t: safe,
    frame: frameAt(safe),
    shot: shotAt(safe),
    camera: cameraAt(safe),
    hostReveal: smoothstep(0.3, 4.4, safe),
    modeOverlay: smoothstep(1.1, 3.8, safe) * (1 - 0.28 * wave.visible),
    levels: safe < 5 ? 0 : safe < 6 ? smoothstep(5, 6, safe) : 1,
    pulse: pulseAt(safe),
    pulseAreaOverPi: areaOverPi(safe),
    exciton,
    marker: exciton,
    wave,
    selectedClick: smoothstep(0.35, 0.9, wave.absorbed),
    demoVisible,
    hbt: smoothstep(27.1, 28.5, safe),
    histogram: smoothstep(29.0, 30.3, safe),
    centerHighlight: smoothstep(31.0, 32.1, safe),
    stage: stageAt(safe, wave),
  };
}

export interface Cue {
  t: number;
  kind: "prep" | "emission" | "collection" | "click" | "histogram";
}

export function cuePlan(demo: readonly DemoWindow[]): Cue[] {
  const cues: Cue[] = [
    { t: 6.35, kind: "prep" },
    { t: 10.25, kind: "emission" },
    { t: 17.1, kind: "collection" },
    { t: SELECTED_CLICK_TIME, kind: "click" },
    { t: 29.2, kind: "histogram" },
  ];
  demo.forEach((window, index) => {
    if (!window.click) return;
    cues.push({ t: DEMO_START + index * DEMO_STEP + 0.06, kind: "click" });
  });
  return cues;
}

export const LANDMARKS: Record<string, Vec3> = {
  substrate: { x: 0, y: LAYOUT.substrateY, z: 0 },
  qd: { x: 0, y: LAYOUT.qdY, z: 0 },
  upperExit: { x: 0, y: LAYOUT.upperDbr.y1, z: 0 },
  lens: { x: 0, y: LAYOUT.lensY, z: 0 },
  rejection: { x: 0, y: LAYOUT.polarizerY, z: 0 },
  detector: { x: 0, y: LAYOUT.detectorBodyY, z: 0 },
  hbt: LAYOUT.hbtOrigin,
};

export function formatSeconds(t: number): string {
  const clamped = clamp(t, 0, DURATION);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped - minutes * 60;
  const whole = Math.floor(seconds);
  const millis = Math.round((seconds - whole) * 1000);
  const adjustedWhole = millis === 1000 ? whole + 1 : whole;
  const adjustedMillis = millis === 1000 ? 0 : millis;
  return `${String(minutes).padStart(2, "0")}:${String(adjustedWhole).padStart(2, "0")}.${String(adjustedMillis).padStart(3, "0")}`;
}
