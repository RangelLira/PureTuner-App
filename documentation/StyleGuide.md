# StyleGuide — Pure Tuner

<!--
A cara do app. Os valores reais ficam no código (fonte da verdade); aqui
ficam o arquivo, a intenção e as regras de uso.
-->

## Identidade

- **Personalidade:** ferramenta de estudo leve, clara e amigável para o
  leigo; telas enxutas, sem texto sobrando.
- **Referências visuais:** um famoso site brasileiro de cifras (branco +
  laranja). Prints atuais da loja em `store/screenshots/`.

## Cores

- **Fonte da verdade:** `src/constants/colors.ts`. Nunca cor literal em
  componente.
- **Temas:** fixo, sem modo escuro (D-003).

| Token | Valor | Uso |
|---|---|---|
| `primary.orange` | `#FF6B35` | ações principais (Iniciar, Próxima), tônica, aba ativa, tom selecionado no Campo |
| `secondary.darkBlue` | `#2C3E50` | títulos, chips (escala, Buscar/Montar, compasso, subdivisão, acordes do Campo), notas que não são a tônica |
| `neutral.mediumGray` | `#7F8C8D` | subtítulos, texto de apoio, abas inativas |
| `neutral.lightGray` | `#ECF0F1` | divisórias e fundos de controles |
| `neutral.white` | `#FFFFFF` | fundo; texto sobre os chips |
| `status.*` | — | estados do afinador e erros |

**Regra de cor da tônica:** em toda tela, a tônica é laranja e o resto é
azul-escuro, sempre com texto branco nos chips. No Campo, só duas cores,
sem cor por função (D-014).

## Tipografia

Fonte nativa do sistema. Tamanhos ficam nos `StyleSheet` de cada tela.
Títulos de tela são centralizados no topo ("Afinador", "Metrônomo"…), com
subtítulo cinza quando a tela tem estado (Afinador, Metrônomo).

## Espaçamento e layout

- Cada tela cabe inteira, **sem rolagem**.
- **Acordes e Escalas** seguem a mesma ordem: círculo de tom → chip →
  chips de notas (com o grau acima) → texto de altura fixa
  (`height: 76`, `numberOfLines={4}`, para o braço não "pular" entre
  telas) → braço → `n / total` + chip Canhoto/Destro → Anterior / Próxima.
- **Botão principal no rodapé** (Iniciar do Afinador e do Metrônomo; Tipo
  de campo no Campo; Anterior / Próxima): todos na mesma posição e no
  mesmo padrão. O tamanho do círculo do Campo (`height * 0.36`) foi
  calibrado para o botão não sair desse lugar. Ao acrescentar algo na
  tela, conferir.
- **Texto dentro de círculos** (tom, acorde, BPM): centralizado de
  verdade. Nomes longos encolhem só o necessário.
- **Campo Harmônico:**
  - os aros ocupam 0,80–1 / 0,60–0,80 / 0,29–0,60 do raio (o interno é
    mais largo, para caber os diminutos);
  - os graus só aparecem na lista, não dentro da janela;
  - a lista fica em 3 linhas (3-2-2), com o papel do grau em 1 linha
    abaixo de cada chip;
  - não há texto explicativo nessa tela.
- **Paisagem:** hoje quebra. Um layout próprio está no `Roadmap.md`.

## Componentes padrão

### Braço do instrumento
- **Onde está:** `src/components/ShapeFretboard.tsx` (exibição) e
  `BuilderFretboard.tsx` (Montar acorde).
- **Regras:** cordas na horizontal, aguda no topo; janela de 5 casas com o
  número das casas no topo; pestana desenhada; círculos à esquerda para
  corda solta/abafada. No canhoto, só o eixo das casas inverte (casa 1 à
  direita).

### Chips de notas
- **Onde está:** `src/components/NoteChips.tsx`.
- **Regras:** grau acima de cada nota, em notação brasileira (T, 2M, 3m,
  3M, 4J, 5d, 5J, 5A, 6M, 7m, 7M, 9M, 11J…).

### Modais de escolha
- Abertos por chip ou botão. Grade 4 × 3 para tom e lista para
  escala/compasso/subdivisão/tipo de campo. Aplicam na hora e fecham.

### Barra inferior
- **Onde está:** `src/components/TabIcon.tsx` + `App.tsx`.
- **Regras:** 5 ícones SVG com o mesmo traço. A aba ativa fica laranja
  (ícone e nome), e as demais ficam cinza.

## Ícones e imagens

- **Biblioteca:** desenhados à mão em `react-native-svg`, sem biblioteca
  de ícones.
- **Ícone do app:** diapasão em forma de P, branco com contorno
  azul-escuro (`#303F51`) sobre laranja (`#FF5E28`). Ocupa 58% da altura e
  é centralizado pelo centro óptico (D-018). É gerado por `scripts/icon/`
  (ver TechSpec › Build). Fonte vetorial em `logo/icone.svg` e PNG da loja
  em `logo/icone-512.png`.
- **Loja:** `store/feature-graphic.png` (1024 × 500) e
  `store/screenshots/NN-tela.jpeg`.

## Acessibilidade

- Botões com `accessibilityRole` e `accessibilityLabel` nos ícones sem
  texto (contato no Sobre).
- A DEFINIR: revisão de contraste e de tamanho de toque. Os chips
  pequenos do Campo e os pontos do braço ainda não foram auditados.
