// Comparação descritiva do valor atual com a média dos últimos 7 dias (sem hoje), como useArea.avg7 e compareItem.
// Arquivo PURO (testado em Node). Só diz para onde o valor andou; nunca é nível nem diz se é bom ou ruim.

export interface WeekCompare {
  /** Média dos registros numéricos dos 7 dias antes de hoje. */
  avg: number;
  /** Valor atual − média. */
  diff: number;
  direction: 'up' | 'down' | 'same';
  /** Quantos registros entraram na média. */
  count: number;
}

export interface SeriesRecord { indicator: string; value: unknown; recordedAt: string }

const DAY_MS = 86400000;

/**
 * `current`: valor mostrado no painel. `records`: histórico devolvido pela API. `today0`: meia-noite local de hoje (ms).
 * Sem valor atual numérico ou sem registro nos 7 dias = null (o painel não mostra seta).
 * "same" quando a diferença some no arredondamento que a tela usa (`digits`).
 */
export function weekCompare(current: unknown, records: SeriesRecord[], indicator: string, today0: number, digits = 1): WeekCompare | null {
  if (typeof current !== 'number' || !Number.isFinite(current)) return null;
  const from = today0 - 7 * DAY_MS;
  const xs = records
    .filter((r) => r.indicator === indicator)
    .filter((r) => { const t = Date.parse(r.recordedAt); return t >= from && t < today0; })
    .map((r) => Number(r.value))
    .filter(Number.isFinite);
  if (!xs.length) return null;
  const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
  const diff = current - avg;
  const shown = Number(diff.toFixed(digits));
  return { avg, diff, count: xs.length, direction: shown > 0 ? 'up' : shown < 0 ? 'down' : 'same' };
}
