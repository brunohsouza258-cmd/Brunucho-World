#!/usr/bin/env python3
"""Servidor local para jogar Super Brunucho no celular (ou em qualquer aparelho da mesma rede Wi-Fi).

  python servidor.py          (ou dê dois cliques em jogar-no-celular.bat)

Abre DOIS endereços:
  http://SEU-IP:8000    funciona direto, mas o navegador do celular BLOQUEIA o microfone aqui
  https://SEU-IP:8443   o certificado é "feito em casa": o celular avisa que não é seguro, é só tocar em
                        "Avançado > Continuar assim". Aí o microfone (gravar a própria voz) funciona.

O jogo só roda na sua rede. Nada é enviado para a internet. Ctrl+C para parar.
"""
import http.server
import json
import os
import re
import shutil
import socket
import ssl
import subprocess
import sys
import threading
import time
import urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(AQUI, '.certificado')
HTTP_PORT, HTTPS_PORT = 8000, 8443

# Ranking global de TESTE (guardado num arquivo aqui, só pra quem usa este servidor)
RANK_FILE = os.environ.get('RANK_FILE') or os.path.join(AQUI, '.ranking-local.json')
RANK_LOCK = threading.Lock()
RANK_LAST = {}
RANK_RATE = float(os.environ.get('RANK_RATE', '4'))        # segundos entre envios do mesmo IP (0 = sem limite, pra testes)
try:
    with open(RANK_FILE, encoding='utf-8') as f:
        RANK_DB = json.load(f)
except (OSError, ValueError):
    RANK_DB = {}


def salvar_ranking():
    try:
        with open(RANK_FILE, 'w', encoding='utf-8') as f:
            json.dump(RANK_DB, f, ensure_ascii=False)
    except OSError:
        pass


def ip_da_rede():
    """IP deste computador na rede local (o que o celular digita)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))      # não envia nada; só descobre qual placa de rede seria usada
        return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        s.close()


def achar_openssl():
    exe = shutil.which('openssl')
    if exe:
        return exe
    for c in (r'C:\Program Files\Git\usr\bin\openssl.exe', r'C:\Program Files (x86)\Git\usr\bin\openssl.exe'):
        if os.path.exists(c):
            return c
    return None


def gerar_certificado(ip):
    """Cria (uma vez) um certificado autoassinado válido para o IP e para localhost. Devolve (cert, chave) ou None."""
    os.makedirs(CERT_DIR, exist_ok=True)
    cert, key = os.path.join(CERT_DIR, f'cert-{ip}.pem'), os.path.join(CERT_DIR, f'chave-{ip}.pem')
    if os.path.exists(cert) and os.path.exists(key):
        return cert, key
    exe = achar_openssl()
    if exe:
        cfg = os.path.join(CERT_DIR, 'openssl.cnf')
        with open(cfg, 'w') as f:
            f.write(f"""[req]
distinguished_name=dn
x509_extensions=v3
prompt=no
[dn]
CN=Super Brunucho
[v3]
subjectAltName=IP:{ip},IP:127.0.0.1,DNS:localhost
""")
        r = subprocess.run([exe, 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '825', '-keyout', key,
                            '-out', cert, '-config', cfg], capture_output=True)
        if r.returncode == 0 and os.path.exists(cert):
            return cert, key
    try:                                       # plano B: biblioteca "cryptography", se estiver instalada
        import datetime, ipaddress
        from cryptography import x509
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.x509.oid import NameOID
        k = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        nome = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Super Brunucho')])
        agora = datetime.datetime.now(datetime.timezone.utc)
        c = (x509.CertificateBuilder().subject_name(nome).issuer_name(nome).public_key(k.public_key())
             .serial_number(x509.random_serial_number()).not_valid_before(agora - datetime.timedelta(days=1))
             .not_valid_after(agora + datetime.timedelta(days=825))
             .add_extension(x509.SubjectAlternativeName([x509.IPAddress(ipaddress.ip_address(ip)),
                            x509.IPAddress(ipaddress.ip_address('127.0.0.1')), x509.DNSName('localhost')]), False)
             .sign(k, hashes.SHA256()))
        with open(key, 'wb') as f:
            f.write(k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL,
                                    serialization.NoEncryption()))
        with open(cert, 'wb') as f:
            f.write(c.public_bytes(serialization.Encoding.PEM))
        return cert, key
    except Exception:
        return None


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=AQUI, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')        # sempre pega a versão mais nova do jogo
        super().end_headers()

    def log_message(self, fmt, *args):                       # sem barulho no terminal
        pass

    # ------------------------------------------------------------ Ranking global de TESTE (mesma API da função api/ranking.js da Vercel)
    # Serve para testar o ranking na sua rede, sem internet. O ranking de verdade (de todo mundo) fica no site da Vercel.
    def _rank_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if self.path.startswith('/api/ranking'):
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/ranking'):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            sort = 'time' if q.get('sort', [''])[0] == 'time' else 'score'
            try:
                limit = max(1, min(50, int(q.get('limit', ['20'])[0])))
            except ValueError:
                limit = 20
            me = q.get('me', [''])[0]
            with RANK_LOCK:
                players = RANK_DB.setdefault('players', {})
                by_score = sorted(players.items(), key=lambda kv: -kv[1]['score'])
                by_time = sorted([kv for kv in players.items() if kv[1].get('time')], key=lambda kv: kv[1]['time'])
                lista = by_time if sort == 'time' else by_score
                entries = [{'pos': i + 1, 'name': p['name'], 'score': p['score'], 'time': p.get('time'), 'level': p['level'],
                            'deaths': p['deaths'], 'finished': bool(p.get('time')), 'mine': pid == me} for i, (pid, p) in enumerate(lista[:limit])]
                pos = lambda lst: next((i + 1 for i, (pid, _) in enumerate(lst) if pid == me), None)
                self._rank_json(200, {'ok': True, 'sort': sort, 'entries': entries, 'total': len(by_score), 'totalTime': len(by_time),
                                      'me': {'posScore': pos(by_score), 'posTime': pos(by_time)}})
            return
        super().do_GET()

    def do_POST(self):
        if not self.path.startswith('/api/ranking'):
            self.send_response(404)
            self.end_headers()
            return
        try:
            n = int(self.headers.get('Content-Length', '0'))
            b = json.loads(self.rfile.read(min(n, 4096)).decode('utf-8'))
            assert isinstance(b, dict)
        except Exception:
            return self._rank_json(400, {'ok': False, 'error': 'pedido inválido'})

        def inteiro(v, lo, hi):
            try:
                x = round(float(v))
            except (TypeError, ValueError):
                return None
            return x if lo <= x <= hi else None

        pid = b.get('id') if isinstance(b.get('id'), str) and re.fullmatch(r'[\w-]{8,64}', b.get('id')) else None
        score, level, deaths, tempo = inteiro(b.get('score'), 0, 5000000), inteiro(b.get('level'), 1, 32), inteiro(b.get('deaths'), 0, 9999), inteiro(b.get('time'), 0, 400000)
        finished = b.get('finished') is True
        if pid is None or None in (score, level, deaths, tempo):
            return self._rank_json(400, {'ok': False, 'error': 'valores inválidos'})
        if finished and tempo < 300:
            return self._rank_json(400, {'ok': False, 'error': 'tempo impossível'})
        if score == 0 and not finished:
            return self._rank_json(400, {'ok': False, 'error': 'sem pontos'})
        ip = self.client_address[0]
        agora = time.time()
        with RANK_LOCK:
            if RANK_RATE > 0 and agora - RANK_LAST.get(ip, 0) < RANK_RATE:
                return self._rank_json(429, {'ok': False, 'error': 'devagar! tente de novo em alguns segundos'})
            RANK_LAST[ip] = agora
            players = RANK_DB.setdefault('players', {})
            p = players.get(pid) or {'score': 0, 'time': None, 'level': 1, 'deaths': 0}
            nome = re.sub(r'[^\w.\- ]', '', str(b.get('name', '')), flags=re.UNICODE)
            nome = re.sub(r'\s+', ' ', nome).strip()[:12] or 'Anônimo'
            p['name'] = nome
            if score > p['score']:
                p.update(score=score, level=level, deaths=deaths)
            if finished and (not p.get('time') or tempo < p['time']):
                p['time'] = tempo
            players[pid] = p
            salvar_ranking()
            by_score = sorted(players.items(), key=lambda kv: -kv[1]['score'])
            by_time = sorted([kv for kv in players.items() if kv[1].get('time')], key=lambda kv: kv[1]['time'])
            pos = lambda lst: next((i + 1 for i, (k, _) in enumerate(lst) if k == pid), None)
            self._rank_json(200, {'ok': True, 'name': nome, 'posScore': pos(by_score), 'posTime': pos(by_time), 'total': len(by_score)})


Handler.extensions_map.update({'.webmanifest': 'application/manifest+json', '.js': 'text/javascript'})


def main():
    ip = ip_da_rede()
    print('=' * 60)
    print('  SUPER BRUNUCHO - servidor para celular')
    print('=' * 60)
    http_srv = http.server.ThreadingHTTPServer(('0.0.0.0', HTTP_PORT), Handler)
    threading.Thread(target=http_srv.serve_forever, daemon=True).start()
    print(f'\n  Neste computador:   http://localhost:{HTTP_PORT}   (aqui o microfone funciona)')
    print(f'  No celular (HTTP):  http://{ip}:{HTTP_PORT}   (jogar normal; SEM microfone)')

    par = gerar_certificado(ip)
    if par:
        try:
            ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ctx.load_cert_chain(*par)
            https_srv = http.server.ThreadingHTTPServer(('0.0.0.0', HTTPS_PORT), Handler)
            https_srv.socket = ctx.wrap_socket(https_srv.socket, server_side=True)
            threading.Thread(target=https_srv.serve_forever, daemon=True).start()
            print(f'  No celular (HTTPS): https://{ip}:{HTTPS_PORT}  (COM microfone)')
            print('\n  No HTTPS o celular vai avisar "conexão não segura": toque em Avançado > Continuar.')
            print('  (é o certificado feito em casa; o jogo só trafega na sua rede Wi-Fi)')
        except OSError as e:
            print(f'\n  Não consegui abrir o HTTPS ({e}). O HTTP continua funcionando.')
    else:
        print('\n  Sem HTTPS: não achei o "openssl" (vem junto com o Git for Windows) nem a biblioteca "cryptography".')
        print('  Dá pra jogar normalmente; para gravar a voz no celular use "importar arquivo".')

    print('\n  O celular precisa estar no MESMO Wi-Fi. Se o Windows perguntar sobre o firewall, clique em "Permitir".')
    print('  Para instalar como app: no navegador do celular, menu > "Adicionar à tela inicial".')
    print('  Ctrl+C para parar.\n')
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        print('\nServidor parado.')
        sys.exit(0)


if __name__ == '__main__':
    main()
