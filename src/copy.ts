import type { TimelineState } from "./timeline";

/** Required labels keep the punctuation specified in the brief. Other prose does not add em dashes. */
export const COPY = {
  evidence: "Scientific schematic with idealized preparation and synthetic detection.",
  device: "Representative device—not a fabrication design.",
  mode: "Relative cavity-mode intensity · schematic.",
  modeMeaning:
    "The mode overlay shows where coupling is favorable. It does not mean that the empty cavity continuously contains light.",
  scale: "Quantum dot enlarged—not to scale.",
  couplingCaveat:
    "Placement at an intensity antinode does not by itself guarantee optimal coupling. Spectral and polarization matching are part of the selected conceptual operating condition.",
  layers:
    "Illustrative layer arrangement, not measured thicknesses or a fabrication design. Alternating layers are semiconductor Bragg reflectors. The muted silver look is a presentation treatment, not metal mirrors. The upper stack is drawn shorter to suggest a preferred upper output.",
  colors: "Colors are explanatory encodings, not wavelengths.",
  transition: "Selected transition · simplified model.",
  omitted: "Other states and preparation imperfections omitted.",
  confined: "Confined electron–hole excitation.",
  envelopes:
    "Smaller envelope: electron. Larger envelope: hole. Overlapping schematic densities, not orbits, voids, or colliding particles.",
  pulseEquation: "θ = ∫Ω(t)dt",
  pulseFinal: "θ_final = π",
  pulseMeaning:
    "Idealized resonant π pulse for |G⟩ → |X⟩. The violet envelope is not exactly one photon. Ideal preparation is not guaranteed collection or detection.",
  normalizedTime: "Normalized presentation time. Displayed durations are not physical pulse parameters.",
  emissionDynamics: "Emission dynamics schematic.",
  recombination: "Radiative recombination.",
  cavityAssisted: "Cavity-assisted emission.",
  weakCoupling:
    "Weak-coupling, Purcell-regime picture: the cavity modifies the optical environment, can enhance coupling into a selected mode, and its output structure assists collection. Enhancement is not guaranteed for arbitrary detuning or alignment. This is not repeated coherent energy exchange.",
  oneExciton: "The cavity does not create extra photons from one exciton.",
  populations:
    "Exciton occupation, intracavity photon population, the outgoing envelope, and detection probability are different quantities. They are not equated here.",
  wavepacket: "Single-photon wavepacket representation.",
  wavepacketCaveat: "This is not a classical field measurement or a tracked particle path.",
  noOscillation:
    "No carrier oscillation is drawn. An oscillating drawing would be a schematic mode function, not a literal electric-field expectation for a single-photon state.",
  continuous: "One continuous representation. Optical interfaces do not create extra copies.",
  rejection: "Resonant-pump rejection · schematic.",
  notColorFilter:
    "Excitation and emission can overlap spectrally, so this stage is not a color filter. It is a generic spatial and polarization rejection schematic, not perfect rejection.",
  collectionLoss: "Rejection and collection optics can introduce loss.",
  stagesIntro:
    "Preparation, radiative emission, coupling into the collected mode, optical transmission, and detector response are separate. A missing click does not uniquely identify which stage failed.",
  illustrativeCycle: "One illustrated successful cycle, not a promise about every cycle.",
  absorptive:
    "Absorptive detector: the wavepacket representation reaches the detector, that propagation representation ends, and one click record appears. The same detection is not sent to another detector.",
  empty: "Some cycles produce no recorded click.",
  lossWhere: "Loss may occur during preparation, emission, collection, transmission, or detection.",
  emptyUnassigned:
    "Empty illustrated windows are not each assigned a failure stage. The simulation does not display a per-window cause.",
  hbtIntro:
    "Separate Hanbury Brown–Twiss arrangement: collected output, beam splitter, detector A and detector B, then time-tag correlation. This is not the single-detector collection example.",
  hbtPaths: "The two branches are possible optical paths, not duplicated photons.",
  hbtSample: "A sampled branch is a detection-record visualization. Classical routing does not fully describe the optical state at the beam splitter.",
  hbtIdeal:
    "For an ideal one-photon input and ideal detectors, one event can produce at most one signal click across the outputs.",
  histogram: "Many-cycle coincidence histogram.",
  axisX: "Detection-time difference / repetition period.",
  axisY: "Coincidence counts.",
  synthetic: "Synthetic data—not device performance.",
  suppression:
    "Suppressed central coincidences indicate fewer same-pulse two-detection events relative to different-pulse events under this measurement model.",
  areas: "Integrated peak areas use equal windows. The comparison is not peak height alone.",
  sidePeaks: "Side-peak clicks are events from different pulses. They are not both detections of one photon.",
  notProof:
    "Central suppression does not prove one detected photon every cycle, perfect collection, perfect indistinguishability, or zero background.",
  noIndistinguishability: "This measurement does not establish photon indistinguishability.",
  finiteSample: "A finite-sample central count does not prove zero multiphoton probability.",
  g2Definition:
    "Estimated pulsed g²(0) = A(0) / mean(A(−2), A(−1), A(+1), A(+2)). Each A is the coincidence count integrated in a window of the same half-width. Side peaks are the different-pulse reference under this model.",
  multiKnob:
    "The extra photon is an effective multiphoton term in the detection-record model. It is not a biexciton cascade, charged-exciton cycle, or two-photon excitation, and it is not added to the two-level diagram.",
  demoDistinct: "Illustrated detection records are a short single-detector sequence. They are not the histogram sample.",
  clickNotPath: "Clicks are detector records, not continuous observations of a photon path.",
  noLiteralSound: "Presentation sounds are not literal photon sounds or audible optical frequencies.",
  notValidated:
    "This preparation model does not validate dot structure, cavity coupling, optical modes, lifetime, brightness, multiphoton suppression, or indistinguishability. No full quantum-optical simulation, electromagnetic validation, or experimental agreement is claimed.",
} as const;

export const SHOT_COPY: Record<TimelineState["shot"], { title: string; paragraphs: string[] }> = {
  1: {
    title: "Device and cavity",
    paragraphs: [
      "A semiconductor micropillar cavity with a quantum dot in the cavity region, upper and lower distributed Bragg reflectors, a preferred upper output, collection optics, a pump-rejection stage, and an absorptive detector.",
      `${COPY.mode} ${COPY.modeMeaning} ${COPY.scale} ${COPY.couplingCaveat}`,
      `${COPY.layers} ${COPY.device}`,
    ],
  },
  2: {
    title: "Exciton preparation",
    paragraphs: [
      `${COPY.transition} |G⟩: no selected exciton. |X⟩: one confined electron–hole excitation.`,
      `${COPY.pulseMeaning} ${COPY.pulseEquation}. ${COPY.pulseFinal}. ${COPY.omitted}`,
      `${COPY.confined} ${COPY.envelopes} ${COPY.normalizedTime}`,
    ],
  },
  3: {
    title: "Radiative emission",
    paragraphs: [
      `${COPY.recombination} The selected return is |X⟩ → |G⟩ plus one emitted optical excitation. ${COPY.cavityAssisted}`,
      `${COPY.weakCoupling} ${COPY.oneExciton} ${COPY.emissionDynamics} ${COPY.populations}`,
      `${COPY.wavepacket} ${COPY.wavepacketCaveat} ${COPY.continuous} ${COPY.noOscillation}`,
    ],
  },
  4: {
    title: "Collection and detection",
    paragraphs: [
      `${COPY.rejection} ${COPY.notColorFilter} ${COPY.collectionLoss}`,
      `${COPY.stagesIntro}`,
      `${COPY.absorptive} ${COPY.illustrativeCycle} ${COPY.clickNotPath}`,
    ],
  },
  5: {
    title: "Records and coincidences",
    paragraphs: [
      `${COPY.empty} ${COPY.lossWhere} ${COPY.emptyUnassigned} ${COPY.demoDistinct}`,
      `${COPY.hbtIntro} ${COPY.hbtPaths} ${COPY.hbtSample} ${COPY.hbtIdeal}`,
      `${COPY.histogram} ${COPY.synthetic} ${COPY.areas} ${COPY.suppression} ${COPY.sidePeaks} ${COPY.notProof} ${COPY.noIndistinguishability} ${COPY.finiteSample}`,
    ],
  },
};

export function stageName(stage: TimelineState["stage"]): string {
  switch (stage) {
    case 1:
      return "Preparation";
    case 2:
      return "Radiative emission";
    case 3:
      return "Coupling into the collected mode";
    case 4:
      return "Optical transmission";
    case 5:
      return "Detector response";
    default:
      return "No single stage is singled out";
  }
}

export function overlayLabels(state: TimelineState): string[] {
  const labels: string[] = [];
  if (state.shot === 1 || state.modeOverlay > 0.2) labels.push(COPY.mode);
  if (state.shot <= 2) labels.push(COPY.scale);
  if (state.shot === 2 || state.levels > 0.4 && state.shot === 3) labels.push(COPY.transition);
  if (state.exciton > 0.15) labels.push(COPY.confined);
  if (state.shot === 3) {
    labels.push(COPY.recombination);
    labels.push(COPY.cavityAssisted);
  }
  if (state.wave.visible > 0.05) {
    labels.push(COPY.wavepacket);
    labels.push(COPY.wavepacketCaveat);
  }
  if (state.shot === 4) labels.push(COPY.rejection);
  if (state.selectedClick > 0.5 && state.shot >= 4) labels.push("Selected click recorded. Propagation representation ended.");
  if (state.shot === 5) {
    labels.push(COPY.empty);
    labels.push(COPY.histogram);
    labels.push(COPY.synthetic);
  }
  return labels;
}
