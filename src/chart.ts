import { BIN_COUNT, BIN_WIDTH, TAU_MIN, binCenter, type HistogramResult } from "./model";
import { COPY } from "./copy";

export function paintHistogram(canvas: HTMLCanvasElement, result: HistogramResult, highlight: number): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width < 2 || height < 2) return;
  const pixelW = Math.floor(width * dpr);
  const pixelH = Math.floor(height * dpr);
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#0B1019";
  context.fillRect(0, 0, width, height);

  const left = 42;
  const right = width - 12;
  const top = 28;
  const bottom = height - 36;
  const plotW = right - left;
  const plotH = bottom - top;
  const max = Math.max(1, ...result.counts);
  const xAt = (tau: number) => left + ((tau - TAU_MIN) / (BIN_COUNT * BIN_WIDTH)) * plotW;

  context.font = "12px ui-sans-serif, sans-serif";
  context.fillStyle = "#C5C6C7";
  context.save();
  context.translate(14, top + plotH / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = "center";
  context.fillText("Counts", 0, 0);
  context.restore();
  for (const peak of [-2, -1, 0, 1, 2]) {
    const x0 = xAt(peak - result.model.windowHalfWidth);
    const x1 = xAt(peak + result.model.windowHalfWidth);
    context.fillStyle = peak === 0 ? `rgba(255,183,3,${0.1 + 0.18 * highlight})` : "rgba(130,145,165,0.12)";
    context.fillRect(x0, top, x1 - x0, plotH);
    context.fillStyle = "#E6E8EC";
    context.textAlign = "center";
    context.fillText(String(result.areas[peak as -2 | -1 | 0 | 1 | 2]), (x0 + x1) / 2, 22);
  }

  const barW = plotW / BIN_COUNT;
  result.counts.forEach((count, index) => {
    const tau = binCenter(index);
    const x = xAt(tau) - barW / 2;
    const barH = (count / max) * (plotH - 4);
    context.fillStyle = Math.abs(tau) <= result.model.windowHalfWidth ? "#FFB703" : "#7FDBE2";
    context.fillRect(x, bottom - barH, Math.max(1, barW - 0.2), barH);
  });

  context.strokeStyle = "rgba(230,232,236,0.7)";
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(left, bottom);
  context.lineTo(right, bottom);
  context.stroke();
  context.fillStyle = "#C5C6C7";
  context.textAlign = "center";
  context.font = "13px ui-sans-serif, sans-serif";
  for (const peak of [-2, -1, 0, 1, 2]) {
    const x = xAt(peak);
    context.beginPath();
    context.moveTo(x, bottom);
    context.lineTo(x, bottom + 5);
    context.stroke();
    context.fillText(String(peak), x, bottom + 18);
  }
  context.textAlign = "left";
  context.fillText(COPY.axisX, left, height - 6);
}
