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
para textos e escalas. `notes` é opcional; `periodStart` é obrigatório para
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

Na ausência do arquivo configurado, o servidor cria 112 registros simulados
(16 indicadores em sete dias). Um arquivo existente é preservado; os dados
não são renovados a cada inicialização. Portanto, após algum tempo, consulte
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
