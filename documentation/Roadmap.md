# Roadmap — Pure Tuner

<!--
Só PRESENTE e FUTURO. Etapa concluída sai daqui e vai para Changelog.md.
Legenda: ⬜ a fazer · 🔧 em andamento · ⏸ bloqueado
-->

## Estado atual

13/11/2026 — versão 1.1 (versionCode 3) publicada. Afinador, Metrônomo,
Acordes, Escalas e Campo Harmônico funcionais. Na `main`, ainda sem versão
publicada (ver `Changelog.md` › Não publicado): Montar acorde, graus acima
das notas, busca de acordes com grafias de cifra, ícone novo e textos do
Sobre e do site atualizados.

## Próximas etapas

1. ⬜ **Navegar entre telas arrastando pro lado** (branch própria) — além
   da barra inferior. Conflita com gestos que já existem: disco do Campo
   e arraste horizontal no braço do Montar acorde. Regra proposta: o
   arraste dentro desses componentes é deles; fora, troca de tela.
   Provável dependência nova (`react-native-pager-view`) — pedir antes.
2. ⬜ **Revisão geral das telas** — mais enxutas, fáceis de entender.
3. ⬜ **Layout em paisagem** — layout próprio, elementos reagrupados.
4. ⬜ **Screenshots novas da Play Store** — com a aba Campo e o Montar
   acorde; subir junto o ícone novo (`logo/icone-512.png`); prints em `store/screenshots/`.

## Ideias (não priorizadas)

- Tocar o som do acorde montado.
- Montar acorde: indicar quando há notas fora da janela de casas visível
  (hoje elas soam e entram no nome, mas não aparecem até arrastar de volta).
