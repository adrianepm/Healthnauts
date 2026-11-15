// BentoGrid do Magic UI (magicui.design/r/bento-grid), adaptado: só a grade (o BentoCard original é um cartão de vitrine
// com CTA e ícone grande, que não cabe aqui). Os cartões são MagicCard; o tamanho de cada um vem de bentoSpan().
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BentoGridProps extends ComponentPropsWithoutRef<'div'> { children: ReactNode; className?: string }

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return <div className={cn('grid w-full grid-cols-1 gap-4 sm:grid-cols-2', className)} {...props}>{children}</div>;
}

/**
 * Desenho do bento por número de cartões (telas largas). O primeiro cartão é o destaque (2×2);
 * os outros completam a grade sem buraco. Em tela estreita o destaque ocupa a linha inteira.
 */
export function bentoLayout(count: number): { grid: string; span: (i: number) => string; hero: (i: number) => boolean } {
  if (count === 3) return {
    grid: 'lg:grid-cols-3',
    span: (i) => (i === 0 ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : 'lg:col-span-2'),
    hero: (i) => i === 0,
  };
  if (count === 4) return {
    grid: 'lg:grid-cols-4',
    span: (i) => (i === 0 ? 'sm:col-span-2 lg:row-span-2' : i === 3 ? 'sm:col-span-2' : ''),
    hero: (i) => i === 0,
  };
  if (count === 5) return {
    grid: 'lg:grid-cols-4',
    span: (i) => (i === 0 ? 'sm:col-span-2 lg:row-span-2' : ''),
    hero: (i) => i === 0,
  };
  return { grid: 'lg:grid-cols-4', span: () => '', hero: () => false };
}
