"""Testes básicos para o backend refatorado"""

import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Testar endpoint de health check"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert 'mock_mode' in data
    assert 'message' in data

def test_auth_routes_exist(client):
    """Testar se as rotas de autenticação existem"""
    # Testar login
    response = client.post('/api/auth/login', 
                          json={'email': 'nonexistent@example.com', 'password': 'password'})
    # Deve retornar 401 pois o usuário não existe
    assert response.status_code == 401
    
    # Testar logout
    response = client.post('/api/auth/logout')
    assert response.status_code == 200
    
    # Testar me (não autenticado)
    response = client.get('/api/auth/me')
    assert response.status_code == 200
    data = response.get_json()
    assert data['autenticado'] == False

def test_atleta_routes_exist(client):
    """Testar se as rotas de atletas existem"""
    # Testar registro de atleta público
    response = client.post('/api/atletas/public', 
                          json={
                              'nome': 'Test Atleta',
                              'email': 'test@example.com',
                              'telefone': '123456789'
                          })
    # Deve retornar 201 pois o registro é válido
    assert response.status_code == 201
    
    # Testar listagem de atletas
    response = client.get('/api/atletas')
    # Deve retornar 403 pois não está autenticado
    assert response.status_code == 403

def test_filial_routes_exist(client):
    """Testar se as rotas de filiais existem"""
    # Testar registro de filial
    response = client.post('/api/filiais', 
                          json={
                              'nome': 'Test Filial',
                              'email': 'filial@example.com'
                          })
    # Deve retornar 201 pois o registro é válido
    assert response.status_code == 201
    
    # Testar listagem de filiais
    response = client.get('/api/filiais')
    # Deve retornar 403 pois não está autenticado
    assert response.status_code == 403

def test_cms_routes_exist(client):
    """Testar se as rotas do CMS existem"""
    # Testar listagem de notícias
    response = client.get('/api/noticias')
    assert response.status_code == 200
    
    # Testar listagem de galeria
    response = client.get('/api/galeria')
    assert response.status_code == 200
    
    # Testar listagem de equipe
    response = client.get('/api/equipe')
    assert response.status_code == 200

def test_messages_routes_exist(client):
    """Testar se as rotas de mensagens existem"""
    # Testar envio de contato
    response = client.post('/api/contato', 
                          json={
                              'nome': 'Test User',
                              'email': 'test@example.com',
                              'mensagem': 'Test message'
                          })
    # Deve retornar 201 pois o registro é válido
    assert response.status_code == 201

def test_ai_routes_exist(client):
    """Testar se as rotas de IA existem"""
    # Testar chat com IA
    response = client.post('/api/ia-chat', 
                          json={'mensagem': 'O que é Sanchin?'})
    # Deve retornar 200 pois a mensagem é válida
    assert response.status_code == 200

def test_cert_routes_exist(client):
    """Testar se as rotas de certificados existem"""
    # Testar validação de certificado
    response = client.get('/api/certificados/validar/testecode')
    assert response.status_code == 200

def test_notif_routes_exist(client):
    """Testar se as rotas de notificações existem"""
    # Testar listagem de notificações
    response = client.get('/api/notificacoes')
    # Deve retornar 401 pois não está autenticado
    assert response.status_code == 401

def test_ranking_routes_exist(client):
    """Testar se as rotas de ranking existem"""
    # Testar listagem de ranking
    response = client.get('/api/ranking')
    # Deve retornar 200 pois o ranking é público
    assert response.status_code == 200

def test_exam_routes_exist(client):
    """Testar se as rotas de exames existem"""
    # Testar listagem de exames
    response = client.get('/api/exames')
    assert response.status_code == 200

def test_finance_routes_exist(client):
    """Testar se as rotas financeiras existem"""
    # Testar listagem de finanças
    response = client.get('/api/financeiro')
    # Deve retornar 401 pois não está autenticado
    assert response.status_code == 401

def test_event_routes_exist(client):
    """Testar se as rotas de eventos existem"""
    # Testar listagem de eventos
    response = client.get('/api/eventos')
    assert response.status_code == 200

def test_team_gallery_routes_exist(client):
    """Testar se as rotas de equipe e galeria existem"""
    # Testar listagem de equipe
    response = client.get('/api/equipe')
    assert response.status_code == 200
    
    # Testar listagem de galeria
    response = client.get('/api/galeria')
    assert response.status_code == 200

def test_aviso_routes_exist(client):
    """Testar se as rotas de avisos da diretoria existem"""
    # Testar listagem de avisos (não autenticado)
    response = client.get('/api/avisos')
    # Deve retornar 401 pois não está autenticado
    assert response.status_code == 401

    # Testar criação de aviso (não autenticado)
    response = client.post('/api/avisos', json={'titulo': 'Aviso Teste', 'conteudo': 'Conteúdo do aviso'})
    assert response.status_code == 401

def test_relatorios_routes_no_auth(client):
    """Testar se as rotas de relatórios exigem autenticação de admin"""
    # Testar geral (sem auth)
    response = client.get('/api/relatorios/geral')
    assert response.status_code == 403

    # Testar financeiro (sem auth)
    response = client.get('/api/relatorios/financeiro')
    assert response.status_code == 403

    # Testar atletas (sem auth)
    response = client.get('/api/relatorios/atletas')
    assert response.status_code == 403

    # Testar exames (sem auth)
    response = client.get('/api/relatorios/exames')
    assert response.status_code == 403


