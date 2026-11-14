import React from 'react';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { Wind, Gauge, Droplets, Thermometer, Volume2, ShieldCheck, Info } from 'lucide-react';
import { ApiRecord, ApiAssessment } from '../services/api';
import { StatusLevel } from '../types';

interface AirGaugesProps {
  latestRecords?: ApiRecord[];
  assessments?: ApiAssessment[];
}

export const AirGauges: React.FC<AirGaugesProps> = ({
  latestRecords = [],
  assessments = [],
}) => {
  const { openMetricDetailModal, setIsAtmosphereModalOpen, setIsNoiseModalOpen, setIsPostEvaModalOpen } = useStore();

  const getRecord = (indicator: string) => latestRecords.find((r) => r.indicator === indicator);
  const getAssessment = (indicator: string) => assessments.find((a) => a.indicator === indicator);

  const co2Record = getRecord('co2_concentration');
  const co2PpRecord = getRecord('co2_partial_pressure');
  const o2FracRecord = getRecord('oxygen_fraction');
  const o2PpRecord = getRecord('oxygen_partial_pressure');
  const pio2Record = getRecord('inspired_oxygen_pressure');
  const pressureRecord = getRecord('cabin_pressure');
  const tempRecord = getRecord('temperature');
  const humidityRecord = getRecord('relative_humidity');
  const noiseRecord = getRecord('cabin_noise');

  const co2Assessment = getAssessment('co2_partial_pressure');

  const co2Level: StatusLevel = co2Assessment?.level === 'attention'
    ? 'yellow'
    : co2Assessment?.status === 'assessed'
    ? 'green'
    : 'gray';

  const gauges = [
    {
      id: 'co2_partial_pressure',
      name: 'CO₂ Pressão Parcial (ppCO₂)',
      sub: 'NASA-STD-3001 Vol. 2 Rev. D ≤ 3 mmHg',
      value: co2PpRecord ? Number(co2PpRecord.value).toFixed(2) : co2Record ? (Number(co2Record.value) / 1e6 * 760).toFixed(2) : '3.95',
      unit: 'mmHg',
      level: co2Level,
      icon: Gauge,
      color: '#F59E0B',
      desc: `Média de 1h ponderada no tempo. Concentração: ${co2Record ? co2Record.value : '5200'} ppm. Distinção estrita entre ppm e mmHg.`,
      why: 'O padrão oficial V2 6004 avalia ppCO₂ &le; 3 mmHg em média temporal de 1 hora com cobertura contínua.',
      what: co2Assessment?.message || 'Acompanhar leitos CDRA e recirculação.',
      assessment: co2Assessment,
    },
    {
      id: 'oxygen_fraction',
      name: 'Oxigênio da Cabine (FiO₂ / ppO₂)',
      sub: 'Fração e pressão parcial separadas de SpO₂',
      value: o2FracRecord ? `${(Number(o2FracRecord.value) * 100).toFixed(1)}%` : '21.0%',
      unit: o2PpRecord ? `(${Number(o2PpRecord.value).toFixed(0)} mmHg)` : '(160 mmHg)',
      level: 'green' as const,
      icon: Wind,
      color: '#22C55E',
      desc: `Fração: ${o2FracRecord ? o2FracRecord.value : 0.21} · ppO₂ seco · PIO₂ inspirado: ${pio2Record ? Number(pio2Record.value).toFixed(1) : '150.0'} mmHg. SpO₂ é saturação periférica medida nos vitais.`,
      why: 'OCHMO-TB-003 Rev. A: ppO₂ = PB × FiO₂. PIO₂ = (PB − 47) × FiO₂ considerando vapor de água saturado a 37 °C.',
      what: 'Regeneração nominal por eletrólise OGA.',
    },
    {
      id: 'temperature',
      name: 'Temperatura Ambiental',
      sub: 'Recorded — automatic assessment unavailable',
      value: tempRecord ? String(tempRecord.value) : '23.0',
      unit: '°C (Cel)',
      level: 'gray' as const,
      icon: Thermometer,
      color: '#64748B',
      desc: 'Medição ambiental no ponto de coleta. Polígono conjunto de temperatura/umidade do padrão pendente de modelo de fluxo.',
      why: 'NASA-STD-3001 Vol. 2 Rev. D V2 6012. Classificação inativa nesta API.',
      what: 'Leitura registrada sem classificação automática.',
    },
    {
      id: 'relative_humidity',
      name: 'Umidade Relativa',
      sub: 'Recorded — automatic assessment unavailable',
      value: humidityRecord ? String(humidityRecord.value) : '45.0',
      unit: '%',
      level: 'gray' as const,
      icon: Droplets,
      color: '#64748B',
      desc: 'Umidade relativa da cabine preservada para histórico.',
      why: 'Vol. 2 Rev. D V2 6013. O retângulo aproximado de pesquisa ficou inativo.',
      what: 'Leitura registrada sem classificação automática.',
    },
  ];

  const handleOpenDetail = (g: typeof gauges[0]) => {
    openMetricDetailModal({
      title: g.name,
      subtitle: g.sub,
      value: `${g.value} ${g.unit}`,
      level: g.level,
      whyMeasure: `${g.desc}\n\n${g.why}`,
      whatToDo: g.what,
      ruleId: g.assessment?.rule?.id,
      ruleVersion: g.assessment?.rule?.version,
      ruleSource: g.assessment?.rule?.source,
      limitation: g.assessment?.limitation,
      scientificCategory: g.assessment?.scientificCategory || undefined,
      status: g.assessment?.status || undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* Quick Action Header for Operations */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-space-850/80 border border-space-700/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-space-300 font-medium">
            Entradas Compostas de Suporte de Vida (ECLSS) & Fisiologia de Cabine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAtmosphereModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-md text-xs"
          >
            <Wind size={13} />
            <span>Registrar Atmosfera</span>
          </button>
          <button
            onClick={() => setIsNoiseModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md text-xs"
          >
            <Volume2 size={13} />
            <span>Medir Ruído (dBA)</span>
          </button>
          <button
            onClick={() => setIsPostEvaModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md text-xs"
          >
            <ShieldCheck size={13} />
            <span>Checklist Pós-EVA</span>
          </button>
        </div>
      </div>

      {/* 4 Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {gauges.map((g) => {
          const Icon = g.icon;
          return (
            <div
              key={g.id}
              onClick={() => handleOpenDetail(g)}
              className="p-4 rounded-2xl bg-space-850/90 border border-space-700/80 hover:border-astro-cyan/50 hover:bg-space-800 transition-all cursor-pointer group shadow-card flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${g.color}15`, color: g.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="font-bold text-xs text-space-200 group-hover:text-white transition-colors truncate">
                    {g.name.split('(')[0].trim()}
                  </span>
                </div>
                <StatusPill level={g.level} size="sm" showIcon={false} />
              </div>

              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl lg:text-2xl font-black font-mono text-white tracking-tight">
                    {g.value}
                  </span>
                  <span className="text-[11px] font-mono text-space-400">
                    {g.unit}
                  </span>
                </div>
                <p className="text-[10px] text-space-400 mt-1 line-clamp-1">{g.sub}</p>
              </div>

              <div className="mt-2 pt-2 border-t border-space-700/50 flex items-center justify-between text-[10px] font-mono text-space-500">
                <span>Clique para detalhes</span>
                <Info size={12} className="group-hover:text-astro-cyan transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
