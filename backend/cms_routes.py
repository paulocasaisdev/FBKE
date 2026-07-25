from flask import Flask, request, jsonify
from services.supabase_service import SupabaseService
from services.audit_service import registrar_log_auditoria

def create_cms_routes(app: Flask):
    """Cria e registra as rotas do CMS (conteúdos do site)"""
    from app import get_current_user

    @app.route("/api/noticias", methods=["GET", "POST"])
    def manage_noticias():
        from app import get_current_user

        if request.method == "GET":
            publicado = request.args.get("publicado")
            categoria = request.args.get("categoria")

            filter_dict = {}
            if publicado is not None:
                filter_dict["publicado"] = publicado == "true"
            if categoria:
                filter_dict["categoria"] = categoria

            noticias, error = SupabaseService.get_all("noticias", order_by="created_at", ascending=False, filter_dict=filter_dict)
            if error:
                return jsonify({"error": error}), 500

            return jsonify({
                "noticias": noticias,
                "total": len(noticias)
            }), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Acesso não autorizado"}), 403

            body = request.json or {}
            body["autor_id"] = user["id"]

            noticia, error = SupabaseService.insert("noticias", body)
            if error:
                return jsonify({"error": error}), 500

            return jsonify({"noticia": noticia}), 201

    @app.route("/api/noticias/<id>", methods=["PATCH", "DELETE"])
    def gerenciar_noticias_id(id):
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        if request.method == "PATCH":
            data = request.json or {}
            res, error = SupabaseService.update("noticias", id, data)
            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 200

        elif request.method == "DELETE":
            res, error = SupabaseService.delete("noticias", id)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"sucesso": True}), 200

    @app.route("/api/galeria", methods=["GET"])
    def get_galeria():
        categoria = request.args.get("categoria")
        filter_dict = {}
        if categoria:
            filter_dict["category"] = categoria

        items, error = SupabaseService.get_all("gallery_items", order_by="order", ascending=True, filter_dict=filter_dict)
        if error:
            return jsonify({"error": error}), 500

        return jsonify({"items": items}), 200

    @app.route("/api/equipe", methods=["GET"])
    def get_equipe():
        members, error = SupabaseService.get_all("team_members", order_by="order", ascending=True)
        if error:
            return jsonify({"error": error}), 500

        return jsonify({"members": members}), 200

    @app.route("/api/cms", methods=["GET", "POST"])
    def manage_cms():
        if request.method == "GET":
            banners, _ = SupabaseService.get_all("cms_banners")
            equipe, _ = SupabaseService.get_all("team_members", order_by="order", ascending=True)
            galeria, _ = SupabaseService.get_all("gallery_items", order_by="order", ascending=True)

            return jsonify({
                "banners": banners or [],
                "equipe": equipe or [],
                "galeria": galeria or []
            }), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            tipo_item = data.get("tipo")
            payload = data.get("payload")

            if not tipo_item or not payload:
                return jsonify({"error": "Parâmetros tipo e payload são obrigatórios"}), 400

            tabela = ""
            if tipo_item == "banner":
                tabela = "cms_banners"
            elif tipo_item == "equipe":
                tabela = "team_members"
            elif tipo_item == "galeria":
                tabela = "gallery_items"
            else:
                return jsonify({"error": "Tipo inválido"}), 400

            item_id = payload.get("id")
            if item_id:
                res, error = SupabaseService.update(tabela, item_id, payload)
            else:
                res, error = SupabaseService.insert(tabela, payload)

            if error:
                return jsonify({"error": error}), 500
            return jsonify(res), 200

    @app.route("/api/cms/<tipo>/<id>", methods=["DELETE"])
    def delete_cms_item(tipo, id):
        import traceback
        try:
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            tabela = ""
            if tipo == "banner":
                tabela = "cms_banners"
            elif tipo == "equipe":
                tabela = "team_members"
            elif tipo == "galeria":
                tabela = "gallery_items"
            else:
                return jsonify({"error": "Tipo inválido"}), 400

            res, error = SupabaseService.delete(tabela, id)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"sucesso": True}), 200
        except Exception as e:
            return jsonify({
                "error": f"Crash no backend: {str(e)}",
                "traceback": traceback.format_exc()
            }), 500

    @app.route("/api/documentos", methods=["GET", "POST"])
    def manage_documentos():
        from app import get_current_user

        if request.method == "GET":
            docs, error = SupabaseService.get_all("documentos", order_by="created_at", ascending=False)
            if error:
                return jsonify({"error": error}), 500
            return jsonify({"documentos": docs or []}), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Acesso não autorizado"}), 403

            data = request.json or {}
            titulo = data.get("titulo")
            tipo = data.get("tipo")
            if not titulo or not tipo:
                return jsonify({"error": "Título e Tipo são obrigatórios"}), 400

            res, error = SupabaseService.insert("documentos", data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Criação de Documento",
                f"Documento '{titulo}' (Tipo: {tipo}) inserido."
            )

            return jsonify(res), 201

    @app.route("/api/documentos/<id>", methods=["PATCH", "DELETE"])
    def gerenciar_documentos_id(id):
        from app import get_current_user

        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        if request.method == "PATCH":
            data = request.json or {}
            res, error = SupabaseService.update("documentos", id, data)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Edição de Documento",
                f"Documento '{res.get('titulo')}' (ID: {id}) modificado."
            )

            return jsonify(res), 200

        elif request.method == "DELETE":
            # Busca antes de deletar para obter o título no log
            docs, _ = SupabaseService.get_all("documentos")
            doc = next((d for d in (docs or []) if str(d["id"]) == id), None)
            titulo = doc.get("titulo") if doc else id

            res, error = SupabaseService.delete("documentos", id)
            if error:
                return jsonify({"error": error}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Exclusão de Documento",
                f"Documento '{titulo}' (ID: {id}) excluído."
            )

            return jsonify({"sucesso": True}), 200

    @app.route("/api/cms/config", methods=["GET", "POST"])
    def manage_cms_config():
        from app import get_current_user
        from services.supabase_service import is_mock_mode, mock_db, supabase

        if request.method == "GET":
            if is_mock_mode:
                configs = mock_db.data.get("cms_config", [])
                config_dict = {c["chave"]: c["valor"] for c in configs}
                return jsonify({"config": config_dict}), 200
            else:
                try:
                    res = supabase.table("cms_config").select("*").execute()
                    config_dict = {c["chave"]: c["valor"] for c in res.data}
                    return jsonify({"config": config_dict}), 200
                except Exception as e:
                    return jsonify({"error": str(e)}), 500

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            chave = data.get("chave")
            valor = data.get("valor")

            if not chave or valor is None:
                return jsonify({"error": "Chave e valor são obrigatórios"}), 400

            if is_mock_mode:
                configs = mock_db.data.setdefault("cms_config", [])
                found = False
                for c in configs:
                    if c["chave"] == c.get("chave"):
                        if c["chave"] == chave:
                            c["valor"] = valor
                            found = True
                            break
                if not found:
                    configs.append({"chave": chave, "valor": valor})
                mock_db.save()
                res_data = {"chave": chave, "valor": valor}
            else:
                try:
                    res = supabase.table("cms_config").upsert({"chave": chave, "valor": valor}).execute()
                    res_data = res.data[0] if res.data else {"chave": chave, "valor": valor}
                except Exception as e:
                    return jsonify({"error": str(e)}), 500

            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Atualização de Configuração do Site",
                f"Seção '{chave}' da página inicial atualizada."
            )

            return jsonify(res_data), 200

    @app.route("/api/cms/glossario", methods=["GET", "POST"])
    def manage_glossario():
        from app import get_current_user
        from services.ai_service import get_all_terms, add_or_update_term

        if request.method == "GET":
            terms = get_all_terms()
            sorted_terms = sorted([{"termo": k, "definicao": v} for k, v in terms.items()], key=lambda x: x["termo"])
            return jsonify({"glossario": sorted_terms}), 200

        elif request.method == "POST":
            user = get_current_user()
            if not user or user.get("tipo") != "admin":
                return jsonify({"error": "Não autorizado"}), 403

            data = request.json or {}
            termo = data.get("termo")
            definicao = data.get("definicao")

            if not termo or not definicao:
                return jsonify({"error": "Termo e definição são obrigatórios"}), 400

            res = add_or_update_term(termo, definicao)
            
            # Registrar log de auditoria
            registrar_log_auditoria(
                user,
                "Edição de Glossário do Sensei IA",
                f"Termo '{termo.lower()}' adicionado ou atualizado no glossário da IA."
            )

            return jsonify({"success": True, "data": res}), 200

    @app.route("/api/cms/glossario/<termo>", methods=["DELETE"])
    def delete_glossario_term(termo):
        from app import get_current_user
        from services.ai_service import remove_term

        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Não autorizado"}), 403

        if not termo:
            return jsonify({"error": "Termo é obrigatório"}), 400

        sucesso = remove_term(termo)
        if not sucesso:
            return jsonify({"error": "Termo não encontrado no glossário"}), 404

        # Registrar log de auditoria
        registrar_log_auditoria(
            user,
            "Exclusão de Glossário do Sensei IA",
            f"Termo '{termo.lower()}' removido do glossário da IA."
        )

        return jsonify({"success": True}), 200


