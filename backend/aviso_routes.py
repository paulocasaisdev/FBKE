from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_aviso_routes(app: Flask):
    """Cria e registra as rotas para gerenciar os avisos da diretoria"""

    @app.route("/api/avisos", methods=["GET"])
    def handle_avisos_list():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        # Busca todos os avisos ordenados por data de criação descrescente
        avisos, error = SupabaseService.get_all("avisos_diretoria", order_by="created_at", ascending=False)
        if error:
            return jsonify({"error": error}), 500

        if not avisos:
            avisos = []

        # Filtra de acordo com o papel do usuário logado
        user_role = user.get("tipo")
        if user_role == "admin":
            filtered_avisos = avisos
        elif user_role == "filial":
            # Filiais veem avisos para 'todos' e 'filial'
            filtered_avisos = [a for a in avisos if a.get("destinatario") in ["todos", "filial"]]
        elif user_role == "atleta":
            # Atletas veem avisos para 'todos' e 'atleta'
            filtered_avisos = [a for a in avisos if a.get("destinatario") in ["todos", "atleta"]]
        else:
            # Se for qualquer outro papel, por segurança, só vê os públicos ("todos")
            filtered_avisos = [a for a in avisos if a.get("destinatario") == "todos"]

        return jsonify(filtered_avisos), 200

    @app.route("/api/avisos", methods=["POST"])
    def handle_aviso_create():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        data = request.json or {}
        titulo = data.get("titulo")
        conteudo = data.get("conteudo")
        categoria = data.get("categoria", "Geral")
        destinatario = data.get("destinatario", "todos")

        if not titulo or not conteudo:
            return jsonify({"error": "Título e conteúdo são obrigatórios"}), 400

        if destinatario not in ["todos", "filial", "atleta"]:
            return jsonify({"error": "Destinatário inválido"}), 400

        # Cria o aviso
        aviso_item = {
            "titulo": titulo,
            "conteudo": conteudo,
            "categoria": categoria,
            "destinatario": destinatario,
            "criado_por": user["id"]
        }

        res, error = SupabaseService.insert("avisos_diretoria", aviso_item)
        if error:
            return jsonify({"error": error}), 500

        # Disparar notificações de WhatsApp para os destinatários correspondentes
        try:
            from services import whatsapp_service
            msg = whatsapp_service.msg_novo_aviso(titulo, conteudo)
            profiles, _ = SupabaseService.get_all("profiles")
            
            # Filtra os destinatários
            alvos = []
            for p in (profiles or []):
                tipo = p.get("tipo")
                tel = p.get("telefone") or p.get("celular") or ""
                if not tel:
                    continue
                
                if destinatario == "todos":
                    alvos.append((p.get("nome"), tel))
                elif destinatario == "filial" and tipo in ["admin", "filial"]:
                    alvos.append((p.get("nome"), tel))
                elif destinatario == "atleta" and tipo == "atleta":
                    alvos.append((p.get("nome"), tel))
            
            for nome_alvo, tel_alvo in alvos:
                whatsapp_service.enviar_mensagem(tel_alvo, msg)
        except Exception as e:
            print(f"Erro ao disparar whatsapp de avisos: {e}")

        return jsonify(res), 201

    @app.route("/api/avisos/<id>", methods=["DELETE"])
    def handle_aviso_delete(id):
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        res, error = SupabaseService.delete("avisos_diretoria", id)
        if error:
            return jsonify({"error": error}), 500

        return jsonify({"success": True, "message": "Aviso excluído com sucesso"}), 200
