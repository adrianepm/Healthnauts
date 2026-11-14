import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { SUPPORT_TOOLS } from '../mock/sono';
import { Wind, Mic, Heart, MessageSquare, Headphones, ChevronRight, CheckCircle2, Play, Square } from 'lucide-react';

export const SupportToolList: React.FC = () => {
  const { setIsBreathingModalOpen, addXP } = useStore();
  const [activeVoiceModal, setActiveVoiceModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  const [activeMediaModal, setActiveMediaModal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleToolClick = (toolId: string) => {
    if (toolId === 'tool-breathing') {
      setIsBreathingModalOpen(true);
    } else if (toolId === 'tool-voice-diary') {
      setActiveVoiceModal(true);
      setVoiceSaved(false);
    } else if (toolId === 'tool-meditation') {
      setActiveMediaModal(true);
    } else {
      // General feedback
      alert('Canal aberto: Solicitação agendada para o próximo pacote de sincronização.');
      addXP(10);
    }
  };

  const renderIcon = (id: string) => {
    switch (id) {
      case 'tool-breathing':
        return <Wind size={18} className="text-sky-400" />;
      case 'tool-voice-diary':
        return <Mic size={18} className="text-amber-400" />;
      case 'tool-family-call':
        return <Heart size={18} className="text-rose-400" />;
      case 'tool-psych-message':
        return <MessageSquare size={18} className="text-purple-400" />;
      case 'tool-meditation':
      default:
        return <Headphones size={18} className="text-emerald-400" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Ferramentas de Suporte Emocional & Relaxamento
          </h3>
          <p className="text-[11px] text-space-400">
            Ações de autorregulação psicológica
          </p>
        </div>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
          5 FERRAMENTAS
        </span>
      </div>

      <div className="space-y-2">
        {SUPPORT_TOOLS.map((tool) => (
          <div
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className="p-3 rounded-xl bg-space-900/80 border border-space-700/60 hover:border-space-600 hover:bg-space-800/80 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-space-800 border border-space-700 group-hover:border-space-600 transition-colors">
                {renderIcon(tool.id)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-astro-cyan transition-colors">
                  {tool.title}
                </h4>
                <p className="text-[11px] text-space-400">{tool.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded">
                {tool.duration}
              </span>
              <ChevronRight
                size={16}
                className="text-space-500 group-hover:text-astro-cyan group-hover:translate-x-1 transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Voice Diary Mini Drawer / Modal */}
      {activeVoiceModal && (
        <div className="mt-4 p-4 rounded-xl bg-space-900 border border-space-700 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Mic size={14} className="text-amber-400" /> Diário de Voz Criptografado Local
            </span>
            <button
              onClick={() => setActiveVoiceModal(false)}
              className="text-space-400 hover:text-white"
            >
              Fechar
            </button>
          </div>

          <p className="text-space-300 text-[11px] mb-3">
            O áudio é processado e transcrito localmente na CPU da nave. Nenhum dado é compartilhado sem seu consentimento expresso.
          </p>

          <div className="flex items-center justify-between pt-1">
            {isRecording ? (
              <div className="flex items-center gap-2 text-rose-400 animate-pulse font-mono font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Gravando... 00:24</span>
              </div>
            ) : voiceSaved ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} /> Gravado e criptografado (+20 XP)
              </span>
            ) : (
              <span className="text-space-400">Pronto para gravar</span>
            )}

            <button
              onClick={() => {
                if (isRecording) {
                  setIsRecording(false);
                  setVoiceSaved(true);
                  addXP(20);
                } else {
                  setIsRecording(true);
                  setVoiceSaved(false);
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-space-950'
              }`}
            >
              {isRecording ? <Square size={12} /> : <Mic size={12} />}
              <span>{isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Meditation Ambient Player Modal */}
      {activeMediaModal && (
        <div className="mt-4 p-4 rounded-xl bg-space-900 border border-space-700 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Headphones size={14} className="text-emerald-400" /> Paisagem Sonora Terrestre
            </span>
            <button
              onClick={() => setActiveMediaModal(false)}
              className="text-space-400 hover:text-white"
            >
              Fechar
            </button>
          </div>

          <p className="text-space-300 text-[11px] mb-3">
            Simulador neuroacústico: Som de chuva na floresta amazônica com ondas alfa (10 Hz) para descompressão.
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-space-400">Floresta_Chuva_10Hz.wav</span>
            <button
              onClick={() => {
                setIsPlayingAudio(!isPlayingAudio);
                if (!isPlayingAudio) addXP(15);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              {isPlayingAudio ? <Square size={12} /> : <Play size={12} />}
              <span>{isPlayingAudio ? 'Pausar Áudio' : 'Ouvir Paisagem Sonora'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
