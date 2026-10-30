# Changelog — Pure Tuner

O que mudou em cada versão publicada (ou preparada para publicação).
`versionName` / `versionCode` ficam em `android/app/build.gradle`.

## Não publicado (próxima versão)

### Alterado
- **Metrônomo**: número do BPM centralizado no círculo, na mesma linha dos
  botões − e +, e fonte maior (52 → 60). O rótulo "BPM" ficou fixo logo
  abaixo, sem empurrar o número pra cima.
- **Busca de acordes** aceita as grafias de cifra além do símbolo do app:
  7M / 7+ (sétima maior), m7M, º, ø, m7(5-), 7(9-), 7(4), tons com bemol
  (Db = C#) e ♯/♭. Cada grafia que casa é uma linha própria na lista e o
  acorde é mostrado com a grafia digitada ("C7+"), com "mesmo acorde que
  Cmaj7" embaixo — o leigo que copiou o nome de uma cifra vê o mesmo nome.
  Maiúsculas e minúsculas são ignoradas, exceto no "M" (Cm7M ≠ Cm7m).

## 1.1 (versionCode 3) — 29/10/2026

### Novo
- **Aba Campo Harmônico**: círculo das quintas giratório com 3 aros
  (maiores, relativas menores, diminutos) e janela fixa no topo mostrando
  os 7 acordes do campo. Arrastar gira o disco e encaixa no setor mais
  próximo; tocar num setor gira até ele.
  - Quatro tipos de campo: Maior, Maior com Sétima, Menor Natural e Menor
    Natural com Sétima.
  - Lista dos 7 acordes em matriz 3-2-2, na ordem dos graus, com o grau
    (I, ii…) acima e a função abaixo (Tônica, Subdominante, Dominante,
    Subdominante fraca, Dominante fraca, Variante tônica, Relativa
    menor/maior). Tônica em laranja, demais em azul-escuro.
  - Tocar num acorde abre a aba Acordes já nele.
  - Armadura de clave mostra só a quantidade ("3 bemóis", "Sem acidentes").
  - O setor da base do círculo é sempre Sol♭ maior / Mi♭ menor (nunca
    Fá♯ maior, que teria Mi♯ como 7º grau).

### Alterado
- **Barra inferior**: emojis trocados por ícones SVG desenhados no mesmo
  estilo (diapasão, metrônomo analógico, diagrama de acorde, notas,
  círculo das quintas). O ícone da aba ativa fica laranja junto com o
  nome; os demais ficam cinza.

## 1.0 (versionCode 1 e 2) — primeira publicação

- Afinador (autocorrelação com correção de oitava, agulha com física de
  mola, tela sempre acesa enquanto ouve).
- Metrônomo (compassos 1/4 a 4/4 e 6/8, subdivisões, tap tempo, continua
  tocando em segundo plano).
- Acordes (busca por nome, 5 shapes CAGED por acorde) e Escalas
  (16 escalas × 5 shapes), ambos com modo canhoto.
- Tela Sobre com política de privacidade.
- versionCode 2 foi só reenvio à Play Console (o 1 foi rejeitado), sem
  mudança de funcionalidade.
