from conftest import client, create_user
from app.models.user import UserRole

def test_register_public_first_user(db, client_fixture):
    # clean
    resp = client.post("/api/v1/auth/register-public", json={"email":"first@py.com","password":"First123!@#","nombre":"First","rol":"admin"})
    assert resp.status_code in [200, 403]  # if already users, 403

def test_login_success(admin_user, client_fixture):
    resp = client.post("/api/v1/auth/login", json={"email":"admin@test.com","password":"Admin123!@#"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert "refresh_token" in resp.json()

def test_login_invalid_password(admin_user):
    resp = client.post("/api/v1/auth/login", json={"email":"admin@test.com","password":"wrong"})
    assert resp.status_code == 401

def test_login_nonexistent():
    resp = client.post("/api/v1/auth/login", json={"email":"no@existe.com","password":"pass12345"})
    assert resp.status_code == 401

def test_me_requires_auth():
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code in [401, 403]  # no token

def test_me_with_token(admin_user, admin_token):
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"

def test_refresh_token(admin_user, client_fixture):
    login = client.post("/api/v1/auth/login", json={"email":"admin@test.com","password":"Admin123!@#"})
    refresh = login.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_refresh_invalid():
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid"})
    assert resp.status_code == 401

def test_logout(admin_user, admin_token):
    login = client.post("/api/v1/auth/login", json={"email":"admin@test.com","password":"Admin123!@#"})
    refresh = login.json()["refresh_token"]
    resp = client.post("/api/v1/auth/logout", json={"refresh_token": refresh}, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200

def test_update_me(admin_user, admin_token):
    resp = client.put("/api/v1/auth/me", json={"nombre":"Nuevo Nombre"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["nombre"] == "Nuevo Nombre"

def test_change_password(admin_user, admin_token):
    resp = client.post("/api/v1/auth/change-password", json={"old_password":"Admin123!@#","new_password":"NewPass123!@#"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    # login with new
    resp2 = client.post("/api/v1/auth/login", json={"email":"admin@test.com","password":"NewPass123!@#"})
    assert resp2.status_code == 200

def test_change_password_wrong_old(admin_user, admin_token):
    resp = client.post("/api/v1/auth/change-password", json={"old_password":"wrong","new_password":"NewPass123!@#"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 400

def test_recovery_flow(admin_user):
    resp = client.post("/api/v1/auth/recovery/request", json={"email":"admin@test.com"})
    assert resp.status_code == 200
    code = resp.json().get("code")
    assert code is not None
    resp2 = client.post("/api/v1/auth/recovery/verify", json={"email":"admin@test.com","code":code,"new_password":"Recovered123!@#"})
    assert resp2.status_code == 200
    # login with new
    resp3 = client.post("/api/v1/auth/login", json={"email":"admin@test.com","password":"Recovered123!@#"})
    assert resp3.status_code == 200

def test_recovery_invalid_code(admin_user):
    client.post("/api/v1/auth/recovery/request", json={"email":"admin@test.com"})
    resp = client.post("/api/v1/auth/recovery/verify", json={"email":"admin@test.com","code":"000000","new_password":"NewPass123!@#"})
    assert resp.status_code == 400

def test_list_users_admin(admin_user, admin_token):
    resp = client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_list_users_vendedor_forbidden(vendedor_user, vendedor_token):
    resp = client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {vendedor_token}"})
    assert resp.status_code == 403

def test_register_requires_admin(vendedor_user, vendedor_token):
    resp = client.post("/api/v1/auth/register", json={"email":"new@py.com","password":"New123!@#","nombre":"New","rol":"vendedor"}, headers={"Authorization": f"Bearer {vendedor_token}"})
    assert resp.status_code == 403

def test_register_as_admin(admin_user, admin_token):
    resp = client.post("/api/v1/auth/register", json={"email":"newadmin@py.com","password":"NewAdmin123!@#","nombre":"New","rol":"vendedor"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "newadmin@py.com"

def test_token_expiry_structure(admin_user, admin_token):
    from app.config import settings
    from jose import jwt as jose_jwt
    payload = jose_jwt.decode(admin_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert "exp" in payload
    assert payload["type"] == "access"

def test_duplicate_email_register(admin_user, admin_token):
    resp = client.post("/api/v1/auth/register", json={"email":"admin@test.com","password":"Dup123!@#","nombre":"Dup","rol":"vendedor"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 400
