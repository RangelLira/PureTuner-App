# PureTunerApp — CLAUDE.md

## Visão Geral
App React Native de utilitários musicais para músicos brasileiros.
Stack: React Native 0.80.1 · React 19.1.0 · TypeScript 5.0.4
Idioma do produto: Português (Brasil) exclusivamente.

## Comandos Essenciais
```bash
npm run android     # roda no emulador/device Android
npm run ios         # roda no simulador iOS
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
│   └── useTuner.ts           # Orquestra o pipeline, expõe estado à UI
├── components/
│   ├── TunerIndicator.tsx    # Medidor visual do afinador
│   └── ShapeFretboard.tsx    # Braço do violão em SVG — compartilhado por Escalas e Acordes
├── screens/
│   ├── TunerScreen.tsx       # Afinador (funcional)
│   ├── MetronomeScreen.tsx   # Metrônomo (funcional)
│   ├── ChordsScreen.tsx      # Acordes — busca + shapes CAGED (funcional)
│   ├── ScalesScreen.tsx      # Escalas — círculo de tom + 5 shapes por escala (funcional)
│   ├── AboutScreen.tsx       # Modal "Sobre"
│   └── ComingSoonScreens.tsx # Legado, não roteado no App.tsx atual
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

## Estado Atual das Telas
| Tela        | Estado               | Notas                                                    |
|-------------|----------------------|-----------------------------------------------------------|
| Afinador    | Funcional            | Falta spring physics, keep-screen-on                      |
| Metrônomo   | Funcional            | Círculos de beat, BPM editável, drift correction           |
| Acordes     | Funcional            | Busca por prefixo + 5 shapes CAGED (ver seção abaixo)      |
| Escalas     | Funcional            | Círculo de tom + 16 escalas × 5 shapes                     |
| Sobre       | Funcional            | Botão "?" flutuante, modal em `AboutScreen.tsx`             |

## Telas Acordes e Escalas

Compartilham o mesmo padrão visual e o componente `ShapeFretboard` (braço
desenhado em SVG, cordas na horizontal, corda aguda no topo, corda grave
embaixo): círculo de tom → chip (azul, texto branco) → chips de notas →
texto descritivo de altura fixa (`height: 76`, `numberOfLines={4}` — não
deixar variar, senão o diagrama do braço "pula" de tela pra tela) →
diagrama → indicador de posição (`n / total`) → botões Anterior/Próxima.
O estado de ambas (tônica, qualidade/escala, shape) mora em `App.tsx`
(`chordsState`/`scalesState`), não dentro das próprias telas — elas são
desmontadas ao trocar de aba, então estado local voltaria pro padrão (Dó)
toda vez. É estado em memória, sem AsyncStorage: some sozinho ao fechar o
app de verdade ou reinstalar, o que é o comportamento pedido.

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
- `react-native-audio-record ^0.2.2` — requer linking (auto-link no RN 0.80)
  - Android: adiciona permissão RECORD_AUDIO via código em RealAudioCapture.ts
  - iOS: Info.plist NSMicrophoneUsageDescription necessário

## Requisitos Pendentes (PRODUCT.md)
1. **Spring physics** na agulha do afinador (interpolação com easing)
2. **Keep-screen-on** enquanto o afinador estiver ativo
3. **Botão "Sobre"** — redondo com "?", visível em todas as telas
4. Ajuste visual: título "Afinador" mais abaixo
5. Ajuste visual: barra inferior quase o dobro mais alta
6. Ajuste visual: botões da barra inferior mais acima
7. Títulos corretos nas telas "em desenvolvimento"

## Convenções do Projeto
- Nenhum Redux / Context API — React hooks locais são suficientes
- Nomes de variáveis e comentários em português ou inglês (misturado, aceito)
- Sem temas dinâmicos — cores hardcoded via constante
- Sem i18n formal — strings em PT-BR diretamente nos componentes
