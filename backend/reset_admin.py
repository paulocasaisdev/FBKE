import os
import sys
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

def reset_admin(email, password, name="Super Admin"):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        print("Erro: Credenciais nao configuradas no .env")
        return False

    try:
        supabase: Client = create_client(url, key)
    except Exception as e:
        print(f"Erro ao inicializar o cliente Supabase: {e}")
        return False

    target_email = email.strip().lower()
    print(f"Buscando ID do usuario '{target_email}' no Supabase Auth...")
    user_id = None
    try:
        users = supabase.auth.admin.list_users()
        for u in users:
            if u.email and u.email.lower().strip() == target_email:
                user_id = u.id
                break
    except Exception as e:
        print(f"Erro ao listar usuarios no Auth: {e}")
        return False

    if user_id:
        print(f"Usuario encontrado com ID: {user_id}. Removendo do Supabase Auth...")
        try:
            supabase.auth.admin.delete_user(user_id)
            print("Usuario removido do Auth com sucesso.")
        except Exception as e:
            print(f"Erro ao deletar usuario do Auth: {e}")
            return False
            
        print("Removendo perfil correspondente da tabela public.profiles...")
        try:
            supabase.table("profiles").delete().eq("email", target_email).execute()
            print("Perfil deletado com sucesso do banco de dados.")
        except Exception as e:
            print(f"Erro ao deletar perfil da tabela profiles: {e}")
    else:
        print("Usuario nao encontrado no Auth. Prosseguindo direto para a criacao...")

    # Cria novamente o usuario do zero
    new_user_id = str(uuid.uuid4())
    print(f"Criando novo usuario '{target_email}' no Auth com a nova senha...")
    try:
        user_attrs = {
            "email": target_email,
            "password": password,
            "email_confirm": True,
            "id": new_user_id
        }
        res = supabase.auth.admin.create_user(user_attrs)
        if res and res.user:
            new_user_id = res.user.id
            print(f"Novo usuario cadastrado com sucesso (ID: {new_user_id})")
        else:
            print("Erro ao cadastrar novo usuario no Auth.")
            return False
    except Exception as e:
        print(f"Erro ao criar usuario no Supabase Auth: {e}")
        return False

    print(f"Inserindo perfil '{name}' na tabela public.profiles...")
    try:
        profile_data = {
            "id": new_user_id,
            "nome": name,
            "email": target_email,
            "tipo": "admin",
            "status": "ativo"
        }
        supabase.table("profiles").insert(profile_data).execute()
        print("✅ SUCESSO: Super Administrador resetado e recriado com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao criar o perfil na tabela profiles: {e}")
        return False

if __name__ == "__main__":
    print("--- RESET E RECRIACAO DE SUPER ADM GRKK ---")
    if len(sys.argv) < 3:
        email = input("Digite o E-mail do Admin a resetar: ").strip()
        password = input("Digite a NOVA Senha: ").strip()
        name = input("Digite o Nome (opcional, default 'Super Admin'): ").strip()
        if not name:
            name = "Super Admin"
    else:
        email = sys.argv[1]
        password = sys.argv[2]
        name = sys.argv[3] if len(sys.argv) > 3 else "Super Admin"

    if not email or not password:
        print("Erro: E-mail e Senha sao obrigatorios.")
        sys.exit(1)

    reset_admin(email, password, name)
