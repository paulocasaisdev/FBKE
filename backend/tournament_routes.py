from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria
from services.bracket_generator import BracketGenerator
from datetime import datetime

def create_tournament_routes(app: Flask):
    """Registra as rotas para o Módulo de Torneios e Placar em Tempo Real"""

    # Helper para autenticação/autorização
    def check_admin():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return None
        return user

    # ==========================================
    # 1. ROTAS DE TORNEIOS (Tournaments)
    # ==========================================
    @app.route("/api/tournaments", methods=["GET", "POST"])
    def handle_tournaments():
        if request.method == "GET":
            tournaments, error = SupabaseService.get_all("tournaments", order_by="start_date", ascending=False)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"tournaments": tournaments}), 200

        elif request.method == "POST":
            admin = check_admin()
            if not admin:
                return jsonify({"error": "Não autorizado. Requer administrador."}), 403

            data = request.json or {}
            required = ["title", "start_date", "end_date"]
            if not all(k in data for k in required):
                return jsonify({"error": "Título, data de início e fim são obrigatórios."}), 400

            res, error = SupabaseService.insert("tournaments", data)
            if error:
                return jsonify({"error": error}), 500

            registrar_log_auditoria(admin, "Criação de Torneio", f"Torneio '{data.get('title')}' criado.")
            return jsonify(res), 201

    @app.route("/api/tournaments/<id>", methods=["GET", "PATCH", "DELETE"])
    def manage_tournament(id):
        if request.method == "GET":
            tournaments, error = SupabaseService.get_all("tournaments", filter_dict={"id": id})
            if error or not tournaments:
                return jsonify({"error": "Torneio não encontrado."}), 404
            return jsonify(tournaments[0]), 200

        elif request.method == "PATCH":
            admin = check_admin()
            if not admin:
                return jsonify({"error": "Não autorizado."}), 403

            data = request.json or {}
            res, error = SupabaseService.update("tournaments", id, data)
            if error:
                return jsonify({"error": error}), 500

            registrar_log_auditoria(admin, "Edição de Torneio", f"Torneio ID {id} atualizado.")
            return jsonify(res), 200

        elif request.method == "DELETE":
            admin = check_admin()
            if not admin:
                return jsonify({"error": "Não autorizado."}), 403

            res, error = SupabaseService.delete("tournaments", id)
            if error:
                return jsonify({"error": error}), 500

            registrar_log_auditoria(admin, "Exclusão de Torneio", f"Torneio ID {id} excluído.")
            return jsonify({"success": True}), 200


    # ==========================================
    # 2. ROTAS DE CATEGORIAS (Categories)
    # ==========================================
    @app.route("/api/tournaments/<t_id>/categories", methods=["GET"])
    def get_tournament_categories(t_id):
        categories, error = SupabaseService.get_all("tournament_categories", filter_dict={"tournament_id": t_id})
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"categories": categories}), 200

    @app.route("/api/tournaments/categories", methods=["POST"])
    def create_category():
        admin = check_admin()
        if not admin:
            return jsonify({"error": "Não autorizado."}), 403

        data = request.json or {}
        required = ["tournament_id", "name", "type"]
        if not all(k in data for k in required):
            return jsonify({"error": "Tournament ID, nome e tipo (Kata/Kumite) são obrigatórios."}), 400

        res, error = SupabaseService.insert("tournament_categories", data)
        if error:
            return jsonify({"error": error}), 500

        return jsonify(res), 201

    @app.route("/api/tournaments/categories/<id>", methods=["GET", "PATCH", "DELETE"])
    def manage_category(id):
        if request.method == "GET":
            categories, error = SupabaseService.get_all("tournament_categories", filter_dict={"id": id})
            if error or not categories:
                return jsonify({"error": "Categoria não encontrada."}), 404
            return jsonify(categories[0]), 200

        elif request.method == "PATCH":
            admin = check_admin()
            if not admin:
                return jsonify({"error": "Não autorizado."}), 403

            data = request.json or {}
            res, error = SupabaseService.update("tournament_categories", id, data)
            if error:
                return jsonify({"error": error}), 500

            return jsonify(res), 200

        elif request.method == "DELETE":
            admin = check_admin()
            if not admin:
                return jsonify({"error": "Não autorizado."}), 403

            res, error = SupabaseService.delete("tournament_categories", id)
            if error:
                return jsonify({"error": error}), 500

            return jsonify({"success": True}), 200


    # ==========================================
    # 3. ROTAS DE INSCRIÇÕES (Registrations)
    # ==========================================
    @app.route("/api/tournaments/categories/<cat_id>/registrations", methods=["GET"])
    def get_category_registrations(cat_id):
        regs, error = SupabaseService.get_all("tournament_registrations", filter_dict={"category_id": cat_id})
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"registrations": regs}), 200

    @app.route("/api/tournaments/registrations", methods=["POST"])
    def create_registration():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado."}), 401

        data = request.json or {}
        required = ["category_id", "athlete_id"]
        if not all(k in data for k in required):
            return jsonify({"error": "Campos category_id e athlete_id são obrigatórios."}), 400

        # Carrega o perfil do atleta para ter nome e dojo
        athlete_profile, _ = SupabaseService.get_profile_by_id(data["athlete_id"])
        if not athlete_profile:
            return jsonify({"error": "Perfil do atleta não encontrado."}), 404

        # Registra dojo/filial de origem
        dojo_id = athlete_profile.get("filial_id")
        dojo_name = athlete_profile.get("filial_nome") or athlete_profile.get("academia_clube")

        payload = {
            "category_id": data["category_id"],
            "athlete_id": data["athlete_id"],
            "athlete_name": athlete_profile.get("nome"),
            "dojo_id": dojo_id,
            "dojo_name": dojo_name,
            "status": data.get("status", "confirmed"),
            "weight": data.get("weight")
        }

        res, error = SupabaseService.insert("tournament_registrations", payload)
        if error:
            return jsonify({"error": error}), 500

        return jsonify(res), 201

    @app.route("/api/tournaments/registrations/<id>", methods=["PATCH", "DELETE"])
    def manage_registration(id):
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado."}), 401

        if request.method == "PATCH":
            data = request.json or {}
            res, error = SupabaseService.update("tournament_registrations", id, data)
            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 200

        elif request.method == "DELETE":
            res, error = SupabaseService.delete("tournament_registrations", id)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"success": True}), 200


    # ==========================================
    # 4. ROTAS DE CHAVES E PARTIDAS (Brackets/Matches)
    # ==========================================
    @app.route("/api/tournaments/categories/<cat_id>/matches", methods=["GET"])
    def get_category_matches(cat_id):
        matches, error = SupabaseService.get_all("tournament_matches", filter_dict={"category_id": cat_id})
        if error:
            return jsonify({"error": error}), 500
        # Ordena as partidas pela ordem correta do chaveamento (match_order)
        matches.sort(key=lambda x: x.get("match_order", 0))
        return jsonify({"matches": matches}), 200

    @app.route("/api/tournaments/categories/<cat_id>/generate-bracket", methods=["POST"])
    def generate_category_bracket(cat_id):
        admin = check_admin()
        if not admin:
            return jsonify({"error": "Não autorizado."}), 403

        # 1. Carrega todas as inscrições confirmadas para a categoria
        regs, error = SupabaseService.get_all("tournament_registrations", filter_dict={"category_id": cat_id, "status": "confirmed"})
        if error:
            return jsonify({"error": error}), 500

        if not regs or len(regs) < 2:
            return jsonify({"error": "Não há atletas suficientes inscritos nesta categoria (mínimo de 2)."}), 400

        # 2. Executa o algoritmo Bracket Generator
        matches, _ = BracketGenerator.generate(regs, cat_id)

        # 3. Deleta quaisquer lutas antigas desta categoria se existirem
        old_matches, _ = SupabaseService.get_all("tournament_matches", filter_dict={"category_id": cat_id})
        if old_matches:
            for om in old_matches:
                SupabaseService.delete("tournament_matches", om["id"])

        # 4. Salva as novas partidas no banco
        saved_matches = []
        for m in matches:
            res, err = SupabaseService.insert("tournament_matches", m)
            if err:
                return jsonify({"error": f"Falha ao salvar partida: {err}"}), 500
            saved_matches.append(res)

        # 5. Atualiza o status da categoria para 'ready' ou 'ongoing'
        SupabaseService.update("tournament_categories", cat_id, {"status": "ready"})

        registrar_log_auditoria(admin, "Geração de Chave", f"Chave de confrontos da Categoria ID {cat_id} gerada com {len(regs)} atletas.")

        saved_matches.sort(key=lambda x: x.get("match_order", 0))
        return jsonify({"matches": saved_matches}), 200

    @app.route("/api/tournaments/matches/<id>", methods=["PATCH"])
    def update_match(id):
        """Atualiza o placar e status da partida. Se a partida terminou, propaga o vencedor."""
        data = request.json or {}
        
        # 1. Atualiza a partida atual no banco de dados
        match_updated, error = SupabaseService.update("tournament_matches", id, data)
        if error:
            return jsonify({"error": error}), 500

        # 2. Se a partida foi finalizada, propaga o vencedor para a partida pai
        if data.get("status") == "finished" and match_updated.get("winner_id"):
            winner_id = match_updated["winner_id"]
            
            # Descobre quem é o vencedor para obter o nome correto
            winner_name = (
                match_updated["athlete_red_name"]
                if winner_id == match_updated["athlete_red_id"]
                else match_updated["athlete_blue_name"]
            )
            
            category_id = match_updated["category_id"]
            
            # Busca todas as partidas desta categoria para encontrar o pai
            all_matches, _ = SupabaseService.get_all("tournament_matches", filter_dict={"category_id": category_id})
            
            for m in (all_matches or []):
                # Se esta partida m for o pai da partida atual (id)
                is_parent_red = m.get("parent_red_match_id") == id
                is_parent_blue = m.get("parent_blue_match_id") == id
                
                if is_parent_red or is_parent_blue:
                    parent_update = {}
                    if is_parent_red:
                        parent_update["athlete_red_id"] = winner_id
                        parent_update["athlete_red_name"] = winner_name
                    else:
                        parent_update["athlete_blue_id"] = winner_id
                        parent_update["athlete_blue_name"] = winner_name
                        
                    # Executa o update na partida pai
                    SupabaseService.update("tournament_matches", m["id"], parent_update)
                    break # Só pode ter um pai na eliminação simples

        return jsonify(match_updated), 200


    # ==========================================
    # 5. ROTAS DE LOGS DE LUTA (Live Match Logs)
    # ==========================================
    @app.route("/api/tournaments/matches/<match_id>/logs", methods=["GET", "POST"])
    def handle_match_logs(match_id):
        if request.method == "GET":
            logs, error = SupabaseService.get_all("tournament_match_logs", filter_dict={"match_id": match_id})
            if error:
                return jsonify({"error": error}), 500
            # Ordena por timestamp crescente
            logs.sort(key=lambda x: x.get("timestamp", ""))
            return jsonify({"logs": logs}), 200

        elif request.method == "POST":
            data = request.json or {}
            payload = {
                "match_id": match_id,
                "log_type": data.get("log_type", "system"),
                "details": data.get("details", {})
            }
            res, error = SupabaseService.insert("tournament_match_logs", payload)
            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 201


    # ==========================================
    # 6. ROTAS DE SINCRONIZAÇÃO OFFLINE (Sync)
    # ==========================================
    @app.route("/api/tournaments/sync", methods=["POST"])
    def sync_offline_data():
        """
        Recebe alterações em lote feitas de forma offline e sincroniza no banco central.
        JSON esperado:
        {
          "matches": [ { "id": "...", "score_red": 2, "score_blue": 0, "status": "finished", "winner_id": "..." }, ... ],
          "logs": [ { "match_id": "...", "log_type": "...", "details": {...} }, ... ]
        }
        """
        data = request.json or {}
        matches_to_sync = data.get("matches", [])
        logs_to_sync = data.get("logs", [])

        synced_matches_count = 0
        synced_logs_count = 0

        # Sincroniza partidas
        for m_data in matches_to_sync:
            m_id = m_data.get("id")
            if not m_id:
                continue
            
            # Filtra apenas campos válidos para atualização
            update_fields = {
                k: v for k, v in m_data.items() 
                if k in ["score_red", "score_blue", "status", "winner_id", "athlete_red_id", "athlete_red_name", "athlete_blue_id", "athlete_blue_name"]
            }
            
            res, error = SupabaseService.update("tournament_matches", m_id, update_fields)
            if not error:
                synced_matches_count += 1
                
                # Se terminou a luta, também faz a propagação para a partida pai
                if update_fields.get("status") == "finished" and update_fields.get("winner_id"):
                    winner_id = update_fields["winner_id"]
                    
                    # Carrega partida completa para obter nomes atuais
                    full_match, _ = SupabaseService.get_all("tournament_matches", filter_dict={"id": m_id})
                    if full_match:
                        match_full = full_match[0]
                        winner_name = (
                            match_full["athlete_red_name"]
                            if winner_id == match_full["athlete_red_id"]
                            else match_full["athlete_blue_name"]
                        )
                        category_id = match_full["category_id"]
                        
                        # Busca todas as partidas para propagar para o pai
                        all_matches, _ = SupabaseService.get_all("tournament_matches", filter_dict={"category_id": category_id})
                        for m in (all_matches or []):
                            is_parent_red = m.get("parent_red_match_id") == m_id
                            is_parent_blue = m.get("parent_blue_match_id") == m_id
                            
                            if is_parent_red or is_parent_blue:
                                parent_update = {}
                                if is_parent_red:
                                    parent_update["athlete_red_id"] = winner_id
                                    parent_update["athlete_red_name"] = winner_name
                                else:
                                    parent_update["athlete_blue_id"] = winner_id
                                    parent_update["athlete_blue_name"] = winner_name
                                    
                                SupabaseService.update("tournament_matches", m["id"], parent_update)
                                break

        # Sincroniza logs
        for log_data in logs_to_sync:
            match_id = log_data.get("match_id")
            if not match_id:
                continue
                
            payload = {
                "match_id": match_id,
                "log_type": log_data.get("log_type", "system"),
                "details": log_data.get("details", {})
            }
            _, error = SupabaseService.insert("tournament_match_logs", payload)
            if not error:
                synced_logs_count += 1

        return jsonify({
            "success": True,
            "synced_matches": synced_matches_count,
            "synced_logs": synced_logs_count
        }), 200
