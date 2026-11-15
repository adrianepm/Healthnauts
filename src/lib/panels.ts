// "My panels" da Overview: escolha, limite, padrão, ordem e gravação. Arquivo PURO (testado em Node).
// A lista de indicadores vem do catálogo e das avaliações que a API devolve; aqui não se cria indicador nem nível.
import type { DisplayLevel } from '../services/api';

export const MAX_PANELS = 10;
export const PANELS_KEY = 'healthnauts:panels';

/** Id de um painel: área + indicador (o mesmo indicador nunca se repete entre áreas, mas o id fica explícito). */
export const panelId = (areaId: string, indicator: string) => `${areaId}:${indicator}`;

/** Sem escolha salva: um indicador-chave por área. */
export const DEFAULT_PANELS: string[] = [
  panelId('isolation_confinement', 'sleep_duration'),
  panelId('isolation_confinement', 'stress'),
  panelId('gravity_fields', 'heart_rate'),
  panelId('hostile_closed_environment', 'co2_partial_pressure'),
  panelId('radiation', 'career_effective_dose'),
  panelId('gravity_fields', 'aerobic_capacity'),
  panelId('distance_from_earth', 'communication_delay'),
];

/** Mais grave primeiro: Emergency > Warning > Caution > Unavailable > Advisory > Normal; sem avaliação da API por último. */
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
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return [...new Set(v)].slice(0, MAX_PANELS);
  } catch { /* usa o padrão */ }
  return [...DEFAULT_PANELS];
}

export function savePanels(chosen: string[], storage?: KV) {
  try { store(storage)?.setItem(PANELS_KEY, JSON.stringify(chosen.slice(0, MAX_PANELS))); } catch { /* vale só nesta sessão */ }
}

export function clearPanels(storage?: KV) {
  try { store(storage)?.removeItem(PANELS_KEY); } catch { /* nada salvo */ }
}
