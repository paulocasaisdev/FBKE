-- Schema SQL para o Banco de Dados Goju-Ryu Karate Kai
-- Execute este script no SQL Editor do seu console Supabase para criar as tabelas necessárias.

-- Desativa checagem de chaves estrangeiras temporariamente para deleção limpa (opcional)
-- DROP TABLE IF EXISTS logs_auditoria, cobrancas, financeiro, candidatos_exame, chaves_torneio, eventos_chaves, eventos_inscricoes, historico_pontos, certificados, atletas, filiais, noticias, notifications, contacts, gallery_items, team_members, profiles CASCADE;

-- 1. Tabela PROFILES (Extensão de autenticação)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Pode ser UUID do Supabase Auth ou String mockada
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('admin', 'filial', 'atleta')),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'inativo', 'reprovado')),
    avatar_url TEXT,
    cidade VARCHAR(100),
    nome_fantasia VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabela FILIAIS
CREATE TABLE IF NOT EXISTS filiais (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    cnpj_cpf VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    codigo_interno VARCHAR(100) UNIQUE,
    nome_fantasia VARCHAR(255),
    tipo VARCHAR(50) DEFAULT 'vinculada',
    cpf_responsavel VARCHAR(50),
    graduacao_responsavel VARCHAR(100),
    registro_federativo VARCHAR(100),
    cep VARCHAR(20),
    rua VARCHAR(255),
    numero VARCHAR(50),
    bairro VARCHAR(100),
    municipio VARCHAR(100),
    estado VARCHAR(50),
    motivo_reprovacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE filiais ADD COLUMN IF NOT EXISTS cnpj_cpf VARCHAR(50);


-- 3. Tabela ATLETAS
CREATE TABLE IF NOT EXISTS atletas (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    faixa VARCHAR(100) DEFAULT 'Branca',
    filial_id TEXT REFERENCES filiais(id) ON DELETE SET NULL,
    filial_nome VARCHAR(255),
    cpf VARCHAR(50) UNIQUE,
    sexo CHAR(1),
    data_nascimento DATE,
    nome_professor VARCHAR(255),
    cep VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    uf VARCHAR(10),
    responsavel_nome VARCHAR(255),
    responsavel_cpf VARCHAR(50),
    responsavel_email VARCHAR(255),
    responsavel_telefone VARCHAR(50),
    medico_alergias TEXT,
    medico_plano VARCHAR(255),
    medico_restricoes TEXT,
    medico_diagnosticos TEXT,
    pontos INTEGER DEFAULT 0,
    registro_federacao VARCHAR(100) UNIQUE,
    arte_marcial VARCHAR(100) DEFAULT 'Karate',
    estilo VARCHAR(100) DEFAULT 'Goju-Ryu',
    academia_clube VARCHAR(255) DEFAULT 'Associação Goju-Ryu Karate Kai',
    medico_tipo_sanguineo VARCHAR(10),
    medico_fator_rh VARCHAR(10),
    medico_sus VARCHAR(50),
    medico_emergencia_nome VARCHAR(255),
    medico_emergencia_telefone VARCHAR(50),
    medico_medicacao_uso VARCHAR(10),
    medico_medicacao_lista TEXT,
    medico_alergia_medicamento TEXT,
    fisico_peso VARCHAR(20),
    fisico_altura VARCHAR(20),
    autoriza_uso_imagem BOOLEAN DEFAULT TRUE,
    ja_praticou_artes_marciais VARCHAR(10) DEFAULT 'Não',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE atletas ADD COLUMN IF NOT EXISTS ja_praticou_artes_marciais VARCHAR(10) DEFAULT 'Não';

-- 4. Tabela EVENTOS
CREATE TABLE IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    tipo VARCHAR(50) DEFAULT 'torneio' CHECK (tipo IN ('torneio', 'seminario', 'exame', 'outro')),
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Tabela EVENTOS_INSCRICOES
CREATE TABLE IF NOT EXISTS eventos_inscricoes (
    id TEXT PRIMARY KEY,
    evento_id TEXT REFERENCES eventos(id) ON DELETE CASCADE,
    atleta_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    atleta_nome VARCHAR(255),
    filial_id TEXT,
    filial_nome VARCHAR(255),
    categoria VARCHAR(50) DEFAULT 'Kata' CHECK (categoria IN ('Kata', 'Kumite')),
    faixa VARCHAR(100),
    idade INTEGER,
    pagamento_status VARCHAR(50) DEFAULT 'pendente',
    status VARCHAR(50) DEFAULT 'confirmado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Tabela EVENTOS_CHAVES
CREATE TABLE IF NOT EXISTS eventos_chaves (
    id TEXT PRIMARY KEY,
    evento_id TEXT REFERENCES eventos(id) ON DELETE CASCADE,
    modalidade VARCHAR(50) CHECK (modalidade IN ('Kata', 'Kumite')),
    brackets JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Tabela EXAMES
CREATE TABLE IF NOT EXISTS exames (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_exame DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'em_andamento', 'concluido', 'cancelado', 'realizado', 'agendado')),
    local VARCHAR(255) DEFAULT 'Sede Central GRKK',
    modalidade VARCHAR(100) DEFAULT 'Karate Goju-Ryu',
    faixa_alvo VARCHAR(100) DEFAULT 'Todas',
    taxa_valor NUMERIC DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Migração: atualiza constraint de status caso a tabela já exista
ALTER TABLE exames DROP CONSTRAINT IF EXISTS exames_status_check;
ALTER TABLE exames ADD CONSTRAINT exames_status_check
    CHECK (status IN ('rascunho', 'publicado', 'em_andamento', 'concluido', 'cancelado', 'realizado', 'agendado'));


-- 8. Tabela CANDIDATOS_EXAME
CREATE TABLE IF NOT EXISTS candidatos_exame (
    id TEXT PRIMARY KEY,
    exame_id TEXT REFERENCES exames(id) ON DELETE CASCADE,
    atleta_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    atleta_nome VARCHAR(255),
    filial_id TEXT,
    filial_nome VARCHAR(255),
    faixa_atual VARCHAR(100),
    graduacao_pretendida VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'inscrito', 'em_andamento', 'aprovado', 'reprovado')),
    autorizacao_tecnica BOOLEAN DEFAULT FALSE,
    pagamento_status VARCHAR(50) DEFAULT 'pendente',
    avaliado_por TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    dados_banca JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Migração: adiciona coluna avaliado_por se não existir
ALTER TABLE candidatos_exame ADD COLUMN IF NOT EXISTS avaliado_por TEXT REFERENCES profiles(id) ON DELETE SET NULL;
-- Migração: atualiza constraint de status dos candidatos
ALTER TABLE candidatos_exame DROP CONSTRAINT IF EXISTS candidatos_exame_status_check;
ALTER TABLE candidatos_exame ADD CONSTRAINT candidatos_exame_status_check
    CHECK (status IN ('pendente', 'inscrito', 'em_andamento', 'aprovado', 'reprovado'));


-- 9. Tabela FINANCEIRO
CREATE TABLE IF NOT EXISTS financeiro (
    id TEXT PRIMARY KEY,
    atleta_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    atleta_nome VARCHAR(255),
    filial_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    filial_nome VARCHAR(255),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('anuidade', 'mensalidade', 'exame', 'evento', 'outro')),
    valor NUMERIC(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 10. Tabela NOTICIAS
CREATE TABLE IF NOT EXISTS noticias (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255),
    conteudo TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    imagem_url TEXT,
    publicado BOOLEAN DEFAULT TRUE,
    autor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 11. Tabela TEAM_MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    biografia TEXT,
    foto_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 12. Tabela GALLERY_ITEMS
CREATE TABLE IF NOT EXISTS gallery_items (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 13. Tabela LOGS_AUDITORIA
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id TEXT PRIMARY KEY,
    usuario_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255),
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT,
    ip VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 14. Tabela NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    destinatario_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info',
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 15. Tabela CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    phone VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 16. Tabela HISTORICO_PONTOS
CREATE TABLE IF NOT EXISTS historico_pontos (
    id TEXT PRIMARY KEY,
    atleta_id TEXT REFERENCES atletas(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(100),
    descricao TEXT,
    pontos INTEGER NOT NULL,
    data_pontuacao DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 17. Tabela CERTIFICADOS
CREATE TABLE IF NOT EXISTS certificados (
    id TEXT PRIMARY KEY,
    atleta_id TEXT REFERENCES atletas(id) ON DELETE CASCADE,
    codigo_validacao VARCHAR(100) UNIQUE,
    data_emissao DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 18. Tabela CMS_BANNERS
CREATE TABLE IF NOT EXISTS cms_banners (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) NOT NULL,
    link TEXT,
    imagem_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 19. Tabela DOCUMENTOS
CREATE TABLE IF NOT EXISTS documentos (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    "desc" TEXT,
    arquivo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 20. Tabela CMS_CONFIG
CREATE TABLE IF NOT EXISTS cms_config (
    chave VARCHAR(100) PRIMARY KEY,
    valor JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 21. Tabela PRODUTOS_ESTOQUE
CREATE TABLE IF NOT EXISTS produtos_estoque (
    id TEXT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL,
    preco_compra NUMERIC(10, 2) DEFAULT 0,
    preco_venda NUMERIC(10, 2) DEFAULT 0,
    quantidade_estoque INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 22. Tabela MOVIMENTACOES_ESTOQUE
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id TEXT PRIMARY KEY,
    produto_id TEXT REFERENCES produtos_estoque(id) ON DELETE CASCADE,
    produto_nome VARCHAR(255),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 23. Tabela AVISOS_DIRETORIA
CREATE TABLE IF NOT EXISTS avisos_diretoria (
    id TEXT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    destinatario VARCHAR(50) DEFAULT 'todos' CHECK (destinatario IN ('todos', 'filial', 'atleta')),
    criado_por TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 24. Tabela FORNECEDORES
CREATE TABLE IF NOT EXISTS fornecedores (
    id TEXT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    contato VARCHAR(255),
    telefone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 25. Tabela PRESENCAS (Frequência de treinos)
CREATE TABLE IF NOT EXISTS presencas (
    id TEXT PRIMARY KEY,
    atleta_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    filial_id TEXT REFERENCES filiais(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'presente' CHECK (status IN ('presente', 'falta', 'justificado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Modificações nas tabelas existentes para estoque
ALTER TABLE produtos_estoque ADD COLUMN IF NOT EXISTS fornecedor_id TEXT REFERENCES fornecedores(id) ON DELETE SET NULL;
ALTER TABLE produtos_estoque ADD COLUMN IF NOT EXISTS tamanho VARCHAR(50) DEFAULT 'Único';

-- 26. Tabela DOCUMENTOS_ASSINADOS (Assinatura digital via Gov.br)
CREATE TABLE IF NOT EXISTS documentos_assinados (
    id TEXT PRIMARY KEY,
    atleta_id TEXT NOT NULL,
    atleta_nome TEXT NOT NULL,
    titulo TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendente', 'assinado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    signed_at TIMESTAMP WITH TIME ZONE,
    assinatura_hash TEXT,
    arquivo_url TEXT
);

-- 27. Tabela DESPESAS (Fluxo de Caixa - Saídas)
CREATE TABLE IF NOT EXISTS despesas (
    id TEXT PRIMARY KEY,
    filial_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    filial_nome VARCHAR(255),
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor NUMERIC(10, 2) NOT NULL,
    data_pagamento DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
