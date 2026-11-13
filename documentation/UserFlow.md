# UserFlow — Pure Tuner

<!--
Navegação e jornadas. Visual vai em StyleGuide.md; implementação em TechSpec.md.
-->

## Mapa de telas

```
Barra inferior (5 abas, abre no Afinador)
 ├── Afinador
 ├── Metrônomo
 │    ├── modal Compasso
 │    ├── modal Subdivisão
 │    └── modal Digitar BPM
 ├── Acordes
 │    ├── modal de tom (grade 4 × 3)
 │    ├── Buscar acorde (lista)
 │    └── modo Montar acorde
 ├── Escalas
 │    ├── modal de tom
 │    └── modal de escala (lista das 16)
 └── Campo Harmônico
      └── modal Tipo de campo
Botão "?" (todas as abas) → modal Sobre
```

**Mecanismo de navegação:** manual por estado em `App.tsx`. As telas são
desmontadas ao trocar de aba, e o estado de Acordes, Escalas e Campo fica
no `App` (D-004).

**Botão voltar (Android):** fecha o modal aberto. Sem modal, segue o
padrão do sistema.

## Telas

### Afinador
- **Objetivo:** afinar o instrumento pela nota captada no microfone.
- **Ações:**
  | Ação | Resultado |
  |---|---|
  | Iniciar | pede o microfone (1ª vez), começa a escutar e mantém a tela acesa |
  | Parar | para de escutar e libera a tela |
- **Estados:** "Pressione Iniciar para começar" / "Toque uma corda para
  afinar" / "Aguardando sinal…" / nota com a agulha (baixo, afinado,
  alto). Depois de silêncio, volta para "Aguardando sinal…".

### Metrônomo
- **Objetivo:** praticar no tempo.
- **Ações:**
  | Ação | Resultado |
  |---|---|
  | − / + (toque ou segurar) | BPM −1 / +1, acelerando ao segurar; 40–220 |
  | toque no círculo do BPM | tap tempo: a partir do 2º toque, o BPM vira a média dos últimos 8 intervalos; zera depois de 2 s sem tocar |
  | segurar o círculo do BPM | modal para digitar o BPM |
  | chip de compasso | modal: 1/4, 2/4, 3/4, 4/4, 6/8 |
  | chip de subdivisão | modal: Semínima, Colcheia, Tercina, Semicolcheia (no 6/8, só Colcheia e Semicolcheia) |
  | Iniciar / Parar | liga e desliga. Continua em segundo plano |
- **Regras:** passar para 6/8 com Tercina ou Semicolcheia volta para
  Colcheia. O 1/4 não acentua.

### Acordes
- **Objetivo:** ver como tocar um acorde e do que ele é feito.
- **Layout:** círculo do tom → [Buscar acorde | Montar acorde] → chips de
  notas com grau → texto do acorde → braço → `n / total` + chip
  Canhoto/Destro → Anterior / Próxima.
- **Ações:**
  | Ação | Resultado |
  |---|---|
  | círculo do tom | modal de tom; mantém a qualidade (Dm → B vira Bm), ou cai em maior se não existir |
  | Buscar acorde | lista por prefixo; aceita a grafia da cifra; cada grafia é uma linha |
  | escolher um resultado | mostra o acorde com a grafia digitada |
  | Anterior / Próxima | percorre os até 5 shapes |
  | Canhoto / Destro | espelha o braço (salvo no aparelho) |
  | Montar acorde | entra no modo de montagem (abaixo) |

#### Modo Montar acorde
- Somem o `n / total` e o texto do acorde, que dá lugar às instruções dos
  gestos e, depois, à explicação do acorde formado. O círculo começa
  vazio.
- **Gestos no braço:**
  | Gesto | Resultado |
  |---|---|
  | toque numa casa | marca; em outra casa da mesma corda, substitui; tocar de novo desmarca |
  | círculo à esquerda da corda | alterna solta ↔ abafada (sem nada marcado = abafada) |
  | arraste vertical | pestana na casa onde começou (só uma; tocar nela a remove) |
  | arraste horizontal | anda pelas casas, até a casa 15 |
  | toque longo numa nota | torna essa nota a tônica |
- **Botões:**
  | Botão | Resultado |
  |---|---|
  | Voltar (braço vazio) | sai e volta para o que estava na tela |
  | Limpar (com notas) | apaga a montagem |
  | Concluir | travado até haver nome; vira o "Personalizado" (no lugar do `n / total`), e Anterior / Próxima passam pelos formatos do banco do mesmo acorde |
  | Buscar acorde | esquece a montagem |
- **Nome:** aparece com 3 notas ou mais (ou com o power chord). Com 2
  notas, mostra o intervalo. Se as notas formam um acorde com outra
  tônica, a legenda diz qual nota segurar ("Segure a nota C para ler como
  C/E").
- **Depois de concluir:** o personalizado sobrevive à troca de aba. Some
  ao buscar outro acorde, ao abrir um acorde pelo Campo ou ao concluir
  outra montagem. Trocar o tom o transpõe.

### Escalas
- **Objetivo:** ver uma escala no braço.
- **Layout:** igual ao de Acordes, com um chip longo de escala no lugar
  dos botões de busca.
- **Ações:** círculo do tom (modal); chip de escala (modal com as 16);
  Anterior / Próxima pelos 5 shapes; Canhoto / Destro.

### Campo Harmônico
- **Objetivo:** ver os acordes de um tom e a função de cada um.
- **Ações:**
  | Ação | Resultado |
  |---|---|
  | arrastar o disco | gira e encaixa no setor mais próximo |
  | toque num setor do aro externo | gira até ele, no campo maior |
  | toque num setor do aro do meio | gira até ele, no campo menor |
  | toque num acorde da lista | abre a aba Acordes nesse acorde |
  | botão Tipo de campo | modal: Maior, Maior com Sétima, Menor Natural, Menor Natural com Sétima |
- **Conteúdo:** a janela fixa no topo mostra os 7 acordes (tétrades na
  janela quando o campo é com sétima). A lista fica em 3 linhas (3-2-2),
  com o grau acima e a função abaixo. A armadura mostra só a quantidade
  ("4 sustenidos", "Sem acidentes").

### Sobre
- **Chega-se por:** botão "?" no canto superior de qualquer aba.
- **Conteúdo:** resumo de cada ferramenta, versão, afinação, idioma,
  contato (GitHub Issues, e-mail) e política de privacidade. Botão
  Fechar.

## Jornadas principais

### J1 — Afinar
1. Abre o app (já está no Afinador) → Iniciar → permite o microfone na
   1ª vez.
2. Toca cada corda e ajusta até a agulha ficar no centro.

### J2 — Estudar uma música de outro app
1. No Metrônomo, toca no círculo do BPM no ritmo da música.
2. Inicia o metrônomo e volta para o player. O clique continua junto, sem
   tirar o áudio do outro app.

### J3 — Tocar um acorde da cifra
1. Em Acordes → Buscar acorde → digita como está na cifra ("C7+").
2. Escolhe a linha e percorre os shapes com Anterior / Próxima.

### J4 — Descobrir que acorde é esse
1. Em Acordes → Montar acorde → marca as notas no braço.
2. O círculo mostra o nome assim que as notas formam um acorde →
   Concluir mostra outras formas de tocar o mesmo acorde.

### J5 — Achar os acordes de um tom
1. No Campo Harmônico, gira o disco até o tom (ou toca no setor).
2. Lê os 7 acordes e a função de cada um. Tocar num acorde abre a forma
   de tocar em Acordes.
