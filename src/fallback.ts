import { LAYOUT, modeIntensity } from "./layout";
import { COPY } from "./copy";
import type { DemoWindow, HistogramResult } from "./model";
import type { TimelineState } from "./timeline";

const Y0 = -1.95;
const Y1 = 4.55;

export class Schematic2D {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  draw(state: TimelineState, demo: readonly DemoWindow[], histogram: HistogramResult): void {
    const canvas = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 2 || height < 2) return;
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0B1019";
    context.fillRect(0, 0, width, height);

    const mapY = (y: number) => 16 + (1 - (y - Y0) / (Y1 - Y0)) * (height - 32);
    const pillarX = Math.min(width * 0.34, 280);
    const pillarW = Math.max(36, Math.min(70, width * 0.08));

    const drawBand = (y0: number, y1: number, layers: number) => {
      const top = mapY(y1);
      const bottom = mapY(y0);
      const band = (bottom - top) / layers;
      for (let i = 0; i < layers; i++) {
        context.fillStyle = i % 2 === 0 ? "#263B54" : "#3E5672";
        context.fillRect(pillarX - pillarW / 2, top + i * band + 1, pillarW, Math.max(2, band - 2));
      }
    };
    drawBand(LAYOUT.lowerDbr.y0, LAYOUT.lowerDbr.y1, LAYOUT.lowerDbr.layers);
    drawBand(LAYOUT.upperDbr.y0, LAYOUT.upperDbr.y1, LAYOUT.upperDbr.layers);
    context.strokeStyle = "rgba(38,59,84,0.85)";
    context.strokeRect(pillarX - pillarW / 2 - 8, mapY(LAYOUT.upperDbr.y1), pillarW + 16, mapY(LAYOUT.lowerDbr.y0) - mapY(LAYOUT.upperDbr.y1));

    context.globalAlpha = 0.35 + 0.65 * state.modeOverlay;
    for (let y = -0.64; y <= 0.64; y += 0.04) {
      const intensity = modeIntensity(y);
      context.fillStyle = "#8291A5";
      context.globalAlpha = (0.08 + 0.7 * intensity) * state.modeOverlay;
      const bar = 18 + intensity * 54;
      context.fillRect(pillarX - pillarW / 2 - bar - 10, mapY(y) - 2, bar, 3);
    }
    context.globalAlpha = 1;

    if (state.exciton > 0.02) {
      context.save();
      context.translate(pillarX, mapY(0));
      context.globalAlpha = 0.35 * state.exciton;
      context.fillStyle = "#C4841A";
      context.beginPath();
      context.ellipse(3, 2, 16, 11, 0, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 0.7 * state.exciton;
      context.fillStyle = "#FFD27A";
      context.beginPath();
      context.ellipse(-2, -2, 9, 6, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    context.fillStyle = "#FFB703";
    context.beginPath();
    context.arc(pillarX, mapY(LAYOUT.qdY), 7, 0, Math.PI * 2);
    context.fill();

    const pathX = pillarX + pillarW / 2 + Math.min(90, width * 0.12);
    context.strokeStyle = "rgba(130,145,165,0.7)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(pillarX, mapY(0));
    context.lineTo(pillarX, mapY(LAYOUT.pathEndY));
    context.lineTo(pathX, mapY(LAYOUT.pathEndY));
    context.stroke();

    const optics: Array<[number, string]> = [
      [LAYOUT.lensY, "Lens"],
      [LAYOUT.irisY, "Iris"],
      [LAYOUT.polarizerY, "Rejection"],
      [LAYOUT.detectorFaceY, "Detector"],
    ];
    context.font = "13px ui-sans-serif, sans-serif";
    context.fillStyle = "#C5C6C7";
    for (const [y, label] of optics) {
      context.fillRect(pillarX - 16, mapY(y) - 1, 32, 2);
      context.fillText(label, pillarX + 22, mapY(y) + 4);
    }

    if (state.pulse.visible > 0.02) {
      const y = 0.9 * (1 - state.pulse.center);
      context.globalAlpha = state.pulse.visible;
      context.fillStyle = "#9D4EDD";
      context.beginPath();
      context.ellipse(pillarX - 40 * (1 - state.pulse.center), mapY(y), 22, 10, 0, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
    }

    if (state.wave.visible > 0.02) {
      const y = state.wave.center * LAYOUT.pathEndY;
      context.globalAlpha = Math.min(1, state.wave.visible);
      context.fillStyle = "#00E5FF";
      context.beginPath();
      context.ellipse(pillarX, mapY(y), 14, 20 + state.wave.sigma * 80, 0, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
    }

    if (state.selectedClick > 0.2) {
      context.strokeStyle = "#FFB703";
      context.lineWidth = 2;
      const y = mapY(LAYOUT.detectorFaceY);
      context.strokeRect(pillarX - 8, y - 8, 16, 16);
      context.beginPath();
      context.moveTo(pillarX, y - 5);
      context.lineTo(pillarX, y + 5);
      context.moveTo(pillarX - 5, y);
      context.lineTo(pillarX + 5, y);
      context.stroke();
    }

    if (state.shot === 5) {
      demo.forEach((record, index) => {
        if (index >= state.demoVisible) return;
        const x = 16 + index * 18;
        context.strokeStyle = "#8291A5";
        context.strokeRect(x, height - 28, 14, 14);
        if (record.click) {
          context.fillStyle = "#FFB703";
          context.fillRect(x + 4, height - 24, 6, 6);
        }
      });
    }

    if (state.histogram > 0.05) {
      const plotX = width * 0.62;
      const plotW = width - plotX - 16;
      const plotY = 28;
      const plotH = Math.min(120, height * 0.28);
      if (plotW > 80) {
        const max = Math.max(...histogram.counts, 1);
        context.globalAlpha = state.histogram;
        context.strokeStyle = "rgba(130,145,165,0.4)";
        context.strokeRect(plotX, plotY, plotW, plotH);
        histogram.counts.forEach((count, index) => {
          const x = plotX + (index / histogram.counts.length) * plotW;
          const barH = (count / max) * (plotH - 8);
          context.fillStyle = Math.abs(index - histogram.counts.length / 2) < 12 ? "#FFB703" : "#00E5FF";
          context.fillRect(x, plotY + plotH - barH, Math.max(1, plotW / histogram.counts.length), barH);
        });
        context.globalAlpha = 1;
        context.fillStyle = "#E6E8EC";
        context.fillText(COPY.histogram, plotX, 18);
      }
    }

    context.fillStyle = "#E6E8EC";
    context.font = "14px ui-sans-serif, sans-serif";
    context.fillText("2D schematic", 16, 22);
    context.fillStyle = "#9AA3B2";
    context.fillText(COPY.device, 16, 40);
  }
}
