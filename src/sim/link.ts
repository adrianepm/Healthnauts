// Liga ou desliga o link com a Terra gravando um novo contexto de missão (como manda docs/integracao-samuel.md).
// Mantém destino, atraso e recursos da missão atual; só muda `communication`.
import { api } from '../services/api';
import { AREA } from '../config/api';

export async function setEarthLink(available: boolean) {
  const { mission } = await api.mission();
  if (!mission) throw new Error('No mission context recorded.');
  const { missionId, destination, activity, startedAt, oneWaySeconds, medicalResources, processingSeconds } = mission.input;
  await api.operation(AREA.distance, 'mission', {
    missionId, destination, activity, startedAt, recordedAt: new Date().toISOString(), oneWaySeconds, medicalResources,
    ...(processingSeconds !== undefined ? { processingSeconds } : {}),
    communication: available ? (destination === 'ISS' ? 'available' : 'delayed') : 'unavailable',
    solarConjunction: !available,
  });
}
