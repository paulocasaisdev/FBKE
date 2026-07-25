from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_auditoria_routes(app: Flask):
    """Cria e registra as rotas de auditoria"""

    @app.route("/api/auditoria", methods=["GET"])
    def get_auditoria_logs():
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial"]:
            return jsonify({"error": "Acesso não autorizado"}), 403

        # Recupera os logs de auditoria ordenados do mais recente ao mais antigo
        logs, error = SupabaseService.get_all("logs_auditoria", order_by="created_at", ascending=False)
        if error:
            return jsonify({"error": f"Erro ao carregar logs de auditoria: {error}"}), 500

        logs = logs or []
        user_tipo = user.get("tipo")
        user_id = user.get("id")

        if user_tipo == "admin":
            # Admin enxerga tudo
            filtered_logs = logs
        elif user_tipo == "filial":
            # Filial enxerga o que faz e as ações de seus alunos
            # 1. Buscar atletas vinculados a esta filial
            atletas, _ = SupabaseService.get_all("atletas", filter_dict={"filial_id": user_id})
            atletas = atletas or []
            atleta_ids = {a.get("id") for a in atletas if a.get("id")}
            
            # 2. Permitidos são o ID da filial + IDs dos atletas
            permitidos = atleta_ids | {user_id}
            filtered_logs = [log for log in logs if log.get("usuario_id") in permitidos]
        else:
            filtered_logs = []

        return jsonify({"logs": filtered_logs}), 200

