from conftest import client

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}

def test_create_medicamento(admin_user, admin_token):
    resp = client.post("/api/v1/medicamentos/", json={
        "codigo":"TEST001","nombre":"Paracetamol Test","principio_activo":"Paracetamol","presentacion":"Caja x10",
        "precio_costo":5000,"precio_venta":8000,"stock_actual":50,"stock_minimo":5,"categoria":"Analgésicos"
    }, headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert resp.json()["codigo"] == "TEST001"
    assert resp.json()["margen_ganancia"] == 60.0

def test_create_duplicate_codigo(admin_user, admin_token):
    client.post("/api/v1/medicamentos/", json={"codigo":"DUP001","nombre":"A","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    resp = client.post("/api/v1/medicamentos/", json={"codigo":"DUP001","nombre":"B","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    assert resp.status_code == 400

def test_list_medicamentos(admin_user, admin_token):
    resp = client.get("/api/v1/medicamentos/", headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_search_medicamento(admin_user, admin_token):
    client.post("/api/v1/medicamentos/", json={"codigo":"SEARCH001","nombre":"Ibuprofeno Search","precio_costo":7000,"precio_venta":12000}, headers=auth_header(admin_token))
    resp = client.get("/api/v1/medicamentos/", params={"search":"Ibuprofeno"}, headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert any("Ibuprofeno" in m["nombre"] for m in resp.json())

def test_filter_categoria(admin_user, admin_token):
    resp = client.get("/api/v1/medicamentos/", params={"categoria":"Analgésicos"}, headers=auth_header(admin_token))
    assert resp.status_code == 200

def test_filter_requiere_receta(admin_user, admin_token):
    client.post("/api/v1/medicamentos/", json={"codigo":"REC001","nombre":"Controlado","precio_costo":10000,"precio_venta":20000,"requiere_receta":True}, headers=auth_header(admin_token))
    resp = client.get("/api/v1/medicamentos/", params={"requiere_receta": True}, headers=auth_header(admin_token))
    assert all(m["requiere_receta"] for m in resp.json())

def test_get_medicamento(admin_user, admin_token):
    r = client.post("/api/v1/medicamentos/", json={"codigo":"GET001","nombre":"GetTest","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    mid = r.json()["id"]
    resp = client.get(f"/api/v1/medicamentos/{mid}", headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert resp.json()["id"] == mid

def test_get_not_found(admin_user, admin_token):
    resp = client.get("/api/v1/medicamentos/99999", headers=auth_header(admin_token))
    assert resp.status_code == 404

def test_update_medicamento(admin_user, admin_token):
    r = client.post("/api/v1/medicamentos/", json={"codigo":"UPD001","nombre":"UpdTest","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    mid = r.json()["id"]
    resp = client.put(f"/api/v1/medicamentos/{mid}", json={"precio_venta":3000}, headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert resp.json()["precio_venta"] == 3000

def test_update_creates_historial(admin_user, admin_token):
    r = client.post("/api/v1/medicamentos/", json={"codigo":"HIST001","nombre":"HistTest","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    mid = r.json()["id"]
    client.put(f"/api/v1/medicamentos/{mid}", json={"precio_venta":5000}, headers=auth_header(admin_token))
    resp = client.get(f"/api/v1/medicamentos/{mid}/historial", headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_delete_medicamento(admin_user, admin_token):
    r = client.post("/api/v1/medicamentos/", json={"codigo":"DEL001","nombre":"DelTest","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    mid = r.json()["id"]
    resp = client.delete(f"/api/v1/medicamentos/{mid}", headers=auth_header(admin_token))
    assert resp.status_code == 200
    # check desactivado
    resp2 = client.get(f"/api/v1/medicamentos/{mid}", headers=auth_header(admin_token))
    assert resp2.json()["activo"] == False

def test_bajo_stock_alert(admin_user, admin_token):
    client.post("/api/v1/medicamentos/", json={"codigo":"LOW001","nombre":"LowStock","precio_costo":1000,"precio_venta":2000,"stock_actual":2,"stock_minimo":10}, headers=auth_header(admin_token))
    resp = client.get("/api/v1/medicamentos/alertas/bajo-stock", headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert any(m["codigo"]=="LOW001" for m in resp.json())

def test_vencimiento_alert(admin_user, admin_token):
    from datetime import date, timedelta
    venc = (date.today() + timedelta(days=10)).isoformat()
    client.post("/api/v1/medicamentos/", json={"codigo":"VENC001","nombre":"VencTest","precio_costo":1000,"precio_venta":2000,"fecha_vencimiento":venc}, headers=auth_header(admin_token))
    resp = client.get("/api/v1/medicamentos/alertas/vencimiento", headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert any(m["codigo"]=="VENC001" for m in resp.json())

def test_bulk_precio(admin_user, admin_token):
    r1 = client.post("/api/v1/medicamentos/", json={"codigo":"BULK1","nombre":"Bulk1","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    r2 = client.post("/api/v1/medicamentos/", json={"codigo":"BULK2","nombre":"Bulk2","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    ids = [r1.json()["id"], r2.json()["id"]]
    resp = client.post("/api/v1/medicamentos/bulk-precio", json={"ids":ids,"precio_venta":9999}, headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert all(m["precio_venta"]==9999 for m in resp.json())

def test_unauthorized_access():
    resp = client.get("/api/v1/medicamentos/")
    assert resp.status_code in [401, 403]

def test_margen_calculation(admin_user, admin_token):
    resp = client.post("/api/v1/medicamentos/", json={"codigo":"MARG001","nombre":"MargTest","precio_costo":10000,"precio_venta":15000}, headers=auth_header(admin_token))
    assert resp.json()["margen_ganancia"] == 50.0

def test_precio_costo_zero_margin(admin_user, admin_token):
    resp = client.post("/api/v1/medicamentos/", json={"codigo":"ZERO001","nombre":"ZeroCost","precio_costo":0,"precio_venta":1000}, headers=auth_header(admin_token))
    assert resp.json()["margen_ganancia"] == 0

def test_search_by_principio(admin_user, admin_token):
    client.post("/api/v1/medicamentos/", json={"codigo":"PRINC001","nombre":"TestPrincipio","principio_activo":"Amoxicilina","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    resp = client.get("/api/v1/medicamentos/", params={"search":"Amoxicilina"}, headers=auth_header(admin_token))
    assert any("PRINC001" in m["codigo"] for m in resp.json())

def test_search_by_codigo(admin_user, admin_token):
    client.post("/api/v1/medicamentos/", json={"codigo":"CODESEARCH123","nombre":"CodeSearch","precio_costo":1000,"precio_venta":2000}, headers=auth_header(admin_token))
    resp = client.get("/api/v1/medicamentos/", params={"search":"CODESEARCH123"}, headers=auth_header(admin_token))
    assert len(resp.json()) >=1

def test_activo_filter(admin_user, admin_token):
    resp = client.get("/api/v1/medicamentos/", params={"activo": True}, headers=auth_header(admin_token))
    assert all(m["activo"] for m in resp.json())
