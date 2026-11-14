# Guia de integração para Samuel

Base local `http://127.0.0.1:3000/api/v1`. Use `astronautId=astro_demo_001&dataset=simulated` nas consultas da demo. IDs que começam com `astro_` permitem testar outros astronautas isoladamente. `dataset=real` consulta entradas `manual` e `sensor`.

| Tela | Rotas e grupos |
| --- | --- |
| Inicial | `GET /overview`. Os cinco IDs, contagens, últimas leituras e destaques continuam disponíveis, agora com o nível de cada área (ver "Níveis v2" abaixo). |
| Radiação | `GET /areas/radiation`, `/history` e `/records` na mesma área. Grupos de exposição e evento solar. Operações `radiation` e `solar`. |
| Isolamento | Detalhe, histórico e registros em `/areas/isolation_confinement`. `sleep-episodes` e `pvt-sessions` continuam com seus POSTs e GETs por ID. |
| Distância | Detalhe e histórico em `/areas/distance_from_earth`. `GET /mission` reúne contexto e referências. Operações `mission`, `reference`, `report`. |
| Gravidade | Detalhe e histórico em `/areas/gravity_fields`. Condicionamento e sintomas em `/records`. Sinais vitais e postura em `vitals` e `posture`. Mostre NEWS2 como grupo dentro desta tela. |
| Cabine | Detalhe e histórico em `/areas/hostile_closed_environment`. Use `atmosphere`, `noise`, `post_eva` para entradas compostas. |
| Histórico transversal | `GET /alerts` retorna `assessments`, `alerts` e `inObservation` (contrato antigo) e, na v2, `notifications`, `active` e `acknowledgement`. |
| Ground Control | `GET /ground-reports` e `POST /ground-reports`. Simulação no mesmo navegador ou servidor. |

## Níveis v2

Toda avaliação traz:

- `level`: `null`, `advisory`, `caution`, `warning` ou `emergency`. `null` quer dizer que nenhuma regra foi acionada.
- `displayLevel`: o que a tela mostra. Acrescenta `normal` (avaliado, sem regra acionada) e `unavailable` (`insufficient_data`, `stale`, `not_applicable` e faixa pessoal em coleta).
- `status`, `message` (texto "What to do" da especificação v2), `group`, `critical` (sinal vital, pressão ou O₂), `requiresAcknowledgement` (Warning ou Emergency) e `inObservation` (Caution ou acima).
- `rule.source` (de onde vem o limite) e `rule.levelSource` (de onde vem o nível, sempre `team_proposal`).

Cor, ícone e rótulo de cada nível vêm em `GET /overview` → `levels`; não fixe no front. Emergency só existe para pressão da cabine e O₂ inspirado. Prioridade na tela: Emergency > Warning > Caution > Unavailable crítico > Advisory > Normal.

### `GET /overview`

Além dos campos antigos, devolve:

| Campo | Conteúdo |
| --- | --- |
| `overallLevel`, `overallDisplayLevel`, `headline` | Pior avaliação atual entre todas as áreas. `headline` tem `level`, `displayLevel`, `indicator` e `message`. |
| `vitalSigns` | Nível próprio dos sinais vitais (NEWS2), separado da área de gravidade. |
| `activeAlerts` | Alertas ativos (Caution ou acima), no formato de `/alerts`. |
| `link` | Estado do link com a Terra: `status` (`available`, `delayed`, `unavailable`, `unknown`), `oneWaySeconds`, `estimatedResponseSeconds`, `message`. |
| `levels`, `footer` | Tabela de níveis e o texto fixo do rodapé. |
| `areas[].level`, `areas[].displayLevel`, `areas[].headline` | Pior avaliação da área. Na gravidade, sem os sinais vitais. |
| `areas[].groups` | Pior avaliação por grupo da área (ex.: `atmosphere`, `noise`, `post_eva`), no formato de `headline`. |

### `POST /alerts/:id/acknowledge`

Corpo `{ "astronautId": "astro_demo_001", "dataset": "simulated" }` (`dataset` opcional). O `id` vem de `GET /alerts` → `active[].id`.

- 200 com `alert` atualizado e `note`. Repetir não muda `acknowledgedAt`.
- 404 `ALERT_NOT_FOUND`; 409 `ACKNOWLEDGEMENT_NOT_REQUIRED` para Caution; 400 para corpo inválido.

Cada alerta de `notifications`/`active` tem `shownAt`, `active`, `resolvedAt`, `level`, `peakLevel`, `message`, `value`, `unit`, `recordedAt`, `requiresAcknowledgement`, `acknowledgeBy`, `acknowledgedAt`, `acknowledgementStatus` (`not_required`, `pending`, `acknowledged`, `not_acknowledged`, `resolved_before_acknowledgement`), `escalatedTo` e `groundReportId`. Sem confirmação em 10 min (Warning) ou 2 min (Emergency), `escalatedTo` vira `crew_medical_officer`. Tudo é calculado pelo relógio a cada consulta: atualize a tela de tempos em tempos. Mostre sempre `acknowledgementNote`: "No acknowledgement does not mean loss of consciousness." O alerta continua ativo, mesmo confirmado, até uma avaliação válida abaixo de Caution; dado indisponível não encerra alerta.

### `GET /ground-reports` e `POST /ground-reports`

`GET /ground-reports?astronautId=...&dataset=simulated` devolve `link`, `source` e `reports`, do mais novo para o mais antigo. Warning e Emergency geram relatório automático (`kind: automatic`); alertas que surgem no mesmo instante vão no mesmo relatório (`alertIds`). Cada relatório tem `createdAt`, `level`, `immediate` (Emergency), `mission`, `parameters` (Caution ou acima, com `measuredAt` e `receivedAt`), `acknowledgement` (com `mark: "not acknowledged"` quando algum alerta passou do prazo) e `transmission`:

| `transmission.status` | Quando |
| --- | --- |
| `QUEUED` | Sem link com a Terra (ou sem missão cadastrada). `message`: "No contact with Earth. Follow the onboard procedure with your Crew Medical Officer." Sai da fila quando um novo contexto de missão com link é gravado. |
| `SENT` | `sentAt` = criação ou volta do link. `expectedArrivalAt = sentAt + oneWaySeconds`; `expectedReplyAt = sentAt + 2 × oneWaySeconds + 15 min`. |
| `RECEIVED` | Depois de `expectedArrivalAt`. |
| `REPLIED` | Depois de `expectedReplyAt`; `reply`: "Flight surgeon reviewed your report. Continue the onboard procedure and send new vitals in 30 min." |

Não existe status `NO_LINK`. Para ligar ou desligar o link na demo, grave uma nova operação `mission` com `communication` `unavailable` ou `delayed`.

`POST /ground-reports` cria um relatório manual: `{ astronautId, id, source, actions: [{ recordedAt, description }], note? }`. 201 na primeira vez, 200 com `replayed: true` no reenvio idêntico, 409 com conteúdo diferente. A operação antiga `report` continua igual (`prepared` / `not_sent`).

### Perfil padrão e cenários

`POST /demo/profile` com `{ astronautId }` grava, uma vez só, a missão de demonstração (Marte, 480 s de atraso), referências pré-voo e histórico de dose atestado, para a dose de carreira ser avaliada. Os cenários já chamam isso sozinhos; chame no início da sessão do front. Cenários de cabine usam o local `cabin-main`, o mesmo do sensor simulado ao vivo; `location` opcional no corpo troca o local.

Para qualquer operação nova, use `POST /areas/:areaId/operations/:kind` com `{ astronautId, id, source, ...campos }`. Consulte com `GET` no mesmo caminho acrescido de `/:id` e da query do dataset. Um reenvio idêntico devolve 200 e `replayed: true`. A primeira gravação retorna 201. Conteúdo diferente com mesmo tipo, astronauta e ID retorna 409. O POST legado de `records` preserva a gravação de cada lote, mas avaliações equivalentes não duplicam o histórico.

Os payloads completos abaixo, inclusive retorno real das rotas, estão no objeto `research` dos [exemplos da API](examples.json). O fluxo v2 (perfil, cenário de despressurização, confirmação e relatório) está no objeto `v2`, gerado por `node docs/generate-examples.mjs`. Os exemplos anteriores de sono, PVT e registros continuam no mesmo arquivo.

| Exemplo | Campos necessários e saída |
| --- | --- |
| `mission` | `missionId`, `destination` (ISS, Moon, Mars), `activity`, `startedAt`, `recordedAt`, `communication` (available, delayed, unavailable), `oneWaySeconds`, `solarConjunction`, `medicalResources`. `processingSeconds` opcional. ID novo por atualização. |
| `reference`, `fitness` | Referência com `missionId`, `indicator`, `method`, `recordedAt`, `value`, `unit`. Deve anteceder o início da missão. Envie medição no lote `records` com `context: { missionId, method, activity }`. Para VO₂max em EVA, adicione `evaEnvironment: "microgravity"` ou `"surface"`. |
| `atmosphere` | `location`, `environment` (nominal_cabin, off_nominal_cabin, suit), `recordedAt`, `pressure: {value, unit}` com mmHg/kPa/psia absolutos, `co2Ppm`, `oxygenFraction`. Compartilhe o instante/local só para observações efetivamente pareadas. O histórico tem ppm e pressão parcial separadas. |
| `noise` | `location`, `context`, `method`, `periodStart`, `recordedAt`, `dba`. A resposta preserva a duração. |
| `postEva` | `evaEndedAt`, `recordedAt`, `symptoms` com os códigos do checklist. Use `[]` para nenhum relatado: `itching`, `muscle_joint_pain`, `rash`, `numbness_weakness`, `thinking_speech_change`, `dizziness_balance_hearing`, `breathlessness_chest_pain`. |
| `vitals` | `activity`, `spo2Scale: 1`, `recordedAt`, `measurements` por ID. Cada entrada tem `value`, `unit`, `recordedAt` dentro dos cinco minutos até o instante da avaliação. RR, pulso, pressão e SpO₂ inteiros. Temperatura corporal com até um decimal. Oxigênio suplementar booleano e consciência A/C/V/P/U informada pelo avaliador, ambos com unidade JSON `null`. Pode gravar incompleto e recebe `missing`. Use outro ID para uma avaliação nova. |
| `posture` | `supervised: true`, `activity` routine/post_landing, `standAt`, `samples` em ordem, com `position` supine/seated/standing, `recordedAt`, `systolic`, `diastolic` em mmHg e `heartRate` em bpm. Inclua supina e em pé. |
| `radiation` | `missionId`, `scope` mission/prior_spaceflight, `quantity` effective/absorbed/equivalent_organ, `organ` (null para effective), `mode` increment/counter, `seriesId`, `periodStart`, `recordedAt`, `value`, `unit`, `completePriorHistory`. `doseMethod: "NASA_Q"` somente para entradas compatíveis com esse método. Atestado prévio somente para contador efetivo. |
| `solar` | `source: "simulated"`, `active` booleano, `recordedAt`. O evento é fictício. |
| `report` | `actions` com `recordedAt` e `description`, ou `[]`. O relatório fica em `operation.calculation`, com `deliveryStatus: "not_sent"`. |

Envie as datas com offset ou `Z`. Descubra IDs, unidades, grupos e validação no `indicatorDefinitions`; valores `operationOnly` têm operação própria. Para sintomas de gravidade, use `motion_sickness`, `headache`, `dizziness`, `near_fainting`, `vision_change` e `amsler_change`. As flags aceitam 0/1 com `unit: null`. As entradas são autorrelatos. A vasta maioria dos registros antigos não tem campos de contexto, e continua legível.

Durante o carregamento mostre estado de espera. Em erro de resposta use `error.code` e os campos retornados em `error.fields`. Após sucesso, leia `dataStatus`, `records` e `assessments` separadamente. Exiba `insufficient_data`, `stale`, `not_applicable`, `baseline_collecting` e `baseline_insufficient` explicitamente. Para a faixa pessoal, preserve `monitoring` como alias de `assessments`. Uma avaliação `assessed` com `level: null` pode ser um cálculo descritivo. Referência e qualidade são campos distintos do nível demonstrativo.

Mostre `rule.id`, `rule.version`, `rule.source`, `context`, `recordIds`, `message`, `limitation` e `quality`. Em NEWS2 mostre `scientificCategory`, `components` e `score` separadamente. A diastólica fica disponível em histórico sem somar pontos. Use `/alerts` para observações persistidas e o detalhe para a avaliação atual. Uma observação pode continuar aberta quando o dado fica antigo.

Liste os cenários com `GET /scenarios`. Execute `POST /scenarios/:scenario` com `{ "astronautId": "astro_demo_001", "id": "run-1" }`. Use ID próprio por execução. Há `high-co2`, `solar-event`, `poor-sleep`, `fitness-change`, `offline-report`, `depressurization` (Emergency), `sensor-fault` (Unavailable) e `fever` (NEWS2 alto, Warning). Eles gravam dados relativos ao instante da primeira execução e não se repetem ao reiniciar. Para achar o relatório do cenário offline use `operation.calculation.reportId`. Os dados ficam no dataset simulado, mesmo quando o cenário modela indisponibilidade de comunicação.

O front-end pode ser publicado separadamente. Para demonstração pública, hospede o Express em um serviço próprio com armazenamento persistente e configure `CORS_ORIGINS` para a origem do front-end. O localhost da máquina do Bernardo só está disponível naquela máquina. Privacidade por papel depende de autenticação. A API atual é para dados fictícios, inclusive ao usar o dataset de demonstração do fluxo manual.
