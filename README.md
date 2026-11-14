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
npm ci
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

1. **Overview (`/`)** — contexto, cinco áreas ao redor de uma figura vetorial e observações da API. Consulta `overview`, `alerts` e `mission`.
2. **Space Radiation (`/radiacao`)** — dose, histórico, registro de exposição e avaliação de evento solar simulado.
3. **Isolation & Confinement (`/isolamento`)** — check-in, registro de sono e teste de reação PVT-B, com resultados calculados no servidor.
4. **Distance from Earth (`/distancia`)** — missão, atraso estimado, recursos, referências pré-missão e preparação local de relatório.
5. **Gravity Fields (`/gravidade`)** — condicionamento, exercício, sintomas autorrelatados, NEWS2 e observações supervisionadas de postura.
6. **Cabin Environment (`/ambiente`)** — atmosfera, temperatura, umidade, ruído e observações após caminhada espacial.

As cinco áreas consultam detalhe e histórico. Fontes, limitações e medições adicionais ficam disponíveis na própria área. O menu global abre registros e cenários. Consulte [DESIGN.md](DESIGN.md) para decisões de interface, referências e limites do protótipo.

Para uma prévia isolada, execute em terminais separados, na raiz do worktree:

```bash
npm ci
PORT=31961 DATA_FILE=data/design-demo.json npm start
```

```bash
VITE_API_BASE_URL=http://127.0.0.1:31961/api/v1 npm run dev -- --host 127.0.0.1 --port 31962 --strictPort
```

Abra [a prévia local](http://127.0.0.1:31962/). Caso as portas estejam ocupadas, altere as duas portas e ajuste `VITE_API_BASE_URL` para apontar ao Express. O relatório gerado pela API permanece preparado localmente.

---

## 6. Testes

### Testes Automatizados (Back-end & Integração Front-end)
```bash
npm test
```
Executa a suíte completa de testes (38 testes no total), cobrindo:
- API REST, validação e concorrência (`test/api.test.js`)
- Operações de pesquisa, catálogos e baselines (`test/research.test.js`)
- Sono e vigilância psicomotora PVT-B (`test/isolation.test.js`)
- Cálculos ambientais, NEWS2, dosimetria e cenários (`test/calculations.test.js`)
- Integração ponta-a-ponta do front-end com os endpoints reais (`test/frontend-integration.test.js`)

### Front-end
```bash
npm run build
```
Executa a compilação do TypeScript e validação de bundles e tipos do front-end.
