# Decisions — Pure Tuner

<!--
Registro de decisões (ADR leve). Serve para ninguém, nem o Rangel nem o
agente, reabrir discussão já resolvida sem motivo novo.
Nunca apague uma decisão: se mudar, marque como Revertida/Substituída e
crie uma nova apontando para ela.
Status: ✅ Vigente · ↩️ Revertida · 🔁 Substituída por D-xxx

D-001 a D-018 foram registradas retroativamente em 2026-11-13, a partir do
CLAUDE.md, do Roadmap e do histórico do git. A data é a do commit em que a
decisão entrou.
-->

## D-001 — Android exclusivamente

- **Data:** 2026-09-16
- **Status:** ✅ Vigente
- **Decisão:** o app é só para Android. A pasta `ios/`, o Gemfile e o
  CocoaPods foram removidos.
- **Alternativas consideradas:** manter o iOS no código, sem publicar.
- **Motivo:** projeto de portfólio enxuto. Código iOS sem uso só gera
  manutenção.
- **Consequências:** nenhuma dependência é avaliada pelo lado iOS.

## D-002 — Português (Brasil) e A 440 Hz fixos

- **Data:** 2026-04-28 (especificação inicial)
- **Status:** ✅ Vigente
- **Decisão:** produto só em PT-BR, com strings direto nos componentes e
  sem i18n. Afinação de referência fixa em A 440 Hz.
- **Alternativas consideradas:** i18n; referência ajustável (A 432…).
- **Motivo:** foco no público local, que usa A 440.
- **Consequências:** nada de camada de tradução nem de configuração de
  afinação.

## D-003 — Esquema de cores fixo

- **Data:** 2026-04-28 (especificação inicial)
- **Status:** ✅ Vigente
- **Decisão:** branco com acentos em laranja, sem modo escuro nem temas.
  Cores só via `src/constants/colors.ts`.
- **Motivo:** simplicidade e identidade visual.

## D-004 — Estado com hooks locais; estado das abas em memória no App

- **Data:** 2026-07-09
- **Status:** ✅ Vigente
- **Decisão:** sem Redux nem Context. O estado de Acordes, Escalas e
  Campo (tom, qualidade, shape, montagem) mora em `App.tsx` e não é
  persistido.
- **Alternativas consideradas:** estado dentro de cada tela, que voltava
  para Dó a cada troca de aba porque a tela é desmontada; AsyncStorage.
- **Motivo:** o estado sobrevive à troca de aba e some ao fechar o app,
  que é o comportamento pedido.

## D-005 — Modo canhoto persistido

- **Data:** 2026-09-16
- **Status:** ✅ Vigente
- **Decisão:** a preferência canhoto/destro é a única coisa salva no
  aparelho (AsyncStorage, chave `@puretuner/leftHanded`). O espelhamento
  é horizontal: as cordas mantêm a ordem vertical e a casa 1 fica à
  direita.
- **Motivo:** é preferência da pessoa, não do momento de estudo.

## D-006 — APK de release enxuto (R8 + só ABIs ARM)

- **Data:** 2026-09-17
- **Status:** ✅ Vigente
- **Decisão:** `minifyEnabled` + `shrinkResources` (R8) e ABIs só
  `armeabi-v7a` e `arm64-v8a`.
- **Alternativas consideradas:** APK universal com x86/x86_64.
- **Motivo:** de ~45 MB para ~23 MB. As ABIs x86 só existem em emulador.
- **Consequências:** recursos carregados por nome precisam de `keep.xml`,
  e a renomeação de recursos ficou desligada (ver TechSpec › Armadilhas).
  Para testar em emulador x86_64, é preciso incluir a ABI de novo.

## D-007 — O metrônomo não pausa em segundo plano

- **Data:** 2026-09-22
- **Status:** ✅ Vigente
- **Decisão:** o metrônomo continua tocando com o app em segundo plano e
  mistura o áudio com outros apps (`Sound.setCategory('Playback', true)`).
- **Motivo:** o uso pretendido é estudar com uma música tocando em outro
  app.
- **Consequências:** o motor re-ancora a fase quando a JS thread volta de
  uma suspensão, sem tentar recuperar os tiques perdidos.

## D-008 — Tap tempo no toque; digitar BPM no toque longo

- **Data:** 2026-09-22
- **Status:** ✅ Vigente
- **Decisão:** tocar no círculo do BPM registra o tap tempo (média dos
  últimos 8 toques, zera depois de 2 s parado). Segurar abre o modal de
  digitar. Antes, o toque simples abria o modal.

## D-009 — Compassos sem numerador/denominador no motor

- **Data:** 2026-09-22
- **Status:** ✅ Vigente
- **Decisão:** o `MetronomeEngine` só conhece "tempos por compasso" e
  "cliques por tempo". 1/4 = 1 tempo e 6/8 = 6 tempos, com um fator de 3
  no intervalo quando o compasso é composto. O 1/4 não acentua. O 6/8 só
  oferece Colcheia e Semicolcheia.
- **Motivo:** cobre os 5 compassos sem reescrever o motor. Pela
  modulação métrica, um 6/8 dura o mesmo que um 2/4 em tercina.

## D-010 — Acordes: shapes CAGED em Dó, pestana calculada

- **Data:** 2026-07-09
- **Status:** ✅ Vigente
- **Decisão:** nas 5 qualidades comuns (maior, menor, 7, maj7, m7), os 5
  shapes CAGED ficam guardados em Dó e são transpostos cada um para a
  posição mais baixa tocável. A ordem de exibição é pelo traste mínimo.
  A pestana é calculada, não anotada. As demais qualidades usam o
  `@tombatossals/chords-db`.
- **Motivo:** o mais fácil vem primeiro, e anotação manual é sujeita a
  erro.

## D-011 — Setor 6 do círculo é sempre Sol♭

- **Data:** 2026-10-29
- **Status:** ✅ Vigente
- **Decisão:** a base do círculo é Sol♭ maior / Mi♭ menor, nunca Fá♯
  maior. Não há opção de alternar a grafia. Dentro da janela de outro
  tom, a grafia segue o tom.
- **Motivo:** em Fá♯ maior, o 7º grau seria Mi♯ e a relativa seria Ré♯m.

## D-012 — Campo menor = menor natural

- **Data:** 2026-10-29
- **Status:** ✅ Vigente
- **Decisão:** o campo menor usa a mesma janela da relativa maior, mudando
  só o centro e os graus.
- **Alternativas consideradas:** menor harmônica e menor melódica.
- **Motivo:** elas quebram o modelo da janela fixa.

## D-013 — Nomes de função no Campo Harmônico

- **Data:** 2026-11-06
- **Status:** ✅ Vigente
- **Decisão:** abaixo de cada acorde vai só o nome da **função**, com os
  secundários sendo as relativas dos principais.
  - Maior: Tônica, Subdominante relativa (ii), Dominante relativa (iii),
    Subdominante, Dominante, Relativa menor (vi), Dominante fraca (viiº).
  - Menor: Tônica, Subdominante fraca (iiº), Relativa maior (III),
    Subdominante, **Dominante menor** (v), Subdominante relativa (VI),
    Dominante relativa (VII).
- **Alternativas consideradas:**
  - nomes de grau (Mediante, Subtônica), rejeitados porque misturariam
    os dois sistemas;
  - campo menor "híbrido" com V maior, rejeitado porque o acorde maior
    não cabe no anel dos menores, e o disco e a lista precisam mostrar o
    mesmo;
  - só "Dominante" no v, rejeitado porque sem a sensível ele não tem a
    força da dominante.

## D-014 — Chips do Campo com só duas cores

- **Data:** 2026-10-29
- **Status:** ✅ Vigente
- **Decisão:** a tônica (I/i) é laranja e todos os demais acordes são
  azul-escuro, sempre com texto branco. Não há legenda.
- **Alternativas consideradas:** um tom suave por função, rejeitado por
  ser colorido demais.

## D-015 — Busca de acordes pela grafia da cifra

- **Data:** 2026-10-30
- **Status:** ✅ Vigente
- **Decisão:**
  - cada acorde é buscável pelo símbolo do app e pelas grafias de cifra
    (7M, 7+, º, ø, 5-, bemóis);
  - o app mostra a **grafia digitada**, com "mesmo acorde que…" embaixo;
  - cada grafia que casa ocupa uma linha própria;
  - **"7+" = sétima maior** (uso brasileiro), não 7(#5);
  - a caixa é ignorada, exceto no "M";
  - um alias que colidiria com outro acorde do mesmo tom fica de fora.
- **Motivo:** o leigo copia o nome da cifra e não sabe que C7+ e Cmaj7 são
  o mesmo acorde.

## D-016 — Montar acorde: fluxo e escopo

- **Data:** 2026-10-30
- **Status:** ✅ Vigente
- **Decisão:**
  - o botão sempre começa uma montagem nova;
  - **Voltar** (braço vazio) ou **Limpar** (com notas), e **Concluir**,
    que fica travado até as notas formarem um acorde com nome;
  - ao concluir, o acorde vira o "Personalizado", seguido dos até 5
    formatos do banco. Inversão só tem formatos se o banco tiver a tríade
    com esse baixo;
  - o personalizado sobrevive à troca de aba, some ao buscar ou concluir
    outro acorde, e trocar o tom o transpõe;
  - a tônica é a primeira nota marcada. Ao sair, passa para a mais
    antiga, e o toque longo escolhe outra;
  - corda sem marcação é abafada. O navegador de casas usa arraste
    horizontal até a casa 15.
- **Alternativas consideradas:** "Editar acorde", rejeitado (custo alto
  para pouco resultado); bloquear notas mais graves que a tônica, trocado
  por aceitar e nomear como inversão.

## D-017 — Montar acorde só dá nome a acorde que faz sentido

- **Data:** 2026-10-30
- **Status:** ✅ Vigente
- **Decisão:** o nome compara as notas, relativas à tônica escolhida, só
  com as fórmulas do dicionário do app (mesma grafia da busca) e com o
  power chord. Com 3 notas ou mais (exceto o power chord); baixo
  diferente da tônica vira "/baixo".
- **Alternativas consideradas:** `Chord.detect` da tonal, que escolhe a
  tônica sozinho e aceita tipos exóticos (m#5).
- **Motivo:** sem isso, o leigo acha que qualquer cacho de notas é um
  acorde.

## D-018 — Ícone gerado por script, como adaptive icon

- **Data:** 2026-11-13
- **Status:** ✅ Vigente
- **Decisão:** o ícone (diapasão em P) é gerado por `scripts/icon/` a
  partir de uma geometria paramétrica, como adaptive icon com versão
  monocromática, mais PNGs legados. Ocupa 58% da altura e é centralizado
  pelo centro óptico.
- **Alternativas consideradas:** só regenerar os PNGs.
- **Motivo:** o launcher aplica a própria máscara sem cortar. Antes só
  existiam PNGs, o que dificultava qualquer ajuste.

## D-019 — Pastas de identidade, loja e arquivo

- **Data:** 2026-11-13
- **Status:** ✅ Vigente
- **Decisão:** é o padrão da Contest Software (`Meus Projetos/CLAUDE.md`):
  - `logo/` guarda a identidade (ícone SVG e PNG 512);
  - `store/` guarda o material da Play Store (feature graphic e
    `screenshots/NN-tela.ext`);
  - `documentation/archive/` guarda os documentos superados.
- **Motivo:** imagens e documentos velhos estavam soltos na raiz.
