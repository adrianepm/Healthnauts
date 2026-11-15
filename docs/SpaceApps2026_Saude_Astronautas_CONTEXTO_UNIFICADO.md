# CONTEXTO UNIFICADO: NASA SPACE APPS 2026
## Desafio "Create Health Monitoring Software for Astronauts on Space Missions"
Equipe de Ouro Preto (MG, Brasil). Material compilado em 14/11/2026 (atualizado com os PDFs, textos e links enviados pela equipe).

> **Instrução para a IA que receber este arquivo**
> Este é o documento-base do projeto. Ele reúne e sintetiza o material oficial do desafio (enunciado, páginas da NASA e da Agência Espacial Canadense, 5 vídeos oficiais), os padrões médicos da NASA (NASA-STD-3001 e Technical Briefs), relatórios de evidência da NASA (cardiovascular, radiação, nutrição, osso), fichas oficiais de pesquisas na ISS, o escore clínico NEWS2 e as regras de submissão e julgamento.
> 1. A IDEIA do projeto é da equipe (seção 2). Seu papel é ajudar a CONSTRUIR, não mudar a ideia.
> 2. Todo número usado no app precisa ter fonte desta lista. Não invente limites clínicos. Se algo não estiver aqui, avise e busque fonte confiável.
> 3. A equipe sabe apenas C (2º período de IA). Escreva código simples, bem comentado, sem frameworks complexos, para que eles entendam o funcionamento.
> 4. Tudo que for entregue aos jurados (textos, interface, slides) deve estar em INGLÊS.
> 5. Registre todo uso de IA e toda biblioteca, ícone ou fonte externa usada (seção 9), porque a submissão exige.

---

## 1. O DESAFIO (enunciado oficial)
Fonte: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

**Problema:** missões longas expõem astronautas a radiação, isolamento e confinamento, gravidade alterada e ambiente fechado/hostil. Isso causa mudanças imunes, perda óssea, eventos cardiovasculares e problemas de saúde comportamental. Em missões longas, o próprio astronauta tem boa parte da responsabilidade de perceber essas mudanças.

**Objetivo:** criar uma ferramenta VISUAL que reúna indicadores de saúde e permita ao astronauta AVALIAR o próprio estado e AGIR, com orientação sobre tratamentos e melhorias.
- Entrada de dados livre: teclado, cliques, câmera. Qualquer dado que represente um indicador de saúde (ex.: glicemia em mg/dL, imagem de ultrassom).
- Indicadores citados no enunciado: pressão arterial, frequência cardíaca, glicemia, temperatura corporal, horas de sono diárias, humor.
- UI é importante: animações e interatividade. Exemplo dado: figura humana com partes do corpo clicáveis mostrando função e status.

**Perguntas-guia do enunciado (o app deve responder):**
1. Que medições dá para fazer no espaço?
2. Por que cada exame é necessário?
3. Como os riscos do voo espacial afetam cada indicador?
4. Quando um resultado exige atenção da tripulação ou dos flight surgeons em solo?
5. Que ações previnem uma condição crítica?

**Opcionais valorizados:** funcionar em vários ambientes (nave, estação, rover, base na Lua/Marte); lembretes de medição na rotina; gamificação; gráficos dinâmicos de evolução; código de cores; instruções simples (não assumir que o astronauta sabe avaliar a própria saúde).

---

## 2. DECISÕES DA EQUIPE (até agora)
- **Ideia:** sistema de monitoramento contínuo que lê sensores corporais e equipamentos de monitoramento, compara com parâmetros de atenção baseados na NASA e AVISA o astronauta por um app na nave.
- **Ao disparar um alerta:** (a) instruir o astronauta com a atitude a tomar; (b) registrar o evento no PERFIL/histórico do astronauta; (c) colocar aquele indicador EM OBSERVAÇÃO por um período, com atenção redobrada.
- **Ambientes:** todos os necessários, via perfis: nave/estação (microgravidade), Lua, Marte (3/8 g), EVA e pouso/transição de gravidade.
- **Sensores:** a equipe não tem hardware. Os sensores serão SIMULADOS no próprio app (dados normais + botões para gerar anomalias na demo), com arquitetura que permitiria trocar pelo sensor real.
- **Tecnologia:** app web (HTML + CSS + JavaScript) rodando no navegador, publicado no GitHub Pages (link público exigido pela submissão). C não será usado.
- **Sensores no traje (EVA):** extra opcional; pode entrar como "visão de futuro" no pitch.
- **Divisão do time (6 pessoas):** Samuel (front-end), Bernardo (back-end), Adriane (pesquisa: radiação e distância da Terra), Matheus (pesquisa: isolamento e confinamento), Rafael (pesquisa: alterações gravitacionais), Augusto (pesquisa: ambientes fechados e hostis). Cada pesquisador entrega indicadores, limites com fonte e textos de orientação da sua área para o front e o back.
- **Temas transversais** (motor NEWS2, perfil do astronauta, nutrição e hidratação, centro médico): dono ainda a definir.
- **Guia por tema:** cada pesquisador usa o arquivo do seu tema (00_LEIA-ME.md a 06_Transversais.md, também no documento "Space Apps 2026: Guia de pesquisa por tema") junto com este contexto. Lá estão o que já foi estudado, as lacunas, onde o tema entra no app e um prompt pronto.
- **Regras de trabalho do time:**
  - O Bernardo define UM formato único de registro (astronauta, indicador, valor, unidade, data, origem) para o time todo; pesquisadores não geram JSON próprio.
  - Escalas criadas pelo time (ex.: 1 a 5) aparecem no app como "prototype scale, not a validated instrument".
  - CO2 é mostrado em mmHg (pressão parcial), como a NASA usa; não em ppm.
  - Sem diagnóstico automático e sem afirmar causalidade entre indicadores (ex.: CO2 e dor de cabeça lado a lado, sem "causou").
- **Revisão da especificação DEV (v2, 14/11 17h, após análise crítica):** 5 níveis de alerta + sem dado (Normal, Advisory, Caution, Warning, Emergency, Unavailable; nomes da seção 10.3 "Alerts" do NASA-STD-3001 Vol. 2 Rev. D, encaixe é decisão do time); confirmação de alerta em Warning e Emergency (falta de confirmação não indica perda de consciência); Emergency só para pressão da cabine e O2, nunca para escore de saúde; NEWS2 vira "referência experimental"; osso sem alerta por projeção (projeção ilustrativa + avaliação medida + acompanhamento do exercício de força); teste em pé só depois do pouso; fluid loading só lembra o plano médico, sem calcular volume; mensagens de ação dizem "siga o procedimento aprovado"; dados ganham atividade, qualidade do sinal, horário de recebimento e fase separada da gravidade; comunicação com a Terra simulada (enviado, recebido, resposta) com tela opcional de Ground Control. Pendente: escolher UMA revisão do Vol. 2 (a Rev. E está ativa e não foi conferida).
- **Front-end real:** React + Vite + TypeScript + Tailwind + Recharts + Framer Motion + Zustand (stack do Samuel). Protótipos da aba Isolamento (desktop) e das versões relógio, celular e tablet publicados como artefatos.
- **Construção com Fable (14/11 18h):** o app final (AstroVida) é montado pelo Fable no Claude Code, no branch `astrovida-v2` do repositório do Bernardo, sem push nem merge sem autorização. Hospedagem Opção A: regras rodam no navegador (pastas `shared/` + `server/`, Express fica como "computador de bordo"), publicado no GitHub Pages. Relógio, celular e tablet só depois da Etapa 4, se sobrar tempo. Plano aprovado com ajustes em `PLANO_APROVADO_AstroVida.md` (parar ao fim de cada etapa; relatório sem link fica QUEUED; histórico de dose na demo; sensor simulado ligado ao abrir; ordem Isolation, Overview, Environment, Ground Control, demais). Onde o backend é mais fiel que a especificação, o backend fica (NEWS2 em exercício, média ponderada de CO2, linha de base do PVT em 7 dias, taxa diária de radiação sem nível, carreira só com histórico atestado).
- **Nome e visual (14/11 23h):** o app passa a se chamar **Healthnauts** (antes AstroVida). Só tema escuro por enquanto (modo claro só se sobrar tempo depois da Etapa 4); cor da marca violeta #A78BFA, porque verde, azul (Advisory), amarelo, laranja, vermelho e cinza são dos níveis; contraste WCAG AA (4,5:1). Check-in de sono, estresse e humor continua 0 a 100 por baixo, mas o slider não mostra número (escala visual analógica com rótulos nas pontas). Etapas 1 e 2 prontas (commits b412cfc e 5c5d873, 70 testes passando).
- **Revisão da norma resolvida (15/11 6h):** a versão vigente é o NASA-STD-3001 Vol. 2 **Rev. F** (aprovada em 14/07/2026, substitui a Rev. E): https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf . Conferido no texto da Rev. F: PIO2 normoxia 145 a 155 mmHg, hiperoxia indefinida até 356, hipoxia leve até 127 (média de 1 h, mínimo absoluto 122) [V2 6003]; CO2 média de 1 h ≤ 3 mmHg [V2 6004]; pressão 5 < P ≤ 15,0 psia [V2 6006]; temperatura e umidade no polígono 18 °C/75% a 27 °C/25%, umidade média acima de 25% [V2 6012]. Pelo histórico do documento, 6003, 6004, 6006, 6012, 6013 e 6077 não mudaram materialmente na Rev. E nem na F. Etapa 4 feita (commits 29c9fe9 e 3e8ad6a): 12 cenários ok no Chrome, 48 regras OK e 5 regras ausentes (sem número errado).
- **Áreas do app (proposta, pode mudar):** Vital Signs (NEWS2); Mind & Sleep (sono, humor, estresse, fadiga, teste de reação); Body & Fitness (exercício, força, aeróbico, projeção óssea, massa corporal); Balance & Vision (enjoo 0 a 20, tontura, visão); Radiation (dose vs. limites, evento solar); Cabin Environment (CO2, O2, pressão, temperatura, umidade, ruído, luz); Medical Center (sintomas, orientação, relatório para o solo, nutrição e hidratação); Astronaut Profile (linha de base, histórico, "em observação"); Mission Context (ISS, Lua, Marte, EVA, pouso e atraso de comunicação).
- **Ainda a decidir:** lista final de indicadores do MVP (candidatos na seção 6.5 e no guia por tema), dono dos temas transversais, formato da demo (vídeo de 30 s ou 7 slides), diferencial criativo, nome do projeto.

---

## 3. OS 5 HAZARDS DO VOO ESPACIAL (NASA Human Research Program)
Os hazards não agem isolados: um agrava o outro.

1. **Radiação espacial.** Fora da magnetosfera: raios cósmicos galácticos (restos de supernovas), eventos de partículas solares e ejeções de massa coronal. Invisível, não se sente. Mesmo na ISS (dentro do campo magnético) a dose é ~10x maior que na Terra, e no espaço profundo é bem maior. Lua e Marte ficam fora da magnetosfera.
2. **Isolamento e confinamento.** Perda de sono, dessincronização circadiana e sobrecarga de trabalho levam a queda de desempenho e de saúde. Risco de queda de humor, cognição, moral e interação; possível distúrbio do sono. Fatores: ambiente pequeno e barulhento, o dia marciano ~37 a 38 min mais longo (as fontes da NASA divergem entre 37 e 38), alternância entre excesso de trabalho e tédio, falta de comida fresca. Fatores-chave segundo a NASA: ILUMINAÇÃO, MOVIMENTO e SONO.
3. **Distância da Terra.** Marte fica em média a 140 milhões de milhas (Lua: 238.855 milhas); missão de ~3 anos, sem reabastecimento. Atraso de comunicação de até 20 min (só ida). Com falhas de equipamento ou emergência médica, a tripulação precisa resolver sozinha. Comida e remédios pré-planejados; menu fatigue.
4. **Campos de gravidade.** Três campos numa missão a Marte: ~6 meses de microgravidade, 3/8 g em Marte, 1 g na volta. Cada transição afeta coordenação olho-mão, locomoção, equilíbrio, orientação espacial, coração, músculos e ossos; pode haver enjoo, tontura e desmaio.
5. **Ambiente fechado/hostil.** Temperatura, pressão, luz, ruído e ar precisam imitar a Terra. Micróbios mudam e passam mais fácil entre pessoas; hormônios de estresse sobem e a imunidade se altera. É preciso "fechar o ciclo" (reciclar CO2 e urina em ar e água).

---

## 4. EFEITOS NO CORPO POR SISTEMA (base para a figura humana clicável)
Síntese das 17 páginas de risco da NASA, do infográfico da CSA e dos vídeos. Formato: efeito / números / como se monitora / o que fazer (contramedidas citadas nas fontes).

### 4.1 Coração e vasos
- **Efeito:** gravidade baixa altera coração e vasos: coágulos, arritmias, doença cardiovascular, PRESSÃO BAIXA que aumenta chance de desmaio no pouso. Coração fica mais esférico. Vasos endurecem e envelhecem mais rápido; pode surgir resistência à insulina (risco de diabetes tipo 2). Radiação também aumenta risco cardíaco e circulatório.
- **Monitora:** pressão arterial, frequência cardíaca, ECG, ultrassom cardíaco; glicemia.
- **Intolerância ortostática (não conseguir manter a pressão ao ficar em pé → tontura, quase desmaio, desmaio):** principal risco na reentrada e no pouso. Após missões de 4 a 6 meses, mais de 80% dos astronautas americanos tiveram intolerância no dia do pouso. Mais de 80% das mulheres ficaram pré-sincopais no teste pós-voo vs. ~20% dos homens. Em Marte a incidência tende a ser MAIOR (trânsito longo), e preocupa também na descida e subida na Lua/Marte. Temperatura corporal alta piora.
- **Durante a missão:** principais preocupações são ARRITMIAS e TROMBOEMBOLISMO VENOSO (coágulo; a NASA criou vigilância por ultrassom na ISS após um achado).
- **Longo prazo:** risco vitalício maior de evento cardiovascular; acima de 0,5 Gy-Eq de radiação (ex.: missão a Marte) o risco supera o envelhecimento normal.
- **Ações:** exercício regular, dieta saudável; roupa de compressão no corpo inferior; FLUID LOADING obrigatório antes do pouso (sal + água: 18 a 20 mL/kg de solução de NaCl, ou 0,18 a 0,20 g/kg de sal com 18 a 20 mL/kg de água, 3 a 4 vezes nas últimas 12 a 20 h); pressão negativa no corpo inferior; treino para emergência cardiovascular. O experimento canadense BP Reg estudou como PREVER desmaio pela regulação da pressão.

### 4.2 Ossos
- **Efeito:** ossos de carga (coluna, quadril) perdem 1% a 1,5% de densidade POR MÊS (adultos acima de 50 anos perdem ~1% por ANO na Terra). Risco de fratura, osteoporose precoce e pedra nos rins (cálcio excretado + desidratação). Coluna alonga e a altura sobe até 3%.
- **Monitora:** scan ósseo só antes e depois do voo (por isso o app pode PROJETAR a perda pelo tempo de missão).
- **Detalhe:** osso trabecular (esponjoso, ~25%) pode NÃO se recuperar após o voo; cortical (75 a 80%) se recupera melhor. Nunca houve fratura em voo. Missões > 90 a 100 dias aumentam o risco.
- **Faixas NASA de T-score (DXA):** certificação para missão longa T ≥ -1,0; manter durante a missão T ≥ -2,0; fim da missão T ≥ -2,0; reabilitação: voltar a T ≥ -1,0. Z-score < -1,5 = investigar.
- **Vitamina D (protocolo NASA [V1 6037]):** alvo de 25-OH vitamina D 35 a 90 ng/mL; manutenção 1.000 UI/dia ou 5.000 UI/semana.
- **Ações:** primeira linha é DIETA + EXERCÍCIO; remédio (bisfosfonato, ex.: alendronato 70 mg/semana) só se não responder. Exercício com carga de 2 a 3x o peso corporal (ARED, até 600 lbf); em voo, 6 a 7 sessões/semana (na Terra, 2 a 3 mantêm e 4 a 6 constroem osso); carga dinâmica, rápida, com pausas e em várias direções. Hidratação e citrato de potássio contra pedra nos rins (urina avalia o risco). Reabilitação pós-voo: 2 h/dia, 7 dias/semana.

### 4.3 Músculos e condicionamento
- **Efeito:** perda média de 10% a 12% da força e da capacidade aeróbica pré-missão; 12% a 38% da tripulação perde mais de 20%. Força cai em mais gente que o aeróbico. Reflexos mais lentos; exercício menos eficaz no espaço. Mais quedas em transições de gravidade.
- **Monitora:** autoavaliações periódicas de condicionamento; teste de força total.
- **Ações:** na ISS, 1,5 h/dia de exercício resistido + aeróbico, 6 a 7 dias/semana. Naves para Lua/Marte terão menos espaço para equipamentos.

### 4.4 Olhos e cérebro (SANS)
- **Efeito:** sangue e líquor sobem para a cabeça: inchaço do nervo óptico, dobras na retina, achatamento do fundo do olho, inchaço cerebral. ~70% dos astronautas da ISS têm algum inchaço no fundo do olho. Dor de cabeça e alteração visual são os sintomas mais comuns no voo.
- **Monitora:** fundoscópio (imagem da retina), testes de visão.
- **Mais detalhes (infográfico NASA):** cérebro sobe e ventrículos aumentam; glândula pituitária muda de forma; VISÃO BORRADA. Há variação biológica; quanto mais tempo, maior o impacto; algumas mudanças podem ser permanentes.
- **Ações (em pesquisa):** suplemento diário de vitaminas B (genética da via do folato predispõe alguns astronautas); braçadeiras venoconstritoras na coxa (~50 mmHg, ~50 a 60 min) seguram fluido nas pernas; pressão negativa no corpo inferior.

### 4.5 Equilíbrio e sensório-motor
- **Efeito:** a maioria dos astronautas tem enjoo de movimento no voo (enjoo na Terra não prevê o do espaço). Desorientação, tontura, problemas de coordenação olho-mão e de marcha; atrapalha pilotar, tarefas e EVA.
- **Monitora:** testes de equilíbrio e ouvido interno; motricidade fina; ESCALA DE ENJOO de 0 a 20 usada pela NASA (0 = me sentindo bem, 20 = vômito) + questionário (sintomas, remédio tomado e se funcionou, impacto nas tarefas). Testes pós-pouso: levantar da cadeira e andar 4 m contornando um cone com obstáculo; levantar rápido após 2 min deitado e ficar 3,5 min parado (com pressão e FC); andar em tandem 10 passos de olhos abertos e fechados.
- **Ações:** medicação para enjoo, movimentos específicos de cabeça, treino de orientação.

### 4.6 Imunidade, sangue e microbioma
- **Efeito:** estresse, radiação, microgravidade e sono ruim alteram a imunidade: vírus latentes reativam (herpes labial, zóster), rashes, alergias atípicas, infecções. Medula produz menos células: menos hemácias (anemia), menos glóbulos brancos (infecção, mais sensibilidade à radiação). Microbioma de pele e intestino muda; alguns micróbios ficam mais virulentos.
- **Monitora:** sangue, saliva, urina (revelam também nível de ESTRESSE); amostras fecais; swabs das superfícies; temperatura corporal.
- **Ações:** quarentena de 2 semanas antes do voo; desinfetantes, anti-inflamatórios, antibióticos.

### 4.7 Radiação (efeitos diretos)
- **Efeito:** câncer; catarata; dano ao DNA; sistema nervoso central (cognição alterada, função motora reduzida, mudanças comportamentais). Sintomas agudos citados: vômito, fadiga, anorexia (perda de apetite), doença cardíaca e circulatória. Nêutrons são ~30% da radiação na ISS.
- **Números:** nêutrons dão ~150 microsieverts/dia na ISS (centenas de vezes a Terra; Radi-N2). O alojamento de dormir recebe MENOS dose que as áreas de trabalho. Estimativa por missão longa: 0,25 a 0,5 Gy de raios cósmicos; evento solar com blindagem 0,15 a 0,5 Gy nos órgãos internos (limites podem ser violados num evento solar grande).
- **Monitora:** dosímetros MOSFET (estimam dose em PELE, OLHOS e ÓRGÃOS FORMADORES DE SANGUE, os mesmos órgãos com limite na tabela da NASA; versão EVARM mede por astronauta em EVA); detectores de bolhas para nêutrons (Radi-N2: 1 vestido pelo astronauta, 1 no quarto, 6 pela estação); CANS canadense (contínuo e autônomo); biomarcadores.
- **Ações:** blindagem, ir para a área mais protegida durante evento solar (a Radi-N2 mapeou essas áreas), princípio ALARA (o mínimo possível).

### 4.8 Mente e comportamento
- **Efeito:** ansiedade, depressão, queda de humor, moral e cognição; afeta sono e decisões; conflitos na equipe e falhas de comunicação. Em Marte, sem conversa em tempo real com família e médicos.
- **Monitora:** humor, questionários comportamentais, testes cognitivos, DIÁRIO.
- **Ferramentas NASA:** autoteste de vigilância e atenção de 10 minutos (efeito da fadiga); bateria cognitiva de 10 testes curtos (Standard Measures).
- **Ações:** diário (lugar seguro para desabafar, ferramenta de saúde mental e física), cultivar vegetais, janelas (reduzem monotonia), privacidade, team building, realidade virtual com ambientes relaxantes, atividades significativas (aprender idioma ou habilidade médica).
- **Framework C-O-N-N-E-C-T da NASA para isolamento** (bom para as orientações do app): Community (saber que seu trabalho ajuda os outros), Openness (abertura = resiliência), Networking (contato com quem ama; conversa privada com médico ou psicólogo), Needs (exercício, comida, rotina de sono e trabalho, lazer; diminuir a luz 1 h antes de dormir), Expeditionary mindset (autocuidado e cuidado com a equipe, gerenciar conflitos), Countermeasures (diário, mindfulness, reinterpretar o negativo, atividade física, VR), Training (aprender coisas novas no tempo livre).

### 4.9 Sono e ritmo circadiano
- **Efeito:** sobrecarga, ciclo claro-escuro irregular (16 nasceres do sol por dia na ISS), sono interrompido. 7 dias dormindo 6 h = desempenho de quem está 24 a 36 h acordado.
- **Monitora:** actigrafia (sensor de pulso de movimento e luz), relatos de sono.
- **Ações:** LEDs que simulam o ciclo da Terra, controle de luz e cafeína, tempo reservado para relaxar (evitar burnout).

### 4.10 Nutrição
- **Efeito:** deficiência nutricional, menu fatigue. Comida precisa ser segura, nutritiva, durável, variada, sem reabastecimento em Marte.
- **Números (NASA Food Risk Record, 2025):** 25% dos tripulantes (2000 a 2024) perderam mais de 5% da massa corporal em voo; 40% das tripulações da ISS ficaram desidratadas e mais de 8% clinicamente desidratados. Comida e nutrição continuam RISCO VERMELHO para Marte. Desidratação afeta coração, pedra nos rins, cognição, desempenho e fadiga.
- **Monitora:** amostras de fluidos (dieta), aceitação da comida, MASSA CORPORAL, hidratação. A NASA usa o app "ISS FIT" (Food Intake Tracker) para os astronautas registrarem o que comem.
- **Ações:** dieta reforçada, variedade (mais de 200 itens na ISS), escolha prévia pelo astronauta.

### 4.11 Oxigenação, pressão e EVA
- **Doença descompressiva ("the bends"):** ao passar da nave para o traje de pressão menor, nitrogênio forma bolhas: dor intensa; em casos graves afeta a respiração ou bloqueia vasos (sintomas tipo AVC). Protocolo: encerrar a EVA rápido e voltar ao ambiente pressurizado. Prevenção: respirar oxigênio puro antes (prebreathe).
- **Hipóxia leve:** naves futuras terão cabine parcialmente despressurizada. Sintomas: confusão, dor de cabeça, alteração visual, dificuldade para dormir. NASA considera risco baixo (parecido com mal de altitude).
- **EVA:** mais frequente e longa em missões profundas; fadiga, lesão, O2 baixo e CO2 alto. Recorde: 8h56min.
- **Pouso:** risco de lesão por desorientação e perda óssea; na Lua/Marte não há equipe de apoio, a saída do veículo é autônoma.

---

## 5. COMO A NASA MONITORA HOJE (referências reais para o app)
- **Standard Measures** (antes, durante e depois da missão): atividade e luz (sensor de pulso), relatos de sono, fluidos (nutrição), saliva (imunidade), testes cognitivos, testes sensório-motores, teste de força, amostras fecais.
- **ARCHeR (Artemis II):** bem-estar, atividade, sono e interações via actigrafia e questionários.
- **Tempus Pro:** aparelho de telemedicina que integra ECG, pressão não invasiva, oximetria (SpO2), temperatura e imagem médica (câmera, laringoscópio, ultrassom), com suporte de procedimentos a bordo e diagnóstico quase em tempo real. Avaliado para missões com atraso de comunicação.
- **Wearables na ISS:** monitores de pressão, frequência cardíaca e respiração durante exercício; cinta cardíaca via Bluetooth.
- **Dosímetros MOSFET (CSA, Canadá):** detector de radiação de silício em miniatura. A radiação que atinge o sensor gera cargas elétricas que mudam a tensão do dispositivo; cada tipo de radiação muda a tensão de um jeito, e a calibração na Terra converte isso em dose absorvida. São leves e, com blindagens de espessuras diferentes sobre o sensor, estimam a dose separadamente na PELE, nos OLHOS e nos ÓRGÃOS FORMADORES DE SANGUE (os mesmos órgãos da tabela de limites da NASA, seção 6.2).
  - Histórico: desenvolvidos pela empresa canadense Thomson & Nielsen; CSA encomendou a versão espacial em 1991; primeiro voo em 1992 (satélite russo Bion-10); protótipo do Astronaut Radiation Monitor (ARM) em 1995, testado no Bion-11 em 1996.
  - **EVARM (ExtraVehicular Activity Radiation Monitor):** mede a exposição INDIVIDUAL de cada astronauta durante caminhadas espaciais (pele, olhos, órgãos formadores de sangue). Está na ISS desde 2001. Prova de que o "sensor no traje" da ideia da equipe já tem precedente real.
  - **Matroshka-R (2005 a 2008, segmento russo da ISS, liderado pelo IBMP russo):** sensores em fita flexível dentro de um "phantom" (esfera que imita o corpo humano) + leitor que guarda dados e baixa no computador, registrando dose em intervalos regulares. Descoberta: órgãos internos absorveram MAIS radiação de nêutrons do que o esperado (hipótese: raios cósmicos batendo no próprio corpo geram nêutrons secundários). Seguiu-se o Radi-N (2009). Hoje o CANS mede nêutrons de forma contínua e autônoma.
  - Fonte: https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp
- **Ultrassom:** astronautas fazem para acompanhar mudanças no corpo; estudos recentes buscam permitir uso sem orientação da Terra.
- **Standard Measures (detalhes da ficha oficial):** questionário PRÉ-SONO e PÓS-SONO em iPad (app EveryWear) sobre sono, humor, coesão da equipe e habitabilidade; bateria cognitiva de 10 testes; actigrafia em blocos de 2 semanas (início, ~dia 60, ~dia 120, fim); força (puxada isométrica) e cognição ~30 dias após o lançamento e ~30 dias antes da volta.
- **CIPHER:** 14 estudos em missões curtas, padrão e de 1 ano para extrapolar a Marte; mede o "normal" de CADA astronauta antes do voo porque cada um se adapta em ritmo diferente (justifica a linha de base individual no app). Em voo: ultrassom, cognição, exame vestibular, atividade física, pressão arterial, olhos, força; camisa Bio-Monitor.
- **Repouso no leito (análogo em solo):** até 70 dias com cabeça 6 graus para baixo; monitoram continuamente pressão, FC, nutrição, gasto de energia, massa óssea e HUMOR.
- **O que a NASA diz que falta (argumento central de Relevance):** a NASA está desenvolvendo uma ARQUITETURA DE DADOS MÉDICOS para naves que permita FERRAMENTAS DE APOIO À DECISÃO CLÍNICA, possivelmente com IA e machine learning, e estuda ASSISTENTES VIRTUAIS para a tripulação reagir rápido a anomalias. O projeto Advanced Medical Operations investiga um MEDICAL DECISION SUPPORT SYSTEM para emergências fora de contato com a Terra. O kit médico da ISS é básico; todos os astronautas treinam primeiros socorros, sutura, injeção e extração de dente. O app de vocês é exatamente um protótipo dessa necessidade.
- **Equipe:** pelo menos 2 Crew Medical Officers por veículo ([V1 3006]). A NASA quer sistemas fáceis de operar sem suporte em tempo real (astronautas treinam ~300 h em simulador).

---

## 6. PARÂMETROS DE ALERTA
**Regra de ouro:** o NASA-STD-3001 diz O QUE monitorar, mas não publica limites numéricos para frequência cardíaca, pressão, SpO2 e temperatura (manda manter "dentro de valores clinicamente aceitos"). Por isso: limites da NASA onde existem + NEWS2 para sinais vitais.

### 6.1 O que a NASA exige (NASA-STD-3001 Vol. 1 Rev. C, 2023)
- [V1 3003] Monitorar periodicamente: saúde geral, nutrição, aeróbico e força, escala trabalho/descanso, sono e ritmo circadiano.
- [V1 3004] Avaliar, REGISTRAR, MONITORAR e mostrar TENDÊNCIA de sinais vitais e sinais fisiológicos e comportamentais. (Justifica perfil com histórico + gráficos.)
- [V1 4011] Saúde comportamental e cognição dentro de valores clinicamente aceitos.
- [V1 4016]/[V1 4017] Parâmetros hematológicos e imunes dentro do normal.

### 6.2 Limites numéricos oficiais da NASA
**Condicionamento e osso**
- [V1 4003] Capacidade aeróbica ≥ 80% da pré-missão.
- [V1 4001] VO2max ≥ 32,9 mL/(min·kg) para EVA em microgravidade; [V1 4002] ≥ 36,5 para EVA em superfície.
- [V1 4024] Força muscular ≥ 80% da linha de base.
- [V1 4027] Densidade mineral óssea ≥ 95% da pré-missão (quadril e coluna); ≥ 90% (colo do fêmur). T-score: ≥ -1,0 normal; -1,0 a -2,5 baixa densidade; ≤ -2,5 osteoporose.
- [V1 4020] 100% das necessidades de nutrientes e energia.

**Sono**
- [V1 6001] (justificativa) Período de sono recomendado: 8,5 h, com 2 h livres antes e 1,5 h depois; evitar tarefas críticas no período de sono e no nadir circadiano (1h a 7h). É regra de planejamento da escala, não corte de alerta. Fonte: https://www.nasa.gov/reference/6-0-medical-operations/
- Adultos precisam de 7 a 9 h. Na prática, astronautas dormem 6 a 6,5 h por noite (déficit médio ~0,3 h/dia).

**Radiação (Tabela 4.8-1, mGy-Eq)**
| Órgão | 30 dias | 1 ano | Carreira |
|---|---|---|---|
| Cristalino | 1.000 | 2.000 | 4.000 |
| Pele | 1.500 | 3.000 | 6.000 |
| Órgãos formadores de sangue | 250 | 500 | n/a |
| Sistema circulatório | 250 | 500 | 1.000 |
| SNC (hipocampo) | 500 mGy | 1.000 mGy | 1.500 mGy |
- Dose efetiva de carreira < 600 mSv ([V1 4030]); evento solar < 250 mSv ([V1 4031]).
- Taxa de referência de raios cósmicos (missões > 60 dias): 1,3 mSv/dia no espaço livre; 0,9 mSv/dia em superfície ([V1 4033]).
- Vol. 2 exige alerta de taxa de exposição elevada ([V2 6164]) e monitoramento de radiação no traje ([V2 11010]).

**CO2 da cabine (Vol. 2 [V2 6004] + Technical Brief TB-004)**
- Média de 1 h de ppCO2 ≤ 3 mmHg. Para risco de dor de cabeça < 1%: média de 7 dias < 2,5 mmHg.
- Sintomas: a partir de ~2,3 mmHg já relatados; dor de cabeça entre 2,8 e 4,5; a 3,5 tosse, sono ruim, visão borrada; acima de 4,5 fadiga, mal-estar, náusea.
- Dor de cabeça e visão também vêm do SANS: o app pode cruzar sintoma relatado + CO2.

### 6.3 Sinais vitais: NEWS2 (Royal College of Physicians, 2017)
Escore clínico validado de alerta precoce, usado no sistema de saúde britânico. Usa os mesmos sinais que o Tempus Pro mede. Sem restrição de copyright (citar a fonte).

| Parâmetro | 3 | 2 | 1 | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|---|
| Freq. respiratória (irpm) | ≤8 | | 9 a 11 | 12 a 20 | | 21 a 24 | ≥25 |
| SpO2 (%) (escala 1) | ≤91 | 92 a 93 | 94 a 95 | ≥96 | | | |
| Oxigênio suplementar | | Sim | | Ar | | | |
| PA sistólica (mmHg) | ≤90 | 91 a 100 | 101 a 110 | 111 a 219 | | | ≥220 |
| Pulso (bpm) | ≤40 | | 41 a 50 | 51 a 90 | 91 a 110 | 111 a 130 | ≥131 |
| Consciência | | | | Alerta | | | Confusão nova / responde a voz / dor / não responde |
| Temperatura (°C) | ≤35,0 | | 35,1 a 36,0 | 36,1 a 38,0 | 38,1 a 39,0 | ≥39,1 | |

**Gatilhos (soma de 0 a 20):**
- 0 a 4: risco baixo → VERDE (rotina).
- Qualquer parâmetro isolado = 3: risco baixo-médio → AMARELO (avaliação urgente).
- 5 a 6: risco médio → AMARELO/LARANJA (monitorar de hora em hora, Crew Medical Officer avalia).
- 7 ou mais: risco alto → VERMELHO (emergência, monitoramento contínuo, protocolo + contato com flight surgeon considerando o atraso).
- Consciência pode ser medida no app com uma pergunta rápida de orientação ou teste cognitivo curto.

### 6.4 Limitações (explicar no projeto: conta pontos em Validity)
- O NEWS2 foi feito para pacientes em hospital, não para astronautas saudáveis em microgravidade. Adaptações justificadas pela NASA: pressão baixa é esperada no pouso e na volta a 1 g; FC alta durante exercício é normal (usar contexto "em exercício").
- Comparar com a linha de base individual pré-missão (como a NASA faz com força, aeróbico e osso) é mais forte do que só faixas fixas.
- O app é apoio à decisão, não diagnóstico (o próprio RCP diz que o NEWS2 complementa o julgamento clínico).

### 6.5 Lacunas de parâmetros (atualizado 14/11: pesquisa dos 5 temas feita, ver 6.8)
- Radiação, Distância, Isolamento, Gravidade e Ambientes: lacunas resolvidas ou marcadas como decisão do time (6.8 e SpaceApps2026_DEV_Especificacao.md, seção 4).
- Ainda sem fonte: tempo de evacuação de base lunar; regra pública de escalonamento ao solo (não existe; proposta do time); licença da KSS para produto final.
- Transversais (não pesquisados ainda): glicemia; meta diária de água; pressão diastólica; condições médicas mais prováveis em voo.

### 6.7 Mind & Sleep: instrumentos validados (pesquisa de isolamento, 14/11/2026)
**Modelo oficial a seguir:** o Reaction Self Test (RST) da NASA, software nos computadores da ISS. Sessão de manhã (após acordar) e de noite (2 h antes de dormir), a cada 4º dia em voo: registro de sono, escalas visuais (VAS) de estresse, fadiga mental, exaustão física, cansaço, sonolência, qualidade do sono e carga de trabalho, e o teste de vigilância PVT-B de 3 min. Avisa o astronauta quando o desempenho cai abaixo da faixa ótima, e ele pode consultar o flight surgeon. Resultado na ISS (24 astronautas): 6,5 ± 1,4 h de sono por noite; as 8,5 h programadas só em 5,9% das noites; com sono ≤ 6 h a velocidade no PVT-B caiu; estresse, fadiga e sonolência subiram com sono curto; estresse subiu ao longo da missão.

| Indicador | Instrumento | Escala | Licença | Corte com fonte |
|---|---|---|---|---|
| Sono | Diário de sono no modelo do RST (deitar, levantar, tempo para dormir, tempo acordado, qualidade) | Horários + VAS | Sem licença | Sono ≤ 6 h ligado a pior vigilância na ISS; período recomendado 8,5 h |
| Sonolência | Karolinska Sleepiness Scale (KSS) | 1 (extremely alert) a 9 (very sleepy, fighting sleep) | Uso amplo em pesquisa; cópia via autores; pedir permissão para produto final | KSS acima de 7: sinais fisiológicos de sonolência e pior desempenho (NASA Ames) |
| Fadiga | Samn-Perelli (USAF 1982, usada pela NASA Ames) | 1 a 7 | Relatório USAF de distribuição pública | ≥ 5 prejuízo provável; 7 prejuízo certo |
| Estresse | VAS de item único (igual ao RST) | 0 (not stressed) a 100 (very stressed) | Sem licença | Sem corte: tendência vs. linha de base |
| Humor | VAS de item único (NASA usa VAS de humor) | 0 a 100 | Sem licença | Sem corte: tendência vs. linha de base |
| Vigilância | PVT-B, implementação própria do protocolo publicado (Basner 2011) | Velocidade 1/RT, lapsos | Protocolo publicado | Sem corte validado: comparar com linha de base pessoal |

**Protocolo PVT-B:** 3 min (~60 estímulos); intervalo aleatório de 1 a 4 s (inclui 1 s de feedback); contador em ms que a pessoa para o mais rápido possível; lapso = RT ≥ 355 ms; falso início = resposta sem estímulo ou RT < 100 ms; sem resposta em 30 s = lapso. Desfecho principal: velocidade de resposta (média de 1/RT).
**Fica fora do app:** POMS (usado pela NASA, mas com copyright da MHS); BDI-II e CES-D (triagem de depressão: clínica, sensível, BDI-II comercial); bateria Cognition completa (proprietária).
**Frequência sugerida:** check-in de manhã diário (~1 min: sono, KSS, Samn-Perelli, humor, estresse); PVT-B a cada 4 dias e antes de tarefa crítica; linha de base nos primeiros 7 dias.
**Sinalização (não diagnóstica):** amarelo se KSS > 7, Samn-Perelli ≥ 5, sono ≤ 6 h por 3 noites seguidas, PVT-B abaixo da faixa pessoal, ou humor/estresse piorando vários dias vs. linha de base ("3 noites" e "vários dias" são decisão do time). Ação: contramedidas de fadiga, adiar tarefa crítica se possível, conversa privada com o Crew Medical Officer.
**Textos e detalhes completos:** arquivo 03_Isolamento.md.

### 6.8 Resultados da pesquisa de Radiação, Distância, Gravidade e Ambientes (14/11/2026)
Especificação completa para os devs, com limites, níveis e mensagens: SpaceApps2026_DEV_Especificacao.md.
**Ambientes (NASA-STD-3001 Vol. 2 e Technical Briefs)**
- O2 inspirado: PIO2 = (PB − 47) × FIO2. Normoxia 145 a 155 mmHg; hiperoxia sem prazo até 356; hipoxia leve até 127 por 1 semana (tabela Rev. B). Rev. D: 122 mmHg limite absoluto (média de 1 h), 333 mmHg limite prático de hiperoxia. ISS: 14,7 psia, 21% O2 (PIO2 ~150).
- Pressão total [V2 6006]: 5,0 a 15,0 psia (34,5 a 103 kPa). Mínimo 30% de gás diluente [V2 6002].
- Temperatura e umidade: limite de saúde [V2 6012] entre 18 °C/75% UR e 27 °C/25% UR (figura em polígono); zona de desempenho [V2 6013] 20 a 25 °C e 30 a 60% UR; umidade média acima de 25%.
- Alerta obrigatório [V2 6022]: pressão, umidade, temperatura, ppO2 e ppCO2 fora dos limites.
- Ruído: NC-50 em área de trabalho [V2 6078] (~58 dBA); NC-40 para dormir em missão > 30 dias [V2 6079] (~49 dBA); nunca acima de 85 dBA [V2 6077]; alarme < 95 dBA [V2 6081].
- CO2: 1 h ≤ 3 mmHg; 24 h ≤ 3; 7 dias < 2,5. Conversão da NASA: 0,5% = 3,8 mmHg.
- Doença descompressiva: tipo I (coceira, dor musculoesquelética, rash leve); tipo II (neurológico, dormência, fraqueza, cognição, ouvido interno, cardiopulmonar, pele marmorizada). Maioria entre 60 e 240 min após a descompressão.
- Dados reais da ISS: NASA OSDR Environmental Data App (CO2, temperatura, umidade e dose de radiação; tabelas em CSV): https://visualization.osdr.nasa.gov/eda
**Radiação**
- [V2 6164]: alertar tripulação quando a taxa de exposição passar de limiares predefinidos, mesmo sem contato com o solo; [V2 6162] monitorar a dose individual dentro e fora do veículo.
- SPE: prótons > 10 MeV acima de 10 pfu (GOES), impacto mínimo exceto em EVA. ESPE: prótons > 100 MeV acima de 1 pfu; o SRAG recomenda ficar em áreas mais blindadas. Eventos duram horas; estudo RadWorks considerou até 36 h.
**Distância**
- Atraso de ida: Lua 3 a 10 s na superfície (luz 1,3 s); Marte 4 a 24 min. Em Marte: ~20 min ida + ~15 min de análise + ~20 min volta (orientação até 1 h defasada).
- Conjunção solar em Marte: ~2 semanas sem comunicação a cada ~2 anos.
- Evacuação da ISS: menos de 24 h até atendimento definitivo. Não há regra pública de escalonamento: proposta do time na especificação.
**Gravidade**
- Microgravidade (8 astronautas, 3 a 6 meses na ISS): PA de 24 h cai 8 a 10 mmHg; FC não muda; débito cardíaco +41%.
- Hipotensão ortostática (consenso clínico, não NASA): queda ≥ 20 mmHg sistólica ou ≥ 10 diastólica em até 3 min em pé; aumento de FC ≥ 30 bpm é critério de taquicardia postural.
- Visão em voo na ISS: acuidade (laptop e cartão), grade de Amsler e questionário.
- Projeção óssea por 1 a 1,5%/mês: aceitável como estimativa, com aviso na tela.

### 6.6 Indicadores candidatos para o MVP (a equipe escolhe)
- **Contínuos (sensor simulado) → NEWS2:** FC, PA sistólica, SpO2, frequência respiratória, temperatura.
- **Check-in manual diário (inspirado no questionário pré/pós-sono da NASA):** horas e qualidade do sono (meta 8,5 h; alerta de dívida acumulada), humor/estresse, coesão da equipe, sintomas (dor de cabeça, visão borrada, enjoo na escala 0 a 20), orientação/consciência, água ingerida, diário.
- **Teste rápido de vigilância/atenção** (a NASA usa um de 10 min; no app pode ser uma versão curta, ex.: tempo de reação).
- **Massa corporal semanal:** alerta com perda > 5% (25% dos astronautas passam disso, segundo a NASA).
- **Ambiente:** ppCO2 da cabine; dose de radiação acumulada vs. limites.
- **Periódicos (semanal):** aeróbico e força (% da pré-missão, limite 80%); projeção de densidade óssea (limite 95%).
- **Perfis de ambiente:** microgravidade, Lua, Marte, EVA (ex.: VO2max mínimo diferente e risco de queda maior com gravidade).

---

## 7. REGRAS DE SUBMISSÃO E JULGAMENTO
Fontes: Project Submission Guide, Judging & Awards Guide e vídeo oficial (lidos integralmente).

**Prazo:** domingo 15/11/2026, 23h59, horário do evento local (Ouro Preto). Sem exceções. Só a última submissão vale; dá para reenviar até o prazo. Julgamento local pode ter horário próprio (confirmar com o Local Lead).

**Página do projeto:** aceita só imagens (JPG/PNG/GIF até 10 MB). Vídeos, código e documentos vão por LINK PÚBLICO (GitHub, YouTube, Drive), sem login. Testar em aba anônima. Site próprio: opcional pedir classificação FortiGuard.

**Campos (tudo em inglês):**
1. Project Name
2. High-Level Summary (50 a 200 palavras): o que fizeram, como resolve o desafio, por que importa.
3. Link da Demo (obrigatória): máx. 7 slides (contando título e intro) OU vídeo de no máx. 30 s. Passou do limite = fora do julgamento global. Vídeo pode ser falado em português com legenda em inglês; slides sempre em inglês.
4. Link do projeto final (ex.: GitHub Pages).
5. Descrição detalhada: o que faz, como funciona, benefícios, impacto, ferramentas e linguagens, por que é criativo, fatores considerados (energia, acessibilidade, custo).
6. Uso de IA ("Super Intelligence"): permitido para acelerar; a IA NÃO pode criar a ideia. Imagem/vídeo gerado: marca d'água visível. Código/dados/áudio gerados: declarar em texto e metadados (README, comentários). Proibido usar ou modificar marca da NASA (logos, bandeiras, identificadores de missão) em conteúdo gerado.
7. NASA Data: obrigatório usar pelo menos 1 recurso da NASA para prêmio global.
8. Referências: listar TODO dado, código, texto e imagem externos (mesmo open source). Nada com copyright sem permissão.

**Elegibilidade:** todos os membros (1 a 6) registrados no MESMO evento local, sem lista de espera, na aba Members; todos os campos preenchidos; marcar Termos e "Confirm All Work is Original"; clicar "Submit for Judging". Proibido imagem/vídeo/áudio de menores de 18 anos.

**Critérios (nota de 1 a 5 em cada):**
- **Impact:** tamanho do problema e alcance do benefício.
- **Creativity:** originalidade, abordagem nova ou melhoria significativa.
- **Validity:** base científica, viabilidade técnica, completude, USABILIDADE.
- **Relevance:** responde diretamente ao desafio; dados da NASA como parte CENTRAL, não enfeite.
- **Presentation:** storytelling claro e envolvente (avaliam demo + projeto). O guia pede atenção igual aos outros 4.

**Roteiro oficial para vídeo de 30 s:** 0:00 nome e equipe → 0:02 desafio e inspiração → 0:05 nome do projeto + tagline → 0:10 como funciona (protótipo, experiência do usuário, como dados da NASA tornaram possível) → 0:20 a 0:30 visão de futuro.
**Slides:** fonte legível, poucas palavras, imagem do projeto, experiência do usuário, uso de dados NASA/agências, nome da equipe, membros e desafio.

**Datas dos resultados:** Global Nominees 03/12/2026; Finalists 17/12/2026; Winners 26/01/2027. 10 prêmios globais (Best Use of Science, Data, Technology; Galactic Impact; Best Mission Concept; Most Inspirational; Best Storytelling; Global Connection; Art & Technology; Local Impact).

---

## 8. RISCOS E PONTOS DE ATENÇÃO DO PROJETO
- **Limites sem fonte derrubam Validity:** usar só os da seção 6 e citar.
- **Relevance:** mostrar no app de onde vem cada limite e cada orientação (ex.: tooltip "Source: NASA-STD-3001 [V1 4027]").
- **Autonomia:** o desafio e o hazard de distância pedem funcionar sem a Terra (offline, decisões locais, escalonamento ciente do atraso de 20 min).
- **Integração no fim é onde times iniciantes quebram:** ter versão funcionando no ar até domingo à tarde.
- **Inglês em tudo que vai para o jurado.**
- **Imagens oficiais da NASA (ex.: infográfico de SANS) têm o logo da NASA:** não colar no app nem nos slides; usar só as informações e citar.
- **Pitch de Relevance:** citar que a própria NASA declara precisar de apoio à decisão clínica e assistentes virtuais para missões sem contato em tempo real (seção 5).
- **Fonte não confirmada:** a patente NASA MSC-TOPS-6 enviada pela equipe não abre no portal da NASA; não citar até confirmar.

---

## 9. FONTES
### NASA (campo "NASA Data")
- Hazards: https://www.nasa.gov/hrp/hazards/ (subpáginas: hazard-space-radiation, hazard-isolation-and-confinement, hazard-distance-from-earth, hazard-gravity-fields, hazard-hostile-closed-environments, todas em https://www.nasa.gov/hrp/...)
- Risks: https://www.nasa.gov/hrp/risks/ e as 17 páginas de risco:
  - https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/
  - https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/
  - https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/
  - https://www.nasa.gov/reference/risk-of-decompression-sickness/
  - https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/
  - https://www.nasa.gov/reference/risk-of-hypoxia/
  - https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/
  - https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/
  - https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/
  - https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/
  - https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/
  - https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/
  - https://www.nasa.gov/reference/risk-of-inadequate-teamwork/
  - https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
  - https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/
  - https://www.nasa.gov/reference/risk-of-injury-from-dynamic-loads/
  - https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/
- Ongoing HRP Research: https://www.nasa.gov/hrp/ongoing-hrp-research/ (ARCHeR: https://www.nasa.gov/reference/archer/ ; Standard Measures: https://www.nasa.gov/reference/standard-measures/ ; Tempus Pro: https://www.nasa.gov/reference/tempus-pro/)
- Vídeos "Hazards of Human Spaceflight": https://www.youtube.com/watch?v=3jRxgvwhGC0 ; https://www.youtube.com/watch?v=FPinASEKA_I ; https://www.youtube.com/watch?v=0_pbs8dG1oM ; https://www.youtube.com/watch?v=f3-96ZbY5NA ; https://www.youtube.com/watch?v=LgGt03MjHfA
- NASA-STD-3001 Vol. 1 Rev. C: https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf ; página: https://www.nasa.gov/reference/nasa-std-3001
- OCHMO Technical Briefs: Sleep https://www.nasa.gov/wp-content/uploads/2023/03/sleep-accomodations-technical-brief-ochmo.pdf ; CO2 https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf ; índice https://www.nasa.gov/ochmo/health-operations-and-oversight/hsa-standards/
- NASA-STD-3001 Vol. 2, seção 6 (atmosfera, temperatura, ruído, radiação): https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2
- OCHMO: Habitable Atmosphere https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-003-habitable-atmosphere.pdf ; ECLSS https://www.nasa.gov/wp-content/uploads/2023/07/eclss-technical-brief-ochmo.pdf ; Acoustics https://www.nasa.gov/sites/default/files/atoms/files/acoustics_technical_brief_ochmo_0.pdf ; DCS https://www.nasa.gov/sites/default/files/atoms/files/dcs_technical_brief_ochmo.pdf
- Tabela de PIO2 (Vol. 2 Rev. B): https://ntrs.nasa.gov/api/citations/20220019130/downloads/SKC%20EVA%20Gas%20Related%20Problems%20related%20to%20Spacesuits%20Dec%202022_Final.pdf ; NC em dBA: https://ntrs.nasa.gov/api/citations/20090043801/downloads/20090043801.pdf
- NASA OSDR Environmental Data App: https://visualization.osdr.nasa.gov/eda
- SRAG (SPE/ESPE): https://www.nationalacademies.org/cdn/materials/9fba0b8d-da37-49fe-9fc5-45b736630da3 ; RadWorks: https://ntrs.nasa.gov/api/citations/20150001237/downloads/20150001237.pdf
- Atraso de comunicação: https://ntrs.nasa.gov/api/citations/20240006867/downloads/Proof_Slides_Parisi_Megan_969.pdf ; https://ntrs.nasa.gov/api/citations/20230010972/downloads/Proof_Slides_Parisi_Megan_797.pdf ; conjunção: https://mars.nasa.gov/mars2020/mission/status/337/hunkering-down-for-solar-conjunction ; evacuação ISS: https://ntrs.nasa.gov/api/citations/20240011063/downloads/Quantifying%20Risk%20on%20a%20Long%20Duration%20Lunar%20Mission.pdf
- Visão em voo: https://ntrs.nasa.gov/api/citations/20170009173/downloads/20170009173.pdf
- Dispositivos médicos integrados (Tempus Pro): https://www.nasa.gov/glenn/glenn-expertise-space-exploration/human-health-performance/exploration-medical-technologies/multifunctional-integrated-medical-devices

- Human System Risks (30 riscos oficiais): https://www.nasa.gov/hhp/human-system-risks/ ; condições médicas em voo: https://www.nasa.gov/directorates/esdmd/hhp/risk-of-adverse-health-outcomes-and-decrements-in-performance-due-to-inflight-medical-conditions/ ; EIHSO: https://www.nasa.gov/directorates/esdmd/hhp/eihso-risk/
- HRP: https://www.nasa.gov/hrp/ ; Human Research Roadmap: https://humanresearchroadmap.nasa.gov/ ; Bed Rest FAQ: https://www.nasa.gov/hrp/bedrest-faqs/
- Isolamento (C-O-N-N-E-C-T): https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/
- Reaction Self Test na ISS (estudo com 24 astronautas): https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197 ; NASA Spinoff 2013: https://spinoff.nasa.gov/Spinoff2013/hm_1.html ; NTRS 20090029851: https://ntrs.nasa.gov/citations/20090029851
- NASA BHP Standard Measures: https://ntrs.nasa.gov/api/citations/20170005421/downloads/20170005421.pdf ; https://ntrs.nasa.gov/citations/20190000670
- NASA Ames (KSS, Samn-Perelli, PVT em aviação): https://hsi.arc.nasa.gov/publications/Arsintescu_etal_2019_JoVE.pdf
- Fichas oficiais de pesquisa na ISS (texto enviado pela equipe): Standard Measures, CIPHER, Direct ICP, B Complex, Thigh Cuff, Zero T2, Omics Archive, Manual Piloting (NASA Space Station Research Explorer / NASA Life Sciences Portal: https://nlsp.nasa.gov/explore/?alias=standardmeasures)
- PDFs enviados pela equipe: "The Human Body in Space" (NASA HRP, 2022); OCHMO Medical Technical Brief Bone Loss (OCHMO-MTB-013 Rev D, 2026); Evidence Report "Risk of Cardiovascular Adaptations" (NASA HRP, 2022); Evidence Report "Risk of Cardiovascular Disease and Other Degenerative Tissue Effects from Radiation Exposure" (NASA HRP, 2016); "Food and Nutrition Risk" Record Rev D (NASA HSRB, 2025); infográfico SANS (NASA NP-2020-05-011-JSC).

### Agência parceira: CSA (campo "Space Agency Partner Data")
- https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- Infográfico: https://www.asc-csa.gc.ca/eng/multimedia/search/image/8056
- Vídeo: https://www.asc-csa.gc.ca/eng/multimedia/search/video/18190
- MOSFET dosimeter: https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp
- Radi-N2: https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp
- Experimentos canadenses na ISS: https://www.asc-csa.gc.ca/eng/iss/science/experiments.asp

### Outras referências
- NEWS2 (Royal College of Physicians): https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/ ; chart: https://www.nwas.nhs.uk/publications/news2-national-early-warning-score
- PVT-B (Basner, Mollicone & Dinges, Acta Astronautica 2011): https://www.med.upenn.edu/uep/assets/user-content/documents/Basner2011-ValidityandsensitivityofabriefPVT.pdf
- Bateria Cognition (UPenn, desenvolvida para a NASA): https://www.med.upenn.edu/uep/cognition.html
- Samn-Perelli (USAF SAM-TR-82-21, 1982): https://apps.dtic.mil/sti/pdfs/ADA125319.pdf
- Karolinska Sleepiness Scale (Åkerstedt & Gillberg, 1990)
- Norsk et al. 2015 (PA em microgravidade): https://doi.org/10.1113/jphysiol.2014.284869
- Consenso de hipotensão ortostática (Freeman 2011, via MSD Manual): https://www.msdmanuals.com/professional/cardiovascular-disorders/symptoms-of-cardiovascular-disorders/orthostatic-hypotension
- ESA, latência de comunicação: https://nebula.esa.int/sites/default/files/neb_study/3142/C4000136202FR.pdf
- Acrescentar aqui toda biblioteca, ícone, fonte tipográfica e ferramenta de IA usada na construção.

### Regras do evento (referência interna)
- Desafio: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
- Submission Guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging Guide: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- Vídeo de submissão: https://www.youtube.com/watch?v=CV7AYfMRyMM
- Vencedores anteriores: https://www.spaceappschallenge.org/awards/
