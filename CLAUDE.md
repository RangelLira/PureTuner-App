# CLAUDE.md — Pure Tuner

"Canivete suíço" do músico brasileiro: afinador, metrônomo, acordes (com
Montar acorde), escalas e campo harmônico. Pensado para o leigo: mostra
como a música é formada e nunca engana. Projeto de portfólio, enxuto.

- **Plataforma:** Android exclusivamente (React Native CLI 0.80, TypeScript)
- **Pacote/ID:** `com.contestsoftware.puretuner` · versão **1.1 (versionCode 3)** na Play Store
- **Repositório:** `github.com/RangelLira/PureTuner-App` (público; `docs/` = site no GitHub Pages)
- **Idioma do produto:** PT-BR, com cifra e graus do uso brasileiro

## Comandos

```bash
npm start              # Metro
npm run android        # roda no device/emulador
npm test               # Jest (camada pura de services/ e data/)
npm run lint           # ESLint
npx tsc --noEmit       # tipos
cd android && ./gradlew assembleRelease   # APK de release
python scripts/icon/build.py             # regenera o ícone (requer Pillow)
```

## Regras duras

- **Recurso nativo carregado por nome** (ex.: os `.wav` do metrônomo via
  `react-native-sound`) precisa estar em `android/app/src/main/res/raw/keep.xml`,
  senão o R8 o remove da release sem erro. Conferir com
  `unzip -l app-release.apk | grep raw/` se o **nome** bate. Não religar
  `android.enableResourceOptimizations` (ele renomeia recursos).
- **Ícone:** nunca editar à mão os `mipmap-*`, o `ic_launcher_*.xml` nem o
  `logo/icone*`. Mude os parâmetros em `scripts/icon/build.py` e regenere.
- **Cores** só via `src/constants/colors.ts`. **Strings** em PT-BR direto
  nos componentes. Sem Redux/Context: o estado das abas fica em `App.tsx`.
- **Telas cabem sem rolagem.** O botão do rodapé fica sempre na mesma
  posição (ao acrescentar algo, conferir, principalmente no Campo).
- **Teoria musical testada:** shape, campo, alias ou fórmula nova entra
  com teste em `__tests__/data/`. Antes de mexer em
  `MetronomeEngine.scheduleNext()`, leia o teste de segundo plano.
- **Textos sobre as ferramentas** ficam em dois lugares: o Sobre
  (`AboutScreen.tsx`) e o site (`docs/index.html`). Ao mudar uma
  ferramenta, revisar os dois. Ao mudar a versão, atualizar o Sobre e o
  `Changelog.md`.
- **Keystore, `keystore.properties` e `*.local.md`:** não ler, não mover,
  não commitar.

## Fora do Escopo

Este app **não** terá: versão iOS, outros idiomas, temas/modo escuro,
referência diferente de A 440, conta/login/backend/anúncios/coleta de
dados, menor harmônica/melódica no Campo, grafia Fá♯ no setor 6, "Editar
acorde". Não implementar, nem parcialmente, sem decisão registrada em
`Decisions.md`. Lista completa e motivos: `documentation/PRD.md` › Fora do
Escopo.

## Documentação — leia quando precisar

Toda a documentação está em `documentation/`.

| Arquivo | Leia quando… |
|---|---|
| `PRD.md` | for decidir **o que** fazer, ou avaliar se algo está no escopo |
| `UserFlow.md` | mexer em navegação, gestos, modais ou jornada (Montar acorde, disco do Campo, tap tempo) |
| `StyleGuide.md` | mexer em qualquer coisa visual (cores, layout fixo das telas, ícone) |
| `TechSpec.md` | mexer em arquitetura, pipeline de áudio, metrônomo, busca, Campo, build/release, **armadilhas**, ou antes de adicionar dependência |
| `DataModel.md` | não se aplica: a única coisa salva é a preferência de canhoto (`@puretuner/leftHanded`, ver TechSpec) |
| `Roadmap.md` | começar uma tarefa nova (ver o que vem a seguir) |
| `Decisions.md` | antes de propor mudança de rumo (a decisão pode já existir) |
| `Changelog.md` | precisar saber o que mudou e quando |
| `archive/` | só para histórico (especificação inicial, plano antigo de Escalas) |

## Arquivos fora do código

| Pasta | Conteúdo |
|---|---|
| `logo/` | identidade: `icone.svg` e `icone-512.png` (ícone da loja), gerados pelo script |
| `store/` | Play Store: `feature-graphic.png` e `screenshots/NN-tela.jpeg` |
| `scripts/icon/` | gerador do ícone (`gen.py` = geometria e comparativo; `build.py` = recursos) |
| `docs/` | site e política de privacidade (GitHub Pages) |

## Manutenção da documentação

Atualize na mesma tarefa que causou a mudança:

| Se mudar… | Atualize |
|---|---|
| funcionalidade, escopo, regra de negócio | `PRD.md` (e o Fora do Escopo acima, se mudar um item "nunca") + Sobre/site |
| tela, navegação, gesto, jornada | `UserFlow.md` |
| cor, layout, componente, ícone | `StyleGuide.md` |
| dependência, arquitetura, build, armadilha resolvida | `TechSpec.md` |
| decisão de rumo (inclusive reverter uma antiga) | `Decisions.md` |
| etapa concluída | `Roadmap.md` → mover para `Changelog.md` |
| `versionCode` / `versionName` | `Changelog.md` + versão no `AboutScreen.tsx` + linha de versão acima |
