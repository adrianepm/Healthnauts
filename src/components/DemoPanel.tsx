// Painel da demonstração: os 8 cenários da API, o sensor simulado e "Reset demo".
// O cenário grava os dados pela API; o sensor ao vivo passa a repetir a mesma condição até "Back to nominal".
import { useEffect, useState } from 'react';
import { Power, RotateCcw, Undo2, X } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import { sim, type SimState } from '../sim/liveSensors';
import { setEarthLink } from '../sim/link';
import { AREA, STORAGE_KEY, UI_KEY } from '../config/api';
import { AREA_LABEL } from '../lib/content';

const SIM_FOR: Record<string, Partial<Pick<SimState, 'cabin' | 'vitals'>>> = {
  'high-co2': { cabin: 'high-co2' }, depressurization: { cabin: 'depressurization' }, 'sensor-fault': { cabin: 'offline' }, fever: { vitals: 'fever' },
};

export function useSim() {
  const [s, setS] = useState(sim.get());
  useEffect(() => sim.subscribe(setS), []);
  return s;
}

/** Painel da demonstração. O botão que abre fica na barra lateral (desktop) e no cabeçalho (celular). Esc fecha. */
export function DemoPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [list, setList] = useState<{ id: string; areaId: string; label: string }[]>([]);
  const refresh = useStore((s) => s.refresh); const overview = useStore((s) => s.overview);
  const s = useSim();
  useEffect(() => { api.scenarios().then((r) => setList(r.scenarios)).catch(() => setList([])); }, []);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try { await fn(); await refresh(); } catch (e) { console.warn(e); } finally { setBusy(null); }
  };
  const scenario = (id: string) => run(id, async () => {
    await api.runScenario(id);
    if (SIM_FOR[id]) await sim.setMode(SIM_FOR[id], refresh);
  });
  const nominal = () => run('nominal', async () => {
    await sim.setMode({ cabin: 'nominal', vitals: 'nominal' }, refresh);
    if (overview?.areas.find((a) => a.areaId === AREA.radiation)?.groups.solar?.level) {
      await api.operation(AREA.radiation, 'solar', { recordedAt: new Date().toISOString(), active: false });
    }
    if (overview?.link.status === 'unavailable') await setEarthLink(true);
  });
  const reset = () => {
    sim.stop(); sim.reset();
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(UI_KEY); } catch { /* ignora */ }
    api.resetDemo(); location.reload();
  };


  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open]);

  if (!open) return null;
  return (
    <div role="dialog" aria-label="Demo scenarios" className="fixed z-50 inset-x-3 bottom-[76px] max-h-[70vh] lg:inset-x-auto lg:bottom-auto lg:left-[18rem] lg:top-20 lg:w-[23rem] overflow-y-auto overscroll-contain rounded-lg border border-space-strong bg-space-card shadow-2xl shadow-black/60 p-4">
      <div className="flex items-center justify-between"><h2 className="card-title">Demo scenarios</h2><button onClick={onClose} aria-label="Close demo scenarios" className="text-slate-300 hover:text-slate-50"><X size={18} aria-hidden="true" /></button></div>
      <p className="card-sub mt-1">Simulated data only. Each scenario is written through the onboard API.</p>

      <div className="mt-3 rounded-md border border-space-line p-3 flex items-center justify-between gap-3">
        <div><p className="text-sm">Simulated live sensor</p><p className="text-xs text-slate-300">Cabin: {s.cabin} · Vitals: {s.vitals} · every 2 min</p></div>
        <button onClick={() => (s.on ? sim.stop() : sim.start(refresh))} aria-pressed={s.on} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${s.on ? 'bg-brand/15 text-brand-soft border border-brand/50' : 'border border-space-line text-slate-300'}`}>
          <Power size={12} aria-hidden="true" />{s.on ? 'On' : 'Off'}
        </button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {list.map((sc) => (
          <li key={sc.id}>
            <button disabled={!!busy} onClick={() => scenario(sc.id)} className="w-full text-left rounded-md border border-space-line hover:border-space-strong hover:bg-space-card2 px-3 py-2 disabled:opacity-60">
              <span className="block text-sm text-slate-100">{busy === sc.id ? 'Running…' : sc.label}</span>
              <span className="block text-xs text-slate-300">{AREA_LABEL[sc.areaId]}{sc.id === 'sensor-fault' ? ' · readings stop; Unavailable once the last one is older than 5 min' : ''}</span>
            </button>
          </li>
        ))}
        <li>
          <button disabled={!!busy} onClick={() => run('exercise', () => sim.setMode({ vitals: 'exercise' }, refresh))} className="w-full text-left rounded-md border border-space-line hover:border-space-strong hover:bg-space-card2 px-3 py-2 disabled:opacity-60">
            <span className="block text-sm text-slate-100">Exercising (live sensor)</span><span className="block text-xs text-slate-300">Gravity · vital signs with activity = exercise</span>
          </button>
        </li>
      </ul>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button disabled={!!busy} onClick={nominal} className="btn-ghost text-xs"><Undo2 size={13} aria-hidden="true" />Back to nominal</button>
        <button onClick={reset} className="btn-ghost text-xs"><RotateCcw size={13} aria-hidden="true" />Reset demo</button>
      </div>
      <p className="text-xs text-slate-300 mt-2">Back to nominal: the live sensor sends normal readings again and the Earth link returns. Alerts close only when a valid reading is back in range (the CO₂ 1-hour average takes up to an hour).</p>
    </div>
  );
}
