import { useRef, useState, type FormEvent } from 'react';
import { apiService, ApiError } from '../services/api';
import { useStore } from '../store/useStore';
import { DesignDialog } from './DesignDialog';
import { errorMessage } from './EntryDialog';

type Payload = Parameters<typeof apiService.saveSleepEpisode>[0];

export function SleepEntry({ close }: { close: () => void }) {
  const { astronautId, dataset, triggerRefresh } = useStore();
  const [source, setSource] = useState<Payload['source']>(dataset === 'simulated' ? 'simulated' : 'manual');
  const [retry, setRetry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hours, setHours] = useState<number>();
  const pending = useRef<Payload>();
  const locked = useRef(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || hours !== undefined) return;
    locked.current = true;
    setSaving(true); setError(null);
    try {
      const form = new FormData(event.currentTarget);
      const input = pending.current ?? {
        astronautId, source, episodeId: crypto.randomUUID(),
        bedAt: new Date(String(form.get('bedAt'))).toISOString(), wakeAt: new Date(String(form.get('wakeAt'))).toISOString(),
        sleepLatencyMinutes: Number(form.get('sleepLatencyMinutes')), awakeMinutes: Number(form.get('awakeMinutes')),
      };
      pending.current = input;
      const response = await apiService.saveSleepEpisode(input);
      pending.current = undefined; setRetry(false);
      setHours(response.operation.calculation.durationHours);
      triggerRefresh();
    } catch (err) {
      const uncertain = !!pending.current && err instanceof ApiError && (err.status === 0 || err.status >= 500);
      setRetry(uncertain);
      if (!uncertain) pending.current = undefined;
      setError(err);
    } finally { locked.current = false; setSaving(false); }
  }
  const fields = error instanceof ApiError ? error.fields : null;
  return <DesignDialog title="Record sleep" description="Enter local times from the same sleep period. AstroVida calculates the time you spent asleep." close={close} busy={saving}>
    {hours !== undefined ? <><p className="saved-entry" role="status">Sleep saved · {hours} hours asleep</p>
      <div className="dialog-actions"><button className="design-button primary" onClick={close}>Done</button></div></> :
      <form onSubmit={save}>
        {error != null && <p className="form-error" role="alert">{retry ? 'Save could not be confirmed. Retry this same sleep entry.' : errorMessage(error)}</p>}
        <fieldset className="form-grid" disabled={saving || retry}>
          {dataset === 'real' && <label>Record origin<select value={source} onChange={e => setSource(e.target.value === 'sensor' ? 'sensor' : 'manual')}><option value="manual">Crew entry</option><option value="sensor">Sensor</option></select></label>}
          {dataset === 'simulated' && <p className="form-context full-field">Saving to simulation records.</p>}
          {([['bedAt','Bedtime','datetime-local'],['wakeAt','Wake time','datetime-local'],['sleepLatencyMinutes','Time to fall asleep (min)','number'],
            ['awakeMinutes','Time awake after falling asleep (min)','number']] as const).map(([key,label,type]) =>
            <label key={key}>{label}<input name={key} type={type} required min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined}
              aria-invalid={fields?.[key] ? true : undefined} aria-describedby={fields?.[key] ? `sleep-${key}-error` : undefined} />
              {fields?.[key] && <small className="field-error" id={`sleep-${key}-error`}>Check this value against the other times in the sleep period.</small>}
            </label>)}
        </fieldset>
        <div className="dialog-actions"><button type="submit" className="design-button primary" disabled={saving}>{saving ? 'Saving…' : retry ? 'Retry same entry' : 'Save sleep entry'}</button></div>
      </form>}
  </DesignDialog>;
}
