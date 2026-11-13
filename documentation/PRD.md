# PRD — Pure Tuner

<!--
PRD: O QUE o app faz e POR QUÊ. Stack e implementação ficam em TechSpec.md.
Decisões são do Rangel: o que não foi decidido fica "A DEFINIR".
Origem: a especificação inicial (documentation/archive/PRODUCT.md) foi
consolidada aqui em 2026-11-13, junto com o comportamento já publicado.
-->

## Resumo

Um "canivete suíço" para o músico brasileiro em estudo: afinador,
metrônomo, acordes, escalas e campo harmônico num app só, em português.
Pensado para o **leigo**: o app mostra como a música é formada (notas,
graus, funções) em vez de supor que o usuário já sabe teoria. A
referência de tom e público é a de um famoso site brasileiro de cifras.
Também é projeto de portfólio, então é enxuto e as decisões técnicas são
documentadas.

## Princípios inegociáveis

- **Português (Brasil)** apenas, com termos e cifra do uso brasileiro
  (7M, 7+, º, ø; graus T, 3m, 5J…).
- **Android** apenas.
- **Funciona offline, sem conta e sem coleta de dados.** O microfone é
  usado só em tempo real, e nada é gravado nem enviado.
- **Fácil para o leigo**: o app nunca engana. Por exemplo, o Montar
  acorde só dá nome quando as notas formam um acorde de verdade.
- **Afinação padrão A 440 Hz**, a que o público usa.

## Público-alvo

- **Principal:** músicos brasileiros iniciantes e intermediários,
  sobretudo violão e guitarra.
- **Contexto de uso:** estudo em casa, muitas vezes tocando junto com uma
  música de outro app. Por isso o metrônomo continua em segundo plano e
  existe o tap tempo.

## Funcionalidades

### F1 — Afinador
- **O que faz:** capta o som pelo microfone e mostra a nota e o desvio em
  cents (baixo / afinado / alto).
- **Regras de negócio:** A 440 Hz fixo; tela sempre acesa enquanto o
  afinador escuta; depois de cerca de 1 s de silêncio, para de mostrar
  nota (respeitando o decaimento da corda); a agulha desliza com física de
  mola, sem pular nem tremer.
- **Critério de aceite:** as 6 cordas da afinação padrão são detectadas
  com erro de até 10 cents (testado com senoides sintéticas).

### F2 — Metrônomo
- **O que faz:** pulso de 40 a 220 BPM com acento no primeiro tempo.
- **Regras de negócio:**
  - compassos 1/4, 2/4, 3/4, 4/4 e 6/8;
  - subdivisões nos compassos simples: Semínima, Colcheia, Tercina e
    Semicolcheia. No 6/8 só existem Colcheia e Semicolcheia;
  - 1/4 não acentua, porque cada tempo seria acentuado;
  - **tap tempo**: tocar no círculo do BPM no ritmo da música define o
    BPM. Segurar abre a digitação do valor;
  - continua tocando em segundo plano e não tira o áudio de outros apps.
- **Critério de aceite:** o tempo não deriva; um 6/8 tem a duração de um
  2/4 em tercina no mesmo BPM; não há rajada de cliques ao voltar do
  segundo plano.

### F3 — Acordes
- **O que faz:** busca um acorde e mostra até 5 formas de tocar no braço
  (shapes CAGED nas qualidades comuns), com as notas e o grau de cada uma.
- **Regras de negócio:**
  - a busca aceita a grafia da cifra (C7M, C7+, Cmaj7, Db = C#…), e o
    acorde aparece com o nome digitado;
  - **"7+" = sétima maior** (uso brasileiro);
  - maiúsculas e minúsculas são ignoradas, exceto no "M";
  - trocar o tom mantém a qualidade.
- **Critério de aceite:** todo shape cadastrado, em toda tônica, tem
  exatamente as notas do acorde (testado).

### F4 — Montar acorde (dentro de Acordes)
- **O que faz:** o usuário marca notas no braço e o app mostra as notas,
  os graus e o nome do acorde formado, inclusive inversões ("C/E").
- **Regras de negócio:**
  - uma nota por corda;
  - pestana, corda solta e corda abafada;
  - até a casa 15;
  - a primeira nota marcada é a tônica;
  - só há nome quando as notas batem com uma fórmula do dicionário do
    app ou com o power chord.

  Ao concluir, o acorde vira o "Personalizado", seguido dos formatos do
  banco para o mesmo acorde. Regras completas em `UserFlow.md`.
- **Critério de aceite:** qualquer acorde do dicionário montado no braço
  recebe o mesmo nome que tem na busca (testado).

### F5 — Escalas
- **O que faz:** 16 escalas em qualquer tom, cada uma com 5 shapes no
  braço, as notas, os graus e um texto explicativo.
- **Critério de aceite:** todo shape, em toda tônica, tem exatamente as
  notas da escala (testado contra a `@tonaljs/tonal`).

### F6 — Campo Harmônico
- **O que faz:** círculo das quintas giratório, com uma janela fixa que
  mostra os 7 acordes do tom. O campo pode ser maior ou menor natural, com
  ou sem sétima, e cada acorde mostra o grau e a função harmônica.
- **Regras de negócio:**
  - o setor 6 é sempre Sol♭;
  - menor é sempre o menor natural;
  - os nomes de função seguem o sistema de funções (tônica, subdominante,
    dominante e relativas);
  - tocar num acorde abre a aba Acordes nele.

  Detalhes em `UserFlow.md` e `Decisions.md`.
- **Critério de aceite:** os 12 campos maiores e menores batem com a
  `@tonaljs/tonal` (testado).

### F7 — Modo canhoto
- **O que faz:** espelha os diagramas do braço em Acordes e Escalas. É a
  única preferência salva no aparelho.

### F8 — Sobre
- **O que faz:** um modal no botão "?" com um resumo de cada ferramenta,
  a versão e os links de contato e de privacidade.

## Fora do Escopo

| Não terá | Até quando | Motivo |
|---|---|---|
| Versão iOS | nunca | Projeto de portfólio enxuto; `ios/` removido (D-001) |
| Outros idiomas (i18n) | nunca | Público brasileiro (D-002) |
| Temas / modo escuro | nunca | Esquema fixo branco e laranja (D-003) |
| Outras afinações de referência (A 432…) | nunca | O público usa A 440 (D-002) |
| Conta, login, backend, anúncios, coleta de dados | nunca | Princípio do produto; política de privacidade publicada |
| Menor harmônica / melódica no Campo | nunca | Quebram o modelo da janela fixa (D-012) |
| Grafia alternativa Fá♯ no setor 6 | nunca | D-011 |
| Campo menor "híbrido" (V maior) | nunca | O acorde maior não cabe no anel dos menores (D-013) |
| "Editar acorde" no Montar acorde | nunca | Custo alto para pouco resultado: para mudar, monta outro (D-016) |
| Som do acorde montado | A DEFINIR | Ideia não priorizada (`Roadmap.md`) |

## Monetização e publicação

- **Modelo:** gratuito, sem anúncios e sem compras no app.
- **Lojas:** Google Play (`com.contestsoftware.puretuner`), versão 1.1
  publicada em 29/10/2026.
- **Privacidade:** não coleta dados. Política em
  `docs/privacy.html`, publicada em
  https://rangellira.github.io/PureTuner-App/privacy.html.
- **Código:** público em `github.com/RangelLira/PureTuner-App`.
