// Seletor de gravidade (Micro, Moon, Mars, Earth): só visual e educativo, não muda regra nem nível.
import { GRAVITY_VIEWS, type GravityView } from './sceneMapping';

export function GravityControl({ view, onChange }: { view: GravityView; onChange: (v: GravityView) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="group" aria-label="Gravity field (visual only)" className="inline-flex rounded-xl border border-space-line p-1 bg-space-bg">
        {(Object.keys(GRAVITY_VIEWS) as GravityView[]).map((k) => (
          <button key={k} type="button" aria-pressed={view === k} onClick={() => onChange(k)}
            className={`px-3 rounded-lg text-sm font-medium ${view === k ? 'bg-brand text-space-bg' : 'text-slate-300 hover:text-slate-100'}`}>
            {GRAVITY_VIEWS[k].label}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-300" aria-live="polite">{GRAVITY_VIEWS[view].text}</p>
    </div>
  );
}
