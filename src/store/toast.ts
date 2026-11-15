// Fila de toasts (confirmação de ações). Uso: toast.success('Morning check-in saved') ou toast.error(mensagem da API).
// Sucesso some em 3 s; erro fica 6 s para dar tempo de ler a mensagem. Os dois têm X para fechar.
import { create } from 'zustand';

export type ToastKind = 'success' | 'error';
export interface Toast { id: number; kind: ToastKind; text: string; ms: number }

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, text: string) => void;
  dismiss: (id: number) => void;
}

let next = 1;
const MAX = 4; // empilha até 4; o mais antigo sai primeiro

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, text) => set((s) => ({ toasts: [...s.toasts, { id: next++, kind, text, ms: kind === 'error' ? 6000 : 3000 }].slice(-MAX) })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Mensagem de erro para o toast: a da API quando existe. */
export const errorText = (e: unknown) => (e instanceof Error && e.message ? e.message : 'Could not save. Try again.');

export const toast = {
  success: (text: string) => useToasts.getState().push('success', text),
  error: (e: unknown) => useToasts.getState().push('error', typeof e === 'string' ? e : errorText(e)),
};
