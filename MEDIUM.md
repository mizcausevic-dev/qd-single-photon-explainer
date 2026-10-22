---
seo_title: "Quantum-dot single-photon source, explained"
seo_title_chars: 43
meta_description: "A micropillar quantum-dot single-photon source in 34 seconds: one exciton, one wavepacket, and a synthetic Hanbury Brown–Twiss histogram you can scrub."
meta_description_chars: 155
slug: quantum-dot-single-photon-source
primary_keyword: quantum-dot single-photon source
secondary_keywords:
  - micropillar cavity
  - Hanbury Brown–Twiss
  - single-photon wavepacket
  - pulsed g²(0)
  - distributed Bragg reflector
og_title: "One dot. One wavepacket. A histogram that tells the truth."
og_description: "Scrub a 34-second schematic of a quantum-dot micropillar source. The coincidence dip is calculated, labeled synthetic, and compared by area."
canonical_note: "Publish on Medium, then point this at the Medium URL. Repo: https://github.com/mizcausevic-dev/qd-single-photon-explainer"
---

# A quantum-dot single-photon source, explained in 34 seconds

**Dek.** A micropillar, a quantum dot, one emitted wavepacket, and a coincidence histogram that compares areas. The picture is a schematic. The counts are synthetic. Both labels stay on screen.

You can watch a full cycle of a quantum-dot single-photon source in half a minute and still walk away with the wrong mechanism. Most drawings help that happen. They turn a Bragg mirror into chrome, equate a bright dot with a guaranteed click, and draw two detector paths as if one photon had been photocopied.

This piece is the narration for a 34-second interactive schematic that refuses those shortcuts. Open it, press Play, and scrub. The same time always returns the same frame. Nothing here is a measured device, and the histogram says so in the caption.

Live explainer: https://mizcausevic-dev.github.io/qd-single-photon-explainer/

Source: https://github.com/mizcausevic-dev/qd-single-photon-explainer

## What you are actually looking at

A useful quantum-dot single-photon source is a semiconductor structure that can be driven to emit one optical excitation into a chosen mode, on a clock you control. The ideal, as Senellart, Solomon, and White put it in their 2017 review, is an on-demand source that delivers a pulse in a defined polarization and spatiotemporal mode and that contains exactly one photon. Indistinguishability is a further requirement for many quantum-optics experiments, and it is a different claim from "I saw a click."

The explainer shows one common geometry for that idea: a micropillar cavity. A quantum dot sits in a spacer between two distributed Bragg reflectors. The upper stack is drawn shorter than the lower stack so the preferred output is upward, through a lens, an iris, a polarization rejection stage, and into an absorptive detector. A second, separate arrangement is the Hanbury Brown–Twiss setup used for the coincidence record.

Three boundaries are printed because they change how you should read every later frame.

- The banner is "Scientific schematic with idealized preparation and synthetic detection."
- The pillar is a "Representative device—not a fabrication design."
- Colors are explanatory encodings, not wavelengths. The muted silver on the mirrors is a presentation treatment. The reflectors are semiconductor layers, not metal.

Layer counts, thicknesses, dot composition, wavelength, temperature, lifetime, cavity Q, and collection efficiency are not stated, because this model does not know them. Inventing a Q to make the picture feel finished would be a different product.

## The cavity mode is a map, not a lamp

In the first five seconds the camera holds a wide view, then moves closer. A stack of rings appears through the cavity. Brighter rings mark higher relative intensity of the cavity mode. The dot is drawn large, and it sits at an antinode of that pattern.

Read the overlay as a coupling map. It shows where a dipole would rather radiate into the selected mode. It does not mean the empty cavity is full of light, waiting. An empty cavity mode is a property of the structure. Light in that mode is a separate fact, and this shot is not claiming the second fact.

Placement at an antinode is also not a coupon for optimal coupling. Spectral match and polarization match are part of the operating condition the later shots assume. The drawing can show the favorable seat. It cannot show that a real dot was grown in that seat, at that energy, with that orientation.

## Preparation is a π pulse, and a π pulse is not a click

From 5 seconds to 10 seconds the story drops to two levels.

|G⟩ is the ground state of the selected transition: no selected exciton. |X⟩ is one confined electron–hole excitation. A violet envelope sweeps in. The area on the rail climbs as θ = ∫Ω(t)dt and is marked θ_final = π. That is an idealized resonant π pulse for |G⟩ → |X⟩.

Two shapes sit on the dot while the level marker rises. The smaller envelope is the electron. The larger envelope is the hole. They are overlapping schematic densities. They are not orbits, not a hole in the sense of a void, and not two particles colliding.

Hold three caveats in the same hand as the pulse.

The violet envelope is not "exactly one photon" drawn as a blob. It is the drive. Ideal preparation is not guaranteed collection, and it is not guaranteed detection. Other states and preparation imperfections are omitted on purpose. The clock on screen is normalized presentation time. Those seconds are not the physical width of a laboratory pulse.

If you scrub back to 6.5 seconds, the marker is mid-climb. Scrub to 9 seconds and the pulse has left, while the exciton envelopes are still there. That gap is the point. Preparation and emission are neighbors on the timeline. They are not the same event.

## One exciton, one wavepacket

At 10 seconds the return starts: |X⟩ → |G⟩ plus one emitted optical excitation. The picture is a weak-coupling, Purcell-regime sketch. The cavity changes the optical environment the dot decays into. It can favor emission into a selected mode, and the pillar's output pattern can make that mode easier to collect. None of that is a promise at arbitrary detuning or alignment.

This is not a movie of vacuum Rabi flopping. Energy is not sloshing back and forth between atom and cavity as a coherent exchange you could count on your fingers. The cavity does not mint extra photons from one exciton.

The outgoing object is one cyan envelope. It is a single-photon wavepacket representation: a smooth packet moving along the collection path. It is not a classical field trace, and it is not a particle with a trajectory you could have photographed along the way. No carrier wave is drawn. An oscillating line would be easy to misread as the electric-field expectation of a one-photon state, which is the wrong picture.

Watch the envelope cross the lens, the iris, and the rejection stage. Optical interfaces do not fork it into copies. There is one representation the whole way. At the detector face the packet ends. The face is absorptive. The propagation drawing stops, and one click record appears. That same detection is not forwarded to a second detector.

A missing click, later, will not tell you which stage failed. Preparation, radiative emission, coupling into the collected mode, optical transmission, and detector response are separate. The illustrated cycle is one successful pass. It is not a claim about every pulse in a real lab.

## Rejection is not a color filter

Excitation light and emission can sit on top of each other in wavelength. A tinted-glass metaphor would be false. The stage after the iris is a generic spatial and polarization rejection sketch. It is not perfect rejection. Filters and collection optics also throw light away. Loss is part of the instrument, not a footnote for the failure case.

The product copy keeps the line short enough to glance at while the packet is in flight: "Resonant-pump rejection · schematic." The longer version is the one to remember when someone treats a click probability as a brightness.

## The Hanbury Brown–Twiss histogram compares areas

At 25 seconds the view changes job. A short strip of single-detector windows appears, some with a click and some empty. That strip is a 12-cycle illustration with its own seed (`20261021`). It is not the sample that built the histogram. Empty windows are not each assigned a cause. The simulation does not know, and it does not pretend.

Beside that strip, a separate Hanbury Brown–Twiss arrangement fades in: collected output, a beam splitter, detector A, detector B, then a correlation of time tags. The two arms are possible optical paths. They are not two photons made from one. For an ideal one-photon input and ideal detectors, one event can register at most one signal click across the outputs. A highlighted click on one detector is a detection record. Classical routing language does not finish the description of the optical state at the beam splitter.

The histogram is many cycles, not that demo strip. The horizontal axis is detection-time difference divided by the repetition period. The vertical axis is coincidence counts. Side peaks are pairs from different pulses. They are not two detections of one photon.

The central peak is integrated over the same window width as each side peak. Half-width is 0.18 repetition periods. Comparing bar heights would be a different, weaker claim. The explainer prints the areas.

| Delay (repetition periods) | Integrated counts |
| --- | ---: |
| −2 | 90 |
| −1 | 94 |
| 0 | 24 |
| +1 | 95 |
| +2 | 85 |

Mean side area is 91.00. Estimated pulsed g²(0) is A(0) divided by that mean: 0.264. The sample is 12,000 cycles, seed `20261020`, and 388 pairs land inside ±2.5 periods. The caption on the chart is "Synthetic data—not device performance."

Those probabilities are knobs in a detection-record model, disclosed so the figure can be rebuilt:

| Knob | Value | Meaning in this model |
| --- | ---: | --- |
| Preparation | 0.70 | Selected transition is prepared |
| Collected-mode entry | 0.40 | Given preparation, one photon enters the collected-mode model |
| Transmission | 0.75 | Given that photon, it passes rejection and collection |
| Detector response | 0.80 | Given arrival, the detector clicks |
| Multiphoton knob | 0.018 | Given one collected photon, a second photon is added |
| Background | 0.003 | Per detector, per pulse |
| Timing spread | 0.035 | Gaussian σ, in repetition periods |

The multiphoton knob is an effective term in the record. It is not a biexciton cascade, not a charged exciton, and not two-photon excitation. It is not drawn on the two-level diagram. Set that knob and the background to zero and the central window integrates to zero. The dip in the published figure is the knob plus background plus finite sample, not an artist adding a few counts so the middle "looks quantum."

## What a low central peak does not prove

A suppressed center means fewer same-pulse two-detection events than different-pulse events, under this measurement model. That is the sentence. These are the sentences it does not license.

- It does not prove one detected photon every cycle.
- It does not prove perfect collection.
- It does not prove zero background.
- It does not establish photon indistinguishability. This record is not a Hong–Ou–Mandel trace.
- A finite central count does not prove the multiphoton probability is zero. Run the seed again and the area at zero is 24, not 0.

Side peaks are the reference for different pulses. They are the right denominator only if the windows match and the source is being driven periodically. Change the window half-width and you change A(0), the side mean, and the ratio. The explainer freezes the half-width at 0.18 so the comparison stays honest.

## How the 34 seconds are built

The film is one master clock. Duration 34.000 seconds, 30 frames per second, frames 0 through 1019. Five shots: device, preparation, emission, collection, records. Playback follows wall-clock time, so a slow laptop does not stretch the physics. Seeking calls a pure function of time. Pause, scrub, replay, mute, and a 2D fallback are part of the instrument, not a debug overlay.

Audio is procedural and stays silent until you press Play or Replay. Mute turns the gain down. It does not throw the score away and rebuild it. The sounds are presentation cues. They are not photons made audible, and they are not optical frequencies.

If you only have a minute, use the shot jumps. Shot 1 is the pillar and the mode map. Shot 2 is the π pulse. Shot 3 is the wavepacket leaving the dot. Shot 4 ends on the detector. Shot 5 is the only place the histogram is allowed to argue.

## What this is for

Build the page, hand it to someone who has seen a micropillar cartoon and came away thinking the mirrors were metal and the histogram was a vibe. Then hand it to someone who can read a g²(0) and will check whether you integrated the peaks on equal windows. Both readers should be able to finish the 34 seconds without being lied to.

The field review to start from, if you want real devices after the schematic, is Senellart, Solomon, and White, "High-performance semiconductor quantum-dot single-photon sources," *Nature Nanotechnology* 12, 1026–1039 (2017), [doi:10.1038/nnano.2017.218](https://doi.org/10.1038/nnano.2017.218). Performance numbers in that literature belong to those devices. They are not implied by this drawing.

## Run it, or rebuild the figure

```bash
npm install
npm test
npm run dev
```

`npm test` checks the timeline boundaries, the seeded areas, and the g²(0) ratio above. If those numbers move, the article is wrong and the chart is wrong with it.

Press Play. Scrub to the histogram. Read the areas before you read the ratio. Then decide what you are willing to claim, which is a shorter list than the animation is willing to draw.
