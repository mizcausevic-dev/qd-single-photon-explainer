import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDevice } from "../src/device";
import { LAYOUT, modeIntensity } from "../src/layout";
import { COPY, SHOT_COPY } from "../src/copy";
import {
  BIN_COUNT,
  MODEL,
  PEAKS,
  accumulatePairs,
  areaInWindow,
  generateDemoWindows,
  generateExperiment,
  windowBinIndices,
  type ModelParams,
} from "../src/model";
import {
  DURATION,
  FPS,
  FRAME_COUNT,
  LANDMARKS,
  SELECTED_CLICK_TIME,
  cameraAt,
  cuePlan,
  frameAt,
  projectNdc,
  shotAt,
  stateAt,
} from "../src/timeline";

const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok  ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.error(`FAIL ${name}: ${message}`);
  }
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (entry === "node_modules" || entry === "dist") continue;
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else if (/\.(ts|html|css|md|yml)$/.test(entry)) out.push(path);
  }
  return out;
}

check("duration and frame index", () => {
  assert.equal(DURATION, 34);
  assert.equal(FPS, 30);
  assert.equal(FRAME_COUNT, 1020);
  assert.equal(frameAt(0), 0);
  assert.equal(frameAt(4.999), 149);
  assert.equal(frameAt(5), 150);
  assert.equal(frameAt(9.999), 299);
  assert.equal(frameAt(10), 300);
  assert.equal(frameAt(16.999), 509);
  assert.equal(frameAt(17), 510);
  assert.equal(frameAt(24.999), 749);
  assert.equal(frameAt(25), 750);
  assert.equal(frameAt(33.999), 1019);
  assert.equal(frameAt(34), 1019);
  assert.equal(shotAt(0), 1);
  assert.equal(shotAt(4.999), 1);
  assert.equal(shotAt(5), 2);
  assert.equal(shotAt(10), 3);
  assert.equal(shotAt(17), 4);
  assert.equal(shotAt(25), 5);
  assert.equal(shotAt(34), 5);
});

check("timeline is a pure function of time", () => {
  for (const t of [0, 2.2, 6.4, 12, 18.5, 23.75, 27.4, 32, 34]) {
    assert.deepEqual(stateAt(t), stateAt(t));
  }
  assert.equal(JSON.stringify(stateAt(12.25)), JSON.stringify(stateAt(12.25)));
  const end = stateAt(34);
  const hold = stateAt(33);
  assert.deepEqual(end.camera, hold.camera);
  assert.equal(end.wave.visible, 0);
  assert.equal(end.wave.absorbed, 1);
});

check("camera holds after 33s and stays outside the pillar", () => {
  assert.deepEqual(cameraAt(33), cameraAt(34));
  for (let t = 0; t <= 34; t += 0.25) {
    const cam = cameraAt(t);
    const radial = Math.hypot(cam.position.x, cam.position.z);
    assert.ok(radial > 0.9, `camera inside pillar at t=${t}`);
    assert.ok(cam.position.y > -1 && cam.position.y < 8);
  }
});

check("establishing and close views keep landmarks in frame", () => {
  const aspect = 16 / 9;
  const expectInside = (t: number, names: string[]) => {
    const pose = cameraAt(t);
    for (const name of names) {
      const ndc = projectNdc(LANDMARKS[name], pose, aspect);
      assert.ok(ndc.depth > 0, `${name} behind camera at t=${t}`);
      assert.ok(Math.abs(ndc.x) < 0.92 && Math.abs(ndc.y) < 0.92, `${name} at t=${t} ndc=${ndc.x.toFixed(2)},${ndc.y.toFixed(2)}`);
    }
  };
  expectInside(0, ["substrate", "qd", "lens", "detector"]);
  expectInside(2.5, ["substrate", "qd", "lens", "detector"]);
  expectInside(3.1, ["substrate", "qd", "lens", "detector"]);
  expectInside(8, ["qd"]);
  expectInside(10, ["qd"]);
  expectInside(13, ["qd", "upperExit"]);
  expectInside(16, ["qd", "upperExit"]);
  expectInside(21, ["lens", "rejection", "detector"]);
  expectInside(33, ["qd", "detector", "hbt", "substrate"]);
});

check("dot sits at the mode-intensity antinode", () => {
  assert.equal(LAYOUT.qdY, 0);
  assert.ok(modeIntensity(0) > 0.99);
  for (let y = -0.7; y <= 0.7; y += 0.02) {
    assert.ok(modeIntensity(0) + 1e-9 >= modeIntensity(y));
  }
  assert.ok(LAYOUT.upperDbr.layers < LAYOUT.lowerDbr.layers);
});

check("one wavepacket, absorbed at the detector, not duplicated", () => {
  const early = stateAt(8);
  assert.equal(early.wave.visible, 0);
  assert.equal(early.wave.absorbed, 0);
  const emission = stateAt(13);
  assert.ok(emission.wave.visible > 0.8);
  assert.equal(emission.wave.absorbed, 0);
  assert.ok(emission.wave.center < 0.45);
  assert.ok(emission.exciton < 1);
  const click = stateAt(SELECTED_CLICK_TIME);
  assert.ok(click.wave.center > 0.9);
  assert.ok(click.wave.absorbed > 0.5);
  const after = stateAt(24.4);
  assert.equal(after.wave.visible, 0);
  assert.equal(after.wave.absorbed, 1);
  assert.ok(after.selectedClick > 0.9);
  const later = stateAt(30);
  assert.equal(later.wave.visible, 0);
  assert.equal(later.wave.center, 1);
});

check("preparation marker tracks the authored pulse, then returns", () => {
  assert.equal(stateAt(5.2).pulseAreaOverPi, 0);
  assert.equal(stateAt(5.2).marker, 0);
  assert.ok(stateAt(7.2).pulse.visible > 0.5);
  assert.ok(stateAt(7.2).pulseAreaOverPi > 0.2 && stateAt(7.2).pulseAreaOverPi < 0.95);
  assert.equal(stateAt(9).pulseAreaOverPi, 1);
  assert.equal(stateAt(9).marker, 1);
  assert.ok(stateAt(9).exciton > 0.9);
  assert.ok(stateAt(14).marker < 0.5);
  assert.equal(stateAt(16.5).exciton, 0);
  assert.equal(stateAt(16.5).pulseAreaOverPi, 1);
});

check("histogram windows, areas, and event model", () => {
  const widths = PEAKS.map((peak) => windowBinIndices(peak, MODEL.windowHalfWidth).length);
  assert.ok(widths.every((width) => width === widths[0] && width > 0));
  const seen = new Set<number>();
  for (const peak of PEAKS) {
    for (const index of windowBinIndices(peak, MODEL.windowHalfWidth)) {
      assert.ok(!seen.has(index), "windows overlap");
      seen.add(index);
    }
  }
  const known = accumulatePairs([0, 1, 2], [0.02, 1.01, 2.04]);
  assert.equal(known.pairCount, 9);
  assert.equal(areaInWindow(known.counts, 0, 0.18), 3);
  assert.equal(areaInWindow(known.counts, 1, 0.18), 2);
  assert.equal(areaInWindow(known.counts, -1, 0.18), 2);
  assert.equal(areaInWindow(known.counts, 2, 0.18), 1);
  assert.equal(areaInWindow(known.counts, -2, 0.18), 1);

  const silent: ModelParams = { ...MODEL, cycles: 3000, seed: 7, pExtra: 0, pBackground: 0 };
  const silentRun = generateExperiment(silent);
  assert.equal(silentRun.areas[0], 0);
  assert.ok(silentRun.areas[1] > 0);

  const full = generateExperiment();
  const again = generateExperiment();
  assert.deepEqual(full.areas, again.areas);
  assert.equal(full.counts.reduce((sum, count) => sum + count, 0), full.pairCount);
  assert.ok(full.areas[0] > 0, "central area should be nonzero under the stated imperfections");
  assert.ok(full.g2 !== null && full.g2 < 0.45 && full.g2 > 0);
  for (const peak of [1, 2, -1, -2] as const) {
    assert.ok(full.areas[0] < full.areas[peak]);
  }
  console.log("    areas", full.areas, "g2", full.g2?.toFixed(3), "pairs", full.pairCount);
});

check("illustrated records are mixed and are not the histogram", () => {
  const demo = generateDemoWindows();
  assert.ok(demo.some((record) => record.click));
  assert.ok(demo.some((record) => !record.click));
  assert.notEqual(demo.length, MODEL.cycles);
  const cues = cuePlan(demo);
  assert.ok(cues.every((cue) => cue.t >= 0 && cue.t < 33));
  assert.ok(Math.abs(cues.find((cue) => cue.kind === "click")!.t - SELECTED_CLICK_TIME) < 1e-9);
});

check("required wording is present and unsupported claims are absent", () => {
  const blob = Object.values(COPY).join("\n") + JSON.stringify(SHOT_COPY);
  const required = [
    "Relative cavity-mode intensity · schematic.",
    "Quantum dot enlarged—not to scale.",
    "Representative device—not a fabrication design.",
    "Selected transition · simplified model.",
    "Other states and preparation imperfections omitted.",
    "Confined electron–hole excitation.",
    "Emission dynamics schematic.",
    "Radiative recombination.",
    "Cavity-assisted emission.",
    "Single-photon wavepacket representation.",
    "This is not a classical field measurement or a tracked particle path.",
    "Resonant-pump rejection · schematic.",
    "Rejection and collection optics can introduce loss.",
    "Some cycles produce no recorded click.",
    "Loss may occur during preparation, emission, collection, transmission, or detection.",
    "Many-cycle coincidence histogram.",
    "Detection-time difference / repetition period.",
    "Coincidence counts.",
    "Suppressed central coincidences indicate fewer same-pulse two-detection events relative to different-pulse events under this measurement model.",
    "Synthetic data—not device performance.",
    "Scientific schematic with idealized preparation and synthetic detection.",
    "θ = ∫Ω(t)dt",
    "θ_final = π",
    "not exactly one photon",
    "not a color filter",
    "not duplicated photons",
    "A sampled branch is a detection-record visualization.",
    "does not establish photon indistinguishability",
    "does not prove zero multiphoton probability",
  ];
  for (const phrase of required) assert.ok(blob.includes(phrase), phrase);
  const root = fileURLToPath(new URL("..", import.meta.url));
  const sources = [...walk(join(root, "src")), join(root, "index.html")]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  const banned = [
    /Purcell factor/i,
    /quality factor/i,
    /collection efficiency/i,
    /unity efficiency/i,
    /one photon per cycle/i,
    /g²\(0\)\s*=\s*0/,
    /(?<!not )exactly one photon/i,
  ];
  for (const pattern of banned) assert.equal(pattern.test(sources), false, pattern.source);
});

check("scene has one photon representation and nonmetallic layers", () => {
  const refs = createDevice();
  const roles: string[] = [];
  const names: string[] = [];
  refs.root.traverse((object) => {
    if (object.name) names.push(object.name);
    if (typeof object.userData.role === "string") roles.push(object.userData.role);
    const material = (object as { material?: { metalness?: number } | Array<{ metalness?: number }> }).material;
    const list = Array.isArray(material) ? material : material ? [material] : [];
    for (const item of list) {
      if (typeof item.metalness === "number") assert.equal(item.metalness, 0);
    }
  });
  assert.equal(roles.filter((role) => role === "photon").length, 1);
  assert.equal(names.filter((name) => name === "wavepacket").length, 1);
  assert.equal(names.filter((name) => name === "excitation-pulse").length, 1);
  assert.ok(names.includes("hbt-detector-a") && names.includes("hbt-detector-b"));
  assert.ok(names.includes("hbt-example-click-a"));
  assert.equal(names.includes("hbt-example-click-b"), false);
  assert.notEqual(refs.waveMesh.geometry.uuid, refs.pulseMesh.geometry.uuid);
  const intensities = refs.mode.children.map((child) => ({
    y: child.position.y,
    intensity: Number(child.userData.intensity),
  }));
  const brightest = intensities.reduce((best, item) => (item.intensity > best.intensity ? item : best));
  assert.ok(Math.abs(brightest.y) < 0.021);
  const dot = refs.root.getObjectByName("quantum-dot");
  assert.ok(dot);
  assert.equal(dot?.position.y, 0);
  assert.equal(BIN_COUNT, 250);
});

if (failures.length) {
  console.error(`\n${failures.length} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
