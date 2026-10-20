// Configurações gerais do jogo. Mude os números para alterar a "sensação" do controle.

const WIDTH = 960;       // largura do "desenho" dos menus (centralizado na tela)
const HEIGHT = 540;
// Largura real do jogo: em celular/monitor mais comprido que 16:9 a fase ocupa a tela toda (sem barras pretas dos lados).
// Vai de 960 (16:9) até 1200 (20:9). Os menus continuam no desenho de 960, centralizados (UI_OFF = folga de cada lado).
const VIEW_W = (() => {
  const w = window.innerWidth || WIDTH, h = window.innerHeight || HEIGHT;
  const aspect = Math.max(w, h) / Math.max(1, Math.min(w, h));
  return Math.max(WIDTH, Math.min(1200, 2 * Math.round((HEIGHT * aspect) / 2)));
})();
const UI_OFF = (VIEW_W - WIDTH) / 2;
const TILE = 32;
const GROUND_Y = 14 * TILE; // altura do topo do chão (linha 14 do mapa)
const FONT = '"Trebuchet MS", Verdana, sans-serif';
const PLAYER_NAME = 'Brunucho';
// Aparelho de toque (celular, tablet): botões na tela, letras maiores e efeitos mais leves
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
function hint(teclado, toque) { return IS_TOUCH ? toque : teclado; }
const GAME_TITLE = `SUPER ${PLAYER_NAME.toUpperCase()}`;
const GAME_SUBTITLE = 'A Lenda da Aura Infinita';

// ---- Pontuação ----
const SCORE = {
  coin: 100,
  enemy: 200,          // multiplicado pelo combo (pisar em vários sem tocar o chão)
  power67: 670,
  aura: 1000,
  checkpoint: 500,
  death: -500,
  levelClear: 1000,
  noDeath: 2000,       // bônus: passar a fase sem morrer
  allCoins: 1500,      // bônus: pegar todas as moedas da fase
  parTime: 120,         // segundos: quanto mais rápido que isso, mais bônus
  timeBonus: 25,       // pontos por segundo abaixo do parTime
};

// ---- Dificuldade ----
const DIFFICULTY = {
  facil:   { name: 'Fácil',   lives: 6, enemySpeed: 0.9 },
  normal:  { name: 'Normal',  lives: 4, enemySpeed: 1.1 },
  dificil: { name: 'Difícil', lives: 3, enemySpeed: 1.5 },
};
const DIFFICULTY_KEYS = Object.keys(DIFFICULTY);
const COINS_PER_LIFE = 100;

// ---- Opções do jogador (tela de Opções) ----
const Settings = {
  defaults: { music: 0.5, sfx: 0.8, voices: true, myVoice: true, fx: IS_TOUCH ? 'leve' : 'completo', shake: true, cenas: true, difficulty: 'normal', allLevels: false },
  all() { return { ...this.defaults, ...Storage.get('pp_settings', {}) }; },
  get(key) { return this.all()[key]; },
  set(key, value) {
    Storage.set('pp_settings', { ...this.all(), [key]: value });
    if (typeof Sfx !== 'undefined') Sfx.applyVolumes();
  },
};
function difficulty() { return DIFFICULTY[Settings.get('difficulty')] || DIFFICULTY.normal; }

// ---- Progresso salvo: fases liberadas, estrelas e "Continuar" ----
const Progress = {
  data() {
    const d = { unlocked: 1, stars: {}, save: null, ...Storage.get('pp_progress', {}) };
    if (d.version !== 2 && (d.unlocked > 1 || Object.keys(d.stars).length || d.save)) {
      // antes eram 9 fases; agora são 32 (os estados entraram no meio)
      const map = { 0: 0, 1: 1, 2: 9, 3: 2, 4: 3, 5: 28, 6: 29, 7: 30, 8: 31 };
      const stars = {};
      for (const [k, v] of Object.entries(d.stars)) if (map[k] !== undefined) stars[map[k]] = v;
      d.stars = stars;
      const done = Object.keys(stars).map(Number);
      d.unlocked = Math.min(LEVELS.length, Math.max(2, ...done.map((i) => i + 2)));
      if (d.save && map[d.save.level] !== undefined) d.save.level = map[d.save.level];
      else d.save = null;
    }
    d.version = 2;
    return d;
  },
  write(d) { Storage.set('pp_progress', d); },
  isUnlocked(i) { return Settings.get('allLevels') || i < this.data().unlocked; },
  // chamado ao terminar uma fase
  completeLevel(i, { noDeath, allCoins }) {
    const d = this.data();
    d.unlocked = Math.max(d.unlocked, Math.min(i + 2, LEVELS.length));
    const s = d.stars[i] || { done: false, noDeath: false, allCoins: false };
    d.stars[i] = { done: true, noDeath: s.noDeath || noDeath, allCoins: s.allCoins || allCoins };
    this.write(d);
  },
  starCount(i) { const s = this.data().stars[i]; return s ? (s.done ? 1 : 0) + (s.noDeath ? 1 : 0) + (s.allCoins ? 1 : 0) : 0; },
  saveRun(level, stats) { const d = this.data(); d.save = { level, stats }; this.write(d); },
  clearRun() { const d = this.data(); d.save = null; this.write(d); },
  reset() { Storage.set('pp_progress', {}); Storage.set('pp_achievements', {}); Storage.set('pp_counters', {}); Storage.set('pp_ranking', []); Storage.set('pp_brainrot', []); Storage.set('pp_memes', []); Storage.set('pp_ufs', []); },
};

// ---- Inimigos famosos (letra no mapa → tipo) ----
// behavior: 'walker' anda e vira na beirada · 'caicai' se joga e rola · 'jumper' pula · 'shooter' fica parado e atira
const FAMOUS = {
  N: { key: 'neymar',  name: 'Neymar',          behavior: 'caicai',  speed: 70, lines: ['CAI-CAI!', 'AIIII!', 'FOI PÊNALTI!', 'ME DERRUBARAM!'] },
  V: { key: 'galvao',  name: 'Galvão Bueno',    behavior: 'shooter', speed: 0,  lines: ['HAJA CORAÇÃO!', 'É TETRAAA!', 'BEM, AMIGOS!', 'OLHA O GOL!'] },
  J: { key: 'caze',    name: 'Casimiro',        behavior: 'jumper',  speed: 50, lines: ['VAMO!', 'MEU DEUS!', 'QUE ISSO?!', 'SENSACIONAL!'] },
  D: { key: 'ednaldo', name: 'Ednaldo Pereira', behavior: 'walker',  speed: 45, lines: ['Vale nada, vale tudo!', 'Ednaldo Pereira!'] },
};

// ---- Memes brainrot (letra minúscula no mapa → tipo) ----
// behavior: 'bomber' voa e solta bomba · 'hopper' anda pulando · 'walker' anda · 'dancer' gira e avança ·
// 'sprayer' cospe jatos · 'charger' dispara na sua direção · 'nyan' voa em ondas · 'confuser' inverte seus controles
const MEMES = {
  b: { key: 'bombardiro', group: 'brainrot', name: 'Bombardiro Crocodilo', behavior: 'bomber', speed: 85, lines: ['BOMBARDIRO CROCODILO!', 'Bombas a caminho!'] },
  p: { key: 'patapim', group: 'brainrot', name: 'Brr Brr Patapim', behavior: 'hopper', speed: 110, lines: ['Brr brr patapim!', 'Patapim!'] },
  c: { key: 'bananini', group: 'brainrot', name: 'Chimpanzini Bananini', behavior: 'walker', speed: 115, lines: ['Chimpanzini bananini!', 'Bananini!'] },
  l: { key: 'lirili', group: 'brainrot', name: 'Lirilì Larilà', behavior: 'walker', speed: 35, hp: 2, lines: ['Lirilì larilà!', 'Sou duro de moggar!'] },
  r: { key: 'ballerina', group: 'brainrot', name: 'Ballerina Cappuccina', behavior: 'dancer', speed: 0, lines: ['Ballerina Cappuccina!', 'Mi mi mi!'] },
  // memes clássicos da internet
  s: { key: 'skibidi', group: 'meme', name: 'Skibidi Toilet', behavior: 'sprayer', speed: 0, lines: ['Skibidi dop dop!', 'Dop dop yes yes!'] },
  d: { key: 'doge', group: 'meme', name: 'Doge', behavior: 'charger', speed: 38, lines: ['Much wow!', 'Such enemy!', 'Very jump!'] },
  y: { key: 'nyan', group: 'meme', name: 'Nyan Cat', behavior: 'nyan', speed: 0, lines: ['Nyan nyan nyan!'] },
  g: { key: 'gigachad', group: 'meme', name: 'Gigachad', behavior: 'walker', speed: 32, hp: 3, lines: ['Yes.', 'Sigma.', 'Chad.'] },
  z: { key: 'nazare', group: 'meme', name: 'Nazaré Confusa', behavior: 'confuser', speed: 0, lines: ['Quanto é 2 + 2?', 'Eu não entendo!', 'Mas... como?'] },
};

// Ranking dos 5 melhores (salvo no navegador)
const Ranking = {
  list() { return Storage.get('pp_ranking', []); },
  add(entry) {
    const list = [...this.list(), { ...entry, date: new Date().toLocaleDateString('pt-BR') }]
      .sort((a, b) => b.score - a.score).slice(0, 5);
    Storage.set('pp_ranking', list);
    return list.findIndex((e) => e.score === entry.score && e.time === entry.time); // posição (-1 = ficou fora)
  },
};

function formatScore(n) { return String(Math.max(0, Math.round(n))).padStart(7, '0'); }

// Roupas do Brunucho (escolha no menu: ROUPA ou tecla C). Mude as cores à vontade!
// Opções de cada roupa: tank (regata) · longSleeves · pants (calça comprida) · socks/socksStripe (meiões) ·
// shoes ('tenis', 'chinelo', 'social', 'chuteira', 'pantufa', 'bota', 'meia') · collar/trim/badge (camisa de time) ·
// vneck (terno) · cape · mask · belt · hood/orange (capivara) · headband · nightcap · sleepy · sunglasses · boxers...
const HAIR = { hair: 0xc9a25e, hairDark: 0x8e6a35, hairLight: 0xe6c88a }; // loiro escuro
const SKIN = { skin: 0xf3c9a4, skinDark: 0xdcaa82 };
const OUTFITS = {
  praia: {
    name: 'Praia', desc: 'Blusa preta, bermuda rosa, óculos na cabeça e chinelo (igual na foto).',
    colors: { ...HAIR, ...SKIN, shirt: 0x22222a, shirtDark: 0x111116, shorts: 0xf27a8a, shortsDark: 0xd65a6d },
    longSleeves: true, sunglasses: true, shoes: 'chinelo',
  },
  diesel: {
    name: 'Diesel', desc: 'Blusa azul da Diesel e bermuda de moletom azul-clara.',
    colors: { ...HAIR, skin: 0xffdcc4, skinDark: 0xf0bfa0,
      shirt: 0x1e3f8f, shirtDark: 0x152d68, shorts: 0x6a98e0, shortsDark: 0x4f7cc4 },
    chestBadge: true, drawstring: true, shoes: 'tenis',
  },
  cueca: {
    name: 'Cueca Lendária', desc: 'Regata, cueca de bolinhas e meiões. Sem vergonha nenhuma.',
    colors: { ...HAIR, ...SKIN, shirt: 0xf2f2f2, shirtDark: 0xcfcfcf, shorts: 0xe53935, shortsDark: 0xb71c1c },
    tank: true, boxers: { waist: 0xffffff, dot: 0xffffff }, shoes: 'meia', socks: 0xf5f5f5,
  },
  terno: {
    name: 'Terno', desc: 'Pronto para a reunião mais importante da vida.',
    colors: { ...HAIR, ...SKIN, shirt: 0x20242e, shirtDark: 0x14171e, shorts: 0x20242e, shortsDark: 0x14171e },
    longSleeves: true, pants: true, vneck: { shirt: 0xffffff, tie: 0xd62828 }, shoes: 'social',
  },
  palmeiras: {
    name: 'Palmeiras', desc: 'Conjunto completo: camisa, calção e meiões verdes. Avanti!',
    colors: { ...HAIR, ...SKIN, shirt: 0x0a7a40, shirtDark: 0x075f31, shorts: 0xffffff, shortsDark: 0xd8d8d8 },
    collar: 0xffffff, trim: 0xffffff, badge: { bg: 0xffffff, fg: 0x0a7a40, letter: 'P' },
    socks: 0x0a7a40, socksStripe: 0xffffff, shoes: 'chuteira',
  },
  selecao: {
    name: 'Seleção', desc: 'Camisa amarela, calção azul e meião branco. Rumo ao hexa!',
    colors: { ...HAIR, ...SKIN, shirt: 0xffd814, shirtDark: 0xd9b400, shorts: 0x1f4fb3, shortsDark: 0x173c8a },
    collar: 0x0f8a3c, trim: 0x0f8a3c, badge: { bg: 0x0f8a3c, fg: 0xffd814, letter: null },
    socks: 0xffffff, socksStripe: 0x1f4fb3, shoes: 'chuteira',
  },
  pijama: {
    name: 'Pijama', desc: 'Listrado, com touca e pantufa. Com muito sono.',
    colors: { ...HAIR, ...SKIN, shirt: 0x8fc1f2, shirtDark: 0x6aa1da, shorts: 0x8fc1f2, shortsDark: 0x6aa1da },
    longSleeves: true, pants: true, shirtStripes: 0xffffff, stripes: 0xffffff, nightcap: 0x4a7ac8, sleepy: true, shoes: 'pantufa',
  },
  heroi: {
    name: 'Super-Brunucho', desc: 'Capa, máscara e o emblema B. Aura nível máximo.',
    colors: { ...HAIR, ...SKIN, shirt: 0x1e4fa8, shirtDark: 0x153a80, shorts: 0x1e4fa8, shortsDark: 0x153a80 },
    longSleeves: true, pants: true, cape: 0xd62828, capeDark: 0x9a1b1b, mask: 0x1b1b2a, belt: 0xffd23f,
    badge: { bg: 0xffd23f, fg: 0xd62828, letter: 'B' }, shoes: 'bota', shoeColor: 0xd62828,
  },
  academia: {
    name: 'Sigma da Academia', desc: 'Regata, bandana e muito foco. Hoje é dia de perna.',
    colors: { ...HAIR, ...SKIN, shirt: 0x1b1b22, shirtDark: 0x0f0f14, shorts: 0x4a4a52, shortsDark: 0x34343a },
    tank: true, headband: 0xd62828, sideStripe: 0xd62828, shoes: 'tenis',
  },
  capivara: {
    name: 'Fantasia de Capivara', desc: 'Capuz de capivara, com a laranja na cabeça, claro.',
    colors: { ...HAIR, ...SKIN, shirt: 0x8a6142, shirtDark: 0x6b4a30, shorts: 0x6b4a30, shortsDark: 0x4f361f },
    longSleeves: true, hood: 0x8a6142, hoodDark: 0x6b4a30, orange: true, pocket: 0x6b4a30, shoes: 'bota', shoeColor: 0x4f361f,
  },
};

// ---- Amigos: personagens jogáveis (seção AMIGOS do guarda-roupa). O Brunucho continua sendo o protagonista da história.
// Cada amigo é desenhado a partir de uma foto. Opções de desenho (veja drawPlayer em textures.js):
//   hairStyle: 'curto' | 'topete' | 'raspado' | 'cacheado' | 'longo' | 'careca'    beard: cor (+ beardAlpha p/ barba por fazer)
//   glasses: cor da armação   cap: cor do boné   thickBrows: sobrancelha grossa   slim: corpo magrinho   pants: calça comprida   smile: sorrisão   hoodie: moletom
const FRIENDS = {
  stanley: {
    name: 'Stanley', who: 'Stanley', desc: 'Camisa branca, cabelo castanho curto de lado e sobrancelha marcante. Amigo do Brunucho!',
    colors: { hair: 0x4a3426, hairDark: 0x2e2018, hairLight: 0x6a4a36, skin: 0xc98f64, skinDark: 0xa8734d,
      shirt: 0xf4f4f4, shirtDark: 0xd2d2d6, shorts: 0x2b3a5c, shortsDark: 0x1f2b46 },
    hairStyle: 'curto', thickBrows: true, shoes: 'tenis',
  },
  biel: {
    name: 'Biel', who: 'Biel', desc: 'Gabriel Silva. Magrelo de dar dó, cabelo cacheadinho e sobrancelha que fala sozinha. Camiseta preta e calça cinza.',
    colors: { hair: 0x1f1610, hairDark: 0x120d09, hairLight: 0x3e2d21, skin: 0xcf9d74, skinDark: 0xae7b55,
      shirt: 0x1d1d22, shirtDark: 0x101014, shorts: 0x8d9099, shortsDark: 0x6f7279 },
    hairStyle: 'cacheado', thickBrows: true, slim: true, pants: true, shoes: 'tenis',
  },
  yan: {
    name: 'Yan', who: 'Yan', desc: 'Sorrisão de ponta a ponta, cabelo baixinho, barbinha no queixo e moletom cinza. Sempre de joinha!',
    colors: { hair: 0x1a1410, hairDark: 0x0f0b08, hairLight: 0x33281f, skin: 0x9a6a46, skinDark: 0x7b5035,
      shirt: 0x50535a, shirtDark: 0x3b3d43, shorts: 0x34363c, shortsDark: 0x25272b },
    hairStyle: 'raspado', beard: 0x2a1c14, beardAlpha: 0.55, smile: true, longSleeves: true, pocket: 0x464950,
    hoodie: { cord: 0xe0e0e0, print: 0x2a2b30 }, pants: true, shoes: 'tenis',
  },
};
Object.keys(FRIENDS).forEach((k) => { OUTFITS[k] = { ...FRIENDS[k], friend: true }; });
const OUTFIT_KEYS = Object.keys(OUTFITS);                                   // todos (gera as texturas)
const BRU_KEYS = OUTFIT_KEYS.filter((k) => !OUTFITS[k].friend);             // roupas do Brunucho
const FRIEND_KEYS = OUTFIT_KEYS.filter((k) => OUTFITS[k].friend);           // amigos
function currentOutfit() {
  const key = Storage.get('pp_outfit', OUTFIT_KEYS[0]);
  return OUTFITS[key] ? key : OUTFIT_KEYS[0];
}
function playerTexture() { return `player_${currentOutfit()}`; }
// Nome de quem está sendo jogado (Brunucho ou um amigo)
function heroName() { const o = OUTFITS[currentOutfit()]; return o.friend ? o.who : PLAYER_NAME; }

const PHYS = {
  gravity: 1400,
  maxSpeed: 260,      // velocidade máxima andando
  groundAccel: 2000,  // aceleração no chão
  airAccel: 1300,     // aceleração no ar
  groundDecel: 2400,  // freio ao soltar a tecla (chão)
  airDecel: 600,      // freio ao soltar a tecla (ar)
  jump: 560,          // força do pulo
  jumpCut: 0.45,      // soltar o botão cedo = pulo mais baixo
  coyote: 0.1,        // segundos em que ainda dá pra pular depois de sair da borda
  jumpBuffer: 0.12,   // aperto do pulo "lembrado" antes de tocar o chão
  stomp: 380,         // quique ao pisar num inimigo
  enemySpeed: 72,
};

// Índices dos blocos no tileset gerado em textures.js
const TILES = {
  DIRT: 0, GRASS: 1, BRICK: 2, ONEWAY: 3, SAND: 4, SAND_TOP: 5, ROCK: 6,
  CALCADAO: 7, SIDEWALK: 8, CONCRETE: 9, COBBLE: 10, CLAY: 11, CLAY_TOP: 12, WOOD: 13, SANDSTONE: 14, REDBRICK: 15,
};
const TILE_COUNT = 16;

// Bloco "=" de cada região (o tema escolhe com "block"): madeira, arenito ou tijolo vermelho
const BLOCKS = { madeira: TILES.WOOD, arenito: TILES.SANDSTONE, tijolo: TILES.REDBRICK };

// Tipo de chão de cada tema: [bloco de cima, bloco de baixo]
const GROUNDS = {
  grama:    [TILES.GRASS, TILES.DIRT],
  areia:    [TILES.SAND_TOP, TILES.SAND],
  calcadao: [TILES.CALCADAO, TILES.SAND],    // calçadão de Copacabana
  calcada:  [TILES.SIDEWALK, TILES.CONCRETE], // calçada de cidade
  pedra:    [TILES.COBBLE, TILES.DIRT],       // paralelepípedo do Pelourinho
  cerrado:  [TILES.CLAY_TOP, TILES.CLAY],     // terra vermelha com capim (cerrado, Norte, sertão)
};

const THEMES = {
  dia:        { sky: 'sun', skyTop: 0x4fa3e0, skyBottom: 0xbfe6ff, hillFar: 0x9fd8a4, hillNear: 0x5cb85c, clouds: 0.9, enemy: 'caramelo' },
  entardecer: { sky: 'sunset', skyTop: 0x3a2a6b, skyBottom: 0xf28c5a, hillFar: 0x8a5a8c, hillNear: 0x5b3b6b, clouds: 0.5, enemy: 'capivara' },
  noite:      { sky: 'moon', skyTop: 0x0b1030, skyBottom: 0x2d3a78, hillFar: 0x2b3466, hillNear: 0x1a2048, clouds: 0.25, enemy: 'tungtung' },
  // Praia: chão de areia, mar com ilhas no fundo, Tralalero Tralala e ouriços.
  praia:      { sky: 'sun', skyTop: 0x3d8fd6, skyBottom: 0xcdeeff, hillFar: 0x2f6b3a, clouds: 0.9, sea: true,
                ground: 'areia', enemy: 'tralalero', spike: 'urchin' },

  // ---- Cenários do Brasil. "layers" = camadas do fundo (factor: quanto acompanham a câmera) ----
  escola: { sky: 'sun', skyTop: 0x5fb4ef, skyBottom: 0xdff3ff, clouds: 0.9, ground: 'calcada', enemy: 'tungtung', spike: 'cone',
    layers: [
      { key: 'hills', y: HEIGHT - 290, factor: 0.12, tint: 0xa8d8b0 },
      { key: 'rua', y: HEIGHT - 295, factor: 0.35 },
    ] },
  sp: { skyTop: 0x6f7885, skyBottom: 0xe3b98f, clouds: 0.6, ground: 'calcada', enemy: 'caramelo', spike: 'cone', rain: true,
    layers: [
      { key: 'sp_far', y: HEIGHT - 390, factor: 0.12 },
      { key: 'sp_near', y: HEIGHT - 375, factor: 0.3 },
    ] },
  rio: { sky: 'sun', skyTop: 0x2f86d6, skyBottom: 0xd6f0ff, clouds: 0.8, ground: 'calcadao', enemy: 'capivara', spike: 'urchin',
    layers: [
      { key: 'rio_mountains', y: HEIGHT - 330, factor: 0.12 },
      { key: 'sea', y: HEIGHT - 200, factor: 0.4, wave: true },
    ] },
  // Brasília: chefão final (Lula & Flávio)
  brasilia: { sky: 'sunset', skyTop: 0x2b1a4a, skyBottom: 0xff9a5a, clouds: 0.5, ground: 'calcada', enemy: 'tungtung', spike: 'cone', music: 'noite',
    layers: [
      { key: 'hills', y: HEIGHT - 280, factor: 0.1, tint: 0x6a4a6a, scaleY: 0.6 },
      { key: 'brasilia', y: HEIGHT - 375, factor: 0.25 },
    ] },
  bahia: { sky: 'sun', skyTop: 0x2a9fe0, skyBottom: 0xffe2a8, clouds: 0.7, ground: 'pedra', enemy: 'tralalero', spike: 'urchin',
    layers: [
      { key: 'ba_city', y: HEIGHT - 360, factor: 0.12 },
      { key: 'pelourinho', y: HEIGHT - 275, factor: 0.35 },
    ] },
};

// Decorações que aparecem sozinhas no chão de cada cenário (desenhos em scenery.js)
const DECOR_SETS = {
  dia:        ['dec_flor', 'dec_flor', 'dec_arbusto', 'dec_pedrinha', 'dec_arvore'],
  entardecer: ['dec_flor', 'dec_arbusto', 'dec_pedrinha', 'dec_arvore'],
  noite:      ['dec_cogumelo', 'dec_cogumelo', 'dec_pedrinha', 'dec_arbusto'],
  praia:      ['dec_concha', 'dec_castelo', 'dec_guardasol', 'dec_concha'],
  rio:        ['dec_guardasol', 'dec_concha', 'dec_castelo', 'dec_concha'],
  bahia:      ['dec_flor', 'dec_barraca', 'dec_arbusto', 'dec_flor'],
  sp:         ['dec_lixeira', 'dec_hidrante', 'dec_placa', 'dec_lixeira'],
  escola:     ['dec_lixeira', 'dec_arbusto', 'dec_flor', 'dec_placa'],
  brasilia:   ['dec_ipe', 'dec_arbusto', 'dec_lixeira', 'dec_flor'],
  colonial:   ['dec_flor', 'dec_arbusto', 'dec_lixeira', 'dec_flor'],
  sul:        ['dec_araucaria', 'dec_flor', 'dec_arbusto', 'dec_pedrinha'],
  pantanal:   ['dec_arbusto', 'dec_flor', 'dec_arvore', 'dec_pedrinha'],
  cerrado:    ['dec_ipe', 'dec_pedrinha', 'dec_arbusto', 'dec_arvore'],
  mata:       ['dec_arvore', 'dec_arbusto', 'dec_flor', 'dec_arvore'],
  sertao:     ['dec_mandacaru', 'dec_pedrinha', 'dec_mandacaru', 'dec_arbusto'],
};
const BIG_DECOR = new Set(['dec_arvore', 'dec_guardasol', 'dec_barraca', 'dec_ipe', 'dec_placa', 'dec_araucaria', 'palm', 'dec_buriti', 'dec_tuiuiu', 'dec_jangada', 'dec_bandeirinha']);

// localStorage pode falhar (aba anônima etc.), então tudo fica protegido.
const Storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignora */ }
  },
};

function textStyle(size, color = '#ffffff') {
  if (IS_TOUCH && size < 18) size = Math.round(size * 1.3);   // no celular a tela é pequena: letra miúda não dá pra ler
  // tela bem pequena (ou janela pequena): garante um mínimo de ~12px na tela de verdade, sem inflar mais que 1,5x
  const sc = Math.min(window.innerWidth / VIEW_W, window.innerHeight / HEIGHT);
  if (sc > 0 && size * sc < 12) size = Math.round(Math.min(size * 1.5, 12 / sc));
  return { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#1b1b2a', strokeThickness: Math.max(3, size / 6) };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, '0');
  return m > 0 ? `${m}:${s}` : `${s}s`;
}

// Céu em degradê + nuvens + morros com parallax. Usado no menu e nas fases.
// full = true nas fases (com silhuetas e o fundo dos buracos); o menu e o fim usam a versão simples.
function createBackdrop(scene, theme, full = false) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(-10);
  g.fillGradientStyle(theme.skyTop, theme.skyTop, theme.skyBottom, theme.skyBottom, 1);
  g.fillRect(0, 0, VIEW_W, HEIGHT);
  // sol, pôr do sol ou lua com estrelas
  const sky = scene.add.graphics().setScrollFactor(0).setDepth(-9.5);
  if (theme.sky === 'sun') {
    sky.fillStyle(0xfff3a0, 0.25); sky.fillCircle(690, 110, 58);
    sky.fillStyle(0xfff3a0, 0.5); sky.fillCircle(690, 110, 44);
    sky.fillStyle(0xffe066, 1); sky.fillCircle(690, 110, 34);
  } else if (theme.sky === 'sunset') {
    sky.fillStyle(0xffb36b, 0.3); sky.fillCircle(760, 300, 110);
    sky.fillStyle(0xff8a3d, 1); sky.fillCircle(760, 300, 70);
  } else if (theme.sky === 'moon') {
    for (let i = 0; i < 70; i++) {
      sky.fillStyle(0xffffff, 0.3 + ((i * 37) % 7) / 10);
      sky.fillRect((i * 137) % VIEW_W, (i * 59) % 260, 2, 2);
    }
    sky.fillStyle(0xf4f1ea, 0.2); sky.fillCircle(690, 96, 40);
    sky.fillStyle(0xf4f1ea, 1); sky.fillCircle(690, 96, 28);
    sky.fillStyle(0xd9d4c7, 1); sky.fillCircle(682, 90, 6); sky.fillCircle(698, 106, 4);
  }
  let layers = theme.layers;
  if (!layers && theme.sea) {
    // Ilhas no horizonte + mar com ondas que se mexem sozinhas
    layers = [
      { key: 'hills', y: HEIGHT - 290, factor: 0.15, tint: theme.hillFar, scaleY: 0.6 },
      { key: 'sea', y: HEIGHT - 200, factor: 0.4, wave: true },
    ];
  } else if (!layers) {
    layers = [
      { key: 'hills', y: HEIGHT - 270, factor: 0.25, tint: theme.hillFar },
      { key: 'hills2', y: HEIGHT - 200, factor: 0.45, tint: theme.hillNear },
    ];
  }
  layers = [{ key: 'clouds', y: 30, factor: 0.1, drift: 0.006, alpha: theme.clouds }, ...layers];
  if (full && theme.sil) layers.push({ key: theme.sil.key, bottom: GROUND_Y, factor: 0.55, tint: theme.sil.tint, alpha: theme.sil.alpha });
  if (full && theme.pit) layers.push({ key: theme.pit.key, y: theme.pit.y, factor: 1, wave: theme.pit.wave, tint: theme.pit.tint, depth: -6.5 });

  const sprites = layers.map((l, i) => {
    const h = scene.textures.get(l.key).getSourceImage().height;
    const y = l.bottom !== undefined ? l.bottom - h : l.y;
    const s = scene.add.tileSprite(0, y, VIEW_W, h, l.key).setOrigin(0).setScrollFactor(0).setDepth(l.depth !== undefined ? l.depth : -9 + i);
    if (l.tint) s.setTint(l.tint);
    if (l.alpha !== undefined) s.setAlpha(l.alpha);
    if (l.scaleY) s.setScale(1, l.scaleY);
    return { s, l };
  });
  return {
    update(scrollX, time) {
      for (const { s, l } of sprites) {
        s.tilePositionX = scrollX * l.factor + (l.drift || 0) * time + (l.wave ? Math.sin(time * 0.0015) * 12 : 0);
      }
    },
  };
}

// ---- Tela cheia no celular ----
// O Chrome só aceita tela cheia no "levantar o dedo" (pointerup), nunca no "encostar" (pointerdown).
// iPhone/Safari não tem tela cheia para jogos: lá o jeito é "Adicionar à Tela de Início" (o jogo vira app).
const FS = {
  standalone: () => (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) || window.navigator.standalone === true,
  available: (scale) => !!(scale.fullscreen && scale.fullscreen.available),
  toggle(scale) {
    if (scale.isFullscreen) { scale.stopFullscreen(); return true; }
    scale.startFullscreen();
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* sem trava de tela */ }
    return true;
  },
  iosTip: 'No iPhone: toque em Compartilhar (□↑) e "Adicionar à Tela de Início". Aí o jogo abre em tela cheia.',
};
