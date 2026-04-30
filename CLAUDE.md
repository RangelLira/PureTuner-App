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
│   └── PitchDetector.ts      # Frequência → nota + cents offset
├── hooks/
│   └── useTuner.ts           # Orquestra o pipeline, expõe estado à UI
├── components/
│   └── TunerIndicator.tsx    # Medidor visual do afinador
├── screens/
│   ├── TunerScreen.tsx       # Tela principal (funcional)
│   └── ComingSoonScreens.tsx # Placeholder das 3 telas em desenvolvimento
├── constants/
│   ├── colors.ts             # Design tokens de cor
│   └── tunings.ts            # Afinações, NOTE_FREQUENCIES, TUNER_CONFIG
└── types/
    └── index.ts              # Interfaces TypeScript compartilhadas
App.tsx                       # Tab bar customizada + roteamento por estado
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
| Tela        | Estado               | Notas                                     |
|-------------|----------------------|-------------------------------------------|
| Afinador    | Funcional            | Falta spring physics, keep-screen-on      |
| Metrônomo   | Coming soon          | Nenhum código de lógica ainda             |
| Acordes     | Coming soon          | Nenhum código de lógica ainda             |
| Escalas     | Coming soon          | Nenhum código de lógica ainda             |
| Sobre       | Não implementado     | Botão "?" no topo-esquerdo, requisito     |

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
