// Corpo da Overview: 3D (Body3D, three.js) quando o navegador tem WebGL e não pede movimento reduzido;
// senão, o corpo 2D (BodyMap, react-body-highlighter). As regiões, os níveis e os links vêm do mesmo sceneMapping.
// O 3D é carregado sob demanda (lazy): quem cai no 2D não baixa o three.js.
import { lazy, Suspense, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { BodyMap } from './BodyMap';
import type { BodyRegionKey, SceneState } from './sceneMapping';

/** Região ligada ao alerta mais grave: fica destacada (contorno e pontos maiores) na cor do nível. */
export type BodyFocus = BodyRegionKey | null;

const Body3D = lazy(() => import('./Body3D').then((m) => ({ default: m.Body3D })));

let webgl: boolean | null = null;
/** O navegador consegue criar um contexto WebGL? (testado uma vez) */
export function hasWebGL() {
  if (webgl !== null) return webgl;
  try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { webgl = false; }
  return webgl;
}

export function BodyView({ scene, focus = null }: { scene: SceneState; focus?: BodyFocus }) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  if (reduced || failed || !hasWebGL()) return <BodyMap scene={scene} focus={focus} />;
  return (
    <section className="card h-full min-w-0" aria-labelledby="body-map-title" data-body="3d">
      <h2 id="body-map-title" className="card-title">Body</h2>
      <p className="card-sub mt-0.5">Areas from the onboard computer. Open a region for its detail.</p>
      <Suspense fallback={<div className="h-[520px] grid place-items-center text-sm text-slate-300">Loading the body view…</div>}>
        <Body3D scene={scene} focus={focus} height={520} onFail={() => setFailed(true)} />
      </Suspense>
    </section>
  );
}
