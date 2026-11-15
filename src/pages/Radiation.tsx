// Radiation: exposição, não saúde. Dose de carreira e evento solar vêm avaliados da API.
import { Sun, Atom, History } from 'lucide-react';
import { rules } from '../../shared/config/research.js';
import { AREA } from '../config/api';
import { useArea } from './useArea';
import { KeyTiles, TodayHero } from '../components/lean/Home';
import { Card, More, Num, PageHeader, SourcesList, StatusPill, WhyBlock } from '../components/ui';
import { LEVEL_UI } from '../lib/levels';
import { ORGAN_LIMITS } from '../lib/content';
import { ago } from '../lib/format';

const BANDS = rules.career.bands as number[]; // 75, 90, 100 (% do limite)
const LIMIT = rules.career.limit as number; // 600 mSv

export default function Radiation() {
  const d = useArea(AREA.radiation);
  if (!d.ready) return <p className="text-sm text-slate-400">Loading…</p>;
  const career = d.a('career_effective_dose');
  const solar = d.assessments.find((x) => x.group === 'solar');
  const pct = typeof career?.percentOfLimit === 'number' ? career.percentOfLimit : null;
  const color = career && career.displayLevel !== 'normal' ? LEVEL_UI[career.displayLevel].color : '#5B7FA6';

  return (
    <div className="space-y-5">
      <PageHeader title="Radiation" sub="Space radiation · exposure, not health" />
      <TodayHero level={d.summary!.displayLevel} label="Radiation now" message={d.summary!.headline.message ?? ''} also={d.also(d.summary!.headline.indicator)} />

      {/* Destaque da tela: dose de carreira em relação ao limite. */}
      <section className="card" data-indicator="career_effective_dose" aria-labelledby="career-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="career-title" className="card-title">Career effective dose</h2>
            <p className="card-sub mt-0.5">Percent of the {LIMIT} mSv career limit (NASA) · demonstration bands at {BANDS[0]}% and {BANDS[1]}%</p>
          </div>
          <StatusPill level={career?.displayLevel ?? 'unavailable'} />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
          <span className="text-5xl font-medium tracking-tight text-slate-50 leading-none">{pct === null ? '—' : <><Num>{pct.toFixed(1)}</Num><span className="text-2xl text-slate-300">%</span></>}</span>
          {career?.value !== undefined && <span className="text-sm text-slate-300 pb-1"><span className="font-mono text-slate-100">{career.value}</span> of <span className="font-mono">{LIMIT}</span> mSv</span>}
        </div>
        <div className="mt-5" role="img" aria-label={`Career dose ${pct === null ? 'unavailable' : pct.toFixed(1) + '% of the limit'}; bands at ${BANDS.join(', ')}%`}>
          <div className="relative h-4 rounded-sm bg-space-card2 border border-space-line overflow-hidden">
            <div className="absolute inset-y-0 left-0" style={{ width: `${Math.min(100, pct ?? 0)}%`, background: color }} />
            {BANDS.slice(0, -1).map((b) => <span key={b} className="absolute inset-y-0 w-px bg-slate-300" style={{ left: `${b}%` }} />)}
          </div>
          <div className="relative h-5 mt-1.5 text-xs text-slate-300 font-mono" aria-hidden="true">
            <span className="absolute left-0">0%</span>
            {BANDS.map((b) => <span key={b} className={`absolute ${b >= 100 ? '-translate-x-full' : '-translate-x-1/2'}`} style={{ left: `${b}%` }}>{b}%</span>)}
          </div>
        </div>
        <p className="text-sm text-slate-200 mt-4">{career?.message}</p>
        {career?.limitation && <p className="text-xs text-slate-300 mt-1">{career.limitation}</p>}
      </section>

      <KeyTiles tiles={[
        { key: 'mission', title: 'This mission', icon: Atom, value: career?.missionValue !== undefined ? String(career.missionValue) : '—', unit: career?.missionValue !== undefined ? 'mSv' : undefined, compare: 'Continuous dosimeter ledger' },
        { key: 'prior', title: 'Prior flights', icon: History, value: career?.priorValue !== undefined ? String(career.priorValue) : '—', unit: career?.priorValue !== undefined ? 'mSv' : undefined, compare: 'Attested prior history' },
        { key: 'solar', indicator: 'solar_event_simulated', title: 'Solar particle event', icon: Sun, value: solar?.recordedAt ? ago(solar.recordedAt) : 'No event', level: solar?.displayLevel ?? 'normal', compare: solar?.message ?? 'No solar event recorded.' },
      ]} />

      <div className="grid lg:grid-cols-2 gap-3">
        <Card title="Glossary">
          <dl className="text-sm text-slate-300 space-y-2">
            <div><dt className="inline font-semibold text-slate-100">Gy</dt> <dd className="inline">· energy absorbed per kg of tissue.</dd></div>
            <div><dt className="inline font-semibold text-slate-100">mGy-Eq</dt> <dd className="inline">· absorbed dose adjusted for the type of radiation, used in organ limits.</dd></div>
            <div><dt className="inline font-semibold text-slate-100">Sv and mSv</dt> <dd className="inline">· effective dose, estimates the risk for the whole body.</dd></div>
            <div><dt className="inline font-semibold text-slate-100">Dose rate</dt> <dd className="inline">· mSv per day.</dd></div>
          </dl>
          <p className="text-xs text-slate-300 mt-3">Radiation risk is mainly long term. No symptom is attributed to radiation automatically.</p>
        </Card>
        <Card title="Organ limits (reference only)" sub="mGy-Eq · NASA-STD-3001 Vol. 1 Table 4.8-1. The app does not calculate organ dose.">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-slate-300 text-left"><th className="py-1.5 font-medium">Organ</th><th className="font-medium text-right">30 days</th><th className="font-medium text-right">1 year</th><th className="font-medium text-right">Career</th></tr></thead>
              <tbody>{ORGAN_LIMITS.map(([o, a, b, c]) => <tr key={o} className="border-t border-space-line text-slate-200"><td className="py-1.5 pr-2">{o}</td><td className="font-mono text-right">{a}</td><td className="font-mono text-right">{b}</td><td className="font-mono text-right">{c}</td></tr>)}</tbody>
            </table>
          </div>
          <SourcesList ids={['s1']} />
        </Card>
      </div>
      <More title="Why measure this? · Sources"><WhyBlock ids={['career_effective_dose', 'solar_event_simulated']} /></More>
    </div>
  );
}
