from conftest import client
def auth(t): return {"Authorization": f"Bearer {t}"}

def test_abrir_caja(admin_user, admin_token):
    resp = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":50000,"turno":"manana"}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["saldo_inicial"] == 50000

def test_no_doble_caja_mismo_dia(admin_user, admin_token):
    client.post("/api/v1/cajas/abrir", json={"saldo_inicial":50000}, headers=auth(admin_token))
    resp = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":30000}, headers=auth(admin_token))
    assert resp.status_code == 400

def test_caja_actual(admin_user, admin_token):
    client.post("/api/v1/cajas/abrir", json={"saldo_inicial":10000}, headers=auth(admin_token))
    resp = client.get("/api/v1/cajas/actual", headers=auth(admin_token))
    assert resp.status_code == 200

def test_caja_actual_sin_caja(vendedor_user, vendedor_token):
    resp = client.get("/api/v1/cajas/actual", headers=auth(vendedor_token))
    assert resp.status_code == 404

def test_movimiento_manual(admin_user, admin_token):
    caja = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":50000}, headers=auth(admin_token)).json()
    resp = client.post(f"/api/v1/cajas/{caja['id']}/movimiento", json={"tipo":"gasto","monto":-5000,"descripcion":"Luz"}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert len(resp.json()["movimientos"]) == 1

def test_movimiento_caja_cerrada_falla(admin_user, admin_token):
    caja = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":50000}, headers=auth(admin_token)).json()
    client.post(f"/api/v1/cajas/{caja['id']}/cerrar", json={"saldo_real":50000}, headers=auth(admin_token))
    resp = client.post(f"/api/v1/cajas/{caja['id']}/movimiento", json={"tipo":"gasto","monto":-1000,"descripcion":"Test"}, headers=auth(admin_token))
    assert resp.status_code == 400

def test_cerrar_caja(admin_user, admin_token):
    caja = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":50000}, headers=auth(admin_token)).json()
    resp = client.post(f"/api/v1/cajas/{caja['id']}/cerrar", json={"saldo_real":50500}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["estado"] == "cerrada"
    assert resp.json()["diferencia"] == 500

def test_cerrar_caja_con_ventas(admin_user, admin_token):
    caja = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":50000}, headers=auth(admin_token)).json()
    # crear venta efectivo
    med = client.post("/api/v1/medicamentos/", json={"codigo":"CAJAV001","nombre":"CajaMed","precio_costo":5000,"precio_venta":10000,"stock_actual":10}, headers=auth(admin_token)).json()
    client.post("/api/v1/ventas/", json={"items":[{"medicamento_id":med["id"],"cantidad":2,"precio_unitario":10000,"descuento_item":0,"subtotal":20000}],"metodo_pago":"efectivo"}, headers=auth(admin_token))
    resp = client.post(f"/api/v1/cajas/{caja['id']}/cerrar", json={"saldo_real":70000}, headers=auth(admin_token))
    # esperado 50000 + 20000 =70000
    assert resp.json()["saldo_esperado"] == 70000
    assert resp.json()["diferencia"] == 0

def test_list_cajas(admin_user, admin_token):
    resp = client.get("/api/v1/cajas/", headers=auth(admin_token))
    assert resp.status_code == 200

def test_get_caja(admin_user, admin_token):
    caja = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":10000}, headers=auth(admin_token)).json()
    resp = client.get(f"/api/v1/cajas/{caja['id']}", headers=auth(admin_token))
    assert resp.status_code == 200

def test_pdf_descarga(admin_user, admin_token):
    caja = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":10000}, headers=auth(admin_token)).json()
    resp = client.get(f"/api/v1/cajas/{caja['id']}/pdf", headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"

def test_vendedor_solo_ve_su_caja(vendedor_user, vendedor_token, admin_user, admin_token):
    # admin crea caja
    caja_admin = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":10000}, headers=auth(admin_token)).json()
    # vendedor crea su caja
    caja_vend = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":20000}, headers=auth(vendedor_token)).json()
    # vendedor lista -> solo su caja
    resp = client.get("/api/v1/cajas/", headers=auth(vendedor_token))
    assert all(c["vendedor_id"] == vendedor_user.id for c in resp.json())

def test_cerrar_caja_idor(vendedor_user, vendedor_token, admin_user, admin_token):
    caja = client.post("/api/v1/cajas/abrir", json={"saldo_inicial":10000}, headers=auth(admin_token)).json()
    # vendedor intenta cerrar caja de admin -> 403
    resp = client.post(f"/api/v1/cajas/{caja['id']}/cerrar", json={"saldo_real":10000}, headers=auth(vendedor_token))
    assert resp.status_code in [401, 403]

def test_unauthorized():
    resp = client.get("/api/v1/cajas/")
    assert resp.status_code in [401, 403]
