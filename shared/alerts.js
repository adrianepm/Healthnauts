import { acknowledgement, assessedStatuses, atLeast, rank } from './config/levels.js';

const iso = ms => new Date(ms).toISOString();
// Identidade de uma condição acompanhada. Na cabine o protótipo monitora um único volume:
// uma leitura nova de qualquer local substitui a anterior do mesmo indicador.
export function alertKey(item) {
  const context = item.context ?? {};
  const cabin = item.areaId === 'hostile_closed_environment';
  return JSON.stringify([item.areaId, item.indicator, item.source, cabin ? null : context.location,
    context.missionId, context.method, item.indicator === 'cabin_noise' ? context.activity : null]);
}
// Entre avaliações da mesma condição, fica a de leitura mais recente.
export function currentAssessments(assessments) {
  const latest = new Map(), when = item => item.recordedAt ? Date.parse(item.recordedAt) : -Infinity;
  for (const item of assessments) {
    const key = alertKey(item), previous = latest.get(key);
    if (!previous || when(item) >= when(previous)) latest.set(key, item);
  }
  return [...latest.values()];
}

// Monta o ciclo de vida dos alertas (Caution ou acima) a partir do histórico de avaliações.
// Nada é gravado aqui: prazo, escalonamento e resolução são calculados pelo relógio.
export function buildAlerts(history, acknowledgements, time) {
  const open = new Map(), alerts = [];
  for (const item of history) {
    const evaluatedAt = Date.parse(item.evaluatedAt);
    if (evaluatedAt > time) continue;
    const key = alertKey(item), current = open.get(key);
    if (atLeast(item.level, 'caution')) {
      const alert = current ?? { id: item.id, astronautId: item.astronautId, dataset: item.dataset, areaId: item.areaId,
        indicator: item.indicator, group: item.group ?? null, shownAt: item.evaluatedAt, active: true, resolvedAt: null,
        level: null, peakLevel: null, ackLevel: null, ackSince: null, assessmentIds: [] };
      if (!current) { open.set(key, alert); alerts.push(alert); }
      if (item.level !== alert.level) alert.levelSince = item.evaluatedAt;
      // O prazo de confirmação recomeça quando o alerta sobe para um nível mais grave.
      if (atLeast(item.level, acknowledgement.requiredFrom) && rank(item.level) > rank(alert.ackLevel)) {
        alert.ackLevel = item.level; alert.ackSince = item.evaluatedAt;
      }
      Object.assign(alert, { level: item.level, peakLevel: rank(item.level) > rank(alert.peakLevel) ? item.level : alert.peakLevel,
        message: item.message, value: item.value ?? item.score ?? item.observedValue ?? null, unit: item.unit ?? null,
        recordedAt: item.recordedAt, lastEvaluatedAt: item.evaluatedAt, context: item.context ?? null,
        rule: { id: item.rule.id, version: item.rule.version, source: item.rule.source, levelSource: item.rule.levelSource ?? null } });
      alert.assessmentIds.push(item.id);
    } else if (current && assessedStatuses.includes(item.status)) {
      // Só uma avaliação válida abaixo de Caution encerra o alerta; dado indisponível não encerra.
      current.active = false; current.resolvedAt = item.evaluatedAt;
      open.delete(key);
    }
  }
  // Alertas que passaram a exigir confirmação no mesmo instante vão no mesmo relatório para a Terra.
  const reportIds = new Map();
  for (const alert of alerts) if (alert.ackLevel && !reportIds.has(alert.ackSince)) reportIds.set(alert.ackSince, 'gr-' + alert.id.slice(0, 32));
  return alerts.map(alert => {
    const { ackLevel, ackSince, ...rest } = alert;
    const ack = acknowledgements.find(a => a.alertId === alert.id && a.astronautId === alert.astronautId &&
      a.dataset === alert.dataset && Date.parse(a.acknowledgedAt) <= time);
    if (!ackLevel) return { ...rest, requiresAcknowledgement: false, acknowledgementStatus: 'not_required', acknowledgedAt: null,
      acknowledgeBy: null, escalatedTo: null, escalatedAt: null, groundReportId: null };
    const due = Date.parse(ackSince) + acknowledgement.deadlineMs[ackLevel];
    const acknowledgedAt = ack ? Date.parse(ack.acknowledgedAt) : Infinity;
    const resolvedAt = alert.resolvedAt ? Date.parse(alert.resolvedAt) : Infinity;
    const escalated = time > due && acknowledgedAt > due && resolvedAt > due;
    return { ...rest, requiresAcknowledgement: true, acknowledgementLevel: ackLevel, acknowledgementRequiredAt: ackSince,
      acknowledgedAt: ack?.acknowledgedAt ?? null, acknowledgeBy: iso(due),
      acknowledgementStatus: ack ? 'acknowledged' : escalated ? 'not_acknowledged' : alert.active ? 'pending' : 'resolved_before_acknowledgement',
      escalatedTo: escalated ? acknowledgement.escalatedTo : null, escalatedAt: escalated ? iso(due) : null,
      alsoNotified: escalated ? acknowledgement.alsoNotified : [], acknowledgementNote: acknowledgement.note,
      groundReportId: reportIds.get(ackSince) };
  });
}
