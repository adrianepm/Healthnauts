import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Smile, Meh, Frown, Laugh, Heart, Sparkles, Check } from 'lucide-react';

export const MoodCheckin: React.FC = () => {
  const { isolationData, saveMoodCheckin } = useStore();

  const [selectedMood, setSelectedMood] = useState(isolationData.moodScore);
  const [energy, setEnergy] = useState(isolationData.energy);
  const [anxiety, setAnxiety] = useState(isolationData.anxiety);
  const [connection, setConnection] = useState(isolationData.connection);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const moodFaces = [
    { score: 1, label: 'Exausto / Desanimado', icon: Frown, color: 'text-rose-400' },
    { score: 2, label: 'Baixo / Sobrecarga', icon: Frown, color: 'text-amber-400' },
    { score: 3, label: 'Neutro / Estável', icon: Meh, color: 'text-slate-300' },
    { score: 4, label: 'Bem / Focado', icon: Smile, color: 'text-sky-400' },
    { score: 5, label: 'Excelente / Motivado', icon: Laugh, color: 'text-emerald-400' },
  ];

  const handleSave = () => {
    saveMoodCheckin(selectedMood, energy, anxiety, connection);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
            <Heart size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Check-in Psicológico de 20 Segundos
            </h3>
            <p className="text-[11px] text-space-400">
              Autoavaliação de humor e prontidão emocional
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
          DIÁRIO
        </span>
      </div>

      {/* 5 Faces */}
      <div className="mb-5">
        <span className="text-xs font-semibold text-space-300 block mb-2">
          Como você se sente agora?
        </span>
        <div className="grid grid-cols-5 gap-2">
          {moodFaces.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedMood === f.score;

            return (
              <button
                key={f.score}
                type="button"
                onClick={() => setSelectedMood(f.score)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-space-750 border-astro-cyan text-white shadow-glow-cyan'
                    : 'bg-space-900 border-space-750 text-space-400 hover:text-white hover:bg-space-800'
                }`}
                title={f.label}
              >
                <Icon size={24} className={isSelected ? 'text-astro-cyan' : f.color} />
                <span className="text-[10px] font-mono mt-1">{f.score} / 5</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Sliders */}
      <div className="space-y-3.5 mb-5">
        {/* Energia */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-space-300">Nível de Energia Física & Mental</span>
            <span className="font-mono text-sky-400">{energy}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-astro-cyan"
          />
        </div>

        {/* Ansiedade */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-space-300">Nível de Ansiedade / Tensão</span>
            <span className="font-mono text-amber-400">{anxiety}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={anxiety}
            onChange={(e) => setAnxiety(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>

        {/* Conexão */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-space-300">Conexão com a Tripulação & Apoio</span>
            <span className="font-mono text-emerald-400">{connection}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={connection}
            onChange={(e) => setConnection(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
        <span className="text-xs text-space-400 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" /> +30 XP ao salvar check-in
        </span>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
          {savedSuccess ? (
            <>
              <Check size={14} /> Salvo com Sucesso!
            </>
          ) : (
            <span>Salvar Check-in</span>
          )}
        </button>
      </div>
    </div>
  );
};
