# Verificação (Etapa 4) · Healthnauts / AstroVida v2

Revisão independente em 15/11/2026, branch `astrovida-v2`, a partir do commit `49a4cb2`.
Tabela lida de `shared/config/` (`levels.js`, `research.js`, `isolation.js`) e do uso em `shared/evaluation.js`, `monitoring.js`, `calculations.js` e `ground-reports.js`, comparada com a especificação v2 e com as exceções do plano aprovado.

Legenda da fonte: `[n]` = fonte da seção 5 da especificação · `team_proposal` = regra marcada [time] · "backend" = exceção do plano em que o backend prevalece.

Resumo: **48 OK · 5 DIVERGENTE**. As 5 divergentes são regras da especificação que não existem no código (nenhum número errado). Nenhuma foi corrigida: não são número diferente da especificação, e implementar regra nova está fora do escopo desta etapa.

## Regras gerais (seção 2)

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| Níveis, cores e ícones | 6 níveis, cores e ícones da 2.1 | todos | [35] nomes; team_proposal definições | OK |
| Prioridade na tela | Emergency > Warning > Caution > Unavailable crítico > Advisory > Normal | – | team_proposal | OK |
| Emergency só de condição da nave | `cabin_pressure_total`, `cabin_inspired_oxygen`; trava rebaixa o resto para Warning | Emergency | team_proposal | OK |
| Prazo de acknowledge | 10 min Warning, 2 min Emergency | – | team_proposal | OK |
| Validade dos sinais vitais | 10 min | Unavailable | team_proposal | OK |
| Validade da cabine | 5 min (CO2, pressão, O2, clima, ruído) | Unavailable | team_proposal | OK |
| Validade do check-in diário | 36 h (também nos autorrelatos de equilíbrio e visão) | Unavailable | team_proposal | OK |
| Valor impossível | FC 0 ou > 250, SpO2 > 100, temperatura < 30 °C | Unavailable | team_proposal | OK |
| `quality = "poor"` | não existe campo de qualidade nem regra | Unavailable | team_proposal | **DIVERGENTE** (regra ausente) |
| Sair de "em observação" após 3 Normal | não implementado | – | team_proposal | OK (plano: não entra) |

## 3.1 Vital Signs

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| Pontos do NEWS2 (FR, SpO2, O2, PAS, pulso, consciência, temperatura) | faixas iguais à tabela | – | [25] | OK |
| NEWS2 soma | um parâmetro 3 ou soma 5–6; soma ≥ 7 | Caution; Warning (nunca Emergency) | [25] + team_proposal | OK |
| NEWS2 1–4 com sinal fora da faixa pessoal; PA vs. linha de base | não existe | Advisory | team_proposal | **DIVERGENTE** (regra ausente) |
| NEWS2 em exercício | pulso e respiração continuam pontuando | – | backend | OK (exceção do plano) |

## 3.2 Mind & Sleep

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| Duração do sono | ≤ 6 h em 1 noite; ≤ 6 h em 3 noites seguidas; ≤ 4 h | Advisory; Caution; Warning | [26] [2] + team_proposal | OK |
| Qualidade do sono | fora da faixa 1 dia; 3 dias seguidos | Advisory; Caution | [26] + team_proposal | OK |
| KSS | 7; 8–9 | Advisory; Caution | [27] [28] + team_proposal | OK |
| Samn-Perelli | 4; 5–6; 7 | Advisory; Caution; Warning | [29] [27] | OK |
| Estresse | acima da faixa 1 dia; 3 dias seguidos | Advisory; Caution | [26] [30] | OK |
| Humor | abaixo da faixa 1 dia; 3 dias seguidos | Advisory; Caution | [30] | OK |
| PVT-B velocidade (média de 1/RT) | abaixo da faixa em 1 teste | Caution | [31] [26] | OK |
| PVT-B lapsos | acima da faixa em 1 teste | Advisory | [31] | OK |
| Faixa pessoal | 7 primeiros dias, média ± 2 DP, piso de DP 5 nas escalas 0–100 | – | team_proposal | OK |
| Linha de base do PVT-B | 7 primeiros dias, mínimo 2 testes | – | backend | OK (exceção do plano) |
| Protocolo PVT-B | 3 min, lapso ≥ 355 ms, falso início < 100 ms, timeout 30 s, espera 1–4 s, a cada 4 dias | – | [31] [26] | OK |

## 3.3 Body & Fitness

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| Capacidade aeróbica | 80–89%; < 80% | Advisory; Caution | [1] V1 4003 + team_proposal | OK |
| Força muscular | 80–89%; < 80% | Advisory; Caution | [1] V1 4024 + team_proposal | OK |
| VO2max antes de EVA | < 32,9 (micro) ou < 36,5 (superfície) | Warning | [1] V1 4001/4002 | OK |
| Massa corporal | perda 3–5%; > 5% | Advisory; Caution | [23] + team_proposal | OK |
| Exercício < 90 min em 3 dias da semana | não existe (só o acompanhamento na tela) | Advisory | team_proposal | **DIVERGENTE** (regra ausente) |
| Força feita vs. planejada por 2 semanas | não existe | Advisory | team_proposal | **DIVERGENTE** (regra ausente) |
| Osso medido (DXA) | fora do backend; só curva ilustrativa e tracker | – | backend | OK (exceção do plano) |

## 3.4 Balance & Vision

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| Enjoo de movimento | 5–19; 20 | Advisory; Caution | [24] + team_proposal | OK |
| Tontura | sim; sim + quase desmaio | Advisory; Warning | team_proposal | OK |
| Visão e Amsler | qualquer alteração | Caution | [20] | OK |
| Dor de cabeça | 4–10 | Advisory | team_proposal | OK |
| Stand test pós-pouso | PAS ≥ 20 ou PAD ≥ 10 em 3 min; com tontura; FC ≥ 30 | Caution; Warning; Advisory | [19] | OK |
| Lembrete de fluid loading | não existe | – | [21] | **DIVERGENTE** (ausente) |

## 3.5 Radiation

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| Dose de carreira | 600 mSv; 75%, 90%, 100% | Advisory; Caution; Warning | [1] V1 4030 + team_proposal | OK (cálculo do backend, exceção do plano) |
| Taxa diária | sem nível | – | backend | OK (exceção do plano) |
| Evento solar | SPE na nave; ESPE; SPE/ESPE em EVA | Advisory; Warning; Warning | [12] | OK |
| Limites por órgão (tela, só referência) | iguais à Tabela 4.8-1 | – | [1] | OK |

## 3.6 Cabin Environment

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| ppCO2 1 h | > 3,0; > 4,5 mmHg (média ponderada no tempo) | Caution; Warning | [3] V2 6004 (Rev. F), [4] + team_proposal | OK (ponderação do backend, exceção do plano) |
| ppCO2 7 dias | ≥ 2,5 mmHg | Advisory | [4] | OK |
| PIO2 | 127–144 ou 156–356; < 127 ou > 356 mmHg; (PB − 47) × FIO2 | Caution; Emergency | [7] V2 6003 (Rev. F) + team_proposal | OK |
| Pressão da cabine | < 5,0 ou > 15,0 psia | Emergency | [3] V2 6006 (Rev. F), [5] | OK |
| Temperatura e umidade | fora de 20–25 °C / 30–60%; fora de 18–27 °C ou umidade < 25% | Advisory; Caution | [3] V2 6012/6013 (Rev. F) | OK |
| Ruído | > 58 dBA (trabalho) ou > 49 dBA (sono); ≥ 85 dBA | Advisory; Caution | [8] [9], V2 6077 | OK |
| Checklist de DCS pós-EVA | qualquer um dos 7 itens | Warning | [10] + team_proposal | OK |

## 3.7 Mission Context

| Parâmetro | Limite no código | Nível | Fonte | Resultado |
|---|---|---|---|---|
| Resposta do solo | 2 × atraso de ida + 15 min | – | [15] | OK |
| Sem link com a Terra | relatório fica QUEUED; mensagem da 3.7 | Advisory | plano (ajuste 2 e decisão do plano) | OK |
| Resposta padrão do solo | texto igual ao da 3.7 | – | team_proposal | OK |
| Mensagens "What to do" (seções 3.1 a 3.7) | textos iguais; sufixos de procedimento e CMO da 2.2 | – | especificação | OK |

## Números no código que não estão na especificação

Mantidos do backend, sem nível próprio: validade de 14 dias para testes de condicionamento, 7 dias para o PVT-B, 1 h para o evento solar, 24 h para o checklist pós-EVA; intervalo máximo de 10 min entre leituras de CO2; quase desmaio sem tontura = Advisory (decisão anotada no código).

## Só listado, sem alteração

- "Cabin sensor offline": no navegador só vira Unavailable 5 min depois da última leitura ao vivo (o painel avisa).
- Notas internas de `shared/config/isolation.js` (campo `note`) estão em português; não aparecem na tela.
- Pressão da cabine: a Rev. F escreve 5 < P ≤ 15,0 psia; o código marca Emergency só abaixo de 5,0, então exatamente 5,0 psia fica Normal. Valor não alterado.
- Outras mensagens de erro da API fora de `validation.js` e `calculations.js` (`shared/routes.js`, `server/app.js`) continuam em português.

## Corrigido depois da verificação

- Radiation: sem evento solar registrado a avaliação `solar_event_simulated` é Normal ("No solar event recorded."), como a especificação ("Sem evento"). A dose de carreira não muda.
- Gravity: o cartão "Aerobic capacity" usa a avaliação mais recente do indicador (antes pegava a primeira série).
- Overview (HUD): o cartão conta as 5 áreas e os sinais vitais ("n of 6", "5 areas + vital signs"), para não mostrar "0 of 5" com selo Caution.
- Mensagens de erro de `shared/validation.js` e `shared/calculations.js` traduzidas para inglês, sem mudar a lógica.
- Distance: seletor "Mission: ISS · Moon · Mars". Grava um novo contexto de missão (mesmo `missionId` e `startedAt`, para a dose de carreira continuar avaliada) com um atraso de ida dentro da faixa da 3.7: ISS 0,3 s (mesmo valor de `shared/scenarios.js`), Lua 10 s (faixa 3 a 10 s), Marte 8 min (valor do perfil padrão, faixa 4 a 24 min). A resposta do solo segue 2 × atraso + 15 min.
- Citações: NASA-STD-3001 Vol. 2 Rev. F (aprovada em 2026-07-14) no lugar da Rev. D e da tabela da Rev. B, sem mudar nenhum valor. Conferidos na Rev. F: V2 6003 (PIO₂ 145 a 155 normoxia, 356 hiperoxia indefinida, 127 hipoxia leve em média de 1 h, mínimo absoluto 122), V2 6004 (CO₂ média de 1 h ≤ 3 mmHg), V2 6006 (5 < P ≤ 15,0 psia), V2 6012 (polígono 18 °C/75% a 27 °C/25%, umidade média acima de 25%). V2 6013, V2 6077 e a seção 10.3 passaram a citar a Rev. F mas não estão nessa lista.

## Corrigido nesta etapa

- Contraste: o número do sino (`Notifications.tsx`) e o do cartão "Morning check-in" (`Isolation.tsx`) eram texto branco sobre `red-500` (3,76:1). Passaram para `red-600` (4,83:1). Nenhum outro texto visível ficou abaixo de 4,5:1 nas 8 rotas, no HUD, no Simple view, no painel Demo, no sino e no detalhe de tópico (botões desabilitados não contam).

## Teste no navegador (`npm run preview`, Chrome)

| Item | Resultado |
|---|---|
| Estado inicial | Tudo Normal; dose de carreira avaliada (195 de 600 mSv, 32,5%, Normal); estresse e PVT-B avaliados (Normal); sino com 2 pendências |
| One hour of elevated cabin CO₂ | Caution, mensagem da 3.6 + sufixos; faixa no topo sem Acknowledge |
| Simulated solar event | Advisory, mensagem de SPE; sem notificação |
| A week of short sleep | Warning (sono ≤ 4 h); Acknowledge funciona e o alerta continua ativo; relatório SENT |
| Fitness change and reported symptoms | Caution (aeróbico 76%) e Advisory (tontura); ver item listado sobre o cartão |
| Mars communication outage | Advisory, "No contact with Earth…"; Warning disparado sem link fica QUEUED e vira SENT ao restaurar o link (resposta em 55 min = 2 × 20 + 15) |
| Cabin pressure loss | Emergency em tela cheia (pressão e O2), contagem de 2 min, texto obrigatório, Acknowledge fecha a tela, relatório imediato |
| Cabin sensor offline | Cabine inteira Unavailable depois de 5 min sem leitura |
| Fever with a high early warning score | Warning (nunca Emergency), Acknowledge e relatório |
| Exercising (live sensor) | NEWS2 6, Caution (pulso e respiração pontuam: exceção do plano) |
| Back to nominal | Alertas de Emergency fecham com a leitura normal |
| Reset demo | Volta ao estado inicial em todas as vezes |
| Ciclo do relatório com link | QUEUED 01:00 → SENT 01:00 → RECEIVED 01:08 → REPLIED 01:31 com a resposta padrão (atraso de 8 min) |
| HUD ↔ Simple view | Troca nos dois sentidos e a escolha persiste ao recarregar |
| Console | Sem erros |
