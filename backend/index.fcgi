#!/home1/b403bf81/backend-grkk/.venv/bin/python
import os
import sys

# ----------------------------------------------------------------------
# CONFIGURAÇÃO DE CAMINHOS DO HOSTGATOR
# Substitua "CONTA" pelo seu usuário cPanel
# Substitua "PASTA_DO_SITE" pelo caminho da sua pasta (ex: public_html/api)
# ----------------------------------------------------------------------
CONTA = "b403bf81"
PASTA_DO_SITE = "backend-grkk"

# Adiciona o diretório do backend ao PATH do Python
sys.path.insert(0, f"/home1/{CONTA}/{PASTA_DO_SITE}")

from flup.server.fcgi import WSGIServer
from app import app

if __name__ == '__main__':
    # Roda o Flask como um servidor WSGI sobre FastCGI (FCGI)
    WSGIServer(app).run()
