# NasaSpaceAppsChallenge2026
Black Belt's Team

Sistema autônomo de monitoramento de saúde para astronautas em missões de longa duração (**AstroVida**), composto por uma API back-end em Node.js/Express e uma interface front-end integrada em React + Vite + TypeScript.

---

## 1. Visão Geral da Arquitetura

O projeto divide-se em:
1. **Back-end (API Express)**: Servidor Node.js que atua como fonte de verdade para cálculos biomédicos, baselines, avaliações de risco, séries temporais, cenários demonstrativos e relatórios clínicos de telemedicina.
2. **Front-end (AstroVida Dashboard)**: Aplicação web autônoma (React + Vite + TypeScript + Tailwind CSS + Recharts + Framer Motion + Zustand), adaptada com design system aeroespacial de alto contraste (Dark Mode exclusivo), código semafórico acessível (Cor + Ícone + Texto) e integração completa às 5 áreas da API.

---

## 2. Instalação e Execução

### Requisitos
- **Node.js**: v22 ou superior (testado com Node v24).
- **npm**: v10 ou superior.

### Instalação das dependências
Na raiz do repositório:
```bash
npm install
```

### Execução em Desenvolvimento (Terminais Separados)

#### Terminal 1 — Back-end (Express API)
```bash
npm start
```
* O back-end inicializa em `http://127.0.0.1:3000/api/v1`.
* Para modo desenvolvimento com auto-reload: `npm run dev:backend`.

#### Terminal 2 — Front-end (AstroVida Dashboard)
```bash
npm run dev
```
* O front-end inicializa em `http://localhost:5173/` (ou `http://127.0.0.1:5173/`).

---

## 3. Configuração de Variáveis de Ambiente & CORS

### Variáveis do Back-end

| Variável | Padrão | Uso |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Interface de escuta |
| `PORT` | `3000` | Porta HTTP do back-end |
| `DATA_FILE` | `data/records.json` | Arquivo de persistência JSON local |
| `CORS_ORIGINS` | vazio | Origens adicionais separadas por vírgula (localhost, 127.0.0.1 e ::1 já são permitidos por padrão) |

### Configuração do Front-end
A URL da API está centralizada em `src/config/api.ts` (apontando por padrão para `http://127.0.0.1:3000/api/v1`, ou sobreposta pela variável `VITE_API_BASE_URL`).

---

## 4. Rotas e Contrato da API

As consultas exigem `astronautId` (padrão: `astro_demo_001`) e aceitam `dataset=simulated` (padrão) ou `dataset=real` (que reúne registros `manual` e `sensor`).

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/v1/overview` | Resumo geral das cinco áreas e alertas |
| GET | `/api/v1/areas/:areaId` | Conteúdo, referências, catálogo e últimos registros da área |
| GET | `/api/v1/areas/:areaId/history` | Histórico e tendências temporais |
| POST | `/api/v1/areas/:areaId/records` | Gravação de lote de registros manuais/sensores |
| POST | `/api/v1/areas/:areaId/operations/:kind` | Operações compostas (`radiation`, `solar`, `vitals`, `posture`, `atmosphere`, `noise`, `post_eva`, `mission`, `reference`, `report`) |
| GET | `/api/v1/areas/:areaId/operations/:kind/:id` | Consulta de auditoria e cálculo de operação |
| POST | `/api/v1/areas/isolation_confinement/sleep-episodes` | Cálculo e persistência de episódio de sono |
| GET | `/api/v1/areas/isolation_confinement/sleep-episodes/:id` | Consulta de episódio de sono |
| POST | `/api/v1/areas/isolation_confinement/pvt-sessions` | Cálculo e persistência de teste psicomotor PVT-B |
| GET | `/api/v1/areas/isolation_confinement/pvt-sessions/:id` | Consulta de sessão PVT-B |
| GET | `/api/v1/mission` | Contexto de missão e referências basais |
| GET | `/api/v1/alerts` | Histórico de avaliações e lista de observações ativas |
| GET | `/api/v1/scenarios` | Catálogo de cenários demonstrativos simulados |
| POST | `/api/v1/scenarios/:scenario` | Disparo idempotente de cenário demonstrativo |

**Áreas oficiais**:
1. `radiation` (Radiação Espacial)
2. `isolation_confinement` (Isolamento e Confinamento)
3. `distance_from_earth` (Distância da Terra)
4. `gravity_fields` (Campos Gravitacionais)
5. `hostile_closed_environment` (Ambientes Fechados Hostis)

---

## 5. Estrutura das 6 Telas do AstroVida

1. **Visão Geral (`/`)**:
   - Consome `GET /api/v1/overview` e `GET /api/v1/alerts`.
   - Score cardiovascular e geral de prontidão, mapa corporal interativo SVG com hotspots diagnósticos, checklist diário de tarefas e 5 cartões de perigos de voo (Biohazards).
2. **Radiação Espacial (`/radiacao`)**:
   - Consome `GET /api/v1/areas/radiation` e `/history`.
   - Doses cumulativas, taxa incremental diária, dosímetros, histórico com pico solar e banner com cronômetro de alerta solar SPE.
3. **Isolamento e Confinamento (`/isolamento`)**:
   - Consome `GET /api/v1/areas/isolation_confinement`, `/history` e `/sleep-episodes`.
   - Check-in de 20s (humor, estresse, energia), cálculo server-side de sono, teste psicomotor PVT-B guiado com medição em milissegundos via `performance.now()`, rosca circadiana 24h e ferramentas de apoio (respiração 4-7-8, diário de voz).
4. **Distância da Terra (`/distancia`)**:
   - Consome `GET /api/v1/areas/distance_from_earth`, `/history` e `GET /api/v1/mission`.
   - Diagrama animado de link de dados Terra ↔ Nave com atraso de propagação unidirecional, inventário do kit médico, fila assíncrona do cirurgião de voo e gerador de relatórios clínicos em estado `prepared` / `not_sent`.
5. **Campos Gravitacionais (`/gravidade`)**:
   - Consome `GET /api/v1/areas/gravity_fields` e `/history`.
   - Projeção de densidade mineral óssea (DMO), massa corporal relativa à pré-missão, escore NEWS2 integrado, contramedidas resistivas ARED e testes rápidos de postura/ortostático com autorrelato de sintomas.
6. **Ambientes Fechados Hostis (`/ambiente`)**:
   - Consome `GET /api/v1/areas/hostile_closed_environment` e `/history`.
   - Gauges de O2, CO2 (ppm e pressão parcial em mmHg), temperatura, umidade, ruído (dBA), checklist pós-EVA e mapa de sensores por módulo da cabine.

---

## 6. Testes

### Back-end
```bash
npm test
```
Executa a suíte oficial de testes do back-end (`test/api.test.js`, `test/research.test.js`, `test/isolation.test.js`, `test/calculations.test.js`).

### Front-end
```bash
npm run build
```
Executa a compilação do TypeScript e validação de bundles e tipos do front-end.
