import { dailyCollection, pvtCollection, isolationMonitoring, isolationReferences as refs } from './isolation.js';
const indicator = (id, label, unit, recordKind, description, extra = {}) => ({
  id, label, valueType: unit === null ? 'text' : 'number', unit,
  displayUnit: unit === 'Cel' ? '°C' : unit, recordKind, description, scale: null, ...extra,
});
const scale = (id, label, minLabel, maxLabel) => indicator(id, label, null, 'self_report',
  'Escala demonstrativa, não é instrumento clínico validado.', {
    valueType: 'scale', scale: { min: 1, max: 5, step: 1, numericType: 'integer', precision: 0, minLabel, maxLabel },
  });
const mind = (id, label, unit, description, constraints, extra = {}) => indicator(id, label, unit, 'self_report', description, {
  valueType: 'scale', scale: constraints, collection: dailyCollection, monitoring: isolationMonitoring[id],
  references: [refs.rst], ...extra,
});
const score = { min: 0, max: 100, numericType: 'number', precision: 2, step: 0.01 };
const pvt = (id, label, unit, description, constraints) => mind(id, label, unit, description, constraints, {
  valueType: 'number', recordKind: 'performance_aggregate', collection: pvtCollection,
  groupRequired: true, aggregateGroup: 'pvt_b', references: [refs.pvt, refs.rst],
});
export const pvtIndicators = ['pvt_response_speed', 'pvt_lapses', 'pvt_false_starts'];
export const catalog = {
  radiation: [
    indicator('dose_rate', 'Taxa de dose', 'uSv/h', 'environmental_exposure', 'Taxa no instante observado; não representa dose acumulada.'),
    indicator('accumulated_dose', 'Dose acumulada', 'uSv', 'environmental_exposure', 'Total entre periodStart e recordedAt; não somar totais sobrepostos.', { periodStartRequired: true }),
  ],
  isolation_confinement: [
    mind('sleep_duration', 'Duração do sono', 'h', 'Total calculado no front-end: (levantar − deitar − latência para dormir − tempo acordado à noite), convertido em horas. Usar datas com fuso e tratar a passagem da meia-noite. Enviar apenas o total; não guardar componentes em notes.',
      { min: 0, max: 24, numericType: 'number', precision: 2, step: 0.01 }, {
        valueType: 'number', allowsPeriodStart: true, references: [refs.rst, refs.planning],
        calculation: { performedBy: 'frontend', formula: '(wakeAt - bedAt) / 3600000 - (sleepLatencyMinutes + awakeMinutes) / 60',
          components: [
            { name: 'bedAt', description: 'Data e horário de deitar com fuso.' },
            { name: 'wakeAt', description: 'Data e horário de levantar com fuso.' },
            { name: 'sleepLatencyMinutes', unit: 'min', description: 'Tempo até adormecer.' },
            { name: 'awakeMinutes', unit: 'min', description: 'Total acordado durante a noite.' },
          ], storedComponents: false },
      }),
    mind('sleep_quality', 'Qualidade do sono', null, 'Avaliação pessoal 0–100; rótulos próprios: menor/maior qualidade percebida.', score),
    mind('sleepiness_kss', 'Sonolência — referência KSS', null, 'Valores 1–9 da escala referenciada; rótulos próprios resumidos, não o texto oficial.',
      { min: 1, max: 9, numericType: 'integer', precision: 0, step: 1, minLabel: 'Menor sonolência', maxLabel: 'Maior sonolência' },
      { references: [refs.kss], usage: { fullTextIncluded: false, permissionStatus: 'confirmation_required', note: 'Confirmar autorização de uso com os autores antes de incorporar o texto completo KSS.' } }),
    mind('fatigue_samn_perelli', 'Fadiga — referência Samn–Perelli', null, 'Autorrelato 1–7; rótulos próprios resumidos.',
      { min: 1, max: 7, numericType: 'integer', precision: 0, step: 1, minLabel: 'Menor fadiga', maxLabel: 'Maior fadiga' }, { references: [refs.samn] }),
    mind('stress', 'Estresse', null, 'Intensidade percebida 0–100.', score, { references: [refs.rst, refs.behavioral], privacy: { intendedAudience: ['astronaut', 'crew_medical_officer'], enforced: false } }),
    mind('mood_score', 'Humor', null, 'Avaliação pessoal 0–100: de menos positivo a mais positivo.', score, { references: [refs.behavioral], privacy: { intendedAudience: ['astronaut', 'crew_medical_officer'], enforced: false } }),
    pvt('pvt_response_speed', 'PVT-B — velocidade média', '1/s', 'Média de 1/RT, RT em segundos, calculada pelo front-end com performance.now(); não é 1/média(RT). Excluir falsos inícios (<100 ms ou toque sem estímulo); timeout de 30 s entra como RT de 30 s. Sem respostas válidas, não enviar execução.',
      { min: 0, max: 10, numericType: 'number', precision: 4, step: 0.0001 }),
    pvt('pvt_lapses', 'PVT-B — lapsos', 'count', 'Contagem agregada de respostas ≥355 ms, incluindo ausência de resposta em 30 s.',
      { min: 0, numericType: 'integer', precision: 0, step: 1 }),
    pvt('pvt_false_starts', 'PVT-B — falsos inícios', 'count', 'Contagem agregada de respostas <100 ms ou toques sem estímulo; excluídos da velocidade média.',
      { min: 0, numericType: 'integer', precision: 0, step: 1 }),
    { ...scale('fatigue', 'Fadiga (legado)', 'Pouca fadiga percebida', 'Muita fadiga percebida'), deprecated: true, replacedBy: 'fatigue_samn_perelli', description: 'Escala demonstrativa antiga 1–5, preservada sem conversão; não é Samn–Perelli.' },
    { ...scale('mood', 'Humor (legado)', 'Muito negativo', 'Muito positivo'), deprecated: true, replacedBy: 'mood_score', description: 'Escala demonstrativa antiga 1–5, preservada sem conversão; não comparar com humor 0–100.', privacy: { intendedAudience: ['astronaut', 'crew_medical_officer'], enforced: false } },
  ],
  distance_from_earth: [
    indicator('communication_delay', 'Atraso de comunicação', 's', 'operational_context', 'Atraso de ida; contexto operacional, não medida clínica.'),
    indicator('onboard_medical_resources', 'Recursos médicos a bordo', null, 'operational_context', 'Inventário descritivo; não avalia capacidade de tratamento.'),
  ],
  gravity_fields: [
    indicator('heart_rate', 'Frequência cardíaca', 'bpm', 'measurement', 'Frequência no instante observado; descreva o contexto nas notas.'),
    indicator('blood_pressure_systolic', 'Pressão sistólica', 'mmHg', 'measurement', 'Componente sistólico; groupId associa o par da mesma observação.'),
    indicator('blood_pressure_diastolic', 'Pressão diastólica', 'mmHg', 'measurement', 'Componente diastólico; groupId associa o par da mesma observação.'),
    indicator('exercise_duration', 'Exercício', 'min', 'self_report', 'Duração de uma sessão, sem prescrição.', { allowsPeriodStart: true }),
    indicator('balance_vision_symptoms', 'Equilíbrio e visão', null, 'self_report', 'Descrição pessoal; sem inferência de causa.'),
  ],
  hostile_closed_environment: [
    indicator('co2_concentration', 'Concentração de CO₂', 'ppm', 'environmental_exposure', 'Concentração ambiental no ponto de medição.'),
    indicator('temperature', 'Temperatura', 'Cel', 'environmental_exposure', 'Temperatura ambiental no ponto de medição.'),
    indicator('relative_humidity', 'Umidade relativa', '%', 'environmental_exposure', 'Umidade relativa ambiental.'),
    indicator('reported_symptoms', 'Sintomas relatados', null, 'self_report', 'Relato textual, sem associar causa às condições ambientais.'),
  ],
};
