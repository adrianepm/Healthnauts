import React from 'react';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { MessageSquare, Clock, CheckCircle2, FileEdit, Plus, Paperclip, ChevronRight } from 'lucide-react';

export const FlightSurgeonQueue: React.FC = () => {
  const { surgeonQueue, setIsSurgeonModalOpen, openMetricDetailModal } = useStore();

  const handleOpenCaseDetail = (c: typeof surgeonQueue[0]) => {
    openMetricDetailModal({
      title: c.subject,
      subtitle: `Status: ${c.status.toUpperCase()} · ${c.lastUpdate}`,
      value: c.status === 'answered' ? 'Respondido' : c.status === 'waiting' ? 'Em trânsito' : 'Rascunho',
      level: c.priority,
      whyMeasure: `Dados Anexados: ${c.attachedData || 'Sem dados anexados'}`,
      whatToDo: c.reply
        ? `Mensagem do Cirurgião de Voo:\n${c.reply}`
        : 'Aguardando sincronização de pacote no próximo passe da antena de alto ganho (HGA). Siga o protocolo de suporte autônomo.',
    });
  };

  const renderStatusBadge = (status: string, waitingTime?: string) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
            <Clock size={11} className="animate-spin-slow" />
            <span>{waitingTime || 'Aguardando 16 min'}</span>
          </span>
        );
      case 'answered':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
            <CheckCircle2 size={11} />
            <span>Resposta recebida</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-500/15 px-2 py-0.5 rounded border border-slate-500/30">
            <FileEdit size={11} />
            <span>Rascunho local</span>
          </span>
        );
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Fila Assíncrona do Cirurgião de Voo
            </h3>
            <p className="text-[11px] text-space-400">
              Casos clínicos em trânsito com a Terra
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSurgeonModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800 hover:bg-space-700 text-astro-cyan text-xs font-bold border border-astro-cyan/30 transition-all hover:shadow-glow-cyan"
        >
          <Plus size={14} />
          <span>Nova mensagem</span>
        </button>
      </div>

      <div className="space-y-3">
        {surgeonQueue.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenCaseDetail(item)}
            className="p-3.5 rounded-xl bg-space-900/90 border border-space-750 hover:border-space-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-xs text-white group-hover:text-astro-cyan transition-colors truncate">
                {item.subject}
              </span>
              {renderStatusBadge(item.status, item.waitingTime)}
            </div>

            <p className="text-[11px] text-space-300 mb-2 leading-relaxed line-clamp-2">
              {item.summary}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-space-800 text-[10px] text-space-400">
              <span className="flex items-center gap-1 font-mono">
                <Paperclip size={11} className="text-space-500" />
                <span className="truncate max-w-[180px]">{item.attachedData || 'Sem anexo'}</span>
              </span>
              <span className="font-mono text-space-500">{item.lastUpdate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
