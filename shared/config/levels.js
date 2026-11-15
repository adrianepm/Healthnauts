// Níveis da especificação v2, seção 2.1. Os nomes seguem a seção 10.3 "Alerts" do
// NASA-STD-3001 Vol. 2 Rev. F; as definições e o encaixe de cada parâmetro são proposta do time.
const MINUTE = 60000;
export const levelSource = { classification: 'team_proposal',
  url: 'https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf',
  section: 'Level names from NASA-STD-3001 Vol. 2 Rev. F §10.3. Definitions and the level assigned to each parameter are team decisions.' };

export const levels = {
  normal: { label: 'Normal', color: '#22C55E', icon: 'CircleCheck', action: 'Recorded only.' },
  advisory: { label: 'Advisory', color: '#38BDF8', icon: 'Info', action: 'Shown in the summary and detail. No notification.' },
  caution: { label: 'Caution', color: '#EAB308', icon: 'TriangleAlert', action: 'Notification and in-observation flag.' },
  warning: { label: 'Warning', color: '#F97316', icon: 'OctagonAlert', action: 'Strong notification, mandatory acknowledgement and ground report.' },
  emergency: { label: 'Emergency', color: '#EF4444', icon: 'Siren', action: 'Full screen, sound, mandatory acknowledgement and immediate ground report.' },
  unavailable: { label: 'Unavailable', color: '#64748B', icon: 'CircleDashed', action: 'Asks for a new measurement. Not assessed.' },
};
// Cor neutra da faixa pessoal nos gráficos, para não confundir com o azul do Advisory.
export const neutralChartColor = '#5B7FA6';

// `level` é o nível de alerta de uma avaliação: null quando nenhuma regra foi acionada.
export const alertLevels = ['advisory', 'caution', 'warning', 'emergency'];
export const rank = level => alertLevels.indexOf(level) + 1;
export const maxLevel = (...list) => list.flat().reduce((worst, level) => rank(level) > rank(worst) ? level : worst, null);
export const atLeast = (level, floor) => rank(level) >= rank(floor);

// Status que contam como "avaliado"; qualquer outro aparece como Unavailable na tela.
export const assessedStatuses = ['assessed', 'no_demonstrative_signal', 'in_observation'];
export const displayLevelOf = (status, level) => level ?? (assessedStatuses.includes(status) ? 'normal' : 'unavailable');

// Prioridade na tela: Emergency > Warning > Caution > Unavailable de sensor crítico > Advisory > Normal.
const priority = item => item.displayLevel === 'unavailable' ? (item.critical ? 3.5 : 0)
  : item.displayLevel === 'normal' ? 1 : rank(item.displayLevel) + (item.displayLevel === 'advisory' ? 1 : 2);
export function worstLevel(items) {
  const worst = items.reduce((top, item) => !top || priority(item) > priority(top) ? item : top, null);
  if (!worst) return { level: null, displayLevel: 'unavailable', indicator: null, message: 'No data yet.' };
  return { level: worst.level ?? null, displayLevel: worst.displayLevel, indicator: worst.indicator ?? null, message: worst.message ?? null };
}

// Emergency só vem de condição da nave com limite oficial; escore de saúde para em Warning.
export const emergencyRules = ['cabin_pressure_total', 'cabin_inspired_oxygen'];
export const criticalIndicators = ['news2', 'cabin_pressure', 'inspired_oxygen_pressure'];

export const acknowledgement = {
  requiredFrom: 'warning',
  deadlineMs: { warning: 10 * MINUTE, emergency: 2 * MINUTE },
  escalatedTo: 'crew_medical_officer', alsoNotified: ['second_crew_member'],
  note: 'No acknowledgement does not mean loss of consciousness. The device may be far away, switched off or offline.',
  source: { classification: 'team_proposal', section: 'Acknowledgement deadlines of 10 min (Warning) and 2 min (Emergency)' },
};

export const unavailableMessage = 'No reliable data. Check the sensor and measure again.';
export const footer = 'This tool supports self-monitoring and crew medical decisions. It does not diagnose any condition.';
const cmo = 'Talk to your Crew Medical Officer.';
const procedure = "Follow your mission's approved procedure.";
// Regra de texto 2.2: ação operacional remete ao procedimento da missão; Caution ou acima termina com o CMO.
export function finalize(message, level, operational = false) {
  let text = message;
  if (operational && !/procedure/i.test(text)) text += ' ' + procedure;
  if (atLeast(level, 'caution') && !/Crew Medical Officer/.test(text)) text += ' ' + cmo;
  return text;
}
