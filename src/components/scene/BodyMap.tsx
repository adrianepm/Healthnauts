// Corpo humano clicável da Overview (react-body-highlighter, MIT, vista anterior).
// Desenhado em contorno neutro: só as regiões em Advisory, Caution, Warning ou Emergency recebem a cor do nível que a API devolveu
// (sceneMapping.bodyRegions). A tela não cria regra nem limite.
// Os polígonos da biblioteca não recebem foco, então a lista ao lado tem um botão por região (teclado e leitor de tela),
// sempre com ícone + nome do nível.
import Model, { type IMuscleStats } from 'react-body-highlighter';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, HeartPulse } from 'lucide-react';
import { LEVEL_UI } from '../../lib/levels';
import { StatusPill } from '../ui';
import { BODY_LEVELS, bodyRegions, indicatorHref, regionOfMuscle, type BodyRegion, type SceneState } from './sceneMapping';

/** Corpo sem área ligada e regiões sem alerta: tons neutros do tema. */
const BODY_COLOR = '#10131C';
const NEUTRAL_FILL = '#232838';
const COLORS = BODY_LEVELS.map((l) => (l === 'normal' || l === 'unavailable' ? NEUTRAL_FILL : LEVEL_UI[l].color));

export function BodyMap({ scene }: { scene: SceneState }) {
  const nav = useNavigate();
  const regions = bodyRegions(scene);
  // Abre a área já no parâmetro da manchete (ou o parâmetro-chave da região) dentro do tópico.
  const open = (r: BodyRegion) => nav(indicatorHref(r.element.route, r.indicator));
  const onClick = (stats: IMuscleStats) => { const r = regionOfMuscle(regions, stats.muscle); if (r) open(r); };
  const data = regions.map((r) => ({ name: r.element.area, muscles: r.muscles as any[], frequency: r.frequency }));

  const hr = scene.vitals.heartRate;
  const rr = scene.vitals.breathSeconds ? Math.round(60 / scene.vitals.breathSeconds) : null;

  return (
    <section className="card h-full" aria-labelledby="body-map-title" data-body="2d">
      <h2 id="body-map-title" className="card-title">Body</h2>
      <p className="card-sub mt-0.5">Areas from the onboard computer. Open a region for its detail.</p>
      <div className="mt-4 grid sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[auto_minmax(0,1fr)] gap-5 items-center">
        <div className="flex justify-center pr-24">
          <div className="relative w-[140px] sm:w-[160px] body-map">
            {/* Só para o mouse; a mesma ação está nos botões da lista. */}
            <div aria-hidden="true">
              <Model type="anterior" data={data} bodyColor={BODY_COLOR} highlightedColors={COLORS} onClick={onClick} style={{ width: '100%' }} />
            </div>
            {/* Leitura ao vivo ao lado do peito (sensor simulado, src/sim/liveSensors.ts). */}
            <div className="absolute left-full top-[19%] ml-1 flex items-center" aria-label={`Live heart rate ${hr ?? 'unavailable'}${hr ? ' bpm' : ''}, respiratory rate ${rr ?? 'unavailable'}${rr ? ' per minute' : ''}`} role="group">
              <span className="w-3 border-t border-space-strong" aria-hidden="true" />
              <span className="rounded-md border border-space-line bg-space-card2 px-2 py-1 text-xs leading-tight text-slate-100 whitespace-nowrap">
                <span className="flex items-center gap-1"><HeartPulse size={13} aria-hidden="true" className="text-slate-300" /><span className="font-mono">{hr ?? '–'}</span><span className="text-slate-300">bpm</span></span>
                <span className="block"><span className="text-slate-300">RR </span><span className="font-mono">{rr ?? '–'}</span><span className="text-slate-300"> /min</span></span>
              </span>
            </div>
          </div>
        </div>
        <ul className="space-y-2">
          {regions.map((r) => (
            <li key={r.key}>
              <button type="button" onClick={() => open(r)}
                className="tap w-full text-left rounded-md border border-space-line bg-space-card2/60 hover:border-space-strong hover:bg-space-card2 px-3 py-2 transition-colors flex items-start gap-3">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs text-slate-300">{r.element.area}</span>
                    <StatusPill level={r.element.level} small className="ml-auto" />
                  </span>
                  {r.element.message && <span className="block text-xs text-slate-300 mt-1 line-clamp-2">{r.element.message}</span>}
                </span>
                <ChevronRight size={16} className="mt-0.5 text-slate-300 shrink-0" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
