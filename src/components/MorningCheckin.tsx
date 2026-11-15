// Check-in da manhã (~1 min), no modelo do Reaction Self Test da NASA (do protótipo), em etapas:
// Sleep → Sleepiness (KSS) → Fatigue (Samn-Perelli) → Mood and stress → Review. Um tópico por tela, Back/Next,
// e só o Review grava. Grava o episódio de sono em sleep-episodes (a API calcula a duração) e as escalas em records.
// KSS (1 a 9) e Samn-Perelli (1 a 7) são as mesmas escalas validadas de antes. Humor, estresse e qualidade do sono
// são respondidos de 1 a 10 e gravados na escala interna de 0 a 100 das regras (src/lib/scales.ts).
// O nível de cada resposta só aparece depois de salvar, vindo da API.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ClipboardCheck, Pencil, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { AREA } from '../config/api';
import { useStore, XP_PER_CHECKIN, dayKey } from '../store/useStore';
import { fmtHours } from '../lib/format';
import { KSS_LABELS, SP_LABELS } from '../lib/content';
import { TEN_LABELS, toStored } from '../lib/scales';
import { Modal } from './ui';
import { toast } from '../store/toast';
import { cn } from '../lib/utils';

/** "22:30" de ontem e "06:30" de hoje viram instantes com fuso. */
function toInstants(bed: string, wake: string) {
  const [bh, bm] = bed.split(':').map(Number); const [wh, wm] = wake.split(':').map(Number);
  const w = new Date(); w.setHours(wh, wm, 0, 0);
  if (w.getTime() > Date.now()) w.setDate(w.getDate() - 1);
  const b = new Date(w); b.setHours(bh, bm, 0, 0);
  if (b.getTime() >= w.getTime()) b.setDate(b.getDate() - 1);
  return { bedAt: b, wakeAt: w };
}

export const CHECKIN_STEPS = ['Sleep', 'Sleepiness', 'Fatigue', 'Mood and stress', 'Review'] as const;

export function MorningCheckin() {
  const open = useStore((s) => s.checkinOpen); const setOpen = useStore((s) => s.setCheckinOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Morning check-in" sub="About 1 minute · based on NASA's ISS Reaction Self Test" icon={<ClipboardCheck size={18} />} wide>
      <CheckinWizard onSaved={() => setOpen(false)} />
    </Modal>
  );
}

/** Escala de 1 a 10 com o número visível em cada botão e os rótulos das pontas. Setas mudam a escolha. */
function TenScale({ label, value, onChange, ends }: { label: string; value: number; onChange: (v: number) => void; ends: [string, string] }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-100">{label}</legend>
      <div role="radiogroup" aria-label={`${label}, 1 (${ends[0]}) to 10 (${ends[1]})`} className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mt-2"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(10, value + 1)); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(1, value - 1)); }
        }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
          <button key={v} type="button" role="radio" aria-checked={v === value} tabIndex={v === value ? 0 : -1} onClick={() => onChange(v)}
            aria-label={`${v}${v === 1 ? `, ${ends[0]}` : v === 10 ? `, ${ends[1]}` : ''}`}
            className={cn('h-11 rounded-md border font-mono text-sm font-semibold transition-colors',
              v === value ? 'text-slate-50 border-brand bg-brand/20' : 'text-slate-300 border-space-line hover:border-space-strong')}>{v}</button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-300 mt-1.5" aria-hidden="true"><span>1 · {ends[0]}</span><span>{ends[1]} · 10</span></div>
    </fieldset>
  );
}

function CheckinWizard({ onSaved }: { onSaved: () => void }) {
  const { refresh, addXp, ui } = useStore();
  const done = ui.checkins.includes(dayKey());
  const [step, setStep] = useState(0);
  const [bed, setBed] = useState('22:30'); const [wake, setWake] = useState('06:30');
  const [lat, setLat] = useState(15); const [awake, setAwake] = useState(10);
  const [q, setQ] = useState(7); const [kss, setKss] = useState(3); const [sp, setSp] = useState(3);
  const [stress, setStress] = useState(3); const [mood, setMood] = useState(7);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const body = useRef<HTMLDivElement>(null);
  // Ao trocar de etapa, o foco vai para o título da etapa (leitor de tela e teclado).
  useEffect(() => { body.current?.querySelector<HTMLElement>('h3')?.focus(); }, [step]);

  const { bedAt, wakeAt } = toInstants(bed, wake);
  // Só uma prévia de leitura; a duração gravada é a que a API calcula.
  const preview = Math.max(0, (wakeAt.getTime() - bedAt.getTime()) / 3600000 - (lat + awake) / 60);
  const last = CHECKIN_STEPS.length - 1;

  const save = async () => {
    setBusy(true); setError(null);
    try {
      await api.sleepEpisode({ bedAt: bedAt.toISOString(), wakeAt: wakeAt.toISOString(), sleepLatencyMinutes: lat, awakeMinutes: awake });
      const recordedAt = new Date().toISOString();
      await api.records(AREA.isolation, [
        { indicator: 'sleep_quality', value: toStored(q), unit: null, recordedAt },
        { indicator: 'sleepiness_kss', value: kss, unit: null, recordedAt },
        { indicator: 'fatigue_samn_perelli', value: sp, unit: null, recordedAt },
        { indicator: 'stress', value: toStored(stress), unit: null, recordedAt },
        { indicator: 'mood_score', value: toStored(mood), unit: null, recordedAt },
      ]);
      if (!done) addXp(XP_PER_CHECKIN, true);
      await refresh(); onSaved(); toast.success('Morning check-in saved');
    } catch (e: any) { setError(e?.message ?? 'Could not save.'); toast.error(e); } finally { setBusy(false); }
  };

  const title = (text: string, hint?: ReactNode) => (<>
    <h3 tabIndex={-1} className="text-lg font-semibold text-slate-50 outline-none">{text}</h3>
    {hint && <p className="text-sm text-slate-300 mt-0.5">{hint}</p>}
  </>);

  const review: { step: number; label: string; value: string }[] = [
    { step: 0, label: 'Time asleep', value: `${fmtHours(preview)} (bed ${bed}, up ${wake})` },
    { step: 0, label: 'Sleep quality', value: `${q} of 10` },
    { step: 1, label: 'Sleepiness (KSS)', value: `${kss} · ${KSS_LABELS[kss - 1]}` },
    { step: 2, label: 'Fatigue (Samn-Perelli)', value: `${sp} · ${SP_LABELS[sp - 1]}` },
    { step: 3, label: 'Mood', value: `${mood} of 10` },
    { step: 3, label: 'Stress', value: `${stress} of 10` },
  ];

  return (
    <div>
      {/* Progresso */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
        <span>Step <span className="font-mono text-slate-100">{step + 1}</span> of <span className="font-mono">{CHECKIN_STEPS.length}</span> · {CHECKIN_STEPS[step]}</span>
      </div>
      <div className="mt-1.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${CHECKIN_STEPS.length}, minmax(0, 1fr))` }}
        role="progressbar" aria-label="Check-in progress" aria-valuemin={1} aria-valuemax={CHECKIN_STEPS.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${CHECKIN_STEPS.length}: ${CHECKIN_STEPS[step]}`}>
        {CHECKIN_STEPS.map((s, i) => <span key={s} className={cn('h-1 rounded-full', i <= step ? 'bg-brand' : 'bg-space-card2')} />)}
      </div>

      <div ref={body} className="mt-5 min-h-[17rem]">
        {step === 0 && (<>
          {title('Sleep', 'Your last sleep period.')}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <label className="text-xs text-slate-300">Went to bed<input className="field mt-1" type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></label>
            <label className="text-xs text-slate-300">Got up<input className="field mt-1" type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></label>
            <label className="text-xs text-slate-300">Min. to fall asleep<input className="field mt-1" type="number" min={0} value={lat} onChange={(e) => setLat(Math.max(0, +e.target.value))} /></label>
            <label className="text-xs text-slate-300">Min. awake at night<input className="field mt-1" type="number" min={0} value={awake} onChange={(e) => setAwake(Math.max(0, +e.target.value))} /></label>
          </div>
          <p className="mt-2 text-sm text-slate-300">Time asleep: <b className="text-slate-50 font-mono">{fmtHours(preview)}</b> <span className="text-xs">(NASA plan: 8h30)</span></p>
          <div className="mt-4"><TenScale label="How well did you sleep?" value={q} onChange={setQ} ends={TEN_LABELS.sleep_quality} /></div>
        </>)}

        {step === 1 && (<>
          {title('Sleepiness', <>How sleepy do you feel right now? <span className="text-xs">(1-9, KSS reference, own labels)</span></>)}
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 mt-3" role="radiogroup" aria-label="Sleepiness, 1 to 9">
            {KSS_LABELS.map((label, i) => {
              const v = i + 1; const sel = v === kss;
              return <button key={v} type="button" role="radio" aria-checked={sel} title={label} aria-label={`${v}, ${label}`} onClick={() => setKss(v)}
                className={cn('h-11 rounded-md border font-mono text-sm font-semibold transition-colors', sel ? 'text-slate-50 border-brand bg-brand/20' : 'text-slate-300 border-space-line hover:border-space-strong')}>{v}</button>;
            })}
          </div>
          <p className="text-sm text-slate-100 mt-3"><span className="font-mono">{kss}</span> · {KSS_LABELS[kss - 1]}</p>
        </>)}

        {step === 2 && (<>
          {title('Fatigue', <>Which statement best describes how you feel right now? <span className="text-xs">(Samn-Perelli, 1-7)</span></>)}
          <div className="mt-3 space-y-1.5" role="radiogroup" aria-label="Fatigue, Samn-Perelli 1 to 7">
            {SP_LABELS.map((o, i) => {
              const v = i + 1; const sel = v === sp;
              return (
                <button key={v} type="button" role="radio" aria-checked={sel} onClick={() => setSp(v)}
                  className={cn('w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors', sel ? 'border-brand bg-brand/15 text-slate-50' : 'border-space-line text-slate-200 hover:border-space-strong')}>
                  <span className="font-mono w-4 text-slate-300">{v}</span>{o}
                </button>
              );
            })}
          </div>
        </>)}

        {step === 3 && (<>
          {title('Mood and stress', 'Compared with your own usual range, not with a fixed cut-off.')}
          <div className="mt-3 space-y-5">
            <TenScale label="How is your mood?" value={mood} onChange={setMood} ends={TEN_LABELS.mood_score} />
            <TenScale label="How stressed do you feel?" value={stress} onChange={setStress} ends={TEN_LABELS.stress} />
          </div>
          <p className="text-xs text-slate-300 mt-3">Prototype scales, not validated instruments. Visible only to you and your Crew Medical Officer.</p>
        </>)}

        {step === last && (<>
          {title('Review', 'Check your answers, then save.')}
          <dl className="mt-3 divide-y divide-space-line rounded-md border border-space-line">
            {review.map((r) => (
              <div key={r.label} className="flex items-center gap-3 px-3 py-2">
                <dt className="w-40 shrink-0 text-xs text-slate-300">{r.label}</dt>
                <dd className="flex-1 min-w-0 text-sm text-slate-50">{r.value}</dd>
                <button type="button" onClick={() => setStep(r.step)} className="text-slate-300 hover:text-slate-50 !min-h-0 h-9 w-9 grid place-items-center rounded-md" aria-label={`Edit ${r.label}`}><Pencil size={14} aria-hidden="true" /></button>
              </div>
            ))}
          </dl>
          {error && <p className="text-sm text-slate-50 mt-2" role="alert">{error}</p>}
        </>)}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-space-line">
        <span className="text-xs text-slate-300 inline-flex items-center gap-1"><Sparkles size={12} aria-hidden="true" />{done ? 'Check-in already saved today' : `+${XP_PER_CHECKIN} XP for completing it, whatever your answers`}</span>
        <div className="flex gap-2 ml-auto">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost"><ArrowLeft size={14} aria-hidden="true" />Back</button>}
          {step < last
            ? <button type="button" onClick={() => setStep(step + 1)} className="btn-primary">Next<ArrowRight size={14} aria-hidden="true" /></button>
            : <button type="button" onClick={save} disabled={busy} className="btn-primary">{busy ? 'Saving…' : done ? 'Save new check-in' : 'Save check-in'}</button>}
        </div>
      </footer>
    </div>
  );
}
