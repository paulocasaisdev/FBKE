import os
import zipfile
import subprocess

frontend_dir = r'C:\Users\CASAIS\GRKK\frontend'
src_dir = os.path.join(frontend_dir, 'out')
zip_path = r'C:\Users\CASAIS\GRKK\frontend_clean.zip'

print("Iniciando a compilação do frontend Next.js (npm run build)...")
try:
    # Executa o build de produção no diretório do frontend
    # Usamos shell=True por causa do Windows
    result = subprocess.run('npm run build', cwd=frontend_dir, shell=True, check=True)
    print("Compilação concluída com sucesso! Gerando o arquivo ZIP...")
except subprocess.CalledProcessError as e:
    print(f"Erro durante a execução de 'npm run build': {e}")
    exit(1)

if not os.path.exists(src_dir):
    print(f"Erro: O diretório de saída '{src_dir}' não foi gerado pelo build.")
    exit(1)

# Compacta a pasta 'out'
print("Compactando os arquivos estáticos com permissões Unix (644/755)...")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(src_dir):
        # 1. Registrar diretórios com permissão 755
        for d in dirs:
            dir_path = os.path.join(root, d)
            arcname = os.path.relpath(dir_path, start=src_dir).replace('\\', '/') + '/'
            d_info = zipfile.ZipInfo(arcname)
            d_info.create_system = 3  # Unix
            d_info.external_attr = (0o755 << 16) | 0x10  # 0x10 = Directory
            zipf.writestr(d_info, '')

        # 2. Registrar arquivos com permissão 644
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, start=src_dir).replace('\\', '/')
            f_info = zipfile.ZipInfo(arcname)
            f_info.create_system = 3  # Unix
            f_info.external_attr = (0o644 << 16) | 0x20  # 0x20 = Normal File
            f_info.compress_type = zipfile.ZIP_DEFLATED
            
            with open(file_path, 'rb') as f:
                content = f.read()
            zipf.writestr(f_info, content)
            
print('ZIP do frontend criado com sucesso em:', zip_path)
