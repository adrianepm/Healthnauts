import { RadiationData } from '../types';

export const MOCK_RADIATION: RadiationData = {
  cumulativeDose: 312,
  maxBudget: 600,
  dailyRate: 1.8,
  budgetPercent: 52,
  history7d: [
    { day: 'D-7', rate: 1.2 },
    { day: 'D-6', rate: 1.3 },
    { day: 'D-5', rate: 1.1 },
    { day: 'D-4', rate: 1.4 },
    { day: 'D-3', rate: 1.5 },
    { day: 'D-2 (Pico)', rate: 4.8, isFlare: true },
    { day: 'D-1', rate: 2.1 },
    { day: 'Hoje', rate: 1.8 },
  ],
  zones: [
    {
      id: 'cockpit',
      name: 'Cabine de Comando',
      shielding: 'Casco de alumínio leve + janelas de quartzo fundido (blindagem mínima)',
      level: 'red',
      doseRate: 3.4,
      isCurrentLocation: false,
    },
    {
      id: 'module-a',
      name: 'Módulo A · Tripulação & Dormitórios',
      shielding: 'Painéis compostos de polietileno hidrogenado (blindagem média)',
      level: 'yellow',
      doseRate: 1.4,
      isCurrentLocation: false,
    },
    {
      id: 'module-b',
      name: 'Módulo B · ABRIGO CENTRAL (Storm Shelter)',
      shielding: 'Cercado por tanques de água potável e despensa alimentar (blindagem máxima)',
      level: 'green',
      doseRate: 0.2,
      isCurrentLocation: true,
    },
    {
      id: 'module-c',
      name: 'Módulo C · Carga & Suporte de Vida',
      shielding: 'Estrutura metálica intermediária e racks de equipamentos (blindagem média)',
      level: 'yellow',
      doseRate: 1.2,
      isCurrentLocation: false,
    },
  ],
  symptoms: [
    {
      id: 'sym-nausea',
      name: 'Náusea / Vômito',
      options: ['Nenhum', 'Leve (sem vômito)', 'Moderado', 'Grave / Frequente'],
      selected: 'Nenhum',
    },
    {
      id: 'sym-fatigue',
      name: 'Fadiga Incomum',
      options: ['Nenhuma', 'Leve', 'Moderada', 'Extrema / Prostração'],
      selected: 'Leve',
    },
    {
      id: 'sym-vision',
      name: 'Visão (Flashes de radiação, névoa)',
      options: ['Normal', 'Flashes fosfênicos esporádicos', 'Névoa ou queimação'],
      selected: 'Normal',
    },
    {
      id: 'sym-skin',
      name: 'Pele (Vermelhidão / Eritema)',
      options: ['Normal', 'Eritema térmico leve', 'Descamação ou prurido'],
      selected: 'Normal',
    },
    {
      id: 'sym-infections',
      name: 'Infecções Recentes',
      options: ['Nenhuma', 'Dermatite superficial', 'Afta oral', 'Respiratória'],
      selected: 'Nenhuma',
    },
  ],
};

export const SOLAR_ALERT_DETAILS = {
  active: true,
  title: 'ALERTA: Partículas Solares de Alta Energia Previstas',
  flareClass: 'SPE Classe M4.2 (Evento de Prótons Solares)',
  source: 'Telescópio Solar Ultravioleta e Satélite de Alerta Precoce SDO/DeepSpace',
  peakEstimatedTimeSec: 38 * 60 + 12, // 38min 12s
  fluxPeak: '10.400 pfu @ >10 MeV',
  protocolSteps: [
    {
      step: 1,
      title: 'Suspender EVAs e isolar módulos externos',
      desc: 'Travar escotilhas do Módulo de Carga e recolher braços robóticos externos.',
    },
    {
      step: 2,
      title: 'Configurar aviônicos em modo tolerante a radiação',
      desc: 'Desligar sensores ópticos expostos e acionar blindagem magnética redundante.',
    },
    {
      step: 3,
      title: 'Deslocar tripulação para o Módulo B (Abrigo)',
      desc: 'O abrigo é revestido pelos tanques de água potável que bloqueiam nêutrons e prótons.',
    },
    {
      step: 4,
      title: 'Ingestão do kit radioprotetor',
      desc: 'Tomar 1 cápsula de complexo antioxidante e hidratação rica em eletrólitos.',
    },
  ],
};
