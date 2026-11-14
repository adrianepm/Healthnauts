# AstroVida — console de missão

Black Belt's Team · NASA Space Apps Challenge 2026

## Composição e linguagem

Uma superfície azul-marinho escura serve de base para painéis sólidos. Ciano claro identifica ações e foco. Âmbar e vermelho indicam atenção e risco demonstrativos retornados pelo servidor. Disponibilidade, idade da medição e ausência de avaliação têm texto próprio, acompanhado de ícone. O idioma da interface é inglês. Relatos livres conservam o conteúdo gravado. Os três textos fictícios do seed têm tradução de apresentação.

Na inicial, o cabeçalho informa astronauta e origem dos dados. Uma figura vetorial original apresenta cinco nós estáticos, com nome e ícone. O menu do cabeçalho oferece o mesmo acesso. Em larguras menores, os nós passam a formar uma lista abaixo da figura. O resumo de observações permanece aberto. A figura é decorativa para tecnologias assistivas e cada nó é um link semântico.

As áreas usam o mesmo ritmo: título e atualização, ações, sinais que exigem atenção, três medições prioritárias quando disponíveis, histórico, medições adicionais, avaliações e fontes. No gráfico, pontos representam amostras discretas, com eixo temporal UTC e sem interpolação entre lacunas. A série usa unidade, origem e contexto compatíveis com a última amostra. As demais amostras ficam disponíveis na lista do período.

## Tokens e interação

Os tokens usados pelo redesign estão em `src/index.css`. Base `#0b121d`, painel `#111d2b`, superfície elevada `#172638`, divisórias `#2c4055`. Texto principal `#f0f5fa`, secundário `#a8b7c8`, ação `#9edef6`. Família Inter caso já instalada, com fallback de sistema e sem requisição de fonte. Espaço de 20 px entre seções, padding fluido de 16–28 px, raio de 14 px nos painéis e 8 px nos controles. Foco visível e alvos de ação com pelo menos 44 px. Transições curtas de cor e borda respeitam movimento reduzido.

Diálogos usam `showModal()`, nome acessível, foco contido, Escape e devolução de foco. O PVT nomeia o estímulo em texto e permite Enter/Espaço. Campos com unidade ou escala mostram o contexto antes do envio. Operações idempotentes reaproveitam a mesma requisição ao repetir uma tentativa incerta com a janela aberta. Após envio incerto a registros simples, o app pede que o usuário confira as medições, pois esse endpoint não oferece reenvio idempotente.

## Referências avaliadas

- [Better Design](https://github.com/marvkr/better-design) foi referência para hierarquia, consistência de componentes e revisão de acessibilidade.
- [design-md](https://github.com/ummydev/design-md) orientou a organização dos tokens e o registro das decisões.
- [pretty-ui](https://github.com/ummydev/pretty-ui) reforçou a escolha de uma única direção, com controle de efeitos e prioridade ao conteúdo.
- [ui-templates](https://github.com/ummydev/ui-templates) foi consultado como catálogo de composição. Os templates completos têm pouca aderência ao contrato de monitoramento existente.
- [open-claude-design](https://github.com/Gospeloflukeselfconcern1691/open-claude-design) e [codexdesign](https://github.com/ummydev/codexdesign) tratam principalmente da geração ou da comparação visual de mockups.
- [deepseek-code](https://github.com/Ange4918/deepseek-code) é um guia de ferramentas de desenvolvimento, com pouca contribuição visual direta.

A imagem anexada orientou apenas a distribuição da figura e dos cinco acessos. A figura foi desenhada no projeto, com ícones Lucide já presentes. Nenhum código, asset, tema, plugin ou script dos repositórios consultados foi incorporado.

## Escopo da integração

O redesign mantém as URLs existentes, o serviço de API configurável, a separação entre simulação e entradas manuais/sensor, as operações compostas, os cenários, as avaliações e os cálculos de sono e PVT feitos no servidor. A interface mostra NEWS2 demonstrativo com apenas a escala de saturação 1. O relatório preparado fica local, com entrega pendente de um mecanismo de transmissão.

Itens do protótipo anteriores sem integração confiável incluem pontuação geral, gamificação de saúde, dosímetros e inventário fictícios, cronômetro solar operacional, rastreamento de refeições, áudio de diário, notificações automáticas, protocolos médicos, metas simuladas e testes locais de adaptação. Permanecem no histórico do projeto. A interface usa cenários explícitos, leituras e ações reais da API como caminhos de demonstração. Autenticação e autorização por papel continuam ausentes. Use dados fictícios em todos os modos.

## Revisão local

O worktree foi criado a partir de `origin/frontend-integracao` em `c4292290887a2a02202fa63eaf48885d1de64b1e`. Use os comandos do [README](README.md). A prévia usa `data/design-demo.json`, ignorado pelo Git.

`npm test` cobre API, cálculos, operações, datasets e cenários. `npm run build` executa a checagem TypeScript e gera o bundle. O projeto não tem script de lint. O roteiro de integração pelo Chromium, `node qa/design-flows.cjs`, grava dados fictícios na base selecionada. Aceita `QA_FRONTEND`, `QA_API`, `PLAYWRIGHT_MODULE` e `PLAYWRIGHT_BROWSERS_PATH`. Execute com `QA_FULL_PVT=1` para incluir a sessão completa sem acelerar o relógio.

Matriz visual executada nas seis rotas em Firefox e Chromium a 1920 × 1080, 1366 × 768 e 390 × 844, com preferência de movimento reduzido. Também foi aplicado zoom nativo de 200% por aba nos dois navegadores. As capturas de comparação estão em `/tmp/nasa-design-capturas`. Sem auditoria formal com leitor de tela ou dispositivo móvel físico.

Na execução de revisão, a suíte da API passou com 38 testes e o build gerou 667,71 kB de JavaScript minificado (197,84 kB gzip), com aviso de chunk acima de 500 kB. O roteiro de navegador confirmou check-in, reenvio idempotente do sono, PVT interrompido e completo, atmosfera, NEWS2, missão, relatório não enviado e cenário de CO₂. Em 390 px também foram enviados exposição, postura, ruído e pós-EVA. O cenário de comunicação indisponível abriu o relatório persistido pela rota de consulta.
