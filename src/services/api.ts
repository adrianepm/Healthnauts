import { API_BASE_URL, DEFAULT_ASTRONAUT_ID, DEFAULT_DATASET, AreaId } from '../config/api';

export interface ApiErrorData {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  public fields?: Record<string, string>;

  constructor(status: number, errorData: ApiErrorData) {
    super(errorData.message || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = errorData.code || 'UNKNOWN_ERROR';
    this.fields = errorData.fields;
  }
}

export interface ApiContextQuery {
  astronautId?: string;
  dataset?: 'simulated' | 'real';
}

export interface ApiRecord {
  id: string;
  astronautId: string;
  areaId: string;
  indicator: string;
  value: number | string;
  unit: string | null;
  recordedAt: string;
  source: 'simulated' | 'manual' | 'sensor';
  isSimulated: boolean;
  periodStart?: string;
  groupId?: string;
  notes?: string | null;
  context?: Record<string, any>;
  createdAt: string;
}

export interface ApiRule {
  id: string;
  version: number;
  kind: string;
  source: {
    classification?: string;
    url?: string;
    edition?: string;
    section?: string;
    references?: any[];
    limitation?: string;
  };
  limitation?: string;
  message?: string;
  bands?: any;
  limit?: number;
  minimum?: number;
}

export interface ApiAssessment {
  areaId?: string;
  astronautId?: string;
  dataset?: string;
  indicator: string;
  rule: ApiRule;
  status:
    | 'assessed'
    | 'insufficient_data'
    | 'stale'
    | 'not_applicable'
    | 'no_demonstrative_signal'
    | 'baseline_collecting'
    | 'baseline_insufficient';
  level: 'risk' | 'attention' | null;
  inObservation: boolean;
  quality: string;
  recordIds: string[];
  recordedAt: string | null;
  evaluatedAt?: string;
  source: string | null;
  scientificCategory: string | null;
  message: string;
  limitation: string;
  isDemonstrative?: boolean;
  [key: string]: any;
}

export interface ApiOverviewArea {
  areaId: AreaId;
  title: string;
  summary: string;
  isSimulated: boolean;
  dataStatus: 'available' | 'no_data';
  recordCount: number;
  lastRecordedAt: string | null;
  latestRecord: ApiRecord | null;
  highlights: ApiRecord[];
}

export interface ApiOverviewResponse {
  apiVersion: string;
  astronautId: string;
  dataset: 'simulated' | 'real';
  isSimulated: boolean;
  areas: ApiOverviewArea[];
}

export interface ApiAreaResponse {
  apiVersion: string;
  astronautId: string;
  dataset: 'simulated' | 'real';
  isSimulated: boolean;
  area: {
    id: AreaId;
    title: string;
    summary: string;
  };
  content: {
    id: string;
    title: string;
    body: string;
  }[];
  references: {
    title: string;
    url: string;
  }[];
  indicatorDefinitions: any[];
  groups?: Record<string, string[]>;
  operations?: string[];
  disclaimer?: string;
  latestRecords: ApiRecord[];
  assessments: ApiAssessment[];
  monitoring?: ApiAssessment[];
}

export interface ApiHistoryResponse {
  apiVersion: string;
  astronautId: string;
  dataset: 'simulated' | 'real';
  isSimulated: boolean;
  areaId: AreaId;
  period: {
    from: string;
    to: string;
  };
  records: ApiRecord[];
  trends: {
    indicator: string;
    source: string;
    isSimulated: boolean;
    unit: string | null;
    method: string | null;
    latestRecordId: string | null;
    previousRecordId: string | null;
    delta: number | null;
    direction: 'increase' | 'decrease' | 'unchanged' | null;
    status: 'available' | 'insufficient_history' | 'not_applicable';
    message: string;
  }[];
  assessments: ApiAssessment[];
  monitoring?: ApiAssessment[];
}

export interface ApiAlertsResponse {
  apiVersion: string;
  astronautId: string;
  dataset: 'simulated' | 'real';
  isSimulated: boolean;
  assessments: ApiAssessment[];
  alerts: ApiAssessment[];
  inObservation: (ApiAssessment & { since: string })[];
}

export interface ApiMissionResponse {
  apiVersion: string;
  astronautId: string;
  dataset: 'simulated' | 'real';
  isSimulated: boolean;
  status: 'available' | 'insufficient_data';
  mission: {
    kind: string;
    id: string;
    astronautId: string;
    source: string;
    input: {
      missionId: string;
      destination: 'ISS' | 'Moon' | 'Mars';
      activity: string;
      startedAt: string;
      recordedAt: string;
      communication: 'available' | 'delayed' | 'unavailable';
      oneWaySeconds: number | null;
      solarConjunction: boolean;
      medicalResources: string;
      processingSeconds?: number;
    };
    calculation: {
      estimatedResponseSeconds: number | null;
      oneWaySeconds: number | null;
      processingSeconds: number;
      formula: string;
      limitation: string;
    };
  } | null;
  references: any[];
}

export interface ApiScenarioItem {
  id: string;
  areaId: AreaId;
  label: string;
}

export interface ApiScenariosResponse {
  apiVersion: string;
  source: string;
  scenarios: ApiScenarioItem[];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: `Falha ao conectar à API em ${API_BASE_URL}. Verifique se o back-end está em execução.`,
    });
  }

  if (!res.ok) {
    let errorData: ApiErrorData = {
      code: `HTTP_${res.status}`,
      message: res.statusText || 'Erro desconhecido na requisição.',
    };

    try {
      const json = await res.json();
      if (json && json.error) {
        errorData = json.error;
      }
    } catch {
      // not JSON
    }

    throw new ApiError(res.status, errorData);
  }

  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      q.set(key, String(val));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const apiService = {
  // Overview
  async getOverview(
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    dataset: 'simulated' | 'real' = DEFAULT_DATASET,
    signal?: AbortSignal
  ): Promise<ApiOverviewResponse> {
    const q = buildQuery({ astronautId, dataset });
    return request<ApiOverviewResponse>(`/overview${q}`, { signal });
  },

  // Area Details
  async getArea(
    areaId: AreaId | string,
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    dataset: 'simulated' | 'real' = DEFAULT_DATASET,
    signal?: AbortSignal
  ): Promise<ApiAreaResponse> {
    const q = buildQuery({ astronautId, dataset });
    return request<ApiAreaResponse>(`/areas/${encodeURIComponent(areaId)}${q}`, { signal });
  },

  // Area History
  async getAreaHistory(
    areaId: AreaId | string,
    params: {
      astronautId?: string;
      dataset?: 'simulated' | 'real';
      from?: string;
      to?: string;
      indicator?: string;
    } = {},
    signal?: AbortSignal
  ): Promise<ApiHistoryResponse> {
    const q = buildQuery({
      astronautId: params.astronautId || DEFAULT_ASTRONAUT_ID,
      dataset: params.dataset || DEFAULT_DATASET,
      from: params.from,
      to: params.to,
      indicator: params.indicator,
    });
    return request<ApiHistoryResponse>(`/areas/${encodeURIComponent(areaId)}/history${q}`, { signal });
  },

  // Alerts & Observations
  async getAlerts(
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    dataset: 'simulated' | 'real' = DEFAULT_DATASET,
    signal?: AbortSignal
  ): Promise<ApiAlertsResponse> {
    const q = buildQuery({ astronautId, dataset });
    return request<ApiAlertsResponse>(`/alerts${q}`, { signal });
  },

  // Mission & References
  async getMission(
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    dataset: 'simulated' | 'real' = DEFAULT_DATASET,
    signal?: AbortSignal
  ): Promise<ApiMissionResponse> {
    const q = buildQuery({ astronautId, dataset });
    return request<ApiMissionResponse>(`/mission${q}`, { signal });
  },

  // Scenarios
  async getScenarios(signal?: AbortSignal): Promise<ApiScenariosResponse> {
    return request<ApiScenariosResponse>(`/scenarios`, { signal });
  },

  async runScenario(
    scenarioId: string,
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    runId: string = `run-${Date.now()}`
  ): Promise<any> {
    return request<any>(`/scenarios/${encodeURIComponent(scenarioId)}`, {
      method: 'POST',
      body: JSON.stringify({ astronautId, id: runId }),
    });
  },

  // Simple Batch Records
  async saveRecords(
    areaId: AreaId | string,
    astronautId: string,
    records: {
      indicator: string;
      value: number | string;
      unit: string | null;
      recordedAt: string;
      source: 'manual' | 'sensor' | 'simulated';
      periodStart?: string;
      groupId?: string;
      notes?: string;
      context?: Record<string, any>;
    }[]
  ): Promise<{ apiVersion: string; astronautId: string; records: ApiRecord[] }> {
    return request<{ apiVersion: string; astronautId: string; records: ApiRecord[] }>(
      `/areas/${encodeURIComponent(areaId)}/records`,
      {
        method: 'POST',
        body: JSON.stringify({ astronautId, records }),
      }
    );
  },

  // Sleep Episodes
  async saveSleepEpisode(body: {
    astronautId: string;
    episodeId: string;
    source: 'manual' | 'sensor' | 'simulated';
    bedAt: string;
    wakeAt: string;
    sleepLatencyMinutes: number;
    awakeMinutes: number;
  }): Promise<any> {
    return request<any>(`/areas/isolation_confinement/sleep-episodes`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getSleepEpisode(
    episodeId: string,
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    dataset: 'simulated' | 'real' = DEFAULT_DATASET,
    signal?: AbortSignal
  ): Promise<any> {
    const q = buildQuery({ astronautId, dataset });
    return request<any>(`/areas/isolation_confinement/sleep-episodes/${encodeURIComponent(episodeId)}${q}`, { signal });
  },

  // PVT Sessions
  async savePvtSession(body: {
    astronautId: string;
    sessionId: string;
    source: 'manual' | 'sensor' | 'simulated';
    startedAt: string;
    endedAt: string;
    durationMs: number;
    completed: boolean;
    events: {
      kind: 'response' | 'false_start' | 'timeout';
      atMs: number;
      rtMs?: number;
    }[];
  }): Promise<any> {
    return request<any>(`/areas/isolation_confinement/pvt-sessions`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getPvtSession(
    sessionId: string,
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    dataset: 'simulated' | 'real' = DEFAULT_DATASET,
    signal?: AbortSignal
  ): Promise<any> {
    const q = buildQuery({ astronautId, dataset });
    return request<any>(`/areas/isolation_confinement/pvt-sessions/${encodeURIComponent(sessionId)}${q}`, { signal });
  },

  // Composite Operations
  async saveOperation(areaId: AreaId | string, kind: string, body: Record<string, any>): Promise<any> {
    return request<any>(`/areas/${encodeURIComponent(areaId)}/operations/${encodeURIComponent(kind)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getOperation(
    areaId: AreaId | string,
    kind: string,
    id: string,
    astronautId: string = DEFAULT_ASTRONAUT_ID,
    dataset: 'simulated' | 'real' = DEFAULT_DATASET,
    signal?: AbortSignal
  ): Promise<any> {
    const q = buildQuery({ astronautId, dataset });
    return request<any>(
      `/areas/${encodeURIComponent(areaId)}/operations/${encodeURIComponent(kind)}/${encodeURIComponent(id)}${q}`,
      { signal }
    );
  },
};
