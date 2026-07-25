import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

def test_login(email, password):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        print("Erro: Credenciais nao configuradas no .env")
        return

    print(f"Tentando autenticar '{email}' no Supabase Auth ({url})...")
    try:
        # Cliente principal (representando a conexão global do backend)
        supabase: Client = create_client(url, key)
        
        # Cliente temporário para login (usando anon_key para simular o backend)
        anon_key = os.environ.get("SUPABASE_ANON_KEY") or key
        temp_supabase = create_client(url, anon_key)
        res = temp_supabase.auth.sign_in_with_password({"email": email.strip().lower(), "password": password})
        
        if res and res.user:
            print(f"✅ SUCESSO: Autenticado com sucesso no Auth! ID do usuario: {res.user.id}")
            
            # Testa a busca do perfil usando o cliente principal (service_role)
            print("Buscando perfil na tabela public.profiles com o cliente principal...")
            try:
                prof = supabase.table("profiles").select("*").eq("id", res.user.id).single().execute()
                if prof and prof.data:
                    print(f"✅ SUCESSO: Perfil encontrado! Dados: {prof.data}")
                else:
                    print("❌ ERRO: Perfil nao encontrado na tabela profiles.")
            except Exception as prof_err:
                print(f"❌ ERRO ao buscar perfil na tabela profiles: {prof_err}")
        else:
            print("❌ ERRO: Credenciais invalidas ou erro desconhecido.")
    except Exception as e:
        print(f"❌ ERRO na autenticacao: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        email = input("Digite o E-mail para testar: ").strip()
        password = input("Digite a Senha: ").strip()
    else:
        email = sys.argv[1]
        password = sys.argv[2]

    test_login(email, password)
