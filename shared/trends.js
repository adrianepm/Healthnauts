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
    if (def.valueType === 'text' || def.dynamicUnit) return { ...base, status: 'not_applicable', message: 'Text reports are available in the history. There is no numeric comparison.' };
    if (!previous) return { ...base, status: 'insufficient_history', message: 'Not enough history: two comparable records at different times are needed in this period.' };
    const delta = Number((latest.value - previous.value).toPrecision(12));
    return { ...base, previousRecordId: previous.id, delta, direction: delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'unchanged',
      status: 'available', message: `The${source === 'simulated' ? ' simulated' : ''} value went from ${previous.value} to ${latest.value}${def.unit ? ` ${def.unit}` : ' on the prototype scale'}. Point comparison, with no clinical or statistical inference.` };
  }));
}
