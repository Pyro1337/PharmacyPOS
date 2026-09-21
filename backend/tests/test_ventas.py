from conftest import client
from datetime import date, timedelta

def auth(t): return {"Authorization": f"Bearer {t}"}

def create_med(token, codigo="MEDV001", stock=50, requiere=False, precio=10000):
    client.post("/api/v1/medicamentos/", json={"codigo":codigo,"nombre":f"Med {codigo}","precio_costo":5000,"precio_venta":precio,"stock_actual":stock,"requiere_receta":requiere}, headers=auth(token))

def test_create_venta_simple(admin_user, admin_token):
    create_med(admin_token, "VTA001", stock=10)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA001"}, headers=auth(admin_token)).json()[0]
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":2,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]*2}],
        "metodo_pago":"efectivo"
    }, headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["total"] == med["precio_venta"]*2

def test_venta_stock_insuficiente(admin_user, admin_token):
    create_med(admin_token, "VTA002", stock=1)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA002"}, headers=auth(admin_token)).json()[0]
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":5,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]*5}],
        "metodo_pago":"efectivo"
    }, headers=auth(admin_token))
    assert resp.status_code == 400

def test_venta_requiere_receta_sin_receta(admin_user, admin_token):
    create_med(admin_token, "VTA003", stock=10, requiere=True)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA003"}, headers=auth(admin_token)).json()[0]
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],
        "metodo_pago":"efectivo"
    }, headers=auth(admin_token))
    assert resp.status_code == 400

def test_venta_con_receta_valida(admin_user, admin_token):
    create_med(admin_token, "VTA004", stock=10, requiere=True)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA004"}, headers=auth(admin_token)).json()[0]
    # crear receta
    receta = client.post("/api/v1/recetas/", json={
        "codigo":"RECV001","paciente_nombre":"Juan","paciente_cedula":"12345678",
        "fecha_emision": date.today().isoformat(), "fecha_vencimiento": (date.today()+timedelta(days=30)).isoformat(),
        "medicamento_ids":[med["id"]]
    }, headers=auth(admin_token)).json()
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],
        "metodo_pago":"efectivo","receta_id":receta["id"]
    }, headers=auth(admin_token))
    assert resp.status_code == 200

def test_venta_receta_vencida_falla(admin_user, admin_token):
    create_med(admin_token, "VTA005", stock=10, requiere=True)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA005"}, headers=auth(admin_token)).json()[0]
    receta = client.post("/api/v1/recetas/", json={
        "codigo":"RECV002","paciente_nombre":"Ana","paciente_cedula":"23456789",
        "fecha_emision": (date.today()-timedelta(days=40)).isoformat(), "fecha_vencimiento": (date.today()-timedelta(days=10)).isoformat(),
        "medicamento_ids":[med["id"]]
    }, headers=auth(admin_token)).json()
    # intentar aprobar pero ya vencida
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],
        "metodo_pago":"efectivo","receta_id":receta["id"]
    }, headers=auth(admin_token))
    assert resp.status_code == 400

def test_venta_descuento(admin_user, admin_token):
    create_med(admin_token, "VTA006", stock=10)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA006"}, headers=auth(admin_token)).json()[0]
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":10000,"descuento_item":0,"subtotal":10000}],
        "descuento_total_porcentaje":10,"metodo_pago":"efectivo"
    }, headers=auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["monto_descuento"] == 1000
    assert resp.json()["total"] == 9000

def test_venta_actualiza_stock(admin_user, admin_token):
    create_med(admin_token, "VTA007", stock=10)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA007"}, headers=auth(admin_token)).json()[0]
    client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":3,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]*3}],
        "metodo_pago":"efectivo"
    }, headers=auth(admin_token))
    med2 = client.get(f"/api/v1/medicamentos/{med['id']}", headers=auth(admin_token)).json()
    assert med2["stock_actual"] == 7

def test_venta_list(admin_user, admin_token):
    resp = client.get("/api/v1/ventas/", headers=auth(admin_token))
    assert resp.status_code == 200

def test_venta_con_mixto(admin_user, admin_token):
    create_med(admin_token, "VTA008", stock=10)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA008"}, headers=auth(admin_token)).json()[0]
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],
        "metodo_pago":"mixto","detalle_pago":{"efectivo":5000,"tarjeta":5000}
    }, headers=auth(admin_token))
    assert resp.status_code == 200

def test_venta_con_cliente_descuento(admin_user, admin_token):
    create_med(admin_token, "VTA009", stock=10)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA009"}, headers=auth(admin_token)).json()[0]
    cli = client.post("/api/v1/clientes/", json={"nombre":"Cliente Desc","cedula":"87654321","descuento":10}, headers=auth(admin_token)).json()
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":10000,"descuento_item":0,"subtotal":10000}],
        "metodo_pago":"efectivo","cliente_id":cli["id"]
    }, headers=auth(admin_token))
    assert resp.status_code == 200
    # descuento cliente aplicado
    assert resp.json()["total"] < 10000

def test_venta_carrito_vacio(admin_user, admin_token):
    resp = client.post("/api/v1/ventas/", json={"items":[],"metodo_pago":"efectivo"}, headers=auth(admin_token))
    assert resp.status_code == 400

def test_venta_inactivo_falla(admin_user, admin_token):
    create_med(admin_token, "VTA010", stock=10)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA010"}, headers=auth(admin_token)).json()[0]
    # desactivar
    client.delete(f"/api/v1/medicamentos/{med['id']}", headers=auth(admin_token))
    resp = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],
        "metodo_pago":"efectivo"
    }, headers=auth(admin_token))
    assert resp.status_code == 400

def test_anular_venta(admin_user, admin_token):
    create_med(admin_token, "VTA011", stock=10)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA011"}, headers=auth(admin_token)).json()[0]
    venta = client.post("/api/v1/ventas/", json={
        "items":[{"medicamento_id":med["id"],"cantidad":2,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]*2}],
        "metodo_pago":"efectivo"
    }, headers=auth(admin_token)).json()
    resp = client.post(f"/api/v1/ventas/{venta['id']}/anular", headers=auth(admin_token))
    assert resp.status_code == 200
    # stock devuelto
    med2 = client.get(f"/api/v1/medicamentos/{med['id']}", headers=auth(admin_token)).json()
    assert med2["stock_actual"] == 10

def test_venta_todos_metodos_pago(admin_user, admin_token):
    for metodo in ["efectivo","tarjeta_debito","tarjeta_credito","transferencia","cheque"]:
        create_med(admin_token, f"VTA_MP_{metodo}", stock=5)
        med = client.get("/api/v1/medicamentos/", params={"search":f"VTA_MP_{metodo}"}, headers=auth(admin_token)).json()[0]
        resp = client.post("/api/v1/ventas/", json={
            "items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],
            "metodo_pago":metodo
        }, headers=auth(admin_token))
        assert resp.status_code == 200

def test_venta_numero_incremental(admin_user, admin_token):
    create_med(admin_token, "VTA012", stock=20)
    med = client.get("/api/v1/medicamentos/", params={"search":"VTA012"}, headers=auth(admin_token)).json()[0]
    v1 = client.post("/api/v1/ventas/", json={"items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],"metodo_pago":"efectivo"}, headers=auth(admin_token)).json()
    v2 = client.post("/api/v1/ventas/", json={"items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":med["precio_venta"],"descuento_item":0,"subtotal":med["precio_venta"]}],"metodo_pago":"efectivo"}, headers=auth(admin_token)).json()
    assert v2["numero_venta"] == v1["numero_venta"] + 1
