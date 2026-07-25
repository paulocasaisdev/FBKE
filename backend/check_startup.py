import os
import sys
import traceback

# --- Configuração de Caminho ---
# Adiciona o diretório do script ao sys.path para garantir que as importações relativas funcionem
# Isso simula como o servidor WSGI/FCGI deve encontrar os módulos do seu projeto
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

print("--- Iniciando Teste de Diagnóstico do Backend ---")
print(f"Versão do Python: {sys.version}")
print(f"Diretório atual: {os.getcwd()}")
print(f"Diretório do script: {script_dir}")
print(f"sys.path: {sys.path}")
print("-" * 50)

# --- Teste 1: Importar dependências chave ---
print("
--- Teste 1: Verificando dependências instaladas ---")
try:
    import flask
    import dotenv
    import supabase
    print("SUCESSO: Flask, python-dotenv, e supabase-py importados com sucesso.")
    print(f"  - Versão do Flask: {flask.__version__}")
    if hasattr(supabase, '__version__'):
        print(f"  - Versão do Supabase-py: {supabase.__version__}")

except ImportError as e:
    print(f"
!!!!!! ERRO CRÍTICO: Falha ao importar uma dependência chave. !!!!!!")
    print(f"Detalhe do erro: {e}")
    print("Isso geralmente significa que as dependências do 'requirements.txt' não foram instaladas corretamente no ambiente de produção.")
    print("--- Teste encerrado ---")
    sys.exit(1) # Sai do script se dependências básicas faltam

print("-" * 50)

# --- Teste 2: Tentar carregar a aplicação Flask ---
print("
--- Teste 2: Tentando carregar o objeto 'app' do Flask ---")
try:
    # Tentamos importar o objeto 'app' do seu arquivo principal 'app.py'
    from app import app
    print("
SUCESSO: Objeto 'app' do Flask foi carregado de 'app.py' sem erros de inicialização.")
    print("Isso indica que não há erros de sintaxe ou de importação imediatos no seu código.")

except Exception as e:
    print(f"
!!!!!! ERRO CRÍTICO: Falha ao carregar a aplicação Flask de 'app.py'. !!!!!!")
    print("Este é provavelmente o motivo do 'Erro 500'. A aplicação não consegue nem iniciar.")
    print("
--- Traceback Completo do Erro ---
")
    # Imprime o traceback completo, que é a informação mais importante para depuração
    traceback.print_exc()
    print("
--- Fim do Traceback ---")

print("
--- Teste de Diagnóstico Concluído ---")
