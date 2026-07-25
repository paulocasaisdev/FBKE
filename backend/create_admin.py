import os
import sys
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

# Resolve o caminho do .env de forma absoluta
backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

def create_super_admin(email, password, name="Administrador"):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key or "sua-url" in url:
        print("Erro: As variaveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nao foram encontradas no arquivo .env")
        return False

    print(f"Conectando ao Supabase em: {url}...")
    try:
        supabase: Client = create_client(url, key)
    except Exception as e:
        print(f"Erro ao inicializar o cliente Supabase: {e}")
        return False

    user_id = str(uuid.uuid4())
    print(f"Criando usuario '{email}' no Supabase Auth...")
    try:
        user_attrs = {
            "email": email.strip().lower(),
            "password": password,
            "email_confirm": True,
            "id": user_id
        }
        res = supabase.auth.admin.create_user(user_attrs)
        # Garante que o ID retornado seja usado (caso o Supabase ignore o UUID gerado)
        if res and res.user:
            user_id = res.user.id
            print(f"Usuario criado com sucesso no Auth (ID: {user_id})")
        else:
            print("Nao foi possivel obter o usuario retornado pelo Auth.")
            return False
    except Exception as e:
        print(f"Erro ao criar usuario no Supabase Auth: {e}")
        print("Verifique se o email ja nao esta cadastrado ou se a senha atende aos requisitos.")
        return False

    print(f"Criando perfil para '{name}' na tabela public.profiles...")
    try:
        profile_data = {
            "id": user_id,
            "nome": name,
            "email": email.strip().lower(),
            "tipo": "admin",
            "status": "ativo"
        }
        supabase.table("profiles").insert(profile_data).execute()
        print("Perfil de Super Administrador criado com sucesso no banco de dados!")
        print("Tudo pronto! Voce ja pode fazer o login com as credenciais informadas.")
        return True
    except Exception as e:
        print(f"Erro ao criar o perfil na tabela profiles: {e}")
        print("Tentando reverter a criacao do usuario no Auth por consistencia...")
        try:
            supabase.auth.admin.delete_user(user_id)
            print("Usuario do Auth removido com sucesso.")
        except Exception as rev_err:
            print(f"Nao foi possivel reverter o usuario no Auth: {rev_err}")
        return False

if __name__ == "__main__":
    print("--- CRIACAO DE NOVO SUPER ADMINISTRADOR GRKK ---")
    if len(sys.argv) >= 3:
        email = sys.argv[1]
        password = sys.argv[2]
        name = sys.argv[3] if len(sys.argv) > 3 else "Super Admin"
    else:
        email = input("Digite o E-mail do novo Super Adm: ").strip()
        password = input("Digite a Senha (minimo 6 caracteres): ").strip()
        name = input("Digite o Nome (opcional, default 'Super Admin'): ").strip()
        if not name:
            name = "Super Admin"

    if not email or not password:
        print("Erro: E-mail e Senha sao obrigatorios.")
        sys.exit(1)

    success = create_super_admin(email, password, name)
    if not success:
        sys.exit(1)
