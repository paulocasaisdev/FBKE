import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

def list_users():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        print("Erro: Credenciais nao configuradas no .env")
        return

    print(f"Buscando usuarios do Supabase Auth para o projeto {url}...")
    try:
        supabase: Client = create_client(url, key)
        # Lista os usuarios do Auth
        res = supabase.auth.admin.list_users()
        if res:
            print(f"\nTotal de usuarios encontrados no Auth: {len(res)}")
            for u in res:
                print(f"- E-mail: {u.email} | ID: {u.id} | Confirmado: {u.email_confirmed_at is not None}")
        else:
            print("Nenhum usuario retornado pelo Auth.")
    except Exception as e:
        print(f"Erro ao listar usuarios: {e}")

if __name__ == "__main__":
    list_users()
