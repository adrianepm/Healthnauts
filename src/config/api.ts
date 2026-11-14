// Centralized API configuration for AstroVida

export const API_BASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) ||
  'http://127.0.0.1:3000/api/v1';

export const DEFAULT_ASTRONAUT_ID = 'astro_demo_001';
export const DEFAULT_DATASET: 'simulated' | 'real' = 'simulated';

export const AREA_IDS = {
  RADIATION: 'radiation',
  ISOLATION: 'isolation_confinement',
  DISTANCE: 'distance_from_earth',
  GRAVITY: 'gravity_fields',
  CABIN: 'hostile_closed_environment',
} as const;

export type AreaId = typeof AREA_IDS[keyof typeof AREA_IDS];
