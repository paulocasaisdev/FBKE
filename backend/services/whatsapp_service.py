"""
Serviço de notificações WhatsApp via Evolution API.

Modo mock: ativo quando EVOLUTION_API_URL não está configurado.
Em mock, mensagens são apenas logadas no console — sem dependência externa.

Para ativar em produção, defina no .env:
  EVOLUTION_API_URL=https://sua-evolution-api.com
  EVOLUTION_API_KEY=sua_chave_aqui
  EVOLUTION_INSTANCE=grkk_bot

Como instalar a Evolution API (Docker):
  docker run -d --name evolution-api \\
    -p 8080:8080 \\
    -e AUTHENTICATION_API_KEY=SUA_CHAVE \\
    atendai/evolution-api:latest

Após instalar, crie uma instância, conecte um número WhatsApp via QR Code
e defina o nome da instância em EVOLUTION_INSTANCE.
"""
import os
import logging

logger = logging.getLogger(__name__)

EVOLUTION_API_URL = os.environ.get("EVOLUTION_API_URL", "").rstrip("/")
EVOLUTION_API_KEY = os.environ.get("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE = os.environ.get("EVOLUTION_INSTANCE", "grkk_bot")


def _is_mock() -> bool:
    return not bool(EVOLUTION_API_URL and EVOLUTION_API_KEY)


def _formatar_telefone(telefone: str) -> str:
    """
    Converte telefone brasileiro para formato internacional sem +.
    Ex: (61) 9 9999-9999 → 5561999999999
    """
    digitos = "".join(c for c in telefone if c.isdigit())
    if len(digitos) == 11:           # DDD + 9 dígitos
        return f"55{digitos}"
    elif len(digitos) == 10:         # DDD + 8 dígitos (fixo)
        return f"55{digitos}"
    elif len(digitos) == 13 and digitos.startswith("55"):
        return digitos               # Já tem código do país
    return f"55{digitos}"            # Fallback


def enviar_mensagem(telefone: str, mensagem: str) -> dict:
    """
    Envia mensagem WhatsApp para o telefone informado.
    Em modo mock, apenas loga e retorna sucesso simulado.
    """
    if not telefone:
        return {"success": False, "error": "Telefone não informado"}

    numero = _formatar_telefone(telefone)

    if _is_mock():
        logger.info(
            f"[WhatsApp MOCK] Para: +{numero}\n"
            f"{'─' * 60}\n{mensagem}\n{'─' * 60}"
        )
        return {"success": True, "mock": True, "numero": numero}

    import requests as req
    url = f"{EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}"
    headers = {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
    }
    body = {
        "number": f"{numero}@s.whatsapp.net",
        "options": {"delay": 1200, "presence": "composing"},
        "textMessage": {"text": mensagem},
    }

    try:
        r = req.post(url, headers=headers, json=body, timeout=15)
        r.raise_for_status()
        logger.info(f"[WhatsApp] Mensagem enviada para +{numero}")
        return {"success": True, "mock": False, "numero": numero, "response": r.json()}
    except Exception as e:
        logger.error(f"[WhatsApp] Erro ao enviar para +{numero}: {e}")
        return {"success": False, "error": str(e)}


def verificar_conexao() -> dict:
    """Verifica se a instância Evolution API está conectada."""
    if _is_mock():
        return {"connected": False, "mock": True, "status": "mock_mode"}

    import requests as req
    url = f"{EVOLUTION_API_URL}/instance/connectionState/{EVOLUTION_INSTANCE}"
    headers = {"apikey": EVOLUTION_API_KEY}
    try:
        r = req.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        state = data.get("instance", {}).get("state", "unknown")
        return {"connected": state == "open", "status": state, "mock": False}
    except Exception as e:
        return {"connected": False, "status": "error", "error": str(e), "mock": False}


# ── Templates de mensagens ────────────────────────────────────────────────

def msg_vencimento_proximo(nome: str, valor: float, data_venc: str) -> str:
    return (
        f"👋 Olá, *{nome}*!\n\n"
        f"🔔 Lembrete: sua mensalidade de *R$ {valor:.2f}* vence em *3 dias* ({data_venc}).\n\n"
        f"Para pagar, acesse o portal:\n"
        f"🔗 https://gojuryukaratekai.com.br/financeiro\n\n"
        f"_Goju-Ryu Karatê-Kai_"
    )


def msg_exame_aprovado(nome: str, faixa_nova: str) -> str:
    return (
        f"🥋 Parabéns, *{nome}*!\n\n"
        f"✅ Você foi *APROVADO(A)* para a graduação de *{faixa_nova}*!\n\n"
        f"Seu certificado estará disponível em breve no portal:\n"
        f"🔗 https://gojuryukaratekai.com.br/home\n\n"
        f"*OSU!* 🙏\n_Goju-Ryu Karatê-Kai_"
    )


def msg_exame_reprovado(nome: str, faixa_pretendida: str) -> str:
    return (
        f"🥋 Olá, *{nome}*.\n\n"
        f"Infelizmente, desta vez você *não foi aprovado(a)* para *{faixa_pretendida}*.\n\n"
        f"Continue treinando! Temos certeza que na próxima você conseguirá. 💪\n\n"
        f"*OSU!* 🙏\n_Goju-Ryu Karatê-Kai_"
    )


def msg_novo_aviso(titulo: str, conteudo: str) -> str:
    resumo = conteudo[:300] + ("..." if len(conteudo) > 300 else "")
    return (
        f"📢 *Novo Aviso da Diretoria*\n\n"
        f"*{titulo}*\n\n"
        f"{resumo}\n\n"
        f"Acesse o portal para ver mais:\n"
        f"🔗 https://gojuryukaratekai.com.br/home\n\n"
        f"_Goju-Ryu Karatê-Kai_"
    )


def msg_teste(nome_admin: str) -> str:
    from datetime import datetime
    agora = datetime.now().strftime("%d/%m/%Y %H:%M")
    return (
        f"✅ *Mensagem de Teste — Sistema GRKK*\n\n"
        f"Enviado por: *{nome_admin}*\n"
        f"Data/Hora: {agora}\n\n"
        f"A integração WhatsApp está funcionando corretamente!\n\n"
        f"_Goju-Ryu Karatê-Kai_"
    )
