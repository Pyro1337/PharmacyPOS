from conftest import client
def auth(t): return {"Authorization": f"Bearer {t}"}

def test_create_ingreso(admin_user, admin_token):
    resp = client.post("/api/v1/finanzas/ingresos", json={"monto":50000,"descripcion":"Venta extra"}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["monto"] == 50000

def test_list_ingresos(admin_user, admin_token):
    resp = client.get("/api/v1/finanzas/ingresos", headers=auth(admin_token))
    assert resp.status_code == 200

def test_create_egreso(admin_user, admin_token):
    resp = client.post("/api/v1/finanzas/egresos", json={"monto":20000,"tipo":"gasto_operativo","descripcion":"Luz"}, headers=auth(admin_token))
    assert resp.status_code == 200

def test_list_egresos(admin_user, admin_token):
    resp = client.get("/api/v1/finanzas/egresos", headers=auth(admin_token))
    assert resp.status_code == 200

def test_resumen_finanzas(admin_user, admin_token):
    client.post("/api/v1/finanzas/ingresos", json={"monto":100000,"descripcion":"Ingreso test"}, headers=auth(admin_token))
    client.post("/api/v1/finanzas/egresos", json={"monto":30000,"tipo":"otro","descripcion":"Egreso test"}, headers=auth(admin_token))
    resp = client.get("/api/v1/finanzas/resumen", headers=auth(admin_token))
    assert resp.status_code == 200
    assert "saldo_neto" in resp.json()

def test_filter_egreso_tipo(admin_user, admin_token):
    client.post("/api/v1/finanzas/egresos", json={"monto":10000,"tipo":"compra_proveedor","descripcion":"Compra"}, headers=auth(admin_token))
    resp = client.get("/api/v1/finanzas/egresos", params={"tipo":"compra_proveedor"}, headers=auth(admin_token))
    assert resp.status_code == 200

def test_search_ingreso(admin_user, admin_token):
    client.post("/api/v1/finanzas/ingresos", json={"monto":12345,"descripcion":"BusquedaEspecial123"}, headers=auth(admin_token))
    resp = client.get("/api/v1/finanzas/ingresos", params={"search":"BusquedaEspecial123"}, headers=auth(admin_token))
    assert any("BusquedaEspecial123" in i["descripcion"] for i in resp.json())

def test_delete_ingreso(admin_user, admin_token):
    r = client.post("/api/v1/finanzas/ingresos", json={"monto":5000,"descripcion":"Borrar"}, headers=auth(admin_token)).json()
    resp = client.delete(f"/api/v1/finanzas/ingresos/{r['id']}", headers=auth(admin_token))
    assert resp.status_code == 200

def test_delete_egreso(admin_user, admin_token):
    r = client.post("/api/v1/finanzas/egresos", json={"monto":5000,"tipo":"otro","descripcion":"BorrarEgr"}, headers=auth(admin_token)).json()
    resp = client.delete(f"/api/v1/finanzas/egresos/{r['id']}", headers=auth(admin_token))
    assert resp.status_code == 200

def test_egreso_con_proveedor(admin_user, admin_token):
    prov = client.post("/api/v1/proveedores/", json={"nombre":"ProvTestFin"}, headers=auth(admin_token)).json()
    resp = client.post("/api/v1/finanzas/egresos", json={"monto":70000,"tipo":"compra_proveedor","descripcion":"Compra prov","proveedor_id":prov["id"]}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["proveedor_id"] == prov["id"]

def test_unauthorized_finanzas():
    resp = client.get("/api/v1/finanzas/ingresos")
    assert resp.status_code in [401, 403]

def test_ingreso_origen_venta(admin_user, admin_token):
    resp = client.post("/api/v1/finanzas/ingresos", json={"monto":5000,"origen":"venta","descripcion":"Venta"}, headers=auth(admin_token))
    assert resp.json()["origen"] == "venta"
