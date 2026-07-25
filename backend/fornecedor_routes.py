from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from datetime import datetime
from services.audit_service import registrar_log_auditoria
import uuid

def create_fornecedor_routes(app: Flask):
    """Cria e registra as rotas de gerenciamento de fornecedores"""

    @app.route("/api/estoque/fornecedores", methods=["GET", "POST"])
    def handle_fornecedores():
        from app import get_current_user
        
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autorizado"}), 401

        if request.method == "GET":
            # Qualquer usuário autenticado (admin ou filial) pode listar fornecedores
            fornecedores, error = SupabaseService.get_all("fornecedores", order_by="nome")
            if error:
                return jsonify({"error": f"Erro ao listar fornecedores: {error}"}), 500
            return jsonify({"fornecedores": fornecedores}), 200

        elif request.method == "POST":
            # Apenas admin pode criar fornecedores
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            nome = data.get("nome")
            if not nome:
                return jsonify({"error": "Nome do fornecedor é obrigatório"}), 400

            fornecedor_id = str(uuid.uuid4())
            novo_fornecedor = {
                "id": fornecedor_id,
                "nome": nome,
                "contato": data.get("contato", ""),
                "telefone": data.get("telefone", ""),
                "email": data.get("email", ""),
                "created_at": datetime.utcnow().isoformat()
            }

            res, error = SupabaseService.insert("fornecedores", novo_fornecedor)
            if error:
                return jsonify({"error": f"Erro ao cadastrar fornecedor: {error}"}), 500

            # Registrar log de auditoria
            detalhes = f"Fornecedor '{nome}' cadastrado com sucesso."
            registrar_log_auditoria(user, "CADASTRO_FORNECEDOR", detalhes)

            return jsonify(res), 201

    @app.route("/api/estoque/fornecedores/<id>", methods=["PATCH", "DELETE"])
    def handle_fornecedor_individual(id):
        from app import get_current_user
        
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        # Verifica se o fornecedor existe
        fornecedores, error = SupabaseService.get_all("fornecedores", filter_dict={"id": id})
        if error or not fornecedores:
            return jsonify({"error": "Fornecedor não encontrado"}), 404
        fornecedor = fornecedores[0]

        if request.method == "PATCH":
            data = request.json or {}
            update_data = {}
            for field in ["nome", "contato", "telefone", "email"]:
                if field in data:
                    update_data[field] = data[field]

            if not update_data:
                return jsonify({"error": "Nenhum dado fornecido para atualização"}), 400

            res, error = SupabaseService.update("fornecedores", id, update_data)
            if error:
                return jsonify({"error": f"Erro ao atualizar fornecedor: {error}"}), 500

            # Registrar log de auditoria
            detalhes = f"Fornecedor '{fornecedor.get('nome')}' atualizado. Campos: {list(update_data.keys())}"
            registrar_log_auditoria(user, "EDICAO_FORNECEDOR", detalhes)

            return jsonify(res), 200

        elif request.method == "DELETE":
            res, error = SupabaseService.delete("fornecedores", id)
            if error:
                return jsonify({"error": f"Erro ao excluir fornecedor: {error}"}), 500

            # Registrar log de auditoria
            detalhes = f"Fornecedor '{fornecedor.get('nome')}' excluído."
            registrar_log_auditoria(user, "EXCLUSAO_FORNECEDOR", detalhes)

            return jsonify({"message": "Fornecedor excluído com sucesso"}), 200
