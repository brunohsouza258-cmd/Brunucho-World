// Conquistas. Para criar uma nova: adicione na lista e chame Achievements.unlock('id') onde fizer sentido
// (ou use um contador com Achievements.count('nome') + "counter/goal").

const ACHIEVEMENTS = [
  // --- história ---
  { id: 'fugiu',       icon: '🩴', name: 'Fugiu da Chinelada',   desc: 'Assistir a conversa com a Andreia até o fim' },
  { id: 'fase1',       icon: '👣', name: 'Primeiros Passos',      desc: 'Passar da fase 1' },
  { id: 'escola',      icon: '🏫', name: 'Matou Aula',            desc: 'Passar pela Escola Zacarias' },
  { id: 'sp',          icon: '🌧️', name: 'Terra da Garoa',        desc: 'Passar por São Paulo' },
  { id: 'rio',         icon: '⛰️', name: 'Cidade Maravilhosa',    desc: 'Passar pelo Rio de Janeiro' },
  { id: 'bahia',       icon: '🥁', name: 'Axé!',                  desc: 'Passar por Salvador' },
  { id: 'praia',       icon: '🏖️', name: 'Dia de Praia',          desc: 'Passar pela Praia do Brunucho' },
  { id: 'chefao',      icon: '🏛️', name: 'Moggou a Política',     desc: 'Derrotar o Lula e o Flávio' },
  { id: 'chefao_limpo', icon: '😇', name: 'Sem Comprar Briga',   desc: 'Vencer o chefão final sem morrer' },
  { id: 'casa',        icon: '🏠', name: 'De Volta pra Casa',     desc: 'Ver a cena final até o fim (sem pular)' },
  { id: 'reg_sudeste',  icon: '🏙️', name: 'Sudeste Completo',      desc: 'Passar por SP, RJ, ES e MG' },
  { id: 'reg_sul',      icon: '🧉', name: 'Bah, Tchê!',            desc: 'Passar por PR, SC e RS' },
  { id: 'reg_centro',   icon: '🐆', name: 'Pantaneiro',            desc: 'Passar por MS, MT, GO e DF' },
  { id: 'reg_norte',    icon: '🌳', name: 'Desbravador da Amazônia', desc: 'Passar pelos 7 estados do Norte' },
  { id: 'reg_nordeste', icon: '🌵', name: 'Arretado!',             desc: 'Passar pelos 9 estados do Nordeste' },
  { id: 'brasil',       icon: '🇧🇷', name: 'Turista Nacional',      desc: 'Passar pelos 26 estados e pelo DF' },
  { id: 'zerou',       icon: '♾️', name: 'Aura Infinita',         desc: 'Zerar o jogo' },
  { id: 'zerou_dif',   icon: '👑', name: 'Modo Andreia',          desc: 'Zerar o jogo no Difícil' },
  // --- mog ---
  { id: 'mog1',        icon: '😎', name: 'Primeiro Mog',          desc: 'Moggar um inimigo', counter: 'mogs', goal: 1 },
  { id: 'mog50',       icon: '🗿', name: 'Mogador Serial',        desc: 'Moggar 50 inimigos', counter: 'mogs', goal: 50 },
  { id: 'mog200',      icon: '🔥', name: 'Lenda do Mog',          desc: 'Moggar 200 inimigos', counter: 'mogs', goal: 200 },
  { id: 'combo3',      icon: '✖️', name: 'Combo Triplo',          desc: 'Fazer um combo x3' },
  { id: 'combo5',      icon: '🧠', name: 'Sigma do Combo',        desc: 'Fazer um combo x5' },
  // --- famosos ---
  { id: 'galvao',      icon: '🎙️', name: 'Haja Coração!',         desc: 'Moggar o Galvão Bueno' },
  { id: 'neymar',      icon: '⚽', name: 'Foi Pênalti?',          desc: 'Moggar o Neymar enquanto ele rola' },
  { id: 'caze',        icon: '🎧', name: 'VAMO!',                 desc: 'Moggar o Casimiro no ar' },
  { id: 'ednaldo',     icon: '🎤', name: 'Vale Tudo',             desc: 'Moggar o Ednaldo Pereira' },
  { id: 'memes_all',   icon: '👑', name: 'Rei dos Memes',         desc: 'Moggar Skibidi, Doge, Nyan Cat, Gigachad e Nazaré' },
  { id: 'churros',     icon: '🍬', name: 'Grandão',               desc: 'Comer o churros e ficar gigante' },
  { id: 'esmagador',   icon: '🦍', name: 'Esmagador de Chad',     desc: 'Derrubar o Gigachad com uma pisada enquanto está grande' },
  { id: 'confuso',     icon: '😵', name: 'Quanto é 2 + 2?',       desc: 'Ser confundido pela Nazaré' },
  { id: 'brainrot',    icon: '🐊', name: 'Brainrot Completo',     desc: 'Moggar os 5 memes brainrot (Bombardiro, Patapim, Bananini, Lirilì, Ballerina)' },
  // --- poderes ---
  { id: 'sixseven',    icon: '6️⃣', name: 'SIX SEVEN!',            desc: 'Pegar o poder 67' },
  { id: 'sixseven10',  icon: '7️⃣', name: '67 Lover',              desc: 'Pegar o poder 67 dez vezes', counter: 'p67', goal: 10 },
  { id: 'mog67',       icon: '🌈', name: 'Atropelamento 67',      desc: 'Moggar 5 inimigos num mesmo modo 67' },
  { id: 'escudo',      icon: '🛡️', name: 'Aura Blindada',         desc: 'Ser salvo pelo escudo de aura' },
  { id: 'olhar',       icon: '👁️', name: 'Olhar de Mil Jardas',   desc: 'Parar o tempo com o olhar vazio' },
  { id: 'anjo_pegou',  icon: '🪽', name: 'Asas de Anjo',          desc: 'Pegar o poder Anjo Caído' },
  { id: 'anjo',        icon: '😇', name: 'Anjo Caído',            desc: 'Ser salvo de um buraco pela auréola' },
  { id: 'planador',    icon: '🕊️', name: 'Planador',              desc: 'Planar por 3 segundos seguidos' },
  { id: 'coxinha',     icon: '🍗', name: 'Lanchinho',             desc: 'Comer uma coxinha (vida extra)' },
  { id: 'tenis',       icon: '👟', name: 'Tênis Novo',            desc: 'Pegar o Tênis de Mola' },
  { id: 'ima',         icon: '🧲', name: 'Atraente',              desc: 'Pegar o Ímã de Aura' },
  // --- moedas e pontos ---
  { id: 'moedas100',   icon: '🪙', name: 'Cofrinho',              desc: 'Juntar 100 moedas (total)', counter: 'coins', goal: 100 },
  { id: 'moedas500',   icon: '💰', name: 'Rico de Aura',          desc: 'Juntar 500 moedas (total)', counter: 'coins', goal: 500 },
  { id: 'todasmoedas', icon: '✨', name: 'Perfeccionista',        desc: 'Pegar todas as moedas de uma fase' },
  { id: 'pontos50k',   icon: '📈', name: 'Cinquentão',            desc: 'Fazer 50.000 pontos numa partida' },
  { id: 'pontos100k',  icon: '💎', name: 'Milionário de Aura',    desc: 'Fazer 100.000 pontos numa partida' },
  // --- habilidade ---
  { id: 'intocavel',   icon: '🧘', name: 'Intocável',             desc: 'Passar uma fase sem morrer' },
  { id: 'speedrun',    icon: '⏱️', name: 'Speedrunner',           desc: 'Passar uma fase em menos de 40 segundos' },
  // --- zoeira ---
  { id: 'morreu10',    icon: '💀', name: '-10.000 de Aura',       desc: 'Morrer 10 vezes (total)', counter: 'deaths', goal: 10 },
  { id: 'gameover',    icon: '😱', name: 'A Andreia Te Achou',    desc: 'Tomar um Game Over' },
  { id: 'dublador',    icon: '🎤', name: 'Dublador',              desc: 'Gravar a sua própria voz no jogo' },
  { id: 'closet',      icon: '🧥', name: 'Closet Completo',       desc: 'Vestir todas as roupas do guarda-roupa' },
  { id: 'roupa',       icon: '👕', name: 'Fashionista',           desc: 'Trocar de roupa no menu' },
  { id: 'amigo_pisado', icon: '🤝', name: 'Só de Brincadeira',    desc: 'Pisar num amigo (ele aguenta)' },
  { id: 'turma_toda',  icon: '🧑‍🤝‍🧑', name: 'A Turma Toda',          desc: 'Pisar em todos os amigos (de brincadeira)' },
  { id: 'saia',        icon: '🌀', name: 'Gira, Gira!',           desc: 'Derrubar um inimigo de longe com a rajada da saia da Lara' },
  { id: 'tocha',       icon: '🔥', name: 'Tomb Raider de Cotia',  desc: 'Derrubar um inimigo com o tiro ou a tocha da Ana Júlia' },
  { id: 'escola_entrou', icon: '🏫', name: 'Aluno Pontual',        desc: 'Entrar na Escola Zacarias' },
  { id: 'terceiro_d',  icon: '🚪', name: 'Terceiro D',            desc: 'Chegar na sala do 3º D, no fim do corredor' },
  { id: 'eva',         icon: '📝', name: 'Nota Dez',              desc: 'Derrotar a professora Eva na sala de aula' },
  { id: 'paraiba',     icon: '🏍️', name: 'Moto Derrubada',        desc: 'Derrubar o Paraíba de cima da moto' },
  { id: 'virais',      icon: '📱', name: 'Por Dentro da Internet', desc: 'Derrotar todos os memes virais de 2026' },
  { id: 'cotia',       icon: '🏙️', name: 'Turista em Cotia',      desc: 'Visitar o Centro de Cotia' },
  { id: 'cliente',     icon: '🛍️', name: 'Cliente Fiel',          desc: 'Fazer a primeira compra no Centro de Cotia' },
  { id: 'esbanjador',  icon: '💸', name: 'Esbanjador',            desc: 'Gastar 1.000 moedas no Centro de Cotia' },
  { id: 'rei_compras', icon: '👑', name: 'Rei das Compras',       desc: 'Comprar em todas as 6 lojas do Centro de Cotia' },
  { id: 'jogou_turma', icon: '🎮', name: 'Jogando em Turma',      desc: 'Jogar uma fase com cada amigo' },
];

const Achievements = {
  unlocked() { return Storage.get('pp_achievements', {}); },
  has(id) { return !!this.unlocked()[id]; },

  unlock(id) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a || this.has(id)) return false;
    Storage.set('pp_achievements', { ...this.unlocked(), [id]: new Date().toLocaleDateString('pt-BR') });
    if (typeof game !== 'undefined') {
      const toast = game.scene.getScene('Toast');
      if (toast) toast.show(a);
    }
    return true;
  },

  // Contadores que somam entre partidas (mogs, moedas, mortes...)
  count(counter, n = 1) {
    const c = Storage.get('pp_counters', {});
    c[counter] = (c[counter] || 0) + n;
    Storage.set('pp_counters', c);
    ACHIEVEMENTS.filter((a) => a.counter === counter && c[counter] >= a.goal).forEach((a) => this.unlock(a.id));
    return c[counter];
  },
  counter(name) { return Storage.get('pp_counters', {})[name] || 0; },

  progress() { return { done: Object.keys(this.unlocked()).length, total: ACHIEVEMENTS.length }; },
};

// Estados visitados (para as conquistas por região)
function visitState(themeKey) {
  const t = THEMES[themeKey] || {};
  const info = t.uf ? [t.uf, t.region] : OLD_THEME_UF[themeKey];
  if (!info) return;
  const seen = new Set(Storage.get('pp_ufs', []));
  seen.add(info[0]);
  Storage.set('pp_ufs', [...seen]);
  for (const r of Object.values(REGIONS)) {
    if (r.ufs.every((u) => seen.has(u))) Achievements.unlock(r.ach);
  }
  const all = Object.values(REGIONS).flatMap((r) => r.ufs);
  if (all.every((u) => seen.has(u))) Achievements.unlock('brasil');
}

// Fases que dão conquista ao terminar (pelo tema)
const THEME_ACHIEVEMENT = { escola: 'escola', sp: 'sp', rio: 'rio', bahia: 'bahia', praia: 'praia' };
