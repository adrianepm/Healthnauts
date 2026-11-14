import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { X, Send, Paperclip, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { StatusLevel } from '../types';

export const NewSurgeonMessageModal: React.FC = () => {
  const {
    isSurgeonModalOpen,
    setIsSurgeonModalOpen,
    addSurgeonCase,
    vitalSigns,
    earthDelayMinutes,
  } = useStore();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<StatusLevel>('yellow');
  const [attachVitals, setAttachVitals] = useState(true);

  if (!isSurgeonModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    addSurgeonCase({
      subject,
      summary: description || 'Sem observações adicionais relatadas pela tripulação.',
      status: 'waiting',
      priority,
      waitingTime: 'Aguardando pacote de transmissão',
      attachedData: attachVitals
        ? `Telemetria_Completa_Dia187.dat (PA, FC, Glicemia, CO2, Dose Radiação)`
        : 'Sem anexos biométricos',
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-space-700/60 bg-space-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Contatar Cirurgião de Voo
                </h3>
                <p className="text-xs text-space-300">
                  Canal médico criptografado (Atraso de transmissão: {earthDelayMinutes} min)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSurgeonModalOpen(false)}
              className="p-2 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-space-300 uppercase mb-1">
                Assunto / Sintoma Principal
              </label>
              <input
                type="text"
                required
                placeholder="Ex.: Cefaleia pulsátil occipital pós-atividade no módulo C"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-space-900 border border-space-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-space-500 focus:outline-none focus:border-astro-cyan"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-space-300 uppercase mb-1">
                  Nível de Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as StatusLevel)}
                  className="w-full bg-space-900 border border-space-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-astro-cyan"
                >
                  <option value="green">Baixa (Rotina / Dúvida clínica)</option>
                  <option value="yellow">Média (Sintoma moderado / Alteração)</option>
                  <option value="red">Crítica (Emergência médica a bordo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-space-300 uppercase mb-1">
                  Janela de Resposta Est.
                </label>
                <div className="bg-space-900/60 border border-space-800 rounded-xl px-3 py-2 text-xs font-mono text-space-300 flex items-center justify-between">
                  <span>Ida e volta</span>
                  <span className="font-bold text-astro-cyan">~16 min 28 s</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-space-300 uppercase mb-1">
                Descrição do Quadro Clínico
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes de início, duração, fatores de piora ou alívio, medicação utilizada..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-space-900 border border-space-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-space-500 focus:outline-none focus:border-astro-cyan resize-none"
              />
            </div>

            {/* Auto Attachment Box */}
            <div className="p-3 rounded-xl bg-space-900/90 border border-space-700/80">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachVitals}
                  onChange={(e) => setAttachVitals(e.target.checked)}
                  className="accent-astro-cyan rounded"
                />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Cpu size={14} className="text-astro-cyan" />
                    Anexar telemetria fisiológica e ambiente em tempo real
                  </span>
                  <p className="text-[11px] text-space-400 mt-0.5">
                    Inclui traçado de ECG recente, pressão arterial ({vitalSigns.find(v => v.id === 'bp')?.value} mmHg) e sensor de CO2.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-space-700/60">
              <span className="text-xs text-space-400">
                +25 XP de responsabilidade médica
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSurgeonModalOpen(false)}
                  className="px-4 py-2 text-xs text-space-300 hover:text-white rounded-lg hover:bg-space-700/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-glow-red transition-all"
                >
                  <Send size={14} />
                  <span>Transmitir para Terra</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
