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
import os
import shutil
import socket
import ssl
import subprocess
import sys
import threading

AQUI = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(AQUI, '.certificado')
HTTP_PORT, HTTPS_PORT = 8000, 8443


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
