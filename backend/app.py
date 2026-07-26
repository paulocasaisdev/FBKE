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
env_path = os.path.join(app_dir, ".env")
load_dotenv(dotenv_path=env_path, override=True)

app = Flask(__name__)

# Configuração de chave secreta para segurança das sessões/cookies
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY") or "chave-secreta-grkk-dev-12345"

@app.after_request
def disable_api_caching(response):
    # Desativa cache para todas as rotas da API
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        response.headers["X-Accel-Expires"] = "0"
    return response

# --- CONFIGURAÇÃO DO CORS ---
# Monta a lista de origens autorizadas incluindo Vercel, produção e desenvolvimento
frontend_origins_env = os.environ.get("FRONTEND_ORIGINS") or os.environ.get("FRONTEND_URL")
origins = []

if frontend_origins_env:
    if "," in frontend_origins_env:
        origins.extend([o.strip() for o in frontend_origins_env.split(",") if o.strip()])
    else:
        origins.append(frontend_origins_env.strip())

# Origens fixas de Produção, Vercel e Desenvolvimento Local
default_origins = [
    "https://gojuryukaratekai.com.br",
    "https://fbke-frmb.vercel.app",
    r"https://fbke-frmb-.*\.vercel\.app",  # Regex para previews da Vercel
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173"
]

for orig in default_origins:
    if orig not in origins:
        origins.append(orig)

CORS(
    app,
    resources={r"/*": {"origins": origins}},
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cookie", "X-CSRF-Token"],
    expose_headers=["Content-Type", "Authorization", "Set-Cookie"],
    max_age=86400,
)

# Interceptador global para garantir respostas limpas no preflight (OPTIONS)
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers
        origin = request.headers.get('Origin')
        if origin:
            headers['Access-Control-Allow-Origin'] = origin
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Cookie, X-CSRF-Token'
        headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 200

# Garante que exceções 500 não quebrem o cabeçalho CORS no navegador
@app.errorhandler(Exception)
def handle_exception(e):
    response = jsonify({"error": str(e)})
    response.status_code = 500
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Helper para obter o usuário logado a partir dos cookies ou cabeçalhos
def get_current_user():
    user_email_or_id = request.cookies.get("session_user")
    
    if not user_email_or_id:
        user_email_or_id = request.cookies.get("sb-mock-session")
        
    if not user_email_or_id:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            user_email_or_id = auth_header.split(" ")[1]
            
    if not user_email_or_id:
        return None

    if SupabaseService.is_mock():
        profiles = SupabaseService.get_all("profiles")[0] or []
        for p in profiles:
            if p["id"] == user_email_or_id or p["email"].lower() == user_email_or_id.lower():
                user_data, _ = SupabaseService.get_profile_by_id(p["id"])
                return user_data
    else:
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
    try:
        from services.ai_service import has_gemini, has_gemini_sdk, GEMINI_API_KEY
    except Exception as e:
        has_gemini, has_gemini_sdk, GEMINI_API_KEY = False, False, f"Erro ao importar: {str(e)}"
        
    try:
        from services.email_service import EmailService
        smtp_conf = EmailService.is_configured()
    except Exception as e:
        smtp_conf = f"Erro ao importar EmailService: {str(e)}"

    expected_env_path = os.path.join(app_dir, ".env")

    return jsonify({
        "version": "v1.0.6-cors-vercel-fixed",
        "has_gemini_sdk": has_gemini_sdk,
        "has_gemini_configured": has_gemini,
        "gemini_key_exists": bool(GEMINI_API_KEY and GEMINI_API_KEY.strip() != "" and "sua-chave" not in GEMINI_API_KEY),
        "smtp_configured": smtp_conf,
        "current_working_dir": os.getcwd(),
        "app_file_path": os.path.abspath(__file__),
        "env_file_path": expected_env_path,
        "env_file_exists": os.path.exists(expected_env_path)
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_dev = os.environ.get("FLASK_ENV", "development") != "production"
    app.run(host="0.0.0.0", port=port, debug=is_dev)
