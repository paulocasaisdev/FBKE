"""Teste de fluxo completo de exame: criação, inscrição, início, aprovação e emissão de certificado"""
import pytest
import uuid
from app import app
from services.supabase_service import SupabaseService


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_full_exam_flow(client):
    # 1) Login como admin
    login_res = client.post('/api/auth/login', json={'email': 'admin@grkk.com.br', 'password': 'irrelevant'})
    assert login_res.status_code == 200

    # 2) Criar exame
    exame_payload = {
        'titulo': 'Exame de Faixa - Teste E2',
        'descricao': 'Exame automatizado',
        'data_exame': '2026-07-01',
        'status': 'agendado'
    }
    res = client.post('/api/exames', json=exame_payload)
    assert res.status_code == 201
    exame = res.get_json()
    exame_id = exame.get('id')
    assert exame_id is not None

    # 3) Criar atleta de teste e inscrever um candidato
    atleta_id = str(uuid.uuid4())
    # Inserir profile e atleta com faixa inicial 'Branca'
    SupabaseService.insert('profiles', {
        'id': atleta_id,
        'nome': 'Atleta Teste Fluxo',
        'email': f'atleta-test-{atleta_id[:8]}@example.com',
        'tipo': 'atleta',
        'status': 'ativo'
    })
    SupabaseService.insert('atletas', {
        'id': atleta_id,
        'filial_id': 'dojo-central',
        'email': f'atleta-test-{atleta_id[:8]}@example.com',
        'telefone': '',
        'nome_professor': 'Mestre Teste',
        'faixa': 'Branca',
        'status': 'ativo'
    })
    candidato_payload = {
        'exame_id': exame_id,
        'atleta_id': atleta_id,
        'graduacao_pretendida': 'Amarela'
    }
    res = client.post('/api/exames/candidatos', json=candidato_payload)
    assert res.status_code == 201
    candidato = res.get_json()
    candidato_id = candidato.get('id')
    assert candidato_id is not None

    # 4) Iniciar exame (muda status do exame para em_andamento e dispara distribuir_proximos_fila)
    res = client.patch(f'/api/exames/{exame_id}', json={'status': 'em_andamento'})
    assert res.status_code == 200

    # 5) Verificar que o candidato entrou em andamento
    res = client.get(f'/api/exames/candidatos/{candidato_id}')
    assert res.status_code == 200
    body = res.get_json()
    assert body and 'candidato' in body
    assert body['candidato']['status'] in ['em_andamento', 'pendente', 'aprovado', 'reprovado']

    # 6) Aprovar o candidato
    admin_profile, _ = SupabaseService.get_profile_by_id('6513aa27-452f-462e-8f5a-b3f2052612f9')
    avaliador_id = admin_profile.get('id') if admin_profile else '6513aa27-452f-462e-8f5a-b3f2052612f9'

    res = client.patch(f'/api/exames/candidatos/{candidato_id}', json={'status': 'aprovado', 'avaliado_por': avaliador_id})
    assert res.status_code == 200

    # 7) Conferir que o candidato foi marcado como aprovado
    res = client.get(f'/api/exames/candidatos/{candidato_id}')
    assert res.status_code == 200
    body = res.get_json()
    assert body['candidato']['status'] == 'aprovado'

    # 8) Conferir que o perfil do atleta foi atualizado para a nova faixa
    profile, err = SupabaseService.get_profile_by_id(atleta_id)
    assert err is None
    assert profile is not None
    # Faixa deve ter sido atualizada para a graduacao_pretendida (Amarela)
    assert profile.get('faixa') == 'Amarela'

    # 9) Emitir certificados para o exame
    res = client.post(f'/api/exames/{exame_id}/certificados')
    assert res.status_code == 200
    data = res.get_json()
    assert 'emitidos' in data
    assert data['emitidos'] >= 1
