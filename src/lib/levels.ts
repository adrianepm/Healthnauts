// Cor, rótulo e ícone de cada nível (especificação 2.1). Cor e rótulo vêm de shared/config/levels.js,
// a mesma tabela que a API devolve em /overview → levels. Aqui só se liga o nome do ícone ao componente
// e se escolhe a cor do TEXTO do nível: a cor oficial fica no ícone, na borda e no preenchimento;
// onde ela não chega a 4,5:1 sobre o fundo escuro (Emergency e Unavailable), o texto usa um tom mais claro.
import { CircleCheck, CircleDashed, Info, OctagonAlert, Siren, TriangleAlert, type LucideIcon } from 'lucide-react';
import { levels, neutralChartColor, rank } from '../../shared/config/levels.js';
import type { AlertLevel, DisplayLevel } from '../services/api';

const ICONS: Record<string, LucideIcon> = { CircleCheck, Info, TriangleAlert, OctagonAlert, Siren, CircleDashed };
/** Texto com contraste ≥ 4,5:1 sobre #0B1220 e #121B2E, mesmo com o fundo tingido do nível (conferido em README). */
const TEXT_COLOR: Partial<Record<DisplayLevel, string>> = { emergency: '#F87171', unavailable: '#A7B4C8' };

export interface LevelUi { label: string; color: string; text: string; icon: string; action: string; Icon: LucideIcon }
export const LEVEL_UI = Object.fromEntries(Object.entries(levels).map(([id, l]) =>
  [id, { ...l, text: TEXT_COLOR[id as DisplayLevel] ?? l.color, Icon: ICONS[l.icon] }])) as Record<DisplayLevel, LevelUi>;

/** Faixa pessoal e dado normal nos gráficos: cinza-azulado neutro, nunca o azul do Advisory. */
export const NEUTRAL = neutralChartColor as string;

/** Só para ordenar listas na tela (o nível em si vem da API). */
export const severity = (level: AlertLevel | null | undefined) => rank(level ?? null) as number;
export const isFlagged = (d: DisplayLevel) => d !== 'normal' && d !== 'unavailable';
