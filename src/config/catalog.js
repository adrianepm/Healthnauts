const indicator = (id, label, unit, recordKind, description, extra = {}) => ({
  id, label, valueType: unit === null ? 'text' : 'number', unit,
  displayUnit: unit === 'Cel' ? '°C' : unit, recordKind, description, scale: null, ...extra,
});
const scale = (id, label, minLabel, maxLabel) => indicator(id, label, null, 'self_report',
  'Escala demonstrativa, não é instrumento clínico validado.', {
    valueType: 'scale', scale: { min: 1, max: 5, step: 1, minLabel, maxLabel },
  });
export const catalog = {
  radiation: [
    indicator('dose_rate', 'Taxa de dose', 'uSv/h', 'environmental_exposure', 'Taxa no instante observado; não representa dose acumulada.'),
    indicator('accumulated_dose', 'Dose acumulada', 'uSv', 'environmental_exposure', 'Total entre periodStart e recordedAt; não somar totais sobrepostos.', { periodStartRequired: true }),
  ],
  isolation_confinement: [
    indicator('sleep_duration', 'Sono', 'h', 'self_report', 'Duração do último episódio de sono.', { allowsPeriodStart: true }),
    scale('fatigue', 'Fadiga', 'Pouca fadiga percebida', 'Muita fadiga percebida'),
    scale('mood', 'Humor', 'Muito negativo', 'Muito positivo'),
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
