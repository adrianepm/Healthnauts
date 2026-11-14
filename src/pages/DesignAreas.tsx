import { useEffect, useRef, useState } from 'react';
import { Activity, ClipboardList, FileText, Moon, Plus, Radio, Timer, Wind } from 'lucide-react';
import { labelFor, timeLabel, type Area } from '../config/presentation';
import type { EntryKind } from '../config/entryForms';
import { apiService, type ApiMissionResponse } from '../services/api';
import { useStore } from '../store/useStore';
import { AreaDashboard } from '../components/AreaDashboard';
import { EntryDialog } from '../components/EntryDialog';
import { SleepEntry } from '../components/SleepEntry';
import { DesignDialog } from '../components/DesignDialog';

type Action = EntryKind | 'sleep' | 'pvt' | 'breathing';
const buttons: Record<Action, [string, typeof Plus]> = {
  checkin:['Daily check-in',ClipboardList], sleep:['Record sleep',Moon], pvt:['Start reaction test',Timer], breathing:['Breathing timer',Timer],
  symptoms:['Record symptoms',ClipboardList], atmosphere:['Record cabin air',Wind], noise:['Record noise',Plus], postEva:['Post-spacewalk checklist',ClipboardList],
  vitals:['Record vital signs',Activity], posture:['Record posture readings',Plus], fitness:['Record fitness',Plus], radiation:['Record exposure',Plus],
  cabinConditions:['Record temperature and humidity',Plus], exercise:['Record exercise',Plus], mission:['Update mission',Radio], reference:['Add pre-mission reference',Plus], report:['Prepare report',FileText],
};
const actionsByArea: Record<string, Action[]> = {
  radiation:['radiation'], isolation_confinement:['checkin','sleep','pvt','breathing'],
  distance_from_earth:['report','mission','reference'], gravity_fields:['vitals','posture','fitness','exercise','symptoms','reference'],
  hostile_closed_environment:['atmosphere','cabinConditions','noise','postEva'],
};

function MissionSummary() {
  const { astronautId, dataset, refreshTrigger } = useStore();
  const [response, setResponse] = useState<{ key: string; data: ApiMissionResponse | null }>();
  const key = JSON.stringify([astronautId, dataset, refreshTrigger]);
  useEffect(() => {
    const controller = new AbortController();
    apiService.getMission(astronautId, dataset, controller.signal)
      .then(data => setResponse({ key, data })).catch(() => { if (!controller.signal.aborted) setResponse({ key, data:null }); });
    return () => controller.abort();
  }, [key, astronautId, dataset]);
  const mission = response?.key === key ? response.data?.mission : undefined;
  const activities: Record<string,string> = { routine:'Routine', exercise:'Exercise', eva:'Spacewalk', landing:'Landing', post_landing:'After landing', post_eva:'After spacewalk', transit:'Transit' };
  return <section className="design-panel area-section">
    <h2>Mission communications</h2>
    {mission ? <>
      <dl className="compact-results">
        <div><dt>Destination and activity</dt><dd>{mission.input.destination} · {activities[mission.input.activity]}</dd></div>
        <div><dt>Communication</dt><dd>{mission.input.communication}{mission.input.solarConjunction ? ' · Simulated solar conjunction' : ''}</dd></div>
        <div><dt>One-way delay</dt><dd>{mission.calculation.oneWaySeconds == null ? 'Unavailable' : `${mission.calculation.oneWaySeconds} s`}</dd></div>
        <div><dt>Estimated response</dt><dd>{mission.calculation.estimatedResponseSeconds == null ? 'Unavailable' : `${mission.calculation.estimatedResponseSeconds} s`}</dd></div>
      </dl>
      <p className="muted">Planning estimate: round-trip signal delay plus {mission.calculation.processingSeconds} s of ground processing. {mission.calculation.limitation}</p>
      <p className="muted">Updated {timeLabel(mission.input.recordedAt)}</p>
    </> : <p className="muted">{response?.key !== key ? 'Loading mission context…' : response.data ? 'No mission context recorded.' : 'Mission context is unavailable.'}</p>}
    {response?.key === key && !!response.data?.references.length && <details className="disclosure"><summary>Pre-mission references</summary><ul className="source-list">
      {response.data.references.map((item, index) => <li key={index}>{labelFor(item.input.indicator)} · {item.input.value} {item.input.unit} · {timeLabel(item.input.recordedAt)}</li>)}</ul></details>}
  </section>;
}

function BreathingTimer({ close }: { close: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number>();
  useEffect(() => () => window.clearInterval(timer.current), []);
  function begin() {
    window.clearInterval(timer.current); setSeconds(1);
    timer.current = window.setInterval(() => setSeconds(previous => previous + 1), 1000);
  }
  const phase = seconds ? (seconds - 1) % 19 : 0;
  const label = !seconds ? 'Ready' : phase < 4 ? 'Breathe in' : phase < 11 ? 'Hold gently' : 'Breathe out';
  return <DesignDialog title="Paced breathing" description="An optional relaxation timer. Stop if it feels uncomfortable." close={close}>
    <p className="breathing-label" role="status">{label}</p>
    <div className="dialog-actions">{seconds > 0
      ? <button className="design-button" onClick={() => { window.clearInterval(timer.current); setSeconds(0); }}>Stop timer</button>
      : <button className="design-button primary" onClick={begin}>Start timer</button>}</div>
  </DesignDialog>;
}

export function DesignArea({ config }: { config: Area }) {
  const [entry, setEntry] = useState<Action>();
  const setIsPvtModalOpen = useStore(state => state.setIsPvtModalOpen);
  const close = () => setEntry(undefined);
  return <>
    <AreaDashboard config={config} actions={<div className="design-actions">
      {actionsByArea[config.id].map((id, i) => {
        const [label, Icon] = buttons[id];
        return <button className={`design-button ${i === 0 ? 'primary' : ''}`} key={id} onClick={() => id === 'pvt' ? setIsPvtModalOpen(true) : setEntry(id)}><Icon size={17} /> {label}</button>;
      })}
    </div>} extra={config.id === 'distance_from_earth' ? <MissionSummary /> : undefined} />
    {entry === 'sleep' && <SleepEntry close={close} />}
    {entry === 'breathing' && <BreathingTimer close={close} />}
    {entry && entry !== 'sleep' && entry !== 'pvt' && entry !== 'breathing' && <EntryDialog kind={entry} close={close} />}
  </>;
}
