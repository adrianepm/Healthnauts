# Space Apps 2026: especificação para desenvolvimento (front-end e back-end)

Para: Samuel (front) e Bernardo (back). **Versão 2 · 14/11/2026, 17h** (revisada depois da análise crítica da v1).
Este arquivo diz O QUE medir, COMO calcular, QUANDO alertar e O QUE MOSTRAR ao astronauta em cada área do app.
Números entre colchetes, como [3], são fontes (lista no final). **[time]** marca uma regra que o time definiu e que não tem fonte. Na apresentação, falem isso com todas as letras.

### O que mudou da v1 para a v2
1. **Cinco níveis de alerta + "sem dado"** no lugar de Normal/Attention/Risk (seção 2).
2. **Confirmação de alerta (acknowledge)** em Warning e Emergency (seção 2.3).
3. **Estado Unavailable**: sensor com defeito, sinal ruim ou dado velho não é avaliado (seção 2.4).
4. **NEWS2 virou "referência experimental"**: nunca gera Emergency (seção 3.1).
5. **Osso não gera alerta**: projeção é só ilustrativa; entram a avaliação medida e o acompanhamento do exercício de força (seção 3.3).
6. **Teste em pé saiu do "antes do pouso"**: em microgravidade não dá para ficar em pé. Agora é depois do pouso (seção 3.4).
7. **Fluid loading**: o app não calcula mais volume; só lembra o plano médico aprovado (seção 3.4).
8. **Mensagens de ação** dizem "siga o procedimento aprovado da missão" em vez de dar a ordem pelo app.
9. **Estrutura de dados** ganhou atividade, qualidade do sinal, horário de recebimento e fase da missão separada da gravidade (seção 1.3).
10. **Comunicação com a Terra simulada** (enviado, recebido, resposta) e tela opcional de Ground Control (seção 3.7).
11. **Versão da norma**: a escolha de revisão do NASA-STD-3001 Vol. 2 virou decisão explícita (seção 3.6).
12. **Stack atualizada** para a que o Samuel está usando (React + Vite + TypeScript).

---

## 0. Como usar este arquivo com uma IA

1. Cole o arquivo INTEIRO na IA, sempre. As regras gerais (seção 2) valem para todos os módulos.
2. Peça UM módulo por vez. Comece pela seção 1 e pela seção 2, porque todo o resto depende delas.
3. Use este pedido, trocando o nome do módulo:

```
Você vai programar parte de um web app em React + Vite + TypeScript, com Tailwind, Recharts, Framer Motion,
Zustand e lucide-react, publicado no GitHub Pages (sem servidor). Siga EXATAMENTE a especificação anexada.
Regras: use só os limites, fórmulas e textos da especificação, sem inventar valores; textos da tela em inglês;
nunca mostre diagnóstico; use a estrutura de dados da seção 1 e os 5 níveis + Unavailable da seção 2;
deixe todos os limites em src/lib/thresholds.ts (não espalhados no código); comente o código em português.
Agora implemente: [NOME DO MÓDULO, ex.: "seções 1 e 2" ou "módulo 3.2 Mind & Sleep"].
Entregue os arquivos completos e diga onde cada um entra no projeto.
```

4. Quando a IA terminar, peça: "Liste os limites que você usou e de qual linha da especificação tirou cada um". Isso pega valor inventado.

---

## 1. Arquitetura e back-end (proposta para o Bernardo aprovar)

### 1.1 Ponto crítico: o GitHub Pages não roda servidor
O GitHub Pages só publica arquivos estáticos. O "back-end" do app é uma camada de TypeScript que roda no navegador, separada da interface. Ela guarda os dados, roda o simulador e aplica as regras. Os dados ficam no estado global (Zustand) e podem ser salvos no `localStorage` (leitura e escrita dentro de `try/catch`). No pitch: numa nave de verdade essa camada rodaria no computador de bordo. **O `localStorage` não é controle de acesso seguro**: a privacidade de humor e estresse é uma proposta de desenho, não segurança implementada.

### 1.2 Camadas
| Camada | Responsável | O que faz |
|---|---|---|
| `src/lib/thresholds.ts` | Bernardo | Limites, níveis, textos e fontes de cada parâmetro (as tabelas da seção 3) |
| `src/store/` | Bernardo | Estado global: astronautas, missão, leituras, alertas, fila de mensagens para a Terra |
| `src/mock/` + simulador | Bernardo | Gera leituras normais e anomalias pelos botões da demo |
| `src/lib/status.ts` | Bernardo | Recebe uma leitura, checa se é válida (2.4), calcula o nível (2.1) e escolhe a mensagem |
| `src/pages/`, `src/components/` | Samuel | Telas, gráficos, check-in, testes (PVT-B, Amsler, stand test), confirmação de alerta |

Regra de ouro: a interface nunca decide nível. Ela manda a leitura para `status.ts` e mostra o que volta.

### 1.3 Estrutura de dados (proposta)
**Leitura (Reading):** o registro único que todo módulo usa.
| Campo | Exemplo | Observação |
|---|---|---|
| id | "r-000123" | único |
| astronautId | "A1" | |
| parameter | "bloodPressure" | id do parâmetro, igual ao de `thresholds.ts` |
| value | `118` ou `{ sys: 112, dia: 70 }` | número OU objeto, para medidas compostas (pressão, sessão de exercício) |
| unit | "mmHg" | sempre a unidade da tabela da seção 3 |
| measuredAt | "2026-11-14T08:00:00Z" | quando a medida foi feita (ISO 8601) |
| receivedAt | "2026-11-14T08:00:02Z" | quando chegou ao sistema (mostra atraso) |
| source | "sensor" | sensor, manual, test, simulated ou dataset |
| sensorId | "wrist-01" | qual aparelho gerou (vazio se manual) |
| quality | "good" | good, fair ou poor; poor = Unavailable (2.4) |
| activity | "rest" | rest, exercise, sleep, eva, other |
| gravity | "MICRO" | MICRO, MOON, MARS, EARTH |
| phase | "CRUISE" | CRUISE, SURFACE_OPS, EVA, PRE_LANDING, POST_LANDING |

**Definição de parâmetro (ParameterDef), em `thresholds.ts`:** id, módulo, nome na tela, unidade, tipo de regra (1.4), faixas por nível e por contexto, mensagem por nível, ids das fontes, o que é regra do time.

**Avaliação (Evaluation):** readingId, level (NORMAL, ADVISORY, CAUTION, WARNING, EMERGENCY, UNAVAILABLE), ruleUsed, messageId, evaluatedAt.

**Alerta (Alert):** id, parameter, level, messageId, createdAt, shownAt, acknowledgedAt (vazio até confirmar), resolvedAt, active (sim/não), escalatedTo (CMO, ground), groundReportId.

**Relatório para a Terra (GroundReport):** id, alertIds, createdAt, status (QUEUED, SENT, RECEIVED, REPLIED, NO_LINK), sentAt, expectedArrivalAt, expectedReplyAt, replyText.

**Astronauta (Astronaut):** id, nome, linha de base por parâmetro (média e desvio padrão), valores pré-missão (aeróbico, força, densidade óssea medida, massa corporal), lista "em observação", histórico de alertas.

**Missão (Mission):** gravity, phase, dia da missão, atraso de comunicação atual, conjunção solar (sim/não), data prevista de pouso, plano médico de fluid loading (vem pronto do médico, o app não calcula).

Exemplo em TS (só para ilustrar):
```ts
{ id: "r-000123", astronautId: "A1", parameter: "bloodPressure", value: { sys: 112, dia: 70 }, unit: "mmHg",
  measuredAt: "2026-11-14T08:00:00Z", receivedAt: "2026-11-14T08:00:02Z", source: "simulated",
  sensorId: "wrist-01", quality: "good", activity: "rest", gravity: "MICRO", phase: "CRUISE" }
```

### 1.4 Tipos de regra (o motor só precisa saber fazer estes 5, mais a checagem de validade)
| Tipo | Como calcula | Usado em |
|---|---|---|
| `validity` (roda antes de tudo) | Sinal ruim, sensor offline ou dado velho → Unavailable (2.4) | Todos |
| `threshold` | Compara o valor com faixas fixas da tabela | CO2, O2, pressão, temperatura, ruído, KSS, Samn-Perelli |
| `baseline` | Faixa pessoal = média ± 2 desvios padrão dos 7 primeiros dias, com piso de DP de 5 pontos nas escalas 0-100 **[time]** | Humor, estresse, qualidade do sono, PVT-B |
| `score` | Soma pontos de vários parâmetros | NEWS2 (referência experimental) |
| `cumulative` | Soma ao longo do tempo e compara com um limite (% do limite) | Radiação |
| `percentOfPre` | Valor atual ÷ valor pré-missão × 100 | Aeróbico, força, massa corporal, densidade óssea MEDIDA |

Média móvel: quando a tabela fala em "média de 1 h" ou "média de 7 dias", calcule a média das leituras dentro dessa janela antes de comparar.

### 1.5 Fluxo de uma leitura
1. Chega uma leitura (sensor simulado, check-in manual ou teste).
2. `status.ts` checa a validade. Se for inválida: nível Unavailable e o app pede nova medida.
3. `status.ts` calcula o nível (seção 2.1) e escolhe a mensagem.
4. Advisory: só mostra no detalhe e no resumo do dia, sem notificação.
5. Caution ou acima: cria um Alerta, marca "em observação" no perfil e notifica.
6. Warning ou Emergency: exige confirmação (2.3) e cria um GroundReport (3.7).

### 1.6 Simulador
- Gera valores normais com pequena variação dentro da faixa Normal de cada tabela.
- Botões da demo: "Fever", "Exercising", "CO2 spike", "Depressurization", "Solar event", "Solar storm", "Sensor fault", "No Earth link", "Poor sleep week", "Landing day".
- Opcional e bom para Relevance: dados reais da ISS (CO2, temperatura, umidade e dose de radiação) do Environmental Data App do NASA OSDR, com tabelas em CSV [11]. Confira a unidade de cada coluna no arquivo antes de usar.

### 1.7 Privacidade
Humor, estresse e o diário aparecem só para o astronauta e o Crew Medical Officer (proposta de interface). O relatório para a Terra leva só os parâmetros em Caution ou acima.

### 1.8 Ordem sugerida de construção (entrega em 15/11)
1. Seções 1 e 2: dados, validade, 5 níveis, confirmação de alerta.
2. Vital Signs e Cabin Environment (a demo mais visual), com o botão "Depressurization" mostrando Emergency.
3. Mind & Sleep e Radiation.
4. Mission Context: relatório para a Terra com atraso simulado.
5. Body & Fitness, Balance & Vision e o post-landing check.

---

## 2. Regras gerais (valem para todo o app)

### 2.1 Os níveis
Os nomes Advisory, Caution, Warning e Emergency seguem a seção 10.3 "Alerts" do NASA-STD-3001 Vol. 2 Rev. D [35]. O time não conseguiu ler a tabela de tipos de alerta dessa seção, então **as definições abaixo e o encaixe de cada parâmetro são decisão do time [time]**.

| Nível | Cor | Ícone (lucide) | Quando usar | O que o app faz |
|---|---|---|---|---|
| **Normal** | verde `#22C55E` | CircleCheck | Medida compatível com o esperado no contexto | Nada além de registrar |
| **Advisory** | azul `#38BDF8` | Info | Mudança que merece acompanhamento, sem ação imediata | Aparece no resumo e no detalhe; sem notificação |
| **Caution** | amarelo `#EAB308` | TriangleAlert | Condição que precisa ser verificada hoje | Notificação + "em observação" no perfil |
| **Warning** | laranja `#F97316` | OctagonAlert | Condição que exige resposta conforme procedimento | Notificação forte + confirmação obrigatória + relatório para a Terra |
| **Emergency** | vermelho `#EF4444` | Siren | Só por critério de segurança previamente definido (ex.: perda de pressão da cabine) | Tela cheia + som + confirmação obrigatória + relatório imediato |
| **Unavailable** | cinza `#64748B` | CircleDashed | Não há dado confiável (2.4) | Pede nova medida; não avalia |

Regras:
- **Nunca só cor:** sempre cor + ícone + texto.
- **Prioridade na tela:** Emergency > Warning > Caution > Unavailable de sensor crítico (sinais vitais, pressão da cabine, O2) > Advisory > Normal.
- **Emergency NUNCA vem de escore de saúde** (NEWS2, escalas, testes). Só de condições da nave com limite oficial (pressão da cabine, O2 inspirado) **[time]**.
- **Gráficos:** a faixa pessoal sombreada usa cinza-azulado neutro (`#5B7FA6`), não o azul do Advisory, para não confundir.
- Sai de "em observação" depois de 3 avaliações Normal seguidas **[time]**.

### 2.2 Texto e tom
- Nunca dizer que o astronauta tem uma doença. Nunca usar tom alarmista.
- Nunca afirmar causa entre dois parâmetros. Pode mostrar lado a lado (ex.: CO2 da cabine e dor de cabeça).
- Escalas criadas pelo time aparecem com o selo "Prototype scale, not a validated instrument".
- Ações operacionais (abrigo, despressurização, fluid loading, EVA) sempre como "Follow your mission's approved procedure / medical plan". O app lembra; quem define a ação é o procedimento da missão.
- Em Caution ou acima, terminar com "Talk to your Crew Medical Officer." **[time]**
- Rodapé fixo: "This tool supports self-monitoring and crew medical decisions. It does not diagnose any condition."

### 2.3 Confirmação de alerta (acknowledge)
- Warning e Emergency mostram o botão "Acknowledge". O app grava `shownAt`, `acknowledgedAt`, `active` e `resolvedAt`.
- Sem confirmação em 10 min (Warning) ou 2 min (Emergency): o alerta vai para o Crew Medical Officer e outro tripulante, e o relatório para a Terra ganha a marca "not acknowledged" **[time]**.
- Texto obrigatório no app e no pitch: **falta de confirmação não significa perda de consciência**. O aparelho pode estar longe, desligado ou sem conexão.
- O alerta continua ativo (aparece no topo) até a condição voltar ao normal, mesmo depois de confirmado.

### 2.4 Unavailable (sem dado confiável)
Uma leitura vira Unavailable, e NÃO é avaliada, quando **[time]**:
- `quality = "poor"` ou o sensor está offline;
- o último dado é velho: sinais vitais > 10 min; cabine > 5 min; check-in diário > 36 h;
- o valor é impossível (ex.: FC 0 ou > 250, SpO2 > 100, temperatura < 30 °C).
Mensagem: "No reliable data. Check the sensor and measure again." A NASA exige alerta quando um equipamento crítico falha ou sai da tolerância [3] [V2 9052].

---

## 3. Módulos
Em cada tabela, a coluna vazia ("não existe") quer dizer que aquele nível não se aplica ao parâmetro.

### 3.1 Vital Signs (sinais vitais, NEWS2 como referência experimental)
**Por que NEWS2:** a NASA manda monitorar, registrar e mostrar a tendência dos sinais vitais [1], mas não publica cortes. O NEWS2 é um escore clínico validado para hospital na Terra [25]. **Ele não foi validado para astronautas, e qualquer ajuste do time o torna uma escala nova, não validada.** Na tela: "Early warning score (terrestrial reference, experimental)".

**Monitoramento principal** = medida atual + atividade + histórico do próprio astronauta + qualidade do sinal. O NEWS2 aparece junto, como referência.

**Pontos por parâmetro [25]:**
| Parâmetro | 3 | 2 | 1 | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|---|
| Frequência respiratória (irpm) | ≤ 8 | | 9 a 11 | 12 a 20 | | 21 a 24 | ≥ 25 |
| SpO2 (%) | ≤ 91 | 92 a 93 | 94 a 95 | ≥ 96 | | | |
| Oxigênio suplementar | | Sim | | Não | | | |
| PA sistólica (mmHg) | ≤ 90 | 91 a 100 | 101 a 110 | 111 a 219 | | | ≥ 220 |
| Pulso (bpm) | ≤ 40 | | 41 a 50 | 51 a 90 | 91 a 110 | 111 a 130 | ≥ 131 |
| Consciência | | | | Alerta | | | Confusão nova ou não responde |
| Temperatura (°C) | ≤ 35,0 | | 35,1 a 36,0 | 36,1 a 38,0 | 38,1 a 39,0 | ≥ 39,1 | |

| Situação | Nível |
|---|---|
| Soma 0, ou 1 a 4 sem nenhum parâmetro valendo 3 | Normal |
| Soma 1 a 4 e algum sinal fora da faixa pessoal do astronauta | Advisory **[time]** |
| Um parâmetro valendo 3, ou soma 5 a 6 | Caution [25] |
| Soma 7 ou mais | Warning [25] (no hospital é "alto risco"; aqui não vira Emergency) |
| Sensor ruim, offline ou dado > 10 min | Unavailable |

**Contexto (pelo campo `activity`):**
- Em exercício, pulso e respiração não pontuam e aparece "Exercising: heart rate not scored" **[time]**.
- Em microgravidade a pressão de 24 h cai cerca de 8 a 10 mmHg e a FC não muda [18]: a pressão também é comparada com a linha de base do astronauta **[time]**.
- Consciência: "What day of the mission is it, and where are you?". Resposta errada vale 3 **[time]**.

**Mensagens:**
- Advisory: "One vital sign is outside your usual range. Measure again in 5 minutes."
- Caution: "One or more vital signs are outside the expected range. Rest for 5 minutes and measure again. If it stays the same, talk to your Crew Medical Officer."
- Warning: "Several vital signs are outside the expected range. Stop your current activity, stay where the crew can see you, and contact your Crew Medical Officer now. A report for the flight surgeon is ready."
- Unavailable: "No reliable vital signs. Check that the sensor is on and in contact with your skin."

---

### 3.2 Mind & Sleep (isolamento e confinamento)
Modelo: o Reaction Self Test (RST) que a NASA usa na ISS [26]. Detalhes no arquivo 03_Isolamento_DEV.md.

**Coleta:** check-in de manhã todo dia (~1 min) com sono, KSS, Samn-Perelli, estresse e humor [26]. Teste de reação PVT-B a cada 4 dias [26] e antes de tarefa crítica **[time]**. Check-in com mais de 36 h = Unavailable.

| Parâmetro | Entrada | Normal | Advisory | Caution | Warning | Fonte |
|---|---|---|---|---|---|---|
| Duração do sono (h) | Hora que deitou, levantou, min para dormir, min acordado. Sono = levantou − deitou − min para dormir − min acordado | > 6 | ≤ 6 em 1 ou 2 noites | ≤ 6 em 3 noites seguidas **[time]** | ≤ 4 **[time]** | [26] [2] |
| Qualidade do sono | Slider 0 a 100 | Faixa pessoal | Fora 1 ou 2 dias | Fora 3 dias seguidos | não existe | [26] |
| Sonolência (KSS 1-9) | 1 opção de 9 | 1 a 6 | 7 **[time]** | 8 ou 9 | não existe | [27] [28] |
| Fadiga (Samn-Perelli 1-7) | 1 opção de 7 | 1 a 3 | 4 | 5 ou 6 | 7 | [29] [27] |
| Estresse | Slider 0 a 100 | Faixa pessoal | Acima 1 ou 2 dias | Acima 3 dias seguidos | não existe | [26] [30] |
| Humor | Slider 0 a 100 | Faixa pessoal | Abaixo 1 ou 2 dias | Abaixo 3 dias seguidos | não existe | [30] |
| Reação PVT-B (média de 1/RT) | Teste de 3 min | Faixa pessoal | não existe | Abaixo da faixa em 1 teste | não existe | [31] [26] |
| Lapsos PVT-B | Teste de 3 min | Faixa pessoal | Acima da faixa em 1 teste | não existe | não existe | [31] |

Samn-Perelli 7 é Warning porque a própria escala diz "performance definitely impaired" [29]. Sono ≤ 4 h é Warning porque a NASA pede para evitar tarefas críticas com fadiga [2]. Sono ideal de referência: 8,5 h, com 2 h livres antes e 1,5 h depois [2]. É meta, não corte.

**Escalas (texto da tela):**
- KSS [28]: "How sleepy have you felt in the last 10 minutes?" 1 Extremely alert · 2 Very alert · 3 Alert · 4 Rather alert · 5 Neither alert nor sleepy · 6 Some signs of sleepiness · 7 Sleepy, no effort to stay awake · 8 Sleepy, some effort to stay awake · 9 Very sleepy, great effort to keep awake, fighting sleep
- Samn-Perelli [29]: "Which statement best describes how you feel right now?" 1 Unusually wide awake · 2 Very alert, wide awake · 3 Normal alertness, well rested · 4 Mild fatigue · 5 Moderate fatigue · 6 Severe fatigue · 7 Severe fatigue, performance definitely impaired

**PVT-B [31]:** 3 min; espera aleatória de 1 a 4 s entre estímulos (contando 1 s mostrando o tempo anterior); contador em ms começa a rodar e o astronauta toca o mais rápido possível; RT ≥ 355 ms = lapso; RT < 100 ms ou toque sem estímulo = falso início (não entra na média); sem resposta em 30 s = lapso de 30 s. Resultado: média de 1/RT, mediana do RT (para a tela), nº de lapsos, nº de falsos inícios. Medir com `performance.now()`, nunca `Date.now()`. Linha de base: 3 primeiros testes **[time]**.

**Mensagens [26] [32] [33]:**
| Parâmetro | Advisory | Caution | Warning |
|---|---|---|---|
| Sono | "You slept 6 hours or less. Protect your next sleep period and dim the lights about an hour before bed." | "Short sleep for 3 nights. Short sleep is linked to slower reactions in space. Ask for help adjusting your schedule if you can." | "You slept 4 hours or less. Avoid critical tasks if possible and talk to your Crew Medical Officer about fatigue countermeasures." |
| Qualidade | "Your sleep quality was lower than usual." | "Sleep quality lower than usual for 3 days. Check light, noise and temperature in your sleep station." | não existe |
| KSS | "You are feeling sleepy. Take a short break and get some light and movement." | "You are very sleepy. Postpone tasks that need full attention if possible." | não existe |
| Samn-Perelli | "You reported mild fatigue. Pace your workload and take short breaks." | "Moderate to severe fatigue. Rest before demanding tasks if possible." | "You reported that your performance is impaired. Do not start critical tasks. Talk to your Crew Medical Officer now." |
| Estresse | "Your stress is higher than usual today." | "Stress higher than usual for 3 days. Exercise, journaling, a call with loved ones or a private talk with the flight surgeon can help." | não existe |
| Humor | "Your mood is lower than usual today." | "Mood lower than usual for 3 days. Free time, contact with family and friends, and time with the crew can help." | não existe |
| PVT-B | "More attention lapses than usual." | "Your reaction speed is below your usual range. Check how you slept and consider a recheck before critical tasks." | não existe |

**Não usar:** POMS (pago), BDI-II e CES-D (triagem de depressão), bateria Cognition completa (software fechado) [30].

---

### 3.3 Body & Fitness (campos gravitacionais: músculo, osso, massa)
| Parâmetro | Entrada | Normal | Advisory | Caution | Warning | Fonte |
|---|---|---|---|---|---|---|
| Capacidade aeróbica (% do pré-voo) | Teste semanal | ≥ 90% | 80% a 89% **[time]** | < 80% | não existe | [1] [V1 4003] |
| Força muscular (% do pré-voo) | Teste semanal | ≥ 90% | 80% a 89% **[time]** | < 80% | não existe | [1] [V1 4024] |
| VO2max antes de EVA (mL/kg/min) | Valor registrado | ≥ 32,9 (microgravidade) ou ≥ 36,5 (superfície) | não existe | não existe | Abaixo do mínimo do contexto | [1] [V1 4001] [V1 4002] |
| Massa corporal (% de perda vs. pré-voo) | Peso semanal | < 3% | 3% a 5% **[time]** | > 5% | não existe | [23] |
| Exercício (min/dia) | Registro diário | ≥ 90 min em 6 ou 7 dias/semana | < 90 min em 3 dias da semana **[time]** | não existe | não existe | [22] |
| Exercício de força feito vs. planejado | Sessões registradas vs. plano da escala | ≥ plano | Abaixo do plano por 2 semanas **[time]** | não existe | não existe | [22] |

**Osso (mudou na v2): nada de alerta por projeção.** A densidade óssea só é medida de verdade antes e depois do voo [22]. O módulo tem três partes:
1. **Bone Health Assessment:** recebe resultados MEDIDOS (DXA), quando existirem, e compara com o pré-voo: ≥ 95% quadril e coluna, ≥ 90% colo do fêmur [1] [V1 4027]. Abaixo disso = Caution.
2. **Bone Loss Educational Simulation:** curva `100 − taxa × meses`, com taxa de 1,0% a 1,5% ao mês [22]. Selo obrigatório: **"Illustrative projection, not an actual bone density measurement."** Não gera alerta.
3. **Bone Protection Tracker:** acompanha o exercício resistido feito vs. o planejado na escala. Na ISS as tripulações fazem cerca de 1,5 h de exercício por dia, 6 a 7 dias por semana, com carga de 2 a 3 vezes o peso corporal para o osso [22]. É prevenção, não diagnóstico.

O 5% de massa não é limite oficial: é o marco do Food Risk Record (25% dos tripulantes perderam mais de 5%) [23].

**Mensagens [21] [22]:**
| Parâmetro | Advisory | Caution | Warning |
|---|---|---|---|
| Aeróbico ou força | "Your fitness is getting close to the minimum level (80% of pre-flight). Keep your full exercise schedule this week." | "Your fitness is below 80% of your pre-flight level, the NASA minimum. Review your exercise plan with the Crew Medical Officer." | não existe |
| VO2max antes de EVA | não existe | não existe | "Your aerobic capacity is below the minimum for this EVA. Follow the EVA readiness procedure and talk to your Crew Medical Officer before the EVA." |
| Massa corporal | "You have lost some body mass since launch. Try to eat your full planned meals and log your food." | "You have lost more than 5% of your pre-flight body mass. Talk to your Crew Medical Officer about your nutrition plan." | não existe |
| Exercício / força | "You exercised less than planned this week. Exercise protects bone and muscle in microgravity." | não existe | não existe |
| Osso medido | não existe | "Your measured bone density is below the NASA target. Your Crew Medical Officer will review your countermeasures." | não existe |

---

### 3.4 Balance & Vision (equilíbrio, enjoo, visão e SANS)
| Parâmetro | Entrada | Normal | Advisory | Caution | Warning | Fonte |
|---|---|---|---|---|---|---|
| Enjoo de movimento | Escala da NASA de 0 (feeling fine) a 20 (vomiting) | 0 a 4 **[time]** | 5 a 19 **[time]** | 20 (vômito) **[time]** | não existe | [24] |
| Tontura | Sim ou não | Não | Sim | não existe | Sim + quase desmaio | **[time]** |
| Visão (questionário diário) | "Have you noticed any change in your near or far vision since yesterday?" | Não | não existe | Sim | não existe | [20] |
| Grade de Amsler | Tela com grade e ponto central | Nada diferente | não existe | Qualquer alteração nova | não existe | [20] |
| Dor de cabeça | 0 a 10, prototype scale | 0 a 3 **[time]** | 4 a 10 **[time]** | não existe | não existe | [4] (cruzamento com CO2) |

Na ISS, os testes de visão em voo são acuidade visual, grade de Amsler e um questionário [20]. O app imita só o questionário e a Amsler. Dor de cabeça aparece ao lado do CO2 da cabine (3.6), sem afirmar causa: pode vir do CO2 [4] ou do SANS [22].

**Mensagens:**
| Parâmetro | Advisory | Caution | Warning |
|---|---|---|---|
| Enjoo | "You reported motion sickness. Limit fast head movements and log whether any medication helped." | "You reported vomiting. Drink small amounts of water often and talk to your Crew Medical Officer." | não existe |
| Tontura | "You reported dizziness. Move slowly and hold on to handrails." | não existe | "Dizziness with near-fainting. Lie down or stay secured and contact your Crew Medical Officer now." |
| Visão ou Amsler | não existe | "You noticed a change in your vision. This is common in long missions. Your Crew Medical Officer may schedule an eye exam." | não existe |
| Dor de cabeça | "You reported a headache. Check the cabin CO2 reading and your hydration." | não existe | não existe |

#### Post-landing check (fase POST_LANDING, com gravidade MOON, MARS ou EARTH) · MUDOU na v2
**Por quê mudou:** o teste mede a pressão ao ficar em pé, o que não existe em microgravidade. A NASA faz esse teste depois do pouso: deitar 2 min, levantar e ficar 3,5 min parado, medindo pressão e FC [24]. No app, ele só aparece quando `phase = POST_LANDING`.
| Resultado | Normal | Advisory | Caution | Warning | Fonte |
|---|---|---|---|---|---|
| Queda da PA sistólica em pé (até 3 min) | < 20 mmHg | não existe | ≥ 20 mmHg | ≥ 20 mmHg + tontura ou quase desmaio | [19] |
| Queda da PA diastólica (até 3 min) | < 10 mmHg | não existe | ≥ 10 mmHg | idem acima | [19] |
| Aumento da FC ao ficar em pé | < 30 bpm | ≥ 30 bpm | não existe | não existe | [19] |

O critério de 20/10 mmHg é a definição clínica da Terra [19], não um corte da NASA. Mais de 80% dos astronautas de missões de 4 a 6 meses têm intolerância ortostática no dia do pouso [21], então Caution aqui é esperado.

**Fluid loading (fase PRE_LANDING) · MUDOU na v2:** a NASA usa sal e água antes do pouso, mais roupa de compressão [21], mas **o app não calcula volume nem horário**. Ele mostra o plano que o médico já cadastrou em `Mission` e lembra cada dose.
- Lembrete: "Fluid loading: dose [n] of [N] from your medical plan is due now."
- Sem plano cadastrado: "No fluid loading plan found. Ask your flight surgeon before landing."

**Mensagens do post-landing check:**
- Advisory: "Your heart rate rose when you stood up. Move slowly."
- Caution: "Your blood pressure dropped when you stood up. This is common after spaceflight. Stand up slowly and follow your post-landing plan."
- Warning: "Your blood pressure dropped and you felt faint. Sit or lie down now and inform your Crew Medical Officer."

---

### 3.5 Radiation (radiação espacial)
**Limites [1]:** dose efetiva de carreira < 600 mSv [V1 4030]; evento de partícula solar < 250 mSv [V1 4031]; taxa de referência (missões > 60 dias) 1,3 mSv/dia no espaço livre e 0,9 mSv/dia na superfície [V1 4033].

Limites por órgão (mGy-Eq), Tabela 4.8-1 [1] (só referência na tela; o app não calcula dose por órgão):
| Órgão | 30 dias | 1 ano | Carreira |
|---|---|---|---|
| Cristalino | 1.000 | 2.000 | 4.000 |
| Pele | 1.500 | 3.000 | 6.000 |
| Órgãos formadores de sangue | 250 | 500 | não existe |
| Sistema circulatório | 250 | 500 | 1.000 |
| SNC, hipocampo (mGy) | 500 | 1.000 | 1.500 |

| Parâmetro | Cálculo | Normal | Advisory | Caution | Warning | Fonte |
|---|---|---|---|---|---|---|
| Dose de carreira (% do limite) | dose somada ÷ 600 mSv × 100 | < 75% | 75% a 89% **[time]** | 90% a 99% **[time]** | ≥ 100% | [1] |
| Taxa diária | mSv/dia | ≤ referência | > referência por 3 dias **[time]** | não existe | não existe | [1] |
| Evento solar, dentro da nave | Fluxo de prótons simulado (tipo GOES) | Sem evento | SPE: > 10 MeV acima de 10 pfu | não existe | ESPE: > 100 MeV acima de 1 pfu | [12] |
| Evento solar, durante EVA | idem, com `phase = EVA` | Sem evento | não existe | não existe | SPE ou ESPE | [12] |

Um SPE comum tem impacto mínimo, exceto para quem está em EVA [12]. Num ESPE, o grupo de radiação da NASA recomenda à tripulação ficar em áreas mais blindadas [12]. Eventos duram horas [13]. O NASA-STD-3001 exige alerta quando a taxa passar de limiares predefinidos, mesmo sem comunicação com o solo [3] [V2 6164].

**Glossário para a tela:** Gy (energia absorvida por kg de tecido) · mGy-Eq (dose absorvida ajustada pelo tipo de radiação, usada nos limites por órgão) · Sv e mSv (dose efetiva, estima o risco para o corpo inteiro) · taxa de dose (mSv por dia).

**Mensagens [12] [1]:**
| Situação | Nível | Mensagem |
|---|---|---|
| Dose 75% a 89% | Advisory | "Your accumulated radiation dose is above 75% of your career limit." |
| Dose 90% a 99% | Caution | "Your accumulated dose is close to your career limit. Your Crew Medical Officer and the ground team will review your schedule." |
| Dose ≥ 100% | Warning | "Your accumulated dose reached your career limit. Follow your mission's radiation procedure and talk to your Crew Medical Officer." |
| SPE dentro da nave | Advisory | "Solar particle event detected. Inside the vehicle the impact is minimal. EVAs may be postponed by the flight team." |
| SPE ou ESPE em EVA | Warning | "Solar particle event during EVA. Follow your EVA radiation procedure now." |
| ESPE dentro da nave | Warning | "Energetic solar particle event. Follow your mission's shelter procedure and move to the shielded area." |
| Fim do evento | Normal | "Radiation levels are back to normal." |

O risco da radiação é principalmente de longo prazo: a tela mostra "exposição", não "saúde", e nenhum sintoma é atribuído à radiação automaticamente.

---

### 3.6 Cabin Environment (ambiente fechado e hostil)
**Decisão pendente (Augusto e Bernardo):** escolher UMA revisão do NASA-STD-3001 Vol. 2 e citar só ela. Os valores abaixo vêm da Rev. D (CO2, pressão, temperatura, ruído) e de uma tabela da Rev. B (PIO2). **A Rev. E já está ativa [36] e o time não conferiu se os números mudaram.** A NASA também lembra que o limite de O2 depende da composição da atmosfera e do tempo de exposição [3]. Na tela, marque cada limite como "NASA" ou "prototype simplification".

O NASA-STD-3001 exige alerta local e remoto quando pressão, umidade, temperatura, ppO2 e ppCO2 saem dos limites seguros [3] [V2 6022].

| Parâmetro | Unidade | Normal | Advisory | Caution | Warning | Emergency | Fonte |
|---|---|---|---|---|---|---|---|
| ppCO2, média de 1 h | mmHg | ≤ 3,0 | não existe | 3,1 a 4,5 | > 4,5 **[time]** | não existe | [3] [V2 6004] [4] |
| ppCO2, média de 7 dias | mmHg | < 2,5 | ≥ 2,5 | não existe | não existe | não existe | [4] |
| Oxigênio inspirado (PIO2) | mmHg | 145 a 155 | não existe | 127 a 144, ou 156 a 356 | não existe | < 127 ou > 356 **[time]** | [7] |
| Pressão total da cabine | psia | 5,0 a 15,0 (ISS: 14,7) | não existe | não existe | não existe | < 5,0 ou > 15,0 | [3] [V2 6006] [5] |
| Temperatura e umidade | °C e % UR | 20 a 25 °C e 30 a 60% | Fora do Normal, mas entre 18 e 27 °C | Fora de 18 a 27 °C, ou umidade média < 25% | não existe | não existe | [3] [V2 6012] [V2 6013] |
| Ruído contínuo, trabalho | dBA (simplificação) | ≤ 58 | 59 a 84 | ≥ 85 | não existe | não existe | [8] [9] |
| Ruído contínuo, dormir (missão > 30 dias) | dBA (simplificação) | ≤ 49 | 50 a 84 | ≥ 85 | não existe | não existe | [8] [9] |

**Detalhes de cálculo:**
- **CO2 sempre em mmHg**, como a NASA [4]. Se vier em %: `ppCO2 = fração × pressão total`. Exemplo da NASA: 0,5% = 3,8 mmHg [4]. A faixa > 4,5 mmHg como Warning vem dos sintomas relatados pela NASA (fadiga, náusea) [4], não de um limite oficial.
- **PIO2 = (PB − 47) × FIO2** [7] (PB em mmHg; 47 = vapor d'água a 37 °C; FIO2 = fração de O2). ISS: 14,7 psia = 760 mmHg [5], 21% O2 [5] → cerca de 150 mmHg.
- Faixas de PIO2 da tabela Rev. B: normoxia 145 a 155, hiperoxia sem prazo até 356, hipoxia leve até 127 por 1 semana [7]. A Rev. D cita 122 mmHg como limite inferior absoluto (média de 1 h) [5] e 333 mmHg como limite prático de hiperoxia [3].
- **Temperatura e umidade:** o limite oficial é um polígono entre 18 °C/75% e 27 °C/25% [3]. O app usa uma caixa retangular (simplificação).
- **Ruído:** a NASA usa curvas NC-50 (trabalho) e NC-40 (sono) [8]. Em dBA: NC-50 ≈ 58 e NC-40 ≈ 49 [9] (simplificação). 85 dBA não pode ser ultrapassado em nenhum momento [3] [V2 6077].

**Mensagens [4] [8]:**
| Parâmetro | Advisory | Caution | Warning | Emergency |
|---|---|---|---|---|
| CO2 1 h | não existe | "Cabin CO2 is above the 1-hour limit. Headaches and poor sleep are more common at this level. Report it to the crew." | "Cabin CO2 is high. Follow your mission's CO2 procedure and alert the crew and ground team." | não existe |
| CO2 7 dias | "Average CO2 this week is above 2.5 mmHg. Log any headache so the crew can compare." | não existe | não existe | não existe |
| O2 | não existe | "Oxygen level is outside the target range. The crew should check the life support system." | não existe | "OXYGEN OUTSIDE SAFE LIMITS. Follow the cabin atmosphere emergency procedure now." |
| Pressão | não existe | não existe | não existe | "CABIN PRESSURE OUTSIDE SAFE LIMITS. Follow the depressurization emergency procedure now." |
| Temperatura e umidade | "Cabin temperature or humidity is outside the comfort zone." | "Cabin temperature or humidity is outside safe limits. Alert the crew." | não existe | não existe |
| Ruído | "Noise is above the recommended level. Consider hearing protection." | "Noise is above 85 dBA. Leave the area or use hearing protection now." | não existe | não existe |

#### Checklist de doença descompressiva (fase EVA, depois da EVA)
Aparece após cada EVA, porque a maioria dos casos surge entre 60 e 240 min depois da descompressão [10]. Qualquer item marcado = **Warning** (não Emergency: não há critério aprovado no app **[time]**).
- Itching · Musculoskeletal pain · Rash or mottled skin · Numbness or weakness · Trouble thinking · Dizziness or inner ear problems · Shortness of breath or chest pain

Lista dos tipos I e II do brief de DCS da NASA [10]. Agrupamento: **[time]**.
- Warning: "You reported a symptom that can be related to decompression after EVA. Tell your Crew Medical Officer now and follow the decompression sickness procedure. Do not wait for it to pass."
- Sem sintomas: "No symptoms reported. Check again in 1 hour."

---

### 3.7 Mission Context e comunicação com a Terra (distância da Terra)
**Campos separados (v2):** `gravity` (MICRO, MOON, MARS, EARTH), `phase` (CRUISE, SURFACE_OPS, EVA, PRE_LANDING, POST_LANDING) e `activity` (rest, exercise, sleep, eva). Eles mudam limites (VO2max), checklists (DCS, post-landing) e o que pontua (exercício no NEWS2).

| Destino | Atraso de ida (one-way) | Evacuação | Fonte |
|---|---|---|---|
| ISS | Quase instantâneo | Menos de 24 h até atendimento definitivo | [17] |
| Lua | 3 a 10 s na superfície (a luz sozinha leva 1,3 s) | Não é rápida; dias **[time]** | [14] [34] |
| Marte | 4 a 24 min | Impraticável; a tripulação resolve sozinha | [14] |

- **Conjunção solar em Marte:** cerca de 2 semanas sem comunicação a cada ~2 anos [16]. Botão "No Earth link" na demo.
- **Tempo de resposta do solo:** em Marte, ~20 min de ida, ~15 min para analisar e ~20 min de volta; a orientação chega com até 1 h de defasagem [15]. Fórmula: `resposta_estimada = 2 × atraso_ida + 15 min` [15].

**Escalonamento (não há regra pública da NASA; proposta do time) [time]:**
| Nível | O que o app faz |
|---|---|
| Normal / Advisory | Só registra; Advisory aparece no resumo |
| Caution | Orientação local + "em observação" + notificação ao astronauta |
| Warning | Procedimento local PRIMEIRO + confirmação obrigatória + aviso ao Crew Medical Officer + GroundReport |
| Emergency | Tela cheia + som em todos os aparelhos + confirmação obrigatória + GroundReport imediato |
| Sem link com a Terra | Igual, mas o GroundReport fica QUEUED e a tela diz: "No contact with Earth. Follow the onboard procedure with your Crew Medical Officer." |

**Simulação da transmissão (mostrar na demo):**
1. GroundReport criado (`QUEUED`) → enviado (`SENT`, horário real).
2. `expectedArrivalAt = sentAt + atraso_ida`. Nesse horário vira `RECEIVED`.
3. Resposta simulada: `expectedReplyAt = sentAt + 2 × atraso_ida + 15 min` → `REPLIED` com um texto padrão ("Flight surgeon reviewed your report. Continue the onboard procedure and send new vitals in 30 min.").
4. Sem link: fica `QUEUED` até o link voltar.
O relatório leva: astronauta, gravity/phase, parâmetros em Caution ou acima (valor, horário da medida, horário de recebimento, tendência de 24 h), ações tomadas e status da confirmação.

**Ground Control (tela opcional, recomendada):** no mesmo app (outra rota), mostra a fila de GroundReports com: horário da ocorrência, horário simulado de chegada, status da transmissão, atraso atual e se o alerta foi confirmado a bordo. **No pitch, digam que é simulação no mesmo navegador**: o GitHub Pages não transmite telemetria real entre aparelhos.

**Textos:**
- Seletor: "Mission: ISS · Moon · Mars". Abaixo: "Current one-way delay: [x]".
- Warning: "Follow the onboard procedure now. A report has been sent to the flight surgeon. Expected reply in about [y] minutes."

**Pitch:** a NASA diz que precisa de apoio à decisão médica que funcione sem contato com a Terra. Este módulo é um protótipo disso.

---

### 3.8 Astronaut Profile (perfil)
- Dados pré-missão: aeróbico, força, densidade óssea (DXA), massa corporal.
- Linha de base por parâmetro (média e desvio padrão dos 7 primeiros dias) **[time]**. A NASA mede o "normal" de cada astronauta antes do voo porque cada um se adapta num ritmo diferente (estudo CIPHER).
- Lista "em observação": parâmetro, desde quando, último nível.
- Histórico de alertas com data, valor, nível, mensagem, se foi confirmado e quando.
- Gráfico de tendência por parâmetro, com a faixa pessoal sombreada. O NASA-STD-3001 pede para registrar e mostrar tendência [1] [V1 3004].

---

## 4. O que não tem fonte (decisões do time para assumir no pitch)
- **Encaixe dos 5 níveis em cada parâmetro** e as definições de Advisory, Caution, Warning e Emergency (os nomes vêm da seção 10.3 do Vol. 2, mas a tabela não foi lida pelo time).
- Emergency só para pressão da cabine e O2; nunca para escore de saúde.
- Tempos de confirmação (10 min Warning, 2 min Emergency) e regras de Unavailable (10 min, 5 min, 36 h).
- NEWS2 ajustado (exercício não pontua, pressão vs. linha de base): escala experimental, não validada.
- Linha de base = 7 dias, média ± 2 DP, piso de DP 5 pontos; PVT-B = 3 primeiros testes. Saída de "em observação" após 3 avaliações Normal.
- Faixas de Advisory em aeróbico, força, massa, radiação (75% e 90%).
- Sono ≤ 4 h como Warning; KSS 7 como Advisory; "3 dias seguidos" nas escalas pessoais.
- Escala de enjoo: cortes 5 e 20. Tontura e dor de cabeça são escalas próprias ("prototype scale").
- CO2 acima de 4,5 mmHg como Warning (faixa de sintomas relatados, não limite).
- Ruído em dBA e temperatura em retângulo são simplificações das curvas oficiais.
- Regra de escalonamento, resposta simulada do solo e tempo de evacuação da Lua.
- Projeção óssea: só ilustrativa, sem alerta.

---

## 5. Fontes
**NASA**
[1] NASA-STD-3001 Vol. 1 Rev. C: https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
[2] NASA-STD-3001 Vol. 1, seção 6, [V1 6001] (sono de 8,5 h; evitar tarefas críticas no período de sono e no nadir circadiano): https://www.nasa.gov/reference/6-0-medical-operations/
[3] NASA-STD-3001 Vol. 2, seção 6 (atmosfera, temperatura, ruído, radiação) e [V2 9052] (falha de equipamento crítico): https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2 ; Rev. D completa: https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-2-rev-d-with-signature.pdf
[4] OCHMO-TB-004 Carbon Dioxide: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
[5] OCHMO-TB-003 Habitable Atmosphere: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-003-habitable-atmosphere.pdf
[7] Tabela de PIO2 do NASA-STD-3001 Vol. 2 Rev. B, em apresentação da NASA (2022): https://ntrs.nasa.gov/api/citations/20220019130/downloads/SKC%20EVA%20Gas%20Related%20Problems%20related%20to%20Spacesuits%20Dec%202022_Final.pdf
[8] OCHMO-TB-035 Acoustics: https://www.nasa.gov/sites/default/files/atoms/files/acoustics_technical_brief_ochmo_0.pdf
[9] Goodman, acústica em naves (NC-50 = 58,1 dBA; NC-40 = 49,0 dBA): https://ntrs.nasa.gov/api/citations/20090043801/downloads/20090043801.pdf
[10] OCHMO-TB-037 Decompression Sickness: https://www.nasa.gov/sites/default/files/atoms/files/dcs_technical_brief_ochmo.pdf
[11] NASA OSDR Environmental Data App: https://visualization.osdr.nasa.gov/eda
[12] NASA SRAG, operação de radiação na ISS (SPE e ESPE): https://www.nationalacademies.org/cdn/materials/9fba0b8d-da37-49fe-9fc5-45b736630da3
[13] NASA RadWorks, abrigo contra evento solar: https://ntrs.nasa.gov/api/citations/20150001237/downloads/20150001237.pdf ; https://ntrs.nasa.gov/api/citations/20160006051/downloads/20160006051.pdf
[14] NASA Ames, atraso de comunicação Lua e Marte (Parisi et al. 2024): https://ntrs.nasa.gov/api/citations/20240006867/downloads/Proof_Slides_Parisi_Megan_969.pdf
[15] NASA Ames, efeitos do atraso (Parisi et al. 2023): https://ntrs.nasa.gov/api/citations/20230010972/downloads/Proof_Slides_Parisi_Megan_797.pdf
[16] NASA, conjunção solar em Marte: https://mars.nasa.gov/mars2020/mission/status/337/hunkering-down-for-solar-conjunction
[17] NASA, risco médico em missão lunar longa (evacuação da ISS < 24 h): https://ntrs.nasa.gov/api/citations/20240011063/downloads/Quantifying%20Risk%20on%20a%20Long%20Duration%20Lunar%20Mission.pdf
[20] NASA, vigilância ocular na ISS (acuidade, Amsler): https://ntrs.nasa.gov/api/citations/20170009173/downloads/20170009173.pdf
[21] NASA HRP, Evidence Report "Risk of Cardiovascular Adaptations" (2022), PDF enviado pela equipe; https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/
[22] OCHMO Bone Loss brief (OCHMO-MTB-013), PDF enviado pela equipe; https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/ ; SANS: https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/
[23] NASA Food and Nutrition Risk Record Rev. D (2025), PDF enviado pela equipe
[24] NASA Standard Measures (escala de enjoo 0 a 20, stand test pós-pouso): https://www.nasa.gov/reference/standard-measures/
[26] Reaction Self Test na ISS: https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197
[27] NASA Ames, Arsintescu et al. 2019 (KSS, Samn-Perelli): https://hsi.arc.nasa.gov/publications/Arsintescu_etal_2019_JoVE.pdf
[30] NASA BHP Standard Measures: https://ntrs.nasa.gov/api/citations/20170005421/downloads/20170005421.pdf
[32] NASA Spinoff 2013 (RST): https://spinoff.nasa.gov/Spinoff2013/hm_1.html
[33] NASA, isolamento e o framework C-O-N-N-E-C-T: https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/
[35] NASA-STD-3001 Vol. 2 Rev. D, seção 10.3 "Alerts" e Tabela 10.3-1 "Alert Type and Annunciation Table" (p. 204-207; tabela não lida pelo time): https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-2-rev-d-with-signature.pdf
[36] NASA-STD-3001 Vol. 2 Rev. E (ativa): https://standards.nasa.gov/node/237 ; https://ntrs.nasa.gov/citations/20250004555

**Referências externas (usadas quando a NASA não publica número)**
[18] Norsk et al. 2015, J Physiol (PA cai 8 a 10 mmHg e FC não muda na ISS): https://doi.org/10.1113/jphysiol.2014.284869
[19] Freeman et al. 2011, consenso de hipotensão ortostática (via MSD Manual): https://www.msdmanuals.com/professional/cardiovascular-disorders/symptoms-of-cardiovascular-disorders/orthostatic-hypotension
[25] NEWS2, Royal College of Physicians: https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/
[28] Karolinska Sleepiness Scale (Åkerstedt & Gillberg, 1990)
[29] Samn-Perelli, USAF SAM-TR-82-21 (1982): https://apps.dtic.mil/sti/pdfs/ADA125319.pdf
[31] PVT-B, Basner, Mollicone & Dinges 2011: https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf
[34] ESA, estudo sobre latência de comunicação: https://nebula.esa.int/sites/default/files/neb_study/3142/C4000136202FR.pdf
