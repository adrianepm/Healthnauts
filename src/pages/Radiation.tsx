// Radiation: exposição, não saúde. Dose de carreira e evento solar vêm avaliados da API.
import { Radiation as RadIcon, Sun, Atom, History } from 'lucide-react';
import { rules } from '../../shared/config/research.js';
import { AREA } from '../config/api';
import { useArea } from './useArea';
import { KeyTiles, TodayHero } from '../components/lean/Home';
import { Card, More, SourcesList, WhyBlock } from '../components/ui';
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
      <h1 className="text-sm text-slate-400">Space radiation · exposure, not health</h1>
      <TodayHero level={d.summary!.displayLevel} label="Radiation now" message={d.summary!.headline.message ?? ''} also={d.also(d.summary!.headline.indicator)} />
      <KeyTiles tiles={[
        { key: 'career', title: 'Career dose', icon: RadIcon, value: pct === null ? '—' : `${pct.toFixed(1)}%`, level: career?.displayLevel ?? 'unavailable', compare: career?.value !== undefined ? `${career.value} of ${LIMIT} mSv (NASA limit)` : career?.message },
        { key: 'mission', title: 'This mission', icon: Atom, value: career?.missionValue !== undefined ? `${career.missionValue} mSv` : '—', compare: 'Continuous dosimeter ledger' },
        { key: 'prior', title: 'Prior flights', icon: History, value: career?.priorValue !== undefined ? `${career.priorValue} mSv` : '—', compare: 'Attested prior history' },
        { key: 'solar', title: 'Solar particle event', icon: Sun, value: solar?.recordedAt ? ago(solar.recordedAt) : 'No event', level: solar?.displayLevel ?? 'unavailable', compare: solar?.message ?? 'No solar event recorded.' },
      ]} />

      <Card title="Career effective dose" sub={`Percent of the ${LIMIT} mSv career limit · demonstration bands at ${BANDS[0]}% and ${BANDS[1]}%`}>
        <div className="relative h-5 rounded-full bg-space-deep border border-space-line overflow-hidden">
          <div className="absolute inset-y-0 left-0" style={{ width: `${Math.min(100, pct ?? 0)}%`, background: color }} />
          {BANDS.map((b) => <span key={b} className="absolute inset-y-0 w-px bg-slate-400/70" style={{ left: `${b}%` }} />)}
        </div>
        <div className="relative h-4 text-xs text-slate-400 mt-1">{BANDS.map((b) => <span key={b} className="absolute -translate-x-1/2" style={{ left: `${Math.min(b, 97)}%` }}>{b}%</span>)}</div>
        <p className="text-sm text-slate-300 mt-3">{career?.message}</p>
        {career?.limitation && <p className="text-xs text-slate-500 mt-1">{career.limitation}</p>}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Glossary">
          <ul className="text-sm text-slate-300 space-y-2">
            <li><b>Gy</b> · energy absorbed per kg of tissue.</li>
            <li><b>mGy-Eq</b> · absorbed dose adjusted for the type of radiation, used in organ limits.</li>
            <li><b>Sv and mSv</b> · effective dose, estimates the risk for the whole body.</li>
            <li><b>Dose rate</b> · mSv per day.</li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">Radiation risk is mainly long term. No symptom is attributed to radiation automatically.</p>
        </Card>
        <Card title="Organ limits (reference only)" sub="mGy-Eq · NASA-STD-3001 Vol. 1 Table 4.8-1. The app does not calculate organ dose.">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-slate-400 text-left"><th className="py-1">Organ</th><th>30 days</th><th>1 year</th><th>Career</th></tr></thead>
              <tbody>{ORGAN_LIMITS.map(([o, a, b, c]) => <tr key={o} className="border-t border-space-line text-slate-300"><td className="py-1.5">{o}</td><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody>
            </table>
          </div>
          <SourcesList ids={['s1']} />
        </Card>
      </div>
      <More title="Why measure this? · Sources"><WhyBlock ids={['career_effective_dose', 'solar_event_simulated']} /></More>
    </div>
  );
}
