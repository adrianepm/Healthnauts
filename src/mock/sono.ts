import { IsolationData } from '../types';

export const MOCK_ISOLATION: IsolationData = {
  moodScore: 4, // 1 to 5
  energy: 68, // 0 to 100
  anxiety: 28, // 0 to 100
  connection: 75, // 0 to 100
  who5Score: 68,
  who5Trend: 'Queda leve na semana 2, recuperando gradualmente. Limite para alerta crítico: abaixo de 50 pontos.',
  sleepHistory14d: [
    { day: 'D-13', hours: 7.2, efficiency: 88, deepSleepHours: 1.8 },
    { day: 'D-12', hours: 7.5, efficiency: 90, deepSleepHours: 1.9 },
    { day: 'D-11', hours: 6.8, efficiency: 84, deepSleepHours: 1.5 },
    { day: 'D-10', hours: 7.0, efficiency: 86, deepSleepHours: 1.6 },
    { day: 'D-9', hours: 6.5, efficiency: 80, deepSleepHours: 1.3 },
    { day: 'D-8', hours: 5.8, efficiency: 75, deepSleepHours: 1.1 },
    { day: 'D-7', hours: 6.0, efficiency: 78, deepSleepHours: 1.2 },
    { day: 'D-6', hours: 6.4, efficiency: 82, deepSleepHours: 1.4 },
    { day: 'D-5', hours: 6.1, efficiency: 79, deepSleepHours: 1.3 },
    { day: 'D-4', hours: 6.7, efficiency: 85, deepSleepHours: 1.5 },
    { day: 'D-3', hours: 6.3, efficiency: 81, deepSleepHours: 1.4 },
    { day: 'D-2', hours: 5.9, efficiency: 74, deepSleepHours: 1.1 },
    { day: 'D-1', hours: 6.5, efficiency: 83, deepSleepHours: 1.5 },
    { day: 'Hoje', hours: 6.2, efficiency: 80, deepSleepHours: 1.3 },
  ],
  circadianBlocks: [
    { name: 'Sono & Repouso', hours: 7.0, color: '#A855F7', startHour: 23, endHour: 6, desc: 'Luzes apagadas na cabine individual, temperatura em 19.5°C' },
    { name: 'Despertar & Luz Azul', hours: 1.5, color: '#EAB308', startHour: 6, endHour: 7.5, desc: 'Espectro rico em 480nm para supressão rápida de melatonina' },
    { name: 'Trabalho Científico & Manutenção', hours: 7.5, color: '#38BDF8', startHour: 7.5, endHour: 15, desc: 'Consolas de navegação, checagens de telemetria e experimentos' },
    { name: 'Refeições & Nutrição', hours: 2.0, color: '#22C55E', startHour: 15, endHour: 17, desc: 'Almoço e jantar comunitários com reposição de eletrólitos' },
    { name: 'Exercício Obrigatório', hours: 2.5, color: '#F97316', startHour: 17, endHour: 19.5, desc: 'Treino ARED resistivo e cicloergômetro cardiovascular' },
    { name: 'Lazer & Descompressão', hours: 3.5, color: '#64748B', startHour: 19.5, endHour: 23, desc: 'Contato com a Terra, leitura, jogos e higiene pessoal' },
  ],
  circadianOffsetMinutes: 40,
  socialHistory7d: [
    { day: 'Seg', crewMinutes: 145, earthMinutes: 35 },
    { day: 'Ter', crewMinutes: 160, earthMinutes: 40 },
    { day: 'Qua', crewMinutes: 120, earthMinutes: 20 },
    { day: 'Qui', crewMinutes: 180, earthMinutes: 45 },
    { day: 'Sex', crewMinutes: 150, earthMinutes: 30 },
    { day: 'Sáb', crewMinutes: 210, earthMinutes: 60 },
    { day: 'Dom', crewMinutes: 190, earthMinutes: 50 },
  ],
};

export const SUPPORT_TOOLS = [
  {
    id: 'tool-breathing',
    title: 'Respiração Guiada 4-7-8',
    category: 'Regulação do Sistema Nervoso',
    duration: '4 min',
    actionType: 'modal',
    description: 'Técnica clínica comprovada para reduzir tônus simpático, baixar frequência cardíaca e induzir relaxamento profundo.',
    icon: 'Wind',
  },
  {
    id: 'tool-voice-diary',
    title: 'Diário de Voz Privado (Criptografado)',
    category: 'Desabafo Emocional',
    duration: 'Livre',
    actionType: 'voice_diary',
    description: 'Grave seus pensamentos sem envio à Terra ou aos colegas. Transcrição local para autorreflexão e alívio de estresse.',
    icon: 'Mic',
  },
  {
    id: 'tool-family-call',
    title: 'Mensagem Gravada para Família',
    category: 'Vínculo Afetivo',
    duration: 'Assíncrono',
    actionType: 'family_call',
    description: 'Envie um vídeo ou áudio para transmissão no próximo pacote de telemetria das 18:00 UTC.',
    icon: 'Heart',
  },
  {
    id: 'tool-psych-message',
    title: 'Mensagem ao Psicólogo de Voo',
    category: 'Suporte Clínico Reservado',
    duration: 'Assíncrono (8 min delay)',
    actionType: 'psych_msg',
    description: 'Canal direto com o suporte psicológico em Houston/Colônia. Resposta em até 2 horas na janela de telemetria.',
    icon: 'MessageSquare',
  },
  {
    id: 'tool-meditation',
    title: 'Meditação / Música Binaural',
    category: 'Foco & Mindfulness',
    duration: '15 min',
    actionType: 'meditation',
    description: 'Sessão de relaxamento com sons terrestres (floresta, chuva, ondas do mar) e ondas teta para ancoragem mental.',
    icon: 'Headphones',
  },
];
