import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { X, Camera, Utensils, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

export const MealLogModal: React.FC = () => {
  const { isMealLogModalOpen, setIsMealLogModalOpen, logMeal } = useStore();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedFood, setScannedFood] = useState<{
    name: string;
    calories: number;
    proteinG: number;
    waterMl: number;
    calciumMg: number;
  } | null>(null);

  if (!isMealLogModalOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScannedFood(null);
    setTimeout(() => {
      setIsScanning(false);
      setScannedFood({
        name: 'Pack Espacial #08: Salmão Selvagem Liofilizado, Purê de Batata-Doce e Mix de Nozes com Suplemento de Cálcio',
        calories: 680,
        proteinG: 34,
        waterMl: 450,
        calciumMg: 350,
      });
    }, 1800);
  };

  const handleConfirmMeal = () => {
    if (scannedFood) {
      logMeal(scannedFood.calories, scannedFood.waterMl);
    } else {
      logMeal(500, 300);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-space-700/60 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <Utensils size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registro Nutricional com IA</h3>
                <p className="text-xs text-space-300">Reconhecimento fotométrico de ração espacial</p>
              </div>
            </div>
            <button
              onClick={() => setIsMealLogModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Viewfinder simulation */}
          <div className="relative aspect-video rounded-xl bg-space-950 border border-space-700 overflow-hidden flex flex-col items-center justify-center mb-4">
            {isScanning && (
              <motion.div
                className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_15px_#22c55e]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              />
            )}

            <div className="flex flex-col items-center text-center p-4">
              <Camera size={36} className="text-emerald-400 mb-2 opacity-80" />
              <span className="text-xs font-mono text-space-300">
                {isScanning ? 'Identificando códigos de barras e macronutrientes...' : 'Aponte a câmera para a embalagem liofilizada'}
              </span>
            </div>
          </div>

          {/* Scanned food details */}
          {scannedFood && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 size={15} />
                <span>Alimento Reconhecido pelo Banco de Dados ECLSS:</span>
              </div>
              <p className="text-xs text-white font-medium">{scannedFood.name}</p>
              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs font-mono border-t border-emerald-500/20">
                <div>
                  <span className="text-space-400 block text-[10px]">Energia</span>
                  <span className="text-white font-bold">{scannedFood.calories} kcal</span>
                </div>
                <div>
                  <span className="text-space-400 block text-[10px]">Proteína</span>
                  <span className="text-white font-bold">{scannedFood.proteinG} g</span>
                </div>
                <div>
                  <span className="text-space-400 block text-[10px]">Água</span>
                  <span className="text-white font-bold">{scannedFood.waterMl} mL</span>
                </div>
                <div>
                  <span className="text-space-400 block text-[10px]">Cálcio</span>
                  <span className="text-white font-bold">{scannedFood.calciumMg} mg</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-space-700/60">
            <span className="text-xs text-space-400 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" /> +30 XP de nutrição
            </span>
            <div className="flex gap-2">
              {!scannedFood ? (
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleSimulateScan}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-space-950 font-bold text-xs transition-all shadow-glow-green"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Escaneando Pack...
                    </>
                  ) : (
                    <>
                      <Camera size={14} /> Capturar Foto do Pack
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmMeal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-astro-cyan hover:bg-sky-400 text-space-950 font-bold text-xs transition-all shadow-glow-cyan"
                >
                  Confirmar Ingestão & Registrar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
