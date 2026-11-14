import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { labelFor, sourceFor, timeLabel, unitFor } from '../config/presentation';
import type { ApiHistoryResponse, ApiRecord } from '../services/api';

const DAY = 86400000;

export function RecordsTable({ records }: { records: ApiRecord[] }) {
  return records.length ? <ul className="records-list">
    {records.map(record => <li key={record.id}><strong>{labelFor(record.indicator)}</strong>
      <span className="record-value">{displayValue(record)}</span>
      <small>{sourceFor(record.source)} · <time dateTime={record.recordedAt}>{timeLabel(record.recordedAt)}</time></small>
    </li>)}
  </ul> : <p className="muted">No records in this selection.</p>;
}

export function displayValue(record: ApiRecord) {
  const { value, unit, indicator } = record;
  if (record.source === 'simulated' && typeof value === 'string') {
    const translations: Record<string,string> = {
      'Inventário fictício: kit de primeiros socorros e equipamento de monitoramento.': 'Example inventory: first-aid kit and monitoring equipment.',
      'Relato fictício: sensação de desequilíbrio ao mudar de posição.': 'Example report: felt unsteady when changing position.',
      'Relato fictício: desconforto na garganta.': 'Example report: throat discomfort.',
    };
    if (translations[value]) return translations[value];
  }
  if (indicator === 'post_eva_symptoms' && typeof value === 'string') {
    const labels: Record<string,string> = {
      none_reported:'None reported', itching:'Itching', muscle_joint_pain:'Muscle or joint pain', rash:'Rash', numbness_weakness:'Numbness or weakness',
      thinking_speech_change:'Changes in thinking or speech', dizziness_balance_hearing:'Changes in dizziness, balance or hearing',
      breathlessness_chest_pain:'Breathlessness or chest pain',
    };
    return value.split(', ').map(item => labels[item] ?? item).join(', ');
  }
  if (indicator === 'solar_event_simulated') return value ? 'Active' : 'Inactive';
  if (['dizziness', 'near_fainting', 'vision_change', 'amsler_change', 'supplemental_oxygen'].includes(indicator)) return value ? 'Yes' : 'No';
  if (indicator === 'consciousness') return ({ A: 'Alert', C: 'New confusion', V: 'Responds to voice', P: 'Responds to pain', U: 'Unresponsive' }[String(value)] ?? String(value));
  return [value, unitFor(unit)].filter(part => part !== '').join(' ');
}

export function AreaHistory({ history, priority }: { history: ApiHistoryResponse | null; priority: string[] }) {
  const [indicator, setIndicator] = useState('');
  const [days, setDays] = useState(7);
  if (!history) return <p role="status" className="muted">History is unavailable.</p>;
  const start = Date.parse(history.period.to) - days * DAY;
  const records = history.records.filter(record => Date.parse(record.recordedAt) >= start);
  const numeric = records.filter(record => typeof record.value === 'number' && (record.unit !== null || ['mood_score', 'stress', 'sleep_quality', 'sleepiness_kss', 'fatigue_samn_perelli'].includes(record.indicator)));
  const choices = [...new Set([...priority.filter(id => numeric.some(r => r.indicator === id)), ...numeric.map(r => r.indicator)])];
  const selected = choices.includes(indicator) ? indicator : choices[0];
  const series = numeric.filter(record => record.indicator === selected);
  const [latest] = series.slice(-1);
  // Keep units, data sources and comparable measurement contexts distinct.
  const comparable = (record: ApiRecord) => JSON.stringify([record.source, record.unit, record.context?.method, record.context?.location,
    record.context?.seriesId, record.context?.missionId, record.context?.quantity, record.context?.organ, record.periodStart && selected === 'accumulated_dose' ? record.periodStart : null]);
  const compatible = latest ? series.filter(r => comparable(r) === comparable(latest)) : [];
  const points = compatible.map(record => ({ time: Date.parse(record.recordedAt), value: record.value }));
  return <>
    <div className="section-heading"><div><h2>Measurement history</h2><p>Observed values, with each measurement shown separately.</p></div>
      <div className="design-actions">
        {choices.length > 0 && <label>Indicator<select value={selected} onChange={e => setIndicator(e.target.value)}>{choices.map(id => <option key={id} value={id}>{labelFor(id)}</option>)}</select></label>}
        <label>Period<select value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={3}>Last 3 days</option><option value={1}>Last 24 hours</option></select></label>
      </div>
    </div>
    {latest ? <>
      <p className="chart-caption">{labelFor(selected)} ({unitFor(latest.unit) || 'scale points'}) · {sourceFor(latest.source)}{compatible.length !== series.length ? ' · Plot uses the latest comparable series' : ''}</p>
      <div className="history-chart" aria-label={`${labelFor(selected)} chart with ${points.length} recorded measurements`} role="img">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={points} margin={{ top: 12, right: 20, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#293c50" />
            <XAxis dataKey="time" type="number" domain={[start, Date.parse(history.period.to)]} minTickGap={32}
              tickFormatter={value => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...days === 1 && { hour: '2-digit' }, timeZone: 'UTC' }).format(value)}
              tick={{ fill: '#a9b9c9', fontSize: 12 }} />
            <YAxis width={54} domain={['auto', 'auto']} tick={{ fill: '#a9b9c9', fontSize: 12 }} />
            <Tooltip labelFormatter={value => timeLabel(new Date(value).toISOString())} formatter={(value: number) => [`${value} ${unitFor(latest.unit)}`, labelFor(selected)]}
              contentStyle={{ background: '#142335', border: '1px solid #334a60' }} itemStyle={{ color: '#a6def6' }} />
            <Line dataKey="value" stroke="none" isAnimationActive={false} dot={{ r: 4, fill: '#84d5f4', stroke: '#152637' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </> : <p className="muted">No measurements can be plotted for this period.</p>}
    <details className="disclosure"><summary>View records in this period ({records.length})</summary>
      <RecordsTable records={[...records].reverse()} /></details>
  </>;
}
