Nome: Pure Tuner App 
Descrição: Um canivete suíço para músicos, acumulando funções úteis para estudo como: 
Afinador, para afinar o instrumento; Metronomo, para praticar e compreender melhor divisoes 
rítmicas e praticar acompanhamento; Dicionário de acordes, para que o usuário busque por acordes e suas 
opções; Escalas, tablaturas das principais Escalas para praticar. 
Idioma: Apenas Portugues BR - Focado no público local
Plataforma: Apenas Android (projeto de portfólio, enxuto e sem versão iOS)
Afinação: Padrão A 440hz - Focado no que o publico mais utiliza
Esquema de cores: Fixa (Não tem variação de temas) 
Cores principais: Branco e Laranja 
Inspiração: Famoso site brasileiro de cifras. 
==========================================================================================================

Sobre as telas:

* Tela "Afinador": Função Principal do App, usa a captação do microfone para afinar instrumentos de corda. 
   Elementos da Tela:
	Titulo no topo: "Afinador" 
	Subtítulo: "Pressione Iniciar"
	Mostrador de nota: "E"
	Visor do afinador: deve ter: "-1/2 - 0 - +1/2"
	Botao: Iniciar/Parar  

   Sobre o afinador:
	- Deve ser preciso na captação, afinar corretamente. 
	- Precisa ser visualmente bonito e fácil de compreender; 
	- Deve ter um efeito "geléia", nome técnico: é interpolação com easing e animação com spring physics. Em vez de 
	a agulha/barra pular de posição para posição, ela escorrega suavemente usando física de mola — tem aceleração, 
	inércia, e desaceleração natural. Deve ser fluído e constante, não travar, arrastar ou tremer. A UI é muito importante aqui.  
	- Deve detectar a nota imediatamente, e o afinador logo em seguida assim que determinar a posição atual de afinação.
	- Deve detectar silencio e não mostrar nota nenhuma após 1 segundo de silencio. É preciso se atentar ao decaimento da nota aqui.
	- Deve ter função para não apagar a tela do celular NUNCA, enquanto o afinador estiver acionado (Botão iniciar pressionado) 

* Tela "Metronomo":
   Elementos da Tela:
	Titulo no topo: "Metrônomo" 
	Subtítulo: "Pressione Iniciar para começar"
	Mostrador de contagem: 4 Circulos maiores
	Mostrador de subdivisão: De 1 a 3 circulos menores entre a contagem (Conforme precisar)
	Mostrador de BPM: Circulo Grande com o número maior e "BPM" menor embaixo
	Controle de BPM: 2 Circulos menores com "-" e "+" logo abaixo do BPM.
	Área de configuração: deve ter 3 chips centralizados com as opções 2/4 3/4 4/4
	Botão chip maior: "Semínima", Ao clicar abre tela para escolher outras (Colcheia, Tercina, Semicolcheia) 
	Botao: Iniciar/Parar  
  
   Sobre o metronomo:
	- Deve ter opção de ajuste de velocidade (BPM) "- 120BPM +"
	- Composição visual dos círculos do BPM, + e -, deve ser como uma molécula.
	- Deve ter divisoes rítmicas selecionáveis, 4/4 como default (2/4 - 3/4 - 4/4)
	- Acento no Primeiro Tempo: O metrônomo deve ter um som diferente para marcar o início de cada compasso
	- Subdivisões Rítmicas: Semínima default. Opção para escolher outras subdivisões: (colcheias, tercinas ou semicolcheias)

* Tela "Acordes":
   Em Desenvolvimento...

* Tela "Escalas":
   Em Desenvolvimento...

* Botão "Sobre":
	- Deve ficar no topo superior esquerdo da Tela, alinhado ao título
	- Deve ser visível como um botão redondo apenas com um símbolo "?" no centro.
	- Deve ficar visível em qualquer uma das 4 telas.
	- Abre uma tela que mostra informações releventes sobre o app, e tem um botão "Fechar". 

====================================================================================================================

Problemas para corrigir: 

1 - O Título da Tela "Afinador" precisa ficar um pouco mais para baixo; 
2 - As telas em desenvolvimento já podem ter os títulos no devido lugar; 
3 - A barra inferior, dos botões para trocar de tela precisa ser maior, quase o dobro mais larga;
4 - Os botões da barra inferior devem ficar mais pra cima. 
5 - O Botão "Sobre" não existe ainda. 