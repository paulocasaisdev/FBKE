"""
Serviço de pagamentos via Asaas (PIX e Boleto).

Modo mock: ativo quando ASAAS_API_KEY não está configurado.
Sandbox Asaas: https://sandbox.asaas.com/api/v3
Produção Asaas: https://api.asaas.com/api/v3

Para ativar em produção, defina no .env:
  ASAAS_API_KEY=seu_token_aqui
  ASAAS_SANDBOX=false  (ou true para homologação)
"""
import os
import uuid
import base64
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

ASAAS_API_KEY = os.environ.get("ASAAS_API_KEY", "")
ASAAS_SANDBOX = os.environ.get("ASAAS_SANDBOX", "true").lower() != "false"
ASAAS_BASE_URL = (
    "https://sandbox.asaas.com/api/v3"
    if ASAAS_SANDBOX
    else "https://api.asaas.com/api/v3"
)

# ── QR Code SVG mínimo gerado localmente para mock ────────────────────────
_MOCK_QR_SVG = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#fff"/>
  <g fill="#000">
    <!-- Cantos QR -->
    <rect x="10" y="10" width="60" height="60"/>
    <rect x="15" y="15" width="50" height="50" fill="#fff"/>
    <rect x="20" y="20" width="40" height="40"/>
    <rect x="130" y="10" width="60" height="60"/>
    <rect x="135" y="15" width="50" height="50" fill="#fff"/>
    <rect x="140" y="20" width="40" height="40"/>
    <rect x="10" y="130" width="60" height="60"/>
    <rect x="15" y="135" width="50" height="50" fill="#fff"/>
    <rect x="20" y="140" width="40" height="40"/>
    <!-- Dados centrais (padrão) -->
    <rect x="85" y="10" width="30" height="10"/>
    <rect x="85" y="30" width="10" height="10"/>
    <rect x="105" y="30" width="10" height="10"/>
    <rect x="85" y="50" width="30" height="10"/>
    <rect x="10" y="85" width="10" height="30"/>
    <rect x="30" y="85" width="10" height="10"/>
    <rect x="10" y="105" width="30" height="10"/>
    <rect x="130" y="85" width="10" height="30"/>
    <rect x="150" y="85" width="10" height="10"/>
    <rect x="130" y="105" width="30" height="10"/>
    <rect x="85" y="130" width="10" height="30"/>
    <rect x="105" y="130" width="10" height="10"/>
    <rect x="85" y="150" width="30" height="10"/>
    <rect x="85" y="85" width="30" height="30"/>
  </g>
</svg>
"""

def _is_mock() -> bool:
    return not bool(ASAAS_API_KEY)


def _mock_qr_base64() -> str:
    return base64.b64encode(_MOCK_QR_SVG.encode()).decode()


def _asaas_headers() -> dict:
    return {
        "accept": "application/json",
        "content-type": "application/json",
        "access_token": ASAAS_API_KEY,
    }


def _asaas_post(path: str, body: dict) -> dict:
    """Realiza POST na API do Asaas."""
    import requests as req
    url = f"{ASAAS_BASE_URL}/{path.lstrip('/')}"
    try:
        r = req.post(url, headers=_asaas_headers(), json=body, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"[Asaas] Erro em POST {path}: {e}")
        raise


def _asaas_get(path: str) -> dict:
    """Realiza GET na API do Asaas."""
    import requests as req
    url = f"{ASAAS_BASE_URL}/{path.lstrip('/')}"
    try:
        r = req.get(url, headers=_asaas_headers(), timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"[Asaas] Erro em GET {path}: {e}")
        raise


# ── Criar ou recuperar cliente no Asaas ──────────────────────────────────
def _garantir_cliente_asaas(atleta: dict) -> str:
    """Busca ou cria cliente no Asaas. Retorna o customerId."""
    email = atleta.get("email", "")
    nome = atleta.get("nome", "Atleta GRKK")
    cpf = atleta.get("cpf", "")
    telefone = atleta.get("telefone", "")

    # Tenta buscar por e-mail
    try:
        res = _asaas_get(f"/customers?email={email}&limit=1")
        if res.get("data"):
            return res["data"][0]["id"]
    except Exception:
        pass

    # Cria novo cliente
    body = {"name": nome, "email": email}
    if cpf:
        body["cpfCnpj"] = cpf.replace(".", "").replace("-", "")
    if telefone:
        body["mobilePhone"] = telefone.replace("(", "").replace(")", "").replace(" ", "").replace("-", "")

    res = _asaas_post("/customers", body)
    return res["id"]


# ── Gerar cobrança PIX ────────────────────────────────────────────────────
def gerar_pix(atleta: dict, fatura: dict) -> dict:
    """
    Retorna dict com:
      id_cobranca, pix_copia_cola, qr_code_base64, vencimento, valor
    """
    valor = float(fatura.get("valor", 0))
    vencimento = fatura.get("data_vencimento") or (
        datetime.utcnow() + timedelta(days=1)
    ).strftime("%Y-%m-%d")
    descricao = fatura.get("descricao") or fatura.get("tipo", "Mensalidade GRKK")

    if _is_mock():
        logger.info(f"[PaymentService] MOCK — PIX para fatura {fatura.get('id')} R${valor:.2f}")
        return {
            "id_cobranca": f"mock_{uuid.uuid4().hex[:12]}",
            "pix_copia_cola": f"00020126580014br.gov.bcb.pix0136MOCK-GRKK-{fatura.get('id', 'X')[:8]}52040000530398654{valor:07.2f}5802BR5913GRKK Karate6008Brasilia62070503***63041234",
            "qr_code_base64": _mock_qr_base64(),
            "vencimento": vencimento,
            "valor": valor,
            "mock": True,
        }

    customer_id = _garantir_cliente_asaas(atleta)
    cobranca = _asaas_post("/payments", {
        "customer": customer_id,
        "billingType": "PIX",
        "value": valor,
        "dueDate": vencimento,
        "description": descricao,
        "externalReference": str(fatura.get("id", "")),
    })

    # Busca QR Code
    qr_data = _asaas_get(f"/payments/{cobranca['id']}/pixQrCode")

    return {
        "id_cobranca": cobranca["id"],
        "pix_copia_cola": qr_data.get("payload", ""),
        "qr_code_base64": qr_data.get("encodedImage", ""),
        "vencimento": vencimento,
        "valor": valor,
        "mock": False,
    }


# ── Gerar cobrança Boleto ─────────────────────────────────────────────────
def gerar_boleto(atleta: dict, fatura: dict) -> dict:
    """
    Retorna dict com:
      id_cobranca, linha_digitavel, url_boleto, vencimento, valor
    """
    valor = float(fatura.get("valor", 0))
    vencimento = fatura.get("data_vencimento") or (
        datetime.utcnow() + timedelta(days=3)
    ).strftime("%Y-%m-%d")
    descricao = fatura.get("descricao") or fatura.get("tipo", "Mensalidade GRKK")

    if _is_mock():
        logger.info(f"[PaymentService] MOCK — Boleto para fatura {fatura.get('id')} R${valor:.2f}")
        return {
            "id_cobranca": f"mock_bol_{uuid.uuid4().hex[:12]}",
            "linha_digitavel": f"34191.09008 00000.000000 00000.000000 0 00000000{int(valor * 100):010d}",
            "url_boleto": "https://sandbox.asaas.com/b/mock-boleto",
            "vencimento": vencimento,
            "valor": valor,
            "mock": True,
        }

    customer_id = _garantir_cliente_asaas(atleta)
    cobranca = _asaas_post("/payments", {
        "customer": customer_id,
        "billingType": "BOLETO",
        "value": valor,
        "dueDate": vencimento,
        "description": descricao,
        "externalReference": str(fatura.get("id", "")),
    })

    detalhe = _asaas_get(f"/payments/{cobranca['id']}")
    return {
        "id_cobranca": cobranca["id"],
        "linha_digitavel": detalhe.get("bankSlipUrl", ""),
        "url_boleto": detalhe.get("bankSlipUrl", ""),
        "vencimento": vencimento,
        "valor": valor,
        "mock": False,
    }


# ── Verificar status de cobrança ──────────────────────────────────────────
def verificar_status(id_cobranca: str) -> dict:
    """Retorna o status atual da cobrança."""
    if _is_mock() or id_cobranca.startswith("mock"):
        return {"status": "PENDING", "mock": True}
    try:
        dados = _asaas_get(f"/payments/{id_cobranca}")
        return {"status": dados.get("status", "PENDING"), "mock": False}
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}
