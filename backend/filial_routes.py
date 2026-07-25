from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_filial_routes(app: Flask):
    """Cria e registra as rotas de filiais"""

    @app.route("/api/filiais/public", methods=["GET"])
    def get_public_filiais():
        filiais_db, error = SupabaseService.get_all("filiais")
        if error:
            return jsonify({"error": error}), 500
        
        # Filtra apenas filiais homologadas
        res = []
        for fil in (filiais_db or []):
            if fil.get("status") == "ativo":
                res.append({
                    "id": fil["id"],
                    "nome": fil["nome"]
                })
        return jsonify({"filiais": res}), 200

    @app.route("/api/filiais", methods=["GET", "POST"])
    def register_filial():
        from app import get_current_user

        if request.method == "GET":
            user = get_current_user()
            if not user or user.get("tipo") not in ["admin", "filial"]:
                return jsonify({"error": "Acesso não autorizado"}), 403

            filiais_db, error = SupabaseService.get_all("filiais")
            profiles_db, _ = SupabaseService.get_all("profiles")

            res_filiais = []
            for fil in (filiais_db or []):
                prof = next((p for p in (profiles_db or []) if p["id"] == fil["id"]), None)
                if prof:
                    item = dict(prof)
                    item.update(fil)
                    res_filiais.append(item)

            return jsonify({"filiais": res_filiais}), 200

        import uuid
        data = request.json or {}
        nome = data.get("nome")
        email = data.get("email")
        telefone = data.get("telefone")
        senha = data.get("senha")
        aceita_termos = data.get("aceita_termos")

        if not aceita_termos:
            return jsonify({"error": "É necessário aceitar os Termos de Serviço e Aviso de Privacidade do Portal GRKK"}), 400

        if not nome or not email:
            return jsonify({"error": "Nome e e-mail da filial são obrigatórios"}), 400

        user_id = str(uuid.uuid4())

        # Cria a conta no Supabase Auth se não estiver em modo mock
        if not SupabaseService.is_mock():
            try:
                from services.supabase_service import supabase
                user_attrs = {
                    "email": email,
                    "password": senha if senha else "GojuRyu123!",
                    "email_confirm": True,
                    "id": user_id
                }
                supabase.auth.admin.create_user(user_attrs)
            except Exception as auth_err:
                return jsonify({"error": f"Erro ao criar conta no Supabase Auth: {str(auth_err)}"}), 400

        profile_item = {
            "id": user_id,
            "nome": nome,
            "email": email,
            "telefone": telefone or "",
            "tipo": "filial",
            "status": "pendente"
        }
        profile, error = SupabaseService.insert("profiles", profile_item)
        if error:
            # Se der erro de banco na inserção de dados, tenta remover o usuário do Auth para consistência
            if not SupabaseService.is_mock():
                try:
                    from services.supabase_service import supabase
                    supabase.auth.admin.delete_user(user_id)
                except Exception:
                    pass
            return jsonify({"error": error}), 500

        filial_item = {
            "id": user_id,
            "nome": nome,
            "email": email,
            "telefone": telefone or "",
            "cnpj_cpf": data.get("cnpj_cpf", ""),
            "status": "pendente",
            "codigo_interno": "MOCK-FILIAL-" + user_id[:5].upper()
        }
        filial, error2 = SupabaseService.insert("filiais", filial_item)
        if error2:
            return jsonify({"error": error2}), 500

        # Notifica o cadastro pendente do dojo/filial
        try:
            from notif_routes import criar_notificacao
            criar_notificacao(
                destinatario_id=None,
                titulo="Nova Filial Cadastrada",
                mensagem=f"O dojo/filial {nome} solicitou credenciamento no sistema.",
                tipo="alerta"
            )
        except Exception as n_err:
            print(f"Erro ao criar notificação de cadastro de filial: {n_err}")

        return jsonify({"success": True, "filial": filial}), 201

    @app.route("/api/filiais/<id>", methods=["PATCH"])
    def patch_filial(id):
        from app import get_current_user

        user = get_current_user()
        if not user or (user.get("tipo") != "admin" and str(user.get("id")) != str(id)):
            return jsonify({"error": "Acesso não autorizado"}), 403

        data = request.json or {}
        
        # Se não for admin, removemos campos administrativos
        if user.get("tipo") != "admin":
            data.pop("status", None)
            data.pop("codigo_interno", None)
            data.pop("tipo", None)
            data.pop("motivo_reprovacao", None)

        update_prof = {}
        for field in ["nome", "email", "telefone"]:
            if field in data:
                update_prof[field] = data[field]
        
        if "nome_fantasia" in data:
            update_prof["nome_fantasia"] = data["nome_fantasia"]
        
        # Mapeia municipio para cidade em profiles
        if "municipio" in data:
            update_prof["cidade"] = data["municipio"]

        if user.get("tipo") == "admin" and "status" in data:
            update_prof["status"] = data["status"]

        if update_prof:
            SupabaseService.update("profiles", id, update_prof)

        # Campos permitidos na tabela de filiais
        update_fil = {}
        fields_to_update = [
            "nome", "email", "telefone", "nome_fantasia", "cnpj_cpf", "cpf_responsavel", "graduacao_responsavel",
            "registro_federativo", "cep", "rua", "numero", "bairro", "municipio", "estado"
        ]
        
        if user.get("tipo") == "admin":
            fields_to_update.extend(["status", "codigo_interno", "tipo", "motivo_reprovacao"])

        for field in fields_to_update:
            if field in data:
                update_fil[field] = data[field]

        # Se a filial foi homologada (status alterado para ativo), gera o registro_federativo ou codigo_interno
        if (update_prof.get("status") == "ativo" or update_fil.get("status") == "ativo"):
            existing_filial, _ = SupabaseService.get_profile_by_id(id)
            if existing_filial and existing_filial.get("status") != "ativo":
                from datetime import datetime
                ano_atual = datetime.now().year
                codigo_gerado = f"GRKK-F-{ano_atual}-{str(id)[:5].upper()}"
                if not existing_filial.get("registro_federativo") and not update_fil.get("registro_federativo"):
                    update_fil["registro_federativo"] = codigo_gerado
                if not existing_filial.get("codigo_interno") or existing_filial.get("codigo_interno").startswith("MOCK-FILIAL"):
                    update_fil["codigo_interno"] = codigo_gerado

        if update_fil:
            res, error = SupabaseService.update("filiais", id, update_fil)
            if error:
                return jsonify({"error": error}), 500

            # Sincronização automática para contas com perfil unificado (também atleta)
            novo_cpf = update_fil.get("cpf_responsavel") or update_fil.get("cnpj_cpf")
            if novo_cpf:
                atletas, _ = SupabaseService.get_all("atletas", filter_dict={"id": id})
                if atletas:
                    SupabaseService.update("atletas", id, {"cpf": novo_cpf})

        updated_filial, _ = SupabaseService.get_profile_by_id(id)

        # Se a filial foi homologada (status alterado para ativo)
        if (update_prof.get("status") == "ativo" or update_fil.get("status") == "ativo") and updated_filial and updated_filial.get("status") == "ativo":
            try:
                from notif_routes import criar_notificacao
                criar_notificacao(
                    destinatario_id=id,
                    titulo="Credenciamento Aprovado",
                    mensagem="O credenciamento do seu dojo/filial foi homologado pela Associação com sucesso!",
                    tipo="sucesso"
                )
            except Exception as n_err:
                print(f"Erro ao notificar aprovação de filial: {n_err}")

        # Registrar log de auditoria
        registrar_log_auditoria(
            user,
            "Atualização de Filial",
            f"Filial {updated_filial.get('nome') if updated_filial else id} (ID: {id}) atualizada."
        )

        return jsonify(updated_filial), 200

    @app.route("/api/filiais/<id>", methods=["DELETE"])
    def delete_filial(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        # Busca filial antes de deletar para obter o nome para auditoria
        filial, _ = SupabaseService.get_profile_by_id(id)
        filial_nome = filial.get("nome") if filial else id

        # Remove de filiais
        _, error = SupabaseService.delete("filiais", id)
        if error:
            return jsonify({"error": error}), 500

        # Remove do profiles
        _, error2 = SupabaseService.delete("profiles", id)
        if error2:
            return jsonify({"error": error2}), 500

        # Registrar log de auditoria
        registrar_log_auditoria(
            user,
            "Exclusão de Filial",
            f"Filial '{filial_nome}' (ID: {id}) excluída com sucesso."
        )

        return jsonify({"sucesso": True}), 200
