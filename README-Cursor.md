# Semiconductor quantum-dot single-photon source

Cinematic 34-second schematic of a micropillar quantum-dot single-photon source, with idealized preparation and a synthetic Hanbury Brown–Twiss histogram.

Scientific schematic with idealized preparation and synthetic detection. Representative device—not a fabrication design.

## Run

```bash
npm install
npm test
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Open the preview URL Vite prints. Audio starts only after Play, Replay, or another explicit control. Nothing autoplays.

## What is calculated

The coincidence histogram is option B from the brief: seeded synthetic detection records, not a measured device and not a qualitative drawing with extra central counts added by hand.

- 12,000 cycles, seed `20261020`
- Preparation, collected-mode entry, transmission, detector response, timing spread, background, and an effective multiphoton knob
- Equal integration windows of half-width 0.18 repetition periods at delays −2, −1, 0, +1, and +2
- Estimated pulsed g²(0) = A(0) / mean side area

The checked run produced A(−2)=90, A(−1)=94, A(0)=24, A(+1)=95, A(+2)=85, mean side area 91.00, g²(0)=0.264, from 388 pairs inside ±2.5 periods. Synthetic data—not device performance.

A separate 12-cycle single-detector strip (seed `20261021`) is only an illustration. It is not the histogram sample. Empty windows are not given a per-window cause.

The camera, pulse, exciton marker, wavepacket, and labels are authored functions of timeline time. They are not a quantum-dynamical or electromagnetic solution. Seeking to the same time reproduces the same state. Playback uses wall-clock time, not the render frame rate.

## GitHub

Repository: https://github.com/mizcausevic-dev/qd-single-photon-explainer

About line:

Cinematic 34-second schematic of a quantum-dot micropillar single-photon source, with a synthetic Hanbury Brown–Twiss histogram.

Topics: `quantum-optics`, `single-photon`, `quantum-dot`, `threejs`, `typescript`, `vite`, `hanbury-brown-twiss`, `scientific-visualization`, `webgl`

`.github/workflows/pages.yml` runs `npm ci`, `npm test`, and `npm run build`, then publishes `dist` to a branch named `pages`. Vite `base` is `./`, so the built asset paths are relative. The Actions token cannot enable GitHub Pages (`403 Resource not accessible by integration`). The built site is already on `pages`. Serving it requires Deploy from branch `pages` at `/`, which produces https://mizcausevic-dev.github.io/qd-single-photon-explainer/

The Medium draft is `MEDIUM.md`.

## Stack note

The prescribed quantum-optics palette is the interface. The seven-theme dashboard default does not apply to this explainer. Motion is a Three.js timeline, not a React animation library. Labels specified with an em dash keep that punctuation. Other prose does not add em dashes.

The same timeline, seeded record model, and equal-window histogram can be reused for another cavity-QED teaching piece by replacing the device geometry and the disclosed probabilities.
