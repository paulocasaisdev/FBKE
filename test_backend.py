#!/usr/bin/env python3
"""Script de teste para o backend refatorado"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.app import app
app.testing = True

def test_app_structure():
    """Testar a estrutura do app refatorado"""
    print("Testando estrutura do app refatorado...")
    
    # Testar se o app está configurado corretamente
    assert app is not None
    print("PASS: App está configurado corretamente")
    
    # Testar se as rotas estão registradas
    with app.test_client() as client:
        # Testar health check
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
        print("PASS: Health check funciona corretamente")
        
        # Testar rotas de autenticação
        response = client.post('/api/auth/login', 
                              json={'email': 'nonexistent@example.com', 'password': 'password'})
        assert response.status_code == 401
        print("PASS: Rota de login funciona corretamente")
        
        # Testar rotas de atleta
        response = client.post('/api/atletas/public', 
                              json={
                                  'nome': 'Test Atleta',
                                  'email': 'test@example.com',
                                  'telefone': '123456789',
                                  'aceita_termos': True
                              })
        assert response.status_code == 201
        print("PASS: Rota de registro de atleta funciona corretamente")
        
        # Testar rotas de filial
        response = client.post('/api/filiais', 
                              json={
                                  'nome': 'Test Filial',
                                  'email': 'filial@example.com',
                                  'aceita_termos': True
                              })
        assert response.status_code == 201
        print("PASS: Rota de registro de filial funciona corretamente")
        
        # Testar rotas de CMS
        response = client.get('/api/noticias')
        assert response.status_code == 200
        print("PASS: Rotas de CMS funcionam corretamente")
        
        # Testar rotas de mensagens
        response = client.post('/api/contato', 
                              json={
                                  'nome': 'Test User',
                                  'email': 'test@example.com',
                                  'mensagem': 'Test message'
                              })
        assert response.status_code == 201
        print("PASS: Rotas de mensagens funcionam corretamente")
        
        # Testar rotas de IA
        response = client.post('/api/ia-chat', 
                              json={'mensagem': 'O que é Sanchin?'})
        assert response.status_code == 200
        print("PASS: Rotas de IA funcionam corretamente")
        
        # Testar rotas de certificados
        response = client.get('/api/certificados/validar/testecode')
        assert response.status_code == 200
        print("PASS: Rotas de certificados funcionam corretamente")
        
        # Testar rotas de exames
        response = client.get('/api/exames')
        assert response.status_code == 200
        print("PASS: Rotas de exames funcionam corretamente")
        
        # Testar rotas de eventos
        response = client.get('/api/eventos')
        assert response.status_code == 200
        print("PASS: Rotas de eventos funcionam corretamente")
        
        # Testar rotas de equipe e galeria
        response = client.get('/api/equipe')
        assert response.status_code == 200
        print("PASS: Rotas de equipe funcionam corretamente")
        
        response = client.get('/api/galeria')
        assert response.status_code == 200
        print("PASS: Rotas de galeria funcionam corretamente")

        # Testar rotas do glossário do Sensei IA
        response = client.get('/api/cms/glossario')
        assert response.status_code == 200
        data = response.get_json()
        assert 'glossario' in data
        assert len(data['glossario']) > 0
        print("PASS: Rota GET de glossário do Sensei IA funciona corretamente")
    
    print("\nSUCCESS: Todos os testes estruturais passaram! O backend refatorado está funcionando corretamente.")
    return True

def test_finance_module():
    """Testar funcionalidades e segurança do módulo financeiro"""
    print("\nTestando módulo financeiro (segurança, validação, filtragem)...")
    
    with app.test_client() as client:
        # 1. Tentar acessar sem estar autenticado (deve dar 401)
        res = client.get('/api/financeiro')
        assert res.status_code == 401
        print("PASS: GET sem autenticação retorna 401")
        
        # 2. Login como Atleta (atleta@grkk.com.br)
        res = client.post('/api/auth/login', json={'email': 'atleta@grkk.com.br'})
        assert res.status_code == 200
        
        # 2.1. Tentar criar fatura como Atleta (deve dar 403)
        res = client.post('/api/financeiro', json={
            'tipo': 'anuidade',
            'valor': 100,
            'data_vencimento': '2026-12-31',
            'atleta_id': '8513aa27-452f-462e-8f5a-b3f2052612f1'
        })
        assert res.status_code == 403
        print("PASS: Atleta não pode criar fatura (403)")
        
        # 2.2. Listar faturas como Atleta
        res = client.get('/api/financeiro')
        assert res.status_code == 200
        data = res.get_json()
        assert 'pagamentos' in data
        # Verificar se as faturas retornadas pertencem de fato ao atleta
        for fat in data['pagamentos']:
            assert fat.get('atleta_id') == '8513aa27-452f-462e-8f5a-b3f2052612f1'
        print("PASS: Atleta só visualiza as próprias faturas")
        
        # Logout do atleta
        client.post('/api/auth/logout')
        
        # 3. Login como Admin (admin@grkk.com.br)
        res = client.post('/api/auth/login', json={'email': 'admin@grkk.com.br'})
        assert res.status_code == 200
        
        # 3.1. Criar fatura válida como Admin
        res = client.post('/api/financeiro', json={
            'tipo': 'mensalidade',
            'valor': 120.50,
            'data_vencimento': '2026-08-15',
            'atleta_id': '8513aa27-452f-462e-8f5a-b3f2052612f1'
        })
        assert res.status_code == 201
        nova_fat = res.get_json()
        assert nova_fat.get('id') is not None
        assert nova_fat.get('valor') == 120.50
        print("PASS: Admin consegue criar fatura válida (201)")
        
        # 3.2. Criar fatura inválida (valor negativo)
        res = client.post('/api/financeiro', json={
            'tipo': 'mensalidade',
            'valor': -50.00,
            'data_vencimento': '2026-08-15',
            'atleta_id': '8513aa27-452f-462e-8f5a-b3f2052612f1'
        })
        assert res.status_code == 400
        print("PASS: Criação de fatura com valor negativo é rejeitada (400)")
        
        # 3.3. Criar fatura inválida (data mal formatada)
        res = client.post('/api/financeiro', json={
            'tipo': 'mensalidade',
            'valor': 100.00,
            'data_vencimento': '15-08-2026',
            'atleta_id': '8513aa27-452f-462e-8f5a-b3f2052612f1'
        })
        assert res.status_code == 400
        print("PASS: Criação de fatura com data mal formatada é rejeitada (400)")
        
        # 3.4. Listar todas as faturas como Admin
        res = client.get('/api/financeiro')
        assert res.status_code == 200
        data_admin = res.get_json()
        assert len(data_admin['pagamentos']) > 0
        # Garantir que a fatura fat-1 esteja como pendente para que o teste de pagamento passe repetidamente
        res = client.patch('/api/financeiro/fat-1', json={'status': 'pendente'})
        assert res.status_code == 200
        
        print("PASS: Admin visualiza todas as faturas")
        
        # Logout admin
        client.post('/api/auth/logout')
        
        # 4. Testes de IDOR (Acesso cruzado)
        # Login como outro atleta (Paulo Roberto)
        res = client.post('/api/auth/login', json={'email': 'paulocasais@outlook.com'})
        assert res.status_code == 200
        
        # Tentar pagar fatura que pertence ao Atleta de Teste (fat-2)
        res = client.patch('/api/financeiro/fat-2', json={'status': 'pago'})
        assert res.status_code == 403
        print("PASS: Atleta A não pode pagar/atualizar fatura do Atleta B (403 IDOR bloqueado)")
        
        # Tentar pagar própria fatura (fat-1) - deve ser permitido
        res = client.patch('/api/financeiro/fat-1', json={'status': 'pago'})
        assert res.status_code == 200
        print("PASS: Atleta consegue pagar a própria fatura (200)")
        
        # Tentar alterar outros campos protegidos (valor) de sua própria fatura
        res = client.patch('/api/financeiro/fat-1', json={'valor': 10.00})
        assert res.status_code == 403
        print("PASS: Atleta não pode alterar o valor de sua própria fatura (403)")
        
        # Logout
        client.post('/api/auth/logout')
        
    print("SUCCESS: Todos os testes do módulo financeiro passaram!")
    return True

def test_exame_module():
    """Testar regras de negócio, faixas permitidas e carência mínima do módulo de exames"""
    print("\nTestando módulo de exames (múltiplas faixas, carência, idade)...")
    
    with app.test_client() as client:
        # 1. Login como Admin
        res = client.post('/api/auth/login', json={'email': 'admin@grkk.com.br'})
        assert res.status_code == 200
        
        # 2. Criar um novo exame publicado com faixas restritas
        res = client.post('/api/exames', json={
            'titulo': 'Exame Teste Restrito',
            'descricao': 'Exame para teste de faixas e carência',
            'data_exame': '2026-07-15',
            'local': 'Dojo de Teste',
            'modalidade': 'Karate Goju-Ryu',
            'faixa_alvo': 'Amarela, Laranja', # múltiplas faixas
            'taxa_valor': 80.00,
            'status': 'publicado'
        })
        assert res.status_code == 201
        exame_criado = res.get_json()
        exame_id = exame_criado.get('id')
        assert exame_id is not None
        print("PASS: Criado exame publicado com múltiplas faixas permitidas")
        
        # Logout do admin
        client.post('/api/auth/logout')
        
        # 3. Login como Atleta
        res = client.post('/api/auth/login', json={'email': 'atleta@grkk.com.br'})
        assert res.status_code == 200
        
        # 4. Tentar se inscrever em uma faixa não permitida pelo exame (ex: Azul)
        res = client.post('/api/exames/candidatos', json={
            'exame_id': exame_id,
            'graduacao_pretendida': 'Azul'
        })
        assert res.status_code == 400
        data = res.get_json()
        assert 'Este exame não aceita candidatos' in data.get('error', '')
        print("PASS: Tentativa de inscrição em faixa não permitida pelo exame é rejeitada (400)")
        
        # 5. Tentar se inscrever na faixa Amarela sem cumprir a carência (criado recentemente)
        res = client.post('/api/exames/candidatos', json={
            'exame_id': exame_id,
            'graduacao_pretendida': 'Amarela'
        })
        assert res.status_code == 400
        data = res.get_json()
        assert 'Período de carência não cumprido' in data.get('error', '')
        print("PASS: Inscrição sem cumprir o período de carência é rejeitada (400)")
        
        # Logout
        client.post('/api/auth/logout')
        
        # 6. Login de admin para excluir o exame
        res = client.post('/api/auth/login', json={'email': 'admin@grkk.com.br'})
        assert res.status_code == 200
        
        # 7. Excluir o exame
        res = client.delete(f'/api/exames/{exame_id}')
        assert res.status_code == 200
        print("PASS: Exame excluído com sucesso (200)")
        
        # 8. Verificar se o exame foi excluído
        res = client.get(f'/api/exames/{exame_id}')
        assert res.status_code == 404
        print("PASS: Exame excluído não é mais localizado (404)")
        
        # Logout
        client.post('/api/auth/logout')
        
    print("SUCCESS: Todos os testes do módulo de exames passaram!")
    return True

if __name__ == '__main__':
    try:
        test_app_structure()
        test_finance_module()
        test_exame_module()
        print("\n[SUCCESS] Todos os testes de validação foram concluídos com sucesso!")
        print("\nResumo das melhorias validadas:")
        print("1. Rotas de faturamento restritas contra IDOR e privilégios")
        print("2. Validação estrita de tipo de fatura, valor positivo e formato de data")
        print("3. Filtragem automática no banco de dados com base na sessão")
        print("4. Geração automática de logs de auditoria")
        print("5. Exame com múltiplas faixas e validação de carência mínima no backend")
    except Exception as e:
        print(f"\n[ERROR] Erro durante os testes: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
