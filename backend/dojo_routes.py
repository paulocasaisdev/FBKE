from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria


def create_dojo_routes(app: Flask):
    """Cria e registra as rotas de vínculo entre atletas e dojos/filiais"""

    @app.route("/api/dojos", methods=["GET"])
    def listar_dojos():
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial", "atleta"]:
            return jsonify({"error": "Não autorizado"}), 403

        filiais_db, error = SupabaseService.get_all("filiais", filter_dict={"status": "ativo"})
        if error:
            return jsonify({"error": error}), 500

        profiles_db, _ = SupabaseService.get_all("profiles")

        dojos = []
        for fil in (filiais_db or []):
            prof = next((p for p in (profiles_db or []) if p["id"] == fil["id"]), None)
            if prof:
                dojos.append({
                    "id": fil["id"],
                    "nome": prof.get("nome") or fil.get("nome"),
                    "nome_fantasia": fil.get("nome_fantasia") or prof.get("nome_fantasia"),
                    "municipio": fil.get("municipio"),
                    "estado": fil.get("estado"),
                    "email": prof.get("email"),
                    "telefone": prof.get("telefone"),
                })

        return jsonify({"dojos": dojos}), 200

    @app.route("/api/atletas/<atleta_id>/vincular-dojo", methods=["POST"])
    def vincular_dojo(atleta_id):
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial"]:
            return jsonify({"error": "Não autorizado"}), 403

        data = request.json or {}
        dojo_id = data.get("dojo_id")
        if not dojo_id:
            return jsonify({"error": "dojo_id é obrigatório"}), 400

        atleta, err = SupabaseService.get_profile_by_id(atleta_id)
        if not atleta:
            return jsonify({"error": "Atleta não encontrado"}), 404

        if atleta.get("filial_id"):
            return jsonify({"error": "Atleta já está vinculado a um dojo. Use PUT para alterar."}), 409

        dojo, err_dojo = SupabaseService.get_profile_by_id(dojo_id)
        if not dojo or dojo.get("tipo") != "filial":
            return jsonify({"error": "Dojo/filial não encontrado"}), 404

        filiais_db, _ = SupabaseService.get_all("filiais")
        filial_info = next((f for f in (filiais_db or []) if f["id"] == dojo_id), None)

        update_data = {
            "filial_id": dojo_id,
            "filial_nome": filial_info.get("nome_fantasia") or dojo.get("nome") if filial_info else dojo.get("nome"),
        }

        if user.get("tipo") == "filial" and user["id"] != dojo_id:
            return jsonify({"error": "Dojo/filial só pode vincular atletas a si mesmo"}), 403

        _, error = SupabaseService.update("atletas", atleta_id, update_data)
        if error:
            return jsonify({"error": error}), 500

        registrar_log_auditoria(
            user,
            "Vínculo de Dojo",
            f"Atleta '{atleta.get('nome')}' (ID: {atleta_id}) vinculado ao dojo '{update_data['filial_nome']}' (ID: {dojo_id})."
        )

        try:
            from notif_routes import criar_notificacao
            criar_notificacao(
                destinatario_id=atleta_id,
                titulo="Vínculo com Dojo",
                mensagem=f"Você foi vinculado ao dojo {update_data['filial_nome']}.",
                tipo="info"
            )
        except Exception:
            pass

        return jsonify({"success": True, "filial_id": dojo_id, "filial_nome": update_data["filial_nome"]}), 200

    @app.route("/api/atletas/<atleta_id>/alterar-dojo", methods=["PUT"])
    def alterar_dojo(atleta_id):
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") not in ["admin"]:
            return jsonify({"error": "Apenas admin pode alterar o vínculo de dojo"}), 403

        data = request.json or {}
        novo_dojo_id = data.get("dojo_id")
        if not novo_dojo_id:
            return jsonify({"error": "dojo_id é obrigatório"}), 400

        atleta, err = SupabaseService.get_profile_by_id(atleta_id)
        if not atleta:
            return jsonify({"error": "Atleta não encontrado"}), 404

        dojo_anterior_id = atleta.get("filial_id")

        if str(dojo_anterior_id) == str(novo_dojo_id):
            return jsonify({"error": "O atleta já está vinculado a este dojo"}), 409

        novo_dojo, err_dojo = SupabaseService.get_profile_by_id(novo_dojo_id)
        if not novo_dojo or novo_dojo.get("tipo") != "filial":
            return jsonify({"error": "Dojo/filial de destino não encontrado"}), 404

        filiais_db, _ = SupabaseService.get_all("filiais")
        filial_info = next((f for f in (filiais_db or []) if f["id"] == novo_dojo_id), None)

        novo_nome = filial_info.get("nome_fantasia") or novo_dojo.get("nome") if filial_info else novo_dojo.get("nome")

        update_data = {
            "filial_id": novo_dojo_id,
            "filial_nome": novo_nome,
        }

        _, error = SupabaseService.update("atletas", atleta_id, update_data)
        if error:
            return jsonify({"error": error}), 500

        nome_anterior = atleta.get("filial_nome") or "Nenhum"
        registrar_log_auditoria(
            user,
            "Alteração de Dojo",
            f"Atleta '{atleta.get('nome')}' (ID: {atleta_id}) transferido de '{nome_anterior}' para '{novo_nome}'."
        )

        try:
            from notif_routes import criar_notificacao
            criar_notificacao(
                destinatario_id=atleta_id,
                titulo="Transferência de Dojo",
                mensagem=f"Seu dojo foi alterado para {novo_nome}.",
                tipo="info"
            )
        except Exception:
            pass

        return jsonify({"success": True, "filial_id": novo_dojo_id, "filial_nome": novo_nome}), 200

    @app.route("/api/atletas/<atleta_id>/desvincular-dojo", methods=["DELETE"])
    def desvincular_dojo(atleta_id):
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") not in ["admin"]:
            return jsonify({"error": "Apenas admin pode desvincular atletas"}), 403

        atleta, err = SupabaseService.get_profile_by_id(atleta_id)
        if not atleta:
            return jsonify({"error": "Atleta não encontrado"}), 404

        if not atleta.get("filial_id"):
            return jsonify({"error": "Atleta não está vinculado a nenhum dojo"}), 409

        dojo_anterior_nome = atleta.get("filial_nome", "Desconhecido")

        update_data = {
            "filial_id": None,
            "filial_nome": None,
        }

        _, error = SupabaseService.update("atletas", atleta_id, update_data)
        if error:
            return jsonify({"error": error}), 500

        registrar_log_auditoria(
            user,
            "Desvínculo de Dojo",
            f"Atleta '{atleta.get('nome')}' (ID: {atleta_id}) desvinculado do dojo '{dojo_anterior_nome}'."
        )

        try:
            from notif_routes import criar_notificacao
            criar_notificacao(
                destinatario_id=atleta_id,
                titulo="Vínculo com Dojo Removido",
                mensagem=f"Seu vínculo com o dojo {dojo_anterior_nome} foi removido.",
                tipo="alerta"
            )
        except Exception:
            pass

        return jsonify({"success": True}), 200
