export const chronological = (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || a.id.localeCompare(b.id);
export function trends(records, definitions, dataset) {
  return definitions.flatMap(def => (dataset === 'simulated' ? ['simulated'] : ['manual', 'sensor']).map(source => {
    const series = records.filter(r => r.indicator === def.id && r.source === source && r.unit === def.unit).sort(chronological);
    const latest = series.at(-1);
    // Compare to the latest observation's accumulation interval, never to a different reset.
    const previous = latest && series.findLast(r => Date.parse(r.recordedAt) < Date.parse(latest.recordedAt)
      && ['missionId','method','activity','evaEnvironment','location','environment','position','assessment'].every(key => r.context?.[key] === latest.context?.[key])
      && (def.id !== 'accumulated_dose' || Date.parse(r.periodStart) === Date.parse(latest.periodStart)));
    const base = { indicator: def.id, source, isSimulated: source === 'simulated', unit: def.unit,
      method: def.valueType === 'text' ? null : 'latest_pair_difference', latestRecordId: latest?.id ?? null,
      previousRecordId: null, delta: null, direction: null };
    if (def.valueType === 'text' || def.dynamicUnit) return { ...base, status: 'not_applicable', message: 'Relatos textuais estão disponíveis no histórico; não há comparação numérica.' };
    if (!previous) return { ...base, status: 'insufficient_history', message: 'Histórico insuficiente: faltam dois registros comparáveis em instantes distintos no período consultado.' };
    const delta = Number((latest.value - previous.value).toPrecision(12));
    return { ...base, previousRecordId: previous.id, delta, direction: delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'unchanged',
      status: 'available', message: `O valor${source === 'simulated' ? ' simulado' : ''} passou de ${previous.value} para ${latest.value}${def.unit ? ` ${def.unit}` : ' na escala demonstrativa'}. Comparação pontual, sem inferência clínica ou estatística.` };
  }));
}
