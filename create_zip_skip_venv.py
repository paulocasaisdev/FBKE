import os
import zipfile

src_dir = r'C:\Users\CASAIS\GRKK\backend'
zip_path = r'C:\Users\CASAIS\GRKK\backend_clean.zip'

# Pastas a ignorar
folders_to_skip = {'.venv', '__pycache__', '.pytest_cache'}

# Arquivos a ignorar
files_to_skip = {'.env', '.env.local', '.env.development'}

print("Iniciando a criação do ZIP de produção do backend...")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(src_dir):
        # Modifica dirs in-place para que o os.walk não entre nas pastas ignoradas
        dirs[:] = [d for d in dirs if d not in folders_to_skip]
        
        for file in files:
            # Ignora arquivos compilados (.pyc, .pyo) e arquivos da lista de exclusão
            if file.endswith(('.pyc', '.pyo')) or file in files_to_skip:
                continue
                
            file_path = os.path.join(root, file)
            # Calcula o nome relativo dentro do arquivo ZIP
            arcname = os.path.relpath(file_path, start=src_dir)
            zipf.write(file_path, arcname)
            
print('ZIP do backend criado com sucesso em:', zip_path)
