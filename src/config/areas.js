const nasa = { title: 'NASA — 5 Hazards of Human Spaceflight', url: 'https://www.nasa.gov/hrp/hazards/' };
const csa = { title: 'Canadian Space Agency — Careers in space: Health science experts', url: 'https://www.asc-csa.gc.ca/eng/jobs/careers-in-space/health-sciences.asp' };
const area = (id, title, summary, body, highlights, references = [nasa, csa]) => ({
  id, title, summary, content: [{ id: 'introduction', title: 'Sobre esta demonstração', body },
    { id: 'procedures', title: 'Contexto de uso', body: 'Consulte os procedimentos da missão. Esta demonstração descreve registros e não fornece orientação médica individual.' }],
  references, highlightIndicators: highlights,
});
export const areas = [
  area('radiation', 'Radiação espacial', 'Taxa de dose e dose acumulada simuladas.', 'Acompanhe taxa e total acumulado separadamente. O total possui um intervalo explícito e não é a média das taxas.', ['dose_rate', 'accumulated_dose'], [nasa, { title: 'Canadian Space Agency — How does radiation affect the human body in space?', url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp' }]),
  area('isolation_confinement', 'Isolamento e confinamento', 'Histórico pessoal de sono, fadiga e humor.', 'Os autorrelatos permitem visualizar mudanças pessoais. As escalas apresentadas são demonstrativas e não validadas clinicamente.', ['sleep_duration', 'fatigue', 'mood']),
  area('distance_from_earth', 'Distância da Terra', 'Comunicação e recursos disponíveis a bordo.', 'O atraso de ida e o inventário são contexto operacional. Não representam medidas clínicas nem avaliação de capacidade de tratamento.', ['communication_delay', 'onboard_medical_resources']),
  area('gravity_fields', 'Campos gravitacionais', 'Medições, exercício e relatos de equilíbrio ou visão.', 'Registre observações e seu contexto sem atribuir causalidade aos campos gravitacionais.', ['heart_rate', 'exercise_duration']),
  area('hostile_closed_environment', 'Ambientes fechados hostis', 'Condições ambientais e sintomas relatados.', 'CO₂, temperatura e umidade descrevem o ambiente. Relatos pessoais são apresentados separadamente, sem inferir causa.', ['co2_concentration', 'temperature', 'relative_humidity']),
];
