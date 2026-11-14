import { useEffect, useState } from 'react';
import { ArrowRight, CircleCheck, ClipboardList, Database, Radio, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { areas, crewName, labelFor, timeLabel } from '../config/presentation';
import { apiService, type ApiAlertsResponse, type ApiMissionResponse, type ApiOverviewResponse } from '../services/api';
import { useStore } from '../store/useStore';
import { CrewFigure } from '../components/CrewFigure';
import { DesignStatus } from '../components/DesignStatus';

type Snapshot = { context: string; overview: ApiOverviewResponse; alerts: ApiAlertsResponse | null; mission: ApiMissionResponse | null };

export function Geral() {
  const { astronautId, dataset, refreshTrigger, triggerRefresh, setIsNewLogModalOpen } = useStore();
  const context = JSON.stringify([astronautId, dataset, refreshTrigger]);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [failure, setFailure] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const args = [astronautId, dataset, controller.signal] as const;
    Promise.allSettled([apiService.getOverview(...args), apiService.getAlerts(...args), apiService.getMission(...args)])
      .then(([overview, alerts, mission]) => {
        if (controller.signal.aborted) return;
        if (overview.status === 'rejected') { setFailure(context); return; }
        setSnapshot({ context, overview: overview.value, alerts: alerts.status === 'fulfilled' ? alerts.value : null,
          mission: mission.status === 'fulfilled' ? mission.value : null });
      });
    return () => controller.abort();
  }, [astronautId, dataset, context]);

  const data = snapshot?.context === context ? snapshot : undefined;
  const attention = data?.alerts?.inObservation ?? [];
  const latestAlerts = [...attention].sort((a, b) => Number(b.level === 'risk') - Number(a.level === 'risk') ||
    Date.parse(b.evaluatedAt ?? b.recordedAt ?? '') - Date.parse(a.evaluatedAt ?? a.recordedAt ?? ''));
  const mission = data?.mission?.mission?.input;

  return <div className="overview">
    <div className="page-heading overview-heading">
      <div><p className="section-kicker"><Radio size={15} /> Mission dashboard</p><h1>Mission health overview</h1>
        <p>Review your records, see what needs attention and choose an area to explore.</p></div>
      <button className="design-button primary" onClick={() => setIsNewLogModalOpen(true)}><ClipboardList size={19} /> Record an observation</button>
    </div>

    <dl className="context-strip">
      <div><dt>Crew member</dt><dd>{crewName(astronautId)}</dd></div>
      <div><dt>Mission destination</dt><dd>{mission?.destination ?? (data ? data.mission ? 'No mission recorded' : 'Context unavailable' : '—')}</dd></div>
      <div><dt>Data source</dt><dd><Database size={15} /> {dataset === 'simulated' ? 'Simulation' : 'Crew & sensor records'}</dd></div>
      <div><dt>Under observation</dt><dd className={latestAlerts.length ? 'attention-text' : ''}>{latestAlerts.length ? <a href="#attention-heading">{latestAlerts.length} · Review</a> : data?.alerts ? 0 : '—'}</dd></div>
    </dl>

    <div className="overview-layout">
      <section className="design-panel navigation-panel" aria-labelledby="areas-heading">
        <div className="panel-heading"><h2 id="areas-heading">Spaceflight hazards</h2><p>Select an area to see its latest records and actions.</p></div>
        <div className="hazard-map">
          <svg className="orbit-guides" viewBox="0 0 720 400" preserveAspectRatio="none" aria-hidden="true">
            <g fill="none" stroke="currentColor"><ellipse cx="360" cy="200" rx="230" ry="146" strokeDasharray="3 8" />
              <ellipse cx="360" cy="200" rx="154" ry="181" opacity=".45" /><path d="M360 16v360M52 200h616" opacity=".35" /></g>
          </svg>
          <CrewFigure />
          {areas.map(({ id, path, title, icon: Icon }) => {
            const summary = data?.overview.areas.find(area => area.areaId === id);
            const observation = latestAlerts.find(alert => alert.areaId === id);
            return <Link to={path} data-area={id} className="hazard-node" key={id}>
              <span className="node-icon"><Icon size={22} aria-hidden="true" /></span>
              <span className="node-copy"><strong>{title}</strong>
                {observation ? <DesignStatus assessment={observation} /> : <small>{summary ? summary.dataStatus === 'available' ? 'Records available' : 'No records' : 'Open area'}</small>}
              </span><ArrowRight className="node-arrow" size={16} aria-hidden="true" />
            </Link>;
          })}
        </div>
      </section>
      <aside className="design-panel attention-panel" aria-labelledby="attention-heading">
        <div className="panel-heading"><h2 id="attention-heading">Attention & follow-up</h2><p>Observations from the selected data source.</p></div>
        {failure === context ? <div className="empty-state" role="alert"><TriangleAlert size={22} /><strong>Connection unavailable</strong><p>We could not load the dashboard.</p><button className="design-button" onClick={triggerRefresh}>Try again</button></div>
          : !data ? <div className="empty-state" role="status">Loading mission records…</div>
          : !data.alerts ? <div className="empty-state" role="alert"><TriangleAlert size={22} /><p>Follow-up information is unavailable.</p><button className="design-button" onClick={triggerRefresh}>Try again</button></div>
          : !latestAlerts.length ? <div className="empty-state"><CircleCheck size={23} /><strong>No open observations</strong><p>New observations appear here when the system flags a measurement for follow-up.</p></div>
          : <ul className="attention-list">{latestAlerts.map((alert, index) => {
            const area = areas.find(item => item.id === alert.areaId);
            return <li key={index}><DesignStatus assessment={alert} /><strong>{labelFor(alert.indicator)}</strong>
              <p>{alert.message}</p>{alert.recordedAt && <time dateTime={alert.recordedAt}>{timeLabel(alert.recordedAt)}</time>}
              {area && <Link to={area.path}>Open {area.title} <ArrowRight size={14} /></Link>}</li>;
          })}</ul>}
        <div className="attention-note">Review observations in context. This prototype supports self-monitoring.</div>
      </aside>
    </div>
  </div>;
}
