from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_ranking_routes(app: Flask):
    """Cria e registra as rotas de ranking"""

    @app.route("/api/ranking", methods=["GET", "POST"])
    def handle_ranking():
        from app import get_current_user

        user = get_current_user()

        if request.method == "GET":
            atletas_lista, _ = SupabaseService.get_all("atletas")
            profiles_lista, _ = SupabaseService.get_all("profiles")

            leaderboard = []
            for a in (atletas_lista or []):
                prof = next((p for p in (profiles_lista or []) if p["id"] == a["id"]), None)
                if prof:
                    leaderboard.append({
                        "id": a["id"],
                        "nome": prof.get("nome", "Atleta"),
                        "filial_id": a.get("filial_id", "dojo-central"),
                        "filial_nome": a.get("filial_nome", "Dojo Central"),
                        "faixa": a.get("faixa", "Branca"),
                        "pontos": a.get("pontos", 150),
                        "cidade": prof.get("cidade", "Salvador")
                    })

            leaderboard.sort(key=lambda x: x["pontos"], reverse=True)
            for idx, item in enumerate(leaderboard):
                item["posicao"] = idx + 1

            historico_lista = []
            if user:
                pontos_lista, _ = SupabaseService.get_all("historico_pontos", filter_dict={"atleta_id": user["id"]})
                historico_lista = pontos_lista or []

            return jsonify({
                "leaderboard": leaderboard,
                "historicoPessoal": historico_lista
            }), 200

        elif request.method == "POST":
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            atleta_id = data.get("atleta_id")
            tipo_evento = data.get("tipo_evento")
            descricao = data.get("descricao")
            pontos = int(data.get("pontos", 0))

            if not atleta_id or not tipo_evento or not descricao:
                return jsonify({"error": "Preencha todos os campos obrigatórios"}), 400

            nova_conquista = {
                "atleta_id": atleta_id,
                "tipo_evento": tipo_evento,
                "descricao": descricao,
                "pontos": pontos,
                "data_pontuacao": datetime.utcnow().date().isoformat()
            }
            res, error = SupabaseService.insert("historico_pontos", nova_conquista)
            if error:
                return jsonify({"error": error}), 500

            atleta_perfil, _ = SupabaseService.get_profile_by_id(atleta_id)
            if atleta_perfil:
                pontos_atuais = atleta_perfil.get("pontos", 0)
                SupabaseService.update("atletas", atleta_id, {"pontos": pontos_atuais + pontos})

            return jsonify(res), 201
