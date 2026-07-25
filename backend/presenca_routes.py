import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_presenca_routes(app: Flask):
    """Cria e registra as rotas de controle de presenças"""

    @app.route("/api/presencas", methods=["GET", "POST"])
    def handle_presencas():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            # Filtros adicionais
            data_filtro = request.args.get("data")
            atleta_filtro = request.args.get("atleta_id")
            filial_filtro = request.args.get("filial_id")

            # Aplica regras de controle baseados em perfil
            if user.get("tipo") == "filial":
                filial_filtro = user.get("id")
            elif user.get("tipo") == "atleta":
                atleta_filtro = user.get("id")

            filters = {}
            if data_filtro:
                filters["data"] = data_filtro
            if atleta_filtro:
                filters["atleta_id"] = atleta_filtro
            if filial_filtro:
                filters["filial_id"] = filial_filtro

            # Busca presenças
            presencas, error = SupabaseService.get_all("presencas", order_by="data", ascending=False, filter_dict=filters)
            if error:
                return jsonify({"error": error}), 500

            # Retorna lista de presenças
            return jsonify({"presencas": presencas or []}), 200

        elif request.method == "POST":
            if user.get("tipo") not in ["admin", "filial"]:
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            data_aula = data.get("data")
            filial_id = data.get("filial_id") or (user.get("id") if user.get("tipo") == "filial" else None)
            presencas_list = data.get("presencas", [])

            if not data_aula or not filial_id:
                return jsonify({"error": "Parâmetros 'data' e 'filial_id' são obrigatórios"}), 400

            salvos = []
            for item in presencas_list:
                atl_id = item.get("atleta_id")
                status = item.get("status", "presente")

                if not atl_id:
                    continue

                # Evitar duplicações buscando registro existente para atleta + data
                existing, _ = SupabaseService.get_all("presencas", filter_dict={"atleta_id": atl_id, "data": data_aula})
                
                if existing:
                    # Atualiza o registro existente
                    res, err = SupabaseService.update("presencas", existing[0]["id"], {"status": status})
                    if not err:
                        salvos.append(res)
                else:
                    # Cria um novo registro
                    presenca_item = {
                        "id": str(uuid.uuid4()),
                        "atleta_id": atl_id,
                        "filial_id": filial_id,
                        "data": data_aula,
                        "status": status
                    }
                    res, err = SupabaseService.insert("presencas", presenca_item)
                    if not err:
                        salvos.append(res)

            # Log de auditoria
            registrar_log_auditoria(
                user,
                "Lançamento de Frequência",
                f"Lançada chamada para {len(salvos)} atletas na data {data_aula} pela filial ID: {filial_id}."
            )

            return jsonify({"success": True, "salvos": len(salvos)}), 200
