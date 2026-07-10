# ⚠️ ALERTA — Incompatibilidade de react-native-reanimated

**Detectado em:** 2026-05-19 (durante análise do projeto PureSoundCheck-App)

## Problema

Este projeto usa:
- `react-native`: **0.80.1**
- `react-native-reanimated`: **^3.19.5**

A versão 3.x do `react-native-reanimated` **não é compatível com React Native 0.80+**.  
A build Android irá falhar com erros de compilação Java relacionados a APIs da Old Architecture que foram removidas do React Native (ex: `UIManagerModuleListener`, `LayoutAnimationController`).

## Solução necessária antes de buildar

Migrar para `react-native-reanimated` **4.2.x** (a versão que suporta RN 0.80):

```bash
npm install react-native-reanimated@^4.2.0 react-native-worklets@^0.7.0
```

Atualizar `babel.config.js` — trocar o plugin:
```js
// De:
'react-native-reanimated/plugin'

// Para:
'react-native-worklets/plugin'
```

## Referência

A migração idêntica foi feita no PureSoundCheck-App (RN 0.85 → reanimated 4.3.x).
Consulte o histórico daquele projeto para detalhes.

Tabela de compatibilidade oficial: https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/
