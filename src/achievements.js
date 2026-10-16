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
  { id: 'brainrot',    icon: '🐊', name: 'Brainrot Completo',     desc: 'Moggar os 5 memes brainrot (Bombardiro, Patapim, Bananini, Lirilì, Ballerina)' },
  // --- poderes ---
  { id: 'sixseven',    icon: '6️⃣', name: 'SIX SEVEN!',            desc: 'Pegar o poder 67' },
  { id: 'sixseven10',  icon: '7️⃣', name: '67 Lover',              desc: 'Pegar o poder 67 dez vezes', counter: 'p67', goal: 10 },
  { id: 'mog67',       icon: '🌈', name: 'Atropelamento 67',      desc: 'Moggar 5 inimigos num mesmo modo 67' },
  { id: 'escudo',      icon: '🛡️', name: 'Aura Blindada',         desc: 'Ser salvo pelo escudo de aura' },
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
  { id: 'roupa',       icon: '👕', name: 'Fashionista',           desc: 'Trocar de roupa no menu' },
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

// Fases que dão conquista ao terminar (pelo tema)
const THEME_ACHIEVEMENT = { escola: 'escola', sp: 'sp', rio: 'rio', bahia: 'bahia', praia: 'praia' };
