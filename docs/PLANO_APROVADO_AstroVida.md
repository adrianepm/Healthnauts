# PLANO APROVADO · AstroVida v2

> Este plano foi escrito por você (Fable) numa sessão anterior, em outro computador, e já foi revisado e aprovado pelo time COM os ajustes da seção "Ajustes aprovados" logo abaixo. Os ajustes têm prioridade sobre o texto do plano quando houver conflito.
> Não refaça a leitura completa nem o plano do zero. Confira só o ambiente desta máquina (git, Node ≥ 22, branch) e siga para a Etapa 1.

## Ajustes aprovados (prioridade sobre o plano)
1. Pare ao fim de CADA etapa, inclusive a Etapa 1: mostre a saída do `npm test`, a lista de arquivos alterados e espere eu escrever "pode seguir". Nunca comece a próxima etapa sozinho.
2. Sem link com a Terra: siga a seção 3.6 da especificação. O relatório fica `QUEUED` até o link voltar, e a tela mostra "No contact with Earth. Follow the onboard procedure with your Crew Medical Officer." Não use `NO_LINK` como status do relatório.
3. Dose de carreira: garanta que o astronauta padrão e os cenários da demo tenham histórico de dose atestado, senão o card fica Unavailable o tempo todo.
4. O sensor simulado ao vivo começa ligado quando o site abre.
5. Ordem da Etapa 2, se o tempo apertar: Isolation, Overview, Environment, Ground Control, depois Radiation, Gravity, Distance e Profile. Avise antes de cortar qualquer tela.
6. Antes de apagar os componentes antigos, confirme com o build que nada que fica depende deles.
7. Prazo de entrega: 15/11/2026 às 23:59 (horário de Brasília).

---

# AstroVida v2 · plano da Etapa 0

## Contexto

O time entrega o AstroVida no NASA Space Apps em **15/11/2026 às 23:59**. Hoje existem três peças separadas: o backend do Bernardo no `main` (Express, regras com fonte, 3 níveis `attention`/`risk`, textos em português), o front do `frontend-integracao` (ligado à API, mas com o visual reprovado) e o protótipo aprovado da aba Isolation (visual enxuto, dados mock). O objetivo é um app único, de ponta a ponta: visual do protótipo, regras do backend ajustadas à especificação v2 (5 níveis + Unavailable, acknowledge, relatório para a Terra simulado), publicado no GitHub Pages.

## O que encontrei na leitura (avisos)

**Bloqueios de ambiente**
- **Node.js não está instalado nesta máquina** (`node`/`npm` fora do PATH; `gh` também não). Sem ele não rodo `npm test` nem `npm run build`. Há `winget` disponível.
- O `github-pages` environment só aceita deploy do branch padrão: o workflow dispara em `main`, então a publicação final depende de **merge de `astrovida-v2` em `main`** e de alguém com admin ligar *Settings → Pages → Source: GitHub Actions*.

**Correções ao prompt**
- Além de `randomUUID`, `scenarios.js` e `assessment-history.js` usam `createHash('sha256')` de `node:crypto`, e `store.js` usa `node:fs`. Para rodar no navegador: SHA-256 síncrono em JS puro (mesmos ids, testes intactos) e o store dividido em núcleo puro + adaptador de persistência (arquivo no Node, `localStorage` no navegador).
- 9 asserções dos testes antigos comparam `level` com `'attention'`/`'risk'`. Os 34 testes continuam existindo e passando, mas **essas strings esperadas mudam** para os nomes novos. Nenhuma outra asserção antiga muda.

**Onde o backend fica (mais fiel) e a especificação cede**
| Tema | Backend (fica) | Especificação v2 |
|---|---|---|
| NEWS2 em exercício | pulso e respiração continuam pontuando | mandava tirar |
| ppCO2 1 h | média ponderada no tempo, cobertura integral, sem extrapolar | média simples |
| Linha de base do PVT-B | 7 primeiros dias, mínimo 2 testes | 3 primeiros testes |
| Taxa diária de radiação | sem nível (`dose_rate` legado não tem grandeza dosimétrica definida; V1 4033 é critério de projeto) | Advisory acima da referência por 3 dias |
| Carreira de radiação | só avalia com histórico prévio atestado + ledger contínuo | soma direta ÷ 600 |
| Osso | fora do backend; no front só a curva ilustrativa com selo + Bone Protection Tracker | igual |

**Onde a especificação entra (tudo `team_proposal` quando ela diz [time])**
- Samn-Perelli: backend trata 5 a 7 como um nível só; v2 separa 5–6 Caution e 7 Warning.
- KSS 8–9 vira Caution (não existe Warning); sono ≤ 4 h Warning, 3 noites ≤ 6 h Caution, 1–2 noites Advisory.
- Faixa pessoal: 1–2 dias fora = Advisory (novo), 3 dias = Caution; PVT velocidade = Caution, lapsos = Advisory.
- Validade (2.4): sinais vitais > 10 min, cabine > 5 min, check-in > 36 h → Unavailable (hoje: 1 h, 10 min, 7 dias). Consequência: a demo precisa de um **sensor simulado ao vivo** postando leituras, senão tudo fica Unavailable.
- Piso de DP de 5 pontos nas escalas 0–100 (hoje variância zero = insuficiente).

**Decisões minhas que não são número (me corrija se discordar)**
- Sem link com a Terra = **Advisory** (a v2 não põe nível; é informativo, o relatório fica `NO_LINK`).
- Evento solar: a flag atual vira SPE (Advisory na nave; Warning se a atividade da missão for `eva`); campo opcional `eventClass: 'ESPE'` → Warning. Sem cenário novo para ESPE.
- Stand test só recebe nível com `activity: 'post_landing'`.
- "Sair de observação após 3 avaliações Normal" **não entra** (não está na lista da Etapa 1).
- `SocialBars` do protótipo não tem dado no backend: entra só `SupportTools` (texto). O teste de reação de 30 s (modo demo) é enviado como `completed: false` e aparece como "Demo run, not scored".

## Decisões já tomadas por você
- **Hospedagem:** Opção A (regras no navegador).
- **Node.js:** eu instalo com `winget install OpenJS.NodeJS.LTS` antes da Etapa 1 e confirmo `node --version` ≥ 22.
- **Aparelhos (relógio, celular, tablet):** reaproveito `RoutineList`, `Bell`, `AreaCard` e `DemoPanel` agora; as rotas `/watch`, `/phone` e `/tablet` só entram depois da Etapa 4 aprovada, se sobrar tempo.
- **Ordem:** a divisão `shared/` + `server/` é o primeiro passo da Etapa 1.

## Hospedagem: Opção A (escolhida)

Regras no navegador, Express como "computador de bordo".
- `shared/`: todos os módulos de regra (JS puro, sem `node:`), mais um **mini-roteador** com o subconjunto do Express que as rotas usam (`get`/`post`, `:params`, `req.query/body`, `res.status().json()`). A mesma função `registerRoutes(router, store, now)` roda no Express e no navegador, então os testes HTTP existentes cobrem as duas vias.
- Front: `src/services/api.ts` mantém a interface; `request()` vai para `fetch` (se `VITE_API_BASE_URL` existir) ou para o roteador local (padrão no Pages). Estado em memória + `localStorage` em `try/catch`.
- A divisão `shared/` + `server/` acontece no início da Etapa 1 (`git mv` + troca do crypto). O front da Etapa 2 já nasce no modo local; a Etapa 3 fica só com HashRouter, `base`, workflow e README.

## Etapa 1 · Backend (branch `astrovida-v2` a partir de `main`)

Estrutura: `shared/` (regras), `server/` (`app.js`, `server.js`, `store.js` com fs), `test/` (imports atualizados), `src/` livre para o front.

| Arquivo | Ação |
|---|---|
| `shared/config/levels.js` | **novo**: os 6 níveis, cor, ícone, prioridade (Emergency > Warning > Caution > Unavailable crítico > Advisory > Normal), `worstLevel()`, status → Unavailable, prazos de ack (10 min / 2 min) |
| `shared/config/research.js` | regras novas com `team(...)`: pressão 5,0–15,0 psia, PIO2 127/145/155/356, CO2 > 4,5, CO2 7 d ≥ 2,5, caixa temp/umidade, ruído 58/49/85, massa 3%/5%, aeróbico/força 80–89, sintomas 3.4, carreira 75/90/100; validade 10 min/5 min/36 h; mensagens "What to do" da seção 3 |
| `shared/config/isolation.js` | níveis v2 + mensagens da 3.2; piso de DP |
| `shared/config/areas.js`, `catalog.js` | títulos, resumos, conteúdo e rótulos em inglês |
| `shared/evaluation.js`, `monitoring.js` | `level` nos 5 nomes; novos `assessPressure/Oxygen/Climate/Noise/Symptoms/Mass`; sufixos "Follow your mission's approved procedure" e "Talk to your Crew Medical Officer."; trava: escore de saúde nunca passa de Warning |
| `shared/alerts.js` | **novo**: alerta (Caution+) com `shownAt`, `acknowledgedAt`, `active`, `resolvedAt`, `escalatedTo`, `groundReportId`; escalonamento calculado pelo relógio |
| `shared/ground-reports.js` | **novo**: `QUEUED → SENT → RECEIVED → REPLIED` / `NO_LINK`, `expectedArrivalAt`, `expectedReplyAt`, resposta padrão, marca "not acknowledged". O `report` atual (`prepared`/`not_sent`) fica intacto |
| `shared/routes.js` (de `app.js` + `research-api.js`) | `POST /alerts/:id/acknowledge`, `GET/POST /ground-reports`, `GET /overview` com `level` por área, por grupo (vitais separado de gravidade) e `overallLevel` |
| `shared/scenarios.js` | + `depressurization`, `sensor-fault`, `fever`; cenários de cabine no mesmo local do sensor ao vivo |
| `shared/sha256.js`, `shared/router.js`, `shared/store-core.js` | **novos** (Opção A) |
| `docs/matriz-implementacao.md`, `integracao-samuel.md`, `examples.json` | simplificações do protótipo, revisão da norma usada (Vol. 2 Rev. D; PIO2 da Rev. B; Rev. E não conferida), rotas novas |
| `test/levels.test.js`, `alerts.test.js`, `ground-reports.test.js`, `environment.test.js`, `scenarios-v2.test.js` | **novos**, um bloco por item da Etapa 1 |

## Etapa 2 · Front

**Trago do `frontend-integracao`:** `src/services/api.ts` (tipos ampliados), `src/config/api.ts`, `src/store/useStore.ts` (reescrito enxuto: astronauta, dataset, refresh, XP/nível/sequência, gavetas e janelas), `index.html`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `test/frontend-integration.test.js`, e a montagem de payload de `VitalsModal`, `AtmosphereModal`, `NoiseModal`, `PostEvaModal`, `PostureModal`, `ReportModal` (reestilizados como janelas do protótipo).

**Apago:** `dist/`, `vite.config.ts` duplicado, `src/mock/*`, `src/types/index.ts`, `src/lib/status.ts` e `thresholds.ts` antigos, `WellbeingRing` (WHO-5), `CircadianRing`, `ScoreRing`, `MoodCheckin`, `BodyMap`, `ShipZoneMap`, `CabinSensorMap`, `NutritionRings`, `HygieneChecklist`, `MealLogModal`, `MedKitInventory`, `GuidedBreathingModal`, `GuidedProtocolStepper`, `SymptomSearch`, `SymptomChecklist`, `QuickTest*`, `QuickLogModal`, `ExerciseRings`, `HazardCard`, `TaskList`, `AlertList`, `VitalTile`, `AirGauges`, `Co2Chart`, `DoseGauge`, `DoseRateChart`, `BoneTrendChart`, `SleepBars`, `SocialBars`, `SparkLine`, `SupportToolList`, `CommsLinkDiagram`, `GravitySelector`, `FlightSurgeonQueue`, `NewSurgeonMessageModal`, `MetricDetailModal`, `SolarAlertBanner`, `DemoScenariosModal`, `SleepEpisodeModal`, `PvtSessionModal`, `TopBar`, `TabsNav` e as 6 páginas antigas.

**Como cada peça do protótipo entra**
| Protótipo | No app | Mudança |
|---|---|---|
| `components/ui.tsx` (`StatusPill`, `Card`, `DATA_COLORS`) | `src/components/ui.tsx` | 5 níveis + Unavailable com cor e ícone da seção 2.1; normal `#5B7FA6` nos gráficos |
| `Home.tsx` → `TodayHero`, `KeyTiles`, `TopicLinks` | `src/components/lean/` | genéricos: recebem `assessments` da API; a frase e o "What to do" vêm de `message` do backend. Usados nas 6 telas |
| `TopicDetail.tsx` | `src/components/lean/TopicDetail.tsx` | abas e gráficos por props; período chama `/history?from&to` |
| `charts.tsx` | `src/components/charts.tsx` | + gráficos de CO2, dose e % do pré-voo no mesmo estilo |
| `MorningCheckin.tsx` | `src/components/MorningCheckin.tsx` | grava `sleep-episodes` + `records`; KSS com rótulos próprios; XP por fazer |
| `PvtTest.tsx` | `src/components/PvtTest.tsx` | `performance.now()`; envia eventos para `pvt-sessions` |
| `Notifications.tsx` + `Bell`/`RoutineList` (`devices/shared.tsx`) | sino no topo + rotina no Overview | check-in, PVT a cada 4 dias, exercício do dia, pesagem semanal |
| `AreaCard`, `DemoPanel` (`devices/shared.tsx`) | Overview e rodapé | `DemoPanel` chama os 8 cenários da API + "Reset demo" |
| `App.tsx` (casca) | `src/App.tsx` | `HashRouter`, rotas `/`, `/isolation`, `/environment`, `/radiation`, `/gravity`, `/distance`, `/ground`, `/profile`; rodapé fixo |
| `lib/compare.ts` | `src/lib/compare.ts` | igual |
| `lib/status.ts`, `lib/thresholds.ts`, `mock/`, `store.ts` | **não entram** | a interface não decide nível; ficam só "Why measure this?" e fontes em `src/lib/content.ts` |
| `SocialSupport.tsx` | só `SupportTools` | sem barras mock |

**Novos:** `AlertBanner` + `EmergencyOverlay` (Acknowledge, tela cheia, "No acknowledgement does not mean loss of consciousness."), `src/sim/liveSensors.ts` (sensor simulado), páginas `Overview`, `Isolation`, `Environment`, `Radiation`, `Gravity`, `Distance`, `GroundControl`, `Profile`. Ordem: Isolation → Overview → Environment → as demais.

## Etapa 3 · Publicação
`base: '/NasaSpaceAppsChallenge2026/'`, `.github/workflows/pages.yml` (test + build + deploy de `dist`), `dist/` no `.gitignore`, README novo (rodar, o que é simulado, publicar, fontes da seção 5, bibliotecas, declaração de uso de IA).

## Etapa 4 · Verificação
1. `npm test` e `npm run build` sem erro, com a saída mostrada.
2. `npm run dev` e `npm run preview` no navegador: os 8 cenários, conferindo nível, mensagem, sino, Acknowledge, tela cheia do Emergency e o ciclo do relatório em `/ground`.
3. Tabela "regra → nível → fonte ou `team_proposal`" por tela, gerada a partir de `shared/config`; número fora da especificação ou do backend é apagado e avisado.

## Git
Branch `astrovida-v2` a partir de `main`; um commit local ao fim de cada etapa aprovada. **Não faço push nem merge sem você pedir.** A mudança pendente no `.gitignore` (`referencias/`) é sua e entra junto.
