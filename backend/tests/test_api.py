import os
import tempfile
import pytest
from fastapi.testclient import TestClient

# Use a throwaway DB before importing the app
_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}'

from app.main import app  # noqa: E402


@pytest.fixture(scope='module')
def client():
    with TestClient(app) as c:
        yield c


def _register(client, email, name, pw='secret1'):
    return client.post('/auth/register', json={'email': email, 'name': name, 'password': pw})


def _login(client, email, pw='secret1'):
    r = client.post('/auth/login', data={'username': email, 'password': pw})
    return r.json()['access_token']


def test_health(client):
    assert client.get('/health').json() == {'status': 'ok'}


def test_register_and_login(client):
    r = _register(client, 'alice@x.com', 'Alice')
    assert r.status_code == 200
    assert r.json()['email'] == 'alice@x.com'

    token = _login(client, 'alice@x.com')
    assert token

    r = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 200
    assert r.json()['name'] == 'Alice'


def test_duplicate_register(client):
    _register(client, 'dup@x.com', 'Dup')
    r = _register(client, 'dup@x.com', 'Dup')
    assert r.status_code == 400


def test_full_group_flow(client):
    _register(client, 'bob@x.com', 'Bob')
    token = _login(client, 'bob@x.com')
    h = {'Authorization': f'Bearer {token}'}

    # Create group
    r = client.post('/groups', json={'name': 'Trip'}, headers=h)
    assert r.status_code == 200
    group_id = r.json()['id']

    # Add member (Alice = user 1)
    r = client.post(f'/groups/{group_id}/members', json={'user_id': 1}, headers=h)
    assert r.status_code == 201

    # Add expense: Bob paid 1000, split 500/500
    payload = {
        'description': 'Dinner',
        'paid_by': 2,
        'amount_cents': 1000,
        'splits': [
            {'user_id': 1, 'share_cents': 500},
            {'user_id': 2, 'share_cents': 500},
        ],
    }
    r = client.post(f'/groups/{group_id}/expenses', json=payload, headers=h)
    assert r.status_code == 201

    # Balances
    r = client.get(f'/groups/{group_id}/balances', headers=h)
    assert r.status_code == 200
    balances = {b['user_id']: b['net_cents'] for b in r.json()}
    assert balances[2] == 500    # Bob paid 1000, owes 500 => +500
    assert balances[1] == -500   # Alice paid 0, owes 500 => -500


def test_split_sum_mismatch_rejected(client):
    _register(client, 'carol@x.com', 'Carol')
    token = _login(client, 'carol@x.com')
    h = {'Authorization': f'Bearer {token}'}

    r = client.post('/groups', json={'name': 'Bad'}, headers=h)
    group_id = r.json()['id']

    payload = {
        'description': 'Bad split',
        'paid_by': 1,
        'amount_cents': 1000,
        'splits': [{'user_id': 1, 'share_cents': 400}],  # 400 != 1000
    }
    r = client.post(f'/groups/{group_id}/expenses', json=payload, headers=h)
    assert r.status_code == 422
