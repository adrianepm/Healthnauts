# Healthnauts

**Autonomous crew health monitor** · NASA Space Apps Challenge 2026 · Black Belt's Team
Repository: `NasaSpaceAppsChallenge2026`

Healthnauts helps astronauts on long missions monitor their own health when Earth is minutes away or out of contact. It covers the five hazards of NASA's RIDGE model (**R**adiation, **I**solation, **D**istance, **G**ravity, **H**ostile environment) with five alert levels plus *Unavailable*, mandatory acknowledgement for Warning and Emergency, and a simulated report to the flight surgeon on Earth.

> This tool supports self-monitoring and crew medical decisions. It does not diagnose any condition. All data in the demo are simulated.

**Live demo:** https://mendezinxd.github.io/NasaSpaceAppsChallenge2026/ (after the workflow runs on `main`, see *Publishing*).

---

## Run it locally

Requirements: Node.js 22.18 or newer (the tests import TypeScript files directly) and npm.

```bash
npm ci
npm test          # rules, API, demo seed and RIDGE Scene mapping (node --test)
npm run dev       # http://localhost:5173/NasaSpaceAppsChallenge2026/
npm run build     # type-check + production build in dist/
npm run preview   # serves dist/ like GitHub Pages
```

The app runs entirely in the browser: the same rules and API routes in `shared/` run in a local router (the "onboard computer"), and data are kept in `localStorage`. Optionally, `npm start` runs the same routes on Express (`server/`) and the front end can use it with `VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1`. The original back-end API notes are in [`docs/backend-api.md`](docs/backend-api.md).

## What is simulated

| Part | How it works in the demo |
|---|---|
| Vital signs and cabin sensors | A simulated live sensor (`src/sim/liveSensors.ts`) posts normal readings every 2 minutes, starting when the site opens. Without it, data would expire (vital signs > 10 min, cabin > 5 min → Unavailable). |
| Demo scenarios | The **Demo** button runs 8 scenarios through the onboard API: elevated CO₂, solar event, a week of short sleep, fitness change, Mars communication outage, cabin pressure loss, cabin sensor offline, fever. *Back to nominal* and *Reset demo* restore the state. |
| Seven days of history | A simulated astronaut (`astro_demo_001`) with 7 days of check-ins, PVT-B tests and radiation dose, so personal ranges are ready on day one. |
| Earth link and ground reports | Sent, received and replied times are calculated from the one-way delay (`reply = sent + 2 × delay + 15 min`). Ground Control is a simulation in the same browser; GitHub Pages does not transmit telemetry between devices. |
| Privacy | Mood and stress are intended only for the astronaut and the Crew Medical Officer. `localStorage` is not secure access control; this is an interface proposal. |

Every rule the team set without a published source is marked as a *team proposal* in the app and in `shared/config`.

## RIDGE Scene

The Overview opens on the **RIDGE Scene**: a single flat SVG illustration (original and stylised, not anatomical) where each hazard has a physical place and every element is also a link.

- **Radiation**: a stylised particle source. Particles hit the hull and an aura appears **only when the API reports an active solar event**; the aura uses the Radiation level colour.
- **Distance**: Earth is linked to the ship's antenna by a signal line. When a ground report exists, a pulse travels to Earth with progress `(now − sentAt) / (expectedArrivalAt − sentAt)` and comes back the same way until `expectedReplyAt`. With no link, the pulse waits at the ship and the API text is shown.
- **Hostile environment**: four wall sensors (CO₂, O₂, pressure, noise) take the level of the cabin atmosphere and noise groups; at Warning or above the cabin light pulses in the level colour.
- **Isolation and vital signs**: the brain takes the Isolation level; the heart beats every `60 / heart rate` seconds and the chest expands at the respiratory rate, both from the live sensor. No reliable data = grey and still.
- **Gravity**: a Micro · Moon · Mars · Earth selector shows the fluid shift (towards the head in microgravity, towards the legs on Earth). It is visual and educational only; legs and eyes take the Gravity level.

The scene never decides a level: colours and texts come from the level and message the API returns (`src/components/scene/sceneMapping.ts`, tested in `test/scene-mapping.test.js`). Missing data is shown as Unavailable. Clicking an element zooms in for about 400 ms and opens its detail page; every element is reachable with the keyboard (Tab, Enter) and has an accessible label with area and level. Elements at Caution or above pulse slowly; in an Emergency the scene darkens, the cabin takes the level colour and the full-screen alert appears on top.

**Simple view** swaps the scene for compact cards (choice saved in the browser). With *reduce motion* enabled in the operating system, the Overview opens in Simple view and nothing animates.

## Publishing (GitHub Pages)

1. In the repository, an admin sets **Settings → Pages → Source: GitHub Actions** (once).
2. Merge into `main`. The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs `npm test`, `npm run build` and deploys `dist/`. It can also be started by hand (*Actions → Deploy to GitHub Pages → Run workflow*).
3. The site is served from `/NasaSpaceAppsChallenge2026/` (Vite `base`) and uses hash routes (`#/isolation`), so page reloads work on Pages.

`dist/` is generated by the build and is not committed.

## Accessibility and design

- Dark theme with colour tokens in `src/index.css`; brand violet only for navigation and primary buttons. Level colours follow the specification (Normal green, Advisory blue, Caution yellow, Warning orange, Emergency red, Unavailable grey) and a level is always shown with **icon + name**, never colour alone.
- Text contrast of at least 4.5:1 (WCAG AA) on the background and cards; base font 16 px; touch targets of at least 44 px.
- Daily check-in sliders work as visual analogue scales: 0 to 100 underneath, only the end labels on screen.

## Libraries

React 18, React Router 7, Vite 7, TypeScript 5.9, Tailwind CSS 3, Framer Motion 12, Recharts 3, Zustand 5, lucide-react (icons) and Express 5 (optional onboard server). Tests use the built-in `node:test` runner. No external images, fonts or 3D libraries.

## Sources

The levels, limits and messages follow the team's specification (v2, 14 Nov 2026). Numbers in brackets match the specification.

**NASA**
- [1] NASA-STD-3001 Vol. 1 Rev. C: https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
- [2] NASA-STD-3001 Vol. 1, section 6, [V1 6001] (8.5 h of sleep; avoid critical tasks during the sleep period and circadian low): https://www.nasa.gov/reference/6-0-medical-operations/
- [3] NASA-STD-3001 Vol. 2, section 6 (atmosphere, temperature, noise, radiation) and [V2 9052] (critical equipment failure): https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2 ; Rev. D: https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-2-rev-d-with-signature.pdf
- [4] OCHMO-TB-004 Carbon Dioxide: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
- [5] OCHMO-TB-003 Habitable Atmosphere: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-003-habitable-atmosphere.pdf
- [7] PIO₂ table of NASA-STD-3001 Vol. 2 Rev. B, in a NASA presentation (2022): https://ntrs.nasa.gov/api/citations/20220019130/downloads/SKC%20EVA%20Gas%20Related%20Problems%20related%20to%20Spacesuits%20Dec%202022_Final.pdf
- [8] OCHMO-TB-035 Acoustics: https://www.nasa.gov/sites/default/files/atoms/files/acoustics_technical_brief_ochmo_0.pdf
- [9] Goodman, spacecraft acoustics (NC-50 = 58.1 dBA; NC-40 = 49.0 dBA): https://ntrs.nasa.gov/api/citations/20090043801/downloads/20090043801.pdf
- [10] OCHMO-TB-037 Decompression Sickness: https://www.nasa.gov/sites/default/files/atoms/files/dcs_technical_brief_ochmo.pdf
- [11] NASA OSDR Environmental Data App: https://visualization.osdr.nasa.gov/eda
- [12] NASA SRAG, ISS radiation operations (SPE and ESPE): https://www.nationalacademies.org/cdn/materials/9fba0b8d-da37-49fe-9fc5-45b736630da3
- [13] NASA RadWorks, solar event shelter: https://ntrs.nasa.gov/api/citations/20150001237/downloads/20150001237.pdf ; https://ntrs.nasa.gov/api/citations/20160006051/downloads/20160006051.pdf
- [14] NASA Ames, Moon and Mars communication delay (Parisi et al. 2024): https://ntrs.nasa.gov/api/citations/20240006867/downloads/Proof_Slides_Parisi_Megan_969.pdf
- [15] NASA Ames, effects of delay (Parisi et al. 2023): https://ntrs.nasa.gov/api/citations/20230010972/downloads/Proof_Slides_Parisi_Megan_797.pdf
- [16] NASA, Mars solar conjunction: https://mars.nasa.gov/mars2020/mission/status/337/hunkering-down-for-solar-conjunction
- [17] NASA, medical risk on a long lunar mission (ISS evacuation < 24 h): https://ntrs.nasa.gov/api/citations/20240011063/downloads/Quantifying%20Risk%20on%20a%20Long%20Duration%20Lunar%20Mission.pdf
- [20] NASA, ISS ocular surveillance (acuity, Amsler): https://ntrs.nasa.gov/api/citations/20170009173/downloads/20170009173.pdf
- [21] NASA HRP Evidence Report, Risk of Cardiovascular Adaptations (2022): https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/
- [22] OCHMO Bone Loss brief (OCHMO-MTB-013): https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/ ; SANS: https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/
- [23] NASA Food and Nutrition Risk Record Rev. D (2025), PDF provided by the team
- [24] NASA Standard Measures (motion sickness 0-20, post-landing stand test): https://www.nasa.gov/reference/standard-measures/
- [26] Reaction Self Test on the ISS: https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197
- [27] NASA Ames, Arsintescu et al. 2019 (KSS, Samn-Perelli): https://hsi.arc.nasa.gov/publications/Arsintescu_etal_2019_JoVE.pdf
- [30] NASA BHP Standard Measures: https://ntrs.nasa.gov/api/citations/20170005421/downloads/20170005421.pdf
- [32] NASA Spinoff 2013 (RST): https://spinoff.nasa.gov/Spinoff2013/hm_1.html
- [33] NASA, isolation and the C-O-N-N-E-C-T framework: https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/
- [35] NASA-STD-3001 Vol. 2 Rev. D, section 10.3 "Alerts" and Table 10.3-1 (pp. 204-207; table not read by the team): https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-2-rev-d-with-signature.pdf
- [36] NASA-STD-3001 Vol. 2 Rev. E (active): https://standards.nasa.gov/node/237 ; https://ntrs.nasa.gov/citations/20250004555

**External references (used where NASA publishes no number)**
- [18] Norsk et al. 2015, J Physiol (24 h blood pressure falls 8-10 mmHg, heart rate unchanged on the ISS): https://doi.org/10.1113/jphysiol.2014.284869
- [19] Freeman et al. 2011, orthostatic hypotension consensus (via MSD Manual): https://www.msdmanuals.com/professional/cardiovascular-disorders/symptoms-of-cardiovascular-disorders/orthostatic-hypotension
- [25] NEWS2, Royal College of Physicians: https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/
- [28] Karolinska Sleepiness Scale (Åkerstedt & Gillberg, 1990)
- [29] Samn-Perelli, USAF SAM-TR-82-21 (1982): https://apps.dtic.mil/sti/pdfs/ADA125319.pdf
- [31] PVT-B, Basner, Mollicone & Dinges 2011: https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf
- [34] ESA, communication latency study: https://nebula.esa.int/sites/default/files/neb_study/3142/C4000136202FR.pdf

## Use of AI

This project was built with the help of generative AI. Code, tests and interface texts were written with **Claude Code** (Anthropic's Claude models) following a specification written by the team. The team defined the problem, the rules and their sources, reviewed the plan and the results, and decided what went into the app. Thresholds come only from the specification and the sources above; rules without a published source are labelled as team proposals. The RIDGE Scene illustration is original SVG code; no generated images are used. NASA names are used only to cite sources; the app uses no NASA logos.
