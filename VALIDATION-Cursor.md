# Validation

Date of the checks below: 2026-10-20. Results are from commands and a browser session in this environment.

## Unit and type checks

`npx tsc --noEmit` completed with exit code 0.

`npm test` (`tsx tests/validate.ts`) completed with exit code 0. Checks that passed:

- Shot intervals and frames 0, 149, 150, 299, 300, 509, 510, 749, 750, and 1019, including t = 34 holding frame 1019.
- `stateAt` is stable for the same time. Camera pose at 33 s equals the pose at 34 s.
- Sampled camera positions stay outside the pillar.
- At 16:9, the substrate, dot, lens, and detector stay in frame through the establishing move. The dot stays in frame for the preparation close-up. The upper exit stays in frame late in emission. Lens, rejection, and detector stay in frame during collection. The final hold includes the dot, detector, substrate, and HBT anchor.
- Mode intensity is greatest at y = 0, where the dot is placed. The drawn upper stack has fewer layers than the lower stack. Those counts are drawing counts, not a mirror design.
- One wavepacket state. It is hidden before emission, moving and unabsorbed at 13 s, mostly absorbed with center above 0.9 at the selected click, and gone after 24.4 s.
- The π-pulse marker moves from |G⟩ to |X⟩ and the exciton envelope returns during the authored emission. The displayed pulse area stays at π after the pulse.
- Histogram windows at −2, −1, 0, +1, and +2 have the same bin count and do not overlap. A hand-built click list produces 9 pairs and the expected per-window areas. With the multiphoton knob and background set to 0, the central area is 0. The full seeded model is reproducible, central area is 24, each side area is larger, and g²(0) is 0.264.
- The 12 illustrated windows contain both clicks and empty records. Sound cues end before 33 s.
- Required labels are present in the copy module. The source scan did not find Purcell-factor values, quality factor, collection efficiency, unity efficiency, a one-photon-per-cycle claim, g²(0) = 0, or an unqualified "exactly one photon" claim.
- The scene graph has one photon mesh, a separate excitation pulse, HBT detectors A and B, a click marker only on A, and no positive metalness on the lit materials. The brightest mode ring is at the dot.

## Production build

`npm run build` completed with exit code 0 after the final source change. Vite wrote `dist/` with relative asset paths (`./assets/...`). The JavaScript bundle is about 529 kB minified because Three.js is included. No chunk-size warning was emitted after the limit was set to 700 kB.

## Browser, preview at http://127.0.0.1:4173/

Observed on the production preview:

- The page reached `data-ready="true"` in the WebGL view with an empty error alert.
- Before Play, `data-audio` was `false`. After Play, time advanced (a later read showed about 8.5 s, shot 2, frame 253) and `data-audio` was `true`.
- Pause held 20.522 s, frame 615, while half a second passed. The button label returned to Play.
- Seeking with the timeline input reproduced the same state object at 12 s after leaving and returning. Later reads matched the timeline: 9.000 s frame 270 with the pulse hidden and the exciton marker full; 14.000 s frame 420 with one visible unabsorbed wavepacket; 24.1 s with absorption about 0.97, center about 0.99, and the selected click on; 32.000 s frame 960 with the wavepacket hidden, HBT and histogram visible, and all 12 illustrated windows revealed.
- The histogram text matched the unit-test areas: A(0) = 24, mean side area = 91.00, estimated pulsed g²(0) = 0.264, half-width 0.18.
- The 2D schematic button replaced the WebGL canvas and drew the pillar, mode bars, one cyan envelope, and the lens, iris, rejection, and detector labels.
- At 390×844, after the mobile order fix, the transport started at the bottom edge of the stage (`overlap: false`). The Play control was 44 px tall and inside the first screen. The explanation rail began below the controls.
- Screenshots of shots 1, 2, 3, 4, and 5, plus the 2D view, showed one device, silver mode rings around the dot, a violet preparation envelope, amber electron and hole envelopes, one cyan wavepacket, and no second propagating copy after the detector click.

Console: no JavaScript exception was reported. The headless GPU logged `CONTEXT_LOST_WEBGL` during load and, on an earlier load, `Context Restored`, plus repeated ReadPixels stall warnings from the GL driver. Those warnings were not followed by an application error alert.

## Not done

GitHub Pages was not deployed. `gh` is not logged in, and this run has no repository remote. The workflow file is present and unrun.
