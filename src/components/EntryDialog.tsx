import { useId, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { entryForm, fieldUnit, type EntryKind, type Field, type Values } from '../config/entryForms';
import { labelFor, timeLabel } from '../config/presentation';
import { apiService, ApiError } from '../services/api';
import { useStore } from '../store/useStore';
import { DesignDialog } from './DesignDialog';

export function errorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'We could not confirm the record. Please try again.';
  if (error.status === 409) return 'This entry conflicts with a saved record.';
  if (error.status === 0 || error.status >= 500) return 'We could not confirm the record. Check your connection and try again.';
  if (error.status === 400 || error.status === 422) return 'Review the values and try again.';
  return 'The record could not be saved.';
}

function fieldError(error: ApiError | null, field: Field, fields: Field[]) {
  const matches = Object.entries(error?.fields ?? {}).some(([key]) => key === field.key || key.startsWith(field.key + '.') ||
    key.endsWith('.' + field.key) || (key === 'measurements' && field.key === 'blood_pressure_systolic') ||
    (key.startsWith('samples') && field.key.endsWith('Time')) ||
    (key.startsWith('records') && fields.indexOf(field) === Number(key.match(/\[(\d+)\]/)?.[1])) ||
    (key === 'pressure.value' && field.key === 'pressure') ||
    (key === 'value' && field.key === 'value') ||
    (key === 'unit' && fields.some(item => item.key === 'quantity') && field.label === 'Dose unit'));
  return matches ? 'Check the value and its relationship to the other entries.' : undefined;
}

function EntryField({ field, value, change, unit, error }: { field: Field; value: string; change: (value: string) => void; unit?: string; error?: string }) {
  const id = useId();
  const description = field.hint || error ? id+'-hint' : undefined;
  const common = { id, required: !field.optional, 'aria-describedby': description, 'aria-invalid': error ? true : undefined };
  if (field.type === 'checkbox') return <div className="form-check">
    <label htmlFor={id}><input {...common} type="checkbox" checked={value === 'true'} onChange={e => change(String(e.target.checked))} />{field.label}</label>
    {error && <small className="field-error" id={description}>{error}</small>}
  </div>;
  return <div className={`form-field ${field.type === 'textarea' ? 'full-field' : ''}`}>
    <label htmlFor={id}>{field.label}{unit && <span> ({unit})</span>}{field.optional && <span> · Optional</span>}</label>
    {field.type === 'select' ? <select {...common} value={value} onChange={e => change(e.target.value)}>{field.options?.map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select>
      : field.type === 'textarea' ? <textarea {...common} rows={3} maxLength={field.maxLength} value={value} onChange={e => change(e.target.value)} />
      : <input {...common} type={field.type} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength}
          value={value} onChange={e => change(e.target.value)} />}
    {description && <small id={description} className={error ? 'field-error' : ''}>{error ?? field.hint}</small>}
  </div>;
}

function SavedEntry({ kind, result }: { kind: EntryKind; result: any }) {
  const calculation = result.operation?.calculation;
  if (kind === 'report' && calculation) return <div className="saved-entry" role="status">
    <strong><CheckCircle2 size={19} /> Report prepared · Not sent</strong>
    <p>{timeLabel(calculation.preparedAt)} · Communication: {calculation.communication?.status ?? 'Unknown'}</p>
    <p>No message was sent to Earth.</p>
    <details className="disclosure"><summary>Review report</summary>
      <p>{calculation.indicators?.length ?? 0} measurements included.</p>
      {calculation.evaluations?.map((item: any, index: number) => <p key={index}><b>{labelFor(item.indicator)}</b> · {item.message}</p>)}
      {calculation.actions?.map((action: any, index: number) => <p key={index}>{action.description}</p>)}
      <button type="button" className="design-button" onClick={() => {
        const blob = new Blob([JSON.stringify(calculation, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'astrovida-report.json'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}>Download report</button>
    </details>
  </div>;
  return <div className="saved-entry" role="status"><strong><CheckCircle2 size={19} /> {kind === 'mission' ? 'Mission context saved' : 'Record saved'}</strong>
    {kind === 'vitals' && <p>NEWS2: {calculation?.score ?? 'Review the assessment in Gravity Fields'}.</p>}
    {kind === 'atmosphere' && typeof calculation?.partialCo2 === 'number' && <p>Carbon dioxide partial pressure: {calculation.partialCo2.toFixed(2)} mmHg.</p>}
    {kind === 'posture' && calculation?.differences?.map((item: any) => <p key={item.recordedAt}>Change from lying down: {item.systolicMmHg} mmHg systolic, {item.diastolicMmHg} mmHg diastolic, {item.heartRateBpm} bpm.</p>)}
  </div>;
}

export function EntryDialog({ kind, close }: { kind: EntryKind; close: () => void }) {
  const form = entryForm(kind);
  const { astronautId, dataset, triggerRefresh } = useStore();
  const [source, setSource] = useState<'simulated' | 'manual' | 'sensor'>(dataset === 'simulated' ? 'simulated' : 'manual');
  const [values, setValues] = useState<Values>(() => Object.fromEntries(form.fields.map(field => [field.key, field.initial ?? ''])));
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<any>(null);
  const [actionText, setActionText] = useState('');
  const [actions, setActions] = useState<{ description: string; recordedAt: string }[]>([]);
  const pending = useRef<(() => Promise<unknown>) | null>(null);
  const lock = useRef(false);
  const fields = form.fields.filter(field => !field.when || field.when(values));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || result) return;
    lock.current = true;
    setBusy(true); setError(null);
    try {
      if (!pending.current) {
        const recordedAt = new Date().toISOString();
        if (form.operation) {
          const input = kind === 'report' ? { actions: actionText.trim()
            ? [...actions, { description: actionText.trim(), recordedAt }] : actions } : form.input?.(values, recordedAt);
          const payload = { astronautId, source, id: crypto.randomUUID(), ...input };
          pending.current = () => apiService.saveOperation(form.area, form.operation!, payload);
        } else if (form.records) {
          const payload = form.records(values).map(record => ({ ...record, source, recordedAt }));
          pending.current = () => apiService.saveRecords(form.area, astronautId, payload);
        }
      }
      const saved = await pending.current?.();
      pending.current = null;
      setRetry(false); setResult(saved); triggerRefresh();
    } catch (err) {
      const uncertain = !!pending.current && err instanceof ApiError && (err.status === 0 || err.status >= 500);
      setError(err);
      setRetry(uncertain);
      if (!uncertain) pending.current = null;
    } finally { lock.current = false; setBusy(false); }
  }

  return <DesignDialog title={form.title} description={form.description} busy={busy} close={close}>
    {result ? <><SavedEntry kind={kind} result={result} /><div className="dialog-actions"><button className="design-button primary" onClick={close}>Done</button></div></> :
      <form onSubmit={submit}>
        {error != null && <p className="form-error" role="alert"><TriangleAlert size={18} />
          {retry && !form.operation ? 'Save could not be confirmed. Review the latest measurements before sending this record again.' :
            retry ? 'Save could not be confirmed. Retry this same submission.' : errorMessage(error)}</p>}
        <fieldset className="form-grid" disabled={busy || retry}>
          {dataset === 'real' && <label className="form-field">Record origin<select value={source} onChange={e => setSource(e.target.value === 'sensor' ? 'sensor' : 'manual')}><option value="manual">Crew entry</option><option value="sensor">Sensor</option></select></label>}
          {dataset === 'simulated' && <p className="form-context full-field">Saving to simulation records.</p>}
          {kind === 'report' && <div className="full-field">
            {actions.length > 0 && <ul className="source-list">{actions.map((action, index) => <li className="report-action" key={index}>
              <span>{action.description}</span><button className="design-button" type="button" onClick={() => setActions(current => current.filter((_,i) => i !== index))}>Remove action {index + 1}</button>
            </li>)}</ul>}
            <label>Action already taken (optional)<textarea rows={3} maxLength={500} value={actionText} onChange={event => setActionText(event.target.value)} disabled={actions.length >= 50} /></label>
            <button type="button" className="design-button" disabled={!actionText.trim() || actions.length >= 50} onClick={() => {
              setActions(current => [...current, { description: actionText.trim(), recordedAt: new Date().toISOString() }]); setActionText('');
            }}>Add another action</button>
          </div>}
          {fields.map(field => <EntryField key={field.key} field={field} value={values[field.key]} unit={fieldUnit(kind, field, values)}
            error={fieldError(error instanceof ApiError ? error : null, field, fields)}
            change={value => setValues(previous => ({ ...previous, [field.key]: value }))} />)}
        </fieldset>
        <div className="dialog-actions">
          <button type="button" className="design-button" onClick={close} disabled={busy}>Cancel</button>
          <button type="submit" className="design-button primary" disabled={busy || (retry && !form.operation)}>
            {busy ? 'Saving…' : retry ? 'Retry same submission' : form.button}</button>
        </div>
      </form>}
  </DesignDialog>;
}
