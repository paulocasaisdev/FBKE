import os
import zipfile

BACKEND_DIR = r'C:\Users\CASAIS\GRKK\backend'
ZIP_PATH = r'C:\Users\CASAIS\GRKK\backend_clean.zip'

# Arquivos/pastas a excluir do ZIP (não devem ir para produção)
EXCLUDE_DIRS = {'.venv', '__pycache__', '.pytest_cache', '.git', 'node_modules'}
EXCLUDE_FILES = {
    'mock-db.json',       # Dados de mock sensíveis
    '.env',               # Variáveis de ambiente locais
    'render.yaml',        # Config do Render (não usamos)
    'schema.sql',         # Schema do banco (só para referência local)
    'clear_database.py',
    'migrate_mock_to_supabase.py',
    'test_auth_me.py',
    'test_db_connection.py',
    'test_exam_flow.py',
    'test_login.py',
    'tests.py',
    'check_profiles.py',
    'check_startup.py',
    'create_admin.py',
    'list_auth_users.py',
    'reset_admin.py',
}

print("Gerando backend_clean.zip para deploy no HostGator...")
print(f"  Origem : {BACKEND_DIR}")
print(f"  Destino: {ZIP_PATH}")
print()

file_count = 0
with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(BACKEND_DIR):
        # Filtra dirs excluídos in-place para evitar descida recursiva
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        rel_root = os.path.relpath(root, BACKEND_DIR)

        # Registra diretórios com permissão 755
        for d in dirs:
            dir_arcname = os.path.join(rel_root, d).replace('\\', '/') + '/'
            if dir_arcname.startswith('./'):
                dir_arcname = dir_arcname[2:]
            d_info = zipfile.ZipInfo(dir_arcname)
            d_info.create_system = 3   # Unix
            d_info.external_attr = (0o755 << 16) | 0x10
            zipf.writestr(d_info, '')

        for filename in files:
            if filename in EXCLUDE_FILES:
                print(f"  [ignorado] {filename}")
                continue

            file_path = os.path.join(root, filename)
            arcname = os.path.join(rel_root, filename).replace('\\', '/')
            if arcname.startswith('./'):
                arcname = arcname[2:]

            # Permissão especial 755 para scripts executáveis
            ext = os.path.splitext(filename)[1].lower()
            is_executable = ext == '.fcgi' or (ext in ('.sh', '.py') and filename in ('index.fcgi', 'passenger_wsgi.py'))
            unix_perm = 0o755 if is_executable else 0o644

            f_info = zipfile.ZipInfo(arcname)
            f_info.create_system = 3   # Unix
            f_info.external_attr = (unix_perm << 16) | 0x20
            f_info.compress_type = zipfile.ZIP_DEFLATED

            with open(file_path, 'rb') as f:
                content = f.read()
            zipf.writestr(f_info, content)
            file_count += 1

print(f"\n[OK] backend_clean.zip criado com sucesso!")
print(f"   {file_count} arquivos incluídos")
print(f"   Tamanho: {os.path.getsize(ZIP_PATH) / 1024:.1f} KB")
print(f"   Caminho: {ZIP_PATH}")
