from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_event_routes(app: Flask):
    """Cria e registra as rotas de eventos"""

    @app.route("/api/eventos", methods=["GET", "POST"])
    def handle_eventos():
        from app import get_current_user

        if request.method == "GET":
            eventos, error = SupabaseService.get_all("eventos", order_by="data_inicio", ascending=False)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"eventos": eventos}), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Acesso não autorizado"}), 403

            data = request.json or {}
            titulo = data.get("titulo")
            tipo = data.get("tipo")
            if not titulo:
                return jsonify({"error": "Título é obrigatório"}), 400

            evento, error = SupabaseService.insert("eventos", data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Criação de Evento",
                f"Evento '{titulo}' (Tipo: {tipo}) criado."
            )

            return jsonify(evento), 201

    @app.route("/api/eventos/<id>", methods=["PATCH", "DELETE"])
    def gerenciar_evento(id):
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        if request.method == "PATCH":
            data = request.json or {}
            evento, error = SupabaseService.update("eventos", id, data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Edição de Evento",
                f"Evento '{evento.get('titulo')}' (ID: {id}) modificado."
            )

            return jsonify(evento), 200

        elif request.method == "DELETE":
            # Busca o evento antes de deletar para obter o título para o log
            eventos, _ = SupabaseService.get_all("eventos")
            evento = next((e for e in (eventos or []) if str(e["id"]) == id), None)
            titulo = evento.get("titulo") if evento else id

            res, error = SupabaseService.delete("eventos", id)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Exclusão de Evento",
                f"Evento '{titulo}' (ID: {id}) excluído."
            )

            return jsonify({"sucesso": True}), 200

    @app.route("/api/eventos/inscricoes", methods=["GET", "POST"])
    def gerenciar_inscricoes():
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            evento_id = request.args.get("evento_id")
            filter_dict = {}
            if evento_id:
                filter_dict["evento_id"] = evento_id

            inscricoes, error = SupabaseService.get_all("eventos_inscricoes", filter_dict=filter_dict)
            if error or not inscricoes:
                inscricoes, error = SupabaseService.get_all("inscricoes_evento", filter_dict=filter_dict)

            filtrados = []
            for ins in (inscricoes or []):
                if user.get("tipo") == "admin":
                    filtrados.append(ins)
                elif user.get("tipo") == "filial":
                    if ins.get("filial_id") == user["id"]:
                        filtrados.append(ins)
                else:
                    if ins.get("atleta_id") == user["id"]:
                        filtrados.append(ins)

            return jsonify({"inscricoes": filtrados}), 200

        elif request.method == "POST":
            data = request.json or {}
            atleta_id = data.get("atleta_id") or user["id"]

            atleta_perfil, _ = SupabaseService.get_profile_by_id(atleta_id)

            nova_inscricao = {
                "evento_id": data.get("evento_id"),
                "atleta_id": atleta_id,
                "atleta_nome": atleta_perfil.get("nome", "Atleta"),
                "filial_id": atleta_perfil.get("filial_id", "dojo-central"),
                "filial_nome": atleta_perfil.get("filial_nome", "Dojo Central"),
                "categoria": data.get("categoria", "Kata"),
                "faixa": atleta_perfil.get("faixa", "Branca"),
                "idade": data.get("idade", 18),
                "pagamento_status": "pendente",
                "status": "confirmado"
            }

            res, error = SupabaseService.insert("eventos_inscricoes", nova_inscricao)
            if error:
                res, error = SupabaseService.insert("inscricoes_evento", nova_inscricao)

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 201

    @app.route("/api/eventos/inscricoes/<id>", methods=["PATCH"])
    def atualizar_inscricao(id):
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        data = request.json or {}

        inscricoes, _ = SupabaseService.get_all("eventos_inscricoes")
        tabela = "eventos_inscricoes"
        if not inscricoes:
            tabela = "inscricoes_evento"

        res, error = SupabaseService.update(tabela, id, data)
        if error:
            return jsonify({"error": error}), 500
        return jsonify(res), 200

    @app.route("/api/eventos/chaves", methods=["GET", "POST"])
    def gerenciar_chaves():
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            evento_id = request.args.get("evento_id")
            modalidade = request.args.get("modalidade")

            if not evento_id or not modalidade:
                return jsonify({"error": "Parâmetros evento_id e modalidade são obrigatórios"}), 400

            chaves, error = SupabaseService.get_all("eventos_chaves", filter_dict={"evento_id": evento_id, "modalidade": modalidade})
            if error or not chaves:
                chaves, error = SupabaseService.get_all("chaves_torneio", filter_dict={"evento_id": evento_id, "modalidade": modalidade})

            if chaves:
                return jsonify({"chave": chaves[0]}), 200
            return jsonify({"chave": None}), 200

        elif request.method == "POST":
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            evento_id = data.get("evento_id")
            modalidade = data.get("modalidade")
            brackets = data.get("brackets")

            if not evento_id or not modalidade or brackets is None:
                return jsonify({"error": "Preencha todos os campos obrigatórios"}), 400

            chaves, _ = SupabaseService.get_all("eventos_chaves", filter_dict={"evento_id": evento_id, "modalidade": modalidade})
            tabela = "eventos_chaves"
            if not chaves:
                chaves, _ = SupabaseService.get_all("chaves_torneio", filter_dict={"evento_id": evento_id, "modalidade": modalidade})
                tabela = "chaves_torneio" if chaves or not SupabaseService.is_mock() else "eventos_chaves"

            if chaves:
                res, error = SupabaseService.update(tabela, chaves[0]["id"], {"brackets": brackets})
            else:
                payload = {
                    "evento_id": evento_id,
                    "modalidade": modalidade,
                    "brackets": brackets
                }
                res, error = SupabaseService.insert(tabela, payload)

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 200
