import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_despesa_routes(app: Flask):
    """Cria e registra rotas para controle e lançamento de despesas/saídas (Fluxo de Caixa)."""

    @app.route("/api/despesas", methods=["GET", "POST"])
    def handle_despesas():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            # Busca todas as despesas
            despesas, error = SupabaseService.get_all("despesas", order_by="data_pagamento", ascending=False)
            if error:
                return jsonify({"error": error}), 500

            # Filtra por filial se o usuário for do tipo 'filial'
            if user.get("tipo") == "filial":
                result = [d for d in (despesas or []) if str(d.get("filial_id")) == str(user.get("id"))]
            elif user.get("tipo") == "admin":
                result = despesas or []
            else:
                # Atletas não têm acesso a visualizar despesas gerais do dojo
                return jsonify({"error": "Acesso não autorizado"}), 403

            return jsonify({"despesas": result}), 200

        elif request.method == "POST":
            # Apenas admins podem lançar despesas
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            categoria = data.get("categoria")
            valor_raw = data.get("valor")
            data_pagamento = data.get("data_pagamento")
            descricao = data.get("descricao", "")
            filial_id = data.get("filial_id") or None

            if not categoria or valor_raw is None or not data_pagamento:
                return jsonify({"error": "Os campos 'categoria', 'valor' e 'data_pagamento' são obrigatórios"}), 400

            try:
                valor = float(valor_raw)
                if valor <= 0:
                    return jsonify({"error": "O valor da despesa deve ser maior que zero"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "O valor da despesa deve ser um número válido"}), 400

            try:
                datetime.strptime(data_pagamento, "%Y-%m-%d")
            except ValueError:
                return jsonify({"error": "Formato de 'data_pagamento' inválido. Use AAAA-MM-DD"}), 400

            # Resolve nome da filial se houver filial_id
            filial_nome = "Matriz / Associação"
            if filial_id:
                profiles, _ = SupabaseService.get_all("profiles")
                filial = next((p for p in (profiles or []) if str(p.get("id")) == str(filial_id)), None)
                if filial:
                    filial_nome = filial.get("nome", "Filial")

            nova_despesa = {
                "id": str(uuid.uuid4()),
                "filial_id": filial_id,
                "filial_nome": filial_nome,
                "categoria": categoria,
                "descricao": descricao,
                "valor": valor,
                "data_pagamento": data_pagamento,
                "created_at": datetime.utcnow().isoformat() + "Z"
            }

            res, error = SupabaseService.insert("despesas", nova_despesa)
            if error:
                return jsonify({"error": error}), 500

            # Log de auditoria
            from services.audit_service import registrar_log_auditoria
            registrar_log_auditoria(
                user=user,
                acao="Lançamento Despesa",
                detalhes=f"Despesa de R$ {valor:.2f} lançada na categoria '{categoria}' para '{filial_nome}'."
            )

            return jsonify(res), 201

    @app.route("/api/despesas/<id>", methods=["DELETE"])
    def handle_despesa_delete(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        # Verifica se despesa existe
        despesas, _ = SupabaseService.get_all("despesas")
        desp = next((d for d in (despesas or []) if str(d.get("id")) == str(id)), None)
        if not desp:
            return jsonify({"error": "Despesa não encontrada"}), 404

        _, error = SupabaseService.delete("despesas", id)
        if error:
            return jsonify({"error": error}), 500

        # Log de auditoria
        from services.audit_service import registrar_log_auditoria
        registrar_log_auditoria(
            user=user,
            acao="Exclusão Despesa",
            detalhes=f"Excluída despesa '{desp.get('categoria')}' de R$ {desp.get('valor') or 0:.2f} (ID: {id})."
        )

        return jsonify({"success": True}), 200
