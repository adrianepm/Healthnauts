import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { Zap, X, CheckCircle2, AlertTriangle, RefreshCw, Play, Square, Eye, ShieldAlert } from 'lucide-react';

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
    addXP,
  } = useStore();

  const [testState, setTestState] = useState<'idle' | 'waiting' | 'stimulus' | 'feedback' | 'interrupted' | 'finished'>('idle');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionStartIso, setSessionStartIso] = useState<string>('');
  const [events, setEvents] = useState<PvtEvent[]>([]);
  const [lastRt, setLastRt] = useState<number | null>(null);
  const [stimulusTimestamp, setStimulusTimestamp] = useState<number | null>(null);
  const [interruptionReason, setInterruptionReason] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [serverResult, setServerResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor visibility loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && (testState === 'waiting' || testState === 'stimulus' || testState === 'feedback')) {
        handleInterrupt('Perda de foco visual da tela (janela minimizada ou aba alterada)');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [testState]);

  if (!isPvtModalOpen) return null;

  const startNextTrial = () => {
    setTestState('waiting');
    setLastRt(null);
    setStimulusTimestamp(null);

    // Random ISI (inter-stimulus interval) between 2000ms and 5000ms
    const randomDelay = Math.floor(Math.random() * 3000) + 2000;
    timerRef.current = setTimeout(() => {
      const nowMs = performance.now();
      setStimulusTimestamp(nowMs);
      setTestState('stimulus');

      // 30s timeout per stimulus
      timeoutRef.current = setTimeout(() => {
        const timeoutMs = performance.now();
        const elapsed = Math.round(timeoutMs - (sessionStartTime || timeoutMs));
        setEvents((prev) => [...prev, { kind: 'timeout', atMs: elapsed }]);
        startNextTrial();
      }, 30000);
    }, randomDelay);
  };

  const handleStartSession = () => {
    const startPerf = performance.now();
    setSessionStartTime(startPerf);
    setSessionStartIso(new Date().toISOString());
    setEvents([]);
    setServerResult(null);
    setError(null);
    setInterruptionReason(null);
    startNextTrial();
  };

  const handleBoxClick = () => {
    const clickTime = performance.now();
    const elapsedSession = Math.round(clickTime - (sessionStartTime || clickTime));

    if (testState === 'waiting') {
      // Clicked before stimulus -> false start
      if (timerRef.current) clearTimeout(timerRef.current);
      const newEvent: PvtEvent = { kind: 'false_start', atMs: elapsedSession };
      setEvents((prev) => [...prev, newEvent]);
      setLastRt(0);
      setTestState('feedback');
      setTimeout(() => startNextTrial(), 1200);
    } else if (testState === 'stimulus') {
      // Clicked on stimulus
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const rt = Math.round(clickTime - (stimulusTimestamp || clickTime));
      const kind = rt < 100 ? 'false_start' : 'response';
      const newEvent: PvtEvent = { kind, atMs: elapsedSession, ...(kind === 'response' ? { rtMs: rt } : {}) };
      setEvents((prev) => [...prev, newEvent]);
      setLastRt(rt);
      setTestState('feedback');
      setTimeout(() => startNextTrial(), 1200);
    }
  };

  const handleInterrupt = (reason: string = 'Interrupção voluntária do usuário') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setInterruptionReason(reason);
    setTestState('interrupted');
  };

  const handleSubmitSession = async (completed: boolean) => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const nowPerf = performance.now();
    const durationMs = sessionStartTime
      ? Math.max(completed ? 180000 : 1000, Math.round(nowPerf - sessionStartTime))
      : 180000;
    const endedAt = new Date().toISOString();
    const sessionId = `pvt-${Date.now()}`;

    // Ensure strictly chronological events
    const sanitizedEvents = [...events].sort((a, b) => a.atMs - b.atMs);

    const payload = {
      astronautId,
      sessionId,
      source: (dataset === 'simulated' ? 'simulated' : 'manual') as 'manual' | 'sensor' | 'simulated',
      startedAt: sessionStartIso || new Date(Date.now() - durationMs).toISOString(),
      endedAt,
      durationMs,
      completed,
      events: sanitizedEvents.length ? sanitizedEvents : [{ kind: 'timeout' as const, atMs: Math.min(durationMs, 29999) }],
    };

    try {
      const res = await apiService.savePvtSession(payload);
      setServerResult(res);
      if (completed) {
        addXP(40);
      }
      triggerRefresh();
      setTestState('finished');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || 'Erro ao enviar sessão PVT-B.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-space-700/60 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Zap size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Teste Psicomotor de Vigilância (PVT-B Oficial)
                </h3>
                <p className="text-xs text-space-300">
                  Protocolo de 3 min com medição de precisão em milissegundos via performance.now()
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (testState === 'waiting' || testState === 'stimulus') {
                  handleInterrupt('Teste cancelado');
                } else {
                  setIsPvtModalOpen(false);
                }
              }}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Test area */}
          {testState === 'idle' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-space-900 border border-space-750 space-y-2">
                <span className="font-bold text-astro-cyan uppercase tracking-wider block">
                  Instruções do Protocolo Basner et al. (PVT-B):
                </span>
                <ul className="list-disc pl-5 space-y-1.5 text-space-200">
                  <li>Mantenha o olhar fixo no centro do visor visual.</li>
                  <li>Assim que o estímulo vermelho/contador aparecer, <strong>clique o mais rápido possível</strong>.</li>
                  <li>Evite clicar antes do estímulo (falso início &lt; 100 ms será registrado e penalizado).</li>
                  <li>Respostas &ge; 355 ms ou timeouts serão computadas pelo servidor como lapsos de atenção.</li>
                  <li>Se mudar de aba ou minimizar a tela, a sessão será automaticamente interrompida por perda de visibilidade.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPvtModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleStartSession}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-space-950 font-bold text-xs shadow-lg transition-all"
                >
                  <Play size={14} className="fill-space-950" />
                  <span>Iniciar Sessão PVT-B</span>
                </button>
              </div>
            </div>
          )}

          {(testState === 'waiting' || testState === 'stimulus' || testState === 'feedback') && (
            <div className="space-y-4">
              <div
                onClick={handleBoxClick}
                className={`w-full aspect-video rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none border-2 transition-all duration-100 ${
                  testState === 'stimulus'
                    ? 'bg-rose-600 border-white shadow-[0_0_30px_#f43f5e]'
                    : testState === 'feedback'
                    ? lastRt === 0 || (lastRt !== null && lastRt < 100)
                      ? 'bg-amber-900/60 border-amber-500'
                      : 'bg-emerald-900/60 border-emerald-500'
                    : 'bg-space-950 border-space-700 hover:border-space-600'
                }`}
              >
                {testState === 'waiting' && (
                  <div className="text-center text-space-400 font-mono text-sm animate-pulse">
                    Aguarde o estímulo visual...
                  </div>
                )}

                {testState === 'stimulus' && (
                  <div className="text-center">
                    <span className="text-4xl font-black font-mono text-white tracking-widest animate-bounce">
                      CLIQUE AGORA!
                    </span>
                  </div>
                )}

                {testState === 'feedback' && (
                  <div className="text-center font-mono">
                    {lastRt === 0 || (lastRt !== null && lastRt < 100) ? (
                      <span className="text-xl font-bold text-amber-400">Falso Início! (&lt; 100ms)</span>
                    ) : (
                      <span className="text-3xl font-black text-emerald-400">{lastRt} ms</span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress and controls */}
              <div className="flex items-center justify-between text-xs text-space-400 font-mono">
                <span>Eventos registrados: {events.length}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInterrupt('Interrupção voluntária')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-space-800 text-rose-400 hover:bg-space-750 text-[11px]"
                  >
                    <Square size={12} /> Interromper
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitSession(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                  >
                    <CheckCircle2 size={12} /> Concluir Sessão (3 min)
                  </button>
                </div>
              </div>
            </div>
          )}

          {testState === 'interrupted' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldAlert size={18} />
                <span>Sessão Interrompida — Não Concluída</span>
              </div>
              <p className="text-space-300">
                Motivo: <strong>{interruptionReason}</strong>. Conforme o protocolo científico, sessões interrompidas são auditadas pelo servidor sem gerar escores agregados para não contaminar a baseline de prontidão.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPvtModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmitSession(false)}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg disabled:opacity-50"
                >
                  {saving ? 'Auditando...' : 'Auditar Interrupção no Servidor'}
                </button>
              </div>
            </div>
          )}

          {testState === 'finished' && serverResult && (
            <div className="p-4 rounded-xl bg-space-900 border border-space-700 text-xs space-y-3">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={16} /> Resultado Processado pelo Servidor
                </span>
                <span className="text-[10px] font-mono text-space-400">
                  Status: {serverResult.operation?.status}
                </span>
              </div>

              {serverResult.operation?.status === 'interrupted' ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  Sessão auditada com status <strong>interrupted</strong> sem indicadores gerados.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-space-800">
                  <div className="p-2.5 rounded-lg bg-space-800 text-center">
                    <span className="text-[10px] text-space-400 block font-mono">VELOCIDADE MÉDIA</span>
                    <span className="text-lg font-bold font-mono text-white">
                      {serverResult.operation?.calculation?.responseSpeed ?? '—'} <span className="text-xs">1/s</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-space-800 text-center">
                    <span className="text-[10px] text-space-400 block font-mono">LAPSOS (&ge;355ms)</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {serverResult.operation?.calculation?.lapses ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-space-800 text-center">
                    <span className="text-[10px] text-space-400 block font-mono">FALSOS INÍCIOS</span>
                    <span className="text-lg font-bold font-mono text-rose-400">
                      {serverResult.operation?.calculation?.falseStarts ?? 0}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPvtModalOpen(false);
                    setTestState('idle');
                  }}
                  className="px-5 py-2 text-xs font-bold bg-astro-cyan text-space-950 rounded-xl hover:bg-sky-400"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
