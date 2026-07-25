from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from datetime import datetime
from services.audit_service import registrar_log_auditoria

# Tabelas de carência mínima em meses para exames de faixa do Karatê
REGRAS_INFANTIL = {
    'Branca/Amarela': 3,
    'Amarela': 3,
    'Amarela/Laranja': 3,
    'Laranja': 4,
    'Laranja/Verde': 4,
    'Verde': 5,
    'Verde/Azul': 6,
    'Azul': 7,
    'Azul/Vermelha': 8,
    'Vermelha': 9,
    'Marrom': 10,
    'Marrom I': 11,
    'Marrom II': 12,
}

REGRAS_ADULTO = {
    'Amarela': 4,
    'Laranja': 4,
    'Verde': 6,
    'Azul': 6,
    'Vermelha': 6,
    'Marrom': 8,
    'Marrom I': 10,
    'Marrom II': 12,
    'Preta I': 18,
    'Preta II': 24,
}

def create_exam_routes(app: Flask):
    """Cria e registra as rotas de exames"""

    @app.route("/api/exames", methods=["GET", "POST"])
    def handle_exames():
        from app import get_current_user

        if request.method == "GET":
            exames, error = SupabaseService.get_all("exames", order_by="data_exame", ascending=False)
            if error:
                return jsonify({"error": error}), 500
            for ex in (exames or []):
                if not ex.get("faixa_alvo"):
                    ex["faixa_alvo"] = "Todas as Faixas"
            return jsonify({"exames": exames}), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            res, error = SupabaseService.insert("exames", data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Criação de Exame",
                f"Novo exame de faixa criado para data {res.get('data_exame')} (ID: {res.get('id')})"
            )

            return jsonify(res), 201

    @app.route("/api/exames/validar-carencia", methods=["GET"])
    def validar_carencia():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        exame_id = request.args.get("exame_id")
        grad_pretendida = request.args.get("graduacao_pretendida")
        atleta_id = request.args.get("atleta_id") or user.get("id")

        if not exame_id or not grad_pretendida:
            return jsonify({"error": "Parâmetros exame_id e graduacao_pretendida são obrigatórios"}), 400

        exames, _ = SupabaseService.get_all("exames")
        exame = next((ex for ex in (exames or []) if str(ex["id"]) == str(exame_id)), None)
        if not exame:
            return jsonify({"error": "Exame não localizado"}), 404

        atleta_perfil, _ = SupabaseService.get_profile_by_id(atleta_id)
        if not atleta_perfil:
            return jsonify({"error": "Perfil do atleta não localizado"}), 404

        # 1. Calcular idade na data do exame
        data_nasc_str = atleta_perfil.get("data_nascimento")
        data_exame_str = exame.get("data_exame")
        idade = 15
        if data_nasc_str and data_exame_str:
            try:
                if "T" in data_exame_str:
                    data_exame_str = data_exame_str.split("T")[0]
                if "T" in data_nasc_str:
                    data_nasc_str = data_nasc_str.split("T")[0]
                dt_nasc = datetime.strptime(data_nasc_str, "%Y-%m-%d")
                dt_exame = datetime.strptime(data_exame_str, "%Y-%m-%d")
                idade = dt_exame.year - dt_nasc.year - ((dt_exame.month, dt_exame.day) < (dt_nasc.month, dt_nasc.day))
            except Exception:
                pass

        # 2. Determinar o início da faixa atual
        candidaturas, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"atleta_id": atleta_id, "status": "aprovado"})
        if not candidaturas:
            candidaturas, _ = SupabaseService.get_all("candidatos", filter_dict={"atleta_id": atleta_id, "status": "aprovado"})

        data_inicio_faixa = None
        if candidaturas:
            candidaturas.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            ultimo_aprovado = candidaturas[0]
            exames_list, _ = SupabaseService.get_all("exames")
            exame_ant = next((ex for ex in (exames_list or []) if str(ex["id"]) == str(ultimo_aprovado.get("exame_id"))), None)
            if exame_ant:
                data_inicio_faixa = exame_ant.get("data_exame")

        if not data_inicio_faixa:
            data_inicio_faixa = atleta_perfil.get("created_at") or datetime.utcnow().date().isoformat()

        # 3. Calcular tempo na faixa em meses
        diferenca_meses = 999
        if data_inicio_faixa and data_exame_str:
            try:
                if "T" in data_inicio_faixa:
                    data_inicio_faixa = data_inicio_faixa.split("T")[0]
                dt_inicio = datetime.strptime(data_inicio_faixa, "%Y-%m-%d")
                dt_exame = datetime.strptime(data_exame_str, "%Y-%m-%d")
                diferenca_meses = (dt_exame.year - dt_inicio.year) * 12 + (dt_exame.month - dt_inicio.month)
                if dt_exame.day < dt_inicio.day:
                    diferenca_meses -= 1
            except Exception:
                pass

        # 4. Validar carência mínima
        if idade <= 12:
            carencia_exigida = REGRAS_INFANTIL.get(grad_pretendida)
        else:
            carencia_exigida = REGRAS_ADULTO.get(grad_pretendida)

        # Contar treinos presenciais na faixa atual
        presencas, _ = SupabaseService.get_all("presencas", filter_dict={"atleta_id": atleta_id})
        treinos_realizados = 0
        if presencas:
            for p in presencas:
                p_data = p.get("data")
                p_status = p.get("status")
                if p_status == "presente" and p_data and data_inicio_faixa:
                    if p_data >= data_inicio_faixa.split("T")[0]:
                        treinos_realizados += 1

        treinos_requeridos = (carencia_exigida * 8) if carencia_exigida is not None else 0

        apto = True
        motivos = []
        if carencia_exigida is not None:
            if diferenca_meses < carencia_exigida:
                apto = False
                motivos.append(f"Carência de tempo insuficiente (requer {carencia_exigida} meses, tem {diferenca_meses}).")
            if treinos_realizados < treinos_requeridos:
                apto = False
                motivos.append(f"Frequência de treinos insuficiente (requer {treinos_requeridos} presenças, tem {treinos_realizados}).")

        return jsonify({
            "apto": apto,
            "idade": idade,
            "diferenca_meses": diferenca_meses if diferenca_meses != 999 else 0,
            "carencia_exigida": carencia_exigida,
            "data_inicio_faixa": data_inicio_faixa,
            "treinos_realizados": treinos_realizados,
            "treinos_requeridos": treinos_requeridos,
            "motivos": motivos
        }), 200

    # Rotas fixas DEVEM vir antes das rotas com <id> para evitar shadowing
    @app.route("/api/exames/candidatos", methods=["GET", "POST"])
    def handle_candidatos():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            candidatos, error = SupabaseService.get_all("candidatos_exame")
            if error or not candidatos:
                candidatos, error = SupabaseService.get_all("candidatos")

            filtrados = []
            for c in (candidatos or []):
                if user.get("tipo") == "admin":
                    filtrados.append(c)
                elif user.get("tipo") == "filial":
                    if c.get("filial_id") == user["id"]:
                        filtrados.append(c)
                else:
                    if c.get("atleta_id") == user["id"]:
                        filtrados.append(c)

            return jsonify({"candidatos": filtrados}), 200

        elif request.method == "POST":
            data = request.json or {}
            
            exame_id = data.get("exame_id")
            if not exame_id:
                return jsonify({"error": "O campo exame_id é obrigatório"}), 400
                
            exames, _ = SupabaseService.get_all("exames")
            exame = next((ex for ex in (exames or []) if str(ex["id"]) == str(exame_id)), None)
            if not exame:
                return jsonify({"error": "Exame não localizado"}), 404
                
            atleta_id = data.get("atleta_id") or user["id"]
            atleta_perfil, _ = SupabaseService.get_profile_by_id(atleta_id)
            if not atleta_perfil:
                return jsonify({"error": "Perfil do atleta não localizado"}), 404
                
            grad_pretendida = data.get("graduacao_pretendida")
            if not grad_pretendida:
                return jsonify({"error": "O campo graduacao_pretendida é obrigatório"}), 400
                
            # 1. Validar se o exame aceita a graduação pretendida
            faixa_alvo_exame = exame.get("faixa_alvo", "Todas") or "Todas"
            if faixa_alvo_exame.strip().lower() not in ["todas", "todas as faixas", ""]:
                faixas_permitidas = [f.strip().lower() for f in faixa_alvo_exame.split(",")]
                if grad_pretendida.strip().lower() not in faixas_permitidas:
                    return jsonify({"error": f"Este exame não aceita candidatos para a graduação {grad_pretendida}. Faixas permitidas neste exame: {faixa_alvo_exame}"}), 400
                    
            # 2. Calcular idade na data do exame
            data_nasc_str = atleta_perfil.get("data_nascimento")
            data_exame_str = exame.get("data_exame")
            idade = 15 # Valor padrão (adulto) caso as datas falhem
            
            if data_nasc_str and data_exame_str:
                try:
                    if "T" in data_exame_str:
                        data_exame_str = data_exame_str.split("T")[0]
                    if "T" in data_nasc_str:
                        data_nasc_str = data_nasc_str.split("T")[0]
                    dt_nasc = datetime.strptime(data_nasc_str, "%Y-%m-%d")
                    dt_exame = datetime.strptime(data_exame_str, "%Y-%m-%d")
                    idade = dt_exame.year - dt_nasc.year - ((dt_exame.month, dt_exame.day) < (dt_nasc.month, dt_nasc.day))
                except Exception:
                    pass
                    
            # 3. Determinar o início da faixa atual
            # Busca todos os exames passados que o atleta foi aprovado
            candidaturas, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"atleta_id": atleta_id, "status": "aprovado"})
            if not candidaturas:
                candidaturas, _ = SupabaseService.get_all("candidatos", filter_dict={"atleta_id": atleta_id, "status": "aprovado"})
                
            data_inicio_faixa = None
            if candidaturas:
                # Ordena pelo mais recente
                candidaturas.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                ultimo_aprovado = candidaturas[0]
                
                # Busca a data do exame correspondente
                exames_list, _ = SupabaseService.get_all("exames")
                exame_ant = next((ex for ex in (exames_list or []) if str(ex["id"]) == str(ultimo_aprovado.get("exame_id"))), None)
                if exame_ant:
                    data_inicio_faixa = exame_ant.get("data_exame")
                    
            if not data_inicio_faixa:
                # Fallback: data de criação do cadastro do atleta
                data_inicio_faixa = atleta_perfil.get("created_at") or datetime.utcnow().date().isoformat()
                
            # 4. Calcular tempo na faixa em meses
            diferenca_meses = 999 # Valor alto padrão para passar caso datas falhem
            if data_inicio_faixa and data_exame_str:
                try:
                    if "T" in data_inicio_faixa:
                        data_inicio_faixa = data_inicio_faixa.split("T")[0]
                    dt_inicio = datetime.strptime(data_inicio_faixa, "%Y-%m-%d")
                    dt_exame = datetime.strptime(data_exame_str, "%Y-%m-%d")
                    diferenca_meses = (dt_exame.year - dt_inicio.year) * 12 + (dt_exame.month - dt_inicio.month)
                    if dt_exame.day < dt_inicio.day:
                        diferenca_meses -= 1
                except Exception:
                    pass
                    
            # 5. Validar carência mínima
            if idade <= 12:
                carencia_exigida = REGRAS_INFANTIL.get(grad_pretendida)
            else:
                carencia_exigida = REGRAS_ADULTO.get(grad_pretendida)
                
            # Contar treinos presenciais na faixa atual
            presencas, _ = SupabaseService.get_all("presencas", filter_dict={"atleta_id": atleta_id})
            treinos_realizados = 0
            if presencas:
                for p in presencas:
                    p_data = p.get("data")
                    p_status = p.get("status")
                    if p_status == "presente" and p_data and data_inicio_faixa:
                        if p_data >= data_inicio_faixa.split("T")[0]:
                            treinos_realizados += 1

            treinos_requeridos = (carencia_exigida * 8) if carencia_exigida is not None else 0

            if carencia_exigida is not None:
                if diferenca_meses < carencia_exigida:
                    return jsonify({
                        "error": (
                            f"Período de carência não cumprido. Para a graduação a {grad_pretendida}, "
                            f"são exigidos no mínimo {carencia_exigida} meses na faixa atual. "
                            f"Você possui apenas {diferenca_meses} meses de permanência."
                        )
                    }), 400
                if treinos_realizados < treinos_requeridos:
                    return jsonify({
                        "error": (
                            f"Frequência mínima de treinos não cumprida. Para a graduação a {grad_pretendida}, "
                            f"são exigidos no mínimo {treinos_requeridos} treinos na faixa atual. "
                            f"Você realizou apenas {treinos_realizados} treinos."
                        )
                    }), 400

            novo_candidato = {
                "exame_id": exame_id,
                "atleta_id": atleta_id,
                "atleta_nome": atleta_perfil.get("nome", "Atleta") if atleta_perfil else "Atleta",
                "filial_id": atleta_perfil.get("filial_id", "dojo-central") if atleta_perfil else "dojo-central",
                "filial_nome": atleta_perfil.get("filial_nome", "Dojo Central") if atleta_perfil else "Dojo Central",
                "faixa_atual": atleta_perfil.get("faixa", "Branca") if atleta_perfil else "Branca",
                "graduacao_pretendida": grad_pretendida,
                "status": "pendente",
                "autorizacao_tecnica": True if user.get("tipo") in ["admin", "filial"] else False,
                "pagamento_status": "pendente",
                "avaliado_por": None,
                "dados_banca": None,
                "created_at": datetime.utcnow().isoformat()
            }
            res, error = SupabaseService.insert("candidatos_exame", novo_candidato)
            if error:
                res, error = SupabaseService.insert("candidatos", novo_candidato)

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 201

    @app.route("/api/exames/candidatos/<id>", methods=["GET", "PATCH", "DELETE"])
    def handle_candidato_actions(id):
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            candidatos, _ = SupabaseService.get_all("candidatos_exame")
            if not candidatos:
                candidatos, _ = SupabaseService.get_all("candidatos")

            cand = next((c for c in (candidatos or []) if str(c["id"]) == id), None)
            if not cand:
                return jsonify({"error": "Candidato não encontrado"}), 404

            exames, _ = SupabaseService.get_all("exames")
            exame = next((ex for ex in (exames or []) if str(ex["id"]) == cand.get("exame_id")), None)

            examinador_nome = "Banca Examinadora"
            if cand.get("avaliado_por"):
                prof, _ = SupabaseService.get_profile_by_id(cand.get("avaliado_por"))
                if prof:
                    examinador_nome = prof.get("nome", examinador_nome)

            return jsonify({
                "candidato": cand,
                "exame": exame,
                "examinador_nome": examinador_nome
            }), 200

        elif request.method == "PATCH":
            data = request.json or {}

            candidatos, _ = SupabaseService.get_all("candidatos_exame")
            tabela = "candidatos_exame"
            if not candidatos:
                tabela = "candidatos"
                candidatos, _ = SupabaseService.get_all("candidatos")

            res, error = SupabaseService.update(tabela, id, data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            if "status" in data:
                registrar_log_auditoria(
                    user,
                    "Avaliação de Candidato",
                    f"Candidato {res.get('atleta_nome')} (ID: {res.get('atleta_id')}) status de exame atualizado para {data.get('status')} (Graduação pretendida: {res.get('graduacao_pretendida')})"
                )

            if data.get("status") == "aprovado":
                atleta_perfil, _ = SupabaseService.update("atletas", res.get("atleta_id"), {
                    "faixa": res.get("graduacao_pretendida", "Amarela")
                })
                SupabaseService.update("profiles", res.get("atleta_id"), {
                    "faixa": res.get("graduacao_pretendida", "Amarela")
                })

            # Enviar notificação de WhatsApp para aprovados e reprovados
            if data.get("status") in ["aprovado", "reprovado"]:
                try:
                    from services import whatsapp_service
                    profiles, _ = SupabaseService.get_all("profiles")
                    atleta_perfil = next((p for p in (profiles or []) if str(p.get("id")) == str(res.get("atleta_id"))), None)
                    if atleta_perfil:
                        tel = atleta_perfil.get("telefone") or atleta_perfil.get("celular") or ""
                        nome = atleta_perfil.get("nome", "Atleta")
                        faixa_pretendida = res.get("graduacao_pretendida", "Amarela")
                        if data.get("status") == "aprovado":
                            msg = whatsapp_service.msg_exame_aprovado(nome, faixa_pretendida)
                        else:
                            msg = whatsapp_service.msg_exame_reprovado(nome, faixa_pretendida)
                        
                        if tel:
                            whatsapp_service.enviar_mensagem(tel, msg)
                except Exception as e:
                    print(f"Erro ao disparar whatsapp de exame: {e}")

            # Redistribuir fila sempre que status mudar para inscrito, aprovado, reprovado
            # ou quando avaliado_por for alterado
            if data.get("status") in ["inscrito", "aprovado", "reprovado"] or "avaliado_por" in data:
                distribuir_proximos_fila(res.get("exame_id"))



            return jsonify(res), 200

        elif request.method == "DELETE":
            candidatos, _ = SupabaseService.get_all("candidatos_exame")
            tabela = "candidatos_exame"
            if not candidatos:
                tabela = "candidatos"
                candidatos, _ = SupabaseService.get_all("candidatos")

            cand = next((c for c in (candidatos or []) if str(c["id"]) == id), None)
            exame_id = cand.get("exame_id") if cand else None

            res, error = SupabaseService.delete(tabela, id)
            if error:
                return jsonify({"error": error}), 500

            if exame_id:
                distribuir_proximos_fila(exame_id)

            return jsonify({"sucesso": True}), 200

    @app.route("/api/exames/<id>", methods=["GET", "PATCH", "DELETE"])
    def handle_exame_detail(id):
        from app import get_current_user

        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        if request.method == "GET":
            exames, error = SupabaseService.get_all("exames")
            if error:
                return jsonify({"error": error}), 500

            exame = next((ex for ex in (exames or []) if str(ex["id"]) == id), None)
            if not exame:
                return jsonify({"error": "Exame não encontrado"}), 404

            if not exame.get("faixa_alvo"):
                exame["faixa_alvo"] = "Todas as Faixas"

            vinculos, _ = SupabaseService.get_all("examinadores_exame", filter_dict={"exame_id": id})
            examinadores_ids = [v["examinador_id"] for v in (vinculos or [])]

            candidatos, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"exame_id": id})
            if not candidatos:
                candidatos, _ = SupabaseService.get_all("candidatos", filter_dict={"exame_id": id})

            return jsonify({
                "exame": exame,
                "examinadores_ids": examinadores_ids,
                "candidatos": candidatos or []
            }), 200

        elif request.method == "PATCH":
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            res, error = SupabaseService.update("exames", id, data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Edição de Exame",
                f"Exame de faixa (ID: {id}) atualizado. Status: {data.get('status', 'Sem alteração de status')}"
            )

            if data.get("status") == "em_andamento":
                distribuir_proximos_fila(id)

            return jsonify(res), 200

        elif request.method == "DELETE":
            if user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            exames, _ = SupabaseService.get_all("exames")
            exame = next((ex for ex in (exames or []) if str(ex["id"]) == id), None)
            if not exame:
                return jsonify({"error": "Exame não encontrado"}), 404

            # Exclui candidatos associados
            candidatos, _ = SupabaseService.get_all("candidatos_exame")
            if candidatos:
                cands_exame = [c for c in candidatos if str(c.get("exame_id")) == id]
                for c in cands_exame:
                    SupabaseService.delete("candidatos_exame", c["id"])

            cands_alt, _ = SupabaseService.get_all("candidatos")
            if cands_alt:
                cands_exame_alt = [c for c in cands_alt if str(c.get("exame_id")) == id]
                for c in cands_exame_alt:
                    SupabaseService.delete("candidatos", c["id"])

            # Exclui examinadores vinculados
            examinadores, _ = SupabaseService.get_all("examinadores_exame")
            if examinadores:
                exs_exame = [ex for ex in examinadores if str(ex.get("exame_id")) == id]
                for ex in exs_exame:
                    SupabaseService.delete("examinadores_exame", ex["id"])

            # Exclui o exame
            res, error = SupabaseService.delete("exames", id)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Exclusão de Exame",
                f"Exame de faixa '{exame.get('titulo')}' (ID: {id}) foi permanentemente excluído."
            )

            return jsonify({"sucesso": True}), 200

    @app.route("/api/exames/<id>/examinadores", methods=["POST"])
    def vincular_examinadores(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        data = request.json or {}
        examinador_ids = data.get("examinador_ids", [])

        ex_existentes, _ = SupabaseService.get_all("examinadores_exame", filter_dict={"exame_id": id})
        for ee in (ex_existentes or []):
            SupabaseService.delete("examinadores_exame", ee["id"])

        for ex_id in examinador_ids:
            SupabaseService.insert("examinadores_exame", {
                "exame_id": id,
                "examinador_id": ex_id
            })

        return jsonify({"success": True}), 200

    @app.route("/api/exames/<id>/certificados", methods=["POST"])
    def emitir_certificados_exame(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        candidatos, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"exame_id": id})
        if not candidatos:
            candidatos, _ = SupabaseService.get_all("candidatos", filter_dict={"exame_id": id})

        if not candidatos:
            return jsonify({"error": "Nenhum candidato localizado."}), 404

        aprovados = [c for c in candidatos if c.get("status") == "aprovado"]
        if not aprovados:
            return jsonify({"error": "Nenhum candidato aprovado para emitir certificados."}), 400

        certificados_existentes, _ = SupabaseService.get_all("certificados")
        atletas_com_cert = set(c.get("atleta_id") for c in (certificados_existentes or []))

        count = 0
        for c in aprovados:
            if c["atleta_id"] not in atletas_com_cert:
                import hashlib
                import time
                hash_code = hashlib.md5(f"{c['atleta_id']}-{time.time()}".encode()).hexdigest()[:12].upper()

                SupabaseService.insert("certificados", {
                    "atleta_id": c["atleta_id"],
                    "codigo_validacao": hash_code,
                    "data_emissao": datetime.utcnow().date().isoformat() if 'datetime' in globals() else "2026-06-08"
                })
                count += 1

        return jsonify({"success": True, "emitidos": count}), 200

    @app.route("/api/examinadores", methods=["GET"])
    def get_examinadores():
        profiles, error = SupabaseService.get_all("profiles")
        if error:
            return jsonify({"error": error}), 500
        examinadores = [p for p in (profiles or []) if p.get("tipo") in ["admin", "filial"]]
        return jsonify({"examinadores": examinadores}), 200

def distribuir_proximos_fila(exame_id):
    """Distribui candidatos 'inscrito' sem banca para os examinadores vinculados ao exame (máx 3 por banca)."""
    # Busca todos os candidatos do exame
    candidatos_exame, _ = SupabaseService.get_all("candidatos_exame", filter_dict={"exame_id": exame_id})
    if not candidatos_exame:
        candidatos_exame, _ = SupabaseService.get_all("candidatos", filter_dict={"exame_id": exame_id})

    if not candidatos_exame:
        return

    tabela = "candidatos_exame"

    # Busca examinadores vinculados a este exame
    vinculos, _ = SupabaseService.get_all("examinadores_exame", filter_dict={"exame_id": exame_id})
    if not vinculos:
        return

    examinador_ids = [v["examinador_id"] for v in vinculos]

    # Candidatos na fila: inscrito e sem examinador designado
    candidatos_fila = [
        c for c in candidatos_exame
        if c.get("status") == "inscrito" and not c.get("avaliado_por")
    ]

    if not candidatos_fila:
        return

    # Para cada candidato sem banca, encontrar o examinador com menos de 3 ativos
    for cand in candidatos_fila:
        for ex_id in examinador_ids:
            ativos_do_ex = [
                c for c in candidatos_exame
                if c.get("avaliado_por") == ex_id and c.get("status") == "inscrito"
            ]
            if len(ativos_do_ex) < 3:
                SupabaseService.update(tabela, cand["id"], {"avaliado_por": ex_id})
                # Atualiza localmente para evitar dupla contagem no loop
                cand["avaliado_por"] = ex_id
                break


