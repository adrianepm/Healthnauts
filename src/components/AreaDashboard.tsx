import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Clock, RefreshCw, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { labelFor, sourceFor, timeLabel, type Area } from '../config/presentation';
import { apiService, type ApiAreaResponse, type ApiAssessment, type ApiHistoryResponse, type ApiRecord } from '../services/api';
import { useStore } from '../store/useStore';
import { DesignStatus } from './DesignStatus';
import { AreaHistory, RecordsTable, displayValue } from './AreaHistory';

type Data = { context: string; area: ApiAreaResponse; history: ApiHistoryResponse | null };

const unclassified = ['cabin_noise', 'inspired_oxygen_pressure', 'temperature', 'relative_humidity', 'organ_dose'];
const qualityLabels: Record<string, string> = {
  assessed: 'Assessment recorded', insufficient_data: 'Insufficient data', stale: 'Older measurement', not_applicable: 'Classification unavailable',
  no_demonstrative_signal: 'No demonstration signal', baseline_collecting: 'Building personal reference', baseline_insufficient: 'Personal reference unavailable',
  complete: 'Complete', incomplete: 'Incomplete', available: 'Available',
};

function AssessmentDetail({ assessment }: { assessment: ApiAssessment }) {
  const { rule, quality, recordedAt, scientificCategory, limitation, message, recordIds } = assessment;
  return <li>
    <div className="assessment-heading"><strong>{labelFor(assessment.indicator)}</strong><DesignStatus assessment={assessment} /></div>
    <p>{message}</p>
    {scientificCategory && <p>Reference category: {scientificCategory.replace(/_/g, ' ')}</p>}
    {typeof assessment.value === 'number' && <p>Evaluated value: {assessment.value} {assessment.unit}</p>}
    {typeof assessment.score === 'number' && <p>Score: {assessment.score}</p>}
    {typeof assessment.percentOfReference === 'number' && <p>Pre-mission comparison: {assessment.percentOfReference}%</p>}
    <p className="muted">{[recordedAt && timeLabel(recordedAt), quality ? qualityLabels[quality] : null, recordIds.length ? `${recordIds.length} source records` : null].filter(Boolean).join(' · ')}</p>
    {limitation && <p className="muted">{limitation}</p>}
    {rule?.version && <p className="muted">Assessment method revision {rule.version}</p>}
    {rule?.source?.references?.filter(ref => ref.url).map(ref => <a key={ref.url} href={ref.url}>{ref.title ?? 'Research reference'} <ArrowUpRight size={14} /></a>)}
    {rule?.source?.url && <a href={rule.source.url}>Rule source {[rule.source.edition, rule.source.section].filter(Boolean).join(' · ')} <ArrowUpRight size={14} /></a>}
  </li>;
}

function Metric({ id, record, assessment }: { id: string; record?: ApiRecord; assessment?: ApiAssessment }) {
  return <div className="metric">
    <h3>{labelFor(id)}</h3>
    <p className={record ? 'metric-value' : 'metric-value missing'}>{record ? displayValue(record) : 'No measurement'}</p>
    {record && <time dateTime={record.recordedAt}><Clock size={14} />{timeLabel(record.recordedAt)} · {sourceFor(record.source)}</time>}
    <DesignStatus assessment={assessment} hasMeasurement={!!record} />
  </div>;
}

export function AreaDashboard({ config, actions, extra }: { config: Area; actions: ReactNode; extra?: ReactNode }) {
  const { astronautId, dataset, refreshTrigger, triggerRefresh } = useStore();
  const context = JSON.stringify([astronautId, dataset, refreshTrigger]);
  const [data, setData] = useState<Data>();
  const [failure, setFailure] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      apiService.getArea(config.id, astronautId, dataset, controller.signal),
      apiService.getAreaHistory(config.id, { astronautId, dataset }, controller.signal),
    ]).then(([area, history]) => {
      if (controller.signal.aborted) return;
      if (area.status === 'rejected') { setFailure(context); return; }
      setData({ context, area: area.value, history: history.status === 'fulfilled' ? history.value : null });
    });
    return () => controller.abort();
  }, [astronautId, dataset, context, config.id]);

  const current = data?.context === context ? data : undefined;
  const { icon: Icon, title, description, priority } = config;
  const records = current?.area.latestRecords ?? [];
  const assessments = current?.area.assessments ?? [];
  const last = records.reduce((latest, record) => record.recordedAt > latest ? record.recordedAt : latest, '');
  const signals = assessments.filter(item => item.level && item.status !== 'stale');
  const inactive = unclassified.filter(id => current?.area.indicatorDefinitions.some(definition => definition.id === id));
  if (config.id === 'radiation' && !inactive.includes('organ_dose')) inactive.push('organ_dose');

  return <div className="area-dashboard">
    <Link to="/" className="back-link"><ArrowLeft size={16} /> Overview</Link>
    <div className="page-heading area-heading"><div>
      <span className="area-icon"><Icon size={26} /></span>
      <h1>{title}</h1><p>{description}</p>
      {current && <p className="update-time">{last ? <>Most recent measurement <time dateTime={last}>{timeLabel(last)}</time></> : 'No measurements in this data source'}</p>}
    </div></div>
    <section className="area-actions design-panel" aria-label="Actions">{actions}</section>
    {failure === context ? <div className="design-panel empty-state" role="alert"><TriangleAlert size={24} /><strong>Connection unavailable</strong>
      <p>We could not load measurements for this area.</p><button className="design-button" onClick={triggerRefresh}><RefreshCw size={16} /> Try again</button></div>
      : !current ? <div className="design-panel empty-state" role="status">Loading measurements…</div> : <>
      {signals.length > 0 && <section className="design-panel area-section signal-panel" aria-label="Current observations">
        <h2>Attention & follow-up</h2><ul className="assessment-list">{signals.map((item, i) => <AssessmentDetail key={i} assessment={item} />)}</ul>
      </section>}
      <section className="design-panel area-section" aria-labelledby="summary-heading">
        <div className="section-heading"><div><h2 id="summary-heading">Latest measurements</h2><p>{dataset === 'simulated' ? 'Simulated records' : 'Crew entries and sensor records'}</p></div></div>
        <div className="metrics-grid">{priority.map(id => {
          const record = records.find(item => item.indicator === id);
          const candidates = assessments.filter(item => item.indicator === id);
          const assessment = record
            ? candidates.find(item => item.recordIds.includes(record.id)) ??
              candidates.find(item => item.source === record.source || !item.source)
            : candidates.find(item => item.recordedAt) ?? candidates[0];
          return <Metric key={id} id={id} record={record} assessment={assessment} />;
        })}</div>
      </section>
      {extra}
      {config.id === 'isolation_confinement' && <p className="muted privacy-note">Use fictional information. This prototype does not restrict access by crew role.</p>}
      <section className="design-panel area-section" aria-label="History"><AreaHistory history={current.history} priority={priority} /></section>
      <div className="design-panel area-section">
        <details className="disclosure"><summary>All latest measurements ({records.length})</summary><RecordsTable records={records} /></details>
        <details className="disclosure"><summary>Assessments and limitations</summary>
          {inactive.length > 0 && <p className="muted">Automatic classification is unavailable for {inactive.map(labelFor).join(', ')}.</p>}
          {assessments.length === 0 ? <p className="muted">No assessment is available in this context.</p>
            : <ul className="assessment-list">{assessments.map((item, i) => <AssessmentDetail key={i} assessment={item} />)}</ul>}
        </details>
        <details className="disclosure"><summary>Research sources</summary>
          <ul className="source-list">{current.area.references.map(reference => <li key={reference.url}><a href={reference.url}>{reference.title}<ArrowUpRight size={14} aria-hidden="true" /></a></li>)}</ul>
        </details>
      </div>
    </>}
  </div>;
}
