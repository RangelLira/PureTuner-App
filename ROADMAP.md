# ROADMAP — Reformulação da Tela Escalas

**Data:** 2026-07-08  
**Escopo:** Tela `ScalesScreen.tsx` + novo data-file de shapes

---

## Visão Geral das Mudanças

| O que some | O que fica | O que entra |
|---|---|---|
| Chips horizontais de tom | Título "Escalas" | Botão circular de tom |
| Chips horizontais de tipo de escala | Nome da escala em laranja | Chip longo de tipo de escala |
| Braço completo (12 casas) | Chips de notas (tônica laranja / resto azul) | Texto descritivo da escala |
| Legenda (Tônica / Nota da escala) | — | ShapeFretboard (janela de 5 casas) |
| Label "Braço — corda 6..." | — | Botões "Anterior" + "Próxima" (estilo Afinador) |

---

## Etapa 1 — Novo seletor de tom (botão circular + modal)

**Arquivo:** `ScalesScreen.tsx`

- Remover o `ScrollView` horizontal de tons (as 12 notas em chips)
- Criar um botão circular abaixo do título, estilo do app (fundo azul-escuro, texto branco, borda laranja)
- O botão exibe o tom atual (default: **C**)
- Ao tocar: abre um `Modal` centralizado com grade **4 colunas × 3 linhas** de chips das 12 notas cromáticas
- Ao tocar uma nota no modal: aplica a quente e fecha o modal
- Ao tocar fora do modal OU no botão "Cancelar": fecha sem alterar
- As 12 notas: `C · C# · D · Eb · E · F · F# · G · Ab · A · Bb · B`

---

## Etapa 2 — Novo seletor de escala (chip longo + modal com lista)

**Arquivo:** `ScalesScreen.tsx`

- Remover o `ScrollView` horizontal de escalas
- Criar um chip longo (largura ~70% da tela) exibindo o nome da escala atual (default: **Maior**)
- Ao tocar: abre um `Modal` com `ScrollView` em coluna, listando as 14 escalas:

| Label exibido | Chave tonaljs |
|---|---|
| Maior | `major` |
| Menor Natural | `minor` |
| Menor Melódica | `melodic minor` |
| Menor Harmônica | `harmonic minor` |
| Pentatônica Maior | `major pentatonic` |
| Pentatônica Menor | `minor pentatonic` |
| Penta Blues | `minor blues` |
| Jônio | `ionian` |
| Dórico | `dorian` |
| Frígio | `phrygian` |
| Lídio | `lydian` |
| Mixolídio | `mixolydian` |
| Eólio | `aeolian` |
| Lócrio | `locrian` |

- Ao tocar uma escala: aplica a quente e fecha o modal
- Botão "Cancelar" no rodapé da lista fecha sem alterar

---

## Etapa 3 — Texto descritivo de cada escala

**Arquivo:** `src/data/scaleDescriptions.ts` (novo)

- Criar um objeto `SCALE_DESCRIPTIONS` mapeando cada chave de escala para um texto curto (máx. 4–5 linhas)
- Exemplos:
  - **Maior:** "Escala fundamental da música ocidental. 7 notas com som alegre e estável. Base de tonalidades como C, G e D. Usada em pop, rock e música clássica."
  - **Pentatônica Menor:** "5 notas derivadas da menor natural. O shape mais popular do rock e blues. Funciona sobre progressões de I, IV e V em tons menores e maiores."
- O texto aparece entre os chips de notas e o diagrama de shape
- Sem `ScrollView` — texto estático de no máximo 4–5 linhas

---

## Etapa 4 — Dados de shapes por posição

**Arquivo:** `src/data/scaleShapes.ts` (novo)

- Cada escala tem N shapes (posições no braço), definidos como **janelas de 5 casas** calculadas algoritmicamente por posição de tônica
- A lógica: para cada shape, definir a casa inicial da janela (ex.: `{startFret: 0}`, `{startFret: 5}`, etc., relativas ao semitom da tônica)
- As notas exibidas dentro da janela são calculadas via `tonaljs` (já existente)
- Quantidade de shapes por tipo:
  - Pentatônicas / Blues: **5 shapes** (sistema CAGED)
  - Escalas de 7 notas (maior, menor, modos): **7 shapes** (uma posição por grau)
  - Shapes são transpostos automaticamente para qualquer tônica

---

## Etapa 5 — Componente ShapeFretboard

**Arquivo:** `src/components/ShapeFretboard.tsx` (novo)

- Substituir o `Fretboard` atual (12 casas, scroll horizontal)
- Novo SVG mostrando **5 casas** em uma janela compacta, sem scroll horizontal
- Mesmo esquema de cores (tônica laranja, outras notas azul)
- Exibe número das casas no topo (ex.: 5 · 6 · 7 · 8 · 9)
- Mantém nomes das cordas (E A D G B e) à esquerda
- Proporções ajustadas para caber na tela sem scroll

---

## Etapa 6 — Navegação de shapes + botões Anterior/Próxima

**Arquivo:** `ScalesScreen.tsx`

- Estado `shapeIndex` (reset para 0 ao mudar tom ou escala)
- Dois botões **lado a lado** na mesma posição dos botões do Afinador:
  - Mesmo `paddingHorizontal: 56`, `paddingVertical: 18`, `borderRadius: 32`
  - Mesma cor laranja (`colors.primary.orange`)
  - Mesma fonte (`fontSize: 18, fontWeight: '600'`)
  - Labels: **"Anterior"** (esquerda) e **"Próxima"** (direita)
- "Anterior" desabilitado visualmente quando `shapeIndex === 0`
- "Próxima" desabilitado visualmente quando `shapeIndex === totalShapes - 1`
- Indicador discreto de posição entre os botões: ex. `"2 / 5"` em cinza

---

## Etapa 7 — Limpeza e layout final

**Arquivo:** `ScalesScreen.tsx`

- Remover legenda (dots + textos "Tônica" / "Nota da escala")
- Remover label "Braço — corda 6 (baixo) ao topo"
- Ajustar espaçamentos: título → botão circular → chip longo → nome da escala → chips de notas → descrição → ShapeFretboard → botões Anterior/Próxima
- Garantir que a tela inteira cabe sem `ScrollView` externo (layout fixo)
- Tônica default: **C** | Escala default: **Maior**

---

## Ordem de execução sugerida

```
Etapa 1 → Etapa 2 → Etapa 3 → Etapa 4 → Etapa 5 → Etapa 6 → Etapa 7
```

Cada etapa é independente e pode ser validada separadamente antes da próxima.

---

## Arquivos impactados

| Arquivo | Ação |
|---|---|
| `src/screens/ScalesScreen.tsx` | Reescrita completa |
| `src/data/scaleDescriptions.ts` | Novo |
| `src/data/scaleShapes.ts` | Novo |
| `src/components/ShapeFretboard.tsx` | Novo |
| `src/data/` (pasta) | Criar se não existir |
