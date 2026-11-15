// Formatação de valores para a tela. Nenhuma função aqui decide nível.
export const DAY_MS = 86400000;

export function fmtHours(h: number) {
  if (!Number.isFinite(h)) return '—';
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
}
// Textos da tela em inglês, mesmo com o navegador em outro idioma.
export const LOCALE = 'en-GB';
export const fmtTime = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtDateTime = (iso: string | null | undefined) => iso
  ? new Date(iso).toLocaleString(LOCALE, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });

export function fmtDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  if (seconds < 60) return `${Math.round(seconds * 10) / 10} s`;
  const min = Math.round(seconds / 60);
  return min < 120 ? `${min} min` : `${Math.round(min / 6) / 10} h`;
}

export function ago(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return 'never';
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 2 * 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

export const round = (v: number, digits = 1) => Number.isFinite(v) ? Number(v.toFixed(digits)) : NaN;
export const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Texto da diferença, ex.: "−1h05" ou "+12". */
export function deltaText(today: number, avg: number, kind: 'hours' | 'number' | 'ms' = 'number', digits = 1) {
  if (!Number.isFinite(today) || !Number.isFinite(avg)) return '—';
  const d = today - avg; const sign = d > 0 ? '+' : d < 0 ? '−' : '±'; const a = Math.abs(d);
  if (kind === 'hours') return `${sign}${fmtHours(a)}`;
  if (kind === 'ms') return `${sign}${Math.round(a)} ms`;
  return `${sign}${a >= 10 ? Math.round(a) : a.toFixed(digits)}`;
}
