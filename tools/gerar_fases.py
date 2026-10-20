# AVISO: "--write" REGENERA as 23 fases dos estados e sobrescreve qualquer ajuste manual nelas.
# As fases feitas à mão (Primeiros Passos, Escola, SP, RJ, Vale, Bahia, Praia, Pico Final, Brasília) não são mexidas.
# "--check" só confere se TODAS as fases têm caminho do início ao checkpoint e à bandeira (bom rodar depois de editar o levels.js).
"""Gera as fases dos estados e reorganiza levels.js na ordem da viagem pelo Brasil.
Também tem um verificador que confere se dá pra chegar do início ao checkpoint e à bandeira.

  python gen_states.py            -> só gera e verifica (não grava)
  python gen_states.py --write    -> grava no levels.js
  python gen_states.py --check    -> só verifica todas as fases do levels.js
"""
import re, random, sys

H = 17
BASE = 14                 # linha do topo do chão normal
SOLID = set('#=R')
LEVELS_JS = 'C:/Users/Bruno/OneDrive/Desktop/Projeto2.0/src/levels.js'
ENEMY_CHARS = 'ENVJDFbpclr'

# ---------------------------------------------------------------- verificador
def check_level(rows):
    W = max(len(r) for r in rows)
    g = [list(r.ljust(W)) for r in rows]
    floor = [[False] * W for _ in range(H + 1)]
    for y in range(H):
        for x in range(W):
            if g[y][x] in SOLID or g[y][x] in '-X':    # chão, prancha atravessável e plataforma que cai
                floor[y][x] = True
            if g[y][x] == 'O':                     # plataforma móvel: vale como chão no trecho que ela percorre
                for xx in range(max(0, x - 4), min(W, x + 5)): floor[y][xx] = True
    def solid(x, y): return 0 <= x < W and 0 <= y < H and g[y][x] in SOLID
    def stand(x, y):
        return 0 <= x < W and 0 <= y < H - 1 and not solid(x, y) and g[y][x] != '^' and floor[y + 1][x] and g[y + 1][x] != '^'
    def land(x, y):                                # cai a partir de (x, y) até achar chão
        while y < H - 1:
            if g[y][x] == '^' or solid(x, y): return None
            if floor[y + 1][x] and g[y + 1][x] != '^': return y
            y += 1
        return None
    def find(chs):
        return [(x, y) for y in range(H) for x in range(W) if g[y][x] in chs]
    start = find('P')[0]
    def reach(src):
        seen = {src}; todo = [src]
        while todo:
            x, y = todo.pop()
            tramp = g[y][x] == 'Z' or (y + 1 < H and g[y + 1][x] == 'Z')
            nxt = []
            for d in (-1, 1):
                if stand(x + d, y): nxt.append((x + d, y))
                elif 0 <= x + d < W and not solid(x + d, y):
                    ly = land(x + d, y)
                    if ly is not None: nxt.append((x + d, ly))
            jh = 7 if tramp else 3
            for x2 in range(max(0, x - 7), min(W, x + 8)):
                for y2 in range(max(0, y - jh), min(H - 1, y + 8)):
                    if (x2, y2) in seen or not stand(x2, y2): continue
                    dx, dy = abs(x2 - x), y - y2
                    step = 1 if x2 > x else -1
                    lim = 5 + min(2, -dy) if dy <= 0 else (5 if dy == 1 else 4 if dy == 2 else 3)
                    # com 5 blocos de corrida atrás, dá pra saltar um buraco de 5 (distância 6)
                    if dy == 0 and all(stand(x - step * k, y) for k in range(0, 5)): lim = 6
                    if tramp and dy > 0: lim = 4
                    if dx > lim: continue
                    top = min(y, y2) - 1
                    if any(solid(x, yy) for yy in range(top, y)): continue          # cabeça livre na subida
                    if any(solid(cx, top) or solid(cx, top + 1) for cx in range(x + step, x2, step)): continue
                    nxt.append((x2, y2))
            for n in nxt:
                if n not in seen: seen.add(n); todo.append(n)
        return seen
    r = reach(start)
    goal = find('GB')
    def near_goal(rset):
        return any(abs(x - gx) <= 1 and abs(y - gy) <= 1 for (x, y) in rset for (gx, gy) in goal)
    ok_goal = near_goal(r)
    ok_cp = all(any(abs(x - kx) <= 1 and abs(y - ky) <= 1 for (x, y) in r) for (kx, ky) in find('K'))
    cp_goal = all(near_goal(reach((kx, ky)) if stand(kx, ky) else r) for (kx, ky) in find('K'))
    return ok_goal and ok_cp and cp_goal, dict(goal=ok_goal, checkpoint=ok_cp, cp_to_goal=cp_goal)

# ---------------------------------------------------------------- zonas de respeito
def danger_columns(rows):
    """Colunas onde NÃO pode ter inimigo nem espinho solto: as 8 antes de um buraco grande (corrida de impulso)
    e as 3 depois (onde o jogador pousa). Buraco grande = 5 ou mais colunas sem chão nem plataforma."""
    W = max(len(r) for r in rows)
    padded = [r.ljust(W) for r in rows]
    # buraco de verdade: nenhum chão nem plataforma na coluna (de cima pra baixo)
    hole = [all(padded[y][x] not in '#R=-XO' for y in range(7, H)) for x in range(W)]
    out = set(); x = 0
    while x < W:
        if hole[x]:
            x0 = x
            while x < W and hole[x]: x += 1
            if x - x0 >= 5:
                out.update(range(max(0, x0 - 8), x0)); out.update(range(x, min(W, x + 4)))
        else:
            x += 1
    return out

# ---------------------------------------------------------------- gerador
class Gen:
    def __init__(self, seed, diff):
        self.r = random.Random(seed)
        self.d = diff                       # 0 (fácil) .. 1 (difícil)
        self.cols = []                      # lista de colunas (cada uma é lista de H chars)
        self.items = []

    def col(self, top=BASE, solid='#'):
        c = [' '] * H
        if top is not None:
            for y in range(top, H): c[y] = solid
        self.cols.append(c)
        return len(self.cols) - 1

    def put(self, x, y, ch):
        if self.cols[x][y] == ' ': self.cols[x][y] = ch

    # ---- pedaços ----
    def flat(self, n, coins=True, enemy=True):
        xs = [self.col() for _ in range(n)]
        if coins:
            for x in xs[1:-1:2]: self.put(x, BASE - 1, 'C')
        if enemy and n >= 6: self.enemy_at(xs[n // 2], BASE - 1)
        return xs

    def gap(self, w):
        xs = [self.col(None) for _ in range(w)]
        for i, x in enumerate(xs):
            self.put(x, BASE - 3 if 0 < i < w - 1 else BASE - 2, 'C')
        return xs

    def long_gap(self):                     # buraco de 5 blocos: precisa da corrida de 6 antes
        self.flat(6, coins=False, enemy=False)
        self.gap(5)

    def flyer_gap(self):                    # buraco de 5 com um pombo voando por cima
        self.flat(6, coins=False, enemy=False)
        xs = self.gap(5)
        self.put(xs[2], BASE - 4, 'F')

    def spikes(self):
        self.flat(3, enemy=False)
        n = self.r.choice([1, 2, 2, 3]) if self.d > 0.5 else self.r.choice([1, 2])
        for _ in range(n):
            x = self.col(); self.put(x, BASE - 1, '^')
        self.flat(3, enemy=False)

    def spike_run(self):                    # ^^ __ ^^ __ ^^: pula de ilhinha em ilhinha
        self.flat(3, enemy=False)
        for _ in range(3 if self.d < 0.6 else 4):
            for _ in range(2):
                x = self.col(); self.put(x, BASE - 1, '^'); self.put(x, BASE - 3, 'C')
            self.flat(2, coins=False, enemy=False)
        self.flat(2, coins=False, enemy=False)

    def spike_pit(self):
        w = self.r.randint(6, 7 + int(2 * self.d))
        xs = [self.col(BASE + 1) for _ in range(w)]
        for x in xs: self.cols[x][BASE] = '^'
        pl = xs[1:-1]
        n = 2 if self.d > 0.6 else 3
        for x in pl[len(pl) // 2 - n // 2: len(pl) // 2 - n // 2 + n]:
            self.cols[x][BASE - 2] = '-'; self.put(x, BASE - 3, 'C')

    def crumble(self):                      # plataformas que caem meio segundo depois que você pisa
        self.flat(3, enemy=False)
        xs = [self.col(None) for _ in range(9)]
        for i in (1, 3, 5, 7):
            y = BASE - (0 if (i // 2) % 2 == 0 else 1)
            self.cols[xs[i]][y] = 'X'
            self.put(xs[i], y - 2, 'C')

    def plateau(self):
        n = self.r.randint(6, 10)
        xs = [self.col(BASE - 2) for _ in range(n)]
        for x in xs[1:-1:2]: self.put(x, BASE - 3, 'C')
        self.enemy_at(xs[n // 2], BASE - 3)

    def steps(self):
        for top in (BASE - 1, BASE - 1, BASE - 2, BASE - 2, BASE - 3, BASE - 3, BASE - 3):
            self.col(top)
        self.put(len(self.cols) - 2, BASE - 4, 'C'); self.put(len(self.cols) - 1, BASE - 4, 'C')

    def floats(self, oneway=False):
        ch = '-' if oneway else '='
        k = self.r.randint(2, 3)
        self.gap(2)
        for i in range(k):
            y = BASE - 2 - (i % 2)
            for j in range(3):
                x = self.col(None); self.cols[x][y] = ch; self.put(x, y - 1, 'C')
            for _ in range(3 if self.r.random() < 0.6 else 4): self.col(None)

    def mover(self):
        xs = [self.col(None) for _ in range(9)]
        self.cols[xs[4]][BASE - 2] = 'O'
        for x in (xs[2], xs[6]): self.put(x, BASE - 4, 'C')

    def bonus_ledge(self):
        # trampolim + plataforma alta com prêmio (opcional, por cima do caminho)
        xs = self.flat(9, coins=False, enemy=False)
        self.put(xs[1], BASE - 1, 'Z')
        for x in xs[3:7]: self.cols[x][BASE - 7] = '='; self.put(x, BASE - 8, 'C')
        self.items.append((xs[5], BASE - 8))

    def bomber_field(self):
        xs = self.flat(12, coins=True, enemy=False)
        self.put(xs[4], 6, 'b')
        if self.d > 0.6: self.put(xs[9], 5, 'b')

    # ---- inimigos e itens ----
    def spawn_cell(self, ch, x, y):
        """Onde o inimigo `ch` nasce: bombardeiro voa alto (linha 6), pombo flutua 2 blocos acima do chão."""
        if ch == 'b':
            if any(self.cols[xx][6] == 'b' or self.cols[xx][5] == 'b' for xx in range(max(0, x - 12), min(len(self.cols), x + 13))): return None
            return 6
        if ch == 'F': return y - 2 if self.cols[x][y - 2] == ' ' else None
        return y

    def enemy_at(self, x, y):
        if self.r.random() > 0.8: return
        if any(self.cols[xx][y] in ENEMY_CHARS for xx in range(max(0, x - 3), min(len(self.cols), x + 4))): return
        ch = self.r.choice(self.pool)
        yy = self.spawn_cell(ch, x, y)
        if yy is not None: self.put(x, yy, ch)

    def rows(self):
        return [''.join(c[y] for c in self.cols) for y in range(H)]

    def populate(self):
        # espalha inimigos em trechos de chão retos, longe de início/checkpoint, de espinhos e de buracos
        W = len(self.cols)
        target = 10 + int(10 * self.d)
        keep = [x for x in range(W) for y in range(H) if self.cols[x][y] in 'PKG']
        def standing(x):
            for y in range(H - 1):
                if self.cols[x][y + 1] == '#' and self.cols[x][y] in ' C': return y
            return None
        count = sum(1 for x in range(W) for y in range(H) if self.cols[x][y] in ENEMY_CHARS)
        danger = danger_columns(self.rows())
        xs = list(range(12, W - 18))
        self.r.shuffle(xs)
        for x in xs:
            if count >= target: break
            y = standing(x)
            if y is None or any(abs(x - k) < 7 for k in keep) or x in danger: continue
            if not all(standing(xx) == y for xx in (x - 2, x - 1, x + 1, x + 2)): continue
            area = [self.cols[xx][yy] for xx in range(x - 5, x + 6) for yy in range(max(0, y - 2), min(H, y + 2))]
            if any(c in ENEMY_CHARS for c in area): continue
            if any(self.cols[xx][yy] == '^' for xx in range(x - 2, x + 3) for yy in range(H)): continue
            ch = self.r.choice(self.pool)
            yy = self.spawn_cell(ch, x, y)
            if yy is None: continue
            self.cols[x][yy] = ch
            count += 1

    def add_spikes(self, target):
        # garante um mínimo de espinhos soltos no chão reto (sempre longe de início, checkpoint e bandeira)
        W = len(self.cols)
        keep = [x for x in range(W) for y in range(H) if self.cols[x][y] in 'PKG']
        count = sum(self.cols[x][y] == '^' for x in range(W) for y in range(H))
        def standing(x):
            for y in range(H - 1):
                if self.cols[x][y + 1] == '#' and self.cols[x][y] in ' C': return y
            return None
        danger = danger_columns(self.rows())
        xs = list(range(12, W - 18)); self.r.shuffle(xs)
        for x in xs:
            if count >= target: break
            y = standing(x)
            if y is None or self.cols[x][y] != ' ' or any(abs(x - k) < 9 for k in keep): continue
            w = 2 if (self.r.random() < 0.4 + 0.3 * self.d and x + 1 < W and self.cols[x + 1][y] == ' ') else 1
            if not all(standing(xx) == y for xx in range(x - 3, x + 2 + w)): continue   # corrida antes, folga depois
            if any(xx in danger for xx in range(x - 1, x + w + 1)): continue
            if any(self.cols[xx][yy] not in ' C' for yy in range(max(0, y - 3), y) for xx in range(x - 2, x + 3)): continue
            if any(self.cols[xx][yy] == '^' for yy in range(H) for xx in range(x - 5, x + 6)): continue
            if any(self.cols[xx][yy] in ENEMY_CHARS for yy in range(max(0, y - 2), y + 1) for xx in range(x - 3, x + 4)): continue
            for i in range(w): self.cols[x + i][y] = '^'; count += 1

    def build(self, length, extra, item_kinds):
        d = self.d
        self.pool = 'E' * max(1, 3 - int(3 * d)) + extra * (1 + int(2 * d))
        self.flat(10, coins=True, enemy=False)
        self.put(2, BASE - 1, 'P')
        menu = ['flat', 'flat', 'steps', 'plateau', 'gap', 'spikes', 'spikes', 'spike_run', 'floats', 'planks', 'mover', 'bonus',
                'crumble', 'long_gap', 'spike_pit']
        if d > 0.4: menu += ['long_gap', 'crumble', 'spike_run', 'flyer_gap', 'bomber', 'spikes', 'spike_pit'] * (1 + int(2 * d))
        marks = [0.33, 0.66] if length >= 165 else [0.5]
        while len(self.cols) < length:
            if marks and len(self.cols) > length * marks[0]:
                xs = self.flat(7, coins=False, enemy=False); self.put(xs[3], BASE - 1, 'K'); marks.pop(0)
                continue
            c = self.r.choice(menu)
            if c == 'flat': self.flat(self.r.randint(4, 8 - int(2 * d)))
            elif c == 'gap': self.flat(3, enemy=False); self.gap(self.r.randint(3, 4 + int(d > 0.6)))
            elif c == 'spikes': self.spikes()
            elif c == 'spike_run': self.spike_run()
            elif c == 'spike_pit': self.flat(3, enemy=False); self.spike_pit()
            elif c == 'plateau': self.flat(3, enemy=False); self.plateau()
            elif c == 'steps': self.flat(2, enemy=False); self.steps()
            elif c == 'floats': self.flat(3, enemy=False); self.floats()
            elif c == 'planks': self.flat(3, enemy=False); self.floats(oneway=True)
            elif c == 'mover': self.flat(3, enemy=False); self.mover()
            elif c == 'bonus': self.bonus_ledge()
            elif c == 'bomber': self.bomber_field()
            elif c == 'long_gap': self.long_gap()
            elif c == 'flyer_gap': self.flyer_gap()
            elif c == 'crumble': self.crumble()
            self.flat(2, coins=False, enemy=False)
        end = self.flat(14, coins=True, enemy=False)
        self.populate()
        self.add_spikes(12 + int(16 * d))
        self.put(end[8], BASE - 1, 'G')
        self.col(0, 'R')
        # itens: 1 coxinha + poderes; dois blocos acima do chão em trechos retos
        spots = [x for x in range(12, len(self.cols) - 16)
                 if self.cols[x][BASE] == '#' and self.cols[x][BASE - 1] == ' ' and self.cols[x][BASE - 2] == ' '
                 and all(self.cols[xx][BASE] == '#' for xx in (x - 1, x + 1))]
        self.r.shuffle(spots)
        kinds = item_kinds[:]
        for (x, y) in self.items[:1]:
            if kinds: self.cols[x][y] = kinds.pop()
        used = []
        for k in kinds:
            for x in spots:
                if all(abs(x - u) > 10 for u in used):
                    self.cols[x][BASE - 2] = k; used.append(x); break
        return [''.join(self.cols[x][y] for x in range(len(self.cols))).rstrip() for y in range(H)]

# ---------------------------------------------------------------- estados e ordem da viagem
STATES = [  # (nome, tema, inimigos extras)
  ("Espírito Santo", 'es', 'NFc'), ("Minas Gerais", 'mg', 'DJp'),
  ("Paraná", 'pr', 'FcN'), ("Santa Catarina", 'sc', 'Jpr'), ("Rio Grande do Sul", 'rs', 'DVl'),
  ("Mato Grosso do Sul", 'ms', 'pcJ'), ("Mato Grosso", 'mt', 'lbN'), ("Goiás", 'go', 'DrV'),
  ("Rondônia", 'ro', 'pbJ'), ("Acre", 'ac', 'clN'), ("Amazonas", 'am', 'bpr'), ("Roraima", 'rr', 'lVc'),
  ("Amapá", 'ap', 'NJb'), ("Pará", 'pa', 'rDp'), ("Tocantins", 'to', 'lbV'),
  ("Maranhão", 'ma', 'pcN'), ("Piauí", 'pi', 'lrJ'), ("Ceará", 'ce', 'bVc'), ("Rio Grande do Norte", 'rn', 'pDl'),
  ("Paraíba", 'pb', 'rNb'), ("Pernambuco", 'pe', 'JVc'), ("Alagoas", 'al', 'blp'), ("Sergipe", 'se', 'rDN'),
]
ITEM_SETS = [['H', '6', 'A'], ['H', 'T', 'Q'], ['H', 'W', 'A'], ['H', 'M', '6'], ['H', 'Q', 'W'], ['H', 'T', 'A']]
ORDER = ["Primeiros Passos", "Escola Zacarias",
         "São Paulo", "Rio de Janeiro", "Espírito Santo", "Minas Gerais",
         "Paraná", "Santa Catarina", "Rio Grande do Sul", "Vale dos Espinhos",
         "Mato Grosso do Sul", "Mato Grosso", "Goiás",
         "Rondônia", "Acre", "Amazonas", "Roraima", "Amapá", "Pará", "Tocantins",
         "Maranhão", "Piauí", "Ceará", "Rio Grande do Norte", "Paraíba", "Pernambuco", "Alagoas", "Sergipe",
         "Salvador, Bahia", "Praia do Brunucho", "Pico Final", "Brasília: Chefão Final"]

def parse_existing(src):
    out = {}
    for m in re.finditer(r'\{\s*name: "([^"]+)",\s*theme: "([^"]+)",\s*map: \[(.*?)\],\s*\}', src, re.S):
        out[m.group(1)] = (m.group(2), re.findall(r'"([^"]*)"', m.group(3)))
    return out

if __name__ == '__main__':
    src = open(LEVELS_JS, encoding='utf-8').read()
    old = parse_existing(src)
    header = src[:src.index('const LEVELS = [')]

    if '--check' in sys.argv:
        bad = 0
        for n in ORDER:
            ok, info = check_level(old[n][1]); bad += not ok
            print(f'  {n:24s}', 'ok' if ok else f'PROBLEMA {info}')
        print('\nfases com problema:', bad); sys.exit(1 if bad else 0)

    generated = {}
    for i, (name, theme, extra) in enumerate(STATES):
        diff = 0.25 + 0.75 * i / (len(STATES) - 1)
        for attempt in range(120):
            gen = Gen(seed=7000 + i * 1000 + attempt, diff=diff)
            rows = gen.build(130 + int(50 * diff), extra=extra, item_kinds=list(ITEM_SETS[i % len(ITEM_SETS)]))
            ok, info = check_level(rows)
            txt = ''.join(rows)
            # fase boa = jogável E com perigo suficiente (a dificuldade sobe ao longo da viagem)
            enough = (sum(txt.count(c) for c in ENEMY_CHARS) >= 8 + int(5 * diff)
                      and txt.count('^') >= 10 + int(12 * diff))
            if ok and enough: break
        else:
            print('!! não consegui gerar fase jogável para', name, info); sys.exit(1)
        generated[name] = (theme, rows)
        txt = ''.join(rows)
        print(f'{name:22s} ok (tentativa {attempt + 1:3d}, {len(rows[0]):3d} colunas, dif {diff:.2f}, '
              f'inimigos {sum(txt.count(c) for c in ENEMY_CHARS):2d}, espinhos {txt.count("^"):2d}, caem {txt.count("X"):2d})')

    all_levels = {**old, **generated}
    missing = [n for n in ORDER if n not in all_levels]
    assert not missing, missing

    print('\nverificando as fases feitas à mão também:')
    for n in old:
        if n in generated: continue
        ok, info = check_level(old[n][1])
        print(f'  {n:24s}', 'ok' if ok else f'PROBLEMA {info}')

    body = 'const LEVELS = [\n'
    for n in ORDER:
        theme, rows = all_levels[n]
        body += '  {\n    name: "%s",\n    theme: "%s",\n    map: [\n' % (n, theme)
        body += ',\n'.join('      "' + r.rstrip() + '"' for r in rows) + '\n    ],\n  },\n'
    body += '];\n'
    if '--write' in sys.argv:
        open(LEVELS_JS, 'w', encoding='utf-8').write(header + body)
        print('\nlevels.js gravado com', len(ORDER), 'fases')
