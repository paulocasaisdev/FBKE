import time
from collections import defaultdict
from flask import request, jsonify, current_app
from functools import wraps

# Armazenamento em memória para as requisições: {ip_route_key: [timestamps]}
_rate_limit_store = defaultdict(list)

def limit_rate(requests_limit=5, window_seconds=60):
    """
    Decorator simples e ultra leve para rate limiting baseado em IP e rota.
    Não possui dependências externas de pacotes adicionais, prevenindo falhas de compilação/deploy.
    Retorna HTTP 429 se exceder o limite.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Ignora rate limit durante testes automatizados
            if current_app and current_app.testing:
                return f(*args, **kwargs)

            # Obtém o IP real do cliente (considerando proxies ou Cloudflare)
            ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
            if "," in ip:
                ip = ip.split(",")[0].strip()
                
            # Combina IP e rota para limites independentes por endpoint
            route = request.path
            key = f"{ip}:{route}"
            
            now = time.time()
            
            # Limpa timestamps que já expiraram fora da janela temporal
            _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window_seconds]
            
            # Verifica se ultrapassou o limite máximo de requisições
            if len(_rate_limit_store[key]) >= requests_limit:
                retry_after = int(window_seconds - (now - _rate_limit_store[key][0]))
                return jsonify({
                    "error": f"Muitas requisições. Por favor, aguarde {retry_after} segundos antes de tentar novamente.",
                    "retry_after": retry_after
                }), 429
                
            # Registra o timestamp da tentativa atual
            _rate_limit_store[key].append(now)
            
            return f(*args, **kwargs)
        return wrapped
    return decorator
