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
| ppCO2 1 h | > 3,0; > 4,5 mmHg (média ponderada no tempo) | Caution; Warning | [3] V2 6004, [4] + team_proposal | OK (ponderação do backend, exceção do plano) |
| ppCO2 7 dias | ≥ 2,5 mmHg | Advisory | [4] | OK |
| PIO2 | 127–144 ou 156–356; < 127 ou > 356 mmHg; (PB − 47) × FIO2 | Caution; Emergency | [7] + team_proposal | OK |
| Pressão da cabine | < 5,0 ou > 15,0 psia | Emergency | [3] V2 6006, [5] | OK |
| Temperatura e umidade | fora de 20–25 °C / 30–60%; fora de 18–27 °C ou umidade < 25% | Advisory; Caution | [3] V2 6012/6013 | OK |
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

- Gravity: depois do cenário "Fitness change", o cartão "Aerobic capacity" mostra 95% Normal (dado da missão inicial) enquanto o resumo e o tópico Fitness mostram Caution (76%). A tela pega a primeira avaliação do indicador.
- Overview (HUD): com sinais vitais em Caution, o cartão diz "0 of 5" áreas com o selo Caution (sinais vitais não contam como área).
- Radiation: sem nenhum evento solar registrado o cartão mostra Unavailable; a especificação diz Normal para "sem evento".
- "Cabin sensor offline": no navegador só vira Unavailable 5 min depois da última leitura ao vivo (o painel avisa).
- Distance: não há seletor "Mission: ISS · Moon · Mars".
- Mensagens de erro de validação da API (`shared/validation.js`, `calculations.js`) estão em português e podem aparecer no check-in e no PVT quando o envio falha.
- Notas internas de `shared/config/isolation.js` (campo `note`) estão em português; não aparecem na tela.
