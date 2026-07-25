import sys
import os

# Insere a pasta do backend no caminho do Python para importações locais
sys.path.insert(0, os.path.dirname(__file__))

# Importa a instância do Flask (app) renomeando para 'application' como exigido pela HostGator
from app import app as application
