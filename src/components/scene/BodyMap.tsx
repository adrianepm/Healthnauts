// Corpo humano clicável da Overview (react-body-highlighter, MIT, vista anterior).
// Cor de cada região = cor do nível que a API devolveu (sceneMapping.bodyRegions); a tela não cria regra nem limite.
// Os polígonos da biblioteca não recebem foco, então a legenda ao lado tem um botão por região (teclado e leitor de tela),
// sempre com ícone + nome do nível.
import Model, { type IMuscleStats } from 'react-body-highlighter';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, HeartPulse } from 'lucide-react';
import { LEVEL_UI } from '../../lib/levels';
import { StatusPill } from '../ui';
import { BODY_LEVELS, bodyRegions, indicatorHref, regionOfMuscle, type BodyRegion, type SceneState } from './sceneMapping';

/** Corpo sem área ligada: tom escuro do tema (borda dos cartões), nunca branco. */
const BODY_COLOR = '#24324D';
const COLORS = BODY_LEVELS.map((l) => LEVEL_UI[l].color);

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
    <section className="card !p-5 h-full" aria-labelledby="body-map-title">
      <h2 id="body-map-title" className="text-sm font-semibold">Body · areas from the onboard computer</h2>
      <p className="text-xs text-slate-400 mt-0.5">Click a region or a row to open its detail.</p>
      <div className="mt-4 grid sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[auto_minmax(0,1fr)] gap-5 items-center">
        <div className="flex justify-center pr-24">
          <div className="relative w-[150px] sm:w-[170px]">
            {/* Só para o mouse; a mesma ação está nos botões da legenda. */}
            <div aria-hidden="true">
              <Model type="anterior" data={data} bodyColor={BODY_COLOR} highlightedColors={COLORS} onClick={onClick} style={{ width: '100%' }} />
            </div>
            {/* Selo ao vivo ao lado do peito (sensor simulado, src/sim/liveSensors.ts). */}
            <div className="absolute left-full top-[19%] ml-1 flex items-center" aria-label={`Live heart rate ${hr ?? 'unavailable'}${hr ? ' bpm' : ''}, respiratory rate ${rr ?? 'unavailable'}${rr ? ' per minute' : ''}`} role="group">
              <span className="w-3 border-t border-slate-500" aria-hidden="true" />
              <span className="rounded-lg border border-space-line bg-space-bg/90 px-2 py-1 font-mono text-xs leading-tight text-slate-100 whitespace-nowrap">
                <span className="flex items-center gap-1"><HeartPulse size={12} aria-hidden="true" className="text-slate-300" />{hr ?? '–'}<span className="text-slate-400"> bpm</span></span>
                <span className="block">RR {rr ?? '–'}<span className="text-slate-400"> /min</span></span>
              </span>
            </div>
          </div>
        </div>
        <ul className="space-y-2">
          {regions.map((r) => (
            <li key={r.key}>
              <button type="button" onClick={() => open(r)}
                className="tap w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/25 px-3 py-2 transition-colors flex items-start gap-3">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: LEVEL_UI[r.element.level].color }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs text-slate-300">· {r.element.area}</span>
                    <StatusPill level={r.element.level} small />
                  </span>
                  {r.element.message && <span className="block text-xs text-slate-300 mt-1 line-clamp-2">{r.element.message}</span>}
                </span>
                <ChevronRight size={15} className="mt-1 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
