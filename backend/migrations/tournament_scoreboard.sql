-- Migração SQL: Tournament Management & Real-time Scoreboard
-- Tabelas para gerenciamento de campeonatos de Karatê (FBKE)

-- 1. Tabela de Torneios
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabela de Categorias do Torneio
CREATE TABLE IF NOT EXISTS tournament_categories (
    id TEXT PRIMARY KEY,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Kata', 'Kumite')),
    gender VARCHAR(50) CHECK (gender IN ('M', 'F', 'Mixed')),
    age_min INTEGER,
    age_max INTEGER,
    weight_min NUMERIC,
    weight_max NUMERIC,
    belt_min VARCHAR(100),
    belt_max VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'ongoing', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabela de Inscrições na Categoria do Torneio
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES tournament_categories(id) ON DELETE CASCADE,
    athlete_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    athlete_name VARCHAR(255) NOT NULL,
    dojo_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- No schema FBKE, dojo é uma conta do tipo 'filial' em profiles
    dojo_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    weight NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Tabela de Confrontos (Matches)
CREATE TABLE IF NOT EXISTS tournament_matches (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES tournament_categories(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    athlete_red_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- AKA
    athlete_red_name VARCHAR(255),
    athlete_blue_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- AO
    athlete_blue_name VARCHAR(255),
    winner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    score_red INTEGER DEFAULT 0,
    score_blue INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'finished', 'bye')),
    match_order INTEGER DEFAULT 0,
    parent_red_match_id TEXT REFERENCES tournament_matches(id) ON DELETE SET NULL,
    parent_blue_match_id TEXT REFERENCES tournament_matches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Tabela de Logs da Luta ao Vivo (Live Match Logs)
CREATE TABLE IF NOT EXISTS tournament_match_logs (
    id TEXT PRIMARY KEY,
    match_id TEXT REFERENCES tournament_matches(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    log_type VARCHAR(50) CHECK (log_type IN ('score', 'penalty', 'senshu', 'timer', 'system')),
    details JSONB NOT NULL
);
