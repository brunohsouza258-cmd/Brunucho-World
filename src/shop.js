// Carteira e lojas do CENTRO DE COTIA.
// As moedas pegas numa fase entram na carteira quando você CHEGA NA BANDEIRA (assim reiniciar a fase não vira "farm" de moedas).
// Tipos de item:  stock = consumível (vale na próxima fase; cada fase gasta 1 de cada tipo que você tiver) ·
//                 perm = compra única, vale para sempre · tier = melhora em níveis · outfit = roupa nova · pet = companheiro.

const Wallet = {
  get() { return Storage.get('pp_wallet', 0); },
  add(n) { if (n > 0) Storage.set('pp_wallet', this.get() + Math.round(n)); },
  spend(n) {
    if (this.get() < n) return false;
    Storage.set('pp_wallet', this.get() - n);
    Storage.set('pp_gasto', Storage.get('pp_gasto', 0) + n);
    return true;
  },
};

const SHOPS = [
  { id: 'padaria', name: 'Padaria Pão Quente', icon: '🥖', wall: 0xe3b778, trim: 0xb9854a, awning: [0xd62828, 0xffffff], greet: 'Pãozinho quentinho saindo agora!',
    items: [
      { id: 'coxinha', kind: 'stock', icon: '🍗', name: 'Coxinha', desc: '+1 vida na próxima fase', price: 50 },
      { id: 'paodequeijo', kind: 'stock', icon: '🧀', name: 'Pão de queijo', desc: 'Começa a próxima fase com escudo de aura', price: 40 },
      { id: 'churros', kind: 'stock', icon: '🥖', name: 'Churros', desc: 'Começa a próxima fase grandão (aguenta 1 golpe)', price: 60 },
      { id: 'caldo', kind: 'stock', icon: '🥤', name: 'Caldo de cana', desc: 'Ímã de moedas por 12 s no começo da fase', price: 30 },
    ] },
  { id: 'sapataria', name: 'Sapataria Pé de Ouro', icon: '👟', wall: 0x78a9dc, trim: 0x3f6ea8, awning: [0x1f5fbf, 0xffffff], greet: 'Calçado bom é calçado que não deixa na mão!',
    items: [
      { id: 'tenis', kind: 'perm', icon: '🦘', name: 'Tênis de Mola', desc: 'Pulo duplo em todas as fases, pra sempre', price: 400 },
      { id: 'chuteira', kind: 'perm', icon: '⚡', name: 'Chuteira Turbo', desc: 'Você corre 6% mais rápido', price: 200 },
      { id: 'palmilha', kind: 'perm', icon: '☁️', name: 'Palmilha Macia', desc: 'Você pula 5% mais alto', price: 200 },
    ] },
  { id: 'mercado', name: 'Mercadão da Aura', icon: '🛒', wall: 0x93d08f, trim: 0x4f9a52, awning: [0x2e9e4a, 0xffffff], greet: 'Aqui tem de tudo, até aura em promoção!',
    items: [
      { id: 'cartao', kind: 'tier', max: 3, prices: [120, 250, 450], icon: '💳', name: 'Cartão Fidelidade', desc: '+1 vida no começo de cada partida (por nível)' },
      { id: 'cesta', kind: 'perm', icon: '🧺', name: 'Cesta de Moedas', desc: 'As moedas rendem 25% mais pontos', price: 250 },
      { id: 'ima', kind: 'perm', icon: '🧲', name: 'Ímã de Bolso', desc: 'Puxa as moedas que estão por perto', price: 300 },
    ] },
  { id: 'moda', name: 'Moda Cotia', icon: '👕', wall: 0xf0a8c6, trim: 0xc4568a, awning: [0xd63a8a, 0xffffff], greet: 'Estilo é tudo! Entre e experimente.',
    items: [
      { id: 'skatista', kind: 'outfit', icon: '🛹', price: 150 },
      { id: 'doutor', kind: 'outfit', icon: '🩺', price: 200 },
      { id: 'cowboy', kind: 'outfit', icon: '🤠', price: 250 },
    ] },
  { id: 'farmacia', name: 'Farmácia Saúde', icon: '💊', wall: 0xdff1ef, trim: 0x2aa198, awning: [0x00a39a, 0xffffff], greet: 'Cuide-se! Saúde em primeiro lugar.',
    items: [
      { id: 'vitamina', kind: 'perm', icon: '🍊', name: 'Vitamina C', desc: '+1 segundo de invencibilidade ao renascer', price: 200 },
      { id: 'energetico', kind: 'stock', icon: '⚡', name: 'Energético', desc: 'Começa a próxima fase com o poder SIX SEVEN (6,7 s)', price: 90 },
    ] },
  { id: 'petshop', name: 'Pet Shop Caramelo', icon: '🐶', wall: 0xf5d9a0, trim: 0xd58b2e, awning: [0xe8892b, 0xffffff], greet: 'Todo herói precisa de um companheiro!',
    items: [
      { id: 'caramelo', kind: 'pet', icon: '🐕', name: 'Cachorro Caramelo', desc: 'Um amigão que segue você pelas fases', price: 200 },
      { id: 'pombo', kind: 'pet', icon: '🕊️', name: 'Pombo de estimação', desc: 'Voa ao seu lado (sem fazer bagunça)', price: 150 },
    ] },
];

const Shop = {
  state() { return Storage.get('pp_shop', {}); },
  save(s) { Storage.set('pp_shop', s); },

  // item por id (roupas pegam nome e descrição da tabela OUTFITS)
  item(id) {
    for (const s of SHOPS) {
      const it = s.items.find((x) => x.id === id);
      if (it) return this.fill(it);
    }
    return null;
  },
  fill(it) {
    if (it.kind !== 'outfit') return it;
    const o = OUTFITS[it.id];
    return { ...it, name: o.name, desc: o.desc, price: o.shop.price };
  },
  shopOf(id) { return SHOPS.find((s) => s.items.some((x) => x.id === id)); },

  level(id) { const o = this.state().own || {}; return o[id] || 0; },      // 0 = não tem · 1 = tem · tier: nível
  stock(id) { const s = this.state().stock || {}; return s[id] || 0; },
  price(it) { return it.kind === 'tier' ? it.prices[Math.min(this.level(it.id), it.max - 1)] : it.price; },
  maxed(it) { return it.kind === 'tier' ? this.level(it.id) >= it.max : (it.kind !== 'stock' && this.level(it.id) >= 1); },
  ownsOutfit(key) { return !OUTFITS[key].shop || this.level(key) >= 1; },

  // Compra um item. Devolve { ok, msg }.
  buy(raw) {
    const it = this.fill(raw);
    if (this.maxed(it)) return { ok: false, msg: it.kind === 'tier' ? 'Já está no nível máximo!' : 'Você já tem esse item.' };
    const price = this.price(it);
    if (Wallet.get() < price) return { ok: false, msg: `Faltam ${price - Wallet.get()} moedas.` };
    Wallet.spend(price);
    const s = this.state();
    s.own = s.own || {}; s.stock = s.stock || {}; s.shops = s.shops || {};
    if (it.kind === 'stock') s.stock[it.id] = (s.stock[it.id] || 0) + 1;
    else s.own[it.id] = (s.own[it.id] || 0) + 1;
    if (it.kind === 'pet') s.pet = it.id;                       // o último pet comprado vira o companheiro
    s.shops[this.shopOf(it.id).id] = 1;
    this.save(s);
    Achievements.unlock('cliente');
    if (Storage.get('pp_gasto', 0) >= 1000) Achievements.unlock('esbanjador');
    if (SHOPS.every((sh) => s.shops[sh.id])) Achievements.unlock('rei_compras');
    return { ok: true, msg: `Comprou: ${it.name}!` };
  },

  // Efeitos permanentes
  perks() {
    const own = this.state().own || {};
    return {
      speed: own.chuteira ? 1.06 : 1, jump: own.palmilha ? 1.05 : 1, coin: own.cesta ? 1.25 : 1,
      magnet: own.ima ? 70 : 0, doubleJump: !!own.tenis, extraLives: own.cartao || 0, respawnInvuln: own.vitamina ? 1 : 0,
    };
  },

  // Gasta 1 de cada consumível que você tem e devolve a lista (vale para UMA fase)
  takeBuffs() {
    const s = this.state();
    const got = [];
    Object.keys(s.stock || {}).forEach((id) => { if (s.stock[id] > 0) { s.stock[id]--; got.push(id); } });
    if (got.length) this.save(s);
    return got;
  },

  pet() { return this.state().pet || null; },
  setPet(id) { const s = this.state(); s.pet = id; this.save(s); },
};

// Vida extra inicial (Cartão Fidelidade) soma com a da dificuldade
function startLives() { return difficulty().lives + Shop.perks().extraLives; }

// Companheiro (cachorro ou pombo) que segue o jogador. Usa as posições antigas do jogador para ficar um pouco atrás.
class PetFollower {
  constructor(scene) {
    this.scene = scene;
    this.kind = Shop.pet();
    this.spr = null;
    if (!this.kind) return;
    this.fly = this.kind === 'pombo';
    this.spr = scene.add.sprite(-100, -100, this.fly ? 'pombo' : 'caramelo').setOrigin(0.5, 1).setDepth(5);
    if (this.fly && scene.anims.exists('pombo_fly')) this.spr.play('pombo_fly');
    this.trail = [];
    this.dir = 1;
    this.lastX = null;
  }

  follow(x, bottom, time) {
    if (!this.spr) return;
    if (this.lastX !== null && Math.abs(x - this.lastX) > 0.3) this.dir = Math.sign(x - this.lastX);
    this.moving = this.lastX !== null && Math.abs(x - this.lastX) > 0.3;
    this.lastX = x;
    this.trail.push([x, bottom]);
    if (this.trail.length > 26) this.trail.shift();
    const t = this.trail[0];
    const px = t[0] - this.dir * 34;
    let py = t[1];
    if (this.fly) py = t[1] - 44 + Math.sin(time * 0.006) * 7;
    else if (this.moving) py -= Math.abs(Math.sin(time * 0.02)) * 3;
    this.spr.setPosition(px, py).setFlipX(this.dir > 0);
  }

  destroy() { if (this.spr) this.spr.destroy(); this.spr = null; }
}
