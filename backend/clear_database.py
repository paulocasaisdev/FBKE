import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

TABELAS_REVERSO = [
    "movimentacoes_estoque",
    "produtos_estoque",
    "documentos",
    "cms_config",
    "cms_banners",
    "certificados",
    "historico_pontos",
    "contacts",
    "notifications",
    "logs_auditoria",
    "gallery_items",
    "team_members",
    "noticias",
    "financeiro",
    "candidatos_exame",
    "exames",
    "eventos_chaves",
    "eventos_inscricoes",
    "eventos",
    "atletas",
    "filiais",
    "profiles"
]

def clear_all_database(preserve_email=None):
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

    print("\n--- ATENCAO: OPERACAO DE LIMPEZA DE BANCO DE DADOS ---")
    if preserve_email:
        preserve_email = preserve_email.strip().lower()
        print(f"O usuario '{preserve_email}' sera PRESERVADO (Auth e Perfil).")
    else:
        print("AVISO: Nenhum usuario sera preservado. Todos os dados serao limpos.")

    # 1. Obter lista de IDs do Auth para deletar, preservando o email especificado
    print("\n1. Buscando usuarios do Supabase Auth para delecao...")
    auth_users_to_delete = []
    preserve_user_id = None
    try:
        users = supabase.auth.admin.list_users()
        for u in users:
            if preserve_email and u.email and u.email.lower().strip() == preserve_email:
                preserve_user_id = u.id
                print(f"-> Preservando Admin Auth: {u.email} (ID: {u.id})")
            else:
                auth_users_to_delete.append((u.id, u.email))
    except Exception as e:
        print(f"Erro ao buscar lista de usuarios no Auth: {e}")
        return False

    # 2. Deletar tabelas públicas em ordem reversa
    print("\n2. Limpando dados das tabelas do banco de dados...")
    for table in TABELAS_REVERSO:
        print(f"Limpando tabela '{table}'...")
        try:
            if table == "profiles" and preserve_user_id:
                # Mantem apenas o perfil do admin preservado
                res = supabase.table(table).delete().neq("id", preserve_user_id).execute()
                print(f"Tabela '{table}' limpa (preservando ID: {preserve_user_id})")
            else:
                # Deleta tudo
                res = supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
                # Em tabelas com chaves que nao sao 'id', como cms_config (chave), deletamos usando neq na chave primaria
                if table == "cms_config":
                    supabase.table(table).delete().neq("chave", "dummy-key-nonexistent").execute()
                print(f"Tabela '{table}' limpa com sucesso.")
        except Exception as e:
            # Caso a tabela nao exista ou de outro erro, apenas avisa e continua
            print(f"Aviso ao limpar '{table}': {e}")

    # 3. Deletar usuarios do Supabase Auth
    print("\n3. Deletando contas do Supabase Auth...")
    deleted_count = 0
    for uid, email in auth_users_to_delete:
        try:
            print(f"Deletando usuario do Auth: {email or uid}...")
            supabase.auth.admin.delete_user(uid)
            deleted_count += 1
        except Exception as e:
            print(f"Erro ao deletar usuario do Auth ({email or uid}): {e}")

    print(f"\n✅ CONCLUIDO: {deleted_count} usuarios removidos do Supabase Auth.")
    print("Todas as tabelas do banco de dados foram limpas com sucesso.")
    return True

if __name__ == "__main__":
    print("==================================================")
    print("DANGER ZONE: APAGAR TODOS OS DADOS DO BANCO GRKK")
    print("==================================================")
    
    email_to_preserve = input("Digite o E-mail do Admin que deseja PRESERVAR (ex: novo_admin@grkk.com.br): ").strip()
    if not email_to_preserve:
        print("Nenhum e-mail fornecido. A execucao foi cancelada por seguranca.")
        sys.exit(0)

    confirm = input(f"Tem certeza que deseja APAGAR todas as tabelas e usuarios exceto '{email_to_preserve}'? (digite 'SIM' para confirmar): ").strip()
    if confirm != "SIM":
        print("Operacao cancelada pelo usuario.")
        sys.exit(0)

    success = clear_all_database(email_to_preserve)
    if not success:
        sys.exit(1)
