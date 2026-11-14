import React from 'react';
import { MOCK_GRAVITY_DATA } from '../mock/gravidade';
import { StatusPill } from './StatusPill';
import { useStore } from '../store/useStore';
import { Activity, Play, ChevronRight, Eye, Scale, Smile } from 'lucide-react';

export const QuickTestCards: React.FC = () => {
  const { setActiveQuickTestId } = useStore();
  const tests = MOCK_GRAVITY_DATA.quickTests;

  const renderIcon = (id: string) => {
    switch (id) {
      case 'test-orthostatic':
        return <Activity size={18} className="text-emerald-400" />;
      case 'test-vestibular':
        return <Scale size={18} className="text-amber-400" />;
      case 'test-visual-acuity':
        return <Eye size={18} className="text-sky-400" />;
      case 'test-facial-puffiness':
      default:
        return <Smile size={18} className="text-purple-400" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Testes Rápidos de Adaptação Fisiológica
          </h3>
          <p className="text-[11px] text-space-400">
            Monitoramento neuromuscular & vestibular guiado
          </p>
        </div>
        <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
          4 TESTES
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tests.map((test) => (
          <div
            key={test.id}
            onClick={() => setActiveQuickTestId(test.id)}
            className="p-3.5 rounded-xl bg-space-900/90 border border-space-750 hover:border-astro-cyan/50 hover:bg-space-800 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-space-800">
                    {renderIcon(test.id)}
                  </div>
                  <h4 className="font-bold text-xs text-white group-hover:text-astro-cyan transition-colors">
                    {test.title}
                  </h4>
                </div>
                <StatusPill level={test.level} size="sm" showIcon={false} />
              </div>

              <p className="text-xs text-space-200 font-medium mb-1">
                {test.resultText}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-space-800 text-[10px] text-space-400 mt-2">
              <span>{test.lastDone}</span>
              <span className="text-astro-cyan font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <Play size={10} className="fill-astro-cyan" /> Iniciar Teste
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
