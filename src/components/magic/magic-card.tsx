// Cartão plano da direção "Painel de voo": fundo sólido e borda reta de 1 px (classe .card de src/index.css).
// Sem brilho que segue o mouse e sem vidro. Quando é link ou botão, a borda clareia no hover (.card-link).
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type MagicCardProps<T extends ElementType> = {
  as?: T; children?: ReactNode; className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function MagicCard<T extends ElementType = 'div'>({ as, children, className, ...props }: MagicCardProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const interactive = Tag !== 'div' && Tag !== 'section';
  return <Tag className={cn('card', interactive && 'card-link', className)} {...props}>{children}</Tag>;
}
