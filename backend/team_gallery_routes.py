from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_team_gallery_routes(app: Flask):
    """Cria e registra as rotas de equipe e galeria"""

    @app.route("/api/equipe", methods=["GET"])
    def get_equipe():
        members, error = SupabaseService.get_all("team_members", order_by="order", ascending=True)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"members": members}), 200

    @app.route("/api/galeria", methods=["GET"])
    def get_galeria():
        categoria = request.args.get("categoria")
        filter_dict = {}
        if categoria:
            filter_dict["category"] = categoria

        items, error = SupabaseService.get_all("gallery_items", order_by="order", ascending=True, filter_dict=filter_dict)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"items": items}), 200

    @app.route("/api/cms", methods=["GET", "POST"])
    def manage_cms():
        if request.method == "GET":
            banners, _ = SupabaseService.get_all("cms_banners")
            equipe, _ = SupabaseService.get_all("team_members", order_by="order", ascending=True)
            galeria, _ = SupabaseService.get_all("gallery_items", order_by="order", ascending=True)

            return jsonify({
                "banners": banners or [],
                "equipe": equipe or [],
                "galeria": galeria or []
            }), 200

        elif request.method == "POST":
            from app import get_current_user
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            tipo_item = data.get("tipo")
            payload = data.get("payload")

            if not tipo_item or not payload:
                return jsonify({"error": "Parâmetros tipo e payload são obrigatórios"}), 400

            tabela = ""
            if tipo_item == "banner":
                tabela = "cms_banners"
            elif tipo_item == "equipe":
                tabela = "team_members"
            elif tipo_item == "galeria":
                tabela = "gallery_items"
            else:
                return jsonify({"error": "Tipo inválido"}), 400

            item_id = payload.get("id")
            if item_id:
                res, error = SupabaseService.update(tabela, item_id, payload)
                if not error:
                    registrar_log_auditoria(user, "CMS Modificado", f"Item {tipo_item} (ID: {item_id}) atualizado.")
            else:
                res, error = SupabaseService.insert(tabela, payload)
                if not error:
                    registrar_log_auditoria(user, "CMS Criado", f"Novo item {tipo_item} (ID: {res.get('id')}) criado.")

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 200

    @app.route("/api/cms/<tipo>/<id>", methods=["DELETE"])
    def delete_cms_item(tipo, id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        tabela = ""
        if tipo == "banner":
            tabela = "cms_banners"
        elif tipo == "equipe":
            tabela = "team_members"
        elif tipo == "galeria":
            tabela = "gallery_items"
        else:
            return jsonify({"error": "Tipo inválido"}), 400

        res, error = SupabaseService.delete(tabela, id)
        if error:
            return jsonify({"error": error}), 500
        registrar_log_auditoria(user, "CMS Excluído", f"Item {tipo} (ID: {id}) excluído.")
        return jsonify({"sucesso": True}), 200
