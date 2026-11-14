# Mind & Sleep: especificação para desenvolvimento

Tema: isolamento e confinamento (Matheus). Números entre colchetes = fontes no final.
Formato dos dados: o que o Bernardo definir. Este arquivo diz O QUE medir, QUANDO alertar e O QUE MOSTRAR.

## Como passar isto para uma IA
Cole este arquivo inteiro junto com o formato de dados do Bernardo e use um pedido assim:
```
Implemente o módulo Mind & Sleep de um web app em HTML/CSS/JS puro (sem framework), seguindo EXATAMENTE a especificação anexada.
Regras: use os limites e textos da especificação sem inventar valores; textos da tela em inglês; nunca mostre diagnóstico;
use o formato de dados anexado (do Bernardo); meça o tempo do teste de reação com performance.now().
Entregue: tela de check-in da manhã, teste de reação de 3 min, cálculo da linha de base, cálculo do nível
(Normal/Attention/Risk) por parâmetro e a mensagem correspondente para o astronauta.
```

## Regras gerais
- 3 níveis por parâmetro: **Normal** (verde), **Attention** (amarelo), **Risk** (vermelho).
- Attention ou Risk: mostrar a mensagem do parâmetro e marcar o parâmetro como "em observação" no perfil do astronauta.
- Nunca dizer que o astronauta tem uma doença. Nunca usar tom alarmista.
- **Linha de base (baseline):** os 7 primeiros dias só coletam dados. "Faixa pessoal" = média ± 2 desvios padrão desses dias. *(decisão do time, sem fonte: a NASA não publica corte para esses itens [1] [7])*
- Humor e estresse só podem ser vistos pelo astronauta e pelo Crew Medical Officer.
- Rodapé fixo da tela: "This tool supports self-monitoring. It does not diagnose any condition."

## Quando coletar
- **Check-in da manhã, todo dia (~1 min):** sono, KSS, Samn-Perelli, estresse, humor [1].
- **Teste de reação (PVT-B):** a cada 4 dias [1] e antes de tarefa crítica como EVA ou pouso *(decisão do time)*.

## Parâmetros e limites

| Parâmetro | Entrada na tela | Normal | Attention | Risk | Fonte |
|---|---|---|---|---|---|
| Duração do sono | 4 campos: hora que deitou, hora que levantou, minutos para dormir, minutos acordado à noite. Sono = levantou − deitou − min para dormir − min acordado | > 6 h | ≤ 6 h, ou ≤ 6 h em 3 noites seguidas *(as "3 noites" são decisão do time)* | ≤ 4 h *(efeito maior nessa faixa, segundo [1]; corte é decisão do time)* | [1] [2] |
| Qualidade do sono | Slider 0 (Very poor) a 100 (Excellent) | dentro da faixa pessoal | fora da faixa por 3 dias seguidos | não existe | [1] |
| Sonolência (KSS) | 1 opção de 9 | 1 a 6 | 7 *(decisão do time)* | 8 ou 9 | [3] [4] |
| Fadiga (Samn-Perelli) | 1 opção de 7 | 1 a 3 | 4 | 5 a 7 | [5] [3] |
| Estresse | Slider 0 (Not stressed) a 100 (Very stressed) | dentro da faixa pessoal | acima da faixa por 3 dias seguidos | não existe | [1] [6] |
| Humor | Slider 0 (Very bad) a 100 (Very good) | dentro da faixa pessoal | abaixo da faixa por 3 dias seguidos | não existe | [6] |
| Velocidade de reação (PVT-B) | Teste de 3 min | dentro da faixa pessoal | abaixo da faixa em 1 teste | não existe | [7] [1] |
| Lapsos (PVT-B) | Teste de 3 min | dentro da faixa pessoal | acima da faixa em 1 teste | não existe | [7] |

Sono ideal de referência: 8,5 h, com 2 h livres antes e 1,5 h depois [2]. É meta de planejamento, não corte.

## Opções das escalas (texto da tela)
**KSS** [4]: "How sleepy have you felt in the last 10 minutes?"
1 Extremely alert · 2 Very alert · 3 Alert · 4 Rather alert · 5 Neither alert nor sleepy · 6 Some signs of sleepiness · 7 Sleepy, no effort to stay awake · 8 Sleepy, some effort to stay awake · 9 Very sleepy, great effort to keep awake, fighting sleep

**Samn-Perelli** [5]: "Which statement best describes how you feel right now?"
1 Unusually wide awake · 2 Very alert, wide awake · 3 Normal alertness, well rested · 4 Mild fatigue · 5 Moderate fatigue · 6 Severe fatigue · 7 Severe fatigue, performance definitely impaired

## Teste de reação PVT-B [7]
- Duração: 3 min. Espera aleatória entre estímulos: 1 a 4 s (contando 1 s mostrando o resultado anterior).
- Estímulo: um contador em ms começa a rodar. O astronauta toca o mais rápido possível e o app mostra o tempo por 1 s.
- Resposta ≥ 355 ms = **lapso**. Sem resposta em 30 s = lapso de 30 s.
- Resposta < 100 ms ou toque sem estímulo = **falso início** (conta, mas não entra na média).
- Resultado: média de 1/RT (RT em segundos), nº de lapsos, nº de falsos inícios.
- Tempo medido com `performance.now()`, nunca `Date.now()`.
- Tela de início: "Reaction check, 3 minutes. Tap as soon as the counter starts. Don't tap before it appears."

## Mensagens para o astronauta (o que fazer em cada caso)
Normal em tudo: "All set. Your check-in is within your usual range."
Em Risk, toda mensagem termina com: "If you can, avoid critical tasks for now and have a private talk with your Crew Medical Officer." [8] [2]

| Parâmetro | Attention | Risk |
|---|---|---|
| Sono | "You slept 6 hours or less. Short sleep is linked to slower reactions in space. Protect your next sleep period and dim the lights about an hour before bed." [1] [9] | "You slept 4 hours or less. Plan a recovery sleep period as soon as the schedule allows and keep the cabin dark and quiet." [1] [2] [9] |
| Qualidade do sono | "Your sleep quality has been lower than usual for a few days. Check light, noise and temperature in your sleep station, and keep a regular bedtime." [9] | não existe |
| Sonolência (KSS) | "You are feeling sleepy. Take a short break, get some light and movement, and double-check your next task." [3] [9] | "You are very sleepy. Sleepiness at this level is linked to impaired performance. Postpone tasks that need full attention if possible." [3] |
| Fadiga (Samn-Perelli) | "You reported mild fatigue. Pace your workload and take short breaks." [5] | "You reported moderate to severe fatigue. Performance impairment is likely at this level. Rest before demanding tasks if possible." [5] |
| Estresse | "Your stress has been higher than usual for a few days. Exercise, journaling, a call with loved ones or a private talk with the flight surgeon can help." [9] | não existe |
| Humor | "Your mood has been lower than usual for a few days. Free time, contact with family and friends, and time with the crew can help. A private talk with the flight surgeon is always available." [9] | não existe |
| Reação e lapsos (PVT-B) | "Your reaction speed today is below your usual range. Check how you slept, take a break, and consider a recheck before critical tasks. You can talk to your Crew Medical Officer about fatigue countermeasures." [1] [8] | não existe |

"não existe" = sem nível Risk, porque não há corte com fonte.

## Não usar no app
POMS (pago, copyright da MHS), BDI-II e CES-D (triagem de depressão = diagnóstico), bateria Cognition completa (software fechado) [6].

## Limitações (para a apresentação)
- Os cortes de KSS e Samn-Perelli vêm de aviação e direção, não de astronautas em microgravidade.
- Estresse, humor e PVT-B não têm corte validado: o app só compara com o normal do próprio astronauta.
- Para produto real, pedir permissão de uso da KSS aos autores.

## Fontes
[1] Reaction Self Test na ISS, 24 astronautas: https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197
[2] NASA-STD-3001 Vol 1 Rev C, justificativa do [V1 6001] (sono de 8,5 h; evitar tarefas críticas no período de sono e no nadir circadiano): https://www.nasa.gov/reference/6-0-medical-operations/
[3] NASA Ames, Arsintescu et al. 2019 (KSS acima de 7 = sonolência fisiológica e pior desempenho): https://hsi.arc.nasa.gov/publications/Arsintescu_etal_2019_JoVE.pdf
[4] Karolinska Sleepiness Scale (Åkerstedt & Gillberg, 1990)
[5] Samn-Perelli, USAF SAM-TR-82-21, 1982 (4 = leve; 5 e 6 = prejuízo provável; 7 = prejuízo certo): https://apps.dtic.mil/sti/pdfs/ADA125319.pdf
[6] NASA Behavioral Health & Performance Standard Measures: https://ntrs.nasa.gov/api/citations/20170005421/downloads/20170005421.pdf
[7] PVT-B, Basner, Mollicone & Dinges 2011: https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf
[8] NASA Spinoff 2013 (o RST avisa quando o desempenho cai e o astronauta pode consultar o flight surgeon): https://spinoff.nasa.gov/Spinoff2013/hm_1.html
[9] NASA, isolamento e o framework C-O-N-N-E-C-T (luz baixa 1 h antes de dormir, exercício, contato com quem ama, conversa privada com médico, diário): https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/
