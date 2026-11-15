// Cliente da API. `request()` vai para o fetch (VITE_API_BASE_URL) ou para o roteador local de shared/.
// A interface só mostra `displayLevel` e `message` que vêm daqui; nunca calcula nível.
import { API_BASE_URL, ASTRONAUT_ID, DATASET, AreaId } from '../config/api';
import { localHandle, resetLocal } from './localApi';

export type DisplayLevel = 'normal' | 'advisory' | 'caution' | 'warning' | 'emergency' | 'unavailable';
export type AlertLevel = 'advisory' | 'caution' | 'warning' | 'emergency';

export interface Headline { level: AlertLevel | null; displayLevel: DisplayLevel; indicator: string | null; message: string | null }

export interface Assessment {
  indicator: string; areaId: string; group: string | null; status: string;
  level: AlertLevel | null; displayLevel: DisplayLevel; message: string;
  critical: boolean; requiresAcknowledgement: boolean; inObservation: boolean;
  recordedAt: string | null; value?: any; unit?: any; limitation?: string;
  rule: { id: string; version: number; kind?: string; source?: any; levelSource?: any };
  baseline?: { mean?: number; sd?: number; lower?: number; upper?: number; [k: string]: any } | null;
  [k: string]: any;
}

export interface ApiRecord {
  id: string; areaId: string; indicator: string; value: any; unit: string | null;
  recordedAt: string; source: string; context?: Record<string, any>; groupId?: string; periodStart?: string;
}

export interface Link {
  status: 'available' | 'delayed' | 'unavailable' | 'unknown';
  missionId: string | null; destination: string | null; activity: string | null;
  oneWaySeconds: number | null; processingSeconds: number | null; estimatedResponseSeconds: number | null;
  since?: string; message: string | null;
}

export interface Alert {
  id: string; areaId: string; indicator: string; group: string | null; level: AlertLevel; peakLevel: AlertLevel;
  message: string; value: any; unit: any; recordedAt: string; shownAt: string; active: boolean; resolvedAt: string | null;
  requiresAcknowledgement: boolean; acknowledgementLevel?: AlertLevel; acknowledgeBy: string | null; acknowledgedAt: string | null;
  acknowledgementStatus: 'not_required' | 'pending' | 'acknowledged' | 'not_acknowledged' | 'resolved_before_acknowledgement';
  escalatedTo: string | null; escalatedAt: string | null; alsoNotified?: string[]; acknowledgementNote?: string; groundReportId: string | null;
  rule: any;
}

export interface AreaSummary {
  areaId: AreaId; title: string; summary: string; level: AlertLevel | null; displayLevel: DisplayLevel;
  headline: Headline; groups: Record<string, Headline>; lastRecordedAt: string | null; recordCount: number;
}

export interface Overview {
  asOf: string; overallLevel: AlertLevel | null; overallDisplayLevel: DisplayLevel; headline: Headline; vitalSigns: Headline;
  activeAlerts: Alert[]; link: Link; footer: string; areas: AreaSummary[];
  levels: Record<DisplayLevel, { label: string; color: string; icon: string; action: string }>;
}

export interface AreaDetail {
  area: { id: AreaId; title: string; summary: string }; content: { id: string; title: string; body: string }[];
  references: { title: string; url: string }[]; indicatorDefinitions: any[]; latestRecords: ApiRecord[]; assessments: Assessment[];
}

export interface History { period: { from: string; to: string }; records: ApiRecord[]; assessments: Assessment[] }

export interface AlertsResponse { notifications: Alert[]; active: Alert[]; inObservation: any[]; assessments: any[]; acknowledgement: any }

export interface GroundReport {
  id: string; kind: 'automatic' | 'manual'; alertIds: string[]; createdAt: string; level: AlertLevel | null; immediate: boolean;
  mission: { missionId: string | null; destination: string | null; activity: string | null };
  parameters: { alertId: string; areaId: string; indicator: string; level: AlertLevel; value: any; unit: any; measuredAt: string; receivedAt: string; message: string }[];
  acknowledgement: { status: string; mark?: string; note?: string; alerts: { alertId: string; indicator: string; status: string; acknowledgedAt: string | null; escalatedTo: string | null }[] };
  notAcknowledged: boolean; actions: { recordedAt: string; description: string }[]; note?: string | null;
  transmission: { status: 'QUEUED' | 'SENT' | 'RECEIVED' | 'REPLIED'; linkStatus: string; queuedAt: string; sentAt: string | null; oneWaySeconds: number | null;
    expectedArrivalAt: string | null; expectedReplyAt: string | null; receivedAt: string | null; repliedAt: string | null; reply: string | null; message: string };
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: unknown) { super(message); }
}

const ctx = { astronautId: ASTRONAUT_ID, dataset: DATASET };

async function request<T>(method: 'GET' | 'POST', path: string, { query, body }: { query?: Record<string, string>; body?: unknown } = {}): Promise<T> {
  let status: number, payload: any;
  if (API_BASE_URL) {
    const url = new URL(API_BASE_URL.replace(/\/$/, '') + path);
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    status = res.status; payload = await res.json();
  } else {
    // A cópia via JSON imita o fio HTTP: a tela nunca segura referência do estado interno.
    const handle = await localHandle();
    const result = await handle(method, '/api/v1' + path, { query, body: body === undefined ? undefined : JSON.parse(JSON.stringify(body)) });
    status = result.status; payload = JSON.parse(JSON.stringify(result.body ?? null));
  }
  if (status >= 400) throw new ApiError(status, payload?.error?.code ?? 'ERROR', payload?.error?.message ?? 'Request failed.', payload?.error?.fields);
  return payload as T;
}

const get = <T,>(path: string, query: Record<string, string> = {}) => request<T>('GET', path, { query: { ...ctx, ...query } });
const post = <T,>(path: string, body: Record<string, unknown>) => request<T>('POST', path, { body });

let seq = 0;
/** Id único por envio (o backend é idempotente por id). */
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const api = {
  overview: () => get<Overview>('/overview'),
  area: (areaId: AreaId) => get<AreaDetail>(`/areas/${areaId}`),
  history: (areaId: AreaId, from: Date, to: Date, indicator?: string) =>
    get<History>(`/areas/${areaId}/history`, { from: from.toISOString(), to: to.toISOString(), ...(indicator ? { indicator } : {}) }),
  alerts: () => get<AlertsResponse>('/alerts'),
  acknowledge: (alertId: string) => post<{ alert: Alert; note: string }>(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, { ...ctx }),
  groundReports: () => get<{ link: Link; reports: GroundReport[]; source: any }>('/ground-reports'),
  mission: () => get<{ status: string; mission: any; references: any[] }>('/mission'),
  scenarios: () => request<{ scenarios: { id: string; areaId: AreaId; label: string }[] }>('GET', '/scenarios'),
  runScenario: (id: string) => post<any>(`/scenarios/${id}`, { astronautId: ASTRONAUT_ID, id: newId('run-' + id) }),
  ensureProfile: () => post<any>('/demo/profile', { astronautId: ASTRONAUT_ID }),
  records: (areaId: AreaId, records: Omit<ApiRecord, 'id' | 'areaId' | 'source'>[]) =>
    post<any>(`/areas/${areaId}/records`, { astronautId: ASTRONAUT_ID, records: records.map((r) => ({ source: DATASET, ...r })) }),
  operation: (areaId: AreaId, kind: string, body: Record<string, unknown>) =>
    post<any>(`/areas/${areaId}/operations/${kind}`, { astronautId: ASTRONAUT_ID, id: newId(kind), source: DATASET, ...body }),
  sleepEpisode: (body: { bedAt: string; wakeAt: string; sleepLatencyMinutes: number; awakeMinutes: number }) =>
    post<any>('/areas/isolation_confinement/sleep-episodes', { astronautId: ASTRONAUT_ID, episodeId: newId('sleep'), source: DATASET, ...body }),
  pvtSession: (body: { startedAt: string; endedAt: string; durationMs: number; completed: boolean; events: unknown[] }) =>
    post<any>('/areas/isolation_confinement/pvt-sessions', { astronautId: ASTRONAUT_ID, sessionId: newId('pvt'), source: DATASET, ...body }),
  groundReport: (actions: { recordedAt: string; description: string }[], note?: string) =>
    post<any>('/ground-reports', { astronautId: ASTRONAUT_ID, id: newId('manual-report'), source: DATASET, actions, ...(note ? { note } : {}) }),
  /** Só no modo local: apaga o estado e recria a demonstração. */
  resetDemo: () => resetLocal(),
};
