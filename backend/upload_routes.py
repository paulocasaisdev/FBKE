import os
import uuid
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from services.audit_service import registrar_log_auditoria

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_upload_routes(app: Flask):
    """Cria e registra as rotas de upload de arquivos (suporta único ou lote de arquivos)"""
    
    @app.route("/api/upload", methods=["POST"])
    def upload_file():
        from app import get_current_user
        
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        # Captura arquivos enviados sob 'files' (múltiplos) ou 'file' (único ou múltiplo)
        uploaded_files = request.files.getlist('files')
        if not uploaded_files or (len(uploaded_files) == 1 and uploaded_files[0].filename == ''):
            uploaded_files = request.files.getlist('file')

        if not uploaded_files or (len(uploaded_files) == 1 and uploaded_files[0].filename == ''):
            return jsonify({"error": "Nenhum arquivo enviado ou selecionado"}), 400

        # Validação do limite de arquivos por lote (máximo 30)
        if len(uploaded_files) > 30:
            return jsonify({"error": "Limite máximo de 30 arquivos por envio excedido"}), 400

        # Processamento seguro da subpasta de destino (ex: 'galeria', 'banners')
        subfolder = request.form.get('subfolder') or request.args.get('subfolder') or ''
        subfolder_clean = secure_filename(subfolder.strip()) if subfolder else ''

        static_folder = app.static_folder or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
        if subfolder_clean:
            upload_dir = os.path.join(static_folder, 'uploads', subfolder_clean)
            url_prefix = f"static/uploads/{subfolder_clean}/"
        else:
            upload_dir = os.path.join(static_folder, 'uploads')
            url_prefix = "static/uploads/"

        os.makedirs(upload_dir, exist_ok=True)

        results = []
        for file in uploaded_files:
            if not file or file.filename == '':
                continue

            if not allowed_file(file.filename):
                continue

            # Gera um nome de arquivo único (UUID v4) para evitar colisões e path traversal
            ext = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(upload_dir, unique_filename)

            # Salva o arquivo
            file.save(filepath)

            # Constrói a URL de acesso
            file_url = f"{request.url_root}{url_prefix}{unique_filename}"
            
            results.append({
                "original_filename": secure_filename(file.filename),
                "filename": unique_filename,
                "url": file_url
            })

        if not results:
            return jsonify({"error": "Nenhum arquivo válido ou com extensão permitida foi processado"}), 400

        # Log de auditoria
        detalhes_log = f"{len(results)} arquivo(s) enviado(s) com sucesso"
        if subfolder_clean:
            detalhes_log += f" na pasta '{subfolder_clean}'"
        detalhes_log += f": {', '.join([r['original_filename'] for r in results[:5]])}"
        if len(results) > 5:
            detalhes_log += f" e mais {len(results) - 5}..."

        registrar_log_auditoria(user, "Upload de Arquivo", detalhes_log)

        # Se apenas um arquivo foi enviado e processado, mantemos compatibilidade com o formato anterior
        first = results[0]
        return jsonify({
            "sucesso": True,
            "count": len(results),
            "url": first["url"],
            "filename": first["filename"],
            "urls": [r["url"] for r in results],
            "filenames": [r["filename"] for r in results],
            "files": results
        }), 200
