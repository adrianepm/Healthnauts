// Painel da demonstração: os 8 cenários da API, o sensor simulado e "Reset demo".
// O cenário grava os dados pela API; o sensor ao vivo passa a repetir a mesma condição até "Back to nominal".
import { useEffect, useState } from 'react';
import { FlaskConical, Power, RotateCcw, Undo2, X } from 'lucide-react';
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

export function DemoPanel() {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 shadow-lg">
        <FlaskConical size={16} />Demo
      </button>
      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-[22rem] max-w-[calc(100vw-2.5rem)] max-h-[70vh] overflow-y-auto rounded-2xl border border-space-line bg-space-deep shadow-2xl p-4">
          <div className="flex items-center justify-between"><h3 className="card-title">Demo scenarios</h3><button onClick={() => setOpen(false)} aria-label="Close" className="text-slate-400 hover:text-white"><X size={18} /></button></div>
          <p className="card-sub mt-1">Simulated data only. Each scenario is written through the onboard API.</p>

          <div className="mt-3 rounded-xl border border-space-line p-3 flex items-center justify-between gap-3">
            <div><p className="text-sm">Simulated live sensor</p><p className="text-[11px] text-slate-400">Cabin: {s.cabin} · Vitals: {s.vitals} · every 2 min</p></div>
            <button onClick={() => (s.on ? sim.stop() : sim.start(refresh))} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${s.on ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'border border-space-line text-slate-300'}`}>
              <Power size={12} />{s.on ? 'On' : 'Off'}
            </button>
          </div>

          <ul className="mt-3 space-y-1.5">
            {list.map((sc) => (
              <li key={sc.id}>
                <button disabled={!!busy} onClick={() => scenario(sc.id)} className="w-full text-left rounded-lg border border-space-line hover:border-slate-500 px-3 py-2 disabled:opacity-50">
                  <span className="block text-sm text-slate-100">{busy === sc.id ? 'Running…' : sc.label}</span>
                  <span className="block text-[10px] text-slate-500">{AREA_LABEL[sc.areaId]}{sc.id === 'sensor-fault' ? ' · readings stop; Unavailable once the last one is older than 5 min' : ''}</span>
                </button>
              </li>
            ))}
            <li>
              <button disabled={!!busy} onClick={() => run('exercise', () => sim.setMode({ vitals: 'exercise' }, refresh))} className="w-full text-left rounded-lg border border-space-line hover:border-slate-500 px-3 py-2 disabled:opacity-50">
                <span className="block text-sm text-slate-100">Exercising (live sensor)</span><span className="block text-[10px] text-slate-500">Gravity · vital signs with activity = exercise</span>
              </button>
            </li>
          </ul>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={!!busy} onClick={nominal} className="btn-ghost text-xs"><Undo2 size={13} />Back to nominal</button>
            <button onClick={reset} className="btn-ghost text-xs"><RotateCcw size={13} />Reset demo</button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Back to nominal: the live sensor sends normal readings again and the Earth link returns. Alerts close only when a valid reading is back in range (the CO₂ 1-hour average takes up to an hour).</p>
        </div>
      )}
    </>
  );
}
