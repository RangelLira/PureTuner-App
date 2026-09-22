# PureTunerApp — CLAUDE.md

## Visão Geral
App React Native de utilitários musicais para músicos brasileiros.
Stack: React Native 0.80.1 · React 19.1.0 · TypeScript 5.0.4
Idioma do produto: Português (Brasil) exclusivamente.
Plataforma: **Android exclusivamente** — projeto de portfólio enxuto, sem
versão iOS (pasta `ios/`, Gemfile e CocoaPods removidos do projeto), sem
temas e sem i18n.

## Build de Release (APK)
`enableProguardInReleaseBuilds = true` em `android/app/build.gradle`
(minify + shrinkResources via R8) e `ndk.abiFilters` restrito a
`armeabi-v7a` + `arm64-v8a` (também refletido em
`reactNativeArchitectures` no `gradle.properties`) — as ABIs x86/x86_64
só existem em emulador, nunca em celular real, e não valem o peso extra
num APK universal. Isso cortou o `app-release.apk` de ~45MB para ~23MB
(build verificado localmente com `./gradlew assembleRelease`). Se
precisar testar num emulador x86_64, gere um build com
`reactNativeArchitectures` incluindo `x86_64` outra vez, ou use um
emulador/dispositivo arm64.

**Cuidado com `shrinkResources` e recursos carregados por nome via
string** (ex.: `react-native-sound` recebendo `'metro_accent.wav'` em
runtime) — o R8 só enxerga referências estáticas (`R.raw.x`), então
qualquer `res/raw/*` referenciado só por string é removido da build de
release silenciosamente (o app compila e roda normal, só o efeito some).
Isso já aconteceu com os sons do metrônomo: corrigido com
`android/app/src/main/res/raw/keep.xml` (`tools:keep`). Ao adicionar
qualquer recurso nativo carregado por string, adicionar no `keep.xml` —
e conferir com `unzip -l app-release.apk | grep raw/` se sumiu.

**Segunda pegadinha, separada da primeira**: mesmo com `keep.xml`
impedindo a remoção, o `shrinkResources` por padrão também RENOMEIA os
recursos que sobrevivem (ex.: `res/raw/metro_accent.wav` vira
`res/Ds.wav`) pra encolher a tabela `resources.arsc` — isso quebra
igualmente qualquer lookup por string em runtime, só que trocando
"removido" por "nome errado". Desligado via
`android.enableResourceOptimizations=false` no `gradle.properties`
(afeta só essa renomeação; a remoção de recursos de verdade não usados
continua funcionando normalmente). Sempre conferir com
`unzip -l app-release.apk | grep raw/` se o **nome** bate, não só se o
arquivo existe.

## Comandos Essenciais
```bash
npm run android     # roda no emulador/device Android
npm start           # Metro bundler
npm test            # Jest
npm run lint        # ESLint
```

## Arquitetura

```
src/
├── services/          # Pipeline de áudio (camada pura, sem React)
│   ├── RealAudioCapture.ts   # Captura PCM via react-native-audio-record
│   ├── AudioProcessor.ts     # Acumula amostras, silence gate, autocorrelação
│   ├── PitchDetector.ts      # Frequência → nota + cents offset
│   ├── MetronomeEngine.ts    # Motor do metrônomo (drift correction, re-ancoragem de fase)
│   └── TapTempo.ts           # Cálculo puro de BPM a partir de timestamps de toques
├── hooks/
│   ├── useTuner.ts           # Orquestra o pipeline, expõe estado à UI
│   └── useLeftHanded.ts      # Preferência de canhoto, persistida via AsyncStorage
├── components/
│   ├── TunerIndicator.tsx    # Medidor visual do afinador
│   └── ShapeFretboard.tsx    # Braço do violão em SVG — compartilhado por Escalas e Acordes
├── screens/
│   ├── TunerScreen.tsx       # Afinador (funcional)
│   ├── MetronomeScreen.tsx   # Metrônomo (funcional)
│   ├── ChordsScreen.tsx      # Acordes — busca + shapes CAGED (funcional)
│   ├── ScalesScreen.tsx      # Escalas — círculo de tom + 5 shapes por escala (funcional)
│   └── AboutScreen.tsx       # Modal "Sobre"
├── data/
│   ├── scaleShapesC.ts       # 16 escalas × 5 shapes, hardcoded em Dó, transpostos em runtime
│   ├── scaleDescriptions.ts  # Texto explicativo por escala
│   ├── chordShapesC.ts       # 5 shapes CAGED verificados (maior/menor/7/maj7/m7), em Dó
│   └── chordSuffixes.ts      # Símbolo, frase por extenso e descrição por sufixo de acorde
├── constants/
│   ├── colors.ts             # Design tokens de cor
│   └── tunings.ts            # Afinações, NOTE_FREQUENCIES, TUNER_CONFIG
└── types/
    └── index.ts              # Interfaces TypeScript compartilhadas
App.tsx                       # Tab bar + roteamento por estado + estado de Acordes/Escalas
```

## Pipeline de Áudio
```
react-native-audio-record (PCM base64)
  → RealAudioCapture.decodeBase64PCM() → Float32Array
  → AudioProcessor.processAudioBuffer()
      • acumula em buffer deslizante (50% overlap)
      • silence gate com histerese (0.0015 / 0.003 RMS)
      • downsample 4× → taxa efetiva 5512 Hz
      • autocorrelação + correção de oitava + refinamento parabólico
  → PitchDetector.detectNote()
      • mapeia frequência → nota + cents (1200 × log2 ratio)
  → useTuner (estado React)
  → TunerScreen / TunerIndicator
```

## Testes
`__tests__/` cobre a camada pura de serviços e dados com testes reais
(sem mocks de lógica, só dos módulos nativos indisponíveis no Jest):
- `services/AudioProcessor.test.ts` — precisão de detecção com ondas
  senoidais sintéticas nas 6 cordas da afinação padrão (tolerância de 10
  cents), silence gate com histerese, robustez do buffer acumulado.
- `services/PitchDetector.test.ts` — frequência → nota + cents.
- `services/MetronomeEngine.test.ts` — timing com fake timers do Jest
  (BPM, compasso, subdivisões, re-ancoragem de fase, saturação de BPM).
- `services/TapTempo.test.ts` — BPM a partir de sequência de timestamps
  (intervalos regulares/irregulares, saturação 40–220 BPM, mínimo de
  2 toques).

O teste "retomar depois de muito tempo em segundo plano" do
`MetronomeEngine` pegou um bug real de rajada de catch-up (ver seção
"Tela Metrônomo" abaixo) — vale ler o comentário do teste antes de mexer
em `scheduleNext()`: `jest.runAllTimers()`/`advanceTimersByTime(20min)`
não reproduzem esse bug (o motor nunca para de reagendar sozinho, então
ou nunca converge, ou o relógio avança em sincronia com os ticks e
mascara o atraso) — o teste força cada tick com `runOnlyPendingTimers()`
e inspeciona o `delay` de cada novo `setTimeout` agendado.
- `data/scaleShapesC.test.ts` / `data/chordShapesC.test.ts` — todo shape
  hardcoded, em toda tônica, comparado às classes de altura esperadas
  (via `@tonaljs/tonal` para escalas; intervalos musicais para acordes) —
  também garante que nenhuma transposição produz traste negativo.
- `hooks/useLeftHanded.test.tsx` — persistência via AsyncStorage.
- `jest.setup.js` mocka `react-native-sound`, `react-native-audio-record`
  e `react-native-keep-awake` (módulos nativos que não existem no Jest);
  `@react-native-async-storage/async-storage` usa o mock oficial da lib.

Os testes de `AudioProcessor` pegaram dois bugs reais de precisão que já
foram corrigidos: (1) `buffer` era uma *view* (`subarray`) sobre
`accumulatedBuffer`, e o slide de 50% (`copyWithin`) mutava essa mesma
memória *antes* de downsample/autocorrelação lerem — a segunda metade da
janela sobrescrevia a primeira, corrompendo a detecção; (2) a correção de
oitava só testava `bestPeriod / 2`, insuficiente quando a busca travava
num múltiplo maior do período real (comum em notas agudas) — generalizada
para testar `/2`, `/3` e `/4`.

## Estado Atual das Telas
| Tela        | Estado               | Notas                                                    |
|-------------|----------------------|-----------------------------------------------------------|
| Afinador    | Funcional            | Spring physics na agulha, keep-screen-on ativo enquanto ouve |
| Metrônomo   | Funcional            | Círculos de beat, tap tempo, drift correction, compassos 1/4-4/4 e 6/8 (ver seção abaixo) |
| Acordes     | Funcional            | Busca por prefixo + 5 shapes CAGED + modo canhoto (ver seção abaixo) |
| Escalas     | Funcional            | Círculo de tom + 16 escalas × 5 shapes + modo canhoto       |
| Sobre       | Funcional            | Botão "?" flutuante, modal em `AboutScreen.tsx`             |

## Telas Acordes e Escalas

Compartilham o mesmo padrão visual e o componente `ShapeFretboard` (braço
desenhado em SVG, cordas na horizontal, corda aguda no topo, corda grave
embaixo): círculo de tom → chip (azul, texto branco) → chips de notas →
texto descritivo de altura fixa (`height: 76`, `numberOfLines={4}` — não
deixar variar, senão o diagrama do braço "pula" de tela pra tela) →
diagrama → linha com indicador de posição (`n / total`) + chip
"Canhoto"/"Destro" → botões Anterior/Próxima.
O estado de ambas (tônica, qualidade/escala, shape) mora em `App.tsx`
(`chordsState`/`scalesState`), não dentro das próprias telas — elas são
desmontadas ao trocar de aba, então estado local voltaria pro padrão (Dó)
toda vez. É estado em memória, sem AsyncStorage: some sozinho ao fechar o
app de verdade ou reinstalar, o que é o comportamento pedido.

**Modo canhoto**: `ShapeFretboard` aceita uma prop `leftHanded` que
espelha o diagrama **horizontalmente** em torno do centro do canvas (helper
`mx(x) = leftHanded ? SVG_W - x : x`, aplicado a toda coordenada X do SVG —
trastes, cordas, pontos de nota, pestana, círculos de corda solta). A ordem
vertical das cordas não muda (aguda em cima, grave embaixo, igual ao modo
destro) — só o eixo dos trastes inverte: pestana/casa 1 à direita, tom
sobe da direita pra esquerda. O chip "Canhoto"/"Destro" (mesma linha do
indicador `n / total`) aparece nas duas telas e alterna a mesma preferência
global, gerenciada pelo hook `useLeftHanded` (`src/hooks/useLeftHanded.ts`)
e instanciada uma vez em `App.tsx`. Diferente do estado de tom/qualidade/
escala, essa preferência **é persistida** via
`@react-native-async-storage/async-storage` (chave
`@puretuner/leftHanded`) — sobrevive a fechar o app.

**Escalas**: shapes hardcoded em Dó (`scaleShapesC.ts`), transpostos
somando `tonicPC` a cada traste (`transposeShape`, local em
`ScalesScreen.tsx`).

**Acordes**: dicionário de posições vem de `@tombatossals/chords-db`
(`guitar.json`, ~44 sufixos × 12 tons). Para as 5 qualidades mais comuns
(`major`, `minor`, `7`, `maj7`, `m7`), `chordShapesC.ts` guarda os 5 shapes
reais do sistema CAGED (dedilhado do acorde aberto de Dó/Lá/Sol/Mi/Ré) já
expressos como se a tônica fosse Dó. `transposeChordShape` soma a tônica e
reduz cada shape *independentemente*, módulo 12, para cair sempre na
posição mais baixa/tocável — por isso tônicas Dó/Ré/Mi/Sol/Lá mostram o
próprio acorde aberto em 1/5, e as demais caem no shape mais convencional
(ex.: Fá → E-shape na 1ª casa, o barrado clássico). A ordem de exibição é
por traste mínimo ascendente, não pela ordem fixa C-A-G-E-D — o mais
comum/fácil vem sempre primeiro. Pestana é **calculada**, não anotada à
mão (menor traste compartilhado por 2+ cordas em `computeBarre`), pra não
depender de anotação manual sujeita a erro. Qualidades sem shapes CAGED
cadastrados caem no fallback com as posições cruas do dicionário.
A busca ("Buscar acorde") filtra por prefixo (`startsWith`, não
`includes` — evitar falso positivo tipo "Caug" ao digitar "G") numa lista
achatada de todo tom × qualidade. Trocar só o tom pelo círculo preserva a
qualidade atual (Dm → B vira Bm), com fallback pra `major` se a qualidade
não existir nesse tom.

## Tela Metrônomo

**Compassos**: `MetronomeEngine` só entende "tempos por compasso"
(`beatsPerMeasure`) e "cliques por tempo" (`subdivisions`) — não tem
noção de numerador/denominador. Por isso 1/4 é só `beatsPerMeasure = 1`
e 6/8 é só `beatsPerMeasure = 6`, sem mudar o engine. Um único chip (que
abre modal, igual ao de subdivisão) substitui os antigos chips soltos de
2/4-3/4-4/4 e lista as 5 opções: 1/4, 2/4, 3/4, 4/4, 6/8.

**1/4 tem som fraco**: como todo tempo em 1/4 é tecnicamente "tempo 1"
(`isDownbeat` sempre true), acentuar cada um soaria como um clique
contínuo sem sentido de compasso — por isso `MetronomeScreen` checa
`beats > 1` antes de tocar `accentPool`; em 1/4 toca sempre `clickPool`
(o pulso visual do círculo de BPM continua a cada tempo).

**6/8 é composto**: a unidade de tempo já é a colcheia, não a semínima —
por isso tem seu próprio conjunto de subdivisões (`COMPOUND_SUBDIVISIONS`
em `MetronomeScreen.tsx`): só Colcheia (1) e Semicolcheia (2), sem
Semínima nem Tercina. Mesmo mecanismo interno de contagem
(`subdivisions: 1 | 2`), só troca rótulo e opções oferecidas no modal.
Trocar de um compasso simples com subdivisão 3/4 (Tercina/Semicolcheia)
pra 6/8 reseta a subdivisão pra 1 (Colcheia), já que esses valores não
existem lá.

A **duração** de cada clique em 6/8, porém, não é igual à de 1/4-4/4:
`MetronomeEngine.compoundFactor` (setado via `eng.setCompound(beats ===
COMPOUND_BEATS)` em `startEngine()`) divide o intervalo por mais um fator
de 3 quando composto — pela equivalência clássica de "modulação métrica",
um compasso 6/8 em colcheia (6 cliques audíveis) dura o mesmo tempo total
que um 2/4 em tercina (2 tempos × 3), então a colcheia do 6/8 tem que
durar exatamente 1/3 da semínima de referência, não a semínima inteira.
Sem isso, `beatsPerMeasure=6` com `subdivisions=1` faria cada uma das 6
bolinhas durar um tempo cheio (`60000/bpm`) — um 6/8 3× mais lento do que
deveria no mesmo BPM. Testado em `MetronomeEngine.test.ts`.

**O metrônomo não pausa em segundo plano** (uso pretendido: estudar com
um áudio externo tocando junto — é pra isso que o tap tempo existe, ver
abaixo). Dois problemas vinham disso, os dois corrigidos:

- *Rajada de "catch-up" ao voltar do segundo plano*: `MetronomeEngine.
  scheduleNext()` agenda o próximo tique por tempo absoluto
  (`phaseStartTime + ticksIntoPhase * tickIntervalMs`). Se o Android
  suspende a JS thread por tempo suficiente (Doze/App Standby, ex.: uns
  20min com a tela apagada), o único `setTimeout` pendente só dispara
  quando o app volta — mas `expectedTime` continua calculado a partir da
  fase antiga, agora muito no passado, então cada novo `scheduleNext()`
  reagenda com `delay: 0` tentando "alcançar" o tempo real: uma rajada de
  milhares de tiques em sequência (a "metralhadora", tocando som se
  reprodução estiver funcionando — ver fix do `shrinkResources` acima).
  `scheduleNext()` agora re-ancora a fase pro tique atual (mesmo
  mecanismo que já existia pra troca de BPM em `setBpm()`) sempre que o
  atraso passa de `tickIntervalMs * 2`, em vez de tentar recuperar os
  tiques perdidos.
- *Foco de áudio exclusivo*: `Sound.setCategory('Playback')` sem o 2º
  parâmetro usa `mixWithOthers = false` — o `react-native-sound` (Android)
  então pede `AUDIOFOCUS_GAIN` a cada `play()`, o que tende a pausar/
  abaixar outros apps tocando áudio, e também pausa o próprio som do
  metrônomo quando outro app pede foco de volta (`Sound.kt`,
  `onAudioFocusChange`). Corrigido com
  `Sound.setCategory('Playback', true)`.

**Tap tempo**: tocar o círculo de BPM registra um timestamp; segurar
(`onLongPress`, 500ms) abre o modal de digitar BPM manualmente — antes
era o toque simples que abria esse modal. O cálculo do BPM a partir dos
timestamps é uma função pura testada isoladamente
(`computeTapTempoBpm` em `src/services/TapTempo.ts`): média dos
intervalos entre os últimos 8 toques, precisa de 2+ toques, satura em
40–220 BPM (mesmo range do `MetronomeEngine`). A sequência de toques
reseta se passar 2s sem novo toque (`TAP_TEMPO_IDLE_RESET_MS`) — implementado
como `useRef` em `MetronomeScreen` (não é estado React: atualiza a cada
toque sem re-render).

## Design System
- **Cores** em `src/constants/colors.ts` — Primary: `#FF6B35` (laranja)
- Esquema fixo, sem dark/light mode
- Background: branco com acentos em laranja
- Fontes nativas do sistema via React Native

## Dependências Nativas
- `react-native-audio-record ^0.2.2` — requer linking (auto-link no RN 0.80).
  Permissão RECORD_AUDIO adicionada automaticamente via merge do manifest da
  própria lib; solicitada em runtime por `RealAudioCapture.requestPermission()`
- `react-native-keep-awake ^4.0.0` — mantém a tela acesa enquanto o afinador
  está ouvindo (`useTuner.ts`, `KeepAwake.activate()`/`deactivate()`)
- `@react-native-async-storage/async-storage` — auto-link no RN 0.80. Única
  dependência de persistência em disco do projeto, usada só pela preferência
  de canhoto (`useLeftHanded.ts`)

## Requisitos Pendentes (PRODUCT.md)
Todos os itens da lista original de `PRODUCT.md` ("Problemas para corrigir")
foram implementados: spring physics na agulha, keep-screen-on, botão
"Sobre", e os quatro ajustes visuais (título do Afinador, altura da barra
inferior, posição dos botões da barra, títulos das telas). Nenhum item
pendente no momento.

## Convenções do Projeto
- Nenhum Redux / Context API — React hooks locais são suficientes
- Nomes de variáveis e comentários em português ou inglês (misturado, aceito)
- Sem temas dinâmicos — cores hardcoded via constante
- Sem i18n formal — strings em PT-BR diretamente nos componentes
