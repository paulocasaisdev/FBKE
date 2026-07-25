import uuid
import os
from datetime import datetime
from flask import request
from services.supabase_service import SupabaseService

def registrar_log_auditoria(usuario, acao, detalhes):
    """
    Registra um log de auditoria no banco de dados.
    Se usuario for None, tenta obter o usuário logado de forma dinâmica para evitar importações circulares.
    """
    try:
        if not usuario:
            from app import get_current_user
            usuario = get_current_user()
            
        usuario_id = usuario.get("id") if usuario else None
        usuario_nome = usuario.get("nome", "Sistema") if usuario else "Sistema"
        
        ip = "127.0.0.1"
        if request:
            # Tenta obter X-Forwarded-For se o servidor estiver rodando atrás de um proxy reversor
            forwarded = request.headers.getlist("X-Forwarded-For")
            if forwarded:
                ip = forwarded[0]
            else:
                ip = request.remote_addr or "127.0.0.1"
                
        audit_log = {
            "id": str(uuid.uuid4()),
            "usuario_id": usuario_id,
            "usuario_nome": usuario_nome,
            "acao": acao,
            "detalhes": detalhes,
            "ip": ip,
            "created_at": datetime.utcnow().isoformat()
        }
        
        res, error = SupabaseService.insert("logs_auditoria", audit_log)
        if error:
            raise RuntimeError(f"Erro do Supabase: {error}")
            
        print(f"AUDIT LOG: {acao} - {detalhes} (User: {usuario_nome}, IP: {ip})")
    except Exception as e:
        err_msg = f"[{datetime.now().isoformat()}] Erro ao registrar log de auditoria ({acao} - {detalhes}): {str(e)}\n"
        print(err_msg, end="")
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            log_path = os.path.join(base_dir, "audit_errors.log")
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(err_msg)
        except Exception as file_err:
            print(f"Erro ao salvar em audit_errors.log: {file_err}")
