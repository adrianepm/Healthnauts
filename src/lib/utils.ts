// cn: junta classes do Tailwind sem conflito (clsx + tailwind-merge), como nos componentes do Magic UI.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
