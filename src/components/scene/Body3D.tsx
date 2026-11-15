// Corpo da Overview em 3D (three.js): milhares de pontos que se montam na tela, giram devagar e
// respondem ao ponteiro (arrastar na horizontal gira; passar o mouse acende a região; tocar ou clicar abre o detalhe).
// As 3 regiões são as de sceneMapping.bodyRegions: cabeça e pescoço = Isolation, peito = sinais vitais,
// braços e pernas = Gravity. Pontos em tom neutro claro; só a região com alerta ganha a cor do nível que a API devolveu
// (nada aqui decide nível). O peito pulsa no ritmo do coração e o tronco respira no ritmo do sensor ao vivo.
// Acessível: as etiquetas são botões (teclado e leitor de tela) com o nome do nível (StatusPill).
// Em painel estreito (celular) as etiquetas viram uma lista embaixo do corpo. Sem WebGL, chama onFail (a Overview mostra o corpo 2D).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { LiveTrace } from './LiveTrace';
import { LEVEL_UI } from '../../lib/levels';
import { StatusPill } from '../ui';
import { bodyRegions, indicatorHref, type BodyRegion, type BodyRegionKey, type SceneState } from './sceneMapping';
import type { DisplayLevel } from '../../services/api';
import { cn } from '../../lib/utils';

type V3 = [number, number, number];
/** Um anel de um corpo "loftado": o centro, a largura (a, no eixo x) e a profundidade (b) do corte, perpendicular ao caminho. */
type Ring = { c: V3; a: number; b: number };
type Part = { kind: 'ellipsoid'; c: V3; r: V3; region: number } | { kind: 'loft'; rings: Ring[]; region: number };

// 0 = sem área ligada · 1 = cabeça e pescoço · 2 = peito · 3 = braços e pernas
const REGION_INDEX: Record<BodyRegionKey, number> = { head: 1, chest: 2, limbs: 3 };
const mirror = (p: V3): V3 => [-p[0], p[1], p[2]];
/** Anel pelo centro (x, y, z) e as duas medidas. */
const ring = (x: number, y: number, z: number, a: number, b: number): Ring => ({ c: [x, y, z], a, b });

/**
 * O corpo humano (homem adulto de ~1,78 m, em pé, braços um pouco afastados), desenhado como cortes que se encadeiam
 * (o "loft" da modelagem 3D): cada parte é uma sequência de anéis com a largura e a profundidade do corte naquele ponto.
 * Proporções de um corpo de verdade: cabeça com crânio e queixo, pescoço, trapézio, caixa torácica que afina na cintura,
 * quadril, ombro (deltoide), braço com bíceps e antebraço, mão com dedos, coxa, panturrilha e pé com calcanhar e dedos.
 */
function bodyParts(): Part[] {
  const side = (s: 1 | -1): Part[] => {
    const m = (r: Ring[]) => (s === 1 ? r : r.map((q) => ({ ...q, c: mirror(q.c) })));
    const mp = (p: V3): V3 => (s === 1 ? p : mirror(p));
    return [
      { kind: 'ellipsoid', c: mp([0.222, 1.385, 0.0]), r: [0.05, 0.056, 0.052], region: 3 },                // ombro (deltoide)
      { kind: 'loft', region: 3, rings: m([ring(0.222, 1.385, 0, 0.05, 0.05), ring(0.238, 1.32, 0.004, 0.052, 0.054), ring(0.255, 1.23, 0.008, 0.045, 0.048), ring(0.27, 1.15, 0.01, 0.036, 0.038), ring(0.277, 1.11, 0.012, 0.031, 0.032)]) }, // braço
      { kind: 'loft', region: 3, rings: m([ring(0.277, 1.11, 0.012, 0.032, 0.033), ring(0.285, 1.04, 0.03, 0.039, 0.036), ring(0.298, 0.95, 0.055, 0.032, 0.03), ring(0.31, 0.875, 0.072, 0.023, 0.022)]) }, // antebraço
      { kind: 'loft', region: 3, rings: m([ring(0.31, 0.875, 0.072, 0.024, 0.018), ring(0.316, 0.835, 0.082, 0.036, 0.013), ring(0.322, 0.795, 0.09, 0.034, 0.011), ring(0.326, 0.765, 0.095, 0.02, 0.008), ring(0.327, 0.75, 0.097, 0.006, 0.004)]) }, // mão
      { kind: 'loft', region: 3, rings: m([ring(0.098, 0.90, -0.004, 0.07, 0.08), ring(0.098, 0.80, -0.004, 0.09, 0.094), ring(0.1, 0.72, 0.0, 0.086, 0.088), ring(0.102, 0.60, 0.006, 0.072, 0.076), ring(0.104, 0.49, 0.01, 0.057, 0.058), ring(0.105, 0.43, 0.01, 0.047, 0.05)]) }, // coxa
      { kind: 'loft', region: 3, rings: m([ring(0.105, 0.43, 0.01, 0.048, 0.05), ring(0.106, 0.36, 0.0, 0.049, 0.056), ring(0.106, 0.27, -0.012, 0.044, 0.056), ring(0.106, 0.17, -0.008, 0.034, 0.04), ring(0.105, 0.09, -0.01, 0.027, 0.03)]) }, // perna
      { kind: 'loft', region: 3, rings: m([ring(0.105, 0.045, -0.055, 0.027, 0.042), ring(0.105, 0.055, -0.01, 0.034, 0.048), ring(0.107, 0.036, 0.06, 0.04, 0.032), ring(0.11, 0.024, 0.125, 0.045, 0.024), ring(0.112, 0.014, 0.18, 0.041, 0.013), ring(0.112, 0.01, 0.2, 0.012, 0.006)]) }, // pé
    ];
  };
  return [
    // Cabeça: crânio, face, maxilar e queixo
    { kind: 'loft', region: 1, rings: [ring(0, 1.795, 0.0, 0.003, 0.003), ring(0, 1.785, 0.0, 0.045, 0.05), ring(0, 1.765, 0.0, 0.07, 0.083), ring(0, 1.735, 0.002, 0.077, 0.094), ring(0, 1.695, 0.008, 0.078, 0.097), ring(0, 1.655, 0.012, 0.074, 0.09), ring(0, 1.615, 0.017, 0.062, 0.076), ring(0, 1.58, 0.024, 0.044, 0.056), ring(0, 1.56, 0.03, 0.022, 0.03), ring(0, 1.555, 0.032, 0.004, 0.006)] },
    // Pescoço
    { kind: 'loft', region: 1, rings: [ring(0, 1.62, -0.004, 0.044, 0.05), ring(0, 1.56, -0.008, 0.046, 0.052), ring(0, 1.50, -0.012, 0.05, 0.056), ring(0, 1.46, -0.012, 0.072, 0.068)] },
    // Tronco: do trapézio ao peito (região 2) e do peito à pelve
    { kind: 'loft', region: 2, rings: [ring(0, 1.46, -0.012, 0.082, 0.068), ring(0, 1.43, -0.008, 0.16, 0.088), ring(0, 1.39, 0.0, 0.19, 0.105), ring(0, 1.33, 0.012, 0.186, 0.118), ring(0, 1.26, 0.016, 0.172, 0.118), ring(0, 1.19, 0.012, 0.158, 0.108)] },
    { kind: 'loft', region: 0, rings: [ring(0, 1.19, 0.012, 0.158, 0.108), ring(0, 1.12, 0.008, 0.146, 0.1), ring(0, 1.05, 0.004, 0.134, 0.094), ring(0, 0.98, 0.0, 0.14, 0.097), ring(0, 0.91, -0.006, 0.162, 0.108), ring(0, 0.84, -0.012, 0.172, 0.114), ring(0, 0.78, -0.01, 0.16, 0.106), ring(0, 0.72, -0.004, 0.1, 0.085), ring(0, 0.69, 0.0, 0.03, 0.03)] },
    ...side(1), ...side(-1),
  ];
}

/** Área aproximada de uma elipse (perímetro de Ramanujan) e de uma peça: para pôr a mesma densidade de pontos em todo o corpo. */
const perimetro = (a: number, b: number) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
const DENSIDADE = 12500; // pontos por unidade² de superfície (≈ 24 mil no corpo todo)

/** Pontos na superfície de cada peça, com a normal (para pulsar e respirar) e uma posição espalhada (para a montagem). */
function sample(parts: Part[]) {
  // A quantidade de cada peça vem da área dela.
  const quadros = parts.map((p) => {
    if (p.kind === 'ellipsoid') {
      const [a, b, c] = p.r; const q = 1.6075;
      return { p, n: Math.round(4 * Math.PI * Math.pow((Math.pow(a * b, q) + Math.pow(a * c, q) + Math.pow(b * c, q)) / 3, 1 / q) * DENSIDADE), segs: [] as number[] };
    }
    const segs = p.rings.slice(0, -1).map((r, i) => {
      const t = p.rings[i + 1]; const L = Math.hypot(t.c[0] - r.c[0], t.c[1] - r.c[1], t.c[2] - r.c[2]);
      return L * (perimetro(r.a, r.b) + perimetro(t.a, t.b)) / 2;
    });
    return { p, n: Math.round(segs.reduce((x, y) => x + y, 0) * DENSIDADE), segs };
  });
  const total = quadros.reduce((x, q) => x + q.n, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), scat = new Float32Array(total * 3);
  const reg = new Float32Array(total), seed = new Float32Array(total);
  let k = 0;
  const rnd = mulberry(7);
  const put = (p: THREE.Vector3, n: THREE.Vector3, region: number) => {
    pos.set([p.x, p.y, p.z], k * 3);
    nor.set([n.x, n.y, n.z], k * 3);
    // espalhado numa nuvem em volta do corpo
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), rr = 0.9 + rnd() * 1.4;
    scat.set([s * Math.cos(th) * rr, 0.95 + u * rr * 0.9, s * Math.sin(th) * rr], k * 3);
    reg[k] = region; seed[k] = rnd(); k++;
  };
  const dir = () => { const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u); return new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)); };
  const X = new THREE.Vector3(1, 0, 0);
  for (const { p: part, n, segs } of quadros) {
    if (part.kind === 'ellipsoid') {
      for (let i = 0; i < n; i++) {
        const d = dir();
        put(new THREE.Vector3(part.c[0] + d.x * part.r[0], part.c[1] + d.y * part.r[1], part.c[2] + d.z * part.r[2]),
          new THREE.Vector3(d.x / part.r[0], d.y / part.r[1], d.z / part.r[2]).normalize(), part.region);
      }
      continue;
    }
    // os eixos de cada anel: o caminho (tangente), a largura (x tirado o caminho) e a profundidade
    const cs = part.rings.map((r) => new THREE.Vector3(...r.c));
    const frames = cs.map((c, i) => {
      const T = (cs[Math.min(i + 1, cs.length - 1)].clone().sub(cs[Math.max(i - 1, 0)])).normalize();
      const e1 = X.clone().sub(T.clone().multiplyScalar(X.dot(T))).normalize();
      return { e1, e2: T.clone().cross(e1).normalize() };
    });
    const soma = segs.reduce((x, y) => x + y, 0);
    for (let i = 0; i < n; i++) {
      // escolhe o trecho pela área, e um ponto dentro dele
      let r = rnd() * soma, j = 0;
      while (j < segs.length - 1 && r > segs[j]) { r -= segs[j]; j++; }
      const t = rnd(), th = rnd() * Math.PI * 2;
      const A = part.rings[j], B = part.rings[j + 1];
      const a = A.a + (B.a - A.a) * t, b = A.b + (B.b - A.b) * t;
      const e1 = frames[j].e1.clone().lerp(frames[j + 1].e1, t).normalize();
      const e2 = frames[j].e2.clone().lerp(frames[j + 1].e2, t).normalize();
      const c = cs[j].clone().lerp(cs[j + 1], t);
      const ct = Math.cos(th), st = Math.sin(th);
      put(c.addScaledVector(e1, a * ct).addScaledVector(e2, b * st), e1.clone().multiplyScalar(ct / a).addScaledVector(e2, st / b).normalize(), part.region);
    }
  }
  return { pos, nor, scat, reg, seed, total };
}

function mulberry(s: number) { return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const VERT = /* glsl */ `
uniform float uTime, uBeat, uBreath, uScan, uSize, uPr, uAssemble;
uniform vec3 uC0, uC1, uC2, uC3;
uniform float uA0, uA1, uA2, uA3, uG0, uG1, uG2, uG3;
attribute vec3 aNormal; attribute vec3 aScatter; attribute float aRegion; attribute float aSeed;
varying vec3 vColor; varying float vAlpha;
void main() {
  float r = aRegion;
  vec3 col = r < 0.5 ? uC0 : r < 1.5 ? uC1 : r < 2.5 ? uC2 : uC3;
  float alpha = r < 0.5 ? uA0 : r < 1.5 ? uA1 : r < 2.5 ? uA2 : uA3;
  float grow = r < 0.5 ? uG0 : r < 1.5 ? uG1 : r < 2.5 ? uG2 : uG3;
  vec3 p = position;
  if (r > 1.5 && r < 2.5) p += aNormal * uBeat * 0.011;           // peito: batida
  if (r < 0.5 || (r > 1.5 && r < 2.5)) p += aNormal * uBreath * 0.005; // tronco: respiração
  p += aNormal * sin(uTime * 1.3 + aSeed * 6.2831) * 0.0016;       // vida
  float t = clamp((uAssemble - aSeed * 0.45) / 0.55, 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 3.0);
  p = mix(aScatter, p, t);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float scan = exp(-pow((position.y - uScan) / 0.022, 2.0));
  gl_PointSize = uSize * uPr * (1.0 + grow + scan * 0.9) / -mv.z;
  vec3 nView = normalize(normalMatrix * aNormal);
  float facing = 0.28 + 0.72 * smoothstep(-0.5, 0.7, nView.z);
  vColor = col;
  vAlpha = (alpha * facing + scan * 0.55) * (0.25 + 0.75 * t);
}`;
const FRAG = /* glsl */ `
varying vec3 vColor; varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.15, d) * vAlpha);
}`;

/** Cor da marca atual (token --brand do tema: magenta, ou neutra durante uma Emergency), em hex. */
function brandHex() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim().split(/\s+/).map(Number);
  return v.length === 3 && v.every(Number.isFinite) ? '#' + v.map((x) => x.toString(16).padStart(2, '0')).join('') : '#E879F9';
}
/** Acompanha a troca de --brand (o atributo data-emergency no <html>). */
function useBrandHex() {
  const [hex, setHex] = useState(brandHex);
  useEffect(() => {
    const mo = new MutationObserver(() => setHex(brandHex()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-emergency'] });
    return () => mo.disconnect();
  }, []);
  return hex;
}

const NEUTRAL = new THREE.Color('#C9CFDB'); // pontos do corpo: neutro claro
const MUTED = new THREE.Color(LEVEL_UI.unavailable.color);
const colorOf = (lv: DisplayLevel) => (lv === 'normal' ? NEUTRAL : lv === 'unavailable' ? MUTED : new THREE.Color(LEVEL_UI[lv].color));
const flagged = (lv: DisplayLevel) => lv !== 'normal' && lv !== 'unavailable';

// Âncoras das etiquetas (no corpo) e o lado onde a etiqueta fica.
const ANCHORS: Record<BodyRegionKey, { p: V3; side: 'left' | 'right' }> = {
  head: { p: [0.06, 1.68, 0.06], side: 'right' },
  chest: { p: [0.07, 1.31, 0.09], side: 'right' },
  limbs: { p: [-0.1, 0.62, 0.05], side: 'left' },
};
const LABEL_W = 216;
const COMPACT_BELOW = 500; // px de largura do painel: abaixo disso as etiquetas vão para uma lista embaixo do corpo

/** Conteúdo de uma etiqueta (o mesmo na lateral e na lista). */
function LabelBody({ r, hr, rr, brand }: { r: BodyRegion; hr: number | null; rr: number | null; brand: string }) {
  return (<>
    <span className="block text-xs text-slate-300">{r.element.area}</span>
    <span className="flex items-center justify-between gap-2 mt-0.5">
      <span className="whitespace-nowrap text-sm font-medium text-slate-50">{r.label}</span>
      <StatusPill level={r.element.level} small />
    </span>
    {r.key === 'chest' && hr && (
      <span className="block mt-1.5">
        <span className="flex items-baseline justify-between text-xs text-slate-300">
          <span><span className="font-mono text-slate-50">{hr}</span> bpm</span>{rr && <span><span className="font-mono text-slate-50">{rr}</span> /min</span>}
        </span>
        <LiveTrace rate={hr} kind="ecg" color={brand} height={28} />
      </span>
    )}
  </>);
}

export function Body3D({ scene, height = 560, onFail }: { scene: SceneState; height?: number; onFail?: () => void }) {
  const nav = useNavigate();
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const labels = useRef<Record<string, HTMLButtonElement | null>>({});
  const [hover, setHover] = useState<BodyRegionKey | null>(null);
  const [compact, setCompact] = useState(false);
  const brand = useBrandHex();
  const regions = bodyRegions(scene);
  const live = useRef({ regions, hover, compact, beat: scene.vitals.beatSeconds, breath: scene.vitals.breathSeconds });
  live.current = { regions, hover, compact, beat: scene.vitals.beatSeconds, breath: scene.vitals.breathSeconds };
  const data = useMemo(() => sample(bodyParts()), []);
  const open = (r: BodyRegion) => nav(indicatorHref(r.element.route, r.indicator));
  const openRef = useRef(open); openRef.current = open;
  const failRef = useRef(onFail); failRef.current = onFail;

  useEffect(() => {
    const el = wrap.current!; const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { failRef.current?.(); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.prepend(renderer.domElement);
    // O canvas ocupa o contêiner só por CSS (absoluto, 100%): nunca recebe largura em px, para não empurrar o layout.
    Object.assign(renderer.domElement.style, { display: 'block', position: 'absolute', inset: '0', width: '100%', height: '100%' });
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const lost = (e: Event) => { e.preventDefault(); failRef.current?.(); };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    cam.position.set(0, 0.95, 4.35); cam.lookAt(0, 0.9, 0);
    const scn = new THREE.Scene();
    const group = new THREE.Group(); scn.add(group);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(data.pos, 3));
    g.setAttribute('aNormal', new THREE.BufferAttribute(data.nor, 3));
    g.setAttribute('aScatter', new THREE.BufferAttribute(data.scat, 3));
    g.setAttribute('aRegion', new THREE.BufferAttribute(data.reg, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(data.seed, 1));
    const u = {
      uTime: { value: 0 }, uBeat: { value: 0 }, uBreath: { value: 0 }, uScan: { value: -10 }, uSize: { value: 5.2 }, uPr: { value: renderer.getPixelRatio() },
      uAssemble: { value: reduced ? 1.2 : 0 },
      uC0: { value: NEUTRAL.clone() }, uC1: { value: NEUTRAL.clone() }, uC2: { value: NEUTRAL.clone() }, uC3: { value: NEUTRAL.clone() },
      uA0: { value: 0.4 }, uA1: { value: 0.7 }, uA2: { value: 0.7 }, uA3: { value: 0.7 },
      uG0: { value: 0 }, uG1: { value: 0 }, uG2: { value: 0 }, uG3: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthWrite: false });
    const points = new THREE.Points(g, mat); group.add(points);

    // Chão: dois anéis finos na cor da marca, um parado e um tracejado que gira ao contrário.
    const ringMats: (THREE.LineBasicMaterial | THREE.LineDashedMaterial)[] = [];
    const ringGeos: THREE.BufferGeometry[] = [];
    const floorRing = (r: number, dashed: boolean) => {
      const pts = Array.from({ length: 129 }, (_, i) => { const a = (i / 128) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r); });
      const geo = new THREE.BufferGeometry().setFromPoints(pts); ringGeos.push(geo);
      const m = dashed ? new THREE.LineDashedMaterial({ color: brandHex(), transparent: true, opacity: 0.35, dashSize: 0.025, gapSize: 0.035 })
        : new THREE.LineBasicMaterial({ color: brandHex(), transparent: true, opacity: 0.18 });
      ringMats.push(m);
      const line = new THREE.Line(geo, m); if (dashed) line.computeLineDistances(); return line;
    };
    const floor = new THREE.Group(); floor.add(floorRing(0.42, false)); const spin = floorRing(0.55, true); floor.add(spin); scn.add(floor);
    const mo = new MutationObserver(() => { const c = brandHex(); for (const m of ringMats) m.color.set(c); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-emergency'] });

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false); cam.aspect = w / h;
      // painel estreito: o corpo se afasta um pouco para as etiquetas caberem dos lados
      cam.position.z = w < COMPACT_BELOW ? 4.6 : w < 600 ? 4.9 : 4.5; cam.updateProjectionMatrix();
      if (svg.current) svg.current.setAttribute('viewBox', `0 0 ${w} ${h}`);
      setCompact(w < COMPACT_BELOW);
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    // Girar: sozinho devagar; arrastando na horizontal, segue o ponteiro e volta a girar sozinho 2,5 s depois.
    // touch-action: pan-y no contêiner — no celular o arrasto vertical continua rolando a página.
    let rotY = -0.35, target = -0.35, dragging = false, lastX = 0, idleAt = 0, moved = 0;
    const ray = new THREE.Raycaster(); ray.params.Points = { threshold: 0.03 };
    const mouse = new THREE.Vector2();
    const regionAt = (e: PointerEvent): BodyRegionKey | null => {
      const r = el.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, cam);
      const hit = ray.intersectObject(points)[0];
      if (!hit || hit.index == null) return null;
      const idx = data.reg[hit.index];
      return idx === 1 ? 'head' : idx === 2 ? 'chest' : idx === 3 ? 'limbs' : null;
    };
    const onCanvas = (e: PointerEvent) => e.target === renderer.domElement;
    const down = (e: PointerEvent) => { if (!onCanvas(e)) return; dragging = true; lastX = e.clientX; moved = 0; };
    let lastHover = 0;
    const move = (e: PointerEvent) => {
      if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); target += dx * 0.009; idleAt = performance.now(); return; }
      if (e.pointerType !== 'mouse' || !onCanvas(e)) return;
      const now = performance.now(); if (now - lastHover < 60) return; lastHover = now; // raycast no máximo ~16 vezes por segundo
      const k = regionAt(e); setHover(k); el.style.cursor = k ? 'pointer' : 'grab';
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false; idleAt = performance.now();
      if (moved < 4) { const k = regionAt(e); const reg = k && live.current.regions.find((x) => x.key === k); if (reg) openRef.current(reg); }
    };
    const cancel = () => { dragging = false; idleAt = performance.now(); };
    const leave = () => { if (!dragging) setHover(null); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel); el.addEventListener('pointerleave', leave);

    // Só desenha quando o corpo está na tela e a aba está visível (economiza bateria no celular).
    let visible = true;
    const anchor = new THREE.Vector3();
    let raf = 0; const t0 = performance.now(); let last = t0;
    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      const { regions: regs, hover: hv, beat, breath, compact: cpt } = live.current;
      u.uTime.value = t;
      if (!reduced) {
        u.uAssemble.value = Math.min(1.2, u.uAssemble.value + dt / 1.9);
        if (!dragging && now - idleAt > 2500) target += dt * 0.16;
        // varredura: sobe em 3,2 s a cada 8 s
        const cyc = t % 8; u.uScan.value = cyc < 3.2 ? -0.05 + (cyc / 3.2) * 1.95 : -10;
        u.uBeat.value = beat ? Math.exp(-((t % beat) / beat) * 9) : 0;
        u.uBreath.value = breath ? Math.sin((t / breath) * Math.PI * 2) : 0;
        spin.rotation.y = -t * 0.12;
      }
      rotY += (target - rotY) * Math.min(1, dt * 6);
      group.rotation.y = rotY;

      // Cor, força e tamanho de cada região
      for (const r of regs) {
        const i = REGION_INDEX[r.key]; const lv = r.element.level;
        (u as any)[`uC${i}`].value.copy(colorOf(lv));
        const base = flagged(lv) ? 1 : lv === 'unavailable' ? 0.4 : 0.7;
        const on = hv === r.key; const dim = hv && !on;
        (u as any)[`uA${i}`].value += ((on ? 1 : dim ? base * 0.45 : base) - (u as any)[`uA${i}`].value) * Math.min(1, dt * 8);
        (u as any)[`uG${i}`].value += ((on ? 0.55 : 0) - (u as any)[`uG${i}`].value) * Math.min(1, dt * 8);
      }
      u.uA0.value += ((hv ? 0.18 : 0.4) - u.uA0.value) * Math.min(1, dt * 8);
      renderer.render(scn, cam);

      // Etiquetas na lateral: a linha sai do ponto da região (que gira com o corpo) até a etiqueta.
      if (!cpt) {
        const w = el.clientWidth, h = el.clientHeight;
        for (const r of regs) {
          const a = ANCHORS[r.key]; anchor.set(...a.p).applyMatrix4(group.matrixWorld).project(cam);
          const ax = (anchor.x * 0.5 + 0.5) * w, ay = (-anchor.y * 0.5 + 0.5) * h;
          const lab = labels.current[r.key]; const path = svg.current?.querySelector<SVGPathElement>(`[data-k="${r.key}"]`);
          const dot = svg.current?.querySelector<SVGCircleElement>(`[data-d="${r.key}"]`);
          // posição em px inteiros e só quando muda: a etiqueta não treme com a respiração do corpo
          const ly = Math.round(Math.max(8, Math.min(h - 80, ay - 24)));
          const lx = Math.round(a.side === 'right' ? Math.min(w - LABEL_W - 4, w * 0.5 + 84) : Math.max(4, w * 0.5 - 84 - LABEL_W));
          const tf = `translate(${lx}px, ${ly}px)`;
          if (lab && lab.style.transform !== tf) lab.style.transform = tf;
          const ex = a.side === 'right' ? lx - 6 : lx + LABEL_W + 6; const ey = ly + 24;
          const mx = a.side === 'right' ? ex - 26 : ex + 26;
          if (path) path.setAttribute('d', `M${ax},${ay} L${mx},${ey} L${ex},${ey}`);
          if (dot) { dot.setAttribute('cx', String(ax)); dot.setAttribute('cy', String(ay)); }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 }); io.observe(el);
    const onVis = () => { if (!document.hidden) kick(); };
    document.addEventListener('visibilitychange', onVis);
    kick();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel); el.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      g.dispose(); mat.dispose(); ringGeos.forEach((x) => x.dispose()); ringMats.forEach((x) => x.dispose());
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [data]);

  const hr = scene.vitals.heartRate;
  const rr = scene.vitals.breathSeconds ? Math.round(60 / scene.vitals.breathSeconds) : null;
  const button = (r: BodyRegion, side: boolean) => {
    const on = hover === r.key; const lv = r.element.level;
    return (
      <button key={r.key} ref={side ? (b) => { labels.current[r.key] = b; } : undefined} type="button"
        onClick={() => open(r)} onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(r.key)} onBlur={() => setHover(null)}
        aria-label={`${r.label}, ${r.element.area}: ${LEVEL_UI[lv].label}. Open detail`}
        className={cn('text-left rounded-md border px-3 py-2 transition-colors duration-200',
          side ? 'absolute left-0 top-0' : 'w-full',
          on ? 'bg-space-card2 border-space-strong' : 'bg-space-card border-space-line',
          flagged(lv) && 'border-l-[3px]')}
        style={{ ...(side ? { width: LABEL_W } : null), ...(flagged(lv) ? { borderLeftColor: LEVEL_UI[lv].color } : null) }}>
        <LabelBody r={r} hr={hr} rr={rr} brand={brand} />
      </button>
    );
  };

  return (
    <div>
      <div ref={wrap} className="relative w-full select-none" style={{ height: compact ? Math.min(height, 420) : height, cursor: 'grab', touchAction: 'pan-y' }}>
        {!compact && (
          <svg ref={svg} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            {regions.map((r) => {
              const lv = r.element.level; const c = flagged(lv) ? LEVEL_UI[lv].color : 'rgb(var(--brand))';
              const on = hover === r.key;
              return (
                <g key={r.key} style={{ transition: 'opacity .3s', opacity: hover && !on ? 0.35 : 1 }}>
                  <path data-k={r.key} fill="none" stroke={c} strokeOpacity={on ? 0.9 : 0.45} strokeWidth={1} />
                  <circle data-d={r.key} r={on ? 4 : 3} fill={c} />
                </g>
              );
            })}
          </svg>
        )}
        {!compact && regions.map((r) => button(r, true))}
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-slate-300 pointer-events-none">Drag to rotate · select a region</p>
      </div>
      {compact && <div className="mt-3 space-y-2">{regions.map((r) => button(r, false))}</div>}
    </div>
  );
}
