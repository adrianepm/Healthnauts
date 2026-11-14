import React from 'react';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { LayoutGrid, Volume2, Droplet, ShieldAlert, Wind, Sparkles } from 'lucide-react';

export const CabinSensorMap: React.FC = () => {
  const { atmosphereData, selectedCabinSensorId, setSelectedCabinSensorId } = useStore();
  const sensors = atmosphereData.cabinSensors;

  const selectedSensor =
    sensors.find((s) => s.id === selectedCabinSensorId) || sensors[0];

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Mapa de Sensores da Cabine
            </h3>
            <p className="text-[11px] text-space-400">
              Grade 2x2 de monitoramento compartimentado
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
          4 MÓDULOS
        </span>
      </div>

      {/* 2x2 Interactive Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {sensors.map((s) => {
          const isSelected = selectedSensor.id === s.id;

          return (
            <div
              key={s.id}
              onClick={() => setSelectedCabinSensorId(s.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-space-750 border-astro-cyan shadow-glow-cyan'
                  : 'bg-space-900 border-space-750 hover:border-space-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs text-white truncate">
                  {s.name.split('(')[0].trim()}
                </span>
                <StatusPill level={s.level} size="sm" showIcon={false} />
              </div>

              <div className="text-xs font-mono">
                <span className="text-space-400 text-[10px]">CO2: </span>
                <span
                  className={`font-bold ${
                    s.co2 > 3000 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {s.co2} ppm
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sensor Environmental Telemetry Panel */}
      <div className="p-4 rounded-xl bg-space-900 border border-space-700 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-white">
            Telemetria Detalhada: {selectedSensor.name}
          </h4>
          <StatusPill level={selectedSensor.level} size="sm" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-lg bg-space-850 border border-space-800">
            <span className="text-space-400 text-[10px] block">TEMPERATURA</span>
            <span className="text-white font-bold">{selectedSensor.temp} °C</span>
          </div>
          <div className="p-2 rounded-lg bg-space-850 border border-space-800">
            <span className="text-space-400 text-[10px] block">UMIDADE</span>
            <span className="text-white font-bold">{selectedSensor.humidity} %</span>
          </div>
          <div className="p-2 rounded-lg bg-space-850 border border-space-800">
            <span className="text-space-400 text-[10px] block flex items-center justify-center gap-0.5">
              <Volume2 size={10} /> RUÍDO
            </span>
            <span className="text-white font-bold">{selectedSensor.noiseDb} dB</span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] pt-1">
          <div className="flex items-start gap-1.5 text-space-300">
            <Wind size={13} className="text-astro-cyan shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Qualidade do Ar: </strong>
              {selectedSensor.airQualityDesc}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-space-300">
            <Droplet size={13} className="text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Água & Circuitos: </strong>
              {selectedSensor.waterQuality}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-space-300">
            <ShieldAlert size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Superfície: </strong>
              {selectedSensor.surfaceStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
