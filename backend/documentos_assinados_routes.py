import os
import uuid
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from services.supabase_service import SupabaseService
from services import pdf_service

def create_documentos_assinados_routes(app: Flask):
    """Cria e registra rotas para gestão e assinatura digital de documentos via Gov.br."""

    # Rota auxiliar para servir os PDFs gerados localmente no desenvolvimento
    @app.route("/static/documentos/<path:filename>")
    def servir_pdf_gerado(filename):
        app_dir = os.path.dirname(os.path.abspath(__file__))
        static_dir = os.path.join(app_dir, "static", "documentos")
        return send_from_directory(static_dir, filename)

    @app.route("/api/documentos-assinados", methods=["GET"])
    def listar_documentos_assinados():
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        # Carrega todos os documentos cadastrados
        documentos, error = SupabaseService.get_all("documentos_assinados", order_by="created_at", ascending=False)
        if error:
            return jsonify({"error": error}), 500

        # Filtra documentos conforme permissão
        if user.get("tipo") == "admin":
            result = documentos or []
        else:
            result = [d for d in (documentos or []) if str(d.get("atleta_id")) == str(user.get("id"))]

        # Garante que todo documento cadastrado tenha o arquivo PDF inicial gerado se não existir
        profiles, _ = SupabaseService.get_all("profiles")
        for doc in result:
            if not doc.get("arquivo_url"):
                # Carrega o perfil do atleta correspondente
                atleta = next((p for p in (profiles or []) if str(p.get("id")) == str(doc.get("atleta_id"))), user)
                url_pdf = pdf_service.gerar_pdf_documento(
                    atleta=atleta,
                    doc_tipo=doc.get("tipo_documento", "ficha_filiacao"),
                    doc_titulo=doc.get("titulo", "Termo de Matrícula"),
                    status=doc.get("status", "pendente"),
                    signed_at=doc.get("signed_at"),
                    assinatura_hash=doc.get("assinatura_hash")
                )
                # Salva o arquivo no banco
                SupabaseService.update("documentos_assinados", doc["id"], {"arquivo_url": url_pdf})
                doc["arquivo_url"] = url_pdf

        return jsonify({"documentos": result}), 200

    @app.route("/api/documentos-assinados/gerar", methods=["POST"])
    def gerar_solicitacao_assinatura():
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        data = request.json or {}
        atleta_id = data.get("atleta_id")
        titulo = data.get("titulo")
        tipo_doc = data.get("tipo_documento", "ficha_filiacao")

        if not atleta_id or not titulo:
            return jsonify({"error": "Os campos 'atleta_id' e 'titulo' são obrigatórios"}), 400

        # Carrega o perfil do atleta
        profiles, _ = SupabaseService.get_all("profiles")
        atleta = next((p for p in (profiles or []) if str(p.get("id")) == str(atleta_id)), None)
        if not atleta:
            return jsonify({"error": "Atleta não encontrado"}), 404

        doc_id = str(uuid.uuid4())
        
        # Gera o PDF inicial pendente
        url_pdf = pdf_service.gerar_pdf_documento(
            atleta=atleta,
            doc_tipo=tipo_doc,
            doc_titulo=titulo,
            status="pendente",
            signed_at=None,
            assinatura_hash=None
        )

        novo_doc = {
            "id": doc_id,
            "atleta_id": atleta_id,
            "atleta_nome": atleta.get("nome", "Atleta"),
            "titulo": titulo,
            "tipo_documento": tipo_doc,
            "status": "pendente",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "signed_at": None,
            "assinatura_hash": None,
            "arquivo_url": url_pdf
        }

        res, error = SupabaseService.insert("documentos_assinados", novo_doc)
        if error:
            return jsonify({"error": error}), 500

        # Envia alerta para o WhatsApp se houver telefone cadastrado
        telefone = atleta.get("telefone") or atleta.get("celular")
        if telefone:
            try:
                from services import whatsapp_service
                msg = (
                    f"📝 *GRKK — Solicitação de Assinatura*\n\n"
                    f"Olá, *{atleta.get('nome')}*!\n"
                    f"Foi emitida uma solicitação para assinatura digital do documento:\n"
                    f"👉 *{titulo}*.\n\n"
                    f"Por favor, acesse a aba 'Documentos' no portal para assinar usando sua conta *Gov.br*:\n"
                    f"🔗 https://gojuryukaratekai.com.br/documentos\n\n"
                    f"_Goju-Ryu Karatê-Kai_"
                )
                whatsapp_service.enviar_mensagem(telefone, msg)
            except Exception as ex:
                print(f"Erro ao disparar alerta WhatsApp: {ex}")

        return jsonify(res), 201


    @app.route("/api/documentos-assinados/<id>/assinar", methods=["POST"])
    def assinar_documento_gov(id):
        from app import get_current_user
        user = get_current_user()
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        # Carrega o documento correspondente
        documentos, _ = SupabaseService.get_all("documentos_assinados")
        doc = next((d for d in (documentos or []) if str(d.get("id")) == str(id)), None)
        if not doc:
            return jsonify({"error": "Documento não encontrado"}), 404

        # Segurança: impede assinaturas cruzadas
        if user.get("tipo") != "admin" and str(doc.get("atleta_id")) != str(user.get("id")):
            return jsonify({"error": "Acesso não autorizado para assinar este documento"}), 403

        if doc.get("status") == "assinado":
            return jsonify({"error": "Este documento já foi assinado"}), 400

        data = request.json or {}
        cpf_assinante = data.get("cpf", "")
        # Simula a geração do hash do ITI Gov.br usando SHA-256 e o timestamp
        signed_at_iso = datetime.utcnow().isoformat() + "Z"
        raw_hash_seed = f"{doc['id']}-{cpf_assinante}-{signed_at_iso}-{uuid.uuid4().hex}"
        assinatura_hash = hashlib.sha256(raw_hash_seed.encode()).hexdigest().upper()

        # Recarrega o perfil do atleta com as informações mais atuais
        profiles, _ = SupabaseService.get_all("profiles")
        atleta = next((p for p in (profiles or []) if str(p.get("id")) == str(doc.get("atleta_id"))), user)

        # Regera o PDF contendo agora o selo de assinado digitalmente
        url_pdf = pdf_service.gerar_pdf_documento(
            atleta=atleta,
            doc_tipo=doc.get("tipo_documento"),
            doc_titulo=doc.get("titulo"),
            status="assinado",
            signed_at=signed_at_iso,
            assinatura_hash=assinatura_hash
        )

        update_payload = {
            "status": "assinado",
            "signed_at": signed_at_iso,
            "assinatura_hash": assinatura_hash,
            "arquivo_url": url_pdf
        }

        res, error = SupabaseService.update("documentos_assinados", id, update_payload)
        if error:
            return jsonify({"error": error}), 500

        # Log de auditoria
        from services.audit_service import registrar_log_auditoria
        registrar_log_auditoria(
            user=user,
            acao="Assinatura Gov.br",
            detalhes=f"Documento '{doc.get('titulo')}' (ID: {id}) assinado eletronicamente por {atleta.get('nome')} usando CPF {cpf_assinante[:3]}.***.***-{cpf_assinante[-2:]}."
        )

        return jsonify({"success": True, "documento": res}), 200

    @app.route("/api/documentos-assinados/<id>", methods=["DELETE"])
    def deletar_documento_assinado(id):
        from app import get_current_user
        user = get_current_user()
        if not user or user.get("tipo") != "admin":
            return jsonify({"error": "Acesso não autorizado"}), 403

        # Carrega o documento correspondente
        documentos, _ = SupabaseService.get_all("documentos_assinados")
        doc = next((d for d in (documentos or []) if str(d.get("id")) == str(id)), None)
        if not doc:
            return jsonify({"error": "Documento não encontrado"}), 404

        # Remove o arquivo PDF físico se existir
        arquivo_url = doc.get("arquivo_url")
        if arquivo_url and "/static/documentos/" in arquivo_url:
            try:
                app_dir = os.path.dirname(os.path.abspath(__file__))
                filename = arquivo_url.split("/")[-1]
                filepath = os.path.join(app_dir, "static", "documentos", filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception as ex:
                print(f"Erro ao remover arquivo PDF físico: {ex}")

        # Deleta do Supabase
        _, error = SupabaseService.delete("documentos_assinados", id)
        if error:
            return jsonify({"error": error}), 500

        # Log de auditoria
        from services.audit_service import registrar_log_auditoria
        registrar_log_auditoria(
            user=user,
            acao="Exclusão Documento Assinado",
            detalhes=f"Excluída solicitação/documento de assinatura '{doc.get('titulo')}' (ID: {id}) do atleta {doc.get('atleta_nome')}."
        )

        return jsonify({"success": True}), 200
