// Cor, rótulo e ícone de cada nível (especificação 2.1). Cor e rótulo vêm de shared/config/levels.js,
// a mesma tabela que a API devolve em /overview → levels. Aqui só se liga o nome do ícone ao componente.
import { CircleCheck, CircleDashed, Info, OctagonAlert, Siren, TriangleAlert, type LucideIcon } from 'lucide-react';
import { levels, neutralChartColor, rank } from '../../shared/config/levels.js';
import type { AlertLevel, DisplayLevel } from '../services/api';

const ICONS: Record<string, LucideIcon> = { CircleCheck, Info, TriangleAlert, OctagonAlert, Siren, CircleDashed };

export const LEVEL_UI = Object.fromEntries(Object.entries(levels).map(([id, l]) => [id, { ...l, Icon: ICONS[l.icon] }])) as
  Record<DisplayLevel, { label: string; color: string; icon: string; action: string; Icon: LucideIcon }>;

/** Faixa pessoal e dado normal nos gráficos: cinza-azulado neutro, nunca o azul do Advisory. */
export const NEUTRAL = neutralChartColor as string;

/** Só para ordenar listas na tela (o nível em si vem da API). */
export const severity = (level: AlertLevel | null | undefined) => rank(level ?? null) as number;
export const isFlagged = (d: DisplayLevel) => d !== 'normal' && d !== 'unavailable';
