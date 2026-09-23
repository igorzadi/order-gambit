# Order Gambit

Jogo educacional com React, TypeScript e Vite, integrado até a Etapa 4E.

## Executar

- `npm install`: instala as dependências.
- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: verifica o TypeScript e gera a aplicação em `dist/`.
- `npm run preview`: serve o build localmente.
- `npm run lint`: verifica o código.
- `npm test`: executa os 106 testes uma vez.
- `npm run test:watch`: inicia o Vitest em modo de desenvolvimento.

## Navegação

Home (`/`) → Introdução (`/intro`) → Experimente (`/experiment`) → Descubra (`/discover`) → Pratique (`/practice`) → Analise (`/analyze`) → Desafio (`/challenge`) → Resultado (`/result`).

Home identifica o jogador por apelido. As rotas futuras ficam bloqueadas até a conclusão das atividades anteriores; os roteiros abaixo pressupõem que a fase já foi liberada. Resultado permite iniciar uma nova partida. Experimente começa com as cartas 7, 3, 9, 5, 2 e permite reordená-las livremente. A mensagem de conclusão e o link Continuar para `/discover` aparecem somente quando a sequência está crescente.

## Organização

- `src/components/`: componentes de interface; Card, CardDeck e GameHeader já disponíveis. Feedback e ProgressBar disponíveis.
- `src/pages/`: telas e links de navegação.
- `src/game/engine/`: motor puro de Insertion Sort e seus testes, independente do React.
- `src/game/levels/`: sequências e textos de Discover e Practice.
- `src/game/types/`: tipo `CardItem`, com identidade estável e valor numérico.
- `src/game/scoring/`: pontuação pura por inserção e registro de desempenho do desafio.
- `src/hooks/`: integração React da rodada guiada, com reducer testável.
- `src/game/session/`: progressão da partida e reconstrução das rodadas.
- `src/context/`: estado global React e ações da partida.
- `src/services/`: persistência local validada.
- `src/styles/`: estilos da interface.

As pastas reservadas contêm apenas `.gitkeep`. O motor do Insertion Sort é puro e está integrado às fases Discover, Practice e Analyze por uma camada de hooks. A pontuação é exclusiva de Challenge; integrações externas não estão implementadas. Lucide-react permanece disponível para uso futuro.

## Manipulação das cartas (Etapa 2)

`CardDeck` é controlado por `cards` e `onChange`: recebe uma sequência de `CardItem` e comunica a nova ordem ao soltar uma carta. Cada item deve ter um `id` único e estável, mesmo quando houver valores repetidos. `Card` cuida da apresentação; a integração genérica com dnd-kit fica no `CardDeck`. Experiment mantém o estado React e verifica apenas se os valores estão em ordem crescente.

O dnd-kit fornece a reorganização visual durante o arraste. Movimentos cancelados não alteram o estado. São usados os sensores padrão para ponteiro (mouse, trackpad e toque) e teclado. No toque, segure brevemente a carta antes de mover. A rolagem permanece disponível fora das cartas.

### Teste manual

1. Execute `npm run dev` e abra `/experiment`.
2. Confirme a sequência inicial e a ausência do botão Continuar.
3. Arraste 3 sobre a posição de 7: a sequência deve ficar 3, 7, 9, 5, 2.
4. Mova cartas em ambos os sentidos, inclusive entre as extremidades. As demais devem abrir espaço, sem perder ou duplicar cartas.
5. Organize 2, 3, 5, 7, 9 e confira as três mensagens de conclusão e o botão Continuar.
6. Ao concluir, a fase fica registrada e as cartas permanecem ordenadas. Clique em Continuar para abrir `/discover`.
7. Repita com trackpad e em um celular (ou dispositivo com toque), incluindo movimentos entre linhas quando as cartas quebrarem de linha.
8. Durante um arraste no desktop, pressione Escape: a ordem anterior deve ser preservada.

A sequência parcial é preservada ao recarregar ou retornar à página. Fases concluídas permanecem concluídas; use Nova partida para recomeçar.

Em produção, o servidor deve direcionar as rotas da aplicação para `index.html`, pois a navegação usa BrowserRouter.


## Motor do Insertion Sort (Etapa 3)

A API pública está em `src/game/engine/index.ts`:

- `createInsertionState(cards): InsertionState`
- `getCurrentCard(state): Readonly<CardItem> | null`
- `getExpectedPosition(state): number | null`
- `validateInsertion(state, targetPosition): boolean`
- `applyInsertion(state, targetPosition): InsertionState`
- `isCompleted(state): boolean`

`InsertionState` contém `cards`, `currentIndex`, `currentCard`, `sortedUntil`, `expectedPosition` e `completed`. Os estados devem ser criados e avançados pela API, sem editar seus campos derivados. Os campos e cartas são somente leitura em TypeScript. A criação copia o array e os objetos de entrada; passos posteriores compartilham as cartas somente leitura, sem mutação.

Todas as posições começam em zero. `sortedUntil` é o índice inclusivo do final da região processada. `currentIndex` é a primeira posição ainda não processada. A posição de destino é o índice final da carta após sua inserção, de zero até `currentIndex` inclusive. Inserir no próprio índice é um passo válido e necessário quando a carta já está na posição correta; A rodada compartilhada permite confirmar esse passo com o botão Manter aqui.

A primeira carta começa processada. Uma sequência já ordenada com mais de uma carta ainda exige cada passo pedagógico. Ao concluir, `currentIndex === cards.length`, `sortedUntil === cards.length - 1`, e `currentCard` e `expectedPosition` são `null`. Sequências vazias ou unitárias já começam concluídas; na vazia, `sortedUntil` é -1.

Uma inserção válida retorna novo estado e novo array. Uma inserção inválida ou após conclusão lança `RangeError`, preservando o estado anterior. Use `validateInsertion` para consultar a validade sem exceção. IDs duplicados ou valores não finitos na entrada lançam `TypeError`.

Valores iguais são inseridos depois dos iguais já processados, preservando a ordem dos IDs. O reducer da rodada guiada verifica também que a carta arrastada é `currentCard.id`: esta API recebe apenas a posição de destino e sempre opera sobre a carta atual. CardDeck permanece livre em Experiment; Discover e Practice usam InsertionDeck para a interação com o motor.


## Descubra (Etapa 4A)

`useInsertionRound` mantém o estado do motor; `insertionRoundReducer` confere o ID da carta, consulta `validateInsertion` e chama `applyInsertion`. Posições incorretas e `RangeError` retornam feedback sem mudar o estado. `InsertionDeck` reutiliza Card, mostra as três regiões e fornece alvos de inserção estáveis. Só a carta atual tem comportamento de arraste. Cancelar um arraste não envia uma tentativa; soltar sem alvo resulta em Tente novamente.

O botão **Manter aqui** aparece quando `getExpectedPosition(state) === state.currentIndex`, com carta atual existente. Ele envia o ID atual e esse índice pelo mesmo reducer, sem simular arraste. Na sequência fixa [8, 3, 6, 2, 5], todos os passos exigem deslocamento, portanto esse botão não aparece durante o percurso normal. O caso é coberto por teste automatizado com [1, 2, 3]. Na Practice, a carta 8 oferece naturalmente esse caso após a primeira inserção.

### Teste manual de Discover

1. Abra `/discover` e confira 8 na parte ordenada, 3 como carta atual e 6, 2, 5 como futuras. Não deve haver Continuar.
2. Tente arrastar 8 ou 6: essas cartas devem permanecer imóveis.
3. Arraste 3 para o espaço depois de 8: deve aparecer Tente novamente, sem avançar.
4. Arraste 3 para o espaço com ↓ antes de 8: a região cresce e 6 vira a carta atual.
5. Insira 6 entre 3 e 8; insira 2 antes de 3; insira 5 entre 3 e 6.
6. Confira a sequência 2, 3, 5, 6, 8 e os textos finais sobre Insertion Sort. Continuar leva à fase `/practice`.
7. Volte a `/experiment` e confira que a conclusão permanece registrada. Uma nova partida permite experimentar livremente novamente.

Verificações: `npm test` executa os testes do motor, das fases, de operações e da pontuação do desafio. `npm run build` e `npm run lint` verificam compilação e código.


## Pratique (Etapa 4B)

Discover e Practice usam o mesmo componente `InsertionRound`, o mesmo `useInsertionRound`, reducer e `InsertionDeck`. As configurações em `src/game/levels/insertionLevels.ts` definem sequência, textos, feedback e próxima rota. O motor e sua API não foram alterados. As páginas usam rodadas separadas, preservadas dentro da mesma partida.

Practice começa com [7, 4, 8, 3, 6, 2], mostra a carta atual e não fornece instruções por passo nem resposta antecipada. Somente a carta atual pode ser arrastada. A mensagem de erro é específica da fase; um erro não avança nem altera a sequência. Manter aqui continua usando o hook e o motor existentes. A comparação inicial/final e o link para `/analyze` aparecem somente após a conclusão. Result apresenta o resumo após Challenge.

### Teste manual de Practice

1. Execute `npm run dev` e abra `/practice`. Confira a sequência inicial, Carta atual: 4 e a ausência de Continuar.
2. Tente arrastar 7 ou uma carta futura: não deve funcionar. Solte 4 depois de 7: deve aparecer apenas a mensagem de erro, sem avanço.
3. Insira 4 antes de 7. A carta atual passa a ser 8, com o botão Manter aqui. Clique nele: a sequência não muda e a carta atual passa a ser 3.
4. Insira 3 no início, 6 entre 4 e 7 e 2 no início.
5. Confira a conclusão e a comparação 7 4 8 3 6 2 → 2 3 4 6 7 8. Continuar navega para `/analyze`.
6. Volte às fases anteriores e confira que suas conclusões foram preservadas.


## Analise (Etapa 4C)

`insertionOperations.ts` calcula o trabalho de uma inserção sem alterar o estado: compara a carta atual com as anteriores da direita para a esquerda, contando cada comparação efetiva entre valores. Cada carta anterior maior que a atual corresponde a um deslocamento para a direita. A comparação que encerra a busca conta; testar o limite do array e posicionar a carta atual não contam como deslocamentos.

`useInsertionRound` aceita a opção `trackOperations` (desativada por padrão). O reducer acumula os custos do estado anterior somente depois de uma inserção validada e aplicada. Erros, cancelamentos e eventos de cartas já processadas não aumentam os contadores. InsertionRound expõe um callback opcional de conclusão; Analyze usa-o para salvar um resultado e iniciar a atividade seguinte, sem alterar as regras do motor ou as fases anteriores.

O controlador puro `analyzeFlowReducer` gerencia A → B → comparação → segunda questão → conclusão. Só aceita resultados de experimentos completos e respostas da atividade atual. Os resultados, rodadas parciais, seleções e respostas são preservados pela partida global. As configurações dos experimentos e questões ficam em `analyzeLevels.ts`.

Resultados calculados para cinco cartas:

| Experimento | Comparações | Deslocamentos |
| --- | ---: | ---: |
| A: 1 2 3 4 5 | 4 | 0 |
| B: 5 4 3 2 1 | 10 | 10 |

### Teste manual de Analyze

1. Abra `/analyze`. No experimento A, clique em Manter aqui para as cartas 2, 3, 4 e 5. Confira os contadores crescendo até 4 comparações e 0 deslocamentos.
2. Próximo experimento só aparece após terminar A. Clique e confira que B começa com contadores zerados.
3. Em B, tente inserir 4 depois de 5: o erro não deve alterar a sequência nem os contadores. Depois insira 4, 3, 2 e 1 sempre no início da parte ordenada. Os totais devem evoluir para 1, 3, 6 e 10 comparações e deslocamentos.
4. Clique em Comparar resultados. Confira os resultados lado a lado e a pergunta sobre o maior trabalho. Selecione A e confirme: deve haver feedback e nova tentativa. Selecione B e confirme para exibir os conceitos de melhor, pior e caso médio.
5. Na segunda questão, selecione D e confirme: deve haver erro sem liberar Continuar. Selecione C e confirme: deve aparecer o feedback correto, Análise concluída e Continuar para `/challenge`.
6. Reabra Experiment, Discover e Practice para conferir os comportamentos anteriores; os contadores são exclusivos de Analyze.

Os 20 testes novos cobrem comparações, deslocamentos, estabilidade, estados concluídos, melhores e piores casos, tentativas inválidas, resultados preservados, respostas e bloqueios de progressão. Challenge é descrito na Etapa 4D abaixo.


## Desafio Final (Etapa 4D)

Challenge configura a rodada compartilhada com [6, 2, 7, 4, 1, 5], feedback básico e registro de desempenho opcional. O motor, InsertionDeck, InsertionRound e Manter aqui são reutilizados. A barra mede as cinco inserções necessárias: a primeira carta já forma a região ordenada e não vale pontos.

`ChallengePerformance` registra inserções corretas, tentativas incorretas, passos concluídos, conclusão, pontuação e uma lista por ID da carta com tentativas, erros e pontos. Uma tentativa inclui a confirmação correta; erros são registrados no passo atual. Cancelar o arraste não gera tentativa. Soltar fora de um alvo ou tentar manipular uma carta futura gera erro. Eventos atrasados de cartas já pontuadas e eventos após a conclusão são ignorados.

`calculateInsertionScore(errors)` retorna 100 após zero erros, 75 após um erro e 50 após dois ou mais. A pontuação só é adicionada após o motor aceitar a inserção. `recordInsertionPerformance` é puro, não altera o registro anterior e impede pontuação duplicada. Um desafio sem erros soma 500 pontos. Os contadores de desempenho são independentes das operações usadas em Analyze.

Ao concluir, a interface apresenta as sequências, inserções, erros e pontos. Ver resultado navega para `/result`, que lê o desempenho da partida global. Reentrar em Challenge ou recarregar preserva a rodada e a pontuação. Não há serviço remoto, cronômetro ou ranking.

### Teste manual de Challenge

1. Abra `/challenge`. Confira Carta atual: 2, progresso 0 de 5 e ausência de Ver resultado. Cartas fora da posição atual devem estar bloqueadas para arraste.
2. Insira 2 antes de 6. Deve aparecer Inserção correta e progresso 1 de 5.
3. Para a carta 7, clique em Manter aqui. Depois insira 4 entre 2 e 6, 1 no início e 5 entre 4 e 6.
4. Confira 1 2 4 5 6 7, cinco inserções concluídas, zero erros e 500 pontos.
5. Reinicie e faça uma tentativa errada antes de acertar a primeira inserção. A sequência e o progresso não devem avançar no erro; ao concluir a rodada sem outros erros, a pontuação deve ser 475. Com dois erros nesse passo, deve ser 450.
6. Ver resultado deve abrir o resumo da partida em `/result`. As fases anteriores devem manter o mesmo comportamento e não mostrar pontuação do desafio.


## Integração da partida (Etapa 4E)

`MatchProvider` mantém uma partida com ID único, apelido, início, fase atual, fases concluídas e rodadas separadas. `match.ts` controla a progressão e delega as regras aos reducers existentes de inserção, Analyze e pontuação. A API do motor permanece inalterada. A pontuação total é obtida do desempenho de Challenge, sem um segundo acumulador.

O serviço `matchStorage.ts` salva na chave `order-gambit.match.v1` apenas a identificação, versão e histórico de ações. Ao recuperar, valida o formato e reaplica as ações pelos mesmos reducers para reconstruir cartas, índices, feedback, respostas, operações e desempenho. Não salva posições esperadas ou outros campos derivados. Eventos incompatíveis com a fase invalidam a recuperação; a Home permite começar novamente. Falhas de armazenamento são informadas e a partida continua em memória.

Acessar uma URL não conclui atividades. Rotas futuras redirecionam para a fase atual; fases concluídas podem ser revisitadas sem refazer sua pontuação. Jogar novamente substitui o histórico por uma partida vazia com novo ID e retorna à Home para identificação.

### Teste manual da partida completa

1. Na Home, informe um apelido e comece. Tente abrir `/result`: deve voltar à Intro. Avance pela introdução.
2. Em Experiment, faça uma troca, recarregue e confira a ordem parcial. Organize 2, 3, 5, 7, 9 e continue.
3. Em Discover, insira 3 antes de 8; recarregue. Continue com 6 entre 3 e 8, 2 no início e 5 entre 3 e 6.
4. Em Practice, insira 4 antes de 7, confirme Manter aqui para 8, insira 3 no início, 6 entre 4 e 7 e 2 no início. Uma tentativa errada deve preservar a carta atual.
5. Em Analyze, confirme Manter aqui quatro vezes em A. Em B, insira cada carta no início. Recarregue entre passos e confira os contadores. Responda B na primeira questão e C na segunda; confira também a recuperação de uma seleção antes de confirmar.
6. Em Challenge, faça um erro com 2 e depois insira-o antes de 6. Recarregue: erro e pontos devem permanecer. Confirme Manter aqui para 7, insira 4 entre 2 e 6, 1 no início e 5 entre 4 e 6.
7. Abra Result: confira apelido, cinco fases, cinco inserções, um erro e 475 pontos. Recarregue e volte a Challenge: o resultado deve permanecer sem somar pontos novamente.
8. Clique em Jogar novamente: deve voltar à Home. Inicie outra partida e confira progresso e pontuação zerados, com fases futuras bloqueadas.

Validação automatizada: 82 testes anteriores preservados e 24 testes novos para criação, progressão, bloqueios, recuperação parcial, armazenamento inválido, resultado, reinício e pontuação sem duplicação.
