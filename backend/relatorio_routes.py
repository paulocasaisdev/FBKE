from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService

def create_relatorio_routes(app: Flask):
    """Cria e registra as rotas de relatórios gerenciais (exclusivo para administradores)"""

    @app.route("/api/relatorios/geral", methods=["GET"])
    def relatorio_geral():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        # 1. Obter Atletas
        atletas, _ = SupabaseService.get_all("atletas")
        atletas = atletas or []
        total_atletas = len(atletas)
        atletas_ativos = len([a for a in atletas if a.get("status") not in ["pendente", "cancelado"]])

        # 2. Obter Filiais
        filiais, _ = SupabaseService.get_all("filiais")
        total_filiais = len(filiais or [])

        # 3. Financeiro
        faturas, _ = SupabaseService.get_all("financeiro")
        faturas = faturas or []
        faturamento_total = sum(float(f.get("valor", 0)) for f in faturas if f.get("status") == "pago")
        faturamento_pendente = sum(float(f.get("valor", 0)) for f in faturas if f.get("status") in ["pendente", "atrasado"])

        # 4. Exames
        candidatos, _ = SupabaseService.get_all("candidatos_exame")
        if not candidatos:
            candidatos, _ = SupabaseService.get_all("candidatos")
        candidatos = candidatos or []
        
        aprovados = len([c for c in candidatos if c.get("status") == "aprovado"])
        avaliados = len([c for c in candidatos if c.get("status") in ["aprovado", "reprovado"]])
        taxa_aprovacao = (aprovados / avaliados * 100) if avaliados > 0 else 100.0

        return jsonify({
            "total_atletas": total_atletas,
            "atletas_ativos": atletas_ativos,
            "total_filiais": total_filiais,
            "faturamento_total": faturamento_total,
            "faturamento_pendente": faturamento_pendente,
            "taxa_aprovacao_exames": round(taxa_aprovacao, 2)
        }), 200

    @app.route("/api/relatorios/financeiro", methods=["GET"])
    def relatorio_financeiro():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        faturas, _ = SupabaseService.get_all("financeiro")
        faturas = faturas or []

        # Filtro de data
        data_inicio = request.args.get("data_inicio")
        data_fim = request.args.get("data_fim")
        if data_inicio:
            faturas = [f for f in faturas if f.get("data_vencimento") >= data_inicio]
        if data_fim:
            faturas = [f for f in faturas if f.get("data_vencimento") <= data_fim]

        receita_por_tipo = {}
        cobrancas_por_status = {}

        for f in faturas:
            tipo = f.get("tipo", "outro")
            status = f.get("status", "pendente")
            valor = float(f.get("valor", 0))

            # Faturamento por tipo (somente se pago)
            if status == "pago":
                receita_por_tipo[tipo] = receita_por_tipo.get(tipo, 0) + valor

            # Cobranças por status
            if status not in cobrancas_por_status:
                cobrancas_por_status[status] = {"quantidade": 0, "total": 0.0}
            cobrancas_por_status[status]["quantidade"] += 1
            cobrancas_por_status[status]["total"] += valor

        # Ordena faturas recentes por vencimento decrescente e pega as 10 últimas
        faturas_recentes = sorted(faturas, key=lambda x: x.get("data_vencimento", ""), reverse=True)[:10]

        return jsonify({
            "receita_por_tipo": receita_por_tipo,
            "cobrancas_por_status": cobrancas_por_status,
            "receitas_recentes": faturas_recentes
        }), 200

    @app.route("/api/relatorios/atletas", methods=["GET"])
    def relatorio_atletas():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        atletas, _ = SupabaseService.get_all("atletas")
        atletas = atletas or []

        # Carregar nomes de filiais para mapeamento
        filiais, _ = SupabaseService.get_all("filiais")
        profiles, _ = SupabaseService.get_all("profiles")
        
        nome_filial_map = {}
        for f in (filiais or []):
            prof = next((p for p in (profiles or []) if p["id"] == f["id"]), None)
            if prof:
                nome_filial_map[f["id"]] = prof.get("nome_fantasia") or prof.get("nome") or "Dojo"

        por_faixa = {}
        por_filial = {}

        for a in atletas:
            faixa = a.get("faixa", "Branca")
            profile = next((p for p in (profiles or []) if p["id"] == a["id"]), None)
            filial_id = profile.get("filial_id") if profile else None
            filial_nome = nome_filial_map.get(filial_id, "Sem Filial / Dojo Central") if filial_id else "Dojo Central"

            por_faixa[faixa] = por_faixa.get(faixa, 0) + 1
            por_filial[filial_nome] = por_filial.get(filial_nome, 0) + 1

        return jsonify({
            "por_faixa": por_faixa,
            "por_filial": por_filial
        }), 200

    @app.route("/api/relatorios/exames", methods=["GET"])
    def relatorio_exames():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        exames, _ = SupabaseService.get_all("exames")
        candidatos, _ = SupabaseService.get_all("candidatos_exame")
        if not candidatos:
            candidatos, _ = SupabaseService.get_all("candidatos")

        exames = exames or []
        candidatos = candidatos or []

        total_exames = len(exames)
        exames_por_status = {}
        for ex in exames:
            status = ex.get("status", "rascunho")
            exames_por_status[status] = exames_por_status.get(status, 0) + 1

        # Agrupar aprovações por faixa-alvo
        aprovacoes_por_faixa = {}
        for c in candidatos:
            faixa_alvo = c.get("graduacao_pretendida", "Amarela")
            status = c.get("status", "pendente")

            if faixa_alvo not in aprovacoes_por_faixa:
                aprovacoes_por_faixa[faixa_alvo] = {"aprovados": 0, "total": 0}
            
            if status in ["aprovado", "reprovado"]:
                aprovacoes_por_faixa[faixa_alvo]["total"] += 1
                if status == "aprovado":
                    aprovacoes_por_faixa[faixa_alvo]["aprovados"] += 1

        taxa_por_faixa = {}
        for faixa, dados in aprovacoes_por_faixa.items():
            total = dados["total"]
            aprovados = dados["aprovados"]
            taxa_por_faixa[faixa] = round((aprovados / total * 100), 2) if total > 0 else 100.0

        return jsonify({
            "total_exames": total_exames,
            "exames_por_status": exames_por_status,
            "taxa_aprovacao_por_faixa": taxa_por_faixa,
            "total_inscricoes_exames": len(candidatos)
        }), 200

    @app.route("/api/relatorios/analytics", methods=["GET"])
    def relatorio_analytics():
        """Endpoint de analytics completo para o dashboard administrativo."""
        from app import get_current_user
        from datetime import datetime, date
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        hoje = date.today()

        # ── Helper: nome abreviado do mês ──────────────────────────────
        MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                       "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

        def mes_ano(ano, mes):
            return f"{MESES_ABREV[mes - 1]}/{str(ano)[-2:]}"

        # ── Últimos 6 meses como lista de (ano, mes) ───────────────────
        ultimos_6 = []
        for i in range(5, -1, -1):
            m = hoje.month - i
            y = hoje.year
            while m <= 0:
                m += 12
                y -= 1
            ultimos_6.append((y, m))

        # ── 1. Matrículas por Mês ──────────────────────────────────────
        atletas, _ = SupabaseService.get_all("atletas")
        atletas = atletas or []
        profiles, _ = SupabaseService.get_all("profiles")
        profiles = profiles or []

        matriculas_map = {mes_ano(y, m): 0 for y, m in ultimos_6}
        for a in atletas:
            created = a.get("created_at") or ""
            try:
                dt = datetime.fromisoformat(created.split("T")[0]) if "T" in created else datetime.strptime(created[:10], "%Y-%m-%d")
                chave = mes_ano(dt.year, dt.month)
                if chave in matriculas_map:
                    matriculas_map[chave] += 1
            except Exception:
                pass

        matriculas_por_mes = [{"mes": k, "atletas": v} for k, v in matriculas_map.items()]

        # ── 2. Receita vs. Pendente por Mês ───────────────────────────
        faturas, _ = SupabaseService.get_all("financeiro")
        faturas = faturas or []

        receita_map = {mes_ano(y, m): {"receita": 0.0, "pendente": 0.0} for y, m in ultimos_6}
        for f in faturas:
            dt_str = f.get("data_vencimento") or f.get("created_at") or ""
            try:
                dt_str_clean = dt_str.split("T")[0]
                dt = datetime.strptime(dt_str_clean[:7], "%Y-%m")
                chave = mes_ano(dt.year, dt.month)
                if chave in receita_map:
                    valor = float(f.get("valor", 0))
                    if f.get("status") == "pago":
                        receita_map[chave]["receita"] += valor
                    elif f.get("status") in ("pendente", "atrasado"):
                        receita_map[chave]["pendente"] += valor
            except Exception:
                pass

        receita_por_mes = [
            {"mes": k, "receita": round(v["receita"], 2), "pendente": round(v["pendente"], 2)}
            for k, v in receita_map.items()
        ]

        # ── 2.1 Despesas e Fluxo de Caixa Consolidado ─────────────────
        despesas, _ = SupabaseService.get_all("despesas")
        despesas = despesas or []
        despesa_map = {mes_ano(y, m): 0.0 for y, m in ultimos_6}
        for d in despesas:
            dt_str = d.get("data_pagamento") or d.get("created_at") or ""
            try:
                dt_str_clean = dt_str.split("T")[0]
                dt = datetime.strptime(dt_str_clean[:7], "%Y-%m")
                chave = mes_ano(dt.year, dt.month)
                if chave in despesa_map:
                    despesa_map[chave] += float(d.get("valor", 0))
            except Exception:
                pass

        fluxo_caixa = [
            {
                "mes": k,
                "receita": round(receita_map[k]["receita"], 2),
                "despesa": round(despesa_map[k], 2),
                "saldo": round(receita_map[k]["receita"] - despesa_map[k], 2)
            }
            for k, _ in ultimos_6
        ]

        # ── 3. Distribuição de Atletas por Faixa ──────────────────────
        ORDEM_FAIXAS = [
            "Branca", "Branca/Amarela", "Amarela", "Amarela/Laranja",
            "Laranja", "Laranja/Verde", "Verde", "Verde/Azul",
            "Azul", "Azul/Vermelha", "Vermelha", "Marrom",
            "Marrom I", "Marrom II", "Preta I", "Preta II"
        ]
        faixas_map: dict = {}
        for a in atletas:
            faixa = a.get("faixa") or "Branca"
            faixas_map[faixa] = faixas_map.get(faixa, 0) + 1

        distribuicao_faixas = [
            {"faixa": f, "total": faixas_map.get(f, 0)}
            for f in ORDEM_FAIXAS if faixas_map.get(f, 0) > 0
        ]

        # ── 4. Frequência por Filial (mês atual) ──────────────────────
        mes_atual_str = hoje.strftime("%Y-%m")
        presencas, _ = SupabaseService.get_all("presencas")
        presencas = presencas or []
        filiais, _ = SupabaseService.get_all("filiais")
        filiais = filiais or []

        filial_nome_map = {}
        for f in filiais:
            prof = next((p for p in profiles if p["id"] == f["id"]), None)
            nome = (prof.get("nome_fantasia") or prof.get("nome")) if prof else f.get("id", "?")
            filial_nome_map[f["id"]] = nome

        freq_filial_map: dict = {}
        for p in presencas:
            if p.get("status") == "presente":
                data_p = (p.get("data") or "")[:7]
                if data_p == mes_atual_str:
                    filial_id = p.get("filial_id", "")
                    nome_filial = filial_nome_map.get(filial_id, "Dojo Central")
                    freq_filial_map[nome_filial] = freq_filial_map.get(nome_filial, 0) + 1

        frequencia_por_filial = [
            {"filial": k, "treinos": v}
            for k, v in sorted(freq_filial_map.items(), key=lambda x: -x[1])
        ]

        # ── 5. KPIs de variação mensal ─────────────────────────────────
        mes_atual_idx = len(ultimos_6) - 1
        mes_ant_idx = mes_atual_idx - 1

        atl_mes = matriculas_por_mes[mes_atual_idx]["atletas"] if mes_atual_idx >= 0 else 0
        atl_ant = matriculas_por_mes[mes_ant_idx]["atletas"] if mes_ant_idx >= 0 else 0
        variacao_atletas = round(((atl_mes - atl_ant) / atl_ant * 100) if atl_ant > 0 else 0, 1)

        rec_mes = receita_por_mes[mes_atual_idx]["receita"] if mes_atual_idx >= 0 else 0
        rec_ant = receita_por_mes[mes_ant_idx]["receita"] if mes_ant_idx >= 0 else 0
        variacao_receita = round(((rec_mes - rec_ant) / rec_ant * 100) if rec_ant > 0 else 0, 1)

        # Taxa de adimplência global
        total_faturas = len(faturas)
        pagas = len([f for f in faturas if f.get("status") == "pago"])
        taxa_adimplencia = round((pagas / total_faturas * 100) if total_faturas > 0 else 100.0, 1)

        # Taxa de aprovação em exames
        candidatos, _ = SupabaseService.get_all("candidatos_exame")
        if not candidatos:
            candidatos, _ = SupabaseService.get_all("candidatos")
        candidatos = candidatos or []
        aprovados = len([c for c in candidatos if c.get("status") == "aprovado"])
        avaliados = len([c for c in candidatos if c.get("status") in ["aprovado", "reprovado"]])
        taxa_aprovacao = round((aprovados / avaliados * 100) if avaliados > 0 else 100.0, 1)

        return jsonify({
            "matriculas_por_mes": matriculas_por_mes,
            "receita_por_mes": receita_por_mes,
            "fluxo_caixa": fluxo_caixa,
            "distribuicao_faixas": distribuicao_faixas,
            "frequencia_por_filial": frequencia_por_filial,
            "kpis": {
                "variacao_atletas_pct": variacao_atletas,
                "variacao_receita_pct": variacao_receita,
                "taxa_adimplencia": taxa_adimplencia,
                "taxa_aprovacao_exames": taxa_aprovacao,
                "total_atletas": len(atletas),
                "total_filiais": len(filiais),
            }
        }), 200

