// MagicCard do Magic UI (magicui.design/r/magic-card), modo "gradient", adaptado ao cartão de vidro do projeto:
// o fundo translúcido vem de .card (src/index.css); aqui ficam só o brilho que segue o mouse e a borda de 1 px que acende perto dele.
// A borda usa máscara (anel de 1 px) em vez de padding-box, porque o fundo do cartão é translúcido.
// Cores neutras (branco com pouca opacidade): o violeta da marca fica só em navegação e botões.
// Com prefers-reduced-motion o brilho não aparece.
import { useCallback, type ElementType, type PointerEvent, type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

type MagicCardProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function MagicCard<T extends ElementType = 'div'>({
  as, children, className, gradientSize = 220,
  gradientColor = 'rgba(255,255,255,0.045)', gradientFrom = 'rgba(255,255,255,0.32)', gradientTo = 'rgba(255,255,255,0.06)',
  ...props
}: MagicCardProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const reduced = !!useReducedMotion();
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left); mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);
  const reset = useCallback(() => { mouseX.set(-gradientSize); mouseY.set(-gradientSize); }, [mouseX, mouseY, gradientSize]);

  const spotlight = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`;
  const ring = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, transparent 100%)`;

  return (
    <Tag className={cn('card group/magic isolate', className)} onPointerMove={reduced ? undefined : onPointerMove} onPointerLeave={reduced ? undefined : reset} {...props}>
      {!reduced && (<>
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/magic:opacity-100" style={{ background: spotlight }} />
        <motion.span aria-hidden="true" className="magic-ring pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/magic:opacity-100" style={{ background: ring }} />
      </>)}
      {children}
    </Tag>
  );
}
