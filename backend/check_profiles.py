import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

def check_profiles():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        print("Erro: Credenciais nao configuradas no .env")
        return

    print(f"Buscando perfis da tabela public.profiles ({url})...")
    try:
        supabase: Client = create_client(url, key)
        res = supabase.table("profiles").select("id, nome, email, tipo, status").execute()
        if res and res.data:
            print(f"\nTotal de perfis encontrados no banco: {len(res.data)}")
            for p in res.data:
                print(f"- Nome: {p.get('nome')} | E-mail: {p.get('email')} | ID: {p.get('id')} | Tipo: {p.get('tipo')} | Status: {p.get('status')}")
        else:
            print("Tabela profiles está vazia.")
    except Exception as e:
        print(f"Erro ao buscar perfis: {e}")

if __name__ == "__main__":
    check_profiles()
