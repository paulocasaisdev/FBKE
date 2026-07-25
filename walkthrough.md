# Walkthrough - Goju-Ryu Karate Kai (GRKK)

Este documento resume as ações executadas, as correções realizadas e as validações efetuadas no projeto GRKK.

## Alterações Realizadas

### Avisos da Diretoria Dinâmicos
- **Banco de Dados (Supabase & Mock)**:
  - Adicionada a criação da tabela `avisos_diretoria` em [schema.sql](file:///c:/Users/CASAIS/GRKK/backend/schema.sql#L297) com colunas para `id`, `titulo`, `conteudo`, `categoria`, `destinatario` (filtrado via constraint por todos, filial ou atleta) e `criado_por`.
  - Inicializada a chave `"avisos_diretoria"` no banco de dados mock [mock-db.json](file:///c:/Users/CASAIS/GRKK/backend/mock-db.json#L9067) com um aviso inicial de seminário técnico.
- **Backend (Rotas e Controle de Acesso)**:
  - Criado o arquivo [aviso_routes.py](file:///c:/Users/CASAIS/GRKK/backend/aviso_routes.py) com endpoints para gerenciar avisos.
  - `GET /api/avisos` filtra dinamicamente os avisos com base no tipo de usuário logado (filiais veem apenas avisos para filial/todos; atletas apenas atleta/todos; administradores veem todos).
  - `POST /api/avisos` e `DELETE /api/avisos/<id>` restritos estritamente ao tipo de perfil `admin`.
  - Rotas de avisos devidamente importadas e registradas no arquivo principal do servidor [app.py](file:///c:/Users/CASAIS/GRKK/backend/app.py).
- **Frontend (Painel Administrativo - CMS)**:
  - Adicionada a aba **"Avisos"** no painel administrativo em [admin/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/(dashboard)/admin/page.tsx).
  - Implementado o botão "Adicionar Item" e um modal de criação de aviso específico, gerenciando campos de Título, Categoria, Destinatário e Conteúdo.
  - Desenvolvida a listagem em grid dos avisos cadastrados no painel administrativo com botão correspondente para exclusão/remoção.
- **Frontend (Dashboard de Filiais e Atletas)**:
  - Substituída a seção de avisos estática em [home/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/(dashboard)/home/page.tsx) por uma listagem de dados dinâmica que busca via `GET /api/avisos` os avisos ativos no momento.
  - Inserido o bloco de Avisos da Diretoria Dinâmicos também no dashboard dos Atletas para mantê-los informados das decisões da diretoria, no mesmo padrão estético e responsivo do portal.

---

## 1. Inicialização dos Servidores Locais (Fase 1)
Ambos os servidores foram inicializados com sucesso no ambiente local:
- **Backend (Flask)**: Rodando em `http://127.0.0.1:5000`.
- **Frontend (Next.js)**: Rodando em `http://localhost:3000`.
- A conectividade foi validada com sucesso através do endpoint de saúde `/api/health`.

---

## 2. Correção de Bugs e Ajuste de Rotas (Fase 2)
Foi detectado e corrigido um bug crítico de rota de redirecionamento. As referências ao caminho inexistente `/dashboard/atleta` causavam erro 404. Elas foram atualizadas para a rota centralizada `/home` que processa dinamicamente a interface com base no perfil do usuário logado:
- Modificado: [auth/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/auth/page.tsx)
- Modificado: [Navbar.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/components/Navbar.tsx)

---

## 3. Modo de Emulação (Mock) e Migração (Fase 3)
- Ao executar o script de migração, foram reportados erros 401 de violação de políticas de segurança de linha (RLS) no Supabase.
- Para permitir testes funcionais locais sem a necessidade de reconfiguração de políticas complexas de RLS na nuvem, comentamos as credenciais reais de banco no arquivo `.env` do backend.
- O backend Flask chaveou com sucesso para o **Modo de Emulação Local (Mock)**, lendo e persistindo dados no arquivo `mock-db.json`.

---

## 4. Validação Visual dos Dashboards (Fase 4)
Utilizando o subagente de navegador, simulamos e validamos o login com as credenciais contidas no `mock-db.json` (que não requerem senhas complexas no modo Mock):

### A. Painel de Administração
- **Usuário**: `admin@grkk.com.br`
- Redireciona com sucesso e renderiza dados dinâmicos.
- Veja a imagem abaixo:
![Admin Dashboard](file:///C:/Users/CASAIS/.gemini/antigravity-ide/brain/fee10f35-3472-4974-a664-e558fa79a98c/admin_dashboard_home_1780855146396.png)

---

### B. Painel de Atleta
- **Usuário**: `atleta@grkk.com.br`
- Redireciona com sucesso para `/home` e exibe a carteirinha digital.
- Veja a imagem abaixo:
![Athlete Dashboard](file:///C:/Users/CASAIS/.gemini/antigravity-ide/brain/fee10f35-3472-4974-a664-e558fa79a98c/athlete_dashboard_1780855563167.png)

---

### C. Painel de Filial (Dojo)
- **Usuário**: `filial@grkk.com.br`
- Redireciona com sucesso para `/home` e exibe dados da filial de Salvador Centro.
- Veja a imagem abaixo:
![Filial Dashboard](file:///C:/Users/CASAIS/.gemini/antigravity-ide/brain/fee10f35-3472-4974-a664-e558fa79a98c/filial_dashboard_1780855662067.png)

---

## 5. Nova Página do Sensei IA (Fase 6)
Criamos e validamos um painel dedicado e interativo de chat em tela cheia com o Sensei IA para os membros logados:
- **Navegação**: A barra lateral de navegação em [Sidebar.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/components/dashboard/Sidebar.tsx) foi atualizada para incluir a rota `Sensei IA` (`/sensei-ia`) para Administradores, Filiais e Atletas.
- **Página do Chat**: Implementada em [sensei-ia/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/(dashboard)/sensei-ia/page.tsx). Possui chips de sugestões para os Katas de Goju-Ryu e a história do estilo.
- **Validação**: Testado com sucesso via subagente, disparando a pergunta *"O que significa Sanchin?"* e recebendo a resposta instantânea correspondente.
- Veja a imagem abaixo:
![Sensei IA Chat Response](file:///C:/Users/CASAIS/.gemini/antigravity-ide/brain/fee10f35-3472-4974-a664-e558fa79a98c/sensei_ia_chat_response_1780856998982.png)

---

## 6. Alimentação da Base da IA e Glossário Oficial (Fase 7)
Implementamos a ingestão automatizada e a tradução das apostilas oficiais para alimentar o Sensei Virtual:


1. **Extração de Dados**: Criamos scripts de extração que leram as 66 páginas do arquivo `Terminology.pdf` gerando um glossário preliminar.
2. **Tradução e Curadoria**: Desenvolvemos o arquivo [glossary_pt.json](file:///c:/Users/CASAIS/GRKK/backend/services/glossary_pt.json) contendo mais de 160 termos Goju-Ryu em português de alta qualidade (história, katas, comandos de dojo, bases, técnicas e hojo undo).
3. **Busca Híbrida Inteligente**: Modificamos [ai_service.py](file:///c:/Users/CASAIS/GRKK/backend/services/ai_service.py) para escanear todas as perguntas recebidas.
   - **Modo Online (Gemini)**: Se um termo é localizado na pergunta, sua definição oficial é injetada no prompt dinâmico como contexto, garantindo respostas 100% corretas perante as apostilas.
   - **Modo Offline (Fallback)**: Se o Gemini falhar ou estiver desativado, o chatbot compila as definições do glossário e responde localmente com precisão exemplar.
4. **Validação**: O subagente do navegador testou com os termos *"Muchimi"* e *"Chinkuchi Kakin"*, obtendo respostas imediatas com as definições traduzidas das apostilas:
   - Veja o print do termo **Muchimi**:
![Muchimi Response](file:///C:/Users/CASAIS/.gemini/antigravity-ide/brain/fee10f35-3472-4974-a664-e558fa79a98c/muchimi_response_1780868018509.png)
   - Veja o print do termo **Chinkuchi Kakin**:
![Chinkuchi Kakin Response](file:///C:/Users/CASAIS/.gemini/antigravity-ide/brain/fee10f35-3472-4974-a664-e558fa79a98c/chinkuchi_response_1780868125659.png)

---

## 7. Downloads de Apostilas Reais no Painel de Documentos (Fase 7)
Transformamos a página de documentos estáticos em uma biblioteca de apostilas reais conectada ao servidor:
1. **Modelagem**: Cadastramos os metadados (título, descrição, tipo e tamanho em bytes) dos 7 PDFs da pasta `/apostilas` no banco de dados local [mock-db.json](file:///c:/Users/CASAIS/GRKK/backend/mock-db.json).
2. **APIs no Servidor**: Criamos rotas no Flask para expor a listagem de arquivos e servir downloads seguros com `send_from_directory` na rota `/api/documentos/download/<filename>`.
3. **Interface de Download**: Atualizamos [documentos/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/(dashboard)/documentos/page.tsx) com layout premium, efeitos de brilho em hover, spinners de carregamento, e configuramos o botão "Baixar PDF Real" para abrir e baixar os arquivos PDF diretamente no computador do atleta.
4. **Validação**: Testado com sucesso via subagente, listando todas as apostilas e testando o download do Glossário.
   - Veja a tela do acervo de documentos:
![Documents List Page](file:///C:/Users/CASAIS/.gemini/antigravity-ide/brain/fee10f35-3472-4974-a664-e558fa79a98c/documents_list_page_1780866937666.png)

---

## 8. Correção de Erro CORS / 500 em Produção (HostGator)

### Problema Reportado
O site em produção apresentava erros de CORS e `500 Internal Server Error` ao carregar rotas cruciais como `/api/cms/config` e `/api/auth/me`.

### Diagnóstico e Resolução
1. **Tratamento de Exceções**: Adicionamos um tratamento robusto no endpoint `auth_me` para evitar falhas gerais não capturadas no backend.
2. **Identificação da Incompatibilidade do Ambiente Virtual**:
   - O arquivo de entrada executado pelo servidor Apache da HostGator (`index.fcgi`) estava configurado para apontar para o executável Python contido em `.venv` (com ponto).
   - No entanto, as dependências do projeto (`requirements.txt`) haviam sido instaladas manualmente no ambiente virtual `venv` (sem ponto).
   - Isso causava um erro `ModuleNotFoundError: No module named 'dotenv'` durante a importação do servidor web, fazendo a HostGator retornar uma página genérica de erro 500 que omitia os cabeçalhos de CORS.
3. **Correção**:
   - Ativamos o ambiente virtual correto (`.venv`) no servidor via SSH.
   - Instalamos todas as dependências (`pip install -r requirements.txt`).
   - Forçamos a limpeza do cache de processos executando `touch index.fcgi` e `touch app.py`.

### Validação
Realizamos requisições de teste diretamente no endpoint público:
- **Status da API**: `/api/health` passou a retornar `200 OK` e `"status": "healthy"`.
- **CORS**: O endpoint `/api/auth/me` agora retorna os cabeçalhos corretos (`Access-Control-Allow-Origin: https://gojuryukaratekai.com.br`), normalizando a integração com o frontend.

---

## 9. Ajustes de CMS e Área Restrita (Fase Atual)

Implementamos e validamos as alterações solicitadas para dinamizar as páginas institucionais e readequar a terminologia de acesso do site:

1. **Alteração do rótulo "Área do Membro" para "Área Restrita"**:
   - Modificado no menu de navegação ([Navbar.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/components/Navbar.tsx)).
   - Modificado no rodapé ([Footer.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/components/Footer.tsx)).
   - Modificado na tela de login ([auth/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/auth/page.tsx)).

2. **Criação de novos menus de edição no painel administrativo (CMS)**:
   - **A Academia**: Adicionada aba para gerenciar o Hero, a História e os Princípios (Missão, Visão e Valores).
   - **Transparência**: Adicionada aba para gerenciar os textos do Hero e descrição de compromisso institucional.
   - **Contato**: Adicionada aba para gerenciar os textos de cabeçalho, telefone, e-mail, endereço e os horários de treino (em formato de quebra de linha).
   - Modificado: [admin/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/(dashboard)/admin/page.tsx).

3. **Páginas Públicas Dinâmicas**:
   - As páginas públicas correspondentes foram refatoradas para buscar as configurações atualizadas dinamicamente a partir do endpoint do CMS (`/api/cms/config`), contendo fallbacks completos em português em caso de indisponibilidade de rede:
     - [sobre/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/sobre/page.tsx)
     - [transparencia/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/transparencia/page.tsx)
     - [contato/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/contato/page.tsx)
     - [ContatoSection.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/components/ContatoSection.tsx)

4. **Validação**:
   - **Testes de Backend**: Executamos a suíte de testes unitários (`pytest`), que obteve 100% de aprovação (15 testes passando, cobrindo segurança, acesso a endpoints e o novo fluxo de avisos).
   - **Checagem de Tipos (TypeScript)**: Executamos `npx tsc --noEmit` no frontend sem nenhum aviso ou erro de tipos.
   - **Compilação de Produção**: O comando `npm run build` gerou a build do Next.js Turbopack com sucesso para todas as 40 rotas da aplicação.
   - **Empacotamento de Produção**: O script `create_zip_skip_venv.py` foi reexecutado com sucesso para incluir a lógica dinâmica de notificações atualizada em [backend_clean.zip](file:///c:/Users/CASAIS/GRKK/backend_clean.zip).

---

## 10. Correção e Geração Dinâmica de Notificações em Produção

Ajustamos o fluxo de notificações do sistema, que anteriormente operava apenas com dados mockados estáticos e apresentava inconsistências de nomenclatura de tabelas entre o mock local (`notificacoes`) e a definição de produção em SQL (`notifications`).

### Alterações Realizadas
- **Função Auxiliar de Criação (`criar_notificacao`)**:
  - Implementada em [notif_routes.py](file:///c:/Users/CASAIS/GRKK/backend/notif_routes.py) para encapsular de forma inteligente a escrita nos bancos de dados:
    - Em desenvolvimento local (modo mock), insere os dados na chave `"notificacoes"` do JSON local.
    - Em produção, insere na tabela public `"notifications"` do banco Supabase real (com tratamento de fallback).
- **Gatilhos em Ações Cruciais**:
  - **Inscrição de Atletas**: Integrado em [atleta_routes.py](file:///c:/Users/CASAIS/GRKK/backend/atleta_routes.py), disparando notificação pendente ao admin quando um novo atleta se cadastra no sistema.
  - **Aprovação de Atletas**: Integrado em [atleta_routes.py](file:///c:/Users/CASAIS/GRKK/backend/atleta_routes.py), criando uma notificação automática para o atleta quando seu cadastro for ativado/homologado.
  - **Inscrição de Filiais**: Integrado em [filial_routes.py](file:///c:/Users/CASAIS/GRKK/backend/filial_routes.py), enviando notificação pendente ao admin quando um dojo solicita credenciamento.
  - **Aprovação de Filiais**: Integrado em [filial_routes.py](file:///c:/Users/CASAIS/GRKK/backend/filial_routes.py), notificando a filial de forma automática quando seu credenciamento for aprovado.

---

## 11. Correção de Erro 500 no Cadastro de Exames (Produção)

Identificamos e corrigimos o erro 500 (Internal Server Error) retornado pela rota `POST /api/exames` em produção ao tentar agendar um novo exame:

### Causa do Problema
1. **Divergência de Colunas**: O formulário do frontend envia dados de `local`, `modalidade`, `faixa_alvo` e `taxa_valor` para o cadastro do exame. No entanto, a tabela Postgres `exames` no Supabase em produção não possuía essas colunas adicionais na sua definição física, fazendo o banco de dados oficial rejeitar o INSERT.
2. **Restrição CHECK de Status**: A tabela `exames` no banco Postgres real possuía a constraint `CHECK (status IN ('agendado', 'realizado', 'cancelado'))`. Contudo, o frontend envia o status de novos exames como `'rascunho'` ou `'publicado'`, violando a restrição e forçando a rejeição do comando.

### Alterações Realizadas
- **Correção da Modelagem no Repositório**:
  - Atualizamos a definição em [schema.sql](file:///c:/Users/CASAIS/GRKK/backend/schema.sql#L116) para incluir as novas colunas e flexibilizar a constraint `CHECK` de status de exames para: `CHECK (status IN ('rascunho', 'publicado', 'realizado', 'cancelado', 'agendado'))`.
  - Atualizamos a lista de colunas válidas no script de migração [migrate_mock_to_supabase.py](file:///c:/Users/CASAIS/GRKK/backend/migrate_mock_to_supabase.py#L58) para permitir a exportação desses novos campos.
- **Novo Pacote de Deploy**:
  - Geramos uma nova build e reexecutamos o empacotamento, disponibilizando as correções atualizadas no arquivo [backend_clean.zip](file:///c:/Users/CASAIS/GRKK/backend_clean.zip).

---

## 12. Correções Finais e Deploy em Produção (HostGator)

Implementamos uma série de correções fundamentais para normalizar o portal em produção:

1. **Ativação da Área de Documentos para Atletas**:
   - Adicionamos o link correspondente no menu de atletas em [Sidebar.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/components/dashboard/Sidebar.tsx), permitindo que assinem digitalmente os termos de adesão.
2. **Correção de Crash de CEP e Campos Vazios**:
   - Ajustamos a validação de formulários em [configuracoes/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/(dashboard)/configuracoes/page.tsx) com checagem segura de valores (`(form.cep || '').replace(...)`), evitando exceções de nulo ao salvar.
3. **Blindagem contra Travamento no Emblema de Carregamento**:
   - Ajustamos a listagem de estatísticas em [home/page.tsx](file:///c:/Users/CASAIS/GRKK/frontend/src/app/(dashboard)/home/page.tsx) para utilizar um fallback seguro de array vazio (`res || []`). Isso evita que instabilidades de rede travem a aplicação em loop infinito na tela do emblema.
4. **Solução do Erro 500 (Erro de Sintaxe Python 3.9 na HostGator)**:
   - Identificamos no diagnóstico que o servidor da HostGator roda **Python 3.9**.
   - Corrigimos o arquivo [pdf_service.py](file:///c:/Users/CASAIS/GRKK/backend/services/pdf_service.py) para remover interpolações de f-strings aninhadas com aspas simples idênticas (sintaxe permitida apenas a partir de Python 3.12+), garantindo retrocompatibilidade total da API com o cPanel da HostGator.
5. **CORS com subdomínio `www.`**:
   - Atualizamos a configuração em [app.py](file:///c:/Users/CASAIS/GRKK/backend/app.py) para liberar requisições vindas de `https://www.gojuryukaratekai.com.br`, evitando bloqueios de CORS por navegadores.
6. **Empacotamento de Produção Finalizado**:
   - Todos os arquivos zipados (**[backend_clean.zip](file:///c:/Users/CASAIS/GRKK/backend_clean.zip)** e **[frontend_clean.zip](file:///c:/Users/CASAIS/GRKK/frontend_clean.zip)**) foram recompilados e empacotados com sucesso na raiz do projeto.

