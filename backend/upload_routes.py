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
    """Cria e registra as rotas de upload de arquivos"""
    
    @app.route("/api/upload", methods=["POST"])
    def upload_file():
        from app import get_current_user
        
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        if 'file' not in request.files:
            return jsonify({"error": "Nenhum arquivo enviado"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Nenhum arquivo selecionado"}), 400

        if file and allowed_file(file.filename):
            # Garante que a pasta static/uploads existe
            static_folder = app.static_folder or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
            upload_dir = os.path.join(static_folder, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Gera um nome de arquivo único para evitar colisões
            ext = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(upload_dir, unique_filename)
            
            # Salva o arquivo
            file.save(filepath)
            
            # Constrói a URL absoluta de acesso
            # request.url_root já termina com '/'
            file_url = f"{request.url_root}static/uploads/{unique_filename}"
            
            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Upload de Arquivo",
                f"Arquivo '{secure_filename(file.filename)}' enviado com sucesso. Salvo como '{unique_filename}'."
            )
            
            return jsonify({
                "sucesso": True,
                "url": file_url,
                "filename": unique_filename
            }), 200
            
        return jsonify({"error": "Tipo de arquivo não permitido"}), 400
