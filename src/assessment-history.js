import { createHash } from 'node:crypto';
import { datasetFor, evaluateArea } from './evaluation.js';

function fingerprint(record) {
  return [record.indicator, record.value, record.unit, Date.parse(record.recordedAt),
    record.source, Date.parse(record.periodStart), record.context ? Object.entries(record.context).sort(([a],[b]) => a.localeCompare(b)) : null];
}
export function newAssessments(records, operations, history, batch, newOperations, time) {
  const known = new Set(history.map(item => item.id));
  const byId = new Map(records.map(r => [r.id,r]));
  const targets = new Map();
  const touch = (astronautId, source, area, recordId, operationId) => {
    const dataset = datasetFor(source), key = JSON.stringify([astronautId,dataset,area]);
    if (!targets.has(key)) targets.set(key,{ ctx:{astronautId,dataset}, area, records:new Set(), operations:new Set() });
    if (recordId) targets.get(key).records.add(recordId);
    if (operationId) targets.get(key).operations.add(operationId);
  };
  for (const r of batch) touch(r.astronautId,r.source,r.areaId,r.id);
  for (const o of newOperations) {
    if (o.kind === 'vitals') touch(o.astronautId,o.source,'gravity_fields',null,o.id);
    if (o.kind === 'reference' || o.kind === 'mission') {
      touch(o.astronautId,o.source,'gravity_fields',null,o.id);
      if (o.kind === 'mission') touch(o.astronautId,o.source,'radiation',null,o.id);
    }
    if (o.kind === 'radiation' && o.input.scope === 'prior_spaceflight') touch(o.astronautId,o.source,'radiation',null,o.id);
  }
  const added = [];
  for (const target of targets.values()) {
    for (const item of evaluateArea(target.area,records,operations,target.ctx,time)) {
      if (!item.recordIds?.some(id => target.records.has(id)) && ![item.operationId,item.referenceId,item.missionContextId,item.context?.missionContextId].some(id => target.operations.has(id))) continue;
      const evidence = (item.recordIds ?? []).map(id => byId.get(id)).filter(Boolean).map(fingerprint);
      const signature = [target.ctx,target.area,item.indicator,item.rule.id,item.rule.version,item.status,item.level,
        item.referenceId,item.missionContextId ?? item.context?.missionContextId,item.rule.id === 'news2_scale_1' && !evidence.length ? item.operationId : null,
        item.source,item.context?.missionId,item.context?.activity,item.context?.location,item.missing,evidence.map(r => JSON.stringify(r)).sort()];
      const id = createHash('sha256').update(JSON.stringify(signature)).digest('hex');
      if (known.has(id)) continue;
      known.add(id);
      added.push({ ...item, id, evaluatedAt:new Date(time).toISOString(), followUp:item.level ? 'in_observation' : 'recorded' });
    }
  }
  return added;
}

export function observationList(history) {
  const active = new Map();
  for (const item of history) {
    if (!item.level) continue;
    const context = item.context ?? {};
    const key = JSON.stringify([item.areaId,item.indicator,item.source,context.location,context.missionId,context.method]);
    active.set(key,{ ...item, since:active.get(key)?.since ?? item.evaluatedAt });
  }
  return [...active.values()];
}
