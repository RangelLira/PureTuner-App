# TechSpec — Pure Tuner

<!--
COMO o app é construído. Versões exatas: package.json é a fonte.
-->

## Stack

| Camada | Escolha | Observação |
|---|---|---|
| Framework | React Native CLI 0.80 (não Expo) | Legacy Architecture (aviso só em debug) |
| Linguagem | TypeScript | |
| Estado | `useState` / `useRef` locais; estado das abas em `App.tsx` | sem Redux/Context (D-004) |
| Navegação | manual por estado (barra inferior própria em `App.tsx`) | sem react-navigation |
| Persistência | AsyncStorage, só para a preferência de canhoto | DataModel não se aplica |
| i18n | nenhum, strings PT-BR nos componentes | D-002 |
| Teoria musical | `@tonaljs/tonal` (fórmulas, testes), `@tombatossals/chords-db` (posições de acordes) | |
| Desenho | `react-native-svg` (braços, círculos, ícones das abas) | |
| Testes | Jest | |

**Não usar:** Redux/Context (D-004); `Chord.detect` para nomear o acorde
montado (D-017); `adjustsFontSizeToFit` dentro de `Animated.View`
contra-rotacionado (não funciona: usar `fontSizeFor`).

**Convenções:** nomes de variáveis e funções em inglês; comentários em
português ou inglês (código antigo mistura os dois, o que é aceito).

## Arquitetura

```
src/
├── services/          # camada pura, sem React
│   ├── RealAudioCapture.ts   # captura PCM via react-native-audio-record
│   ├── AudioProcessor.ts     # buffer, silence gate, autocorrelação
│   ├── PitchDetector.ts      # frequência → nota + cents
│   ├── MetronomeEngine.ts    # motor do metrônomo (drift, re-ancoragem de fase)
│   └── TapTempo.ts           # BPM a partir de timestamps
├── hooks/
│   ├── useTuner.ts           # orquestra o pipeline de áudio
│   └── useLeftHanded.ts      # preferência de canhoto (AsyncStorage)
├── components/
│   ├── TunerIndicator.tsx    # medidor do afinador (spring physics)
│   ├── ShapeFretboard.tsx    # braço em SVG — Acordes e Escalas
│   ├── BuilderFretboard.tsx  # braço interativo do Montar acorde
│   ├── NoteChips.tsx         # chips de notas com o grau acima
│   ├── FifthsWheel.tsx       # círculo das quintas (SVG + PanResponder)
│   └── TabIcon.tsx           # ícones SVG da barra inferior
├── screens/                  # Tuner, Metronome, Chords, Scales, HarmonicField, About
├── data/                     # modelos puros, testados
│   ├── scaleShapesC.ts       # 16 escalas × 5 shapes em Dó
│   ├── scaleDescriptions.ts  # texto por escala
│   ├── chordShapesC.ts       # 5 shapes CAGED em Dó (maior/menor/7/maj7/m7)
│   ├── chordSuffixes.ts      # símbolo, frase, descrição e aliases de cifra
│   ├── chordAnalysis.ts      # graus (notação brasileira) e nome de um conjunto de notas
│   ├── chordBuilder.ts       # estado puro do braço do Montar acorde
│   └── harmonicField.ts      # janela, campo, grafia e armadura do círculo
├── constants/                # colors.ts, tunings.ts (NOTE_FREQUENCIES, TUNER_CONFIG)
└── types/index.ts
App.tsx                       # barra de abas + roteamento + estado de Acordes/Escalas/Campo
scripts/icon/                 # gerador do ícone (Python + Pillow) — ver Build
```

### Pipeline de áudio (Afinador)

```
react-native-audio-record (PCM base64)
  → RealAudioCapture.decodeBase64PCM() → Float32Array
  → AudioProcessor.processAudioBuffer()
      • buffer deslizante (50% overlap)
      • silence gate com histerese (0.0015 / 0.003 RMS)
      • downsample 4× → 5512 Hz efetivos
      • autocorrelação + correção de oitava (/2, /3, /4) + refinamento parabólico
  → PitchDetector.detectNote()  (cents = 1200 × log2 ratio)
  → useTuner (EMA em cents entre frames) → TunerScreen / TunerIndicator
```

### Metrônomo

- `scheduleNext()` agenda por tempo absoluto
  (`phaseStartTime + ticksIntoPhase * tickIntervalMs`). Se o atraso passa
  de `2 × tickIntervalMs`, re-ancora a fase no tique atual (o mesmo
  mecanismo do `setBpm()`).
- `compoundFactor` (via `setCompound()` em `startEngine()`) divide o
  intervalo por 3 no 6/8 (D-009).
- O som usa `react-native-sound` com pool de 2 instâncias por som. O
  `MetronomeScreen` só toca `accentPool` quando `beats > 1`.
- Tap tempo: `computeTapTempoBpm` (puro), com a sequência guardada em
  `useRef` (sem re-render); `TAP_TEMPO_IDLE_RESET_MS` = 2 s.

### Acordes e Escalas

- **Escalas:** os shapes de `scaleShapesC.ts` são transpostos somando
  `tonicPC` a cada traste (`transposeShape`).
- **Acordes:** `transposeChordShape` soma a tônica e reduz cada shape
  independentemente, módulo 12, para a posição mais baixa. A pestana sai
  de `computeBarre` (menor traste compartilhado por 2+ cordas). Sem shapes
  CAGED, o fallback usa as posições cruas do `chords-db`.
- **Busca:** filtro por prefixo (`startsWith`, para evitar que "G" ache
  "Caug") numa lista achatada de tom × qualidade × grafia
  (`chordSearchKeys`, `CHORD_SUFFIX_ALIASES`). A ordem é a grafia exata
  primeiro, depois as mais curtas. `ChordsState.typedName` guarda a
  grafia digitada.
- **Graus:** os intervalos vêm da fórmula. Em Escalas,
  `Scale.get().intervals`; em Acordes, `suffixIntervals()`. Há 4 sufixos à
  mão em `MANUAL_INTERVALS`. Nota fora da fórmula cai no grau neutro por
  semitom.
- **Canhoto:** `ShapeFretboard` aplica `mx(x) = leftHanded ? SVG_W - x : x`
  a toda coordenada X.
- **Montar acorde:**
  - as regras ficam em `chordBuilder.ts`, o nome vem de `analyzeChord`;
  - o estado fica em `ChordsState`: `draft` (montagem em andamento),
    `custom` (acorde concluído), `customActive` e `customEntryIdx`;
  - `fittingWindowStart` enquadra todas as notas, e `transposeBuilder`
    move tudo o mesmo número de casas, preferindo a versão mais grave que
    caiba até a casa 15;
  - **gestos:** o toque é lido na `View` de fora do SVG
    (`pointerEvents="none"` no SVG), senão `locationX` vem relativo ao
    elemento tocado. No canhoto, o X é desespelhado antes do hit test.

### Campo Harmônico

- Camadas, de baixo para cima: setores (giram), destaque laranja (fixo no
  centro da janela), rótulos (giram e são contra-rotacionados) e máscara
  da janela (fixa). Durante o arraste (`dragging`), nenhum rótulo fica
  branco.
- O ângulo é acumulado, não reduzido a 0–360, para o disco não dar a
  volta inteira ao passar de Fá para Dó.
- Tétrades fixas por célula (`OUTER_SEVENTHS` + `m7` + `m7b5`), testadas
  contra `Key.majorKey().chords` / `Key.minorKey().natural.chords`.
- Cada acorde tem `func` (T/SD/D) e `primary`; o papel do grau vem de
  `DEGREE_ROLE` e a cor do chip de `chipColor`.

## Autenticação e segurança

- **Método:** não se aplica (sem login nem backend).
- **Permissões:** `RECORD_AUDIO`, que entra pelo manifest da
  `react-native-audio-record` e é pedida em runtime por
  `RealAudioCapture.requestPermission()` ao iniciar o afinador.
- **Segredos:** keystore e `keystore.properties` ficam fora do git.

## Módulos nativos e integrações

- `react-native-audio-record`: captura PCM (auto-link).
- `react-native-sound`: cliques do metrônomo, que são `res/raw/*.wav`
  carregados **por nome** (ver Armadilhas).
- `react-native-keep-awake`: mantém a tela acesa enquanto o afinador
  escuta (`useTuner.ts`).
- `@react-native-async-storage/async-storage`: única persistência
  (`@puretuner/leftHanded`).

## Testes

- **Rodar:** `npm test` (e `npm run lint`, `npx tsc --noEmit`).
- **O que é coberto:** a camada pura de `services/` e `data/`, com testes
  reais, sem mock de lógica:
  - `AudioProcessor`: senoides nas 6 cordas, tolerância de 10 cents,
    histerese;
  - `PitchDetector`;
  - `MetronomeEngine`: fake timers, compassos, re-ancoragem, 6/8;
  - `TapTempo`;
  - todo shape de escala e acorde em toda tônica;
  - `harmonicField` contra a tonal;
  - aliases da busca sem colisão;
  - `chordAnalysis`;
  - `chordBuilder`;
  - `useLeftHanded`.
- **Mocks:** o `jest.setup.js` mocka `react-native-sound`,
  `react-native-audio-record` e `react-native-keep-awake`. O AsyncStorage
  usa o mock oficial.
- **Antes de mexer em `scheduleNext()`**, leia o comentário do teste
  "retomar depois de muito tempo em segundo plano".
  `runAllTimers()`/`advanceTimersByTime()` não reproduzem a rajada de
  catch-up. O teste força cada tique com `runOnlyPendingTimers()` e
  inspeciona o `delay` de cada novo `setTimeout`.

## Build e release

- **Debug:** `npm run android` (ou `cd android && ./gradlew installDebug`
  com o Metro rodando).
- **Release:** `cd android && ./gradlew assembleRelease`. Assinatura via
  `android/keystore.properties` + keystore, ambos fora do git e que **não
  devem ser lidos nem movidos**.
- **Tamanho:** R8 (`enableProguardInReleaseBuilds`) e `ndk.abiFilters` /
  `reactNativeArchitectures` só ARM (D-006), cerca de 23 MB.
- **Versionamento:** incrementar `versionCode` a cada envio à loja. Ao
  mudar a versão, registrar no `Changelog.md` e atualizar a versão escrita
  no `AboutScreen.tsx`.
- **Ícone:** `python scripts/icon/build.py` (requer Pillow) gera:
  - o adaptive icon (`mipmap-anydpi-v26/`, `drawable/ic_launcher_foreground.xml`,
    `ic_launcher_monochrome.xml`, `values/ic_launcher_background.xml`);
  - os PNGs legados `mipmap-*/ic_launcher{,_round}.png` (API 24–25);
  - `logo/icone-512.png` e `logo/icone.svg`.

  **Não editar esses arquivos à mão:** mude os parâmetros `C` em
  `build.py`. Para comparar variantes, use `python scripts/icon/gen.py`
  (gera `comparativo.png`, ignorado no git).
- **Site / política de privacidade:** `docs/` via GitHub Pages
  (repositório público).

## Armadilhas

| Sintoma | Causa | Solução |
|---|---|---|
| Metrônomo mudo só na release | `shrinkResources` remove `res/raw/*` referenciado só por string | `res/raw/keep.xml` (`tools:keep`). Todo recurso carregado por nome entra lá |
| Metrônomo mudo de novo, com o `keep.xml` presente | o R8 **renomeia** os recursos que sobrevivem (`metro_accent.wav` → `Ds.wav`) | `android.enableResourceOptimizations=false`. Conferir com `unzip -l app-release.apk \| grep raw/` se o **nome** bate |
| Rajada de milhares de cliques ao voltar do segundo plano | `expectedTime` calculado a partir de uma fase muito antiga dá `delay: 0` em sequência | re-ancorar a fase quando o atraso passa de `2 × tickIntervalMs` |
| Metrônomo pausa ou abaixa o áudio de outros apps | `Sound.setCategory('Playback')` pede `AUDIOFOCUS_GAIN` exclusivo | `Sound.setCategory('Playback', true)` |
| 6/8 três vezes mais lento | cada colcheia durava uma semínima inteira | `compoundFactor` = 3 |
| Detecção corrompida | `buffer` era `subarray` de `accumulatedBuffer`, e o `copyWithin` do slide mutava a memória antes da leitura | deslizar só depois de downsample e autocorrelação lerem a janela (comentário em `AudioProcessor.ts`) |
| Nota aguda na oitava errada | a correção só testava `bestPeriod / 2` | testar `/2`, `/3` e `/4` |
| Toque no braço cai na casa errada | `locationX` relativo ao elemento SVG tocado | ler o toque na `View` externa, com o SVG em `pointerEvents="none"` |
| Rótulo do círculo não encolhe | `adjustsFontSizeToFit` não funciona em `Animated.View` contra-rotacionado | `fontSizeFor` pelo tamanho do nome |
| Diagrama do braço "pula" entre telas | texto descritivo de altura variável | altura fixa (`height: 76`, `numberOfLines={4}`) |
