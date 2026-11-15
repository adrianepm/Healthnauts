// Semente complementar da demonstração (só no navegador, só quando o store nasce vazio).
// A semente de shared/demo.js cobre 7 dias: é a janela da faixa pessoal (shared/config/isolation.js).
// Sem um registro DEPOIS dessa janela, estresse, humor, qualidade do sono e PVT-B ficam "coletando"
// e abrem como Unavailable. Aqui a semente de shared/ começa um dia antes e este arquivo grava:
//  1) um terceiro PVT-B dentro da janela (com 2 testes iguais os lapsos têm variância zero e a faixa não se forma);
//  2) o check-in e o PVT-B de ontem à noite, já fora da janela, com valores dentro da faixa.
// Nada aqui decide nível: os valores passam pela API e as regras de shared/ avaliam. Arquivo puro (testado em Node).

const DAY = 86400000;
const MINUTE = 60000;

export interface SeedRecord { indicator: string; value: number; unit: string | null; recordedAt: string; groupId?: string }

/** Início da semente de shared/demo.js: meia-noite local de ontem. Os 7 dias de exemplo terminam anteontem. */
export const demoSeedStart = (today: Date) => new Date(today.getTime() - DAY);

const pvt = (at: Date, speed: number, lapses: number, tag: string): SeedRecord[] => {
  const recordedAt = at.toISOString(); const groupId = `demo-seed-pvt-${tag}`;
  return [
    { indicator: 'pvt_response_speed', value: speed, unit: '1/s', recordedAt, groupId },
    { indicator: 'pvt_lapses', value: lapses, unit: 'count', recordedAt, groupId },
    { indicator: 'pvt_false_starts', value: 0, unit: 'count', recordedAt, groupId },
  ];
};

/** `today` = meia-noite local de hoje. Devolve os lotes de registros da área de isolamento, na ordem de envio. */
export function isolationFollowUp(today: Date): SeedRecord[][] {
  const seedStart = demoSeedStart(today);
  // Dia 2 da semente (shared/demo.js grava às 23:59 de cada dia): mesmo horário, dentro da janela.
  const baselineDay2 = new Date(seedStart.getTime() - 4 * DAY - MINUTE);
  // Ontem às 23:59 local: depois da janela em qualquer fuso, e dentro da validade de 36 h do check-in.
  const lastNight = new Date(today.getTime() - MINUTE);
  const recordedAt = lastNight.toISOString();
  return [
    pvt(baselineDay2, 3.8, 2, 'baseline-day-2'),
    [
      { indicator: 'sleep_duration', value: 7.25, unit: 'h', recordedAt },
      { indicator: 'sleep_quality', value: 73, unit: null, recordedAt },
      { indicator: 'sleepiness_kss', value: 3, unit: null, recordedAt },
      { indicator: 'fatigue_samn_perelli', value: 2, unit: null, recordedAt },
      { indicator: 'stress', value: 26, unit: null, recordedAt },
      { indicator: 'mood_score', value: 70, unit: null, recordedAt },
    ],
    pvt(lastNight, 3.7, 1, 'last-night'),
  ];
}
