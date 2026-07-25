import os
import json
import requests
import uuid
from dotenv import load_dotenv

# Carrega as variáveis de ambiente
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or "sua-url" in SUPABASE_URL:
    print("Erro: Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env antes de rodar o script.")
    exit(1)

# Caminho do banco mock
MOCK_DB_PATH = os.path.join(os.path.dirname(__file__), "mock-db.json")

if not os.path.exists(MOCK_DB_PATH):
    print(f"Erro: Arquivo mock-db.json não encontrado no caminho: {MOCK_DB_PATH}")
    exit(1)

with open(MOCK_DB_PATH, "r", encoding="utf-8") as f:
    mock_data = json.load(f)

# Ordem de migração lógica para evitar problemas de Chave Estrangeira
TABELAS_ORDEM = [
    "profiles",
    "filiais",
    "atletas",
    "eventos",
    "eventos_inscricoes",
    "eventos_chaves",
    "exames",
    "candidatos_exame",
    "financeiro",
    "noticias",
    "team_members",
    "gallery_items",
    "logs_auditoria",
    "notifications",
    "contacts",
    "historico_pontos",
    "certificados",
    "cms_banners",
    "cms_config"
]

# Schema de colunas reais para filtrar campos mock indesejados
COLUNAS_VALIDAS = {
    "profiles": ["id", "nome", "email", "telefone", "tipo", "status", "avatar_url", "cidade", "nome_fantasia", "created_at", "updated_at"],
    "filiais": ["id", "nome", "email", "telefone", "status", "codigo_interno", "nome_fantasia", "tipo", "cpf_responsavel", "graduacao_responsavel", "registro_federativo", "cep", "rua", "numero", "bairro", "municipio", "estado", "motivo_reprovacao", "created_at", "updated_at"],
    "atletas": ["id", "email", "telefone", "status", "faixa", "filial_id", "filial_nome", "cpf", "sexo", "data_nascimento", "nome_professor", "endereco", "cidade", "uf", "responsavel_nome", "responsavel_cpf", "responsavel_email", "responsavel_telefone", "medico_alergias", "medico_plano", "medico_restricoes", "medico_diagnosticos", "pontos", "registro_federacao", "created_at", "updated_at"],
    "eventos": ["id", "titulo", "descricao", "data_inicio", "data_fim", "tipo", "imagem_url", "created_at", "updated_at"],
    "eventos_inscricoes": ["id", "evento_id", "atleta_id", "atleta_nome", "filial_id", "filial_nome", "categoria", "faixa", "idade", "pagamento_status", "status", "created_at"],
    "eventos_chaves": ["id", "evento_id", "modalidade", "brackets", "created_at", "updated_at"],
    "exames": ["id", "titulo", "descricao", "data_exame", "status", "local", "modalidade", "faixa_alvo", "taxa_valor", "created_at"],
    "candidatos_exame": ["id", "exame_id", "atleta_id", "atleta_nome", "filial_id", "filial_nome", "faixa_atual", "graduacao_pretendida", "status", "autorizacao_tecnica", "pagamento_status", "dados_banca", "created_at"],
    "financeiro": ["id", "atleta_id", "atleta_nome", "filial_id", "filial_nome", "tipo", "valor", "data_vencimento", "status", "created_at"],
    "noticias": ["id", "titulo", "subtitulo", "conteudo", "categoria", "imagem_url", "publicado", "autor_id", "created_at"],
    "team_members": ["id", "nome", "cargo", "biografia", "foto_url", "order", "created_at"],
    "gallery_items": ["id", "title", "category", "image_url", "order", "created_at"],
    "logs_auditoria": ["id", "usuario_id", "usuario_nome", "acao", "detalhes", "ip", "created_at"],
    "notifications": ["id", "destinatario_id", "titulo", "mensagem", "tipo", "lida", "created_at"],
    "contacts": ["id", "name", "email", "message", "phone", "read", "created_at"],
    "historico_pontos": ["id", "atleta_id", "tipo_evento", "descricao", "pontos", "data_pontuacao", "created_at"],
    "certificados": ["id", "atleta_id", "codigo_validacao", "data_emissao", "created_at"],
    "cms_banners": ["id", "titulo", "subtitulo", "link", "imagem_url", "created_at"],
    "cms_config": ["chave", "valor", "updated_at"]
}

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates" # Permite merge em duplicatas (UPSERT)
}

def migrar_tabela(tabela_name):
    registros = mock_data.get(tabela_name, [])
    if not registros:
        print(f"[-] Tabela '{tabela_name}' vazia ou não declarada no mock-db.json.")
        return

    colunas_permitidas = COLUNAS_VALIDAS.get(tabela_name)
    if not colunas_permitidas:
        print(f"[!] Erro: Colunas válidas não definidas para a tabela '{tabela_name}'.")
        return

    print(f"[*] Filtrando e homogeneizando registros para a tabela '{tabela_name}'...")
    
    dados_filtrados = []
    for r in registros:
        r_filtrado = {}
        for col in colunas_permitidas:
            if col in r:
                r_filtrado[col] = r[col]
            else:
                r_filtrado[col] = None
        
        # Garante a presença do ID para tabelas que utilizam ID
        if "id" in r_filtrado and r_filtrado["id"] is None:
            r_filtrado["id"] = str(uuid.uuid4())
            
        dados_filtrados.append(r_filtrado)

    print(f"[*] Migrando {len(dados_filtrados)} registros para a tabela '{tabela_name}'...")
    
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{tabela_name}"
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(dados_filtrados))
        if response.status_code in [200, 201, 204]:
            print(f"[+] Tabela '{tabela_name}' migrada com sucesso!")
        else:
            print(f"[!] Erro ao migrar '{tabela_name}': {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[!] Erro de conexão ao migrar '{tabela_name}': {e}")

if __name__ == "__main__":
    print("=== INICIANDO MIGRAÇÃO MOCK -> SUPABASE ===")
    print(f"Destino: {SUPABASE_URL}")
    print(f"Origem: {MOCK_DB_PATH}\n")
    
    for tab in TABELAS_ORDEM:
        migrar_tabela(tab)
        
    print("\n=== MIGRAÇÃO FINALIZADA ===")
