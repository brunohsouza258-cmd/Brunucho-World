# Super Brunucho: A Lenda da Aura Infinita

Jogo de plataforma 2D estrelado pelo Brunucho, feito com [Phaser 3](https://phaser.io), roda direto no navegador.

## Como jogar

Dê dois cliques em `index.html`. **Funciona sem internet** (o Phaser fica na pasta `lib/`).

| Tecla | Ação |
|---|---|
| ← / → ou A / D | andar |
| Espaço / ↑ / W | pular (segure para pular mais alto) |
| ESC ou P | pausar |
| R | reiniciar a fase |
| M | ligar/desligar som |
| O | opções (no menu e na pausa) |

**No celular:** um **joystick de bolinha** (encoste o dedo na metade esquerda da tela e arraste a bolinha para o lado que quer ir; ele nasce onde você encosta) e o botão ▲ de pular na direita (dá pra andar + pular com dois dedos),
e o botão **II** (canto de cima) pausa. Deixe o aparelho **deitado**: em pé aparece um aviso e o jogo pausa.
Nas Opções dá pra ativar a **tela cheia** e o modo de efeitos **leve** (já vem ligado no celular, pra rodar mais liso).
**Jogar no celular:** no computador, dê dois cliques em **`jogar-no-celular.bat`** (precisa do Python). Ele mostra dois endereços
para digitar no navegador do celular (mesmo Wi-Fi): o `http://` joga normal; o `https://` também deixa **gravar a voz** com o microfone
(o celular vai avisar que o certificado não é seguro: *Avançado > Continuar*, é um certificado feito em casa e nada sai da sua rede).
Depois, menu do navegador > **Adicionar à tela inicial** instala o jogo como app. Se não tiver `openssl` (vem com o Git) só o `http://` abre,
e na tela *Minha voz* dá pra usar **importar arquivo**.

**Com controle de videogame** (Xbox, PlayStation...): direcional/analógico anda, **A/X** pula e confirma,
**B/○** volta, **Start** pausa.

No menu, escolha **ROUPA** (ou aperte **C**, ou toque no Brunucho) para abrir o **guarda-roupa** com 10 looks:
**Praia**, **Diesel**, **Cueca** (só de cueca e meia), **Terno** (com gravata), **Palmeiras** (camisa, calção e meiões verdes, chuteira),
**Seleção**, **Pijama** (com gorro), **Herói** (capa e máscara), **Academia** e **Capivara** (capuz). As roupas ficam em `OUTFITS`,
no `src/config.js`, e o desenho em `drawPlayer`, no `src/textures.js`. Vestir todas dá a conquista *Closet Completo*.

### Menu

**Continuar** (de onde parou), **Novo jogo**, **Escolher fase**, **Conquistas**, **Ranking**, **Opções** e **Roupa**.

### Vidas e progresso

- Você começa com vidas de acordo com a dificuldade: **Fácil 6 · Normal 4 · Difícil 3**. Os inimigos ficam mais rápidos
  (×0,9 · ×1,1 · ×1,5) e o chefão aguenta **3 · 4 · 5** pisões.
- Ganha **+1 vida** comendo uma **coxinha** ou juntando **100 moedas**.
- Acabou as vidas: **GAME OVER, a Andreia te achou...** Dá pra tentar a fase de novo.
- As fases vão sendo **liberadas** conforme você passa (ou libere todas nas Opções). Cada fase tem **3 estrelas**:
  passar, passar sem morrer e pegar todas as moedas.

### Opções

Volume da música e dos efeitos, **vozes** (o jogo fala "six seven!" e "moggado!"), tremer a tela, dificuldade,
liberar todas as fases e apagar o progresso.

### 🎤 Minha voz (narração)

Em **Opções → 🎤 Gravar minha voz** você grava a sua voz em cada fala do jogo: *Six seven!*, *Moggado!*, *Moggados!*,
*Olhar de mil jardas*, *Anjo caído*, *Churros!*, *Aura!* e *Ai, mãe!*. Onde você gravar, o jogo usa a **sua** voz; onde não gravar,
usa a voz do computador (*Aura!* e *Ai, mãe!* só tocam se você gravar).

| Tecla | O que faz |
|---|---|
| ↑ ↓ | escolher a fala |
| ENTER (ou o botão ●) | gravar / parar (para sozinho em 4 segundos); aparece um medidor de volume |
| P (▶) | ouvir como vai ficar |
| I (📁) | **importar um arquivo de áudio** (pode gravar pelo celular e mandar pro computador) |
| X (✖) | apagar a gravação |

O jogo corta o silêncio do começo e do fim e ajusta o volume sozinho. As gravações ficam **só no seu navegador** (nada é
enviado pra internet) e continuam salvas quando você fecha o jogo. Dá para ligar e desligar em *Usar a minha voz*.
Se o navegador pedir permissão do microfone, é só permitir. Os créditos ganham a linha **NARRAÇÃO: a voz do próprio Brunucho**.

### Trilha sonora

Músicas originais geradas por código (`src/music.js`): o **hino "Six Seven"** no menu, uma música para cada cenário
(bossa no Rio, axé na Bahia, lo-fi com garoa em SP, reggae na praia...), música **turbo** durante o poder 67,
música da intro, de vitória e de game over. As notas ficam em `SONGS` e dá pra compor as suas!

### Conquistas

**55 conquistas**, como *Fugiu da Chinelada*, *Mogador Serial*, *Haja Coração!*, *Foi Pênalti?*, *Sigma do Combo*,
*Atropelamento 67*, *A Andreia Te Achou* e *Modo Andreia* (zerar no Difícil). Aparece um aviso na tela quando desbloqueia
e dá pra ver todas no menu. A lista fica em `src/achievements.js`.

### Fases: uma viagem pelo Brasil (32 fases)

Em **Escolher fase** (10 por página, ◀ ▶ para trocar) ou teclas **1 a 9** você vai direto para uma fase liberada.
Cada estado tem seu cartão-postal no fundo, chão e enfeites da região e música regional.

| Trecho | Fases | Música |
|---|---|---|
| Começo | 1 Primeiros Passos · 2 Escola Zacarias | |
| Sudeste | 3 São Paulo · 4 Rio de Janeiro · 5 Espírito Santo (Convento da Penha) · 6 Minas Gerais (Ouro Preto) | sertanejo |
| Sul | 7 Paraná (Jardim Botânico, araucárias) · 8 Santa Catarina (Ponte Hercílio Luz) · 9 Rio Grande do Sul (Gasômetro) · 10 Vale dos Espinhos | vanerão |
| Centro-Oeste | 11 Mato Grosso do Sul (Pantanal) · 12 Mato Grosso (Chapada dos Guimarães) · 13 Goiás (Chapada dos Veadeiros) | sertanejo |
| Norte | 14 Rondônia (Três Caixas d'Água) · 15 Acre · 16 Amazonas (Teatro Amazonas) · 17 Roraima (Monte Roraima) · 18 Amapá (Marco Zero) · 19 Pará (Ver-o-Peso) · 20 Tocantins (Jalapão) | carimbó |
| Nordeste | 21 Maranhão (Lençóis) · 22 Piauí (Pedra Furada) · 23 Ceará · 24 Rio Grande do Norte · 25 Paraíba · 26 Pernambuco (Olinda) · 27 Alagoas · 28 Sergipe · 29 Bahia | forró |
| Final | 30 Praia do Brunucho · 31 Pico Final · 32 **Brasília: Chefão Final** | |

As fases dos estados foram montadas por um gerador (`tools/gerar_fases.py`) e a dificuldade **sobe a cada estado**:
de ~165 até ~210 blocos de comprimento, buracos de até **5 blocos** (que exigem corrida de impulso), sequências de
espinhos, plataformas que caem, pombos sobre buracos, bombardeiros e mais inimigos. Um verificador confere que dá pra
chegar do começo ao checkpoint e à bandeira em todas, e o gerador **nunca coloca inimigo nem espinho solto** nas 8
casas antes de um buraco grande nem nas 3 depois (a corrida e o pouso ficam livres). Os fundos ficam em `src/estados.js`.
Rode `python tools/gerar_fases.py --check` depois de editar o `levels.js` para conferir se todas as fases têm caminho.

Conquistas por região: *Sudeste Completo*, *Bah, Tchê!*, *Pantaneiro*, *Desbravador da Amazônia*, *Arretado!*
e **Turista Nacional** (todos os 26 estados + DF).

### Chefão final: Lula & Flávio

Na arena de Brasília a parede fecha atrás de você e os dois caem do céu. Cada um tem uma barra de vida
(2/3/4 golpes no Fácil/Normal/Difícil). **Pise na cabeça** deles para causar dano:

- **Lula** anda pela arena e **joga picanhas** em arco ("Faz o L!", "Picanha pra todo mundo!").
- **Flávio** **joga ovos** e dá **pulões que tremem o chão** ("Aqui é o 01!").
- Quando um cai, o outro fica bravo: mais rápido e jogando 3 de uma vez.

Venceu? **MOGGADOS!** e vem a **cena final**: o Brunucho volta pra casa e a Andreia está esperando... com o chinelo.
Depois: créditos rolando, o aviso de que é tudo brincadeira e o ranking. A lógica do chefão fica em `src/boss.js` e a cena final em `src/scenes/Ending.js`.

### Famosos (aparecem em todas as fases)

| Famoso | O que faz |
|---|---|
| Neymar "Cai-Cai" | quando você chega perto, se joga e sai rolando ("FOI PÊNALTI!") |
| Galvão Bueno | fica parado narrando e chuta bolas em você ("HAJA CORAÇÃO!") |
| Casimiro | anda e pula do nada ("VAMO!") |
| Ednaldo Pereira | anda devagar ("Vale nada, vale tudo!") |

As falas e a velocidade ficam em `FAMOUS`, no `config.js`.

### Memes brainrot

| Meme | O que faz |
|---|---|
| Bombardiro Crocodilo | crocodilo-avião que voa e **solta bombas** quando passa em cima de você |
| Brr Brr Patapim | árvore de pezão que anda **pulando** |
| Chimpanzini Bananini | macaco-banana que **corre rápido** |
| Lirilì Larilà | elefante-cacto de sandália: **aguenta 2 pisões** |
| Ballerina Cappuccina | bailarina-cappuccino que **gira e avança** quando você chega perto |

Ficam em `MEMES`, no `config.js` (no mapa são letras minúsculas: `b p c l r`).

### Memes clássicos da internet

| Meme | O que faz |
|---|---|
| 🚽 Skibidi Toilet | fica parado e **cospe 3 jatos d'água** em arco |
| 🐕 Doge | se agacha ("Much wow!") e **dispara na sua direção** |
| 🐱 Nyan Cat | **voa em ondas** deixando um arco-íris; pise nele de cima |
| 💪 Gigachad | lento, mas **aguenta 3 pisões** (grandão derruba em 1) |
| 😵 Nazaré Confusa | solta uma onda de contas e **inverte seus controles por 2 segundos** |

No mapa: `s d y g z`. Moggar os 5 dá a conquista **Rei dos Memes**. São 85 espalhados pelas fases, mais nas mais difíceis.

### Poderes

- **67**: modo *six seven* por **6,7 segundos**: invencível, mais rápido, pula mais alto e derruba inimigo só de encostar.
- **Aura**: escudo brilhante que aguenta **um golpe**.
- **Churros** 🍬: o Brunucho fica **grandão (1,5×)** e ganha **1 golpe extra**: se for atingido, ele só encolhe (e fica uns
  2 segundos invencível) em vez de perder uma vida. Grandão também **derruba inimigo duro numa pisada só**. Cair no
  buraco continua matando. Tem pelo menos 1 em cada fase (2 nas mais longas).
- **Coxinha** 🍗: +1 vida.
- **Tênis de Mola** 👟: **pulo duplo** até o fim da fase (aperte pular de novo no ar).
- **Ímã de Aura** 🧲: puxa as moedas por perto durante 12 segundos.
- **Olhar de Mil Jardas** 👁️: o tempo para por 8 segundos. Tudo fica cinza, inimigos e tiros congelam (até o chefão!)
  e encostar neles não machuca.
- **Anjo Caído** 😇: asas até o fim da fase (**segure pular no ar para planar**) e uma auréola que **te salva de uma queda**.

### Elementos das fases

- **Plataformas que se movem** (por cima do mar no Rio e na Praia, e no abismo do Pico Final): suba e ela te leva.
- **Trampolim**: joga o Brunucho lá no alto.
- **Pombo** 🐦: voa em zigue-zague pelas cidades. Pise nele também!
- **Plataforma que cai** (rachada): treme por meio segundo depois que você pisa, some, e volta uns 3 segundos depois.
- **Fundo dos buracos**: água nas praias, rio com vitórias-régias na Amazônia e abismo no cerrado e no sertão.
- **Blocos de cada região**: tijolo vermelho no Sudeste e Sul, madeira no Norte e litoral, arenito no sertão e cerrado.
- **Clima**: chuva na Amazônia e no Pará, neblina em Minas, Paraná e Roraima, poeira no cerrado e sertão, folhas em
  Rondônia e vagalumes no Pantanal. Cada estado tem uma **placa "BEM-VINDO"** no começo e silhuetas de profundidade.
- **Decoração automática**: cada cenário ganha enfeites no chão (flores, árvores, guarda-sóis, castelos de areia,
  barraca de acarajé, ipês, hidrantes...). A lista fica em `DECOR_SETS`, no `config.js`.
- Ao **renascer**, o Brunucho fica 2 segundos invencível e os inimigos em cima do checkpoint são empurrados.

### Pontuação

| Ação | Pontos |
|---|---|
| Moeda | +100 |
| Inimigo | +200 × combo (pise em vários sem tocar o chão: x2, x3...) |
| Poder 67 | +670 |
| Aura | +1000 |
| Checkpoint | +500 |
| Morrer | -500 |
| Terminar a fase | +1000 |
| Bônus de tempo | +25 por segundo abaixo de 90s |
| Fase sem morrer | +2000 |
| Todas as moedas da fase | +1500 |

Os 5 melhores ficam no **Ranking** (menu principal). No fim do jogo cada um **digita o próprio nome**. Os valores ficam em `SCORE`, no `config.js`.

### Intro

Ao apertar **JOGAR** no menu, rola a conversa entre o Brunucho e a mãe dele, a **Andreia**, que proíbe ele de sair
pra farmar aura de novo... e ele sai mesmo assim. **Espaço/Enter/toque** avança, **ESC** pula.
As falas ficam em `INTRO_SCRIPT`, no `src/scenes/Intro.js`. (Escolher uma fase direto no menu pula a intro.)

Pise nos inimigos para derrotá-los, desvie dos espinhos, pegue as moedas e chegue na bandeira verde.
No celular aparecem botões na tela.

### Amigos (personagens jogáveis)

No guarda-roupa (**ROUPA** no menu) há duas abas: **ROUPAS** (os 10 looks do Brunucho) e **AMIGOS**, com personagens jogáveis feitos a partir
de fotos de amigos, com o nome aparecendo em cima deles. O Brunucho continua sendo o protagonista da história. Amigos atuais: **Stanley** e **Biel** (Gabriel Silva, corpo magrinho).
Pra adicionar um amigo, crie uma entrada em `FRIENDS`, no `src/config.js` (cores, `hairStyle`, `beard`, `glasses`, `cap`, `thickBrows`, `slim`, `pants`...).
As fotos **não** vão pro repositório, só o desenho pixelado.
### Telas de vários tamanhos

O jogo se ajusta ao aparelho: em celulares compridos (iPhone, Android 19,5:9, monitores ultrawide) a fase ocupa a **tela toda**, sem barras
pretas, mostrando um pedaço um pouco maior do cenário (largura de 960 a 1200). Os menus continuam centralizados. Em telas bem pequenas as
letras têm um tamanho mínimo para dar pra ler. A largura é calculada em `VIEW_W`, no `src/config.js`.

### Cenas dos poderes

Ao pegar um poder o jogo congela por **1 segundo** numa ceninha: faixas de cinema, raios girando, ícone gigante, título e uma
legenda engraçada, com emojis caindo/subindo/sendo sugados (*Six Seven*, *Aura*, *Olhar de Mil Jardas*, *Anjo Caído*, *Churros*,
*Coxinha*, *Tênis de Mola* e *Ímã*). Dá pra desligar em Opções > *Cenas dos poderes*. Os textos ficam em `POWER_SCENES`, no `src/scenes/Game.js`.

## Estrutura

```
index.html          carrega tudo
src/config.js       nome do jogador (PLAYER_NAME), física do personagem (velocidade, pulo...), cores dos cenários
src/levels.js       mapas das fases em texto  ← o lugar mais fácil para mexer!
src/textures.js     desenhos (gerados por código)
src/scenery.js      cenários (Rio, SP, Bahia, Escola Zacarias) e enfeites
src/estados.js      cartões-postais, fundo dos buracos, clima e temas dos estados
tools/gerar_fases.py  gerador e verificador das fases dos estados
tools/colocar_extras.py  coloca churros e memes novos nas fases (rode depois de regerar as fases)
src/audio.js        efeitos sonoros e vozes (gerados por código)
src/gamepad.js      suporte a controle de videogame
src/phaser-fix.js   correção de teclas repetidas no Phaser
lib/phaser.min.js   o Phaser (para jogar sem internet)
src/music.js        trilha sonora (músicas em notas)
src/achievements.js lista de conquistas
servidor.py          servidor local (HTTP + HTTPS) pra jogar no celular; jogar-no-celular.bat abre ele
src/boss.js         chefão final (Lula & Flávio)
src/scenes/         telas: Menu, Intro (conversa com a mãe), Ending (cena final), Game (o jogo), Pause, Options, GameOver, End, Toast (avisos)
```

## Criando fases

Abra `src/levels.js` e desenhe com caracteres:

```
#  terra/grama      =  tijolo       -  plataforma atravessável
C  moeda            E  inimigo      ^  espinho
P  início           K  checkpoint   G  bandeira final
R  pedra            Y  coqueiro (enfeite)
6  poder 67         A  aura
H  coxinha          T  tênis de mola    M  ímã de aura
Q  olhar de mil jardas                 W  anjo caído
O  plataforma móvel Z  trampolim        F  pombo voador
X  plataforma que cai
b  Bombardiro       p  Patapim          c  Bananini
l  Lirilì Larilà    r  Ballerina Cappuccina
L  poste de luz     S  Escola Zacarias (enfeite)
U  churros          s d y g z  memes clássicos (Skibidi, Doge, Nyan, Gigachad, Nazaré)
N  Neymar           V  Galvão Bueno
J  Casimiro         D  Ednaldo Pereira
```

O inimigo de cada fase depende do tema (veja `enemy` em `THEMES`, no `config.js`).
No tema `praia`, o `#` vira areia e os espinhos viram ouriços.

Para adicionar uma fase nova, copie um bloco `{ name, theme, map }` e cole no final da lista.
Os temas disponíveis são `dia`, `entardecer`, `noite`, `praia`, `escola`, `sp`, `rio` e `bahia` (dá para criar mais em `config.js`).

**Dica:** abra `index.html?fase=2` para ir direto para a fase 2, e `index.html?fase=2&mapa=1` para ver a fase inteira de uma vez.

## Ideias para continuar

- Trocar os desenhos por sprites próprios (carregar no `Boot.js` com os mesmos nomes)

## Créditos

- **Criado por:** Bruno Henrique de Souza (Brunucho): ideia, história, direção, personagens e design do jogo
  (67, aura, MOGGADO!, famosos, cenários do Brasil, chefão, intro e final com a Andreia).
- **Programação, desenhos em pixel e trilha sonora:** Claude (IA da Anthropic), com ajuda e pedidos do Brunucho.

Os créditos completos rolam no fim do jogo e na opção **CRÉDITOS** do menu (o texto fica em `CREDITS`, no `src/scenes/Credits.js`).

> ⚠️ **Este jogo é só brincadeira!** Todos os famosos e políticos aparecem como paródia e caricatura, sem intenção de
> ofender ninguém. Não leve a sério. Zoeira para todos os lados, sem preferência política.

## Backup (Git)

O projeto tem um repositório Git **local** (só no seu computador). Para salvar uma nova versão:

```
git add -A
git commit -m "o que mudou"
```

Para ver o histórico: `git log --oneline`.
