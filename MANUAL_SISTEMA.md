# Manual do Sistema e Arquitetura - Portal GRKK

Este manual documenta a arquitetura técnica, as políticas de segurança, os fluxos de integração e as diretrizes de desenvolvimento para o ecossistema do Portal GRKK.

---

## 🏛️ 1. Visão Geral da Arquitetura

O sistema é dividido em três camadas desacopladas:

```
[ Frontend: Next.js (Estático) ]
          │ (Requisições HTTPS / CORS)
          ▼
[ Backend: Flask API (WSGI Passenger) ]
          │ (PostgreSQL Driver / JSON Mock)
          ▼
[ Banco de Dados: Supabase Oficial (Nuvem) ] ◄──► [ Fallback: mock-db.json local ]
```

1. **Frontend**: Aplicação Next.js de página única exportada estaticamente (`out/`) para compatibilidade com o servidor Apache da HostGator.
2. **Backend**: API Restful desenvolvida em Flask, modularizada em rotas específicas e servida via Phusion Passenger (WSGI) no subdomínio da API.
3. **Persistência**: Banco de dados PostgreSQL gerenciado pelo Supabase. O backend conta com um mecanismo automático de fallback para um arquivo local `mock-db.json` caso as chaves do Supabase estejam ausentes ou incorretas (útil para desenvolvimento local offline).

---

## 💻 2. Frontend (Next.js)

### Estrutura de Diretórios
* `src/app/`: Roteador do Next.js (App Router). As páginas do painel estão agrupadas em `(dashboard)` para compartilhar layouts comuns de navegação lateral.
* `src/components/`: Componentes visuais da interface (ex: Sidebar, Topbar, DojoKun).
* `src/context/`: Contexto global de autenticação (`AuthContext.tsx`), que armazena os dados do usuário logado e gerencia a persistência de tokens/cookies.
* `public/`: Assets estáticos (imagens, arquivos verificadores).

### Configuração de Build
O arquivo `next.config.ts` está configurado da seguinte forma para produção:
```typescript
const nextConfig: NextConfig = {
  output: "export",        // Exporta páginas estáticas puras (HTML/JS/CSS)
  trailingSlash: true,     // Cria pastas físicas por rota (ex: /auth/cadastro-filial/index.html)
  images: {
    unoptimized: true,     // Desativa otimização dinâmica incompatível com exportação estática
  },
};
```

---

## 🐍 3. Backend (Flask API)

O backend possui uma arquitetura modularizada para facilitar a manutenção e testes. O arquivo principal `app.py` apenas inicializa o Flask, configura CORS, desativa cache da API e registra as rotas.

### Módulos de Rotas
As rotas da API estão organizadas em arquivos isolados na raiz do backend:
* `auth_routes.py`: Gerencia fluxo de Login, Logout e validação de sessão.
* `atleta_routes.py` & `filial_routes.py`: Cadastro e dados cadastrais.
* `cms_routes.py` & `team_gallery_routes.py`: Endpoints de CRUD das notícias, eventos, galeria e glossário.
* `ai_routes.py`: Envio de mensagens ao Sensei IA.
* `exam_routes.py`: Agendamento de exames, inscrição de candidatos e atribuição de notas.
* `finance_routes.py`: Emissão e baixa de faturas.
* `auditoria_routes.py`: Leitura de logs de segurança (acessível apenas para administradores).

### Banco de Dados (`supabase_service.py`)
Encapsula todas as operações de banco de dados (Select, Insert, Update, Delete, Auth). 
* **Mecanismo Híbrido**: A classe `SupabaseService` expõe os mesmos métodos estáticos independente do banco em uso. Se a variável `SUPABASE_ANON_KEY` não for configurada, o sistema ativa silenciosamente a classe `MockDb` que realiza leitura e escrita local no arquivo `mock-db.json` com persistência assíncrona.
* Em ambiente de produção (`FLASK_ENV=production`), a emulação mock é desativada obrigatoriamente e o backend lançará um erro fatal no startup se a conexão com o Supabase falhar.

---

## 🤖 4. Serviço do Sensei IA (`ai_service.py`)

O assistente virtual utiliza a API do modelo **Gemini 2.5 Flash** do Google, configurado para fornecer respostas **sempre curtas, diretas e objetivas** (máximo de 2 a 3 parágrafos).

### Mecanismo de Funcionamento
1. **Sanitização de Entrada**: Ao receber uma pergunta em `/api/ia-chat`, o backend analisa localmente a mensagem contra tentativas de *Prompt Injection* (Jailbreak), respondendo imediatamente com alertas de disciplina caso detecte um ataque.
2. **Enriquecimento por Contexto**: Pesquisa no arquivo local `glossary_pt.json` por correspondências de termos para anexar as definições oficiais ao prompt.
3. **Requisição Online (Gemini 2.5 Flash)**: Se a chave `GEMINI_API_KEY` estiver ativa no `.env`, a requisição é feita utilizando instruções de sistema blindadas (focadas em manter o papel do Sensei Virtual da GRKK e exigir respostas curtas).
4. **Aprendizado Contínuo e Cache Offline**: Para cada consulta de até 500 caracteres respondida com sucesso online, a pergunta (chave limpa) e a resposta da IA são gravadas automaticamente no arquivo `glossary_pt.json` local.
5. **Mecanismo de Fallback Offline**: Caso a API esteja inacessível (ex: falta de cota ou sem internet), o motor offline lê o `glossary_pt.json` (que inclui todos os novos conhecimentos aprendidos dinamicamente) para responder o usuário de forma imediata.

---

## 🔒 5. Segurança e Auditoria

### Proteção contra Força Bruta (Rate Limiting)
Para proteger o servidor contra ataques automatizados de força bruta e economizar cota de processamento, a API implementa um limitador de requisições nativo em memória (`limiter_service.py`) aplicado nas seguintes rotas críticas:
* **Rota de Login (`/api/auth/login`)**: Limite de no máximo **5 tentativas por minuto** por IP.
* **Chat do Sensei IA (`/api/ia-chat`)**: Limite de no máximo **10 interações por minuto** por IP.
Requisições excedentes são bloqueadas temporariamente e respondidas com o código HTTP `429 Too Many Requests`.

### Segurança contra IDOR (Insecure Direct Object Reference)
As rotas sensíveis como as de pagamentos (`finance_routes.py`) possuem validações estritas de posse. Um atleta só pode visualizar ou alterar o status de pagamento de uma fatura caso o `atleta_id` gravado na fatura coincida com a identidade (`id`) armazenada na sua sessão ativa.

### Controle de Acesso Baseado em Perfis (RBAC)
No backend, as rotas verificam a propriedade `tipo` do perfil retornado pelo `get_current_user()` antes de executar operações protegidas:
* Apenas `tipo == "admin"` pode realizar operações de escrita no CMS, faturamento global, estoque e visualização de logs.
* Apenas `tipo == "filial"` ou `"admin"` pode registrar novos atletas e candidatar atletas a exames.

### Logs de Auditoria (`audit_service.py`)
Operações críticas geram logs contendo: data/hora, tipo de ação, ID/E-mail do operador, nome do usuário e o endereço de IP do cliente. Estes registros são enviados para a tabela `logs_auditoria` do Supabase ou gravados na seção correspondente do `mock-db.json`.

---

## 🚀 6. Variáveis de Ambiente Necessárias (.env)

O arquivo `.env` na raiz do diretório `backend` deve conter as seguintes chaves para pleno funcionamento em produção:

```ini
# Supabase Oficial
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=seu-token-anonimo-supabase

# Google Gemini API
GEMINI_API_KEY=sua-chave-do-google-ai-studio

# Configurações do Servidor
PORT=5000
FLASK_ENV=production
SECRET_KEY=uma-string-longa-e-aleatoria-para-assinatura-de-sessao
FRONTEND_ORIGINS=https://gojuryukaratekai.com.br,https://www.gojuryukaratekai.com.br
```
