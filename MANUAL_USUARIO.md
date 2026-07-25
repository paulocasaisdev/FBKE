# Manual do Usuário - Portal GRKK (Goju-Ryu Karate Kai)

Bem-vindo ao manual oficial de uso do Portal GRKK. Este portal foi desenvolvido para gerenciar filiais, atletas, exames de faixa, eventos, CMS, estoque e o módulo financeiro da Federação.

---

## 🔑 1. Acesso e Controle de Perfis

O portal utiliza autenticação unificada, dividida em três níveis de permissão. Cada perfil possui acesso restrito às suas respectivas funcionalidades.

### 👤 Níveis de Acesso
1. **Atleta**: Acesso básico para consulta de notas, ranking, calendário de exames, histórico de faturas individuais e chat com o Sensei IA.
2. **Filial (Dojo)**: Acesso intermediário para cadastro de novos atletas subordinados à filial, controle financeiro do dojo e inscrição de atletas em exames.
3. **Super Administrador (Admin)**: Acesso total para gestão de CMS (notícias, banners, galeria, equipe), controle financeiro global, homologação de exames de faixa, inventário de estoque e monitoramento de logs de auditoria.

---

## 🥋 2. Guia de Funcionalidades do Atleta

Como atleta, sua área de painel oferece as seguintes opções:

### 📋 Perfil e Histórico
* **Meu Perfil**: Visualize suas informações pessoais, graduação atual (faixa), filiação ativa e dados de contato.
* **Certificados**: Visualize e baixe os seus certificados de exames homologados. Também é possível validar qualquer certificado público pela página de transparência digitando o hash verificador.

### 📈 Ranking e Leaderboard
* **Pontuação**: Acompanhe o seu desempenho baseado em competições, participação em eventos e exames de graduação.
* **Histórico de Progressão**: Veja a evolução da sua pontuação e sua colocação no ranking geral da federação.

### 💰 Financeiro (Minhas Faturas)
* **Visualização**: Acesse a aba **Financeiro** para ver todas as faturas pendentes ou pagas associadas ao seu CPF/E-mail (mensalidades, taxas de exame ou anuidade).
* **Pagamento**: Efetue ou simule o pagamento das suas faturas pendentes de forma segura.

### 🤖 Sensei Virtual IA
* **O que é**: Um assistente virtual inteligente alimentado por IA (Gemini).
* **Como usar**: Faça perguntas livres sobre a história do Karate Goju-Ryu, significado de Katas (como *Sanchin*, *Tensho* ou *Saifa*), conceitos filosóficos (*Go* e *Ju*) e termos em japonês (como *Ibuki* ou *Dojo-kun*).
* **Modo Offline**: Se a rede falhar, o Sensei entra em modo offline e responde com base no glossário oficial integrado na plataforma.

---

## 🏢 3. Guia de Funcionalidades da Filial

Como responsável por uma filial credenciada, suas funções de gestão são:

### 👥 Gestão de Atletas
* **Cadastrar Atleta**: Registre novos atletas associados à sua filial de forma rápida.
* **Visualizar Alunos**: Veja a listagem de todos os atletas matriculados sob a sua tutela, incluindo suas respectivas graduações e status de regularidade.

### 📅 Inscrição em Exames de Faixa
* **Indicar Atleta**: Envie candidaturas dos seus atletas para exames de faixa agendados pela federação.
* **Monitoramento**: Acompanhe se o atleta foi pré-aprovado para realizar o teste técnico e o resultado final atribuído pela banca examinadora.

---

## 👑 4. Guia de Funcionalidades do Administrador

Como Super Administrador da GRKK, você é responsável pela governança geral do sistema:

### 📰 Gestão de Conteúdo (CMS)
* **Notícias e Eventos**: Publique notícias, comunicados oficiais e agende competições na página inicial do portal.
* **Galeria e Equipe**: Adicione ou remova fotos na galeria oficial e gerencie a ficha dos membros da diretoria e comissão técnica.
* **Banners e Glossário**: Customize banners rotativos e adicione ou remova termos oficiais do glossário que alimenta o Sensei IA.

### 📊 Módulo Financeiro Global
* **Faturamento**: Crie faturas em lote ou individuais para filiais e atletas (configurando tipo, valor positivo e data de vencimento).
* **Baixa de Pagamentos**: Monitore a inadimplência e confirme o recebimento de taxas administrativas de filiação e exames.

### 📝 Homologação de Exames de Faixa
* **Criar Bancas**: Cadastre exames oficiais, defina datas, locais e selecione os examinadores (faixas pretas habilitados).
* **Lançar Notas e Homologar**: Atribua notas técnicas aos candidatos. Ao homologar o exame, o sistema atualiza automaticamente a faixa do atleta no perfil dele e gera o certificado com código verificador seguro.

### 📦 Controle de Estoque
* **Inventário**: Cadastre produtos oficiais (Kimonos, faixas, apostilas, camisas) e controle a quantidade disponível para venda direta no dojo central ou distribuição às filiais.

### 🔍 Auditoria e Segurança
* **Logs de Auditoria**: Veja o registro cronológico de todas as ações sensíveis realizadas no sistema (quem realizou login, quando uma fatura foi paga, alterações em dados de atletas ou exclusões no glossário).

---

## 💡 5. Dicas e Resolução de Dúvidas

* **Esqueceu a senha?** Entre em contato com a administração da federação ou use a rota de suporte integrada.
* **Erro ao carregar o chat com o Sensei IA?** O site possui um glossário offline automático. Certifique-se de que a conexão à internet está estável ou verifique o status do servidor da federação.
* **A faixa de um atleta não atualizou?** Lembre-se de que a faixa só é atualizada automaticamente após a banca de examinadores lançar a nota de aprovação e o administrador clicar em **Homologar Exame** no painel de administração.
