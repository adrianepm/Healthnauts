// Textos de tela: "Why measure this?", fontes e réguas de referência dos gráficos.
// Nada aqui define nível: limites e níveis ficam em shared/config e chegam pela API.
// Números de fonte [n] seguem a seção 5 da especificação v2.

export const SOURCES: Record<string, { label: string; url?: string }> = {
  s1: { label: '[1] NASA-STD-3001 Vol. 1 Rev. C', url: 'https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf' },
  s2: { label: '[2] NASA-STD-3001 Vol. 1, section 6 (sleep planning)', url: 'https://www.nasa.gov/reference/6-0-medical-operations/' },
  s3: { label: '[3] NASA-STD-3001 Vol. 2 Rev. F (2026)', url: 'https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf' },
  s4: { label: '[4] OCHMO-TB-004 Carbon Dioxide', url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf' },
  s5: { label: '[5] OCHMO-TB-003 Habitable Atmosphere', url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-003-habitable-atmosphere.pdf' },
  s7: { label: '[7] PIO2 limits, NASA-STD-3001 Vol. 2 Rev. F [V2 6003]', url: 'https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf' },
  s8: { label: '[8] OCHMO-TB-035 Acoustics', url: 'https://www.nasa.gov/sites/default/files/atoms/files/acoustics_technical_brief_ochmo_0.pdf' },
  s9: { label: '[9] Goodman, spacecraft acoustics (NC-50 ≈ 58 dBA, NC-40 ≈ 49 dBA)', url: 'https://ntrs.nasa.gov/api/citations/20090043801/downloads/20090043801.pdf' },
  s10: { label: '[10] OCHMO-TB-037 Decompression Sickness', url: 'https://www.nasa.gov/sites/default/files/atoms/files/dcs_technical_brief_ochmo.pdf' },
  s12: { label: '[12] NASA SRAG, ISS radiation operations (SPE and ESPE)', url: 'https://www.nationalacademies.org/cdn/materials/9fba0b8d-da37-49fe-9fc5-45b736630da3' },
  s14: { label: '[14] NASA Ames, Moon and Mars communication delay (Parisi et al. 2024)', url: 'https://ntrs.nasa.gov/api/citations/20240006867/downloads/Proof_Slides_Parisi_Megan_969.pdf' },
  s15: { label: '[15] NASA Ames, effects of delay (Parisi et al. 2023)', url: 'https://ntrs.nasa.gov/api/citations/20230010972/downloads/Proof_Slides_Parisi_Megan_797.pdf' },
  s16: { label: '[16] NASA, Mars solar conjunction', url: 'https://mars.nasa.gov/mars2020/mission/status/337/hunkering-down-for-solar-conjunction' },
  s17: { label: '[17] NASA, medical risk on a long lunar mission', url: 'https://ntrs.nasa.gov/api/citations/20240011063/downloads/Quantifying%20Risk%20on%20a%20Long%20Duration%20Lunar%20Mission.pdf' },
  s20: { label: '[20] NASA, ISS ocular surveillance (acuity, Amsler)', url: 'https://ntrs.nasa.gov/api/citations/20170009173/downloads/20170009173.pdf' },
  s22: { label: '[22] OCHMO Bone Loss brief (OCHMO-MTB-013)', url: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/' },
  s23: { label: '[23] NASA Food and Nutrition Risk Record Rev. D (2025)' },
  s24: { label: '[24] NASA Standard Measures', url: 'https://www.nasa.gov/reference/standard-measures/' },
  s25: { label: '[25] NEWS2, Royal College of Physicians', url: 'https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/' },
  s26: { label: '[26] Reaction Self Test on the ISS', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197' },
  s27: { label: '[27] NASA Ames, Arsintescu et al. 2019 (KSS, Samn-Perelli)', url: 'https://hsi.arc.nasa.gov/publications/Arsintescu_etal_2019_JoVE.pdf' },
  s29: { label: '[29] Samn-Perelli, USAF SAM-TR-82-21 (1982)', url: 'https://apps.dtic.mil/sti/pdfs/ADA125319.pdf' },
  s30: { label: '[30] NASA BHP Standard Measures', url: 'https://ntrs.nasa.gov/api/citations/20170005421/downloads/20170005421.pdf' },
  s31: { label: '[31] PVT-B, Basner, Mollicone & Dinges 2011', url: 'https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf' },
  s33: { label: '[33] NASA, isolation and the C-O-N-N-E-C-T framework', url: 'https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/' },
};

export interface IndicatorInfo { label: string; why: string; sources: string[]; team?: string }

export const INFO: Record<string, IndicatorInfo> = {
  sleep_duration: { label: 'Sleep duration', sources: ['s26', 's2'],
    why: 'Short sleep is common in space and is linked to slower reactions. NASA plans 8.5 h of sleep per night and asks crews to avoid critical tasks when fatigued.',
    team: '6 h or less = Advisory, 3 nights = Caution, 4 h or less = Warning.' },
  sleep_quality: { label: 'Sleep quality', sources: ['s26'], why: 'Perceived sleep quality is part of the ISS Reaction Self Test. It is compared with your own usual range, not with a fixed cut-off.',
    team: 'Personal range = mission days 1-7, mean ± 2 SD, SD floor of 5 points.' },
  sleepiness_kss: { label: 'Sleepiness (KSS reference, 1-9)', sources: ['s27'], why: 'Sleepiness changes quickly with sleep loss and time of day. Own short labels are used until the scale licence is confirmed.',
    team: '7 = Advisory, 8-9 = Caution.' },
  fatigue_samn_perelli: { label: 'Fatigue (Samn-Perelli, 1-7)', sources: ['s29', 's27'], why: 'A 7-point fatigue scale used in aviation. Level 7 means "performance definitely impaired".',
    team: '4 = Advisory, 5-6 = Caution, 7 = Warning.' },
  stress: { label: 'Stress (0-100)', sources: ['s26', 's30'], why: 'Isolation and workload can raise stress over weeks. Compared with your own usual range. Visible only to you and your Crew Medical Officer.',
    team: 'Prototype scale, not a validated instrument. Above your range 1-2 days = Advisory, 3 days = Caution.' },
  mood_score: { label: 'Mood (0-100)', sources: ['s30'], why: 'Mood is compared with your own usual range. Visible only to you and your Crew Medical Officer.',
    team: 'Prototype scale, not a validated instrument. Below your range 1-2 days = Advisory, 3 days = Caution.' },
  pvt_response_speed: { label: 'Reaction speed (PVT-B)', sources: ['s31', 's26'], why: 'The 3-minute PVT-B is the reaction test NASA uses on the ISS. It is sensitive to sleep loss.',
    team: 'Personal range from the first 7 days (minimum 2 tests). Below the range = Caution.' },
  pvt_lapses: { label: 'Attention lapses (PVT-B)', sources: ['s31'], why: 'Responses of 355 ms or slower count as lapses.', team: 'Above your range = Advisory.' },
  co2_partial_pressure: { label: 'CO₂, 1-hour average', sources: ['s3', 's4'], why: 'High cabin CO₂ is linked to headaches and poor sleep. NASA limits the 1-hour average to 3 mmHg.',
    team: 'Above 4.5 mmHg = Warning: band of reported symptoms, not an official limit.' },
  co2_partial_pressure_7d: { label: 'CO₂, 7-day average', sources: ['s4'], why: 'A research finding links weekly averages of 2.5 mmHg or more to more headaches.' },
  cabin_pressure: { label: 'Total cabin pressure', sources: ['s3', 's5'], why: 'Pressure outside 5.0 to 15.0 psia is outside the safe limits of the standard. The ISS keeps 14.7 psia.' },
  inspired_oxygen_pressure: { label: 'Inspired oxygen (PIO₂)', sources: ['s7', 's5'], why: 'PIO₂ = (cabin pressure − 47) × O₂ fraction. The ISS is about 150 mmHg.',
    team: 'Values from Rev. F [V2 6003]. The absolute minimum of 122 mmHg (1-hour average) and exposure time are not used.' },
  temperature_humidity: { label: 'Temperature and humidity', sources: ['s3'], why: 'Comfort zone 20-25 °C and 30-60% RH. The app uses a rectangle instead of the official polygon (prototype simplification).' },
  cabin_noise: { label: 'Noise', sources: ['s8', 's9'], why: '85 dBA must never be exceeded. NC-50 (work) and NC-40 (sleep) curves are shown in dBA (prototype simplification).' },
  post_eva_symptoms: { label: 'Post-EVA symptom checklist', sources: ['s10'], why: 'Most decompression sickness cases appear 60 to 240 minutes after decompression.', team: 'Any item = Warning (no approved Emergency criterion in the app).' },
  career_effective_dose: { label: 'Career effective dose', sources: ['s1'], why: 'NASA limits the career effective dose to 600 mSv. This screen shows exposure, not health.', team: '75% = Advisory, 90% = Caution are demonstration bands.' },
  solar_event_simulated: { label: 'Solar particle event', sources: ['s12'], why: 'A common SPE has minimal impact inside the vehicle, except for crew on EVA. Events last hours.' },
  news2: { label: 'Early warning score (terrestrial reference, experimental)', sources: ['s25'], why: 'NEWS2 is validated for hospitals on Earth, not for astronauts. It is shown as a reference next to your measurements and never raises an Emergency.' },
  aerobic_capacity: { label: 'Aerobic capacity (% of pre-flight)', sources: ['s1'], why: 'NASA asks crews to keep at least 80% of their pre-flight aerobic capacity.', team: '80-89% = Advisory.' },
  muscle_strength: { label: 'Muscle strength (% of pre-flight)', sources: ['s1'], why: 'NASA asks crews to keep at least 80% of their pre-flight strength.', team: '80-89% = Advisory.' },
  body_mass: { label: 'Body mass (% of pre-flight)', sources: ['s23'], why: '25% of crew members lost more than 5% of body mass. 5% is a risk-record milestone, not an official limit.', team: '3-5% loss = Advisory.' },
  motion_sickness: { label: 'Motion sickness (0-20)', sources: ['s24'], why: 'NASA scale from 0 (feeling fine) to 20 (vomiting).', team: '5-19 = Advisory, 20 = Caution.' },
  headache: { label: 'Headache (0-10)', sources: ['s4', 's22'], why: 'Shown next to cabin CO₂ without assuming a cause.', team: 'Prototype scale, not a validated instrument. 4-10 = Advisory.' },
  vision_change: { label: 'Vision change', sources: ['s20'], why: 'Vision changes are common in long missions (SANS). On the ISS the in-flight checks are acuity, Amsler grid and a questionnaire.' },
  dizziness: { label: 'Dizziness', sources: ['s24'], why: 'Dizziness is reported as yes or no.', team: 'Prototype scale. Yes = Advisory; with near-fainting = Warning.' },
  communication_delay: { label: 'Earth link', sources: ['s14', 's15'], why: 'Ground reply time ≈ 2 × one-way delay + 15 min to review.' },
};

export const info = (id: string): IndicatorInfo => INFO[id] ?? { label: id.replace(/_/g, ' '), why: '', sources: [] };

/** Rótulos próprios da escala KSS (1-9) até a licença do texto oficial ser confirmada. */
export const KSS_LABELS = ['Fully alert', 'Very alert', 'Alert', 'Fairly alert', 'Neither alert nor sleepy', 'A little sleepy', 'Sleepy, no effort to stay awake', 'Sleepy, some effort to stay awake', 'Fighting sleep'];
/** Samn-Perelli [29], texto da especificação 3.2. */
export const SP_LABELS = ['Unusually wide awake', 'Very alert, wide awake', 'Normal alertness, well rested', 'Mild fatigue', 'Moderate fatigue', 'Severe fatigue', 'Severe fatigue, performance definitely impaired'];

/** Réguas de referência só para leitura dos gráficos. */
export const REFERENCE = {
  sleepPlanH: 8.5, // meta de sono da NASA [2]; não é corte
  exercisePlanMin: 90, // ~1,5 h/dia, 6 a 7 dias/semana na ISS [22]
  boneRates: [1.0, 1.5], // % de perda por mês, só para a simulação educativa [22]
};

/** Checklist de DCS após EVA [10]: código da API → texto da tela. */
export const EVA_SYMPTOMS: [string, string][] = [
  ['itching', 'Itching'], ['muscle_joint_pain', 'Musculoskeletal pain'], ['rash', 'Rash or mottled skin'],
  ['numbness_weakness', 'Numbness or weakness'], ['thinking_speech_change', 'Trouble thinking'],
  ['dizziness_balance_hearing', 'Dizziness or inner ear problems'], ['breathlessness_chest_pain', 'Shortness of breath or chest pain'],
];

/** Limites por órgão, Tabela 4.8-1 [1]: só referência, o app não calcula dose por órgão. */
export const ORGAN_LIMITS: [string, string, string, string][] = [
  ['Lens of the eye', '1,000', '2,000', '4,000'], ['Skin', '1,500', '3,000', '6,000'],
  ['Blood-forming organs', '250', '500', '—'], ['Circulatory system', '250', '500', '1,000'], ['CNS, hippocampus (mGy)', '500', '1,000', '1,500'],
];

/** Destinos, seção 3.7. */
// `demoOneWaySeconds`: atraso de ida usado pelo seletor de missão da demo, dentro da faixa da especificação 3.7.
// ISS 0,3 s (mesmo valor de shared/scenarios.js, "quase instantâneo"); Lua 10 s (topo de 3 a 10 s);
// Marte 480 s (8 min, mesmo valor do perfil padrão em shared/profile.js, dentro de 4 a 24 min).
export const DESTINATIONS: { name: 'ISS' | 'Moon' | 'Mars'; delay: string; evacuation: string; sources: string[]; demoOneWaySeconds: number }[] = [
  { name: 'ISS', delay: 'Almost instant', evacuation: 'Less than 24 h to definitive care', sources: ['s17'], demoOneWaySeconds: 0.3 },
  { name: 'Moon', delay: '3 to 10 s on the surface (light alone takes 1.3 s)', evacuation: 'Not fast; days (team estimate)', sources: ['s14'], demoOneWaySeconds: 10 },
  { name: 'Mars', delay: '4 to 24 min', evacuation: 'Impractical; the crew solves it alone', sources: ['s14'], demoOneWaySeconds: 480 },
];

export const AREA_LABEL: Record<string, string> = {
  isolation_confinement: 'Isolation', hostile_closed_environment: 'Environment', radiation: 'Radiation',
  gravity_fields: 'Gravity', distance_from_earth: 'Distance',
};
export const AREA_PATH: Record<string, string> = {
  isolation_confinement: '/isolation', hostile_closed_environment: '/environment', radiation: '/radiation',
  gravity_fields: '/gravity', distance_from_earth: '/distance',
};
