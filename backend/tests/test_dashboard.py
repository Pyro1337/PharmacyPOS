from conftest import client
from datetime import date, timedelta
def auth(t): return {"Authorization": f"Bearer {t}"}

def test_resumen_hoy(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/resumen", params={"periodo":"hoy"}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert "total_ventas" in resp.json()

def test_resumen_semana(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/resumen", params={"periodo":"semana"}, headers=auth(admin_token))
    assert resp.status_code == 200

def test_resumen_mes(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/resumen", params={"periodo":"mes"}, headers=auth(admin_token))
    assert resp.status_code == 200

def test_ventas_por_periodo_hoy(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/ventas-por-periodo", params={"periodo":"hoy"}, headers=auth(admin_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 24

def test_ventas_por_periodo_semana(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/ventas-por-periodo", params={"periodo":"semana"}, headers=auth(admin_token))
    assert len(resp.json()) == 7

def test_ventas_por_periodo_mes(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/ventas-por-periodo", params={"periodo":"mes"}, headers=auth(admin_token))
    assert resp.status_code == 200

def test_ventas_por_periodo_12meses(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/ventas-por-periodo", params={"periodo":"12meses"}, headers=auth(admin_token))
    assert len(resp.json()) == 12

def test_productos_analisis(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/productos", headers=auth(admin_token))
    assert resp.status_code == 200
    assert "top" in resp.json()

def test_financiero_admin(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/financiero", headers=auth(admin_token))
    assert resp.status_code == 200
    assert "ingresos" in resp.json()

def test_metodos_pago(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/metodos-pago", headers=auth(admin_token))
    assert resp.status_code == 200

def test_clientes_stats(admin_user, admin_token):
    resp = client.get("/api/v1/dashboard/clientes", headers=auth(admin_token))
    assert resp.status_code == 200

def test_dashboard_con_ventas(admin_user, admin_token):
    # crear venta y verificar resumen aumenta
    med = client.post("/api/v1/medicamentos/", json={"codigo":"DASH001","nombre":"DashMed","precio_costo":1000,"precio_venta":5000,"stock_actual":10}, headers=auth(admin_token)).json()
    client.post("/api/v1/ventas/", json={"items":[{"medicamento_id":med["id"],"cantidad":1,"precio_unitario":5000,"descuento_item":0,"subtotal":5000}],"metodo_pago":"efectivo"}, headers=auth(admin_token))
    resp = client.get("/api/v1/dashboard/resumen", params={"periodo":"hoy"}, headers=auth(admin_token))
    assert resp.json()["total_ventas"] >= 5000
