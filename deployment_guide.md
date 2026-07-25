# Guia de Implantação - Goju-Ryu Karate Kai (GRKK) na Hostgator

Este guia detalha o processo passo a passo para implantar o frontend (**Next.js**) e o backend (**Flask**) do projeto GRKK no ambiente de hospedagem cPanel da Hostgator.

---

## 📋 Visão Geral da Arquitetura de Produção

* **Frontend:** Servido como site estático exportado (`out/`) no domínio principal: `https://gojuryukaratekai.com.br`
* **Backend (API):** Servidor Flask gerenciado pelo Phusion Passenger (WSGI) no subdomínio: `https://api.gojuryukaratekai.com.br`
* **Banco de Dados:** Supabase (PostgreSQL na nuvem).

---

## 🌐 1. Implantação do Frontend (Next.js)

O frontend está configurado para exportação estática (`output: 'export'`) em produção, o que significa que o Next.js gera páginas HTML/JS/CSS puras. Isso garante excelente velocidade e compatibilidade com servidores Apache clássicos da Hostgator.

### Passo 1.1: Gerar o Build Localmente
1. No seu computador, abra o terminal na pasta do frontend:
   ```bash
   cd frontend
   ```
2. Execute o comando de build:
   ```bash
   npm run build
   ```
3. Esse comando criará uma pasta chamada `out` dentro do diretório `frontend`. Ela contém todos os arquivos estáticos compilados do seu site.

### Passo 1.2: Compactar e Enviar os Arquivos
1. Compacte o conteúdo interno da pasta `frontend/out` em um arquivo `.zip` (ex: `frontend.zip`). 
   > [!IMPORTANT]
   > Compacte os *arquivos internos* da pasta `out`, e não a pasta `out` em si, para que o arquivo `index.html` fique na raiz do ZIP.
2. Acesse o **Gerenciador de Arquivos** do cPanel da Hostgator.
3. Vá até a pasta raiz do seu domínio principal (geralmente `public_html`).
4. Faça o upload do `frontend.zip` e extraia os arquivos lá dentro.

### Passo 1.3: Tratamento de Rotas no Apache (`.htaccess`)
Como configuramos `trailingSlash: true` no `next.config.ts`, as rotas do Next.js são exportadas como diretórios físicos com arquivos `index.html` (ex: `/auth/cadastro-filial/index.html`). Isso resolve o problema de links diretos no Apache sem necessidade de regras complexas de reescrita!

---

## 🐍 2. Implantação do Backend (Flask)

O backend é executado utilizando o motor **Phusion Passenger** disponibilizado no painel **Setup Python App** da Hostgator.

### Passo 2.1: Preparar e Upload do Backend
1. Nós compactamos o backend no arquivo `backend.zip` na raiz do projeto (excluindo pastas desnecessárias como ambientes virtuais `.venv` locais).
2. Pelo **Gerenciador de Arquivos** do cPanel, crie uma pasta para guardar os arquivos da API (ex: `/home1/b403bf81/GRKK/backend` ou diretamente fora do `public_html` para segurança).
3. Faça o upload de `backend.zip` para essa pasta e extraia o conteúdo.

### Passo 2.2: Configurar o Aplicativo Python no cPanel
1. Acesse o cPanel e clique em **Setup Python App**.
2. Clique em **Create Application**.
3. Preencha os campos exatamente assim:
   * **Python version:** `3.10` (ou superior)
   * **Application root:** O caminho da pasta onde extraiu o backend (ex: `GRKK/backend`)
   * **Application URL:** Selecione `api.gojuryukaratekai.com.br`
   * **Application startup file:** `passenger_wsgi.py`
   * **Application Entry point:** `application`
4. Clique em **Create**.

### Passo 2.3: Instalar as Dependências pelo Putty (SSH)
1. No topo da tela da aplicação que você acabou de criar no cPanel, haverá um texto informando como entrar no ambiente virtual. Exemplo:
   ```bash
   source /home1/b403bf81/virtualenv/GRKK/backend/3.10/bin/activate
   ```
2. Abra o **Putty**, conecte-se ao SSH da sua conta Hostgator.
3. Cole e execute o comando copiado para ativar o ambiente virtual (o terminal mostrará o nome do ambiente na linha de comando).
4. Navegue até a pasta do backend:
   ```bash
   cd GRKK/backend
   ```
5. Instale as dependências da aplicação rodando:
   ```bash
   pip install -r requirements.txt
   ```

### Passo 2.4: Configurar Variáveis de Ambiente no cPanel
Na página de gerenciamento do aplicativo no **Setup Python App**, role até a seção **Environment variables** e adicione as seguintes chaves com os valores correspondentes de produção:

| Variável | Valor Recomendado | Descrição |
| :--- | :--- | :--- |
| `SUPABASE_URL` | *Sua URL do Supabase* | Link de conexão com o banco de dados real. |
| `SUPABASE_KEY` | *Sua Service Key ou Anon Key* | Chave de autenticação do Supabase. |
| `FRONTEND_ORIGINS` | `https://gojuryukaratekai.com.br` | Domínio do frontend para permissões CORS. |
| `GEMINI_API_KEY` | *Sua chave de API Gemini* | Usado pelas rotas de chat com o Sensei IA. |
| `SECRET_KEY` | *Sua chave secreta aleatória* | Chave para assinar sessões/cookies seguros. |
| `FLASK_ENV` | `production` | Define o Flask para rodar em modo produção. |

### Passo 2.5: Reiniciar e Validar o Backend
1. Clique no botão **Restart** no painel do cPanel.
2. Abra o navegador e acesse a URL de saúde da API:
   ```text
   https://api.gojuryukaratekai.com.br/api/health
   ```
3. Se estiver funcionando, você verá um retorno em formato JSON parecido com este:
   ```json
   {
     "status": "healthy",
     "mock_mode": false,
     "message": "API do Goju-Ryu Karate Kai está rodando com sucesso!"
   }
   ```

---

## 🛠️ 3. Resolução de Problemas Comuns (Troubleshooting)

### ⚠️ Erro CORS no Navegador
* **Sintoma:** O frontend não consegue falar com o backend e exibe erros de política de CORS no console.
* **Causa:** O backend Flask não retornou os cabeçalhos corretos, ou ocorreu um crash interno no Flask que retornou a página de erro padrão do Apache (que não tem os cabeçalhos de CORS).
* **Solução:** 
  1. Certifique-se de que a variável de ambiente `FRONTEND_ORIGINS` no cPanel está definida como exatamente `https://gojuryukaratekai.com.br` (sem barra no final e com `https://`).
  2. Verifique se o Flask não crashou acessando `https://api.gojuryukaratekai.com.br/api/health`.

### ⚠️ Erro 503 Service Unavailable / Erro do Passenger
* **Sintoma:** O subdomínio da API exibe uma página de erro do Phusion Passenger.
* **Causa:** Erro de sintaxe nos scripts Python, módulos faltando (não instalados no virtualenv) ou problema de importação no `passenger_wsgi.py`.
* **Solução:** 
  1. Acesse o Putty, ative o virtualenv e tente rodar o app manualmente para ver se há erros de importação:
     ```bash
     python app.py
     ```
  2. Verifique o arquivo de logs criado pela Hostgator na pasta raiz da aplicação (geralmente `stderr.log` ou logs do Apache no cPanel).
  3. Verifique se todas as dependências do `requirements.txt` foram instaladas corretamente executando `pip list`.
