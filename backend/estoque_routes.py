from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_estoque_routes(app: Flask):
    """Cria e registra as rotas do controle de estoque"""

    @app.route("/api/estoque/produtos", methods=["GET", "POST"])
    def handle_produtos():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial"]:
            return jsonify({"error": "Acesso não autorizado"}), 403

        if request.method == "GET":
            produtos, error = SupabaseService.get_all("produtos_estoque")
            if error:
                return jsonify({"error": f"Erro ao buscar produtos: {error}"}), 500
            return jsonify({"produtos": produtos or []}), 200

        elif request.method == "POST":
            if user.get("tipo") != "admin":
                return jsonify({"error": "Apenas administradores podem cadastrar produtos"}), 403

            data = request.json or {}
            nome = data.get("nome")
            categoria = data.get("categoria")
            if not nome or not categoria:
                return jsonify({"error": "Nome e categoria são obrigatórios"}), 400

            # Prepara dados do produto
            novo_produto = {
                "nome": nome,
                "descricao": data.get("descricao", ""),
                "categoria": categoria,
                "preco_compra": float(data.get("preco_compra", 0) or 0),
                "preco_venda": float(data.get("preco_venda", 0) or 0),
                "quantidade_estoque": int(data.get("quantidade_estoque", 0) or 0),
                "estoque_minimo": int(data.get("estoque_minimo", 5) or 5),
                "fornecedor_id": data.get("fornecedor_id"),
                "fornecedor_nome": data.get("fornecedor_nome", ""),
                "tamanho": data.get("tamanho", "Único")
            }

            res, error = SupabaseService.insert("produtos_estoque", novo_produto)
            if error:
                return jsonify({"error": f"Erro ao criar produto: {error}"}), 500

            # Registrar log de auditoria
            detalhes = f"Produto '{nome}' cadastrado com estoque inicial de {novo_produto['quantidade_estoque']} un."
            registrar_log_auditoria(user, "CADASTRO_PRODUTO", detalhes)

            # Se a quantidade inicial for > 0, registra também uma movimentação de entrada inicial
            if novo_produto["quantidade_estoque"] > 0:
                mov_inicial = {
                    "produto_id": res.get("id"),
                    "produto_nome": nome,
                    "tipo": "entrada",
                    "quantidade": novo_produto["quantidade_estoque"],
                    "motivo": "Estoque Inicial",
                    "usuario_id": user.get("id"),
                    "usuario_nome": user.get("nome") or user.get("nome_fantasia") or user.get("email")
                }
                SupabaseService.insert("movimentacoes_estoque", mov_inicial)

            return jsonify(res), 201

    @app.route("/api/estoque/produtos/<id>", methods=["PATCH", "DELETE"])
    def handle_produto_id(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        if request.method == "PATCH":
            data = request.json or {}
            # Limpa chaves vazias ou não modificáveis
            update_data = {}
            for field in ["nome", "descricao", "categoria", "preco_compra", "preco_venda", "quantidade_estoque", "estoque_minimo", "fornecedor_id", "fornecedor_nome", "tamanho"]:
                if field in data:
                    val = data[field]
                    if field in ["preco_compra", "preco_venda"]:
                        update_data[field] = float(val or 0)
                    elif field in ["quantidade_estoque", "estoque_minimo"]:
                        update_data[field] = int(val or 0)
                    else:
                        update_data[field] = val

            res, error = SupabaseService.update("produtos_estoque", id, update_data)
            if error:
                return jsonify({"error": f"Erro ao atualizar produto: {error}"}), 500

            registrar_log_auditoria(user, "EDICAO_PRODUTO", f"Produto ID {id} editado: {update_data}")
            return jsonify(res), 200

        elif request.method == "DELETE":
            res, error = SupabaseService.delete("produtos_estoque", id)
            if error:
                return jsonify({"error": f"Erro ao excluir produto: {error}"}), 500

            registrar_log_auditoria(user, "EXCLUSAO_PRODUTO", f"Produto ID {id} excluído")
            return jsonify(res), 200

    @app.route("/api/estoque/movimentar", methods=["POST"])
    def handle_movimentar():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial"]:
            return jsonify({"error": "Acesso não autorizado"}), 403

        data = request.json or {}
        produto_id = data.get("produto_id")
        tipo = data.get("tipo")
        quantidade = data.get("quantidade")
        motivo = data.get("motivo")

        if not produto_id or not tipo or quantidade is None or not motivo:
            return jsonify({"error": "produto_id, tipo, quantidade e motivo são obrigatórios"}), 400

        if tipo not in ["entrada", "saida"]:
            return jsonify({"error": "Tipo de movimentação inválido. Use 'entrada' ou 'saida'"}), 400

        try:
            quantidade = int(quantidade)
            if quantidade <= 0:
                return jsonify({"error": "Quantidade deve ser maior que zero"}), 400
        except ValueError:
            return jsonify({"error": "Quantidade inválida"}), 400

        # Buscar o produto
        produtos, error = SupabaseService.get_all("produtos_estoque")
        if error:
            return jsonify({"error": f"Erro ao buscar produto: {error}"}), 500

        produto = None
        for p in (produtos or []):
            if str(p.get("id")) == str(produto_id):
                produto = p
                break

        if not produto:
            return jsonify({"error": "Produto não encontrado"}), 404

        current_qty = int(produto.get("quantidade_estoque", 0) or 0)

        # Calcula nova quantidade
        if tipo == "entrada":
            new_qty = current_qty + quantidade
        else:  # saida
            if current_qty < quantidade:
                return jsonify({"error": "Quantidade insuficiente em estoque para realizar a saída"}), 400
            new_qty = current_qty - quantidade

        # Atualizar produto
        _, error = SupabaseService.update("produtos_estoque", produto_id, {"quantidade_estoque": new_qty})
        if error:
            return jsonify({"error": f"Erro ao atualizar estoque do produto: {error}"}), 500

        # Registrar movimentação
        nova_mov = {
            "produto_id": produto_id,
            "produto_nome": produto.get("nome"),
            "tipo": tipo,
            "quantidade": quantidade,
            "motivo": motivo,
            "usuario_id": user.get("id"),
            "usuario_nome": user.get("nome") or user.get("nome_fantasia") or user.get("email")
        }

        res, error = SupabaseService.insert("movimentacoes_estoque", nova_mov)
        if error:
            # Tenta reverter o estoque se der erro ao registrar movimentação
            SupabaseService.update("produtos_estoque", produto_id, {"quantidade_estoque": current_qty})
            return jsonify({"error": f"Erro ao registrar movimentação: {error}"}), 500

        # Registrar log de auditoria
        acao_audit = "ENTRADA_ESTOQUE" if tipo == "entrada" else "SAIDA_ESTOQUE"
        detalhes_audit = f"{quantidade} un. de '{produto.get('nome')}' ({tipo}). Motivo: {motivo}"
        registrar_log_auditoria(user, acao_audit, detalhes_audit)

        return jsonify({
            "movimentacao": res,
            "quantidade_atualizada": new_qty
        }), 201

    @app.route("/api/estoque/movimentacoes", methods=["GET"])
    def handle_movimentacoes():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") not in ["admin", "filial"]:
            return jsonify({"error": "Acesso não autorizado"}), 403

        movs, error = SupabaseService.get_all("movimentacoes_estoque", order_by="created_at", ascending=False)
        if error:
            return jsonify({"error": f"Erro ao buscar movimentações: {error}"}), 500

        return jsonify({"movimentacoes": movs or []}), 200
