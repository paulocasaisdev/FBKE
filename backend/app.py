import os
import sys
# Adiciona o diretório atual e o diretório pai ao sys.path para permitir importações flexíveis
app_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, app_dir)
sys.path.insert(1, os.path.dirname(app_dir))


from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from services.supabase_service import SupabaseService

# Resolve o caminho do .env de forma robusta e absoluta
app_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(app_dir, ".env")
load_dotenv(dotenv_path=env_path, override=True)

app = Flask(__name__)

@app.after_request
def disable_api_caching(response):
    # Desativa cache para todas as rotas da API (tanto no navegador quanto no proxy Nginx da HostGator)
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        response.headers["X-Accel-Expires"] = "0"  # Especifico para desativar cache no Nginx
    return response

# Configuração de chave secreta para segurança das sessões/cookies em produção
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY") or "chave-secreta-grkk-dev-12345"

# Permite CORS apenas para as origens front-end explícitas quando credenciais são necessárias.
# Usamos a variável de ambiente FRONTEND_ORIGINS (lista separada por vírgula) ou FRONTEND_URL.
# Se nenhuma variável for fornecida, habilitamos um conjunto razoável de origens de desenvolvimento
# comuns (localhost:3000 e 127.0.0.1:3000). Não use '*' quando credentials=True.
frontend_origins_env = os.environ.get("FRONTEND_ORIGINS") or os.environ.get("FRONTEND_URL")
if frontend_origins_env:
    if "," in frontend_origins_env:
        origins = [o.strip() for o in frontend_origins_env.split(",") if o.strip()]
    else:
        origins = [frontend_origins_env.strip()]
else:
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
# Ensure production front‑end domain is allowed
prod_origin = "https://gojuryukaratekai.com.br"
if prod_origin not in origins:
    origins.append(prod_origin)
CORS(
    app,
    resources={r"/api/*": {"origins": origins}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cookie", "X-CSRF-Token"],
    expose_headers=["Content-Type", "Authorization", "Set-Cookie"],
    max_age=86400,
)



# Helper para obter o usuário logado a partir dos cookies ou cabeçalhos
def get_current_user():
    # 1. Tenta obter do cookie do Flask
    user_email_or_id = request.cookies.get("session_user")
    
    # 2. Tenta obter do cookie padrão do mock (sb-mock-session)
    if not user_email_or_id:
        user_email_or_id = request.cookies.get("sb-mock-session")
        
    # 3. Tenta obter do cabeçalho de Autorização
    if not user_email_or_id:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            user_email_or_id = auth_header.split(" ")[1]
            
    if not user_email_or_id:
        return None

    # Se for mock, podemos buscar tanto por ID quanto por E-mail
    if SupabaseService.is_mock():
        # Busca no profile pelo email ou ID
        profiles = SupabaseService.get_all("profiles")[0] or []
        for p in profiles:
            if p["id"] == user_email_or_id or p["email"].lower() == user_email_or_id.lower():
                # Retorna o perfil completo carregado
                user_data, _ = SupabaseService.get_profile_by_id(p["id"])
                return user_data
    else:
        # Modo real do Supabase: assume que é o ID do usuário (UID)
        user_data, _ = SupabaseService.get_profile_by_id(user_email_or_id)
        return user_data
        
    return None

# Importar e registrar todos os módulos de rotas
from auth_routes import create_auth_routes
from atleta_routes import create_atleta_routes
from filial_routes import create_filial_routes
from cms_routes import create_cms_routes
from messages_routes import create_messages_routes
from ai_routes import create_ai_routes
from cert_routes import create_cert_routes
from notif_routes import create_notif_routes
from ranking_routes import create_ranking_routes
from exam_routes import create_exam_routes
from finance_routes import create_finance_routes
from event_routes import create_event_routes
from auditoria_routes import create_auditoria_routes
from estoque_routes import create_estoque_routes
from aviso_routes import create_aviso_routes
from relatorio_routes import create_relatorio_routes
from dojo_routes import create_dojo_routes
from fornecedor_routes import create_fornecedor_routes
from presenca_routes import create_presenca_routes
from notif_whatsapp_routes import create_whatsapp_routes
from documentos_assinados_routes import create_documentos_assinados_routes
from despesa_routes import create_despesa_routes
from upload_routes import create_upload_routes

# Registrar todas as rotas
create_auth_routes(app)
create_atleta_routes(app)
create_filial_routes(app)
create_cms_routes(app)
create_messages_routes(app)
create_ai_routes(app)
create_cert_routes(app)
create_notif_routes(app)
create_ranking_routes(app)
create_exam_routes(app)
create_finance_routes(app)
create_event_routes(app)
create_auditoria_routes(app)
create_estoque_routes(app)
create_aviso_routes(app)
create_relatorio_routes(app)
create_dojo_routes(app)
create_fornecedor_routes(app)
create_presenca_routes(app)
create_whatsapp_routes(app)
create_documentos_assinados_routes(app)
create_despesa_routes(app)
create_upload_routes(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "mock_mode": SupabaseService.is_mock(),
        "message": "API do Goju-Ryu Karate Kai está rodando com sucesso!"
    }), 200

@app.route("/api/debug-version", methods=["GET"])
def debug_version():
    import os
    # Tenta importar com segurança para não quebrar a rota se der import error
    try:
        from services.ai_service import has_gemini, has_gemini_sdk, GEMINI_API_KEY
    except Exception as e:
        has_gemini, has_gemini_sdk, GEMINI_API_KEY = False, False, f"Erro ao importar: {str(e)}"
        
    try:
        from services.email_service import EmailService
        smtp_conf = EmailService.is_configured()
    except Exception as e:
        smtp_conf = f"Erro ao importar EmailService: {str(e)}"

    app_dir = os.path.dirname(os.path.abspath(__file__))
    expected_env_path = os.path.join(app_dir, ".env")

    return jsonify({
        "version": "v1.0.5-diagnostico-caminhos",
        "has_gemini_sdk": has_gemini_sdk,
        "has_gemini_configured": has_gemini,
        "gemini_key_exists": bool(GEMINI_API_KEY and GEMINI_API_KEY.strip() != "" and "sua-chave" not in GEMINI_API_KEY),
        "gemini_key_length": len(GEMINI_API_KEY) if GEMINI_API_KEY else 0,
        "smtp_configured": smtp_conf,
        "smtp_server": os.environ.get("SMTP_SERVER"),
        "smtp_port": os.environ.get("SMTP_PORT"),
        "smtp_user": os.environ.get("SMTP_USER"),
        "current_working_dir": os.getcwd(),
        "app_file_path": os.path.abspath(__file__),
        "env_file_path": expected_env_path,
        "env_file_exists": os.path.exists(expected_env_path)
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_dev = os.environ.get("FLASK_ENV", "development") != "production"
    app.run(host="0.0.0.0", port=port, debug=is_dev)

ALLOWED_HOSTS = ['gojuryukaratekai.com.br']
