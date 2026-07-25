from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services import whatsapp_service


def create_whatsapp_routes(app: Flask):
    """Cria e registra as rotas de notificações WhatsApp."""

    @app.route("/api/whatsapp/status", methods=["GET"])
    def whatsapp_status():
        """Retorna o status de conexão da instância Evolution API."""
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        resultado = whatsapp_service.verificar_conexao()
        resultado["modo_mock"] = whatsapp_service._is_mock()
        return jsonify(resultado), 200

    @app.route("/api/whatsapp/testar", methods=["POST"])
    def whatsapp_testar():
        """Envia mensagem de teste para um número informado (admin only)."""
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        data = request.json or {}
        telefone = data.get("telefone", "")
        if not telefone:
            return jsonify({"error": "Informe o campo 'telefone'"}), 400

        mensagem = whatsapp_service.msg_teste(user.get("nome", "Admin GRKK"))
        resultado = whatsapp_service.enviar_mensagem(telefone, mensagem)
        return jsonify(resultado), 200 if resultado.get("success") else 500

    @app.route("/api/whatsapp/disparar-vencimentos", methods=["POST"])
    def whatsapp_disparar_vencimentos():
        """
        Dispara alertas WhatsApp para atletas com faturas vencendo em 3 dias.
        Pode ser chamado por um cron job externo (com autenticação admin).
        """
        from app import get_current_user
        from datetime import date, timedelta
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        alvo = (date.today() + timedelta(days=3)).isoformat()

        faturas, _ = SupabaseService.get_all("financeiro")
        profiles, _ = SupabaseService.get_all("profiles")
        faturas_alvo = [
            f for f in (faturas or [])
            if f.get("status") == "pendente" and (f.get("data_vencimento") or "")[:10] == alvo
        ]

        enviados = 0
        erros = 0
        for fatura in faturas_alvo:
            atleta_id = fatura.get("atleta_id")
            if not atleta_id:
                continue
            perfil = next((p for p in (profiles or []) if str(p.get("id")) == str(atleta_id)), None)
            if not perfil:
                continue
            telefone = perfil.get("telefone") or perfil.get("celular") or ""
            nome = perfil.get("nome", "Atleta")
            valor = float(fatura.get("valor", 0))
            data_venc = fatura.get("data_vencimento", alvo)
            data_fmt = "/".join(reversed(data_venc[:10].split("-")))

            if telefone:
                res = whatsapp_service.enviar_mensagem(
                    telefone,
                    whatsapp_service.msg_vencimento_proximo(nome, valor, data_fmt)
                )
                if res.get("success"):
                    enviados += 1
                else:
                    erros += 1

        return jsonify({
            "success": True,
            "data_alvo": alvo,
            "faturas_encontradas": len(faturas_alvo),
            "enviados": enviados,
            "erros": erros,
            "mock": whatsapp_service._is_mock()
        }), 200
