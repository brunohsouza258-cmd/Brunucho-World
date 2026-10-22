// RANKING GLOBAL do Super Brunucho — função da Vercel (pasta /api).
// Guarda tudo num Redis gratuito (Upstash) pela API REST dele. A Vercel cria as variáveis de ambiente quando você conecta o banco ao projeto:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (ou UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
//
//   GET  /api/ranking?sort=score|time&limit=20&me=<id do aparelho>  → { sort, entries: [{ pos, name, score, time, level, deaths, finished, mine }], total, totalTime, me: { posScore, posTime } }
//   POST /api/ranking   { id, name, score, time, level, deaths, finished }  → { ok, posScore, posTime }
//
// Cada aparelho (id) tem UM lugar no ranking: o melhor placar dele (por pontos) e o melhor tempo de quem zerou o jogo (por tempo).
// Não é à prova de trapaça (o jogo roda no aparelho de cada um), mas tem validação de nome/valores e limite de envios por IP.

const KEYS = { players: 'bru:players', score: 'bru:score', time: 'bru:time' };

function envRedis() {
  const env = process.env;
  let url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  let token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {                                      // prefixo personalizado na Vercel (ex.: STORAGE_REST_API_URL): procura pelo final do nome
    const kUrl = Object.keys(env).find((k) => /_(REST_API|REDIS_REST)_URL$/.test(k));
    const kTok = Object.keys(env).find((k) => /_(REST_API|REDIS_REST)_TOKEN$/.test(k) && !/READ_ONLY/.test(k));   // o token que escreve, não o só-leitura
    url = url || (kUrl && env[kUrl]);
    token = token || (kTok && env[kTok]);
  }
  if (!url || !token) return null;
  return async (cmds) => {                                   // várias ordens de uma vez (pipeline); devolve a lista de resultados
    const r = await fetch(`${url}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(cmds) });
    if (!r.ok) throw new Error(`redis ${r.status}`);
    const out = await r.json();
    return out.map((x) => { if (x && x.error) throw new Error(x.error); return x.result; });
  };
}

function cleanName(raw) {
  const n = String(raw == null ? '' : raw).replace(/[^\p{L}\p{N}_.\- ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  return n || 'Anônimo';
}

const int = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};

function makeHandler(getRedis) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };

    const redis = getRedis();
    if (!redis) return send(503, { ok: false, error: 'ranking global ainda não está ligado' });

    try {
      if (req.method === 'GET') {
        const q = req.query || Object.fromEntries(new URL(req.url, 'http://x').searchParams);
        const sort = q.sort === 'time' ? 'time' : 'score';
        const limit = int(q.limit, 1, 50) || 20;
        const me = typeof q.me === 'string' && /^[\w-]{8,64}$/.test(q.me) ? q.me : null;
        const top = sort === 'time' ? ['ZRANGE', KEYS.time, 0, limit - 1] : ['ZREVRANGE', KEYS.score, 0, limit - 1];
        const [ids, totalScore, totalTime, meScore, meTime] = await redis([
          top, ['ZCARD', KEYS.score], ['ZCARD', KEYS.time],
          me ? ['ZREVRANK', KEYS.score, me] : ['ECHO', '-'], me ? ['ZRANK', KEYS.time, me] : ['ECHO', '-'],
        ]);
        let entries = [];
        if (ids.length) {
          const [infos] = await redis([['HMGET', KEYS.players, ...ids]]);
          entries = ids.map((id, i) => {
            const p = infos[i] ? JSON.parse(infos[i]) : {};
            return { pos: i + 1, name: p.name || 'Anônimo', score: p.score || 0, time: p.time || null, level: p.level || 0, deaths: p.deaths || 0, finished: !!p.time, mine: id === me };
          });
        }
        return send(200, {
          ok: true, sort, entries, total: totalScore, totalTime,
          me: { posScore: typeof meScore === 'number' ? meScore + 1 : null, posTime: typeof meTime === 'number' ? meTime + 1 : null },
        });
      }

      if (req.method === 'POST') {
        let b = req.body;
        if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
        if (!b || typeof b !== 'object') return send(400, { ok: false, error: 'pedido inválido' });
        const id = typeof b.id === 'string' && /^[\w-]{8,64}$/.test(b.id) ? b.id : null;
        const score = int(b.score, 0, 5000000), level = int(b.level, 1, 32), deaths = int(b.deaths, 0, 9999), time = int(b.time, 0, 400000);
        const finished = b.finished === true;
        if (!id || score === null || level === null || deaths === null || time === null) return send(400, { ok: false, error: 'valores inválidos' });
        if (finished && time < 300) return send(400, { ok: false, error: 'tempo impossível' });
        if (score === 0 && !finished) return send(400, { ok: false, error: 'sem pontos' });

        const fwd = String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || 'ip').split(',')[0].trim();
        const [gate, old] = await redis([['SET', `bru:rl:${fwd}`, '1', 'NX', 'EX', 4], ['HGET', KEYS.players, id]]);
        if (gate === null) return send(429, { ok: false, error: 'devagar! tente de novo em alguns segundos' });

        const p = old ? JSON.parse(old) : { score: 0, time: null, level: 1, deaths: 0 };
        p.name = cleanName(b.name);
        const cmds = [];
        if (score > p.score) { p.score = score; p.level = level; p.deaths = deaths; cmds.push(['ZADD', KEYS.score, score, id]); }
        if (finished && (!p.time || time < p.time)) { p.time = time; cmds.push(['ZADD', KEYS.time, time, id]); }
        p.ts = Date.now();
        cmds.unshift(['HSET', KEYS.players, id, JSON.stringify(p)]);
        await redis(cmds);
        const [posScore, posTime, total] = await redis([['ZREVRANK', KEYS.score, id], ['ZRANK', KEYS.time, id], ['ZCARD', KEYS.score]]);
        return send(200, { ok: true, name: p.name, posScore: typeof posScore === 'number' ? posScore + 1 : null, posTime: typeof posTime === 'number' ? posTime + 1 : null, total });
      }

      return send(405, { ok: false, error: 'método não permitido' });
    } catch (e) {
      return send(500, { ok: false, error: 'erro no servidor' });
    }
  };
}

module.exports = makeHandler(envRedis);
module.exports.makeHandler = makeHandler;
module.exports.cleanName = cleanName;
