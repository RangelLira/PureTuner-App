# Pure Tuner App

Utilitários musicais para o músico brasileiro: afinador cromático, metrônomo,
dicionário de acordes e escalas com tablatura. React Native, 100% em
Português (Brasil), **Android exclusivamente** (sem versão iOS).

Detalhes de arquitetura, pipeline de áudio e convenções do projeto estão em
[`CLAUDE.md`](./CLAUDE.md).

# Como rodar

> **Nota**: tenha o [ambiente Android do React Native](https://reactnative.dev/docs/set-up-your-environment?platform=android)
> configurado antes de prosseguir.

Instale as dependências:

```sh
npm install
```

Em um terminal, inicie o Metro:

```sh
npm start
```

Em outro terminal, com um emulador ou device Android conectado:

```sh
npm run android
```

## Outros comandos

```sh
npm test        # Jest
npm run lint    # ESLint
```

Para recarregar o app durante o desenvolvimento: pressione <kbd>R</kbd> duas
vezes, ou abra o Dev Menu com <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux)
ou <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).

# Troubleshooting

Veja o guia de [Troubleshooting](https://reactnative.dev/docs/troubleshooting)
do React Native.
