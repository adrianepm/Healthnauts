import { restrictedExport, rules } from './config/research.js';
import { inDataset } from './research-operations.js';

// Relatório para a Terra simulado (especificação v2, 3.7). Tudo roda no mesmo navegador ou servidor:
// nenhuma telemetria real sai do aparelho. O status é calculado pelo relógio.
export const groundReply = 'Flight surgeon reviewed your report. Continue the onboard procedure and send new vitals in 30 min.';
export const noContactMessage = rules.comm.messages.advisory;
export const transmissionSource = { classification: 'team_proposal',
  section: 'Simulated transmission: arrival = sent + one-way delay; reply = sent + 2 × one-way delay + 15 min (Parisi et al. 2023).',
  url: 'https://ntrs.nasa.gov/api/citations/20230010972/downloads/Proof_Slides_Parisi_Megan_797.pdf' };

const at = operation => Date.parse(operation.input.recordedAt);
const iso = ms => new Date(ms).toISOString();
export const missionTimeline = (operations, ctx) => operations.flatMap(o => [o, ...(o.children ?? [])])
  .filter(o => o.kind === 'mission' && o.astronautId === ctx.astronautId && inDataset(o, ctx.dataset)).sort((a, b) => at(a) - at(b));

function describe(mission) {
  if (!mission) return { status: 'unknown', missionId: null, destination: null, activity: null, oneWaySeconds: null, processingSeconds: null, estimatedResponseSeconds: null };
  const { missionId, destination, activity, communication, oneWaySeconds } = mission.input;
  const processingSeconds = mission.calculation?.processingSeconds ?? rules.comm.processingSeconds;
  return { status: communication, missionId, destination, activity, oneWaySeconds, processingSeconds, since: mission.input.recordedAt,
    estimatedResponseSeconds: communication === 'unavailable' ? null : 2 * oneWaySeconds + processingSeconds };
}
export function linkAt(missions, time) {
  const link = describe(missions.findLast(m => at(m) <= time));
  return { ...link, message: link.status === 'unavailable' ? noContactMessage : link.status === 'unknown' ? 'No mission context recorded.' : null };
}

// QUEUED -> SENT -> RECEIVED -> REPLIED. Sem link com a Terra o relatório fica QUEUED até o link voltar.
function transmission(createdAt, missions, time) {
  const created = Date.parse(createdAt), now = linkAt(missions, time);
  let link = linkAt(missions, created), sentAt = null;
  if (link.status !== 'unavailable' && link.status !== 'unknown') sentAt = created;
  else {
    const restored = missions.find(m => at(m) > created && at(m) <= time && m.input.communication !== 'unavailable');
    if (restored) { link = describe(restored); sentAt = at(restored); }
  }
  if (sentAt === null) return { status: 'QUEUED', linkStatus: now.status, queuedAt: createdAt, sentAt: null, oneWaySeconds: null,
    expectedArrivalAt: null, expectedReplyAt: null, receivedAt: null, repliedAt: null, reply: null,
    message: now.status === 'unknown' ? 'No mission context recorded. The report stays queued.' : noContactMessage };
  const arrival = sentAt + link.oneWaySeconds * 1000, reply = sentAt + (2 * link.oneWaySeconds + link.processingSeconds) * 1000;
  const status = time >= reply ? 'REPLIED' : time >= arrival ? 'RECEIVED' : 'SENT';
  return { status, linkStatus: now.status, queuedAt: createdAt, sentAt: iso(sentAt), oneWaySeconds: link.oneWaySeconds, processingSeconds: link.processingSeconds,
    expectedArrivalAt: iso(arrival), expectedReplyAt: iso(reply), receivedAt: status === 'SENT' ? null : iso(arrival),
    repliedAt: status === 'REPLIED' ? iso(reply) : null, reply: status === 'REPLIED' ? groundReply : null,
    message: `Follow the onboard procedure now. A report has been sent to the flight surgeon. Expected reply in about ${Math.ceil((reply - sentAt) / 60000)} minutes.` };
}

// Parâmetros em Caution ou acima no momento do relatório. Humor e estresse nunca são exportados.
const parametersAt = (alerts, createdAt) => alerts.filter(a => !restrictedExport.has(a.indicator) && Date.parse(a.shownAt) <= Date.parse(createdAt) &&
  (!a.resolvedAt || Date.parse(a.resolvedAt) > Date.parse(createdAt))).map(a => ({ alertId: a.id, areaId: a.areaId, indicator: a.indicator,
  level: a.level, value: a.value, unit: a.unit, measuredAt: a.recordedAt, receivedAt: a.lastEvaluatedAt, message: a.message }));

export function buildGroundReports({ alerts, stored, operations, ctx, time }) {
  const missions = missionTimeline(operations, ctx);
  const report = (base, sources = []) => {
    const link = linkAt(missions, Date.parse(base.createdAt));
    const statuses = sources.map(a => a.acknowledgementStatus);
    // Basta um alerta sem confirmação no prazo para o relatório levar a marca "not acknowledged".
    const status = !sources.length ? 'not_required' : statuses.includes('not_acknowledged') ? 'not_acknowledged'
      : statuses.every(s => s === 'acknowledged') ? 'acknowledged' : statuses.includes('pending') ? 'pending' : 'resolved_before_acknowledgement';
    return { ...base, astronautId: ctx.astronautId, dataset: ctx.dataset,
      mission: { missionId: link.missionId, destination: link.destination, activity: link.activity },
      parameters: parametersAt(alerts, base.createdAt),
      acknowledgement: { status, alerts: sources.map(a => ({ alertId: a.id, indicator: a.indicator, status: a.acknowledgementStatus,
        acknowledgedAt: a.acknowledgedAt, escalatedTo: a.escalatedTo })),
        ...(status === 'not_acknowledged' ? { mark: 'not acknowledged', note: sources[0].acknowledgementNote } : {}) },
      notAcknowledged: status === 'not_acknowledged', transmission: transmission(base.createdAt, missions, time), isSimulation: true };
  };
  const grouped = Map.groupBy(alerts.filter(a => a.requiresAcknowledgement && !restrictedExport.has(a.indicator)), a => a.groundReportId);
  const automatic = [...grouped.entries()].map(([id, sources]) => {
    const level = sources.some(a => a.acknowledgementLevel === 'emergency') ? 'emergency' : 'warning';
    return report({ id, kind: 'automatic', alertIds: sources.map(a => a.id), createdAt: sources[0].acknowledgementRequiredAt,
      level, immediate: level === 'emergency', actions: [] }, sources);
  });
  const manual = stored.filter(r => r.astronautId === ctx.astronautId && r.dataset === ctx.dataset && Date.parse(r.createdAt) <= time)
    .map(r => report({ id: r.id, kind: 'manual', alertIds: [], createdAt: r.createdAt, level: null, immediate: false,
      actions: r.input.actions, note: r.input.note ?? null }));
  return [...automatic, ...manual].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
