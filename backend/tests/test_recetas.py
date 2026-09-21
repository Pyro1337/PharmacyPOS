from conftest import client
from datetime import date, timedelta
def auth(t): return {"Authorization": f"Bearer {t}"}

def test_create_receta(admin_user, admin_token):
    resp = client.post("/api/v1/recetas/", json={
        "codigo":"REC001","paciente_nombre":"Juan Perez","paciente_cedula":"12345678",
        "fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()
    }, headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["codigo"] == "REC001"

def test_cedula_invalida(admin_user, admin_token):
    resp = client.post("/api/v1/recetas/", json={
        "codigo":"REC002","paciente_nombre":"Juan","paciente_cedula":"abc",
        "fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()
    }, headers=auth(admin_token))
    assert resp.status_code == 422

def test_duplicate_codigo(admin_user, admin_token):
    client.post("/api/v1/recetas/", json={"codigo":"REC003","paciente_nombre":"A","paciente_cedula":"11111111","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(admin_token))
    resp = client.post("/api/v1/recetas/", json={"codigo":"REC003","paciente_nombre":"B","paciente_cedula":"22222222","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(admin_token))
    assert resp.status_code == 400

def test_fecha_vencimiento_anterior(admin_user, admin_token):
    resp = client.post("/api/v1/recetas/", json={"codigo":"REC004","paciente_nombre":"A","paciente_cedula":"33333333","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()-timedelta(days=1)).isoformat()}, headers=auth(admin_token))
    assert resp.status_code == 400

def test_list_recetas(admin_user, admin_token):
    resp = client.get("/api/v1/recetas/", headers=auth(admin_token))
    assert resp.status_code == 200

def test_get_receta(admin_user, admin_token):
    r = client.post("/api/v1/recetas/", json={"codigo":"REC005","paciente_nombre":"Get","paciente_cedula":"44444444","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(admin_token)).json()
    resp = client.get(f"/api/v1/recetas/{r['id']}", headers=auth(admin_token))
    assert resp.status_code == 200

def test_update_receta_by_farma(farmaceutico_user, farma_token):
    # necesita admin para crear pero farma actualiza
    # crear con farma
    r = client.post("/api/v1/recetas/", json={"codigo":"REC006","paciente_nombre":"Upd","paciente_cedula":"55555555","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(farma_token)).json()
    resp = client.put(f"/api/v1/recetas/{r['id']}", json={"estado":"aprobada"}, headers=auth(farma_token))
    assert resp.status_code == 200
    assert resp.json()["estado"] == "aprobada"

def test_vendedor_cannot_update_estado(vendedor_user, vendedor_token):
    r = client.post("/api/v1/recetas/", json={"codigo":"REC007","paciente_nombre":"Vendedor","paciente_cedula":"66666666","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(vendedor_token)).json()
    resp = client.put(f"/api/v1/recetas/{r['id']}", json={"estado":"aprobada"}, headers=auth(vendedor_token))
    assert resp.status_code in [401, 403]

def test_validar_receta_vigente(admin_user, admin_token):
    r = client.post("/api/v1/recetas/", json={"codigo":"REC008","paciente_nombre":"Val","paciente_cedula":"77777777","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=10)).isoformat()}, headers=auth(admin_token)).json()
    resp = client.post(f"/api/v1/recetas/{r['id']}/validar", headers=auth(admin_token))
    assert resp.json()["valida"] == True

def test_validar_vencida(admin_user, admin_token):
    r = client.post("/api/v1/recetas/", json={"codigo":"REC009","paciente_nombre":"Venc","paciente_cedula":"88888888","fecha_emision": (date.today()-timedelta(days=40)).isoformat(), "fecha_vencimiento": (date.today()-timedelta(days=10)).isoformat()}, headers=auth(admin_token)).json()
    resp = client.post(f"/api/v1/recetas/{r['id']}/validar", headers=auth(admin_token))
    assert resp.json()["valida"] == False

def test_search_receta(admin_user, admin_token):
    client.post("/api/v1/recetas/", json={"codigo":"SEARCHREC001","paciente_nombre":"Searchable","paciente_cedula":"12341234","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(admin_token))
    resp = client.get("/api/v1/recetas/", params={"search":"Searchable"}, headers=auth(admin_token))
    assert any("SEARCHREC001" in r["codigo"] for r in resp.json())

def test_delete_receta(admin_user, admin_token):
    r = client.post("/api/v1/recetas/", json={"codigo":"RECDEL001","paciente_nombre":"Del","paciente_cedula":"99999999","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(admin_token)).json()
    resp = client.delete(f"/api/v1/recetas/{r['id']}", headers=auth(admin_token))
    assert resp.status_code == 200

def test_receta_con_medicamentos(admin_user, admin_token):
    med = client.post("/api/v1/medicamentos/", json={"codigo":"RECMED001","nombre":"RecMed","precio_costo":1000,"precio_venta":2000}, headers=auth(admin_token)).json()
    resp = client.post("/api/v1/recetas/", json={"codigo":"REC010","paciente_nombre":"ConMed","paciente_cedula":"11223344","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat(), "medicamento_ids":[med["id"]]}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert len(resp.json()["medicamentos"]) == 1

def test_rechazar_receta(farmaceutico_user, farma_token):
    r = client.post("/api/v1/recetas/", json={"codigo":"REC011","paciente_nombre":"Rech","paciente_cedula":"12212212","fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat()}, headers=auth(farma_token)).json()
    resp = client.put(f"/api/v1/recetas/{r['id']}", json={"estado":"rechazada"}, headers=auth(farma_token))
    assert resp.json()["estado"] == "rechazada"

def test_unauthorized_access():
    resp = client.get("/api/v1/recetas/")
    assert resp.status_code in [401, 403]
