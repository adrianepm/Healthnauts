import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import { DesignDialog } from './DesignDialog';
import { errorMessage } from './EntryDialog';

interface PvtEvent {
  kind: 'response' | 'false_start' | 'timeout';
  atMs: number;
  rtMs?: number;
}

export const PvtSessionModal: React.FC = () => {
  const {
    isPvtModalOpen,
    setIsPvtModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
  } = useStore();

  type Phase = 'idle' | 'waiting' | 'stimulus' | 'feedback' | 'ready' | 'interrupted' | 'finished';
  type Session = { start: number; startedAt: string; id: string; events: PvtEvent[];
    astronautId: string; source: 'manual' | 'simulated'; stimulus: number; end: number; endedAt: string };
  const duration = 180000;
  const timeout = 30000;
  const [testState, setTestState] = useState<Phase>('idle');
  const phase = useRef<Phase>('idle');
  const transition = (next: Phase) => { phase.current = next; setTestState(next); };
  const session = useRef<Session | null>(null);
  const timer = useRef<number>();
  const [eventCount, setEventCount] = useState(0);
  const [lastRt, setLastRt] = useState<number | null>(null);
  const [interruptionReason, setInterruptionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const [serverResult, setServerResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function stopTimer() { window.clearTimeout(timer.current); }
  function schedule(run: Session, delay: number, callback: () => void) {
    stopTimer();
    timer.current = window.setTimeout(() => { if (session.current === run) callback(); }, delay);
  }
  function freeze(run: Session, next: 'ready' | 'interrupted', ended = performance.now()) {
    stopTimer();
    run.end = ended;
    run.endedAt = new Date().toISOString();
    transition(next);
  }
  function handleInterrupt(reason: string) {
    const run = session.current;
    if (!run || !['waiting', 'stimulus', 'feedback'].includes(phase.current)) return;
    setInterruptionReason(reason);
    freeze(run, 'interrupted');
  }

  useEffect(() => {
    if (!isPvtModalOpen) return;
    const onVisibility = () => {
      if (document.hidden) handleInterrupt('The test stopped when this tab became hidden.');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopTimer();
      session.current = null;
    };
  }, [isPvtModalOpen]);

  function waitForStimulus(run: Session, feedback = false) {
    const remaining = duration - (performance.now() - run.start);
    if (remaining <= 0) { freeze(run, 'ready'); return; }
    if (!feedback) transition('waiting');
    const delay = feedback ? 1000 : 1000 + Math.random() * 3000;
    schedule(run, Math.min(delay, remaining), () => {
      const now = performance.now();
      if (now - run.start >= duration) { freeze(run, 'ready', now); return; }
      if (feedback) { waitForStimulus(run); return; }
      run.stimulus = now;
      transition('stimulus');
      schedule(run, timeout, () => recordTimeout(run));
    });
  }

  function append(run: Session, event: PvtEvent) {
    if (event.atMs <= (run.events.at(-1)?.atMs ?? -1)) return;
    run.events.push(event);
    setEventCount(run.events.length);
  }
  function recordTimeout(run: Session) {
    const end = run.stimulus + timeout;
    append(run, { kind: 'timeout', atMs: end - run.start });
    if (end - run.start >= duration) freeze(run, 'ready', end);
    else waitForStimulus(run);
  }

  function handleStartSession() {
    stopTimer();
    const run: Session = { start: performance.now(), startedAt: new Date().toISOString(),
      id: crypto.randomUUID(), astronautId, source: dataset === 'simulated' ? 'simulated' : 'manual',
      events: [], stimulus: 0, end: 0, endedAt: '' };
    session.current = run;
    setEventCount(0); setLastRt(null); setError(null); setServerResult(null);
    waitForStimulus(run);
  }
  function handleBoxClick() {
    const run = session.current;
    if (!run || !['waiting', 'stimulus'].includes(phase.current)) return;
    const atMs = performance.now() - run.start;
    if (phase.current === 'waiting' && atMs >= duration) { freeze(run, 'ready'); return; }
    const rtMs = atMs - (run.stimulus - run.start);
    if (phase.current === 'stimulus' && rtMs >= timeout) { recordTimeout(run); return; }
    if (phase.current === 'waiting') {
      append(run, { kind: 'false_start', atMs }); setLastRt(0);
    } else {
      append(run, { kind: 'response', atMs, rtMs }); setLastRt(rtMs);
    }
    transition('feedback');
    waitForStimulus(run, true);
  }

  async function handleSubmitSession(completed: boolean) {
    const run = session.current;
    if (!run || inFlight.current || phase.current !== (completed ? 'ready' : 'interrupted')) return;
    const durationMs = run.end - run.start;
    if (completed && (durationMs < duration || !run.events.length)) return;
    inFlight.current = true; setSaving(true); setError(null);
    try {
      const result = await apiService.savePvtSession({ astronautId: run.astronautId, sessionId: run.id,
        source: run.source, startedAt: run.startedAt, endedAt: run.endedAt, durationMs,
        completed, events: run.events });
      if (session.current !== run) return;
      setServerResult(result);
      triggerRefresh();
      transition('finished');
    } catch (err) {
      if (session.current === run) setError(errorMessage(err));
    } finally { inFlight.current = false; setSaving(false); }
  }

  function close() {
    stopTimer();
    session.current = null;
    transition('idle');
    setError(null);
    setIsPvtModalOpen(false);
  }
  if (!isPvtModalOpen) return null;

  const active = ['waiting', 'stimulus', 'feedback'].includes(testState);
  const closeOrInterrupt = () => active ? handleInterrupt('You stopped this session.') : close();
  return <DesignDialog title="Reaction time test (PVT-B)" description="A three-minute test of sustained attention. Keep this tab visible." close={closeOrInterrupt} busy={saving}>
    {error && <p className="form-error" role="alert">{error}</p>}
    {testState === 'idle' && <>
      <ol className="test-instructions"><li>When the target says Respond now, press it or use Enter or Space.</li>
        <li>Wait for the signal before responding. The test records early, slow and missed responses.</li>
        <li>You can stop at any time and save the interruption without a score.</li></ol>
      <div className="dialog-actions"><button className="design-button primary" onClick={handleStartSession}>Start reaction test</button></div>
    </>}
    {active && <div className="pvt-test">
      <button autoFocus type="button" className={`reaction-target ${testState === 'stimulus' ? 'stimulus' : ''}`} onClick={handleBoxClick}>
        {testState === 'stimulus' ? 'Respond now' : testState === 'feedback' ? lastRt ? `${Math.round(lastRt)} ms` : 'Too early' : 'Wait for the signal'}</button>
      <p>{eventCount} responses or timeouts recorded</p>
      <button className="design-button" onClick={closeOrInterrupt}>Stop session</button>
    </div>}
    {(testState === 'ready' || testState === 'interrupted') && <>
      <p role="status">{testState === 'ready' ? 'Test complete. Save the session to see the results.' : interruptionReason}</p>
      <div className="dialog-actions"><button className="design-button primary" disabled={saving} onClick={() => handleSubmitSession(testState === 'ready')}>
        {saving ? 'Saving…' : testState === 'ready' ? 'Save test results' : 'Save interrupted session'}</button></div>
    </>}
    {testState === 'finished' && <><div className="saved-entry" role="status"><strong>{serverResult?.operation?.status === 'interrupted' ? 'Interrupted session saved' : 'Session saved'}</strong>
      {serverResult?.records?.length ? <dl className="compact-results">
        <div><dt>Reaction speed</dt><dd>{serverResult.records.find((r: {indicator:string}) => r.indicator === 'pvt_response_speed')?.value} 1/s</dd></div>
        <div><dt>Slow or missed responses</dt><dd>{serverResult.records.find((r: {indicator:string}) => r.indicator === 'pvt_lapses')?.value}</dd></div>
        <div><dt>Early responses</dt><dd>{serverResult.records.find((r: {indicator:string}) => r.indicator === 'pvt_false_starts')?.value}</dd></div>
      </dl> : <p>No results were calculated for this session.</p>}</div>
      <div className="dialog-actions"><button className="design-button primary" onClick={close}>Done</button></div></>}
  </DesignDialog>;
};
