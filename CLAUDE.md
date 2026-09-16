# PureTunerApp — CLAUDE.md

## Visão Geral
App React Native de utilitários musicais para músicos brasileiros.
Stack: React Native 0.80.1 · React 19.1.0 · TypeScript 5.0.4
Idioma do produto: Português (Brasil) exclusivamente.
Plataforma: **Android exclusivamente** — projeto de portfólio enxuto, sem
versão iOS (pasta `ios/`, Gemfile e CocoaPods removidos do projeto), sem
temas e sem i18n.

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
│   └── MetronomeEngine.ts    # Motor do metrônomo (drift correction, re-ancoragem de fase)
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
| Metrônomo   | Funcional            | Círculos de beat, BPM editável, drift correction           |
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
