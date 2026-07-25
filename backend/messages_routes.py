from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_messages_routes(app: Flask):
    """Cria e registra as rotas de mensagens e contatos"""

    @app.route("/api/contato", methods=["POST"])
    @app.route("/api/contatos", methods=["POST"])
    def submit_contato():
        data = request.json or {}
        nome = data.get("nome") or data.get("name")
        email = data.get("email")
        mensagem = data.get("mensagem") or data.get("message")
        telefone = data.get("telefone") or data.get("phone") or ""

        if not nome or not email or not mensagem:
            return jsonify({"error": "Nome, e-mail e mensagem são obrigatórios"}), 400

        db_item = {
            "name": nome,
            "email": email,
            "message": mensagem,
            "phone": telefone,
            "read": False
        }

        res_item, error = SupabaseService.insert("contacts", db_item)
        if error:
            res_item, error2 = SupabaseService.insert("contatos", {
                "nome": nome,
                "email": email,
                "mensagem": mensagem,
                "telefone": telefone
            })
            if error2:
                return jsonify({"error": f"Erro ao salvar mensagem: {error2}"}), 500

        return jsonify({
            "success": True,
            "message": "Mensagem enviada com sucesso!",
            "data": res_item
        }), 201

    @app.route("/api/contatos", methods=["GET"])
    def get_contatos_list():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        contacts, error = SupabaseService.get_all("contacts", order_by="created_at", ascending=False)
        if error or not contacts:
            contacts, error = SupabaseService.get_all("contatos", order_by="created_at", ascending=False)

        return jsonify({"contatos": contacts or []}), 200

    @app.route("/api/contatos/<id>", methods=["DELETE"])
    def delete_contato_item(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        res, error = SupabaseService.delete("contacts", id)
        if error:
            res, error = SupabaseService.delete("contatos", id)

        if error:
            return jsonify({"error": error}), 500
        return jsonify({"sucesso": True}), 200

    @app.route("/api/contatos/responder", methods=["POST"])
    def responder_contato_item():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        data = request.json or {}
        contato_id = data.get("contatoId")
        email = data.get("email")
        mensagem = data.get("mensagem")

        if not contato_id or not email or not mensagem:
            return jsonify({"error": "Campos obrigatórios ausentes"}), 400

        # Envia e-mail real se estiver configurado
        from services.email_service import EmailService
        
        smtp_configured = EmailService.is_configured()
        email_enviado = False
        erro_email = None

        if smtp_configured:
            email_enviado, erro_email = EmailService.send_email(
                to_email=email,
                subject="Re: Contato - Goju-Ryu Karate Kai",
                message_body=mensagem
            )
            if not email_enviado:
                return jsonify({"error": f"Erro ao enviar e-mail: {erro_email}"}), 500
        else:
            erro_email = "SMTP não configurado no .env"

        contacts_list, _ = SupabaseService.get_all("contacts")
        tabela = "contacts"
        update_field = {"read": True}
        if not contacts_list:
            tabela = "contatos"
            update_field = {"lida": True}

        SupabaseService.update(tabela, contato_id, update_field)

        # Loga a auditoria incluindo o status do envio SMTP
        status_envio = "Real" if email_enviado else f"Simulado ({erro_email})"
        registrar_log_auditoria(
            user,
            "Responder Contato",
            f"Resposta enviada para {email} [{status_envio}]: {mensagem[:100]}..."
        )

        return jsonify({
            "success": True, 
            "simulado": not email_enviado,
            "email_status": "enviado" if email_enviado else "simulado"
        }), 200
