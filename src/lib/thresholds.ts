import { EnvironmentMode, StatusLevel } from '../types';

export interface EnvironmentalThresholds {
  environment: EnvironmentMode;
  description: string;
  gravityG: number;
  radiation: {
    nominalDailyRateMsv: number;
    warningDailyRateMsv: number;
    criticalDailyRateMsv: number;
    missionBudgetMaxMsv: number;
    tip: string;
  };
  atmosphere: {
    co2NominalPpm: number;
    co2WarningPpm: number;
    co2CriticalPpm: number;
    o2MinPercent: number;
    o2MaxPercent: number;
    humidityMinPercent: number;
    humidityMaxPercent: number;
    tempMinCelsius: number;
    tempMaxCelsius: number;
    tip: string;
  };
  exercise: {
    cardioMinutesDay: number;
    resistanceMinutesDay: number;
    flexibilityMinutesDay: number;
    boneLossMaxPercentMonth: number;
    tip: string;
  };
  nutrition: {
    caloriesMin: number;
    hydrationLitersMin: number;
    proteinGramsMin: number;
    vitDiuMin: number;
    tip: string;
  };
  sleep: {
    minHours: number;
    maxHours: number;
    idealHours: number;
    tip: string;
  };
}

export const ENVIRONMENT_THRESHOLDS: Record<EnvironmentMode, EnvironmentalThresholds> = {
  Nave: {
    environment: 'Nave',
    description: 'Trânsito em Espaço Profundo (Ares-1)',
    gravityG: 0,
    radiation: {
      nominalDailyRateMsv: 1.5,
      warningDailyRateMsv: 2.2,
      criticalDailyRateMsv: 4.0,
      missionBudgetMaxMsv: 600,
      tip: 'Blindagem de casco intermediária. Em caso de tempestade solar (SPE), recolha-se imediatamente ao Módulo B (Abrigo).',
    },
    atmosphere: {
      co2NominalPpm: 2800,
      co2WarningPpm: 3500,
      co2CriticalPpm: 4500,
      o2MinPercent: 19.5,
      o2MaxPercent: 23.5,
      humidityMinPercent: 35,
      humidityMaxPercent: 65,
      tempMinCelsius: 19,
      tempMaxCelsius: 25,
      tip: 'Na ausência de convecção natural, use ventiladores portáteis ao dormir para evitar bolsões de CO2 perto do rosto.',
    },
    exercise: {
      cardioMinutesDay: 45,
      resistanceMinutesDay: 45,
      flexibilityMinutesDay: 15,
      boneLossMaxPercentMonth: 1.2,
      tip: 'Microgravidade total: use o ARED (equipamento resistivo) com carga máxima nas articulações de quadril e coluna.',
    },
    nutrition: {
      caloriesMin: 2800,
      hydrationLitersMin: 2.6,
      proteinGramsMin: 110,
      vitDiuMin: 1000,
      tip: 'Alta exigência metabólica pelo exercício rigoroso. Suplementação obrigatória de Vitamina D3 e Cálcio.',
    },
    sleep: {
      minHours: 7.0,
      maxHours: 9.0,
      idealHours: 8.0,
      tip: 'Fixe o saco de dormir com tensão firme para simular pressão corporal e acalmar o sistema vestibular.',
    },
  },
  Estação: {
    environment: 'Estação',
    description: 'Estação Orbital / Plataforma Gateway',
    gravityG: 0,
    radiation: {
      nominalDailyRateMsv: 0.9,
      warningDailyRateMsv: 1.5,
      criticalDailyRateMsv: 3.0,
      missionBudgetMaxMsv: 500,
      tip: 'Proteção geomagnética residual reduz radiação cósmica, mas eventos de prótons solares ainda exigem cautela.',
    },
    atmosphere: {
      co2NominalPpm: 2400,
      co2WarningPpm: 3200,
      co2CriticalPpm: 4000,
      o2MinPercent: 20.0,
      o2MaxPercent: 22.5,
      humidityMinPercent: 40,
      humidityMaxPercent: 60,
      tempMinCelsius: 20,
      tempMaxCelsius: 24,
      tip: 'Módulos interconectados mantêm pressão estável. Monitore filtros de circulação nos nós centrais.',
    },
    exercise: {
      cardioMinutesDay: 40,
      resistanceMinutesDay: 40,
      flexibilityMinutesDay: 15,
      boneLossMaxPercentMonth: 1.0,
      tip: 'Mantenha rotina na esteira T2 com arnês elástico para impacto mecânico nos calcanhares.',
    },
    nutrition: {
      caloriesMin: 2600,
      hydrationLitersMin: 2.4,
      proteinGramsMin: 100,
      vitDiuMin: 800,
      tip: 'Dieta balanceada com alimentos frescos hidropônicos conforme disponibilidade semanal.',
    },
    sleep: {
      minHours: 7.0,
      maxHours: 8.5,
      idealHours: 7.5,
      tip: 'Iluminação espectral dinâmica programada para ativar melanopsina pela manhã e induzir melatonina à noite.',
    },
  },
  Rover: {
    environment: 'Rover',
    description: 'Veículo Explorador de Superfície Móvel',
    gravityG: 0.38,
    radiation: {
      nominalDailyRateMsv: 1.2,
      warningDailyRateMsv: 1.8,
      criticalDailyRateMsv: 3.5,
      missionBudgetMaxMsv: 450,
      tip: 'Blindagem do veículo é reduzida para economia de peso. Planeje rotas em cânions para sombreamento radiológico.',
    },
    atmosphere: {
      co2NominalPpm: 3200,
      co2WarningPpm: 3800,
      co2CriticalPpm: 4800,
      o2MinPercent: 19.0,
      o2MaxPercent: 23.0,
      humidityMinPercent: 30,
      humidityMaxPercent: 70,
      tempMinCelsius: 18,
      tempMaxCelsius: 26,
      tip: 'Volume de cabine reduzido faz o CO2 oscilar rapidamente durante atividades intensas com trajes.',
    },
    exercise: {
      cardioMinutesDay: 30,
      resistanceMinutesDay: 30,
      flexibilityMinutesDay: 20,
      boneLossMaxPercentMonth: 0.7,
      tip: 'Gravidade parcial (0,38 g) auxilia, mas caminhadas em EVA consomem grande energia muscular periférica.',
    },
    nutrition: {
      caloriesMin: 3100,
      hydrationLitersMin: 3.2,
      proteinGramsMin: 120,
      vitDiuMin: 1000,
      tip: 'Consumo calórico elevado durante saídas externas de campo. Beba eletrólitos antes do retorno à eclusa.',
    },
    sleep: {
      minHours: 6.5,
      maxHours: 8.5,
      idealHours: 7.5,
      tip: 'Leitos reclináveis com suspensão amortecida. Fones com cancelamento de ruído térmico recomendados.',
    },
  },
  Base: {
    environment: 'Base',
    description: 'Habitat de Superfície Marciana / Lunar',
    gravityG: 0.38,
    radiation: {
      nominalDailyRateMsv: 0.4,
      warningDailyRateMsv: 0.8,
      criticalDailyRateMsv: 2.0,
      missionBudgetMaxMsv: 400,
      tip: 'Camada de 3 metros de rególito sobre o teto do habitat oferece excelente atenuação de raios cósmicos.',
    },
    atmosphere: {
      co2NominalPpm: 1900,
      co2WarningPpm: 2600,
      co2CriticalPpm: 3500,
      o2MinPercent: 20.5,
      o2MaxPercent: 21.5,
      humidityMinPercent: 40,
      humidityMaxPercent: 60,
      tempMinCelsius: 21,
      tempMaxCelsius: 23,
      tip: 'Sistemas de suporte à vida bioregenerativos (ECLSS de grande escala) operando em fluxo constante.',
    },
    exercise: {
      cardioMinutesDay: 35,
      resistanceMinutesDay: 35,
      flexibilityMinutesDay: 15,
      boneLossMaxPercentMonth: 0.5,
      tip: 'Aproveite a academia completa da base com cicloergômetro centrífugo e pesos pneumáticos.',
    },
    nutrition: {
      caloriesMin: 2700,
      hydrationLitersMin: 2.5,
      proteinGramsMin: 105,
      vitDiuMin: 800,
      tip: 'Integre vegetais frescos das estufas do Módulo Biológico para estímulo sensorial e micronutrientes.',
    },
    sleep: {
      minHours: 7.0,
      maxHours: 9.0,
      idealHours: 8.0,
      tip: 'Quartos privativos com controle ambiental individual e simulação de nascer/pôr do sol terreno.',
    },
  },
};

export function getThresholds(env: EnvironmentMode): EnvironmentalThresholds {
  return ENVIRONMENT_THRESHOLDS[env] || ENVIRONMENT_THRESHOLDS.Nave;
}
