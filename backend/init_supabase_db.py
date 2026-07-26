import os
import sys
import psycopg2

def main():
    if len(sys.argv) < 2:
        print("Uso: python init_supabase_db.py <SENHA_DO_BANCO>")
        print("Exemplo: python init_supabase_db.py MinhaSenha123!")
        sys.exit(1)

    password = sys.argv[1]
    host = "db.qlqukeiotxmfezqxteaj.supabase.co"
    port = "5432"
    dbname = "postgres"
    user = "postgres"

    print(f"[*] Conectando ao banco de dados Supabase em {host}...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password,
            connect_timeout=15
        )
        conn.autocommit = True
        cursor = conn.cursor()
        print("[+] Conexão bem-sucedida ao Supabase!")

        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        if not os.path.exists(schema_path):
            print(f"[-] Erro: Arquivo schema.sql não encontrado em {schema_path}")
            sys.exit(1)

        print("[*] Lendo e executando o arquivo schema.sql...")
        with open(schema_path, "r", encoding="utf-8") as f:
            sql_content = f.read()

        cursor.execute(sql_content)
        print("[+] Todas as tabelas e relacionamentos foram criados com SUCESSO no Supabase!")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[-] Erro ao executar script no Supabase: {e}")

if __name__ == "__main__":
    main()
