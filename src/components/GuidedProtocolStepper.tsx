import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Stethoscope,
  Send,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const GuidedProtocolStepper: React.FC = () => {
  const { selectedProtocol, addXP, setIsSurgeonModalOpen } = useStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!selectedProtocol) return null;

  const steps = selectedProtocol.steps;
  const currentStep = steps[currentStepIndex] || steps[0];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      addXP(10);
    } else {
      // Completed protocol
      addXP(30);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const stepLabels = ['1. Sintoma', '2. Perguntas', '3. Medir', '4. Protocolo', '5. Escalar'];

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      {/* Protocol Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-space-700/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/15 text-astro-cyan">
            <Stethoscope size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                {selectedProtocol.name}
              </h3>
              <StatusPill level={selectedProtocol.severity} size="sm" />
            </div>
            <p className="text-xs text-space-400">
              Protocolo Clínico de Bordo · Categoria {selectedProtocol.category}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-space-300 bg-space-800 px-3 py-1 rounded-xl border border-space-700">
          Etapa {currentStepIndex + 1} de {steps.length}
        </span>
      </div>

      {/* Horizontal 5-Step Progress Stepper */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {stepLabels.map((label, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <button
              key={label}
              onClick={() => setCurrentStepIndex(idx)}
              className={`p-2 rounded-xl text-center transition-all border ${
                isCurrent
                  ? 'bg-space-750 border-astro-cyan text-white shadow-glow-cyan'
                  : isCompleted
                  ? 'bg-space-900 border-emerald-500/40 text-emerald-400'
                  : 'bg-space-900/60 border-space-800 text-space-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                {isCompleted && <CheckCircle2 size={12} />}
                <span className="truncate">{label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Card */}
      <div className="p-5 rounded-xl bg-space-900 border border-space-750 space-y-4 mb-5">
        <div>
          <span className="text-[10px] uppercase font-mono text-astro-cyan font-bold block mb-1">
            ETAPA {currentStep.stepNumber}: {stepLabels[currentStepIndex].split('.')[1].trim().toUpperCase()}
          </span>
          <h4 className="text-sm lg:text-base font-bold text-white">
            {currentStep.title}
          </h4>
          <p className="text-xs text-space-200 mt-1 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Action required */}
        <div className="p-3 rounded-xl bg-space-850 border border-space-700/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-space-300 block mb-1">
            Ação Clínica Requerida:
          </span>
          <p className="text-xs text-white font-medium">{currentStep.actionRequired}</p>
        </div>

        {/* Por que medir & O que fazer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-space-950/60 border border-space-800">
            <div className="flex items-center gap-1.5 text-astro-cyan mb-1 text-xs font-semibold">
              <HelpCircle size={14} />
              <span>Por que medir isto?</span>
            </div>
            <p className="text-[11px] text-space-300 leading-relaxed">
              {currentStep.whyMeasure}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-space-950/60 border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-amber-400 mb-1 text-xs font-semibold">
              <Stethoscope size={14} />
              <span>O que fazer agora:</span>
            </div>
            <p className="text-[11px] text-space-300 leading-relaxed">
              {currentStep.whatToDo}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-space-300 hover:text-white bg-space-800 hover:bg-space-700 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Etapa Anterior</span>
        </button>

        {currentStepIndex === steps.length - 1 ? (
          <button
            onClick={() => setIsSurgeonModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow-red transition-all"
          >
            <Send size={14} />
            <span>Escalar ao Cirurgião (Red Flag)</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-astro-cyan hover:bg-sky-400 text-space-950 font-bold text-xs shadow-glow-cyan transition-all"
          >
            <span>Próxima Etapa</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
