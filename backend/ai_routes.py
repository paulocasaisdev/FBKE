from flask import Flask, request, jsonify
from services.ai_service import ask_sensei
from services.limiter_service import limit_rate

def create_ai_routes(app: Flask):
    """Cria e registra as rotas de chat com IA"""

    @app.route("/api/ia-chat", methods=["POST"])
    @limit_rate(requests_limit=10, window_seconds=60)
    def chat_ia():
        data = request.json or {}
        mensagem = data.get("mensagem") or data.get("message")

        if not mensagem:
            return jsonify({"error": "Mensagem é obrigatória"}), 400

        resposta = ask_sensei(mensagem)
        return jsonify({"resposta": resposta}), 200
