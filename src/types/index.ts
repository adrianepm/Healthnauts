export type EnvironmentMode = 'Nave' | 'Estação' | 'Rover' | 'Base';

export type StatusLevel = 'green' | 'yellow' | 'red' | 'gray';

export interface StatusInfo {
  level: StatusLevel;
  color: string;
  label: string;
  iconName: 'CheckCircle' | 'AlertTriangle' | 'AlertOctagon' | 'HelpCircle';
  badgeClass: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
}

export interface VitalSign {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  level: StatusLevel;
  statusText: string;
  trend: 'up' | 'down' | 'stable';
  history7d: number[];
  normalRange: string;
  whyMeasure: string;
  whatToDo: string;
}

export interface MissionHazard {
  id: string;
  title: string;
  subtitle: string;
  level: StatusLevel;
  progress: number;
  route: string;
  accentColor: string;
  description: string;
  whyMeasure: string;
  whatToDo: string;
}

export interface BodyHotspot {
  id: string;
  name: string;
  cx: number;
  cy: number;
  level: StatusLevel;
  lossText?: string;
  summary: string;
  detail: string;
  recommendation: string;
  targetTab?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  xpReward: number;
  timeEstimate: string;
}

export interface AlertItem {
  id: string;
  title: string;
  subtitle: string;
  level: StatusLevel;
  timestamp: string;
  actionText?: string;
  requiresSurgeon?: boolean;
}

export interface RadiationData {
  cumulativeDose: number;
  maxBudget: number;
  dailyRate: number;
  budgetPercent: number;
  history7d: { day: string; rate: number; isFlare?: boolean }[];
  zones: {
    id: string;
    name: string;
    shielding: string;
    level: StatusLevel;
    doseRate: number;
    isCurrentLocation?: boolean;
  }[];
  symptoms: {
    id: string;
    name: string;
    options: string[];
    selected: string;
  }[];
}

export interface IsolationData {
  moodScore: number;
  energy: number;
  anxiety: number;
  connection: number;
  who5Score: number;
  who5Trend: string;
  sleepHistory14d: { day: string; hours: number; efficiency: number; deepSleepHours: number }[];
  circadianBlocks: {
    name: string;
    hours: number;
    color: string;
    startHour: number;
    endHour: number;
    desc: string;
  }[];
  circadianOffsetMinutes: number;
  socialHistory7d: { day: string; crewMinutes: number; earthMinutes: number }[];
}

export interface KitItem {
  id: string;
  name: string;
  category: string;
  stockPercent: number;
  level: StatusLevel;
  quantity: string;
  minRequired: string;
  whyCrucial: string;
  location: string;
}

export interface SurgeonCase {
  id: string;
  subject: string;
  summary: string;
  status: 'waiting' | 'answered' | 'draft';
  waitingTime?: string;
  lastUpdate: string;
  priority: StatusLevel;
  attachedData?: string;
  reply?: string;
}

export interface GuidedStep {
  step: number;
  title: string;
  description: string;
  fields?: { label: string; placeholder?: string; type?: string }[];
  instruction?: string;
  whyMeasure?: string;
}

export interface MedicalProtocol {
  id: string;
  name: string;
  keywords: string[];
  severity: StatusLevel;
  category: string;
  steps: {
    stepNumber: number;
    title: string;
    description: string;
    actionRequired: string;
    whyMeasure: string;
    whatToDo: string;
  }[];
}

export interface GravityData {
  currentGravity: '0g' | '0.16g' | '0.38g' | '1g';
  boneLossQuadril: number;
  muscleLossPernas: number;
  boneDensityHistory: {
    month: string;
    actual?: number;
    projWithoutExercise: number;
    projWithExercise: number;
  }[];
  exerciseRings: {
    id: string;
    name: string;
    current: number;
    target: number;
    unit: string;
    color: string;
  }[];
  quickTests: {
    id: string;
    title: string;
    resultText: string;
    level: StatusLevel;
    lastDone: string;
    description: string;
    instruction: string;
    measurements: { label: string; value: string }[];
  }[];
}

export interface CabinSensor {
  id: string;
  name: string;
  co2: number;
  temp: number;
  humidity: number;
  noiseDb: number;
  waterQuality: string;
  surfaceStatus: string;
  level: StatusLevel;
  airQualityDesc: string;
}

export interface AtmosphereData {
  o2Percent: number;
  co2Ppm: number;
  humidityPercent: number;
  tempCelsius: number;
  cabinSensors: CabinSensor[];
  co2History24h: { hour: string; co2: number }[];
  nutrition: {
    caloriesPercent: number;
    hydrationPercent: number;
    proteinPercent: number;
    vitDPercent: number;
  };
  hygieneTasks: {
    id: string;
    name: string;
    completed: boolean;
    xp: number;
    interval: string;
  }[];
}
