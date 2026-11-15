// "My panels" da Overview: escolha, limite, padrão, ordem e gravação. Arquivo PURO (testado em Node).
// A lista de indicadores vem do catálogo e das avaliações que a API devolve; aqui não se cria indicador nem nível.
import type { DisplayLevel } from '../services/api';

export const MAX_PANELS = 10;
export const PANELS_KEY = 'healthnauts:panels';

/** Id de um painel: área + indicador (o mesmo indicador nunca se repete entre áreas, mas o id fica explícito). */
export const panelId = (areaId: string, indicator: string) => `${areaId}:${indicator}`;

/** Sem escolha salva: no máximo 6, um indicador-chave por área (sinais vitais contam como área), sem repetir. */
export const DEFAULT_PANELS: string[] = [
  panelId('isolation_confinement', 'sleep_duration'),
  panelId('gravity_fields', 'heart_rate'),
  panelId('hostile_closed_environment', 'co2_partial_pressure'),
  panelId('radiation', 'career_effective_dose'),
  panelId('gravity_fields', 'aerobic_capacity'),
  panelId('distance_from_earth', 'communication_delay'),
];

/**
 * Indicadores que repetem a informação de outro: no Customize aparece só o que cobre (com "Includes …"),
 * e uma escolha salva antiga com o coberto passa para o que cobre.
 * Temperatura e umidade = temperature_humidity; CO₂ em ppm = a mesma leitura em mmHg; fração e pressão seca de O₂ entram no PIO₂.
 */
export const COVERED_BY: Record<string, string> = {
  temperature: 'temperature_humidity',
  relative_humidity: 'temperature_humidity',
  co2_concentration: 'co2_partial_pressure',
  oxygen_fraction: 'inspired_oxygen_pressure',
  oxygen_partial_pressure: 'inspired_oxygen_pressure',
};
const indicatorOf = (id: string) => id.slice(id.indexOf(':') + 1);
const areaOf = (id: string) => id.slice(0, id.indexOf(':'));

/** Troca coberto pelo que cobre, tira repetidos e corta no limite. */
export function normalizePanels(ids: string[]): string[] {
  const out = ids.map((id) => { const c = COVERED_BY[indicatorOf(id)]; return c ? panelId(areaOf(id), c) : id; });
  return [...new Set(out)].slice(0, MAX_PANELS);
}

/** Mais grave primeiro: Emergency > Warning > Caution > Unavailable > Advisory > Normal; sem nível (nem do grupo) por último. */
const RANK: Record<DisplayLevel, number> = { emergency: 0, warning: 1, caution: 2, unavailable: 3, advisory: 4, normal: 5 };
export const panelRank = (level: DisplayLevel | null) => (level ? RANK[level] : 6);

/** Ordena pela gravidade; empate fica na ordem escolhida pela pessoa. */
export function sortPanels<T extends { id: string; level: DisplayLevel | null }>(panels: T[], chosen: string[]): T[] {
  const pos = (id: string) => { const i = chosen.indexOf(id); return i < 0 ? chosen.length : i; };
  return [...panels].sort((a, b) => panelRank(a.level) - panelRank(b.level) || pos(a.id) - pos(b.id));
}

/** Marca ou desmarca; ao chegar no limite, não acrescenta mais nada. */
export function togglePanel(chosen: string[], id: string, max = MAX_PANELS): string[] {
  if (chosen.includes(id)) return chosen.filter((x) => x !== id);
  return chosen.length >= max ? chosen : [...chosen, id];
}

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const store = (s?: KV): KV | null => { try { return s ?? globalThis.localStorage ?? null; } catch { return null; } };

/** Escolha salva ou o padrão. localStorage pode faltar ou falhar (modo privado): vale o padrão. */
export function loadPanels(storage?: KV): string[] {
  try {
    const raw = store(storage)?.getItem(PANELS_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return normalizePanels(v);
  } catch { /* usa o padrão */ }
  return [...DEFAULT_PANELS];
}

export function savePanels(chosen: string[], storage?: KV) {
  try { store(storage)?.setItem(PANELS_KEY, JSON.stringify(normalizePanels(chosen))); } catch { /* vale só nesta sessão */ }
}

export function clearPanels(storage?: KV) {
  try { store(storage)?.removeItem(PANELS_KEY); } catch { /* nada salvo */ }
}
