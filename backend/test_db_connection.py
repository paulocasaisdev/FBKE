import os
import sys
from dotenv import load_dotenv

# Adiciona o diretório atual ao PATH para poder importar os módulos do projeto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Carrega as variáveis de ambiente do arquivo .env usando o caminho absoluto
backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

print("--- TESTE DE CONEXÃO COM O SUPABASE ---")

# Importa o SupabaseService do projeto
try:
    from services.supabase_service import SupabaseService, is_mock_mode
    print(f"Modo de Execução Detectado: {'OFFLINE (Mock/Emulação)' if is_mock_mode else 'ONLINE (Supabase Oficial)'}")
except ImportError as e:
    print(f"❌ Erro ao importar o serviço de banco de dados: {e}")
    sys.exit(1)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

print(f"URL Configurada: {url}")
print(f"Chave Configurada: {'Sim (Presente)' if key else 'Não (Ausente)'}")

if is_mock_mode:
    print("\nℹ️ O projeto está rodando em MODO MOCK (Offline) porque as credenciais reais não foram encontradas no .env.")
    print("Se você deseja conectar ao Supabase real, configure as variáveis 'SUPABASE_URL' e 'SUPABASE_ANON_KEY' no seu arquivo .env")
    
    # Testa se o arquivo mock-db.json pode ser lido
    mock_db_path = os.path.join(os.path.dirname(__file__), "mock-db.json")
    if os.path.exists(mock_db_path):
        print(f"✅ Arquivo de banco de dados mock local encontrado em: {mock_db_path}")
        try:
            with open(mock_db_path, "r", encoding="utf-8") as f:
                import json
                data = json.load(f)
                print(f"✅ Banco mock carregado com sucesso. Tabelas disponíveis: {list(data.keys())}")
        except Exception as err:
            print(f"❌ Erro ao ler o arquivo mock-db.json: {err}")
    else:
        print(f"❌ Arquivo mock-db.json não encontrado em: {mock_db_path}")
else:
    print("\nTentando estabelecer conexão com o Supabase na nuvem...")
    try:
        # Tenta realizar uma consulta de contagem simples na tabela profiles
        profiles, error = SupabaseService.get_all("profiles")
        if error:
            print(f"❌ Conectou, mas o banco retornou um erro na tabela profiles: {error}")
        else:
            print("✅ CONEXÃO COM O SUPABASE REAL ESTABELECIDA COM SUCESSO!")
            print(f"✅ Consulta de teste executada com sucesso. Perfis cadastrados encontrados: {len(profiles) if profiles else 0}")
            
        print("\nTestando acesso à tabela 'logs_auditoria'...")
        logs, log_error = SupabaseService.get_all("logs_auditoria")
        if log_error:
            print(f"❌ Erro ao acessar a tabela 'logs_auditoria': {log_error}")
            print("Conselho: Verifique se a tabela 'logs_auditoria' existe no Supabase e se a RLS (Row Level Security) permite leitura.")
        else:
            print(f"✅ Tabela 'logs_auditoria' acessada com sucesso! Logs cadastrados: {len(logs) if logs else 0}")
    except Exception as err:
        print(f"❌ Erro inesperado ao interagir com o Supabase: {err}")
