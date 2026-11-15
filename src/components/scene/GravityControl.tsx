// Seletor de gravidade (Micro, Moon, Mars, Earth), discreto, abaixo do HUD: só visual e educativo, não muda regra nem nível.
import { GRAVITY_VIEWS, type GravityView } from './sceneMapping';

export function GravityControl({ view, onChange }: { view: GravityView; onChange: (v: GravityView) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
      <div role="group" aria-label="Gravity field (visual only)" className="inline-flex rounded-lg border border-white/10 p-0.5">
        {(Object.keys(GRAVITY_VIEWS) as GravityView[]).map((k) => (
          <button key={k} type="button" aria-pressed={view === k} onClick={() => onChange(k)}
            className={`px-3 rounded-md text-xs font-medium tracking-wide transition-colors ${view === k ? 'bg-white/10 text-slate-100' : 'text-slate-400 hover:text-slate-100'}`}>
            {GRAVITY_VIEWS[k].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-300" aria-live="polite">{GRAVITY_VIEWS[view].text}</p>
    </div>
  );
}
