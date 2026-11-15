# NasaSpaceAppsChallenge2026
Black Belt's Team

## Back-end

API de demonstração em Node.js e Express para registros dos cinco riscos de
voos espaciais. O astronauta inicial é `astro_demo_001`. IDs válidos no formato
`astro_<identificador>` também podem registrar dados isoladamente. Os dados iniciais
são fictícios; as tendências descrevem diferenças entre observações, sem
inferência clínica ou estatística.

### Instalação e execução

Requisitos: Node.js 22 ou superior e npm. Na raiz deste repositório:

```bash
npm ci
npm test
npm start
```

A API inicia em `http://127.0.0.1:3000/api/v1`. Para desenvolvimento com
reinício automático, execute `npm run dev:server` (`npm run dev` agora abre o front em Vite). Encerre com `Ctrl+C`.
A única dependência direta é Express; os testes usam `node:test` e `fetch`
nativos do Node.js, sem dependências adicionais.

Variáveis de ambiente opcionais:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Interface de escuta |
| `PORT` | `3000` | Porta HTTP |
| `DATA_FILE` | `data/records.json` na raiz do projeto | Arquivo de persistência JSON |
| `CORS_ORIGINS` | vazio | Origens adicionais separadas por vírgulas, sem espaços |

Exemplo: `PORT=3001 npm start`. As variáveis devem ser exportadas ou passadas
no comando; o servidor não carrega `.env` automaticamente. Origens HTTP/HTTPS
em localhost, 127.0.0.1 e ::1 já são permitidas pelo CORS.

### Rotas

As consultas de dados exigem `astronautId` e aceitam
`dataset=simulated` (padrão) ou `dataset=real`. O conjunto `real` reúne
registros de origem `manual` e `sensor`.

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/api/v1/overview` | Resumo das cinco áreas |
| GET | `/api/v1/areas/:areaId` | Conteúdo, referências, catálogo e últimos registros |
| GET | `/api/v1/areas/:areaId/history` | Histórico e tendências |
| POST | `/api/v1/areas/:areaId/records` | Criação de lote; retorna HTTP 201 |
| POST | `/api/v1/areas/isolation_confinement/sleep-episodes` | Calcula e salva sono com componentes |
| GET | `/api/v1/areas/isolation_confinement/sleep-episodes/:id` | Consulta episódio e componentes |
| POST | `/api/v1/areas/isolation_confinement/pvt-sessions` | Calcula e salva sessão PVT-B |
| GET | `/api/v1/areas/isolation_confinement/pvt-sessions/:id` | Consulta sessão, eventos e resultados |

Áreas: `radiation`, `isolation_confinement`, `distance_from_earth`,
`gravity_fields` e `hostile_closed_environment`.

O histórico aceita `indicator`, `from` e `to`. As datas devem estar em ISO
8601 com fuso (por exemplo, `2026-11-14T12:00:00Z`). O intervalo inclui `from`
e exclui `to`. Por padrão, `to` é o instante da consulta e `from` fica sete
dias antes de `to`. O limite é 10.000 registros por resposta; reduza o
intervalo se a consulta exceder esse limite.

### Integração das cinco áreas

O [guia para Samuel](docs/integracao-samuel.md) traz os campos por tela e os
payloads das operações. A [matriz de pesquisa](docs/matriz-implementacao.md)
registra cada regra, edição, contexto e pendência. No detalhe, `groups`
organiza indicadores nas telas existentes e `assessments` expõe a regra,
versão, insumos, qualidade e resultado demonstrativo.

| Rota adicional em `/api/v1` | Função |
| --- | --- |
| POST `/areas/:areaId/operations/:kind` | Atmosfera, ruído, pós-EVA, sinais vitais, postura, radiação, evento solar, missão, referência e relatório |
| GET `/areas/:areaId/operations/:kind/:id` | Consulta auditoria e dados calculados de uma operação |
| GET `/mission` | Contexto de missão e referências do astronauta |
| GET `/alerts` | Histórico persistido e lista em observação |
| GET `/scenarios` | Lista cinco cenários simulados |
| POST `/scenarios/:scenario` | Gera dados simulados uma vez por ID de execução |

```bash
npm start
# Em outro terminal:
curl 'http://127.0.0.1:3000/api/v1/overview?astronautId=astro_demo_001'
curl -X POST 'http://127.0.0.1:3000/api/v1/scenarios/high-co2' \
  -H 'Content-Type: application/json' \
  -d '{"astronautId":"astro_demo_001","id":"demo-co2-1"}'
curl 'http://127.0.0.1:3000/api/v1/alerts?astronautId=astro_demo_001'
```

O arquivo JSON aceita arrays legados e o envelope v2. O histórico
`assessments` é um campo opcional do v2, criado na primeira escrita avaliada.
Consultas são somente leitura. Avaliações persistidas não são retroativas.
Relatórios ficam preparados localmente. O front-end estático pode ser
publicado separadamente e o Express exige hospedagem própria para uma demo
pública. Configure `CORS_ORIGINS` e um arquivo persistente nessa hospedagem.

### Exemplos

```bash
curl 'http://127.0.0.1:3000/api/v1/overview?astronautId=astro_demo_001&dataset=simulated'

curl 'http://127.0.0.1:3000/api/v1/areas/radiation?astronautId=astro_demo_001'

curl 'http://127.0.0.1:3000/api/v1/areas/radiation/history?astronautId=astro_demo_001&dataset=simulated&indicator=dose_rate&from=2026-11-07T00:00:00Z&to=2026-11-15T00:00:00Z'

curl -X POST 'http://127.0.0.1:3000/api/v1/areas/radiation/records' \
  -H 'Content-Type: application/json' \
  -d '{"astronautId":"astro_demo_001","records":[{"indicator":"dose_rate","value":12,"unit":"uSv/h","recordedAt":"2026-11-14T12:00:00Z","source":"simulated","notes":"Exemplo fictício."}]}'
```

O POST persiste os registros. Envie de 1 a 100 registros por lote, com corpo
JSON de até 1 MB. Cada registro exige `indicator`, `value`, `unit`,
`recordedAt` e `source` (`manual`, `sensor` ou `simulated`). Consulte o catálogo
na rota de detalhes para os tipos e unidades exatos, inclusive `unit: null`
para textos e escalas sem unidade física. Os limites e a precisão de cada
valor numérico estão no catálogo. `notes` é opcional; `periodStart` é obrigatório para
dose acumulada e permitido para sono/exercício; `groupId` pode associar
observações. IDs, `createdAt` e `isSimulated` são gerados pelo servidor.
O lote inteiro é validado antes da gravação.

[docs/examples.json](docs/examples.json) contém respostas ilustrativas das
cinco rotas de detalhes, resumo, histórico e criação. IDs e datas gerados
variam entre execuções; as respostas são retratos do instante `generatedAt`,
não valores fixos esperados em toda consulta. Ajuste os intervalos de datas
para os registros disponíveis.

Erros retornam `{ "error": { "code": "...", "message": "...", "fields": [] } }`.
Validação/JSON inválido retorna 400, área ou rota inexistente retorna 404,
reutilização conflitante de identificador retorna 409, corpo acima do limite
retorna 413 e falha interna retorna 500.

### Persistência, testes e limites

Na ausência do arquivo configurado, o servidor cria 153 registros simulados
(24 indicadores iniciais: 21 diários durante sete dias e três agregados PVT em duas
execuções separadas por quatro dias). Um arquivo existente é preservado e
recebe a carga incremental dos novos indicadores de isolamento, conforme
descrito abaixo; os dados não são renovados a cada inicialização. Portanto, após algum tempo, consulte
um intervalo explícito para visualizar os dados antigos. `dataset=real`
começa vazio em um armazenamento novo. Arquivos JSON e temporários em
`data/`, além de `node_modules/` e `.env`, estão no `.gitignore`.

`npm test` executa a suíte de integração e validação, usando arquivos
temporários e portas livres. Ela verifica áreas/indicadores, separação dos
datasets, validação, persistência, lotes atômicos, escritas concorrentes,
filtros temporais, erros, CORS e tendências.

A persistência carrega todos os registros em memória e serializa gravações
em um único processo. Use apenas uma instância por arquivo. A API não tem
autenticação nem autorização; CORS não substitui esses controles. A
implementação é destinada à demonstração local com dados fictícios.


## Mind & Sleep — isolamento e confinamento

Implementação baseada em [docs/03_Isolamento_DEV.md](docs/03_Isolamento_DEV.md).
As rotas existentes e o envelope de registros continuam disponíveis. O catálogo é obtido em
`GET /api/v1/areas/isolation_confinement?astronautId=astro_demo_001`.
As definições incluem `scale` (limites, `numericType`, `precision` em casas
decimais e `step`), `collection`, `monitoring` e `references`. As unidades são
validadas exatamente; `null` é JSON null, não a string `"null"`.

| Indicador | Unidade | Valores aceitos |
| --- | --- | --- |
| `sleep_duration` (mantido) | `h` | 0–24, até 2 casas |
| `sleep_quality` | `null` | 0–100, até 2 casas |
| `sleepiness_kss` | `null` | Inteiro 1–9 |
| `fatigue_samn_perelli` | `null` | Inteiro 1–7 |
| `stress` | `null` | 0–100, até 2 casas |
| `mood_score` | `null` | 0–100, até 2 casas |
| `pvt_response_speed` | `1/s` | 0–10, até 4 casas |
| `pvt_lapses` | `count` | Inteiro seguro não negativo |
| `pvt_false_starts` | `count` | Inteiro seguro não negativo |

Precisão, intervalos numéricos de transporte e passos são escolhas de
implementação da equipe, não limites clínicos. No endpoint legado `/records`, o front-end deve arredondar
explicitamente antes de enviar; a API rejeita precisão excessiva. Nos novos
endpoints, o servidor calcula e arredonda os resultados, preservando os
componentes e valores anteriores ao arredondamento para conferência. As contagens não podem exceder
`Number.MAX_SAFE_INTEGER`. `sleep_duration` preserva o ID e unidade antigos,
mas passa a validar limites e precisão.

### Compatibilidade e cálculo do sono

`fatigue` e `mood` continuam aceitos e legíveis em sua escala antiga de 1–5,
com unidade `null`. Estão marcados `deprecated` e têm `replacedBy` apontando
para `fatigue_samn_perelli` e `mood_score`. Não são convertidos, renomeados nem
misturados com as séries novas: uma conversão atribuiria significado que os
registros antigos não possuem. Clientes antigos continuam podendo usá-los;
novos check-ins devem usar os substitutos. Indicadores legados não recebem
as regras novas de acompanhamento.

No endpoint específico, o servidor calcula (o cálculo local continua aceito
pelo endpoint legado):

```text
horas = (wakeAt - bedAt) / 3600000
        - (sleepLatencyMinutes + awakeMinutes) / 60
```

Os horários devem incluir data e fuso, considerando a passagem da meia-noite.
O catálogo descreve os quatro componentes em `calculation.components`.
O total é persistido em `sleep_duration`. O endpoint `sleep-episodes`
preserva os componentes em `operation.input`, separados dos indicadores e
de `notes`. Registros antigos enviados por `/records` continuam sem
componentes; não são inventados componentes retroativamente.

### Registrar check-in e execução PVT-B

Envie JSON ao endpoint existente:
`POST /api/v1/areas/isolation_confinement/records`.
Exemplo de check-in diário (valores fictícios):

```json
{
  "astronautId": "astro_demo_001",
  "records": [
    { "indicator": "sleep_duration", "value": 7.25, "unit": "h", "source": "manual", "recordedAt": "2026-11-14T08:00:00-03:00" },
    { "indicator": "sleep_quality", "value": 75.5, "unit": null, "source": "manual", "recordedAt": "2026-11-14T08:00:00-03:00" },
    { "indicator": "sleepiness_kss", "value": 3, "unit": null, "source": "manual", "recordedAt": "2026-11-14T08:00:00-03:00" },
    { "indicator": "fatigue_samn_perelli", "value": 2, "unit": null, "source": "manual", "recordedAt": "2026-11-14T08:00:00-03:00" },
    { "indicator": "stress", "value": 25, "unit": null, "source": "manual", "recordedAt": "2026-11-14T08:00:00-03:00" },
    { "indicator": "mood_score", "value": 70, "unit": null, "source": "manual", "recordedAt": "2026-11-14T08:00:00-03:00" }
  ]
}
```

A API também aceita check-ins parciais. `collection.schedule` propõe coleta
diária para os seis indicadores de check-in. Para PVT-B, propõe quatro dias
entre testes (referência da pesquisa) e coleta antes de tarefas críticas
(proposta da equipe). São metadados configuráveis em
`shared/config/isolation.js`; não são agendamentos nem bloqueios de POST.

O front-end executa o teste e usa `performance.now()` para medir os tempos.
A integração legada pode continuar enviando os três agregados a `/records`,
no mesmo lote, com um `groupId` único por execução e a mesma origem/instante.
Para centralizar o cálculo, use `pvt-sessions`, descrito abaixo. Exemplo legado:

```json
{
  "astronautId": "astro_demo_001",
  "records": [
    { "indicator": "pvt_response_speed", "value": 3.4567, "unit": "1/s", "source": "manual", "recordedAt": "2026-11-14T08:05:00-03:00", "groupId": "pvt-20261114-001" },
    { "indicator": "pvt_lapses", "value": 2, "unit": "count", "source": "manual", "recordedAt": "2026-11-14T08:05:00-03:00", "groupId": "pvt-20261114-001" },
    { "indicator": "pvt_false_starts", "value": 0, "unit": "count", "source": "manual", "recordedAt": "2026-11-14T08:05:00-03:00", "groupId": "pvt-20261114-001" }
  ]
}
```

Velocidade é a **média dos inversos** dos tempos em segundos, não o inverso
da média nem tempo médio em ms. O catálogo descreve lapsos (≥355 ms), falsos
inícios (<100 ms ou toque sem estímulo, excluídos da média) e timeout de 30 s.
Essas definições se referem ao [protocolo PVT-B](https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf)
e à especificação da equipe. `/records` continua aceitando agregados sem
recalculá-los e rejeitando arrays de tempos. Esse endpoint legado não oferece
idempotência. Os novos endpoints abaixo calculam a partir das entradas
originais e oferecem idempotência persistente.

### Novos contratos para Samuel: cálculos no servidor

Envie `Content-Type: application/json`. Os campos mostrados nas requisições
são obrigatórios; campos desconhecidos são rejeitados. O limite HTTP continua
1 MB. `source` aceita `manual`, `sensor` ou `simulated`. Os IDs de episódio e
sessão aceitam 1–128 caracteres ASCII (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, `-`),
começando com letra ou número. Gere e guarde o ID **antes** de enviar.

**Sono — `POST /api/v1/areas/isolation_confinement/sleep-episodes`:**

```json
{
  "astronautId": "astro_demo_001",
  "episodeId": "sleep-20261114-001",
  "source": "manual",
  "bedAt": "2026-11-13T23:00:00-03:00",
  "wakeAt": "2026-11-14T07:00:00-03:00",
  "sleepLatencyMinutes": 20,
  "awakeMinutes": 25
}
```

Esse exemplo resulta em **7,25 h**. `wakeAt` deve ser posterior a `bedAt`,
com intervalo máximo de 24 h. Ambos exigem data, hora e fuso; a diferença é
calculada entre instantes absolutos, inclusive quando os fusos diferem.
Minutos aceitam números finitos, inclusive frações, não negativos; sua soma
não pode exceder o intervalo na cama. Zero horas é aceito. O registro usa
`recordedAt = wakeAt`, `periodStart = bedAt`, unidade `h` e duas casas decimais.

A resposta 201 contém `apiVersion`, `astronautId`, `replayed: false`,
`operation` e `records`. Trecho do cálculo retornado:

```json
{
  "version": "sleep-v1",
  "timeInBedMinutes": 480,
  "unroundedHours": 7.25,
  "durationHours": 7.25,
  "precision": 2
}
```

Esse objeto está em `operation.calculation`; `operation.input` contém os
componentes completos da requisição. `records` contém o registro
`sleep_duration` com ID e datas de criação gerados pelo servidor.

**PVT-B — `POST /api/v1/areas/isolation_confinement/pvt-sessions`:**

O navegador continua responsável pelos estímulos, espera aleatória de 1–4 s,
feedback e relógio monotônico. Use `performance.now()` para `durationMs`,
`atMs` e `rtMs`; não envie o valor absoluto desse relógio, mas as diferenças.
`startedAt` e `endedAt` são datas ISO com fuso para localizar a sessão no
histórico; não são usadas para medir tempos de reação.

Exemplo fictício com respostas, falsos inícios e seis timeouts:

```json
{
  "astronautId": "astro_demo_001",
  "sessionId": "pvt-20261114-001",
  "source": "manual",
  "startedAt": "2026-11-14T11:00:00Z",
  "endedAt": "2026-11-14T11:03:12Z",
  "durationMs": 192000,
  "completed": true,
  "events": [
    { "kind": "response", "atMs": 1500, "rtMs": 500 },
    { "kind": "response", "atMs": 3750, "rtMs": 250 },
    { "kind": "response", "atMs": 5099, "rtMs": 99 },
    { "kind": "false_start", "atMs": 5500 },
    { "kind": "timeout", "atMs": 37000 },
    { "kind": "timeout", "atMs": 68000 },
    { "kind": "timeout", "atMs": 99000 },
    { "kind": "timeout", "atMs": 130000 },
    { "kind": "timeout", "atMs": 161000 },
    { "kind": "timeout", "atMs": 192000 }
  ]
}
```

`atMs` é o instante do toque ou timeout relativo ao início da sessão.
`rtMs` é o tempo desde o estímulo até o toque, em milissegundos. Envie **todos**
os eventos, em ordem estritamente crescente de `atMs`, sem duplicar eventos:

| `kind` | Campos | Tratamento no servidor |
| --- | --- | --- |
| `response` | `atMs`, `rtMs` (0 ≤ RT < 30000) | RT <100 é falso início; RT ≥100 entra na média; RT ≥355 é lapso |
| `false_start` | `atMs`, sem `rtMs` | Toque **sem estímulo**; incrementa falsos inícios, excluído da média |
| `timeout` | `atMs`, sem `rtMs` | Ausência de resposta após 30000 ms; lapso com RT fixo de 30 s na média |

Não envie o mesmo toque como `response` e `false_start`. O servidor deriva
os limiares, não aceita `lapse: true` nem agregados fornecidos pelo cliente.
A velocidade é `mean(1000 / rtMs)` das respostas válidas e timeouts, arredondada
a quatro casas. O exemplo produz velocidade **0,775 1/s**, **7 lapsos** e
**2 falsos inícios** (8 observações válidas, incluindo 6 timeouts).

A resposta 201 tem o mesmo envelope de sono. `operation.calculation`
contém `protocol`, `validResponses`, `timeouts`, `lapses`, `falseStarts`,
`meanReciprocalSeconds` (antes de arredondar), `responseSpeed` e `precision`.
`records` contém os três IDs existentes (`pvt_response_speed`, `pvt_lapses`,
`pvt_false_starts`), com `groupId = sessionId` e `recordedAt = endedAt`.
`operation.input.events` guarda os eventos que permitem refazer o cálculo.

Validações e decisões de integração:

- `completed` é booleano; sessão concluída exige eventos e duração de
  180000 a 210000 ms. Não iniciar estímulos a partir de 180000 ms. A extensão
  de até 30 s permite terminar o último estímulo já apresentado: decisão
  explícita de integração da equipe. Nenhum cronômetro roda no servidor.
- Eventos devem caber na duração; o início inferido do estímulo
  (`atMs - rtMs`, ou `atMs - 30000`) não pode ser negativo, sobrepor evento
  anterior nem ocorrer após a janela de estímulos. Limite técnico: 2000 eventos.
- `endedAt` deve ser posterior a `startedAt`. Não se exige igualdade entre
  a diferença de relógio civil e `durationMs`, pois o relógio civil pode ser
  ajustado. O servidor não certifica a origem dos tempos, eventos omitidos,
  aleatoriedade ou intervalo de estímulos; esses controles ficam no navegador.
- Interrupção: envie `completed: false`, duração decorrida e somente eventos
  já encerrados. Não converta um estímulo pendente em timeout antes de 30 s.
  A operação fica `status: "interrupted"`, com cálculo parcial auditável,
  mas `records: []`: não participa de tendências ou baseline. Pode ter zero eventos.
- Conclusão com apenas falsos inícios fica `status: "no_valid_responses"`,
  velocidade `null` e `records: []`. Não se fabrica velocidade zero.
- A submissão é final: uma sessão interrompida não pode ser alterada para
  concluída com o mesmo ID. Reinicie o teste com um novo ID; não reutilize
  eventos parciais como uma sessão completa.

**Reenvio e consulta:** a chave é `(tipo, astronautId, episodeId/sessionId)`.
Primeiro envio retorna 201; repetir o conteúdo retorna 200,
`replayed: true`, com os mesmos IDs, valores e datas salvos. A ordem das
chaves JSON não importa; ordem dos eventos, valores, origem e strings de
horário fazem parte do conteúdo. Conteúdo diferente com a mesma chave retorna
409 `OPERATION_CONFLICT`, sem alteração. Identificador PVT já usado em
agregados legados também retorna 409. Não use simultaneamente `/records` e
`pvt-sessions` para salvar a mesma execução: o endpoint legado continua sem
idempotência, e a proteção não é retroativa a envios futuros por ele.

Consulta de auditoria, inclusive após reiniciar:

```text
GET /api/v1/areas/isolation_confinement/sleep-episodes/sleep-20261114-001?astronautId=astro_demo_001&dataset=real
GET /api/v1/areas/isolation_confinement/pvt-sessions/pvt-20261114-001?astronautId=astro_demo_001&dataset=real
```

O padrão `dataset=simulated` só encontra operações simuladas; `real` reúne
manual/sensor. Operação ausente nesse dataset retorna 404. O GET retorna o
mesmo envelope com `replayed: false` (é consulta, não reenvio).

[docs/examples.json](docs/examples.json) inclui requisições e respostas
**completas**, obtidas pela API, em `sleepEpisode`, `sleepEpisodeReplay`,
`pvtSession`, `pvtSessionReplay`, `pvtInterrupted` e `pvtConflict`.

**Persistência:** arquivos antigos em formato array continuam legíveis.
Na primeira operação nova, o mesmo arquivo passa atomicamente para
`{ "schemaVersion": 2, "records": [...], "operations": [...] }`, preservando
todos os registros. `operations` guarda entrada, cálculo versionado, estado,
data de criação e IDs dos registros resultantes. As consultas existentes
continuam retornando os indicadores e acrescentam avaliações em campo separado; a auditoria é consultada nas rotas
novas. Reenvios são serializados na mesma fila das gravações e funcionam
após reinício. Falhas não deixam auditoria ou indicadores parcialmente salvos.
Use **uma instância por arquivo**; não há trava entre processos. Versões
antigas do servidor não leem o envelope v2 — faça backup antes de um rollback.

### Acompanhamento demonstrativo

Os detalhes e o histórico de isolamento incluem o campo adicional
`monitoring`; `records`, `latestRecords` e `trends` mantêm seus formatos.
Cada resultado informa indicador, origem, instante avaliado, baseline,
regras acionadas com procedência, `status`, `level`, `inObservation` e
mensagem não diagnóstica. `level` pode ser `attention`, `risk` ou `null`:
são classificações demonstrativas, sem diagnóstico ou alertas de emergência.
Não há conclusão “Normal”. Consulte `status` para distinguir ausência de
sinal demonstrativo de ausência de dados, baseline insuficiente e coleta.

As regras em `shared/config/isolation.js` são configuráveis e expostas no
catálogo. Cada regra identifica `basis: "fonte"` com referências ou
`basis: "proposta da equipe"` com nota. Mesmo os limiares referenciados têm
uso demonstrativo; não validam o produto para astronautas. Sono ≤6 h,
KSS 7, KSS ≥8, Samn–Perelli 4/≥5, sono ≤4 h e três noites curtas são
tratados com a procedência descrita em cada regra. As associações de sono
são contextualizadas pelo [estudo na ISS](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/),
não convertidas em diagnósticos.

Faixas pessoais para qualidade do sono, estresse, humor, velocidade e lapsos:

- Os primeiros sete **dias de calendário UTC**, a partir da primeira
  observação comparável de cada indicador/origem, são de coleta. Não é uma
  janela móvel. Uma observação por dia (a última) evita inflar a amostra.
- A faixa é média ± 2 desvios padrão **amostrais** (`n - 1`), proposta da
  equipe, sem validação NASA. São necessários sete dias com dados nos
  check-ins; PVT precisa de dois dias com testes, coerentes com dias 1 e 5.
  O mínimo de dois é uma escolha demonstrativa de baixa robustez estatística.
- Durante a janela, retorna `baseline_collecting`; dias insuficientes ou
  desvio zero retornam `baseline_insufficient`. Dias ausentes não são
  preenchidos com zero e a janela não é estendida automaticamente. Sem
  baseline válida, nenhuma classificação de faixa pessoal é emitida.
- Após a coleta: qualidade fora da faixa, estresse acima e humor abaixo
  exigem três dias consecutivos. Lacunas interrompem a sequência. PVT exige
  uma observação posterior abaixo da faixa de velocidade ou acima de lapsos.
  Falsos inícios não têm corte proposto e retornam `not_applicable` com dados.
- `no_demonstrative_signal` significa apenas que nenhuma regra disparou;
  `awaiting_follow_up` indica baseline pronta, sem observação posterior.
  Os campos `recordedAt`/`asOf` mostram a idade da avaliação: não é previsão
  do estado atual. No detalhe e no histórico, medições com mais de sete dias recebem `stale`. Os registros e eventos anteriores continuam disponíveis.

As origens `manual`, `sensor` e `simulated` nunca são misturadas. No histórico,
a baseline usa todos os dados anteriores a `to` (exclusive), mesmo se `from`
limitar a lista retornada. Nos detalhes, usa dados anteriores ao instante
atual. Registros futuros não entram no acompanhamento. A opção
`indicator` do histórico também filtra `monitoring`.

### Carga incremental e limitações

`openStore` acrescenta 41 registros novos a uma base original: cinco novos
indicadores diários por sete dias e três agregados PVT em duas execuções.
A carga usa a data de criação mais antiga da demonstração como âncora e
IDs determinísticos para as adições. Se não houver simulação existente,
usa o instante da carga. Reabrir o arquivo não duplica entradas; cargas
parciais são completadas por indicador/instante. A gravação usa arquivo
temporário e rename. Registros existentes, inclusive manuais, sensores,
`fatigue` e `mood`, são preservados sem conversão. Os dados locais continuam
ignorados pelo Git. Faça a inicialização com apenas um processo por arquivo.

As novas simulações são fictícias e respeitam a cadência proposta, não
representam medições. A demo inicial mostra baseline em coleta; não fabrica
um oitavo dia para produzir uma classificação. Os testes usam históricos
mais longos para conferir acompanhamento após a coleta.

A KSS contém apenas valores e rótulos próprios resumidos. Seu texto completo
não foi incorporado e depende de confirmação de permissão. A referência KSS
citada pela pesquisa redireciona atualmente para uma página geral; o PDF
Samn–Perelli não foi recuperado nesta revisão. Essas referências são
identificadas como fornecidas pela pesquisa, não como validação independente.

Humor e estresse têm metadados de audiência astronauta/CMO, mas **não há
controle de acesso implementado**. Os endpoints atuais não garantem essa
privacidade: usar apenas dados fictícios na demonstração. Nenhum front-end
foi alterado. Esta ferramenta apoia automonitoramento e **não faz diagnóstico**.
