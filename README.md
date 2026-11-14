# NasaSpaceAppsChallenge2026
Black Belt's Team

## Back-end

API de demonstração em Node.js e Express para registros dos cinco riscos de
voos espaciais. O único astronauta aceito é `astro_demo_001`. Os dados iniciais
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
reinício automático, execute `npm run dev`. Encerre com `Ctrl+C`.
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

Todas as consultas GET exigem `astronautId=astro_demo_001` e aceitam
`dataset=simulated` (padrão) ou `dataset=real`. O conjunto `real` reúne
registros de origem `manual` e `sensor`.

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/api/v1/overview` | Resumo das cinco áreas |
| GET | `/api/v1/areas/:areaId` | Conteúdo, referências, catálogo e últimos registros |
| GET | `/api/v1/areas/:areaId/history` | Histórico e tendências |
| POST | `/api/v1/areas/:areaId/records` | Criação de lote; retorna HTTP 201 |

Áreas: `radiation`, `isolation_confinement`, `distance_from_earth`,
`gravity_fields` e `hostile_closed_environment`.

O histórico aceita `indicator`, `from` e `to`. As datas devem estar em ISO
8601 com fuso (por exemplo, `2026-11-14T12:00:00Z`). O intervalo inclui `from`
e exclui `to`. Por padrão, `to` é o instante da consulta e `from` fica sete
dias antes de `to`. O limite é 10.000 registros por resposta; reduza o
intervalo se a consulta exceder esse limite.

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
corpo acima do limite retorna 413 e falha interna retorna 500.

### Persistência, testes e limites

Na ausência do arquivo configurado, o servidor cria 153 registros simulados
(24 indicadores: 21 diários durante sete dias e três agregados PVT em duas
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
As rotas e o envelope de registros continuam iguais. O catálogo é obtido em
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
implementação da equipe, não limites clínicos. O front-end deve arredondar
explicitamente antes de enviar; a API rejeita precisão excessiva e não
arredonda silenciosamente. As contagens não podem exceder
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

Para o sono, o front-end calcula:

```text
horas = (wakeAt - bedAt) / 3600000
        - (sleepLatencyMinutes + awakeMinutes) / 60
```

Os horários devem incluir data e fuso, considerando a passagem da meia-noite.
O catálogo descreve os quatro componentes em `calculation.components`.
Somente o total é persistido em `sleep_duration`; os componentes não são
armazenados nem enviados em `notes`. Não foram criados indicadores brutos.

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
`src/config/isolation.js`; não são agendamentos nem bloqueios de POST.

O front-end executa o teste e usa `performance.now()` para medir os tempos.
Envia somente os três agregados, no mesmo lote, com um `groupId` único por
execução e a mesma origem/instante:

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
e à especificação da equipe. Se não houver respostas válidas, não envie
uma execução com velocidade inventada. O servidor não executa estímulos,
cronômetros ou cálculo a partir dos tempos individuais; arrays de tempos e
outros campos desconhecidos são rejeitados. A API verifica a estrutura do
lote, mas não pode comprovar o protocolo ou recalcular agregados sem os
dados brutos. Não há idempotência para POST: não reenviar uma execução já
confirmada com HTTP 201. A idempotência descrita abaixo é da carga simulada.

### Acompanhamento demonstrativo

Os detalhes e o histórico de isolamento incluem o campo adicional
`monitoring`; `records`, `latestRecords` e `trends` mantêm seus formatos.
Cada resultado informa indicador, origem, instante avaliado, baseline,
regras acionadas com procedência, `status`, `level`, `inObservation` e
mensagem não diagnóstica. `level` pode ser `attention`, `risk` ou `null`:
são classificações demonstrativas, sem diagnóstico ou alertas de emergência.
Não há conclusão “Normal”. Consulte `status` para distinguir ausência de
sinal demonstrativo de ausência de dados, baseline insuficiente e coleta.

As regras em `src/config/isolation.js` são configuráveis e expostas no
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
  do estado atual. Não há regra de expiração dos registros.

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
