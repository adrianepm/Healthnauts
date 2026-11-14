import React from 'react';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { Wind, Gauge, Droplets, Thermometer } from 'lucide-react';

export const AirGauges: React.FC = () => {
  const { atmosphereData, openMetricDetailModal } = useStore();

  const gauges = [
    {
      id: 'o2',
      name: 'Oxigênio (O2)',
      value: atmosphereData.o2Percent,
      unit: '%',
      level: 'green' as const,
      icon: Wind,
      color: '#22C55E',
      nominal: '20,5 - 21,5 %',
      why: 'Concentrações abaixo de 19,5% provocam hipóxia tecidual e perda de foco cognitivo. Acima de 23,5% elevam criticamente o perigo de combustão na nave.',
      what: 'Pressão parcial de oxigênio perfeitamente estabilizada pelo sistema de eletrólise OGA (Oxygen Generation Assembly).',
    },
    {
      id: 'co2',
      name: 'Dióxido de Carbono (CO2)',
      value: atmosphereData.co2Ppm,
      unit: 'ppm',
      level: 'yellow' as const,
      icon: Gauge,
      color: '#F59E0B',
      nominal: '< 3.000 ppm',
      why: 'Em gravidade zero sem convecção natural, o CO2 exalado se acumula em bolhas ao redor da cabeça, induzindo cefaleia e hipertensão intracraniana.',
      what: 'Acionar ventiladores de recirculação secundários e inspecionar os leitos de absorção de amina térmica (CDRA).',
    },
    {
      id: 'humidity',
      name: 'Umidade Relativa',
      value: atmosphereData.humidityPercent,
      unit: '%',
      level: 'green' as const,
      icon: Droplets,
      color: '#22C55E',
      nominal: '40 - 60 %',
      why: 'Umidade alta favorece colônias fúngicas e corrosão eletrônica oculta; umidade muito baixa resseca mucosas aéreas e piora dermatites.',
      what: 'Condensador de cabine operando em regime nominal. Água recuperada direcionada ao circuito de reciclagem.',
    },
    {
      id: 'temp',
      name: 'Temperatura da Cabine',
      value: atmosphereData.tempCelsius,
      unit: '°C',
      level: 'green' as const,
      icon: Thermometer,
      color: '#22C55E',
      nominal: '20,0 - 24,0 °C',
      why: 'Homeotermia da tripulação. O suor não escorre nem goteja em 0g, tornando o conforto térmico essencial para rendimento e sono.',
      what: 'Temperatura ótima. Radiadores externos de amônia mantendo dissipação estável no lado sombreado da nave.',
    },
  ];

  const handleOpenDetail = (g: typeof gauges[0]) => {
    openMetricDetailModal({
      title: g.name,
      subtitle: `Faixa Nominal: ${g.nominal}`,
      value: `${g.value} ${g.unit}`,
      level: g.level,
      whyMeasure: g.why,
      whatToDo: g.what,
    });
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {g.value.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-semibold text-space-400">
                  {g.unit}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-space-700/60 flex items-center justify-between text-[10px] text-space-400 font-mono">
              <span>Nominal: {g.nominal}</span>
              <span className="text-astro-cyan font-sans group-hover:underline">Detalhes</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
