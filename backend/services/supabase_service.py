import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Resolve o caminho do .env de forma robusta e absoluta
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
# Prefer service role key for backend operations to bypass RLS, fallback to anon key
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

# Verifica se o Supabase está configurado com chaves válidas ou se usará o emulador mock em desenvolvimento
is_mock_mode = (
    not SUPABASE_URL 
    or not SUPABASE_KEY 
    or "sua-url" in SUPABASE_URL 
    or "seu-anon-key" in SUPABASE_KEY
    or "seu-token-anon-key" in SUPABASE_KEY
    or os.environ.get("ENABLE_MOCK") == "true"
    or os.environ.get("FORCE_MOCK") == "true"
)

# Força a desativação do modo mock em produção (FLASK_ENV=production) ou se DISABLE_MOCK=true, exceto se FORCE_MOCK for true
if (os.environ.get("DISABLE_MOCK") == "true" or os.environ.get("FLASK_ENV") == "production") and os.environ.get("FORCE_MOCK") != "true":
    is_mock_mode = False

supabase: Client = None
if not is_mock_mode:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Conectado ao Supabase oficial.")
    except Exception as e:
        print(f"Erro ao conectar ao Supabase oficial: {e}")
        # Em produção, falha explicitamente em vez de cair em modo mock silenciosamente
        if os.environ.get("FLASK_ENV") == "production":
            raise RuntimeError(f"Falha crítica de conexão com o Supabase em produção: {e}")
        is_mock_mode = True
else:
    print("Modo de emulação offline (Mock) ativado.")

# Caminho do arquivo mock-db.json
MOCK_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock-db.json")

def garantir_protecao_mock_db():
    """Garante que o arquivo mock-db.json não possa ser lido diretamente pelo Apache no servidor"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    htaccess_path = os.path.join(base_dir, ".htaccess")
    
    regra = (
        "\n# Bloqueia acesso publico ao mock-db.json para seguranca de dados\n"
        "<Files \"mock-db.json\">\n"
        "    <IfModule mod_authz_core.c>\n"
        "        Require all denied\n"
        "    </IfModule>\n"
        "    <IfModule !mod_authz_core.c>\n"
        "        Order Allow,Deny\n"
        "        Deny from all\n"
        "    </IfModule>\n"
        "</Files>\n"
    )
    
    try:
        if os.path.exists(htaccess_path):
            with open(htaccess_path, "r", encoding="utf-8") as f:
                content = f.read()
            if "mock-db.json" not in content:
                with open(htaccess_path, "a", encoding="utf-8") as f:
                    f.write(regra)
                print("Seguranca: Regra de protecao ao mock-db.json anexada ao .htaccess com sucesso.")
        else:
            with open(htaccess_path, "w", encoding="utf-8") as f:
                f.write(regra)
            print("Seguranca: Criado .htaccess com regra de protecao ao mock-db.json.")
    except Exception as e:
        print(f"Erro ao verificar/atualizar protecao do .htaccess: {e}")

# Executa o check de segurança na inicialização do módulo
garantir_protecao_mock_db()

class MockDb:
    def __init__(self):
        self.data = {}
        self.load()

    def load(self):
        if os.path.exists(MOCK_DB_PATH):
            try:
                with open(MOCK_DB_PATH, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception as e:
                print(f"Erro ao carregar banco de dados mock local: {e}")
                self.data = {}
        else:
            print(f"Aviso: mock-db.json não encontrado em {MOCK_DB_PATH}")
            self.data = {}

    def save(self):
        try:
            with open(MOCK_DB_PATH, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erro ao salvar banco de dados mock local: {e}")

mock_db = MockDb()

class SupabaseService:
    @staticmethod
    def is_mock():
        return is_mock_mode

    @staticmethod
    def get_all(table_name, order_by=None, ascending=True, filter_dict=None):
        """Busca todos os registros de uma tabela, com suporte a filtros e ordenação simples"""
        if is_mock_mode:
            items = mock_db.data.get(table_name, [])
            # Aplica filtros
            if filter_dict:
                filtered_items = []
                for item in items:
                    match = True
                    for k, v in filter_dict.items():
                        if str(item.get(k)).lower() != str(v).lower():
                            match = False
                            break
                    if match:
                        filtered_items.append(item)
                items = filtered_items

            # Resolve joins nos mocks
            items = json.loads(json.dumps(items))  # Clone para evitar mutação direta
            for item in items:
                if table_name == "noticias" and "autor_id" in item:
                    profiles = mock_db.data.get("profiles", [])
                    for p in profiles:
                        if p["id"] == item["autor_id"]:
                            item["profiles"] = {"nome": p.get("nome"), "avatar_url": p.get("avatar_url")}
                            break

            # Aplica ordenação
            if order_by:
                items.sort(key=lambda x: x.get(order_by, ""), reverse=not ascending)
            return items, None
        else:
            try:
                SELECT_QUERIES = {
                    "noticias": "*, profiles(nome, avatar_url)",
                }
                select_query = SELECT_QUERIES.get(table_name, "*")

                try:
                    query = supabase.table(table_name).select(select_query)
                    if filter_dict:
                        for k, v in filter_dict.items():
                            query = query.eq(k, v)
                    if order_by:
                        query = query.order(order_by, desc=not ascending)
                    res = query.execute()
                    if res and res.data is not None:
                        return res.data, None
                except Exception as inner_e:
                    print(f"Aviso: Falha ao executar select com query '{select_query}' em '{table_name}': {inner_e}. Tentando select('*')...")

                # Fallback seguro com select("*")
                query = supabase.table(table_name).select("*")
                if filter_dict:
                    for k, v in filter_dict.items():
                        query = query.eq(k, v)
                if order_by:
                    query = query.order(order_by, desc=not ascending)
                res = query.execute()
                return (res.data if res else []), None
            except Exception as e:
                print(f"Erro em get_all para tabela '{table_name}': {e}")
                return [], str(e)

    @staticmethod
    def insert(table_name, item):
        """Insere um novo item na tabela correspondente"""
        if "id" not in item:
            item["id"] = str(uuid.uuid4())
            
        if is_mock_mode:
            items = mock_db.data.setdefault(table_name, [])
            item["created_at"] = datetime.utcnow().isoformat()
            items.append(item)
            mock_db.save()
            return item, None
        else:
            try:
                res = supabase.table(table_name).insert(item).execute()
                if res is None:
                    return None, "Supabase retornou resposta nula ao inserir em '{}'.".format(table_name)
                return res.data[0] if res.data else None, None
            except Exception as e:
                return None, str(e)

    @staticmethod
    def update(table_name, item_id, update_data):
        """Atualiza um item existente na tabela pelo ID"""
        if is_mock_mode:
            items = mock_db.data.get(table_name, [])
            for item in items:
                if str(item.get("id")) == str(item_id):
                    item.update(update_data)
                    mock_db.save()
                    return item, None
            return None, "Item não encontrado."
        else:
            try:
                res = supabase.table(table_name).update(update_data).eq("id", item_id).execute()
                if res is None:
                    return None, "Supabase retornou resposta nula ao atualizar '{}' id={}".format(table_name, item_id)
                return res.data[0] if res.data else None, None
            except Exception as e:
                return None, str(e)

    @staticmethod
    def delete(table_name, item_id):
        """Remove um item existente na tabela pelo ID"""
        if is_mock_mode:
            items = mock_db.data.get(table_name, [])
            filtered_items = [item for item in items if str(item.get("id")) != str(item_id)]
            if len(filtered_items) < len(items):
                mock_db.data[table_name] = filtered_items
                mock_db.save()
                return {"sucesso": True}, None
            return None, "Item não encontrado."
        else:
            try:
                res = supabase.table(table_name).delete().eq("id", item_id).execute()
                return {"sucesso": True}, None
            except Exception as e:
                return None, str(e)

    @staticmethod
    def login(email, password=None):
        """Verifica a existência do perfil para fins de login na fase 1"""
        resolved_email = email
        
        # Se o identificador não contém '@', assumimos que seja telefone e tentamos resolver para email
        if email and "@" not in email:
            input_digits = "".join(filter(str.isdigit, email))
            if input_digits:
                if is_mock_mode:
                    profiles = mock_db.data.get("profiles", [])
                    for p in profiles:
                        p_tel = "".join(filter(str.isdigit, p.get("telefone", "")))
                        if p_tel and p_tel == input_digits:
                            resolved_email = p.get("email", email)
                            break
                else:
                    try:
                        # Busca correspondência exata de telefone no banco primeiro
                        prof_res = supabase.table("profiles").select("email").eq("telefone", email).execute()
                        if prof_res.data:
                            resolved_email = prof_res.data[0]["email"]
                        else:
                            # Se não achar por correspondência exata, busca todos os profiles para filtrar por dígitos limpos
                            all_profs = supabase.table("profiles").select("email", "telefone").execute()
                            if all_profs.data:
                                for row in all_profs.data:
                                    row_tel = row.get("telefone")
                                    if row_tel:
                                        row_digits = "".join(filter(str.isdigit, str(row_tel)))
                                        if row_digits and row_digits == input_digits:
                                            resolved_email = row.get("email")
                                            break
                    except Exception as e:
                        print(f"Erro ao buscar email por telefone no Supabase: {e}")

        return resolved_email

class MockDb:
    def __init__(self):
        self.data = {}
        self.load()

    def load(self):
        if os.path.exists(MOCK_DB_PATH):
            try:
                with open(MOCK_DB_PATH, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception as e:
                print(f"Erro ao carregar banco de dados mock local: {e}")
                self.data = {}
        else:
            print(f"Aviso: mock-db.json não encontrado em {MOCK_DB_PATH}")
            self.data = {}

    def save(self):
        try:
            with open(MOCK_DB_PATH, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erro ao salvar banco de dados mock local: {e}")

mock_db = MockDb()

class SupabaseService:
    @staticmethod
    def is_mock():
        return is_mock_mode

    @staticmethod
    def get_all(table_name, order_by=None, ascending=True, filter_dict=None):
        """Busca todos os registros de uma tabela, com suporte a filtros e ordenação simples"""
        if is_mock_mode:
            items = mock_db.data.get(table_name, [])
            # Aplica filtros
            if filter_dict:
                filtered_items = []
                for item in items:
                    match = True
                    for k, v in filter_dict.items():
                        if str(item.get(k)).lower() != str(v).lower():
                            match = False
                            break
                    if match:
                        filtered_items.append(item)
                items = filtered_items

            # Resolve joins nos mocks
            items = json.loads(json.dumps(items))  # Clone para evitar mutação direta
            for item in items:
                if table_name == "noticias" and "autor_id" in item:
                    profiles = mock_db.data.get("profiles", [])
                    for p in profiles:
                        if p["id"] == item["autor_id"]:
                            item["profiles"] = {"nome": p.get("nome"), "avatar_url": p.get("avatar_url")}
                            break

            # Aplica ordenação
            if order_by:
                items.sort(key=lambda x: x.get(order_by, ""), reverse=not ascending)
            return items, None
        else:
            try:
                SELECT_QUERIES = {
                    "noticias": "*, profiles(nome, avatar_url)",
                }
                select_query = SELECT_QUERIES.get(table_name, "*")

                try:
                    query = supabase.table(table_name).select(select_query)
                    if filter_dict:
                        for k, v in filter_dict.items():
                            query = query.eq(k, v)
                    if order_by:
                        query = query.order(order_by, desc=not ascending)
                    res = query.execute()
                    if res and res.data is not None:
                        return res.data, None
                except Exception as inner_e:
                    print(f"Aviso: Falha ao executar select com query '{select_query}' em '{table_name}': {inner_e}. Tentando select('*')...")

                # Fallback seguro com select("*")
                query = supabase.table(table_name).select("*")
                if filter_dict:
                    for k, v in filter_dict.items():
                        query = query.eq(k, v)
                if order_by:
                    query = query.order(order_by, desc=not ascending)
                res = query.execute()
                return (res.data if res else []), None
            except Exception as e:
                print(f"Erro em get_all para tabela '{table_name}': {e}")
                return [], str(e)

    @staticmethod
    def insert(table_name, item):
        """Insere um novo item na tabela correspondente"""
        if "id" not in item:
            item["id"] = str(uuid.uuid4())
            
        if is_mock_mode:
            items = mock_db.data.setdefault(table_name, [])
            item["created_at"] = datetime.utcnow().isoformat()
            items.append(item)
            mock_db.save()
            return item, None
        else:
            try:
                res = supabase.table(table_name).insert(item).execute()
                if res is None:
                    return None, "Supabase retornou resposta nula ao inserir em '{}'.".format(table_name)
                return res.data[0] if res.data else None, None
            except Exception as e:
                return None, str(e)

    @staticmethod
    def update(table_name, item_id, update_data):
        """Atualiza um item existente na tabela pelo ID"""
        if is_mock_mode:
            items = mock_db.data.get(table_name, [])
            for item in items:
                if str(item.get("id")) == str(item_id):
                    item.update(update_data)
                    mock_db.save()
                    return item, None
            return None, "Item não encontrado."
        else:
            try:
                res = supabase.table(table_name).update(update_data).eq("id", item_id).execute()
                if res is None:
                    return None, "Supabase retornou resposta nula ao atualizar '{}' id={}".format(table_name, item_id)
                return res.data[0] if res.data else None, None
            except Exception as e:
                return None, str(e)

    @staticmethod
    def delete(table_name, item_id):
        """Remove um item existente na tabela pelo ID"""
        if is_mock_mode:
            items = mock_db.data.get(table_name, [])
            filtered_items = [item for item in items if str(item.get("id")) != str(item_id)]
            if len(filtered_items) < len(items):
                mock_db.data[table_name] = filtered_items
                mock_db.save()
                return {"sucesso": True}, None
            return None, "Item não encontrado."
        else:
            try:
                res = supabase.table(table_name).delete().eq("id", item_id).execute()
                return {"sucesso": True}, None
            except Exception as e:
                return None, str(e)


    @staticmethod
    def login(email, password=None):
        """Verifica a existência do perfil para fins de login na fase 1"""
        resolved_email = email
        
        # Se o identificador não contém '@', assumimos que seja telefone e tentamos resolver para email
        if email and "@" not in email:
            input_digits = "".join(filter(str.isdigit, email))
            if input_digits:
                if is_mock_mode:
                    profiles = mock_db.data.get("profiles", [])
                    for p in profiles:
                        p_tel = "".join(filter(str.isdigit, p.get("telefone", "")))
                        if p_tel and p_tel == input_digits:
                            resolved_email = p.get("email", email)
                            break
                else:
                    try:
                        # Busca correspondência exata de telefone no banco primeiro
                        prof_res = supabase.table("profiles").select("email").eq("telefone", email).execute()
                        if prof_res.data:
                            resolved_email = prof_res.data[0]["email"]
                        else:
                            # Se não achar por correspondência exata, busca todos os profiles para filtrar por dígitos limpos
                            all_profs = supabase.table("profiles").select("email", "telefone").execute()
                            if all_profs.data:
                                for row in all_profs.data:
                                    row_tel = row.get("telefone")
                                    if row_tel:
                                        row_digits = "".join(filter(str.isdigit, row_tel))
                                        if row_digits and row_digits == input_digits:
                                            resolved_email = row["email"]
                                            break
                    except Exception as lookup_err:
                        print(f"Erro ao buscar email por telefone no login: {lookup_err}")

        if is_mock_mode:
            profiles = mock_db.data.get("profiles", [])
            for p in profiles:
                if p.get("email", "").lower() == resolved_email.lower():
                    user_data = dict(p)
                    return SupabaseService._enriquecer_perfil_unificado(user_data, p["id"]), None
            return None, "Usuário não encontrado."
        else:
            try:
                anon_key = os.environ.get("SUPABASE_ANON_KEY") or SUPABASE_KEY
                temp_supabase = create_client(SUPABASE_URL, anon_key)
                res = temp_supabase.auth.sign_in_with_password({"email": resolved_email, "password": password})
                if not res or not res.user:
                    return None, "Credenciais inválidas."

                profile_res = supabase.table("profiles").select("*").eq("id", res.user.id).maybe_single().execute()
                if not profile_res or not profile_res.data:
                    return None, "Perfil não encontrado no banco."

                user_data = dict(profile_res.data)
                user_data = SupabaseService._enriquecer_perfil_unificado(user_data, res.user.id)
                return user_data, None
            except Exception as e:
                return None, str(e)

    @staticmethod
    def _enriquecer_perfil_unificado(user_data, user_id):
        """Utilitário para verificar se o Responsável de Filial é também Atleta (ou vice-versa) por ID, Email ou CPF"""
        if not user_data:
            return user_data

        u_type = user_data.get("tipo")
        user_email = user_data.get("email")
        cpf_resp = user_data.get("cpf_responsavel") or user_data.get("cnpj_cpf") or user_data.get("cpf")

        if is_mock_mode:
            if u_type == "filial":
                filiais = mock_db.data.get("filiais", [])
                filial_match = next((f for f in filiais if str(f.get("id")) == str(user_id)), None)
                if filial_match:
                    f_data = dict(filial_match)
                    if "tipo" in f_data:
                        f_data["tipo_filial"] = f_data.pop("tipo")
                    user_data.update(f_data)

                atletas = mock_db.data.get("atletas", [])
                atleta_match = next((a for a in atletas if str(a.get("id")) == str(user_id)), None)
                if not atleta_match and user_email:
                    atleta_match = next((a for a in atletas if a.get("email") == user_email), None)

                user_data["tambem_atleta"] = True
                user_data["dados_atleta"] = atleta_match or {
                    "id": user_id,
                    "nome": user_data.get("nome"),
                    "email": user_email,
                    "cpf": cpf_resp,
                    "status": "ativo",
                    "faixa": user_data.get("graduacao_responsavel") or "Preta 1º Dan"
                }

            elif u_type == "atleta":
                atletas = mock_db.data.get("atletas", [])
                atl_match = next((a for a in atletas if str(a.get("id")) == str(user_id)), None)
                if atl_match:
                    user_data.update(atl_match)

                filiais = mock_db.data.get("filiais", [])
                filial_match = next((f for f in filiais if str(f.get("id")) == str(user_id)), None)
                if not filial_match and user_email:
                    filial_match = next((f for f in filiais if f.get("email") == user_email), None)

                if filial_match or user_data.get("tambem_filial") or user_data.get("tambem_atleta"):
                    user_data["tambem_atleta"] = True
                    user_data["dados_atleta"] = dict(user_data)
                    if filial_match:
                        f_data = dict(filial_match)
                        if "tipo" in f_data:
                            f_data["tipo_filial"] = f_data.pop("tipo")
                        user_data.update(f_data)
            return user_data

        # Modo Supabase Real
        try:
            if u_type == "filial":
                filial_res = supabase.table("filiais").select("*").eq("id", user_id).maybe_single().execute()
                if filial_res and filial_res.data:
                    f_data = dict(filial_res.data)
                    if "tipo" in f_data:
                        f_data["tipo_filial"] = f_data.pop("tipo")
                    user_data.update(f_data)
                    user_data["tipo"] = "filial"

                # 1. Tenta buscar atleta por ID
                atleta_match = None
                atl_res = supabase.table("atletas").select("*").eq("id", user_id).maybe_single().execute()
                if atl_res and atl_res.data:
                    atleta_match = dict(atl_res.data)

                # 2. Tenta buscar atleta por email
                if not atleta_match and user_email:
                    atl_res_email = supabase.table("atletas").select("*").eq("email", user_email).maybe_single().execute()
                    if atl_res_email and atl_res_email.data:
                        atleta_match = dict(atl_res_email.data)

                # 3. Tenta buscar atleta por CPF do responsável
                if not atleta_match and cpf_resp:
                    clean_cpf = "".join(filter(str.isdigit, str(cpf_resp)))
                    if clean_cpf:
                        all_atls, _ = SupabaseService.get_all("atletas")
                        for a in (all_atls or []):
                            a_cpf = "".join(filter(str.isdigit, str(a.get("cpf") or "")))
                            if a_cpf and a_cpf == clean_cpf:
                                atleta_match = dict(a)
                                break

                # Filiais tem por padrão perfil de atleta habilitado (Professor/Responsável)
                user_data["tambem_atleta"] = True
                user_data["dados_atleta"] = atleta_match or {
                    "id": user_id,
                    "nome": user_data.get("nome"),
                    "email": user_email,
                    "cpf": cpf_resp,
                    "status": "ativo",
                    "faixa": user_data.get("graduacao_responsavel") or "Preta 1º Dan"
                }
                if atleta_match and "autoriza_uso_imagem" in atleta_match:
                    user_data["autoriza_uso_imagem"] = atleta_match["autoriza_uso_imagem"]

            elif u_type == "atleta":
                atl_res = supabase.table("atletas").select("*").eq("id", user_id).maybe_single().execute()
                if atl_res and atl_res.data:
                    user_data.update(atl_res.data)

                # Verifica se atleta é responsável por filial
                filial_match = None
                fil_res = supabase.table("filiais").select("*").eq("id", user_id).maybe_single().execute()
                if fil_res and fil_res.data:
                    filial_match = dict(fil_res.data)

                if not filial_match and user_email:
                    fil_res_email = supabase.table("filiais").select("*").eq("email", user_email).maybe_single().execute()
                    if fil_res_email and fil_res_email.data:
                        filial_match = dict(fil_res_email.data)

                if filial_match or user_data.get("tambem_filial") or user_data.get("tambem_atleta"):
                    user_data["tambem_atleta"] = True
                    user_data["dados_atleta"] = dict(user_data)
                    if filial_match:
                        f_data = dict(filial_match)
                        if "tipo" in f_data:
                            f_data["tipo_filial"] = f_data.pop("tipo")
                        user_data.update(f_data)

        except Exception as err:
            print(f"Erro em _enriquecer_perfil_unificado: {err}")

        return user_data

    @staticmethod
    def get_profile_by_id(user_id):
        """Recupera o perfil correspondente ao ID"""
        if is_mock_mode:
            profiles = mock_db.data.get("profiles", [])
            for p in profiles:
                if str(p.get("id")) == str(user_id):
                    user_data = dict(p)
                    return SupabaseService._enriquecer_perfil_unificado(user_data, user_id), None
            return None, "Perfil não encontrado."
        else:
            try:
                profile_res = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
                if not profile_res or not profile_res.data:
                    return None, "Perfil não encontrado."

                user_data = dict(profile_res.data)
                user_data = SupabaseService._enriquecer_perfil_unificado(user_data, user_id)
                return user_data, None
            except Exception as e:
                return None, str(e)
