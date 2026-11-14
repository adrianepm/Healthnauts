# Matriz de implementação (v2)

Fonte da verdade dos números: `shared/config/research.js`, `shared/config/isolation.js` e `shared/config/levels.js`. Cada regra guarda duas origens separadas: `source` (de onde vem o limite) e `levelSource` (de onde vem o nível atribuído à faixa). **O encaixe dos níveis é sempre proposta do time** (`team_proposal`), como diz a seção 2.1 da especificação v2: os nomes Advisory, Caution, Warning e Emergency seguem a seção 10.3 do NASA-STD-3001 Vol. 2 Rev. D, mas a tabela de tipos de alerta não foi lida pelo time.

## Revisão da norma usada

- **NASA-STD-3001 Vol. 1 Rev. C**: condicionamento (V1 4001, 4002, 4003, 4024) e dose de carreira (V1 4030).
- **NASA-STD-3001 Vol. 2 Rev. D**: CO₂ (V2 6004), pressão total (V2 6006), temperatura e umidade (V2 6012, 6013), ruído (V2 6077).
- **PIO₂: tabela da Rev. B**, citada numa apresentação da NASA de 2022. A Rev. D usa outros valores (122 mmHg como limite inferior absoluto e 333 mmHg como limite prático de hiperoxia).
- **A Rev. E do Vol. 2 já está ativa e não foi conferida.** Nenhum número aqui representa conformidade com a revisão atual nem com os requisitos de uma missão.

## Níveis e regras gerais

| Tema | Como ficou | Origem |
| --- | --- | --- |
| Níveis | `level` é `null`, `advisory`, `caution`, `warning` ou `emergency`. `displayLevel` acrescenta `normal` e `unavailable` para a tela. `insufficient_data`, `stale` e `not_applicable` continuam como `status` e aparecem como Unavailable | Especificação 2.1, proposta do time |
| Emergency | Só `cabin_pressure_total` e `cabin_inspired_oxygen`. Qualquer outra regra que chegue a Emergency é rebaixada para Warning. NEWS2 alto é Warning | Especificação 2.1, proposta do time |
| Prioridade na tela | Emergency > Warning > Caution > Unavailable de sensor crítico (sinais vitais, pressão, O₂) > Advisory > Normal | Especificação 2.1 |
| Validade | Sinais vitais 10 min, cabine 5 min, check-in diário 36 h. PVT-B mantém 7 dias, porque é feito a cada 4 dias. FC 0 ou > 250, SpO₂ > 100 e temperatura < 30 °C não são pontuadas | Especificação 2.4, proposta do time |
| Texto | Caution ou acima termina com "Talk to your Crew Medical Officer." quando a frase ainda não cita o CMO. Ação operacional sem a palavra "procedure" recebe "Follow your mission's approved procedure." | Especificação 2.2 |
| Confirmação | Warning e Emergency exigem `POST /alerts/:id/acknowledge`. Sem confirmação em 10 min (Warning) ou 2 min (Emergency): `escalatedTo: crew_medical_officer`. O prazo recomeça se o alerta sobe de nível | Especificação 2.3, proposta do time |
| Relatório para a Terra | `QUEUED → SENT → RECEIVED → REPLIED`, calculado pelo relógio. Chegada = envio + atraso de ida. Resposta = envio + 2 × atraso + 15 min. Sem link fica `QUEUED` até o link voltar | Especificação 3.7, proposta do time; fórmula de [Parisi et al. 2023][delay] |

## Regras por indicador

| Área / indicador | Normal | Advisory | Caution | Warning | Emergency | Fonte do limite | Observação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Isolamento / sono (h) | > 6 | ≤ 6 em 1 ou 2 noites | ≤ 6 em 3 noites seguidas | ≤ 4 | | [Jones et al. 2022][rst]; [V1 6001][planning] | Cortes e níveis são do time |
| Isolamento / qualidade, estresse, humor (0–100) | Faixa pessoal | Fora 1 ou 2 dias | Fora 3 dias seguidos | | | Faixa pessoal do time | 7 primeiros dias UTC, média ± 2 DP amostrais, **piso de DP de 5 pontos**. Qualidade compara nos dois sentidos, estresse só acima, humor só abaixo |
| Isolamento / KSS (1–9) | 1 a 6 | 7 | 8 ou 9 | | | [Arsintescu et al. 2019][aviation] | Aviação, não validado em voo. Rótulos próprios até confirmar a licença |
| Isolamento / Samn–Perelli (1–7) | 1 a 3 | 4 | 5 ou 6 | 7 | | SAM-TR-82-21 | 7 = "performance definitely impaired" na própria escala |
| Isolamento / PVT-B velocidade | Faixa pessoal | | Abaixo em 1 teste | | | [Basner et al. 2011][pvt] | Linha de base do backend mantida: 7 dias, mínimo 2 testes, sem piso de DP |
| Isolamento / PVT-B lapsos | Faixa pessoal | Acima em 1 teste | | | | [Basner et al. 2011][pvt] | Falsos inícios só são contados |
| Gravidade / aeróbico e força (% do pré-voo) | ≥ 90% | 80% a 89% | < 80% | | | [Vol. 1 Rev. C][nasa1] V1 4003, V1 4024 | 80% é oficial; a faixa de 90% é do time |
| Gravidade / VO₂max em EVA | ≥ 32,9 (microgravidade) ou ≥ 36,5 (superfície) | | | Abaixo do mínimo | | [Vol. 1 Rev. C][nasa1] V1 4001, V1 4002 | Só com contexto de EVA explícito. O app não autoriza EVA |
| Gravidade / massa (% de perda) | < 3% | 3% a 5% | > 5% | | | Food and Nutrition Risk Record | 5% é marco do registro de risco, não limite oficial |
| Gravidade / enjoo (0–20) | 0 a 4 | 5 a 19 | 20 | | | [NASA Standard Measures][standard] | Cortes do time |
| Gravidade / tontura | Não | Sim | | Sim + quase desmaio | | Escala própria | Quase desmaio sem tontura não está na tabela 3.4: tratado como Advisory |
| Gravidade / visão e Amsler | Não | | Sim | | | [Vigilância ocular][eye] | Autorrelato; não mede acuidade nem estabelece SANS |
| Gravidade / dor de cabeça (0–10) | 0 a 3 | 4 a 10 | | | | Escala própria | Aparece ao lado do CO₂, sem afirmar causa |
| Gravidade / stand test | Queda < 20/10 mmHg | FC sobe ≥ 30 bpm | Queda ≥ 20 sistólica ou ≥ 10 diastólica em até 3 min | Queda + tontura ou quase desmaio relatados depois de levantar | | [Freeman et al. 2011][ortho], definição clínica da Terra | **Só com `activity: post_landing`**; fora disso fica `not_applicable` |
| Sinais vitais / NEWS2 | Soma 0, ou 1 a 4 sem parâmetro valendo 3 | | Um parâmetro valendo 3, ou soma 5 a 6 | Soma ≥ 7 | | [RCP 2017][rcp] | Hospitalar, não validado para astronautas. Escala 1 apenas |
| Cabine / ppCO₂ 1 h | ≤ 3,0 mmHg | | 3,0 a 4,5 | > 4,5 | | [Vol. 2 Rev. D][nasa2] V2 6004; [OCHMO-TB-004][co2brief] | 4,5 é faixa de sintomas relatados, não limite oficial |
| Cabine / ppCO₂ 7 dias | < 2,5 mmHg | ≥ 2,5 | | | | [OCHMO-TB-004][co2brief] | Exige 7 dias contínuos de leituras; sem isso fica Unavailable |
| Cabine / pressão total | 5,0 a 15,0 psia | | | | Fora da faixa | [Vol. 2 Rev. D][nasa2] V2 6006 | Não considera tempo de exposição nem composição |
| Cabine / O₂ inspirado (PIO₂) | 145 a 155 mmHg | | 127 a 144 ou 156 a 356 | | < 127 ou > 356 | Tabela da Rev. B | PIO₂ = (PB − 47) × FiO₂ |
| Cabine / temperatura e umidade | 20 a 25 °C e 30 a 60% | Fora do Normal, entre 18 e 27 °C | Fora de 18 a 27 °C, ou umidade < 25% | | | [Vol. 2 Rev. D][nasa2] V2 6012, V2 6013 | Ver simplificações |
| Cabine / ruído | ≤ 58 dBA (trabalho) ou ≤ 49 dBA (sono) | Acima da referência | ≥ 85 dBA | | | [Vol. 2 Rev. D][nasa2] V2 6077; [Goodman][acoustics] | Ver simplificações |
| Cabine / sintomas pós-EVA | Nenhum item | | | Qualquer item | | [OCHMO-TB-037][dcs] | Não há critério aprovado de Emergency |
| Radiação / carreira (% de 600 mSv) | < 75% | 75% a 89% | 90% a 99% | ≥ 100% | | [Vol. 1 Rev. C][nasa1] V1 4030 | Só avalia com histórico prévio atestado + contador contínuo desde o início da missão, em NASA_Q |
| Radiação / evento solar | Sem evento | SPE dentro da nave | | SPE com atividade `eva`, ou `eventClass: ESPE` | | [NASA SRAG][srag] | Flag simulada, sem integração com GOES |
| Distância / link com a Terra | Disponível ou com atraso | Sem link | | | | Proposta do time | Só informa. O escalonamento local não muda |

## Simplificações do protótipo

1. **Temperatura e umidade:** caixa retangular no lugar do polígono oficial entre 18 °C/75% e 27 °C/25%. Usa a última leitura, não uma média.
2. **Ruído:** dBA de banda larga no lugar das curvas NC-50 (≈ 58 dBA) e NC-40 (≈ 49 dBA), que exigem bandas de oitava.
3. **Pressão e O₂:** limites instantâneos, sem tempo de exposição nem composição da atmosfera.
4. **Cabine como um único volume:** uma leitura nova de qualquer local substitui a anterior do mesmo indicador ao resolver alertas.
5. **Relatório para a Terra:** simulação no mesmo navegador ou servidor. Nenhuma telemetria real sai do aparelho. O relatório lista os parâmetros em Caution ou acima; a tendência de 24 h não foi incluída. Humor e estresse nunca são exportados.
6. **Sensor ao vivo e cenários:** dados simulados (`source: simulated`).

## Onde o backend prevaleceu sobre a especificação v2

| Tema | Backend (mantido) | Especificação v2 |
| --- | --- | --- |
| NEWS2 em exercício | Pulso e respiração continuam pontuando, fiel ao NEWS2 original | Mandava tirar |
| NEWS2 Advisory | Não implementado: exige faixa pessoal de sinais vitais, que o backend não tem | Soma 1 a 4 com sinal fora da faixa pessoal |
| ppCO₂ 1 h | Média ponderada no tempo, cobertura integral, sem extrapolar | Média simples |
| Linha de base do PVT-B | 7 primeiros dias, mínimo 2 testes | 3 primeiros testes |
| Taxa diária de radiação | Sem nível: `dose_rate` legado não tem grandeza dosimétrica definida e V1 4033 é critério de projeto | Advisory acima da referência por 3 dias |
| Carreira de radiação | Só com histórico prévio atestado e ledger contínuo | Soma direta ÷ 600 |
| Osso | Fora do backend. No front, só curva ilustrativa com selo e Bone Protection Tracker | Igual |
| Exercício (min/dia) e força vs. plano | Só histórico | Advisory por volume |
| Saída de "em observação" | Não adotada | Após 3 avaliações Normal |

Os dados podem ser aceitos sem dar evidência suficiente para avaliação. Um teste de massa sem referência compatível, por exemplo, continua no histórico e aparece como Unavailable.

[rst]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/
[planning]: https://www.nasa.gov/reference/6-0-medical-operations/
[aviation]: https://doi.org/10.3791/59851
[pvt]: https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf
[nasa1]: https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf
[nasa2]: https://standards.nasa.gov/sites/default/files/standards/NASA/D/nasa-std-3001-vol-2-rev-d-signature.pdf
[standard]: https://www.nasa.gov/reference/standard-measures/
[eye]: https://ntrs.nasa.gov/api/citations/20170009173/downloads/20170009173.pdf
[ortho]: https://www.msdmanuals.com/professional/cardiovascular-disorders/symptoms-of-cardiovascular-disorders/orthostatic-hypotension
[co2brief]: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
[acoustics]: https://ntrs.nasa.gov/api/citations/20090043801/downloads/20090043801.pdf
[dcs]: https://www.nasa.gov/sites/default/files/atoms/files/dcs_technical_brief_ochmo.pdf
[srag]: https://www.nationalacademies.org/cdn/materials/9fba0b8d-da37-49fe-9fc5-45b736630da3
[delay]: https://ntrs.nasa.gov/api/citations/20230010972/downloads/Proof_Slides_Parisi_Megan_797.pdf
[rcp]: https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/
