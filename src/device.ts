import * as THREE from "three";
import { LAYOUT, demoCardPosition, modeIntensity } from "./layout";
import { DEMO_COUNT, type DemoWindow } from "./model";
import { fovForAspect, type TimelineState } from "./timeline";

const ENVELOPE_VERTEX = `
attribute float aS;
varying float vS;
void main() {
  vS = aS;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ENVELOPE_FRAGMENT = `
varying float vS;
uniform float uCenter;
uniform float uSigma;
uniform float uAlpha;
uniform vec3 uColor;
void main() {
  float d = (vS - uCenter) / max(uSigma, 1.0e-4);
  float alpha = exp(-d * d) * uAlpha;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export interface DeviceRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  shell: THREE.Mesh;
  mode: THREE.Group;
  pulseMesh: THREE.Mesh;
  pulseMat: THREE.ShaderMaterial;
  waveMesh: THREE.Mesh;
  waveMat: THREE.ShaderMaterial;
  electron: THREE.Mesh;
  hole: THREE.Mesh;
  click: THREE.Mesh;
  hbt: THREE.Group;
  hbtClick: THREE.Mesh;
  demos: THREE.Mesh[];
}

function envelopeMaterial(color: THREE.ColorRepresentation): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCenter: { value: 0 },
      uSigma: { value: 0.1 },
      uAlpha: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: ENVELOPE_VERTEX,
    fragmentShader: ENVELOPE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

function attachPathS(geometry: THREE.BufferGeometry, tubularSegments: number, radialSegments: number): void {
  const position = geometry.getAttribute("position");
  const ring = radialSegments + 1;
  const values = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    values[i] = Math.min(1, Math.floor(i / ring) / tubularSegments);
  }
  geometry.setAttribute("aS", new THREE.BufferAttribute(values, 1));
}

function tubeAlong(points: THREE.Vector3[], radius: number, tubular = 96, radial = 10): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  attachPathS(geometry, tubular, radial);
  return geometry;
}

function polarizerMaterial(): THREE.Material {
  if (typeof document === "undefined") {
    return new THREE.MeshBasicMaterial({
      color: 0x8291a5,
      transparent: true,
      opacity: 0.28,
      toneMapped: false,
      depthWrite: false,
    });
  }
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.MeshBasicMaterial({ color: 0x8291a5, transparent: true, opacity: 0.28 });
  }
  context.fillStyle = "#1a2636";
  context.fillRect(0, 0, 128, 128);
  context.strokeStyle = "#8291A5";
  context.lineWidth = 2;
  for (let x = 0; x < 176; x += 12) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x - 52, 128);
    context.stroke();
  }
  context.strokeStyle = "#FFB703";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(22, 64);
  context.lineTo(100, 64);
  context.stroke();
  context.beginPath();
  context.moveTo(88, 54);
  context.lineTo(106, 64);
  context.lineTo(88, 74);
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    toneMapped: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function addBragg(parent: THREE.Object3D, y0: number, y1: number, layers: number, name: string): void {
  const height = (y1 - y0) / layers;
  const geometry = new THREE.CylinderGeometry(LAYOUT.hostRadius, LAYOUT.hostRadius, height * 0.78, 40);
  for (let index = 0; index < layers; index++) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: index % 2 === 0 ? 0x263b54 : 0x3e5672,
        roughness: 0.82,
        metalness: 0,
      }),
    );
    mesh.position.y = y0 + height * (index + 0.5);
    mesh.name = name;
    parent.add(mesh);
  }
}

function diagramLine(a: THREE.Vector3, b: THREE.Vector3): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x8291a5, transparent: true, opacity: 0.9, toneMapped: false }),
  );
}

export function createDevice(): DeviceRefs {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1019);
  scene.add(new THREE.HemisphereLight(0xc5d0dc, 0x0b1019, 0.9));
  const key = new THREE.DirectionalLight(0xf7f8fa, 1.2);
  key.position.set(4.8, 8.2, 6.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6e86a4, 0.42);
  fill.position.set(-5.5, 2.4, -4);
  scene.add(fill);

  const root = new THREE.Group();
  root.name = "device";
  scene.add(root);

  const substrate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.84, LAYOUT.substrateHeight, 40),
    new THREE.MeshStandardMaterial({ color: 0x1a2838, roughness: 0.92, metalness: 0 }),
  );
  substrate.position.y = LAYOUT.substrateY;
  substrate.name = "substrate";
  root.add(substrate);

  addBragg(root, LAYOUT.lowerDbr.y0, LAYOUT.lowerDbr.y1, LAYOUT.lowerDbr.layers, "lower-bragg");
  addBragg(root, LAYOUT.upperDbr.y0, LAYOUT.upperDbr.y1, LAYOUT.upperDbr.layers, "upper-bragg");

  const spacer = new THREE.Mesh(
    new THREE.CylinderGeometry(LAYOUT.hostRadius, LAYOUT.hostRadius, LAYOUT.cavityHalf * 2, 40, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x263b54,
      transparent: true,
      opacity: 0.16,
      roughness: 0.45,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  spacer.name = "cavity-spacer";
  root.add(spacer);

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(LAYOUT.shellRadius, LAYOUT.shellRadius, 2.7, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x263b54,
      transparent: true,
      opacity: 0.38,
      roughness: 0.35,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  shell.position.y = -0.13;
  shell.name = "host-shell";
  shell.renderOrder = 1;
  root.add(shell);

  const mode = new THREE.Group();
  mode.name = "mode-overlay";
  mode.userData.role = "mode";
  const ring = new THREE.RingGeometry(0.045, 0.085, 48);
  for (let y = -0.64; y <= 0.64 + 1e-6; y += 0.04) {
    const intensity = modeIntensity(Number(y.toFixed(4)));
    const material = new THREE.MeshBasicMaterial({
      color: 0x8291a5,
      transparent: true,
      opacity: 0.05 + 0.62 * intensity,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(ring, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = y;
    mesh.scale.setScalar(0.55 + 2.7 * Math.sqrt(intensity));
    mesh.userData.baseOpacity = material.opacity;
    mesh.userData.intensity = intensity;
    mesh.renderOrder = 4;
    mode.add(mesh);
  }
  root.add(mode);

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 32, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffb703,
      roughness: 0.42,
      metalness: 0,
      emissive: 0xffb703,
      emissiveIntensity: 0.08,
    }),
  );
  dot.position.y = LAYOUT.qdY;
  dot.name = "quantum-dot";
  root.add(dot);

  const electron = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 28, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffd27a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  electron.scale.set(0.72, 0.48, 0.62);
  electron.position.set(-0.05, 0.012, 0.02);
  electron.name = "exciton-electron";
  electron.renderOrder = 9;
  root.add(electron);

  const hole = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 28, 20),
    new THREE.MeshBasicMaterial({
      color: 0xc4841a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  hole.scale.set(1.15, 0.7, 0.95);
  hole.position.set(0.055, -0.02, 0.015);
  hole.name = "exciton-hole";
  hole.renderOrder = 9;
  root.add(hole);

  const outputPoints = [0, 1.22, 2.05, 2.7, 3.15, LAYOUT.pathEndY].map((y) => new THREE.Vector3(0, y, 0));
  const guide = new THREE.Mesh(
    tubeAlong(outputPoints, 0.012, 64, 6),
    new THREE.MeshBasicMaterial({
      color: 0x8291a5,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  guide.name = "collection-path";
  guide.renderOrder = 3;
  root.add(guide);

  const waveMat = envelopeMaterial(0x00e5ff);
  const waveMesh = new THREE.Mesh(tubeAlong(outputPoints, 0.075, 120, 12), waveMat);
  waveMesh.name = "wavepacket";
  waveMesh.userData.role = "photon";
  waveMesh.renderOrder = 8;
  root.add(waveMesh);

  const pulsePoints = [
    new THREE.Vector3(-1.75, 0.95, 0.85),
    new THREE.Vector3(-1.05, 0.55, 0.42),
    new THREE.Vector3(-0.4, 0.16, 0.12),
    new THREE.Vector3(0, 0, 0),
  ];
  const pulseMat = envelopeMaterial(0x9d4edd);
  const pulseMesh = new THREE.Mesh(tubeAlong(pulsePoints, 0.09, 80, 12), pulseMat);
  pulseMesh.name = "excitation-pulse";
  pulseMesh.userData.role = "excitation";
  pulseMesh.renderOrder = 7;
  root.add(pulseMesh);

  const lens = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 36, 24),
    new THREE.MeshStandardMaterial({
      color: 0x8291a5,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0,
      depthWrite: false,
    }),
  );
  lens.scale.set(1.15, 0.34, 1.15);
  lens.position.y = LAYOUT.lensY;
  lens.name = "collection-lens";
  root.add(lens);

  const iris = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.018, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0x8291a5, roughness: 0.45, metalness: 0 }),
  );
  iris.rotation.x = Math.PI / 2;
  iris.position.y = LAYOUT.irisY;
  iris.name = "spatial-filter";
  root.add(iris);

  const polarizer = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.035, 0.72), polarizerMaterial());
  polarizer.position.y = LAYOUT.polarizerY;
  polarizer.name = "pump-rejection";
  polarizer.renderOrder = 5;
  root.add(polarizer);

  const detector = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.48, 0.74),
    new THREE.MeshStandardMaterial({ color: 0x141c28, roughness: 0.88, metalness: 0 }),
  );
  detector.position.y = LAYOUT.detectorBodyY;
  detector.name = "detector";
  root.add(detector);

  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.045, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x07090d, roughness: 1, metalness: 0 }),
  );
  face.position.y = LAYOUT.detectorFaceY;
  face.name = "detector-face";
  root.add(face);

  const click = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.02, 0.16),
    new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
    }),
  );
  click.position.y = LAYOUT.detectorFaceY - 0.05;
  click.name = "selected-click";
  click.userData.role = "record";
  click.renderOrder = 9;
  root.add(click);

  const hbt = new THREE.Group();
  hbt.name = "hbt-rig";
  hbt.position.set(LAYOUT.hbtOrigin.x, LAYOUT.hbtOrigin.y, LAYOUT.hbtOrigin.z);
  hbt.add(diagramLine(new THREE.Vector3(-0.15, 0, 0), new THREE.Vector3(0.42, 0, 0)));
  const splitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.26, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x8291a5, roughness: 0.35, metalness: 0, transparent: true, opacity: 0.85 }),
  );
  splitter.position.x = 0.62;
  splitter.name = "beam-splitter";
  hbt.add(splitter);
  hbt.add(diagramLine(new THREE.Vector3(0.78, 0.08, 0), new THREE.Vector3(1.28, 0.42, 0)));
  hbt.add(diagramLine(new THREE.Vector3(0.78, -0.08, 0), new THREE.Vector3(1.28, -0.42, 0)));
  const detA = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.16, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x1a2330, roughness: 0.8, metalness: 0 }),
  );
  detA.position.set(1.48, 0.42, 0);
  detA.name = "hbt-detector-a";
  hbt.add(detA);
  const detB = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.16, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x1a2330, roughness: 0.8, metalness: 0 }),
  );
  detB.position.set(1.48, -0.42, 0);
  detB.name = "hbt-detector-b";
  hbt.add(detB);
  const hbtClick = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xffb703, toneMapped: false }),
  );
  hbtClick.position.set(1.48, 0.42, 0.1);
  hbtClick.name = "hbt-example-click-a";
  hbt.add(hbtClick);
  hbt.visible = false;
  root.add(hbt);

  const demos: THREE.Mesh[] = [];
  for (let index = 0; index < DEMO_COUNT; index++) {
    const position = demoCardPosition(index);
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.02),
      new THREE.MeshBasicMaterial({
        color: 0x8291a5,
        transparent: true,
        opacity: 0.35,
        toneMapped: false,
      }),
    );
    plate.position.set(position.x, position.y, position.z);
    plate.name = `demo-window-${index}`;
    plate.visible = false;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.09, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xffb703, toneMapped: false }),
    );
    tick.position.z = 0.02;
    tick.name = "demo-click-mark";
    tick.visible = false;
    plate.add(tick);
    plate.userData.tick = tick;
    root.add(plate);
    demos.push(plate);
  }

  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.05, 80);
  camera.position.set(4.6, 1.8, 10.2);

  return {
    scene,
    camera,
    root,
    shell,
    mode,
    pulseMesh,
    pulseMat,
    waveMesh,
    waveMat,
    electron,
    hole,
    click,
    hbt,
    hbtClick,
    demos,
  };
}

function applyEnvelope(material: THREE.ShaderMaterial, envelope: TimelineState["wave"]): void {
  material.uniforms.uCenter.value = envelope.center;
  material.uniforms.uSigma.value = envelope.sigma;
  material.uniforms.uAlpha.value = envelope.visible;
}

export function updateDevice(refs: DeviceRefs, state: TimelineState, demo: readonly DemoWindow[], aspect: number): void {
  const camera = refs.camera;
  camera.position.set(state.camera.position.x, state.camera.position.y, state.camera.position.z);
  camera.up.set(0, 1, 0);
  camera.lookAt(state.camera.target.x, state.camera.target.y, state.camera.target.z);
  camera.fov = fovForAspect(state.camera.fov, aspect);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  const shellMaterial = refs.shell.material as THREE.MeshStandardMaterial;
  shellMaterial.opacity = 0.4 - 0.27 * state.hostReveal;

  refs.mode.visible = state.modeOverlay > 0.02;
  for (const child of refs.mode.children) {
    const mesh = child as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;
    material.opacity = Number(mesh.userData.baseOpacity) * state.modeOverlay;
  }

  applyEnvelope(refs.pulseMat, state.pulse);
  applyEnvelope(refs.waveMat, state.wave);
  refs.pulseMesh.visible = state.pulse.visible > 0.012;
  refs.waveMesh.visible = state.wave.visible > 0.012;

  const electronMaterial = refs.electron.material as THREE.MeshBasicMaterial;
  const holeMaterial = refs.hole.material as THREE.MeshBasicMaterial;
  electronMaterial.opacity = 0.58 * state.exciton;
  holeMaterial.opacity = 0.34 * state.exciton;
  refs.electron.visible = state.exciton > 0.02;
  refs.hole.visible = state.exciton > 0.02;

  const clickMaterial = refs.click.material as THREE.MeshBasicMaterial;
  clickMaterial.opacity = state.selectedClick;
  refs.click.visible = state.selectedClick > 0.04;
  const clickScale = 0.35 + 0.65 * state.selectedClick;
  refs.click.scale.setScalar(clickScale);

  refs.hbt.visible = state.hbt > 0.03;
  refs.hbt.traverse((object) => {
    const mesh = object as THREE.Mesh;
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!material || Array.isArray(material)) return;
    if (mesh.userData.baseOpacity === undefined && "opacity" in material) {
      mesh.userData.baseOpacity = (material as THREE.MeshBasicMaterial).opacity;
    }
    if ("opacity" in material && material.transparent) {
      (material as THREE.MeshBasicMaterial).opacity = Number(mesh.userData.baseOpacity) * state.hbt;
    }
  });
  refs.hbtClick.visible = state.hbt > 0.72;

  refs.demos.forEach((plate, index) => {
    const revealed = state.t >= 25 && index < state.demoVisible;
    plate.visible = revealed;
    const tick = plate.userData.tick as THREE.Mesh;
    tick.visible = revealed && Boolean(demo[index]?.click);
    const material = plate.material as THREE.MeshBasicMaterial;
    material.color.set(demo[index]?.click ? 0xc4922a : 0x8291a5);
  });
}
