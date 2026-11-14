import { KitItem, SurgeonCase, MedicalProtocol } from '../types';

export const MOCK_COMMS_INFO = {
  distanceKmMillion: 148.2,
  oneWayDelaySeconds: 8 * 60 + 14, // 8 min 14 s
  roundTripDelaySeconds: 16 * 60 + 28, // 16 min 28 s
  telemedicineMode: 'Assíncrona (Pacotes de Telemetria Criptografados)',
  nextCommsWindow: 'em 2 h 10 min',
  autonomyLevel: 3,
  autonomyTitle: 'Autonomia Médica — Nível 3: Decisões Clínicas a Bordo',
  autonomyDesc: 'A tripulação tem autoridade para iniciar procedimentos invasivos, farmacológicos e diagnósticos usando suporte de IA local sem aguardar confirmação em tempo real da Terra.',
};

export const MOCK_KIT_INVENTORY: KitItem[] = [
  {
    id: 'kit-analgesics',
    name: 'Analgésicos & Anti-inflamatórios',
    category: 'Farmácia Geral',
    stockPercent: 82,
    level: 'green',
    quantity: '164 / 200 comp.',
    minRequired: '50 comp.',
    whyCrucial: 'Controle de cefaleia por adaptação a CO2 e dores musculares pós-exercício resistivo de alta intensidade.',
    location: 'Gabinete Médico 01 · Gaveta A',
  },
  {
    id: 'kit-antibiotics',
    name: 'Antibióticos de Amplo Espectro',
    category: 'Infectologia',
    stockPercent: 64,
    level: 'green',
    quantity: '32 / 50 doses',
    minRequired: '15 doses',
    whyCrucial: 'Bactérias em ambiente fechado sofrem mutações na virulência e biofilme; estoque de reserva vital.',
    location: 'Gabinete Médico 01 · Gaveta C (Refrigerada)',
  },
  {
    id: 'kit-iv-fluid',
    name: 'Soro Intravenoso & Eletrólitos',
    category: 'Reanimação & Hidratação',
    stockPercent: 38,
    level: 'yellow',
    quantity: '3,8 / 10 L',
    minRequired: '4,0 L',
    whyCrucial: 'Volume crítico para desidratação aguda pós-cinetose espacial ou trauma. Recomenda-se reposição via kit gerador de soro a bordo.',
    location: 'Gabinete Médico 02 · Compartimento B',
  },
  {
    id: 'kit-suture',
    name: 'Material de Sutura & Hemostasia',
    category: 'Cirurgia & Trauma',
    stockPercent: 90,
    level: 'green',
    quantity: '18 / 20 kits',
    minRequired: '6 kits',
    whyCrucial: 'Tratamento de lacerações acidentais em cantos agudos de anteparas durante flutuação em microgravidade.',
    location: 'Mala Cirúrgica de Emergência',
  },
  {
    id: 'kit-antiemetics',
    name: 'Anti-náusea / Prometazina / Ondansetrona',
    category: 'Cinetose Espacial & Radioproteção',
    stockPercent: 25,
    level: 'red',
    quantity: '5 / 20 ampolas',
    minRequired: '8 ampolas',
    whyCrucial: 'Consumo acelerado na fase inicial da missão por náusea vestibular e preparo para o alerta solar iminente. Ação prioritária de racionamento.',
    location: 'Gabinete Médico 01 · Gaveta Narcóticos/Especiais',
  },
  {
    id: 'kit-blood-tests',
    name: 'Testes Rápidos de Sangue (Biochips)',
    category: 'Diagnóstico Lab',
    stockPercent: 70,
    level: 'green',
    quantity: '35 / 50 cartuchos',
    minRequired: '15 cartuchos',
    whyCrucial: 'Cartuchos microfluídicos portáteis para hemograma, troponina, PCR e gasometria com 1 gota de sangue capilar.',
    location: 'Analisador Bioquímico Portátil (i-STAT)',
  },
];

export const MOCK_SURGEON_QUEUE: SurgeonCase[] = [
  {
    id: 'case-01',
    subject: 'Dor torácica leve atípica (Traçado de ECG anexado)',
    summary: 'Desconforto retroesternal aos grandes esforços no ergômetro. ECG de 12 derivações sem supra de ST.',
    status: 'waiting',
    waitingTime: 'Aguardando há 16 min (tempo de trânsito em curso)',
    lastUpdate: 'Hoje 12:54 UTC',
    priority: 'yellow',
    attachedData: 'ECG_lead_12_20261114.dat, Troponina T: 0,004 ng/mL (negativa)',
  },
  {
    id: 'case-02',
    subject: 'Elevação progressiva da Glicose matinal (5 dias)',
    summary: 'Glicemia variou de 94 a 104 mg/dL. Cirurgião de voo respondeu com ajuste nutricional e suplementação.',
    status: 'answered',
    lastUpdate: 'Ontem 21:10 UTC',
    priority: 'green',
    attachedData: 'Log_Glicemia_7d.csv, Carga ARED.json',
    reply: 'Dr. Marcus Vance (Cirurgião Chefe - JSC): "Olá Ares-1. O padrão é consistente com intolerância periférica induzida por microgravidade. Recomendamos aumentar o volume de agachamento resistivo em 15% e substituir a porção de maltodextrina matinal por aveia enriquecida."',
  },
  {
    id: 'case-03',
    subject: 'Foto de micro-lesão na pele antebraço direito',
    summary: 'Eritema puntiforme com leve prurido pós-uso do traje de atividade extraveicular.',
    status: 'draft',
    lastUpdate: 'Hoje 08:30 UTC',
    priority: 'gray',
    attachedData: 'DermatoScan_042.jpg, Coleta_microbiana_superfície.log',
  },
];

export const MEDICAL_PROTOCOLS: MedicalProtocol[] = [
  {
    id: 'proto-chest-pain',
    name: 'Dor Torácica e Desconforto Cardíaco',
    keywords: ['dor no peito', 'coração', 'ecg', 'infarto', 'angina', 'palpitação'],
    severity: 'red',
    category: 'Cardiovascular',
    steps: [
      {
        stepNumber: 1,
        title: 'Classificação do Sintoma',
        description: 'Avalie se a dor é em aperto, pontada, se irradia para mandíbula ou braço esquerdo, e se piora com a respiração ou movimento torácico.',
        actionRequired: 'Determinar se é dor típica isquêmica ou osteomuscular por esforço no ARED.',
        whyMeasure: 'A atrofia miocárdica em microgravidade pode alterar a reserva coronariana e mascarar isquemias subclínicas.',
        whatToDo: 'Coloque o astronauta em posição de repouso confortável com pés fixos nos estribos.'
      },
      {
        stepNumber: 2,
        title: 'Perguntas Clínicas Direcionadas',
        description: 'Investigue: Início súbito? Houve sudorese fria, tontura ou náusea associada? Teve trauma recente no ergômetro?',
        actionRequired: 'Preencher checklist rápido no tablet.',
        whyMeasure: 'Sintomas neurovegetativos aumentam a probabilidade de evento coronariano agudo.',
        whatToDo: 'Se houver sudorese fria ou hipotensão, inicie protocolo de oxigenoterapia suplementar.'
      },
      {
        stepNumber: 3,
        title: 'Medição Instrumental Imediata',
        description: 'Conecte os 10 eletrodos do ECG de 12 derivações e colha 1 gota de sangue no cartucho de Troponina ultrassensível.',
        actionRequired: 'Rodar traçado de ECG e inserir biochip no analisador i-STAT.',
        whyMeasure: 'ECG e troponina diferenciam infarto agudo do miocárdio de dor musculoesquelética com 99% de precisão.',
        whatToDo: 'Aguarde 8 minutos pelo resultado do biochip. Transmita o PDF gerado no canal prioritário.'
      },
      {
        stepNumber: 4,
        title: 'Protocolo Farmacológico a Bordo',
        description: 'Se o ECG for normal e a troponina negativa: administrar Paracetamol 1000 mg + pomada anti-inflamatória local.',
        actionRequired: 'Se houver supra de ST evidente: administrar AAS 300 mg mastigável + Nitrato sublingual (se PA > 100 mmHg).',
        whyMeasure: 'Ação rápida antitrombótica salva músculo cardíaco durante a janela de trânsito.',
        whatToDo: 'Retirar medicamento do Gabinete Médico 01 · Gaveta A.'
      },
      {
        stepNumber: 5,
        title: 'Escalar & Telemetria Prioritária',
        description: 'Ativar o botão de telemetria médica de emergência (Red Flag Comm) para envio imediato de dados brutos à Terra.',
        actionRequired: 'Enviar alerta urgente com cópia para os demais tripulantes a bordo.',
        whyMeasure: 'Garante que a equipe de especialistas terrestres prepare diretrizes cirúrgicas ou farmacológicas avançadas.',
        whatToDo: 'Mantenha o paciente monitorado com oxímetro de pulso contínuo.'
      }
    ]
  },
  {
    id: 'proto-sans-eye',
    name: 'Síndrome Neuro-Ocular (SANS) & Alteração Visual',
    keywords: ['visão', 'olhos', 'flashes', 'névoa', 'sans', 'fundo de olho', 'ultrassom'],
    severity: 'yellow',
    category: 'Oftalmologia & Neuro',
    steps: [
      {
        stepNumber: 1,
        title: 'Sintoma e Acuidade Visual',
        description: 'Avalie se há névoa visual, diminuição de nitidez para leitura de telas ou manchas escuras centrais.',
        actionRequired: 'Aplicar teste de acuidade visual com a tabela Snellen calibrada a 40 cm.',
        whyMeasure: 'A translocação de fluidos intracranianos em microgravidade causa edema do disco óptico e dobras coroidais.',
        whatToDo: 'Anote a menor linha legível com cada olho separadamente.'
      },
      {
        stepNumber: 2,
        title: 'Perguntas e Histórico de Pressão',
        description: 'Pergunte se a perda é gradual ou súbita, e se há dores de cabeça ao despertar.',
        actionRequired: 'Checar histórico de pressão intracraniana indireta e níveis de CO2 nos últimos 7 dias.',
        whyMeasure: 'O CO2 elevado exacerba a vasodilatação cerebral, piorando a hipertensão intracraniana.',
        whatToDo: 'Verificar se o filtro de CO2 da cabine de sono está operando adequadamente.'
      },
      {
        stepNumber: 3,
        title: 'Ultrassom Ocular & Bainha do Nervo Óptico',
        description: 'Use a sonda linear do ultrassom de bordo na pálpebra fechada com gel estéril para medir o diâmetro da bainha do nervo óptico (ONSD).',
        actionRequired: 'Medir diâmetro a 3 mm atrás do polo posterior (valor nominal < 5.0 mm).',
        whyMeasure: 'ONSD > 5.8 mm confirma hipertensão intracraniana significativa.',
        whatToDo: 'Grave clipe de 10 segundos em modo B e salve como OcularScan_Paciente.dcm.'
      },
      {
        stepNumber: 4,
        title: 'Protocolo de Descompressão Cefálica',
        description: 'Aplicar sessões de Chibis LBNP (Lower Body Negative Pressure) - pressão negativa na parte inferior do corpo por 60 min.',
        actionRequired: 'Ajustar dispositivo para -25 mmHg para redistribuir sangue para as pernas.',
        whyMeasure: 'O LBNP simula o efeito da gravidade terrestre, descomprimindo os ventrículos cerebrais e o nervo óptico.',
        whatToDo: 'Monitorar pressão arterial a cada 15 min durante o procedimento LBNP.'
      },
      {
        stepNumber: 5,
        title: 'Registro e Telemetria para Houston',
        description: 'Transmitir imagens ultrassonográficas para a equipe de neuro-oftalmologia terrestre.',
        actionRequired: 'Adicionar caso à Fila do Cirurgião com nível de prioridade Moderado.',
        whyMeasure: 'Permite ajuste de prescrição de óculos espaciais com lentes progressivas corretivas.',
        whatToDo: 'Repetir aferição ultrassonográfica após 7 dias de terapia LBNP.'
      }
    ]
  },
  {
    id: 'proto-dental',
    name: 'Dor de Dente Aguda (Barodontalgia / Abscesso)',
    keywords: ['dente', 'dor de dente', 'boca', 'abscesso', 'gengiva', 'mandíbula'],
    severity: 'yellow',
    category: 'Odontologia Espacial',
    steps: [
      {
        stepNumber: 1,
        title: 'Inspeção Visual e Percussão',
        description: 'Utilize a câmera intraoral de alta definição e o espelho dental para localizar cárie, restauração fraturada ou edema gengival.',
        actionRequired: 'Tocar suavemente o dente suspeito com cabo da sonda para testar sensibilidade à percussão.',
        whyMeasure: 'Em microgravidade e variações de pressão da cabine, bolhas de ar em raízes podem causar barodontalgia incapacitante.',
        whatToDo: 'Identifique o quadrante e o número do dente afetado (sistema ISO 1 a 32).'
      },
      {
        stepNumber: 2,
        title: 'Verificação de Sinais de Sepse',
        description: 'Medir temperatura corporal e palpar linfonodos cervicais e submandibulares.',
        actionRequired: 'Verificar se há trismo (dificuldade para abrir a boca) ou febre > 37.8°C.',
        whyMeasure: 'Infecções orais podem disseminar-se para o mediastino ou corrente sanguínea rapidamente em astronautas imunossuprimidos.',
        whatToDo: 'Se houver edema facial visível, passe imediatamente ao passo 4.'
      },
      {
        stepNumber: 3,
        title: 'Medição da Profundidade e Teste Térmico',
        description: 'Aplicar teste de sensibilidade ao frio com cotonete e verificar presença de bolsa periodontal profunda.',
        actionRequired: 'Registrar se a dor cessa com retirada do estímulo (reversível) ou persiste em pontadas contínuas (pulpite irreversível).',
        whyMeasure: 'Diferencia inflamação transitória de necessidade de drenagem ou antibioticoterapia.',
        whatToDo: 'Documentar no prontuário local.'
      },
      {
        stepNumber: 4,
        title: 'Curativo Provisório & Analgesia',
        description: 'Aplicar pasta de óxido de zinco e eugenol (Cavit) se houver cavidade aberta. Analgesia com Ibuprofeno 600mg 8/8h.',
        actionRequired: 'Se abscesso bacteriano: iniciar Amoxicilina + Clavulanato 875mg 12/12h por 7 dias.',
        whyMeasure: 'Controla a infecção bacteriana oportunista e alivia dor aguda para preservar capacidade operacional.',
        whatToDo: 'Retirar o Kit Odontológico de Emergência localizado no Módulo A.'
      },
      {
        stepNumber: 5,
        title: 'Relatório ao Cirurgião de Voo Odontológico',
        description: 'Enviar fotos intraorais em alta resolução com a prescrição iniciada para validação remota.',
        actionRequired: 'Agendar reavaliação clínica em 24h a bordo.',
        whyMeasure: 'Evita procedimentos invasivos desnecessários como exodontia em ambiente de microgravidade sem contenção de fluidos.',
        whatToDo: 'Orientar o astronauta a mastigar apenas pelo lado oposto.'
      }
    ]
  }
];
