import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { areas, timeLabel } from '../config/presentation';
import { apiService, ApiError, type ApiScenarioItem } from '../services/api';
import { useStore } from '../store/useStore';
import { DesignDialog } from './DesignDialog';
import { errorMessage } from './EntryDialog';

export function ScenarioPicker({ close }: { close: () => void }) {
  const { astronautId, setDataset, triggerRefresh } = useStore();
  const [items, setItems] = useState<ApiScenarioItem[]>();
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ reportId?: string; path?: string }>();
  const [report, setReport] = useState<{ preparedAt: string; deliveryStatus: string; communication?: { status: string } }>();
  const pending = useRef<string>();
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    apiService.getScenarios(controller.signal).then(response => {
      setItems(response.scenarios); setSelected(response.scenarios[0]?.id ?? '');
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  async function run() {
    if (lock.current || !selected || result) return;
    lock.current = true; setBusy(true); setError('');
    try {
      pending.current ??= crypto.randomUUID();
      const response = await apiService.runScenario(selected, astronautId, pending.current);
      const area = items?.find(item => item.id === selected)?.areaId;
      setResult({ reportId: response.operation?.calculation?.reportId, path: areas.find(item => item.id === area)?.path });
      pending.current = undefined;
      setDataset('simulated'); triggerRefresh();
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.status > 0 && err.status < 500) pending.current = undefined;
    } finally { lock.current = false; setBusy(false); }
  }
  return <DesignDialog title="Demonstration scenarios" description="Run a scenario to add fictional records and see how the dashboard responds." close={close} busy={busy}>
    {failed && <p className="form-error" role="alert">The scenario list is unavailable. Close and try again.</p>}
    {!failed && !items && <p role="status">Loading scenarios…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {result ? <div className="saved-entry" role="status">Scenario added to simulation records.{result.reportId && <>
        <p>Report prepared · Not sent.</p>
        {!report && <button className="design-button" type="button" disabled={busy} onClick={async () => {
          setBusy(true); setError('');
          try {
            const response = await apiService.getOperation('distance_from_earth','report',result.reportId!,astronautId,'simulated');
            setReport(response.operation.calculation);
          } catch { setError('The prepared report could not be opened. Try again.'); }
          finally { setBusy(false); }
        }}>{busy ? 'Opening…' : 'View prepared report'}</button>}
        {report && <p>{timeLabel(report.preparedAt)} · Communication: {report.communication?.status ?? 'Unknown'}</p>}
      </>}
      {result.path && <Link className="design-button primary" to={result.path} onClick={close}>Open affected area</Link>}</div> :
      items && <form onSubmit={event => { event.preventDefault(); void run(); }}>
        <label>Scenario<select value={selected} disabled={busy || !!pending.current} onChange={e => setSelected(e.target.value)}>
          {items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></label>
        <div className="dialog-actions"><button className="design-button primary" disabled={busy || !selected}>{busy ? 'Running…' : pending.current ? 'Retry same scenario' : 'Run scenario'}</button></div>
      </form>}
  </DesignDialog>;
}
