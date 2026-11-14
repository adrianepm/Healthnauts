import { create } from 'zustand';
import {
  EnvironmentMode,
  VitalSign,
  TaskItem,
  AlertItem,
  BodyHotspot,
  SurgeonCase,
  MedicalProtocol,
  CabinSensor,
  StatusLevel,
} from '../types';
import { INITIAL_SCORE, INITIAL_VITAL_SIGNS, INITIAL_TASKS, INITIAL_ALERTS, BODY_HOTSPOTS } from '../mock/vitais';
import { MOCK_RADIATION, SOLAR_ALERT_DETAILS } from '../mock/radiacao';
import { MOCK_ISOLATION } from '../mock/sono';
import { MOCK_KIT_INVENTORY, MOCK_SURGEON_QUEUE, MEDICAL_PROTOCOLS, MOCK_COMMS_INFO } from '../mock/kit';
import { MOCK_GRAVITY_DATA } from '../mock/gravidade';
import { MOCK_ATMOSPHERE } from '../mock/ambiente';
import { DEFAULT_ASTRONAUT_ID, DEFAULT_DATASET } from '../config/api';

export interface MetricDetailModalData {
  title: string;
  subtitle: string;
  value: string;
  unit?: string;
  level: StatusLevel;
  whyMeasure: string;
  whatToDo: string;
  ruleId?: string;
  ruleVersion?: number;
  ruleSource?: any;
  limitation?: string;
  scientificCategory?: string;
  status?: string;
  quality?: string;
  recordedAt?: string;
  source?: string;
}

interface AstroVidaState {
  // Astronaut & Dataset Selection
  astronautId: string;
  setAstronautId: (id: string) => void;
  dataset: 'simulated' | 'real';
  setDataset: (ds: 'simulated' | 'real') => void;

  // Global Refresh Trigger
  refreshTrigger: number;
  triggerRefresh: () => void;

  // Mission & Environment Context
  environment: EnvironmentMode;
  missionDay: number;
  totalMissionDays: number;
  earthDelayMinutes: number;
  setEnvironment: (env: EnvironmentMode) => void;

  // Gamification
  xp: number;
  xpToday: number;
  xpGoalToday: number;
  level: number;
  streakDays: number;
  addXP: (amount: number) => void;

  // Health Score & Vitals
  score: number;
  worstFactor: string;
  vitalSigns: VitalSign[];
  updateVitalSign: (id: string, value: number | string, level?: StatusLevel) => void;

  // Tasks & Checklist
  tasks: TaskItem[];
  toggleTask: (id: string) => void;

  // Alerts
  alerts: AlertItem[];
  dismissAlert: (id: string) => void;
  addAlert: (alert: AlertItem) => void;

  // Body Map
  bodyHotspots: BodyHotspot[];
  selectedHotspot: BodyHotspot | null;
  setSelectedHotspot: (hotspot: BodyHotspot | null) => void;

  // Radiation & Solar Alert
  cumulativeDose: number;
  dailyRadiationRate: number;
  solarCountdownSeconds: number;
  isSolarAlertActive: boolean;
  isShelterProtocolActive: boolean;
  solarProtocolStep: number;
  isSolarSilenced: boolean;
  radiationSymptoms: { id: string; name: string; options: string[]; selected: string }[];
  activeShipZoneId: string;
  tickSolarCountdown: () => void;
  startShelterProtocol: () => void;
  advanceShelterStep: () => void;
  silenceSolarAlert: () => void;
  updateRadiationSymptom: (id: string, selected: string) => void;
  setActiveShipZoneId: (zoneId: string) => void;

  // Isolation & Wellbeing
  isolationData: typeof MOCK_ISOLATION;
  saveMoodCheckin: (mood: number, energy: number, anxiety: number, connection: number) => void;

  // Distance & Comms & Surgeon
  commsInfo: typeof MOCK_COMMS_INFO;
  kitInventory: typeof MOCK_KIT_INVENTORY;
  surgeonQueue: SurgeonCase[];
  addSurgeonCase: (newCase: Omit<SurgeonCase, 'id' | 'lastUpdate'>) => void;
  selectedProtocol: MedicalProtocol | null;
  setSelectedProtocol: (protocol: MedicalProtocol | null) => void;

  // Gravity
  currentGravity: '0g' | '0.16g' | '0.38g' | '1g';
  setGravity: (g: '0g' | '0.16g' | '0.38g' | '1g') => void;
  activeQuickTestId: string | null;
  setActiveQuickTestId: (id: string | null) => void;

  // Atmosphere
  atmosphereData: typeof MOCK_ATMOSPHERE;
  selectedCabinSensorId: string;
  setSelectedCabinSensorId: (id: string) => void;
  toggleHygieneTask: (id: string) => void;
  logMeal: (calories: number, waterMl: number) => void;

  // Modals & Panels
  metricDetailModal: MetricDetailModalData | null;
  openMetricDetailModal: (data: MetricDetailModalData) => void;
  closeMetricDetailModal: () => void;

  isNewLogModalOpen: boolean;
  setIsNewLogModalOpen: (open: boolean) => void;

  isBreathingModalOpen: boolean;
  setIsBreathingModalOpen: (open: boolean) => void;

  isSurgeonModalOpen: boolean;
  setIsSurgeonModalOpen: (open: boolean) => void;

  isMealLogModalOpen: boolean;
  setIsMealLogModalOpen: (open: boolean) => void;

  isScenarioModalOpen: boolean;
  setIsScenarioModalOpen: (open: boolean) => void;

  isSleepModalOpen: boolean;
  setIsSleepModalOpen: (open: boolean) => void;

  isPvtModalOpen: boolean;
  setIsPvtModalOpen: (open: boolean) => void;

  isPostureModalOpen: boolean;
  setIsPostureModalOpen: (open: boolean) => void;

  isAtmosphereModalOpen: boolean;
  setIsAtmosphereModalOpen: (open: boolean) => void;

  isPostEvaModalOpen: boolean;
  setIsPostEvaModalOpen: (open: boolean) => void;

  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;

  isVitalsModalOpen: boolean;
  setIsVitalsModalOpen: (open: boolean) => void;

  isNoiseModalOpen: boolean;
  setIsNoiseModalOpen: (open: boolean) => void;
}

export const useStore = create<AstroVidaState>((set, get) => ({
  // Astronaut & Dataset Selection
  astronautId: DEFAULT_ASTRONAUT_ID,
  setAstronautId: (id) => {
    set({ astronautId: id });
    get().triggerRefresh();
  },
  dataset: DEFAULT_DATASET,
  setDataset: (ds) => {
    set({ dataset: ds });
    get().triggerRefresh();
  },

  // Global Refresh Trigger
  refreshTrigger: 0,
  triggerRefresh: () => {
    set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
  },

  // Mission & Environment Context
  environment: 'Nave',
  missionDay: 187,
  totalMissionDays: 540,
  earthDelayMinutes: 8,
  setEnvironment: (env) => {
    let delay = 8;
    if (env === 'Estação') delay = 0.05;
    if (env === 'Rover' || env === 'Base') delay = 14;
    set({ environment: env, earthDelayMinutes: delay });
  },

  // Gamification
  xp: 3850,
  xpToday: 65,
  xpGoalToday: 150,
  level: 7,
  streakDays: 12,
  addXP: (amount) => {
    const state = get();
    const newXpToday = state.xpToday + amount;
    const newTotalXp = state.xp + amount;
    const newLevel = Math.floor(newTotalXp / 600) + 1;
    set({
      xp: newTotalXp,
      xpToday: newXpToday,
      level: newLevel,
    });
  },

  // Health Score & Vitals
  score: INITIAL_SCORE.score,
  worstFactor: INITIAL_SCORE.worstFactor,
  vitalSigns: INITIAL_VITAL_SIGNS,
  updateVitalSign: (id, value, level) => {
    set((state) => ({
      vitalSigns: state.vitalSigns.map((v) =>
        v.id === id ? { ...v, value, level: level || v.level } : v
      ),
    }));
  },

  // Tasks & Checklist
  tasks: INITIAL_TASKS,
  toggleTask: (id) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    const isNowCompleted = !task.completed;

    set({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: isNowCompleted } : t
      ),
    });

    if (isNowCompleted) {
      state.addXP(task.xpReward);
    }
  },

  // Alerts
  alerts: INITIAL_ALERTS,
  dismissAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }));
  },
  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
    }));
  },

  // Body Map
  bodyHotspots: BODY_HOTSPOTS,
  selectedHotspot: BODY_HOTSPOTS[3],
  setSelectedHotspot: (hotspot) => set({ selectedHotspot: hotspot }),

  // Radiation
  cumulativeDose: MOCK_RADIATION.cumulativeDose,
  dailyRadiationRate: MOCK_RADIATION.dailyRate,
  solarCountdownSeconds: SOLAR_ALERT_DETAILS.peakEstimatedTimeSec,
  isSolarAlertActive: SOLAR_ALERT_DETAILS.active,
  isShelterProtocolActive: false,
  solarProtocolStep: 1,
  isSolarSilenced: false,
  radiationSymptoms: MOCK_RADIATION.symptoms,
  activeShipZoneId: 'module-b',
  tickSolarCountdown: () => {
    set((state) => ({
      solarCountdownSeconds: Math.max(0, state.solarCountdownSeconds - 1),
    }));
  },
  startShelterProtocol: () => {
    set({ isShelterProtocolActive: true, solarProtocolStep: 1 });
    get().addXP(40);
  },
  advanceShelterStep: () => {
    set((state) => ({
      solarProtocolStep: Math.min(4, state.solarProtocolStep + 1),
    }));
    get().addXP(20);
  },
  silenceSolarAlert: () => {
    set({ isSolarSilenced: true });
    setTimeout(() => {
      set({ isSolarSilenced: false });
    }, 5 * 60 * 1000);
  },
  updateRadiationSymptom: (id, selected) => {
    set((state) => ({
      radiationSymptoms: state.radiationSymptoms.map((s) =>
        s.id === id ? { ...s, selected } : s
      ),
    }));
  },
  setActiveShipZoneId: (zoneId) => set({ activeShipZoneId: zoneId }),

  // Isolation & Wellbeing
  isolationData: MOCK_ISOLATION,
  saveMoodCheckin: (mood, energy, anxiety, connection) => {
    set((state) => ({
      isolationData: {
        ...state.isolationData,
        moodScore: mood,
        energy,
        anxiety,
        connection,
      },
    }));
    get().addXP(30);
  },

  // Distance & Comms & Surgeon
  commsInfo: MOCK_COMMS_INFO,
  kitInventory: MOCK_KIT_INVENTORY,
  surgeonQueue: MOCK_SURGEON_QUEUE,
  addSurgeonCase: (newCase) => {
    const created: SurgeonCase = {
      ...newCase,
      id: `case-${Date.now()}`,
      lastUpdate: 'Agora (Transmissão em fila)',
    };
    set((state) => ({
      surgeonQueue: [created, ...state.surgeonQueue],
      isSurgeonModalOpen: false,
    }));
    get().addXP(25);
  },
  selectedProtocol: MEDICAL_PROTOCOLS[0],
  setSelectedProtocol: (protocol) => set({ selectedProtocol: protocol }),

  // Gravity
  currentGravity: '0g',
  setGravity: (g) => set({ currentGravity: g }),
  activeQuickTestId: null,
  setActiveQuickTestId: (id) => set({ activeQuickTestId: id }),

  // Atmosphere
  atmosphereData: MOCK_ATMOSPHERE,
  selectedCabinSensorId: 'sensor-habitat',
  setSelectedCabinSensorId: (id) => set({ selectedCabinSensorId: id }),
  toggleHygieneTask: (id) => {
    const state = get();
    const task = state.atmosphereData.hygieneTasks.find((t) => t.id === id);
    if (!task) return;
    const isNowCompleted = !task.completed;

    set({
      atmosphereData: {
        ...state.atmosphereData,
        hygieneTasks: state.atmosphereData.hygieneTasks.map((t) =>
          t.id === id ? { ...t, completed: isNowCompleted } : t
        ),
      },
    });

    if (isNowCompleted) {
      state.addXP(task.xp);
    }
  },
  logMeal: (calories, waterMl) => {
    set((state) => ({
      atmosphereData: {
        ...state.atmosphereData,
        nutrition: {
          ...state.atmosphereData.nutrition,
          caloriesPercent: Math.min(100, state.atmosphereData.nutrition.caloriesPercent + 15),
          hydrationPercent: Math.min(100, state.atmosphereData.nutrition.hydrationPercent + 20),
        },
      },
      isMealLogModalOpen: false,
    }));
    get().addXP(30);
  },

  // Modals
  metricDetailModal: null,
  openMetricDetailModal: (data) => set({ metricDetailModal: data }),
  closeMetricDetailModal: () => set({ metricDetailModal: null }),

  isNewLogModalOpen: false,
  setIsNewLogModalOpen: (open) => set({ isNewLogModalOpen: open }),

  isBreathingModalOpen: false,
  setIsBreathingModalOpen: (open) => set({ isBreathingModalOpen: open }),

  isSurgeonModalOpen: false,
  setIsSurgeonModalOpen: (open) => set({ isSurgeonModalOpen: open }),

  isMealLogModalOpen: false,
  setIsMealLogModalOpen: (open) => set({ isMealLogModalOpen: open }),

  isScenarioModalOpen: false,
  setIsScenarioModalOpen: (open) => set({ isScenarioModalOpen: open }),

  isSleepModalOpen: false,
  setIsSleepModalOpen: (open) => set({ isSleepModalOpen: open }),

  isPvtModalOpen: false,
  setIsPvtModalOpen: (open) => set({ isPvtModalOpen: open }),

  isPostureModalOpen: false,
  setIsPostureModalOpen: (open) => set({ isPostureModalOpen: open }),

  isAtmosphereModalOpen: false,
  setIsAtmosphereModalOpen: (open) => set({ isAtmosphereModalOpen: open }),

  isPostEvaModalOpen: false,
  setIsPostEvaModalOpen: (open) => set({ isPostEvaModalOpen: open }),

  isReportModalOpen: false,
  setIsReportModalOpen: (open) => set({ isReportModalOpen: open }),

  isVitalsModalOpen: false,
  setIsVitalsModalOpen: (open) => set({ isVitalsModalOpen: open }),

  isNoiseModalOpen: false,
  setIsNoiseModalOpen: (open) => set({ isNoiseModalOpen: open }),
}));
