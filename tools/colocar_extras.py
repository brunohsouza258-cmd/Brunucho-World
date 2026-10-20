"""Coloca nos mapas o CHURROS (U) e os memes clássicos novos (s d y g z). Só acrescenta o que falta, então dá pra
rodar de novo sem duplicar (por exemplo, depois de regerar as fases dos estados com gerar_fases.py --write).

  python tools/colocar_extras.py            -> grava no src/levels.js
  python tools/colocar_extras.py --check    -> só mostra o que seria colocado

Regras (mesmas do gerador): nada de inimigo nas 8 casas antes de um buraco grande nem nas 3 depois, nada colado em
espinho, e o churros só entra onde tem 5 blocos de ar livre em cima (pra dar espaço de ele ficar grande).
"""
import os, re, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gerar_fases import check_level, danger_columns, parse_existing, LEVELS_JS, ORDER, ENEMY_CHARS, H

NEW = 'sdygz'                 # s Skibidi · d Doge · y Nyan Cat · g Gigachad · z Nazaré
ITEMS = '6AHTMQWU'
SOLID = set('#=R-XO')


def memes_for(i):
    """Quantos memes novos e quais tipos entram na fase número i (0 = primeira da viagem)."""
    if i >= 31: return 0, ''                 # Brasília: a arena do chefão fica como está
    if i <= 1: return 1, 'dz'
    if i <= 8: return 2, 'dz'
    if i <= 20: return 3, 'dszy'
    return 4, 'sygzgd'


def harden_level(name, rows, i):
    rng = random.Random(4242 + i)
    W = max(len(r) for r in rows)
    g = [list(r.ljust(W)) for r in rows]
    gx = max([x for y in range(H) for x in range(W) if g[y][x] in 'GB'] or [W])
    limit = (43 if 'Brasília' in name else gx) - 6
    keep = lambda: [x for y in range(H) for x in range(W) if g[y][x] in 'PKGB' or g[y][x] in ITEMS]
    log = []

    def standing(x):
        for y in range(H - 1):
            if g[y + 1][x] == '#' and g[y][x] in ' C': return y
        return None

    def txt(): return ''.join(''.join(r) for r in g)

    # ---------------- churros (U) ----------------
    want_u = 1 if W < 185 else 2
    if name == 'Brasília: Chefão Final': want_u = 1
    have_u = txt().count('U')
    for n in range(want_u - have_u):
        frac = [0.30, 0.70][min(have_u + n, 1)]
        target = int((43 if 'Brasília' in name else W) * frac)
        placed = False
        for x in sorted(range(12, limit), key=lambda x: abs(x - target)):
            y = standing(x)
            if y is None or g[y][x] != ' ' or g[y - 1][x] != ' ': continue
            if any(g[yy][xx] not in ' C' for yy in range(max(0, y - 5), y + 1) for xx in range(x - 1, x + 2)): continue
            if any(abs(x - k) < 5 for k in keep()): continue
            g[y - 1][x] = 'U'; placed = True; log.append(f'U em x={x}'); break
        if not placed: log.append('!! churros não coube')

    # ---------------- memes novos ----------------
    n_want, pool = memes_for(i)
    n_have = sum(txt().count(c) for c in NEW)
    for n in range(max(0, n_want - n_have)):
        ch = pool[(i + n) % len(pool)]
        danger = danger_columns([''.join(r).rstrip() for r in g])
        cand = list(range(14, limit)); rng.shuffle(cand)
        placed = False
        for x in cand:
            if x in danger or any(abs(x - k) < 7 for k in keep()): continue
            if ch == 'y':                                   # Nyan Cat voa: precisa de céu livre e chão firme embaixo
                if any(g[yy][xx] in SOLID for yy in range(5, 11) for xx in range(x - 8, min(W, x + 9))): continue
                if sum(g[14][xx] == '#' for xx in range(x - 7, min(W, x + 8))) < 11: continue
                if any(xx in danger for xx in range(x - 8, min(W, x + 9))): continue
                if any(g[yy][xx] in 'ybF' for yy in range(3, 12) for xx in range(x - 14, min(W, x + 15))): continue
                if g[9][x] != ' ': continue
                g[9][x] = 'y'; placed = True; log.append(f'y em x={x}'); break
            y = standing(x)
            if y is None or g[y][x] not in ' C': continue
            if not all(standing(xx) == y for xx in (x - 2, x - 1, x + 1, x + 2)): continue
            if any(g[yy][xx] in ENEMY_CHARS for yy in range(max(0, y - 3), min(H, y + 3)) for xx in range(x - 5, x + 6)): continue
            if any(g[yy][xx] == '^' for yy in range(H) for xx in range(x - 2, x + 3)): continue
            if ch in 'sz' and any(g[yy][xx] == ch for yy in range(H) for xx in range(x - 9, min(W, x + 10))): continue
            g[y][x] = ch; placed = True; log.append(f'{ch} em x={x}'); break
        if not placed: log.append(f'!! {ch} não coube')

    # Segunda passada: se faltou lugar, o meme ocupa o lugar de um inimigo comum (E) que já está numa posição boa
    n_have = sum(txt().count(c) for c in NEW)
    ground = pool.replace('y', '')
    if n_have < n_want and ground:
        cells = [(x, y) for y in range(H) for x in range(W) if g[y][x] == 'E' and x < limit + 4]
        rng.shuffle(cells)
        for (x, y) in cells:
            if n_have >= n_want: break
            ch = ground[(i + n_have) % len(ground)]
            if ch in 'sz' and not all(standing(xx) == y for xx in (x - 2, x - 1, x + 1, x + 2)): continue   # parados precisam de chão reto
            if any(g[yy][xx] in NEW for yy in range(H) for xx in range(max(0, x - 6), min(W, x + 7))): continue
            g[y][x] = ch; n_have += 1; log.append(f'{ch} no lugar de E em x={x}')

    new_rows = [''.join(r).rstrip() for r in g]
    ok, info = check_level(new_rows)
    assert ok, (name, info)
    return new_rows, log


if __name__ == '__main__':
    src = open(LEVELS_JS, encoding='utf-8').read()
    levels = parse_existing(src)
    total_u = total_m = 0
    for i, name in enumerate(ORDER):
        theme, rows = levels[name]
        new_rows, log = harden_level(name, rows, i)
        u = sum(r.count('U') for r in new_rows); m = sum(r.count(c) for r in new_rows for c in NEW)
        total_u += u; total_m += m
        print(f'{i + 1:2d} {name[:24]:24s} churros {u} | memes novos {m}  ' + (', '.join(log) if log else '(nada a acrescentar)'))
        if '--check' in sys.argv: continue
        start = src.index(f'name: "{name}"'); m0 = src.index('map: [', start); m1 = src.index('],', m0)
        src = src[:m0] + 'map: [\n' + ',\n'.join('      "' + r + '"' for r in new_rows) + '\n    ' + src[m1:]
    legend = "//   Memes clássicos: s Skibidi  d Doge  y Nyan Cat  g Gigachad  z Nazaré   ·   U churros (fica grandão)\n"
    if legend not in src:
        src = src.replace("// Edite à vontade!", legend + "// Edite à vontade!", 1)
    if '--check' not in sys.argv:
        open(LEVELS_JS, 'w', encoding='utf-8').write(src)
    print(f'\ntotal: {total_u} churros, {total_m} memes novos', '(NÃO gravado: --check)' if '--check' in sys.argv else '(gravado)')
