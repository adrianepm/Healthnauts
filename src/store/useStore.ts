// Estado global enxuto: o que a API devolveu + estado de interface (janelas, XP).
// Nível e mensagem sempre vêm da API; o store só guarda e atualiza.
import { create } from 'zustand';
import { api, type AlertsResponse, type AreaDetail, type GroundReport, type Link, type Overview } from '../services/api';
import { AREA, UI_KEY, type AreaId } from '../config/api';

export const XP_PER_CHECKIN = 30; // o XP premia FAZER o check-in, nunca a resposta
export const XP_PER_PVT = 40;
export const XP_PER_EXERCISE = 30; // uma vez por dia, ao registrar uma sessão (qualquer duração)
export const XP_PER_WEIGH = 20; // uma vez por dia, ao registrar a pesagem

// checkins: datas (YYYY-MM-DD) dos check-ins feitos no app. seenAlerts: alertas cujo detalhe o astronauta já abriu
// (o pulso do cartão "Needs attention" para). Só conveniência de interface: nada aqui muda o nível.
// awards: "tarefa:dia" que já deram XP (exercício e pesagem, uma vez por dia). rewards: flores e frutos da árvore
// ganhos nas missões semanais (ficam para sempre na Journey).
export interface TreeReward { id: string; kind: 'flower' | 'fruit' }
interface UiSaved { xp: number; checkins: string[]; seenAlerts: string[]; awards: string[]; rewards: TreeReward[] }
const EMPTY_UI: UiSaved = { xp: 0, checkins: [], seenAlerts: [], awards: [], rewards: [] };
const loadUi = (): UiSaved => { try { return { ...EMPTY_UI, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; } catch { return { ...EMPTY_UI }; } };
const saveUi = (u: UiSaved) => { try { localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* ignora */ } };
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface State {
  ready: boolean; error: string | null; version: number;
  overview: Overview | null; alerts: AlertsResponse | null; details: Partial<Record<AreaId, AreaDetail>>;
  ground: { link: Link; reports: GroundReport[] } | null; mission: any | null; missionRefs: any[]; exerciseToday: number;
  ui: UiSaved;
  checkinOpen: boolean; pvtOpen: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  loadArea: (id: AreaId) => Promise<void>;
  addXp: (n: number, checkin?: boolean) => void;
  markSeen: (alertIds: string[]) => void;
  award: (task: string, xp: number) => void;
  addReward: (r: TreeReward) => void;
  setCheckinOpen: (v: boolean) => void; setPvtOpen: (v: boolean) => void;
  acknowledge: (alertId: string) => Promise<void>;
}

// Isolamento e gravidade ficam sempre carregados: os lembretes do sino dependem deles.
const watched = new Set<AreaId>([AREA.isolation, AREA.gravity]);

export const useStore = create<State>((set, get) => ({
  ready: false, error: null, version: 0,
  overview: null, alerts: null, details: {}, ground: null, mission: null, missionRefs: [], exerciseToday: 0,
  ui: loadUi(), checkinOpen: false, pvtOpen: false,

  async init() {
    try {
      await api.ensureProfile(); // missão, referências pré-voo e dose atestada (idempotente)
      await get().refresh();
      set({ ready: true, error: null });
    } catch (e: any) { set({ error: e?.message ?? 'Could not start the onboard data service.' }); }
  },

  // Busca tudo de uma vez: os prazos de confirmação e o status do relatório são calculados pelo relógio.
  async refresh() {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const [overview, alerts, ground, mission, exercise] = await Promise.all([api.overview(), api.alerts(), api.groundReports(), api.mission(),
      api.history(AREA.gravity, midnight, new Date(Date.now() + 60000), 'exercise_duration')]);
    const ids = [...watched];
    const fresh = await Promise.all(ids.map((id) => api.area(id)));
    const exerciseToday = exercise.records.reduce((sum, r) => sum + Number(r.value), 0);
    set((s) => ({ overview, alerts, ground, mission: mission.mission, missionRefs: mission.references, exerciseToday, version: s.version + 1,
      details: { ...s.details, ...Object.fromEntries(ids.map((id, i) => [id, fresh[i]])) } }));
  },

  async loadArea(id) {
    watched.add(id);
    const detail = await api.area(id);
    set((s) => ({ details: { ...s.details, [id]: detail } }));
  },

  addXp(n, checkin) {
    const ui = get().ui;
    const next = { ...ui, xp: ui.xp + n, checkins: checkin && !ui.checkins.includes(dayKey()) ? [...ui.checkins, dayKey()] : ui.checkins };
    saveUi(next); set({ ui: next });
  },
  markSeen(alertIds) {
    const ui = get().ui; const fresh = alertIds.filter((id) => !ui.seenAlerts.includes(id));
    if (!fresh.length) return;
    const next = { ...ui, seenAlerts: [...ui.seenAlerts, ...fresh].slice(-200) };
    saveUi(next); set({ ui: next });
  },
  award(task, xp) {
    const ui = get().ui; const key = `${task}:${dayKey()}`;
    if (ui.awards.includes(key)) return;
    const next = { ...ui, xp: ui.xp + xp, awards: [...ui.awards, key].slice(-400) };
    saveUi(next); set({ ui: next });
  },
  addReward(r) {
    const ui = get().ui;
    if (ui.rewards.some((x) => x.id === r.id)) return;
    const next = { ...ui, rewards: [...ui.rewards, r] };
    saveUi(next); set({ ui: next });
  },
  setCheckinOpen: (v) => set({ checkinOpen: v }),
  setPvtOpen: (v) => set({ pvtOpen: v }),

  async acknowledge(alertId) {
    await api.acknowledge(alertId);
    await get().refresh();
  },
}));

export { AREA };
