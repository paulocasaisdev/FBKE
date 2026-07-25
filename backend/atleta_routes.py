from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_atleta_routes(app: Flask):
    """Cria e registra as rotas de atletas"""

    @app.route("/api/atletas/public", methods=["POST"])
    def register_atleta():
        import uuid
        data = request.json or {}
        nome = data.get("nome")
        email = data.get("email")
        telefone = data.get("telefone")
        senha = data.get("senha")
        aceita_termos = data.get("aceita_termos")
        if not aceita_termos:
            return jsonify({"error": "É necessário aceitar os Termos de Serviço e Aviso de Privacidade do Portal GRKK"}), 400

        if not nome or not email or not telefone:
            return jsonify({"error": "Nome, e-mail e telefone são obrigatórios"}), 400

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
            "telefone": telefone,
            "tipo": "atleta",
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

        atleta_item = {
            "id": user_id,
            "email": email,
            "telefone": telefone,
            "status": "pendente",
            "faixa": "Branca",
            "filial_id": data.get("filial_id"),
            "filial_nome": data.get("filial_nome"),
            "documentos_entregues": False
        }
        atleta, error2 = SupabaseService.insert("atletas", atleta_item)
        if error2:
            return jsonify({"error": error2}), 500

        # Notifica o cadastro pendente do atleta
        try:
            from notif_routes import criar_notificacao
            criar_notificacao(
                destinatario_id=None,
                titulo="Nova Solicitação de Cadastro",
                mensagem=f"O atleta {nome} se cadastrou e aguarda homologação.",
                tipo="alerta"
            )
        except Exception as n_err:
            print(f"Erro ao criar notificação de cadastro de atleta: {n_err}")

        return jsonify({"success": True, "atleta": atleta}), 201

    @app.route("/api/atletas", methods=["GET"])
    def get_atletas_lista():
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial"]:
            return jsonify({"error": "Não autorizado"}), 403

        atletas_db, error = SupabaseService.get_all("atletas")
        profiles_db, _ = SupabaseService.get_all("profiles")

        res_atletas = []
        for atl in (atletas_db or []):
            prof = next((p for p in (profiles_db or []) if p["id"] == atl["id"]), None)
            if prof:
                item = dict(prof)
                item.update(atl)

                if user.get("tipo") == "filial" and item.get("filial_id") != user["id"]:
                    continue

                res_atletas.append(item)

        return jsonify({"atletas": res_atletas}), 200

    @app.route("/api/atletas/<id>", methods=["PATCH"])
    def patch_atleta(id):
        from app import get_current_user
        from services.audit_service import registrar_log_auditoria

        user = get_current_user()
        print(f"DEBUG: patch_atleta called with id={id}, type={type(id)}")
        if user:
            print(f"DEBUG: get_current_user returned user id={user.get('id')}, type={type(user.get('id'))}, match={user.get('id') == id}")
        else:
            print("DEBUG: get_current_user returned None!")
            
        if not user or (user.get("tipo") not in ["admin", "filial"] and str(user.get("id")) != str(id)):
            return jsonify({"error": "Não autorizado"}), 403

        data = request.json or {}
        existing_atleta, _ = SupabaseService.get_profile_by_id(id)

        # Validação de menor de idade
        data_nasc = data.get("data_nascimento") or (existing_atleta.get("data_nascimento") if existing_atleta else None)
        # Só valida se estiver alterando dados cadastrais importantes, ativando o perfil ou editando o responsável
        campos_cadastrais = ["nome", "data_nascimento", "responsavel_nome", "responsavel_cpf", "responsavel_telefone", "status"]
        necessita_validar = any(c in data for c in campos_cadastrais) or (data.get("status") == "ativo")
        
        if data_nasc and necessita_validar:
            try:
                from datetime import datetime, date
                birth_date = datetime.strptime(data_nasc, "%Y-%m-%d").date()
                today = date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                if age < 18:
                    resp_nome = data.get("responsavel_nome") or (existing_atleta.get("responsavel_nome") if existing_atleta else None)
                    resp_cpf = data.get("responsavel_cpf") or (existing_atleta.get("responsavel_cpf") if existing_atleta else None)
                    resp_tel = data.get("responsavel_telefone") or (existing_atleta.get("responsavel_telefone") if existing_atleta else None)
                    if not resp_nome or not resp_cpf or not resp_tel:
                        return jsonify({"error": "Dados do responsável (nome, CPF, telefone) são obrigatórios para menores de 18 anos."}), 400
            except Exception:
                pass

        update_prof = {}
        for field in ["nome", "email", "telefone", "cidade", "status"]:
            if field in data:
                update_prof[field] = data[field]

        # Apenas admin ou filial podem atualizar o status no profile
        if user.get("tipo") == "atleta":
            update_prof.pop("status", None)

        if update_prof:
            SupabaseService.update("profiles", id, update_prof)

        # Garante que o registro correspondente na tabela atletas existe
        if existing_atleta and existing_atleta.get("tipo") == "atleta":
            atletas_db, _ = SupabaseService.get_all("atletas", filter_dict={"id": id})
            if not atletas_db:
                atleta_item = {
                    "id": id,
                    "email": existing_atleta.get("email") or "",
                    "telefone": existing_atleta.get("telefone") or "",
                    "status": existing_atleta.get("status") or "pendente",
                    "faixa": "Branca"
                }
                SupabaseService.insert("atletas", atleta_item)

        update_atl = {}
        fields_to_update = [
            "status", "faixa", "filial_id", "filial_nome", "cpf", "sexo", "data_nascimento", 
            "nome_professor", "cep", "endereco", "cidade", "uf", 
            "responsavel_nome", "responsavel_cpf", "responsavel_email", "responsavel_telefone",
            "medico_alergias", "medico_plano", "medico_restricoes", "medico_diagnosticos",
            "arte_marcial", "estilo", "academia_clube", "medico_tipo_sanguineo", "medico_fator_rh",
            "medico_sus", "medico_emergencia_nome", "medico_emergencia_telefone", "medico_medicacao_uso",
            "medico_medicacao_lista", "medico_alergia_medicamento", "fisico_peso", "fisico_altura",
            "autoriza_uso_imagem", "registro_federacao", "documentos_entregues", "ja_praticou_artes_marciais"
        ]
        for field in fields_to_update:
            if field in data:
                update_atl[field] = data[field]

        # Atletas não podem mudar status ou faixa
        if user.get("tipo") == "atleta":
            update_atl.pop("status", None)
            update_atl.pop("faixa", None)

        # Se foi homologado (status alterado para ativo), gera o registro_federacao se não houver
        if (update_prof.get("status") == "ativo" or update_atl.get("status") == "ativo") and existing_atleta and existing_atleta.get("status") != "ativo":
            if not existing_atleta.get("registro_federacao") and not update_atl.get("registro_federacao"):
                from datetime import datetime
                ano_atual = datetime.now().year
                codigo_gerado = f"GRKK-A-{ano_atual}-{str(id)[:5].upper()}"
                update_atl["registro_federacao"] = codigo_gerado

        res, error = SupabaseService.update("atletas", id, update_atl)
        if error:
            return jsonify({"error": error}), 500

        # Registrar histórico de auditoria do termo de uso de imagem
        if "autoriza_uso_imagem" in update_atl:
            novo_status = update_atl["autoriza_uso_imagem"]
            status_anterior = existing_atleta.get("autoriza_uso_imagem") if existing_atleta else None
            if status_anterior != novo_status:
                acao_audit = "AUTORIZACAO_IMAGEM_ACEITA" if novo_status else "AUTORIZACAO_IMAGEM_REJEITADA"
                detalhes_audit = f"O atleta {update_prof.get('nome') or (existing_atleta.get('nome') if existing_atleta else 'sem nome')} ({id}) {'autorizou' if novo_status else 'rejeitou/não autorizou'} o termo de uso de imagem."
                registrar_log_auditoria(user, acao_audit, detalhes_audit)

        # Se foi homologado (status alterado para ativo)
        if (update_prof.get("status") == "ativo" or update_atl.get("status") == "ativo") and existing_atleta and existing_atleta.get("status") != "ativo":
            try:
                from notif_routes import criar_notificacao
                criar_notificacao(
                    destinatario_id=id,
                    titulo="Cadastro Homologado",
                    mensagem="Seu perfil de atleta foi homologado com sucesso!",
                    tipo="sucesso"
                )
            except Exception as n_err:
                print(f"Erro ao notificar aprovação de atleta: {n_err}")

        # Registrar log de auditoria
        campos_atualizados = list(update_prof.keys()) + list(update_atl.keys())
        registrar_log_auditoria(
            user,
            "Atualização de Atleta",
            f"Perfil do atleta {existing_atleta.get('nome')} (ID: {id}) atualizado. Campos: {', '.join(set(campos_atualizados))}"
        )

        updated_atleta, _ = SupabaseService.get_profile_by_id(id)
        return jsonify(updated_atleta), 200

    @app.route("/api/atletas/<id>", methods=["DELETE"])
    def delete_atleta(id):
        from app import get_current_user
        from services.audit_service import registrar_log_auditoria

        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial"]:
            return jsonify({"error": "Acesso não autorizado"}), 403

        # Busca atleta antes de deletar para obter o nome para auditoria
        atleta, _ = SupabaseService.get_profile_by_id(id)
        atleta_nome = atleta.get("nome") if atleta else id

        # Se o usuário for dojo/filial, só pode excluir atletas da sua filial
        if user.get("tipo") == "filial" and atleta and atleta.get("filial_id") != user["id"]:
            return jsonify({"error": "Não autorizado a excluir atleta de outra filial"}), 403

        # Remove de atletas
        _, error = SupabaseService.delete("atletas", id)
        if error:
            return jsonify({"error": error}), 500

        # Remove do profiles
        _, error2 = SupabaseService.delete("profiles", id)
        if error2:
            return jsonify({"error": error2}), 500

        # Registrar log de auditoria
        registrar_log_auditoria(
            user,
            "Exclusão de Atleta",
            f"Atleta '{atleta_nome}' (ID: {id}) excluído com sucesso."
        )

        return jsonify({"sucesso": True}), 200

    @app.route("/api/atletas/self-register", methods=["POST"])
    def self_register_as_atleta():
        from app import get_current_user
        from services.audit_service import registrar_log_auditoria

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        data = request.get_json(silent=True) or {}
        target_id = data.get("filial_id") if (user.get("tipo") == "admin" and data.get("filial_id")) else user["id"]

        is_filial_user = False
        if user.get("tipo") in ["filial", "admin"]:
            is_filial_user = True
        else:
            filial_rec, _ = SupabaseService.get_all("filiais", filter_dict={"id": target_id})
            if filial_rec:
                is_filial_user = True

        if not is_filial_user:
            return jsonify({"error": "Sua conta não possui papel de filial/dojo credenciado."}), 403

        filial_info, _ = SupabaseService.get_profile_by_id(target_id)
        if not filial_info:
            filial_info = user

        # Verifica se já possui registro como atleta
        existing, _ = SupabaseService.get_all("atletas", filter_dict={"id": target_id})
        if existing:
            return jsonify({"error": "Esta conta já possui um registro de atleta vinculado."}), 400

        cpf_consolidado = (
            filial_info.get("cpf_responsavel")
            or filial_info.get("cnpj_cpf")
            or filial_info.get("cpf")
            or user.get("cpf_responsavel")
            or user.get("cnpj_cpf")
            or user.get("cpf")
            or ""
        )

        nome_atleta = (
            filial_info.get("nome_responsavel")
            or filial_info.get("nome")
            or user.get("nome")
            or "Sensei / Atleta"
        )

        atleta_item = {
            "id": target_id,
            "nome": nome_atleta,
            "email": filial_info.get("email", ""),
            "telefone": filial_info.get("telefone", ""),
            "status": "pendente",
            "faixa": filial_info.get("graduacao_responsavel") or "Branca",
            "cpf": cpf_consolidado,
            "filial_id": target_id,
            "filial_nome": filial_info.get("nome_fantasia") or filial_info.get("nome", ""),
            "cep": filial_info.get("cep", ""),
            "endereco": filial_info.get("rua") or filial_info.get("endereco") or "",
            "cidade": filial_info.get("municipio") or filial_info.get("cidade") or "",
            "uf": filial_info.get("estado") or filial_info.get("uf") or "",
            "data_nascimento": filial_info.get("data_nascimento") or user.get("data_nascimento") or "1990-01-01",
            "categoria": "Adulto",
            "documentos_entregues": False
        }
        atleta, error = SupabaseService.insert("atletas", atleta_item)
        if error:
            return jsonify({"error": error}), 500

        registrar_log_auditoria(
            user,
            "Auto-solicitação de Atleta",
            f"Solicitado vínculo de atleta ativo para o responsável da filial '{filial_info.get('nome')}' ({target_id})."
        )

        try:
            from notif_routes import criar_notificacao
            criar_notificacao(
                destinatario_id=None,
                titulo="Nova Solicitação de Atleta (Filial)",
                mensagem=f"O Sensei/Responsável da filial '{filial_info.get('nome')}' solicitou cadastro de atleta.",
                tipo="alerta"
            )
        except Exception:
            pass

        return jsonify({"success": True, "atleta": atleta}), 201

