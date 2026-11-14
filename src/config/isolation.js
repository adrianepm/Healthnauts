// Research references, not clinical validation of the demonstration's rules.
export const isolationReferences = {
  rst: { title: 'Jones et al. 2022 — Sleep deficiency on the ISS', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/' },
  planning: { title: 'NASA — Medical operations and sleep planning', url: 'https://www.nasa.gov/reference/6-0-medical-operations/' },
  kss: { title: 'Arsintescu et al. 2019 — referência KSS citada na pesquisa', url: 'https://hsi.arc.nasa.gov/publications/Arsintescu_etal_2019_JoVE.pdf', note: 'Link redireciona; confirmar publicação e autorização do texto completo antes de uso real.' },
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
const personal = (direction, consecutive, minSamples = 7) => ({
  baseline: { ...personalBaseline, minSamples },
  rules: [{ id: 'personal_range', version: 1, kind: 'personal_range', direction, consecutive, level: 'attention',
    ...team(`Comparação com faixa pessoal por ${consecutive} ${consecutive === 1 ? 'teste' : 'dias consecutivos'}. Amostra mínima de ${minSamples} dias é escolha da equipe.`),
    message: 'This result differs from the demonstration personal range. Review the trend with the crew.' }],
});
const threshold = (id, operator, value, level, provenance, message, consecutive = 1) => ({
  id, version: 1, kind: 'threshold', operator, value, level, consecutive, ...provenance, message,
});
export const isolationMonitoring = {
  sleep_duration: { rules: [
    threshold('sleep_four_hours', 'lte', 4, 'risk', team('Corte de 4 h e nível demonstrativo escolhidos pela equipe; associação descrita em [1].'), 'Recorded sleep was four hours or less. Review the sleep log with the crew.'),
    threshold('sleep_three_nights', 'lte', 6, 'attention', team('Três noites consecutivas de até 6 h: decisão da equipe.'), 'Three consecutive sleep records were six hours or less. Review the sleep trend.', 3),
    threshold('sleep_six_hours', 'lte', 6, 'attention', source('rst', 'Associação com sono curto na pesquisa; nível de acompanhamento é demonstrativo, não corte médico.'), 'Recorded sleep was six hours or less. Review the sleep log.'),
  ] },
  sleep_quality: personal('outside', 3),
  sleepiness_kss: { rules: [
    threshold('kss_eight', 'gte', 8, 'risk', source('kss', 'Limiar citado no documento de pesquisa, em contexto de aviação/direção; não validado para esta aplicação espacial.'), 'The reported sleepiness score is in the upper demonstration band.'),
    threshold('kss_seven', 'gte', 7, 'attention', team('KSS 7 como nível de observação é decisão da equipe.'), 'The reported sleepiness score triggered demonstration follow-up.'),
  ] },
  fatigue_samn_perelli: { rules: [
    threshold('samn_five', 'gte', 5, 'risk', source('samn', 'Agrupamento 5–7 conforme pesquisa; nível demonstrativo, extrapolação de aviação.'), 'The reported fatigue score is in the upper demonstration band.'),
    threshold('samn_four', 'gte', 4, 'attention', source('samn', 'Valor 4 conforme pesquisa; classificação apenas demonstrativa.'), 'The reported fatigue score triggered demonstration follow-up.'),
  ] },
  stress: personal('above', 3),
  mood_score: personal('below', 3),
  pvt_response_speed: personal('below', 1, 2),
  pvt_lapses: personal('above', 1, 2),
  pvt_false_starts: { rules: [], note: 'Sem corte de acompanhamento proposto na pesquisa; apresentar contagem.' },
};
