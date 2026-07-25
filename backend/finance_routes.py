from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_finance_routes(app: Flask):
    """Cria e registra as rotas financeiras"""

    @app.route("/api/financeiro", methods=["GET", "POST"])
    def handle_financeiro():
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            # Filtro inteligente ao invés de buscar tudo e filtrar em memória
            if user.get("tipo") == "admin":
                faturas, error = SupabaseService.get_all("financeiro")
            elif user.get("tipo") == "filial":
                faturas, error = SupabaseService.get_all("financeiro", filter_dict={"filial_id": user["id"]})
            else:  # atleta
                faturas, error = SupabaseService.get_all("financeiro", filter_dict={"atleta_id": user["id"]})

            if error:
                return jsonify({"error": error}), 500

            return jsonify({"pagamentos": faturas or []}), 200

        elif request.method == "POST":
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            
            # Validação de campos obrigatórios
            tipo = data.get("tipo", "anuidade")
            tipos_validos = ["anuidade", "mensalidade", "exame", "evento", "outro"]
            if tipo not in tipos_validos:
                return jsonify({"error": f"Tipo de fatura inválido. Escolha um entre: {', '.join(tipos_validos)}"}), 400

            valor_raw = data.get("valor")
            if valor_raw is None:
                return jsonify({"error": "O campo 'valor' é obrigatório"}), 400
            try:
                valor = float(valor_raw)
                if valor <= 0:
                    return jsonify({"error": "O valor da fatura deve ser maior que zero"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "O valor informado deve ser um número válido"}), 400

            data_vencimento = data.get("data_vencimento")
            if not data_vencimento:
                return jsonify({"error": "O campo 'data_vencimento' é obrigatório"}), 400
            try:
                from datetime import datetime
                datetime.strptime(data_vencimento, "%Y-%m-%d")
            except ValueError:
                return jsonify({"error": "Formato de data_vencimento inválido. Use AAAA-MM-DD"}), 400

            atleta_id = data.get("atleta_id")
            filial_id = data.get("filial_id")
            if not atleta_id and not filial_id:
                return jsonify({"error": "A fatura deve ser associada a um atleta_id ou a um filial_id"}), 400

            atleta_nome = None
            filial_nome = None

            if atleta_id:
                prof, _ = SupabaseService.get_profile_by_id(atleta_id)
                if not prof:
                    return jsonify({"error": f"Atleta com ID {atleta_id} não encontrado"}), 404
                if prof.get("tipo") != "atleta":
                    return jsonify({"error": f"O ID {atleta_id} não pertence a um atleta"}), 400
                atleta_nome = prof.get("nome")
                
            if filial_id:
                prof, _ = SupabaseService.get_profile_by_id(filial_id)
                if not prof:
                    return jsonify({"error": f"Filial com ID {filial_id} não encontrado"}), 404
                if prof.get("tipo") != "filial":
                    return jsonify({"error": f"O ID {filial_id} não pertence a uma filial"}), 400
                filial_nome = prof.get("nome_fantasia") or prof.get("nome")

            nova_fatura = {
                "atleta_id": atleta_id,
                "atleta_nome": atleta_nome,
                "filial_id": filial_id,
                "filial_nome": filial_nome,
                "tipo": tipo,
                "valor": valor,
                "data_vencimento": data_vencimento,
                "status": "pendente"
            }
            
            res, error = SupabaseService.insert("financeiro", nova_fatura)
            if error:
                return jsonify({"error": error}), 500
                
            # Log de auditoria
            dest_info = atleta_nome if atleta_nome else filial_nome
            registrar_log_auditoria(
                user, 
                "Criação de Fatura", 
                f"Fatura {tipo.upper()} de R$ {valor:.2f} criada para {dest_info} (Vencimento: {data_vencimento}, ID Fatura: {res.get('id')})"
            )
            
            return jsonify(res), 201

    @app.route("/api/financeiro/<id>", methods=["PATCH"])
    def handle_financeiro_update(id):
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        # Busca a fatura existente
        faturas, error = SupabaseService.get_all("financeiro")
        if error:
            return jsonify({"error": f"Erro ao buscar faturas: {error}"}), 500

        fatura = next((f for f in (faturas or []) if str(f.get("id")) == str(id)), None)
        if not fatura:
            return jsonify({"error": "Fatura não encontrada"}), 404

        # Enforca segurança e controle de privilégios (IDOR fix)
        is_admin = user.get("tipo") == "admin"
        is_owner = False

        if user.get("tipo") == "atleta" and fatura.get("atleta_id") == user["id"]:
            is_owner = True
        elif user.get("tipo") == "filial" and fatura.get("filial_id") == user["id"]:
            is_owner = True

        if not is_admin and not is_owner:
            return jsonify({"error": "Acesso não autorizado a esta fatura"}), 403

        data = request.json or {}

        # Validação do payload conforme permissão
        update_data = {}
        if is_admin:
            # Admin pode alterar tudo
            if "status" in data:
                status_validos = ["pendente", "pago", "cancelado"]
                if data["status"] not in status_validos:
                    return jsonify({"error": f"Status inválido. Escolha um entre: {', '.join(status_validos)}"}), 400
                update_data["status"] = data["status"]
            if "valor" in data:
                try:
                    update_data["valor"] = float(data["valor"])
                    if update_data["valor"] <= 0:
                        return jsonify({"error": "O valor deve ser maior que zero"}), 400
                except (ValueError, TypeError):
                    return jsonify({"error": "Valor inválido"}), 400
            if "data_vencimento" in data:
                try:
                    from datetime import datetime
                    datetime.strptime(data["data_vencimento"], "%Y-%m-%d")
                    update_data["data_vencimento"] = data["data_vencimento"]
                except ValueError:
                    return jsonify({"error": "Data de vencimento inválida. Use AAAA-MM-DD"}), 400
            if "tipo" in data:
                tipos_validos = ["anuidade", "mensalidade", "exame", "evento", "outro"]
                if data["tipo"] not in tipos_validos:
                    return jsonify({"error": "Tipo inválido"}), 400
                update_data["tipo"] = data["tipo"]
        else:
            # Usuário comum (atleta/filial) só pode pagar sua própria fatura
            chaves_permitidas = {"status", "metodo_pagamento"}
            if not set(data.keys()).issubset(chaves_permitidas):
                return jsonify({"error": "Não autorizado: usuários comuns só podem atualizar o status de pagamento"}), 403
            
            if "status" in data and data["status"] != "pago":
                return jsonify({"error": "Não autorizado: usuários comuns só podem pagar faturas"}), 403
                
            if fatura.get("status") == "pago":
                return jsonify({"error": "Esta fatura já está paga"}), 400
            if fatura.get("status") == "cancelado":
                return jsonify({"error": "Esta fatura foi cancelada e não pode ser paga"}), 400
                
            update_data["status"] = "pago"

        if not update_data:
            return jsonify({"error": "Nenhum dado válido fornecido para atualização"}), 400

        res, error = SupabaseService.update("financeiro", id, update_data)
        if error:
            return jsonify({"error": error}), 500

        # Registrar log de auditoria
        acao = "Compensação de Fatura" if update_data.get("status") == "pago" else "Atualização de Fatura"
        dest_info = fatura.get("atleta_nome") or fatura.get("filial_nome") or "Geral"
        detalhes = f"Fatura ID: {id} ({fatura.get('tipo', 'anuidade').upper()}) de R$ {fatura.get('valor', 0):.2f} para {dest_info} atualizada. Novos dados: {update_data}"
        registrar_log_auditoria(user, acao, detalhes)

        return jsonify(res), 200

    # ── PIX ───────────────────────────────────────────────────────────────
    @app.route("/api/financeiro/<id>/gerar-pix", methods=["POST"])
    def gerar_pix_fatura(id):
        from app import get_current_user
        from services import payment_service

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        faturas, _ = SupabaseService.get_all("financeiro")
        fatura = next((f for f in (faturas or []) if str(f.get("id")) == str(id)), None)
        if not fatura:
            return jsonify({"error": "Fatura não encontrada"}), 404
        if fatura.get("status") == "pago":
            return jsonify({"error": "Esta fatura já foi paga"}), 400

        # Obtém dados do atleta para o Asaas
        profiles, _ = SupabaseService.get_all("profiles")
        atleta_id = fatura.get("atleta_id") or user.get("id")
        atleta = next((p for p in (profiles or []) if str(p.get("id")) == str(atleta_id)), {})
        atleta["email"] = atleta.get("email") or user.get("email", "")

        try:
            resultado = payment_service.gerar_pix(atleta, fatura)
            # Salva id da cobrança na fatura para polling posterior
            SupabaseService.update("financeiro", id, {
                "asaas_id": resultado.get("id_cobranca"),
                "metodo_pagamento": "pix"
            })
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({"error": f"Erro ao gerar PIX: {str(e)}"}), 500

    # ── Boleto ────────────────────────────────────────────────────────────
    @app.route("/api/financeiro/<id>/gerar-boleto", methods=["POST"])
    def gerar_boleto_fatura(id):
        from app import get_current_user
        from services import payment_service

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        faturas, _ = SupabaseService.get_all("financeiro")
        fatura = next((f for f in (faturas or []) if str(f.get("id")) == str(id)), None)
        if not fatura:
            return jsonify({"error": "Fatura não encontrada"}), 404
        if fatura.get("status") == "pago":
            return jsonify({"error": "Esta fatura já foi paga"}), 400

        profiles, _ = SupabaseService.get_all("profiles")
        atleta_id = fatura.get("atleta_id") or user.get("id")
        atleta = next((p for p in (profiles or []) if str(p.get("id")) == str(atleta_id)), {})
        atleta["email"] = atleta.get("email") or user.get("email", "")

        try:
            resultado = payment_service.gerar_boleto(atleta, fatura)
            SupabaseService.update("financeiro", id, {
                "asaas_id": resultado.get("id_cobranca"),
                "metodo_pagamento": "boleto"
            })
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({"error": f"Erro ao gerar boleto: {str(e)}"}), 500

    # ── Status (polling do frontend) ──────────────────────────────────────
    @app.route("/api/financeiro/<id>/status-pagamento", methods=["GET"])
    def status_pagamento_fatura(id):
        from app import get_current_user
        from services import payment_service

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        faturas, _ = SupabaseService.get_all("financeiro")
        fatura = next((f for f in (faturas or []) if str(f.get("id")) == str(id)), None)
        if not fatura:
            return jsonify({"error": "Fatura não encontrada"}), 404

        if fatura.get("status") == "pago":
            return jsonify({"status": "RECEIVED", "fatura_status": "pago"}), 200

        asaas_id = fatura.get("asaas_id")
        resultado = payment_service.verificar_status(asaas_id or "")

        # Se Asaas confirmar pagamento, atualiza a fatura automaticamente
        if resultado.get("status") in ("RECEIVED", "CONFIRMED"):
            SupabaseService.update("financeiro", id, {"status": "pago"})
            resultado["fatura_status"] = "pago"

        return jsonify(resultado), 200

    # ── Webhook Asaas (chamado pelo Asaas quando pagamento é confirmado) ──
    @app.route("/api/financeiro/webhook/asaas", methods=["POST"])
    def webhook_asaas():
        import os
        token_esperado = os.environ.get("ASAAS_WEBHOOK_TOKEN", "")
        token_recebido = request.headers.get("asaas-access-token", "")
        if token_esperado and token_recebido != token_esperado:
            return jsonify({"error": "Token inválido"}), 403

        evento = request.json or {}
        payment_data = evento.get("payment", {})
        event_type = evento.get("event", "")

        if event_type in ("PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"):
            external_ref = payment_data.get("externalReference", "")
            asaas_id = payment_data.get("id", "")
            if external_ref:
                SupabaseService.update("financeiro", external_ref, {"status": "pago"})
            elif asaas_id:
                faturas, _ = SupabaseService.get_all("financeiro")
                fat = next((f for f in (faturas or []) if f.get("asaas_id") == asaas_id), None)
                if fat:
                    SupabaseService.update("financeiro", fat["id"], {"status": "pago"})

        return jsonify({"received": True}), 200
