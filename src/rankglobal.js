// RANKING GLOBAL — todo mundo que joga aparece no mesmo placar (pontos e tempo).
// Fala com a função /api/ranking (veja api/ranking.js, que roda na Vercel). Se não tiver internet, ou o servidor ainda não estiver ligado,
// o jogo segue normal: o ranking local continua funcionando e o placar é reenviado na próxima vez.

const GlobalRank = {
  VERCEL: 'https://brunucho-world.vercel.app/api/ranking',

  // Endereço da API: no site da Vercel (e no servidor local de teste) é o mesmo endereço do jogo; em qualquer outro lugar
  // (arquivo aberto direto, Netlify...) aponta pro site da Vercel, então todo mundo cai no mesmo placar.
  base() {
    const forced = Storage.get('pp_rankapi', null);          // só pra testes
    if (forced) return forced;
    if (navigator.webdriver) return null;                    // navegador controlado por teste automático: não suja o ranking de verdade
    const h = location.hostname;
    if (location.protocol === 'file:') return this.VERCEL;
    if (/\.vercel\.app$/.test(h) || h === 'localhost' || h === '127.0.0.1' || /^(192\.168|10\.)/.test(h)) return '/api/ranking';
    return this.VERCEL;
  },

  // Cada aparelho tem um código só dele (guardado no navegador): é o que garante "uma vaga por jogador" no placar.
  id() {
    let id = Storage.get('pp_deviceId', null);
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      Storage.set('pp_deviceId', id);
    }
    return id;
  },

  name() { return Storage.get('pp_lastName', null); },
  setName(raw) {
    const n = String(raw || '').replace(/[^\p{L}\p{N}_.\- ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
    if (n) Storage.set('pp_lastName', n);
    return n;
  },

  // Guarda o melhor placar deste aparelho (pontos e, se zerou o jogo, o melhor tempo)
  remember(run) {
    const last = Storage.get('pp_rank_last', null) || { score: 0, time: 0, level: 1, deaths: 0, finished: false };
    const m = { ...last };
    if (run.score > last.score) { m.score = run.score; m.level = run.level; m.deaths = run.deaths; }
    if (run.finished && (!last.finished || run.time < last.time)) { m.finished = true; m.time = run.time; if (!m.score) m.score = run.score; }
    Storage.set('pp_rank_last', m);
    Storage.set('pp_rank_dirty', true);
    return m;
  },

  async call(path, opts = {}) {
    const base = this.base();
    if (!base) return { ok: false, offline: true, error: 'sem conexão' };
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 7000);
    try {
      const r = await fetch(base + path, { ...opts, signal: ctl.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) return { ok: false, offline: false, error: j.error || `erro ${r.status}` };
      return { ...j, ok: true };
    } catch (e) {
      return { ok: false, offline: true, error: 'sem conexão' };
    } finally { clearTimeout(to); }
  },

  // Envia o melhor placar deste aparelho (run = a partida que acabou, ou nada pra só reenviar). Precisa ter um nome.
  async submit(run) {
    const m = run ? this.remember(run) : Storage.get('pp_rank_last', null);
    if (!m || (!m.score && !m.finished)) return { ok: false, error: 'nada pra enviar' };
    if (!this.name()) return { ok: false, noName: true, error: 'sem nome' };
    const r = await this.call('', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: this.id(), name: this.name(), score: Math.round(m.score), time: Math.round(m.time || 0), level: m.level, deaths: m.deaths || 0, finished: !!m.finished }),
    });
    if (r.ok) Storage.set('pp_rank_dirty', false);
    return r;
  },

  // Reenvia o que ficou pendente (sem internet, ou antes de ter nome). Silencioso.
  async flush() {
    if (Storage.get('pp_rank_dirty', false) && this.name()) return this.submit(null);
    return { ok: false };
  },

  // Lista do placar global (sort: 'score' ou 'time')
  top(sort = 'score', limit = 10) {
    return this.call(`?sort=${sort}&limit=${limit}&me=${encodeURIComponent(this.id())}`);
  },
};
