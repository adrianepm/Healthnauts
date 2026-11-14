import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { X, Wind, Heart, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';

type BreathPhase = 'inhale' | 'hold' | 'exhale';

export const GuidedBreathingModal: React.FC = () => {
  const { isBreathingModalOpen, setIsBreathingModalOpen, addXP } = useStore();

  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // 4-7-8 timing
  const INHALE_TIME = 4;
  const HOLD_TIME = 7;
  const EXHALE_TIME = 8;

  useEffect(() => {
    if (!isBreathingModalOpen || !isActive) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return HOLD_TIME;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return EXHALE_TIME;
          } else {
            setPhase('inhale');
            setCyclesCompleted((c) => {
              const next = c + 1;
              if (next === 4) {
                addXP(25);
              }
              return next;
            });
            return INHALE_TIME;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathingModalOpen, isActive, phase, addXP]);

  if (!isBreathingModalOpen) return null;

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return { text: 'Inspire lentamente pelo nariz', color: '#38BDF8', scale: 1.35 };
      case 'hold':
        return { text: 'Segure a respiração', color: '#A855F7', scale: 1.35 };
      case 'exhale':
        return { text: 'Expire profundamente pela boca', color: '#22C55E', scale: 0.85 };
    }
  };

  const curr = getPhaseInstruction();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-space-700/60 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/15 text-astro-cyan">
                <Wind size={20} />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-white">Respiração Guiada 4-7-8</h3>
                <p className="text-[11px] text-space-300">Equilíbrio Parassimpático</p>
              </div>
            </div>
            <button
              onClick={() => setIsBreathingModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Animated Circle */}
          <div className="relative flex items-center justify-center h-64 my-4">
            {/* Outer halo */}
            <motion.div
              animate={{
                scale: curr.scale,
                borderColor: curr.color,
                boxShadow: `0 0 30px ${curr.color}40`,
              }}
              transition={{ duration: secondsLeft, ease: 'easeInOut' }}
              className="w-48 h-48 rounded-full border-4 flex items-center justify-center bg-space-900/60"
            >
              {/* Inner core */}
              <div className="flex flex-col items-center">
                <span className="text-4xl font-extrabold font-mono text-white mb-1">
                  {secondsLeft}s
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ color: curr.color, backgroundColor: `${curr.color}20` }}
                >
                  {phase === 'inhale' ? 'Inspirar' : phase === 'hold' ? 'Segurar' : 'Expirar'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Current Instruction */}
          <p className="text-base font-medium text-slate-100 mb-6 min-h-[1.5rem]">
            {curr.text}
          </p>

          {/* Controls & Cycle counter */}
          <div className="flex items-center justify-between pt-4 border-t border-space-700/60">
            <div className="text-left text-xs text-space-300">
              <span>Ciclos completados: </span>
              <span className="font-mono font-bold text-astro-cyan">{cyclesCompleted} / 4</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-2.5 rounded-xl bg-space-700 hover:bg-space-600 text-white transition-colors"
                title={isActive ? 'Pausar' : 'Continuar'}
              >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => {
                  setPhase('inhale');
                  setSecondsLeft(INHALE_TIME);
                  setCyclesCompleted(0);
                  setIsActive(true);
                }}
                className="p-2.5 rounded-xl bg-space-700 hover:bg-space-600 text-white transition-colors"
                title="Reiniciar"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
