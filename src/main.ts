import "./styles.css";
import * as THREE from "three";
import { PresentationAudio } from "./audio";
import { paintHistogram } from "./chart";
import { COPY, SHOT_COPY, overlayLabels, stageName } from "./copy";
import { createDevice, updateDevice } from "./device";
import { Schematic2D } from "./fallback";
import { DEMO_COUNT, MODEL, PEAKS, generateDemoWindows, generateExperiment } from "./model";
import {
  DURATION,
  cuePlan,
  formatSeconds,
  stateAt,
  type TimelineState,
} from "./timeline";

const app = document.querySelector<HTMLElement>("#app")!;
const stage = document.querySelector<HTMLElement>("#stage")!;
const webglCanvas = document.querySelector<HTMLCanvasElement>("#webgl")!;
const fallbackCanvas = document.querySelector<HTMLCanvasElement>("#fallback")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const errorEl = document.querySelector<HTMLElement>("#error")!;
const playButton = document.querySelector<HTMLButtonElement>("#play")!;
const replayButton = document.querySelector<HTMLButtonElement>("#replay")!;
const scrub = document.querySelector<HTMLInputElement>("#scrub")!;
const timeReadout = document.querySelector<HTMLElement>("#time-readout")!;
const muteButton = document.querySelector<HTMLButtonElement>("#mute")!;
const musicInput = document.querySelector<HTMLInputElement>("#music")!;
const sfxInput = document.querySelector<HTMLInputElement>("#sfx")!;
const viewButton = document.querySelector<HTMLButtonElement>("#view2d")!;
const fullscreenButton = document.querySelector<HTMLButtonElement>("#fullscreen")!;
const shotChip = document.querySelector<HTMLElement>("#shot-chip")!;
const stageLabels = document.querySelector<HTMLElement>("#stage-labels")!;
const shotTitle = document.querySelector<HTMLElement>("#shot-title")!;
const shotBody = document.querySelector<HTMLElement>("#shot-body")!;
const live = document.querySelector<HTMLElement>("#live")!;
const stageHelp = document.querySelector<HTMLElement>("#stage-help")!;
const stageList = document.querySelector<HTMLOListElement>("#stages")!;
const marker = document.querySelector<SVGCircleElement>("#level-marker")!;
const levelX = document.querySelector<SVGLineElement>("#level-x")!;
const levelG = document.querySelector<SVGLineElement>("#level-g")!;
const theta = document.querySelector<HTMLElement>("#theta")!;
const markerReadout = document.querySelector<HTMLElement>("#marker-readout")!;
const dynamicsNote = document.querySelector<HTMLElement>("#dynamics-note")!;
const confinedNote = document.querySelector<HTMLElement>("#confined-note")!;
const reading = document.querySelector<HTMLElement>("#reading")!;
const histogramTeaser = document.querySelector<HTMLElement>("#histogram-teaser")!;
const histogramSection = document.querySelector<HTMLElement>("#histogram-section")!;
const histogramHeading = document.querySelector<HTMLElement>("#histogram-heading")!;
const syntheticLine = document.querySelector<HTMLElement>("#synthetic-line")!;
const histogramCanvas = document.querySelector<HTMLCanvasElement>("#histogram")!;
const areaBody = document.querySelector<HTMLElement>("#area-body")!;
const g2Readout = document.querySelector<HTMLElement>("#g2-readout")!;
const suppressionLine = document.querySelector<HTMLElement>("#suppression-line")!;
const histogramLimits = document.querySelector<HTMLElement>("#histogram-limits")!;
const demoNote = document.querySelector<HTMLElement>("#demo-note")!;
const demoList = document.querySelector<HTMLElement>("#demo-list")!;
const modelList = document.querySelector<HTMLElement>("#model-list")!;
const modelNotes = document.querySelector<HTMLElement>("#model-notes")!;

const demo = generateDemoWindows();
const histogram = generateExperiment();
const cues = cuePlan(demo);
const audio = new PresentationAudio(cues);
const schematic = new Schematic2D(fallbackCanvas);

let renderer: import("three").WebGLRenderer | null = null;
let device: ReturnType<typeof createDevice> | null = null;
let use2d = false;
let hold = 0;
let playing = false;
let anchorPerf = 0;
let anchorT = 0;
let playToken = 0;
let lastShot = 0;
let labelKey = "";
let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
let slowFrames = 0;

function currentTime(): number {
  if (!playing) return hold;
  return Math.min(DURATION, anchorT + (performance.now() - anchorPerf) / 1000);
}

function setStatus(message: string | null): void {
  if (!message) {
    statusEl.hidden = true;
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = message;
}

function showError(message: string): void {
  errorEl.hidden = false;
  errorEl.textContent = message;
  use2d = true;
  stage.classList.add("is-2d");
  viewButton.setAttribute("aria-pressed", "true");
}

function staticCopy(): void {
  stageHelp.textContent = COPY.stagesIntro;
  dynamicsNote.textContent = `${COPY.emissionDynamics} ${COPY.populations} ${COPY.normalizedTime}`;
  confinedNote.textContent = `${COPY.confined} ${COPY.envelopes}`;
  reading.innerHTML = [
    COPY.mode,
    COPY.modeMeaning,
    COPY.scale,
    COPY.couplingCaveat,
    COPY.collectionLoss,
    COPY.notValidated,
    COPY.noLiteralSound,
  ].map((line) => `<li>${line}</li>`).join("");
  histogramTeaser.textContent = "The many-cycle histogram appears with the coincidence section after the illustrated collection cycle.";
  histogramHeading.textContent = COPY.histogram;
  syntheticLine.textContent = COPY.synthetic;
  demoNote.textContent = `${COPY.demoDistinct} ${COPY.empty} ${COPY.lossWhere} ${COPY.emptyUnassigned}`;
  suppressionLine.textContent = `${COPY.suppression} ${COPY.areas} ${COPY.sidePeaks}`;
  histogramLimits.textContent = `${COPY.notProof} ${COPY.noIndistinguishability} ${COPY.finiteSample} ${COPY.g2Definition}`;
  const half = histogram.model.windowHalfWidth.toFixed(2);
  areaBody.innerHTML = PEAKS.map((peak) => {
    const label = peak > 0 ? `+${peak}` : String(peak);
    return `<tr><td>${label}</td><td>${half}</td><td>${histogram.areas[peak]}</td></tr>`;
  }).join("");
  const ratio = histogram.g2 === null ? "not reported" : histogram.g2.toFixed(3);
  g2Readout.textContent = `A(0) = ${histogram.areas[0]}. Mean side area = ${histogram.sideMean.toFixed(2)}. Estimated pulsed g²(0) = ${ratio}. Windows use half-width ${half} repetition periods. ${COPY.synthetic}`;
  demoList.innerHTML = demo.map((record) => {
    const kind = record.click ? "Click" : "No click";
    return `<li data-demo="${record.index}" class="${record.click ? "is-click" : "is-empty"}">${kind}<span class="sr-only">, cycle ${record.index + 1} of ${DEMO_COUNT}</span></li>`;
  }).join("");
  modelList.innerHTML = [
    `Preparation probability ${MODEL.pPrep}.`,
    `Collected-mode entry, given preparation, ${MODEL.pCollected}.`,
    `Optical transmission, given a collected photon, ${MODEL.pTransmit}.`,
    `Detector response, given arrival, ${MODEL.pDetect}.`,
    `Timing spread σ = ${MODEL.sigmaPeriods} repetition periods.`,
    `Background probability per detector per pulse ${MODEL.pBackground}.`,
    `Multiphoton knob, given one collected photon, ${MODEL.pExtra}.`,
    `${MODEL.cycles} cycles. Seed ${MODEL.seed}. Illustrated-record seed ${20261021}.`,
  ].map((line) => `<li>${line}</li>`).join("");
  modelNotes.textContent = `${COPY.multiKnob} ${COPY.hbtPaths} ${COPY.hbtSample} ${COPY.hbtIdeal} ${COPY.clickNotPath}`;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    histogramTeaser.textContent += " Reduced motion is on. Use shot jumps or press play. Playback does not start by itself.";
  }
}

function renderCopy(state: TimelineState): void {
  const shot = SHOT_COPY[state.shot];
  shotChip.textContent = `Shot ${state.shot} of 5 · ${shot.title} · ${formatSeconds(state.t)}`;
  if (state.shot !== lastShot) {
    lastShot = state.shot;
    shotTitle.textContent = shot.title;
    shotBody.replaceChildren();
    for (const paragraph of shot.paragraphs) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      shotBody.append(p);
    }
    live.textContent = `Shot ${state.shot}: ${shot.title}.`;
  }
  const labels = overlayLabels(state);
  const key = labels.join("|");
  if (key !== labelKey) {
    labelKey = key;
    stageLabels.replaceChildren();
    for (const label of labels) {
      const item = document.createElement("li");
      item.textContent = label;
      stageLabels.append(item);
    }
  }
  const y = 124 - state.marker * 84;
  marker.setAttribute("cy", y.toFixed(2));
  marker.setAttribute("fill", state.marker > 0.5 ? "#FFB703" : "#E6E8EC");
  levelX.setAttribute("stroke-width", state.marker > 0.65 ? "4" : "2");
  levelG.setAttribute("stroke-width", state.marker < 0.35 ? "4" : "2");
  const where = state.marker > 0.65 ? "|X⟩" : state.marker < 0.35 ? "|G⟩" : "between |G⟩ and |X⟩";
  theta.textContent = `${COPY.pulseEquation}. ${COPY.pulseFinal}. θ/π = ${state.pulseAreaOverPi.toFixed(2)}.`;
  markerReadout.textContent = `Marker on ${where}. ${COPY.transition} ${COPY.omitted}`;
  for (const item of stageList.querySelectorAll<HTMLLIElement>("li")) {
    const active = Number(item.dataset.stage) === state.stage;
    if (active) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
    item.textContent = `${active ? "Current: " : ""}${stageName(Number(item.dataset.stage) as TimelineState["stage"])}`;
  }
  histogramSection.hidden = state.histogram < 0.08;
  if (!histogramSection.hidden) paintHistogram(histogramCanvas, histogram, state.centerHighlight);
  const revealed = state.t >= 25 ? state.demoVisible : 0;
  demoList.querySelectorAll<HTMLLIElement>("li").forEach((item, index) => {
    item.style.opacity = index < revealed ? "1" : "0.45";
  });
}

function renderFrame(now: number): void {
  const t = currentTime();
  if (playing && t >= DURATION) {
    playing = false;
    hold = DURATION;
    playToken += 1;
    audio.stopSources();
  }
  const state = stateAt(playing ? Math.min(t, DURATION) : hold);
  const width = Math.max(1, Math.min(stage.clientWidth || 1, 1920));
  const height = Math.max(1, Math.min(stage.clientHeight || 1, 1200));
  const aspect = width / height;
  if (device && renderer && !use2d) {
    updateDevice(device, state, demo, aspect);
    const ratio = pixelRatio;
    if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    renderer.render(device.scene, device.camera);
  }
  if (use2d || fallbackCanvas.clientWidth > 0) {
    if (use2d) schematic.draw(state, demo, histogram);
  }
  renderCopy(state);
  const readout = `${formatSeconds(state.t)} · frame ${state.frame}`;
  if (timeReadout.textContent !== readout) timeReadout.textContent = readout;
  if (document.activeElement !== scrub) scrub.value = state.t.toFixed(3);
  scrub.setAttribute("aria-valuetext", `${state.t.toFixed(3)} seconds, shot ${state.shot}, frame ${state.frame}`);
  playButton.textContent = playing ? "Pause" : "Play";
  playButton.setAttribute("aria-pressed", playing ? "true" : "false");
  app.dataset.t = state.t.toFixed(3);
  app.dataset.shot = String(state.shot);
  app.dataset.frame = String(state.frame);
  app.dataset.waveVisible = state.wave.visible.toFixed(3);
  app.dataset.waveCenter = state.wave.center.toFixed(3);
  app.dataset.absorbed = state.wave.absorbed.toFixed(3);
  app.dataset.playing = playing ? "true" : "false";
  app.dataset.audio = audio.started ? "true" : "false";
  app.dataset.view = use2d ? "2d" : "webgl";
  if (playing) {
    const dt = now - (renderFrame as unknown as { last: number }).last;
    (renderFrame as unknown as { last: number }).last = now;
    if (dt > 42) slowFrames += 1;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 20 && pixelRatio > 1) {
      pixelRatio = 1;
      slowFrames = 0;
    }
  }
  requestAnimationFrame(renderFrame);
}
(renderFrame as unknown as { last: number }).last = performance.now();

async function syncAudio(): Promise<void> {
  const token = ++playToken;
  audio.stopSources();
  try {
    await audio.arm();
  } catch (error) {
    showError(error instanceof Error ? `Audio could not start. ${error.message}` : "Audio could not start.");
    return;
  }
  if (token !== playToken || !playing) return;
  await audio.playFrom(currentTime());
}

function play(): void {
  if (hold >= DURATION - 0.001) hold = 0;
  anchorT = hold;
  anchorPerf = performance.now();
  playing = true;
  void syncAudio();
}

function pause(): void {
  hold = currentTime();
  playing = false;
  playToken += 1;
  audio.stopSources();
}

function seek(time: number, resumeAudio: boolean): void {
  hold = Math.min(DURATION, Math.max(0, time));
  anchorT = hold;
  anchorPerf = performance.now();
  if (resumeAudio && playing) void syncAudio();
}

function toggleView(): void {
  use2d = !use2d;
  stage.classList.toggle("is-2d", use2d);
  viewButton.setAttribute("aria-pressed", use2d ? "true" : "false");
  viewButton.textContent = use2d ? "3D view" : "2D schematic";
}

function toggleFullscreen(): void {
  if (!document.fullscreenEnabled) return;
  if (document.fullscreenElement) void document.exitFullscreen();
  else void app.requestFullscreen();
}

function bind(): void {
  playButton.addEventListener("click", () => {
    if (playing) pause();
    else play();
  });
  replayButton.addEventListener("click", () => {
    hold = 0;
    anchorT = 0;
    anchorPerf = performance.now();
    playing = true;
    void syncAudio();
  });
  scrub.addEventListener("input", () => {
    seek(Number(scrub.value), false);
  });
  scrub.addEventListener("change", () => {
    seek(Number(scrub.value), true);
  });
  muteButton.addEventListener("click", () => {
    const next = muteButton.getAttribute("aria-pressed") !== "true";
    muteButton.setAttribute("aria-pressed", next ? "true" : "false");
    muteButton.textContent = next ? "Unmute" : "Mute";
    audio.setMuted(next);
  });
  musicInput.addEventListener("input", () => audio.setMusic(Number(musicInput.value)));
  sfxInput.addEventListener("input", () => audio.setSfx(Number(sfxInput.value)));
  viewButton.addEventListener("click", toggleView);
  fullscreenButton.addEventListener("click", toggleFullscreen);
  if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
  document.querySelectorAll<HTMLButtonElement>("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      seek(Number(button.dataset.jump), true);
    });
  });
  window.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      if (playing) pause();
      else play();
    } else if (event.key === "r" || event.key === "R") {
      hold = 0;
      anchorT = 0;
      anchorPerf = performance.now();
      playing = true;
      void syncAudio();
    } else if (event.key === "ArrowLeft") {
      seek(currentTime() - 1, true);
    } else if (event.key === "ArrowRight") {
      seek(currentTime() + 1, true);
    } else if (event.key === "Home") {
      seek(0, true);
    } else if (event.key === "End") {
      seek(DURATION, true);
    } else if (event.key === "m" || event.key === "M") {
      muteButton.click();
    } else if (event.key === "f" || event.key === "F") {
      toggleFullscreen();
    }
  });
  window.addEventListener("resize", () => {
    if (renderer) renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  });
}

async function boot(): Promise<void> {
  staticCopy();
  bind();
  try {
    device = createDevice();
    renderer = new THREE.WebGLRenderer({
      canvas: webglCanvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(stage.clientWidth || 800, stage.clientHeight || 600, false);
    const probe = renderer.getContext();
    if (!probe) throw new Error("WebGL context missing");
    setStatus(null);
  } catch (error) {
    showError(error instanceof Error ? `3D view unavailable. ${error.message} The 2D schematic remains available.` : "3D view unavailable. The 2D schematic remains available.");
    setStatus(null);
  }
  app.dataset.ready = "true";
  const debugState = () => stateAt(currentTime());
  Object.assign(window, {
    __QD_EXPLAINER__: {
      stateAt,
      getState: debugState,
      histogram,
      demo,
      audioStarted: () => audio.started,
      playing: () => playing,
    },
  });
  requestAnimationFrame(renderFrame);
}

window.addEventListener("error", (event) => {
  showError(event.message || "The schematic hit an unexpected error.");
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : "unexpected failure";
  showError(reason);
});

void boot();
