// Research references, not clinical validation of the demonstration's rules.
export const isolationReferences = {
  rst: { title: 'Jones et al. 2022 — Sleep deficiency on the ISS', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/' },
  planning: { title: 'NASA — Medical operations and sleep planning', url: 'https://www.nasa.gov/reference/6-0-medical-operations/' },
  kss: { title: 'Arsintescu et al. 2019 — KSS reference cited in the research', url: 'https://hsi.arc.nasa.gov/publications/Arsintescu_etal_2019_JoVE.pdf', note: 'Link redireciona; confirmar publicação e autorização do texto completo antes de uso real.' },
  samn: { title: 'Samn–Perelli — SAM-TR-82-21 (1982)', url: 'https://apps.dtic.mil/sti/pdfs/ADA125319.pdf', note: 'Referência fornecida pela pesquisa; documento não recuperado na revisão.' },
  behavioral: { title: 'NASA — Behavioral Health & Performance Standard Measures', url: 'https://ntrs.nasa.gov/api/citations/20170005421/downloads/20170005421.pdf' },
  pvt: { title: 'Basner, Mollicone & Dinges 2011 — PVT-B', url: 'https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf' },
};
const team = note => ({ basis: 'proposta da equipe', note });
const source = (ref, note) => ({ basis: 'fonte', references: [isolationReferences[ref]], note });
export const dailyCollection = {
  schedule: [{ kind: 'interval', days: 1, context: 'morning_check_in', ...source('rst', 'Frequência adotada como proposta de demonstração com base na pesquisa.') }],
};
export const pvtCollection = {
  schedule: [
    { kind: 'interval', days: 4, ...source('rst', 'Periodicidade proposta para a demonstração.') },
    { kind: 'event', event: 'before_critical_task', ...team('Coleta antes de tarefa crítica, proposta da equipe.') },
  ],
};
export const personalBaseline = {
  days: 7, timeZone: 'UTC', dailyAggregation: 'latest', standardDeviation: 'sample', multiplier: 2,
  ...team('Primeiros sete dias de calendário UTC; média ± 2 desvios padrão amostrais. Não é faixa validada pela NASA. Uma observação por dia; não estender a janela para preencher dias ausentes.'),
};
// Piso de desvio padrão nas escalas 0–100 (especificação v2, seção 4): evita faixa pessoal estreita demais.
const scoreFloor = 5;
const range = (id, direction, consecutive, level, message, messageAbove) => ({ id, version: 2, kind: 'personal_range', direction, consecutive, level,
  ...team(`Comparação com faixa pessoal por ${consecutive} ${consecutive === 1 ? 'observação' : 'dias consecutivos'}; nível ${level} é decisão da equipe (especificação v2, 3.2).`),
  message, ...(messageAbove ? { messageAbove } : {}) });
// Escalas 0–100: 1 ou 2 dias fora da faixa = Advisory; 3 dias seguidos = Caution.
const personalScore = (direction, advisory, caution, above = []) => ({
  baseline: { ...personalBaseline, minSamples: 7, minStandardDeviation: scoreFloor },
  rules: [range('personal_range_streak', direction, 3, 'caution', caution, above[1]), range('personal_range_day', direction, 1, 'advisory', advisory, above[0])],
});
// PVT-B: um teste fora da faixa já classifica. Linha de base mantida do backend (7 dias, mínimo 2 testes).
const personalTest = (direction, level, message) => ({
  baseline: { ...personalBaseline, minSamples: 2 },
  rules: [range('personal_range', direction, 1, level, message)],
});
const threshold = (id, operator, value, level, provenance, message, consecutive = 1) => ({
  id, version: 2, kind: 'threshold', operator, value, level, consecutive, ...provenance, message,
});
export const isolationMonitoring = {
  sleep_duration: { rules: [
    threshold('sleep_four_hours', 'lte', 4, 'warning', team('Corte de 4 h como Warning escolhido pela equipe; a NASA pede para evitar tarefas críticas com fadiga (V1 6001).'), 'You slept 4 hours or less. Avoid critical tasks if possible and talk to your Crew Medical Officer about fatigue countermeasures.'),
    threshold('sleep_three_nights', 'lte', 6, 'caution', team('Três noites consecutivas de até 6 h como Caution: decisão da equipe.'), 'Short sleep for 3 nights. Short sleep is linked to slower reactions in space. Ask for help adjusting your schedule if you can.', 3),
    threshold('sleep_six_hours', 'lte', 6, 'advisory', source('rst', 'Associação com sono curto na pesquisa; o nível Advisory é decisão da equipe, não corte médico.'), 'You slept 6 hours or less. Protect your next sleep period and dim the lights about an hour before bed.'),
  ] },
  sleep_quality: personalScore('outside', 'Your sleep quality was lower than usual.', 'Sleep quality lower than usual for 3 days. Check light, noise and temperature in your sleep station.',
    // O backend compara nos dois sentidos; acima da faixa o texto não pode dizer "lower".
    ['Your sleep quality was outside your usual range.', 'Sleep quality outside your usual range for 3 days.']),
  sleepiness_kss: { rules: [
    threshold('kss_eight', 'gte', 8, 'caution', source('kss', 'Limiar citado no documento de pesquisa, em contexto de aviação/direção; não validado para esta aplicação espacial. Nível Caution é decisão da equipe.'), 'You are very sleepy. Postpone tasks that need full attention if possible.'),
    threshold('kss_seven', 'gte', 7, 'advisory', team('KSS 7 como Advisory é decisão da equipe.'), 'You are feeling sleepy. Take a short break and get some light and movement.'),
  ] },
  fatigue_samn_perelli: { rules: [
    threshold('samn_seven', 'gte', 7, 'warning', source('samn', 'A própria escala descreve 7 como "performance definitely impaired"; nível Warning é decisão da equipe.'), 'You reported that your performance is impaired. Do not start critical tasks. Talk to your Crew Medical Officer now.'),
    threshold('samn_five', 'gte', 5, 'caution', source('samn', 'Valores 5 e 6 conforme pesquisa; nível Caution é decisão da equipe, extrapolação de aviação.'), 'Moderate to severe fatigue. Rest before demanding tasks if possible.'),
    threshold('samn_four', 'gte', 4, 'advisory', source('samn', 'Valor 4 conforme pesquisa; nível Advisory é decisão da equipe.'), 'You reported mild fatigue. Pace your workload and take short breaks.'),
  ] },
  stress: personalScore('above', 'Your stress is higher than usual today.', 'Stress higher than usual for 3 days. Exercise, journaling, a call with loved ones or a private talk with the flight surgeon can help.'),
  mood_score: personalScore('below', 'Your mood is lower than usual today.', 'Mood lower than usual for 3 days. Free time, contact with family and friends, and time with the crew can help.'),
  pvt_response_speed: personalTest('below', 'caution', 'Your reaction speed is below your usual range. Check how you slept and consider a recheck before critical tasks.'),
  pvt_lapses: personalTest('above', 'advisory', 'More attention lapses than usual.'),
  pvt_false_starts: { rules: [], note: 'Sem corte de acompanhamento proposto na pesquisa; apresentar contagem.' },
};
