from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta, timezone
from typing import Optional
from ..database import get_db
from ..models.venta import Venta, EstadoVenta, MetodoPago
from ..models.medicamento import Medicamento
from ..models.ingreso_egreso import Ingreso, Egreso
from ..models.cliente import Cliente
from ..models.user import User
from ..dependencies import get_current_user
import calendar

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def parse_range(periodo: str):
    today = date.today()
    if periodo == "hoy":
        return today, today
    elif periodo == "semana":
        return today - timedelta(days=7), today
    elif periodo == "mes":
        return today.replace(day=1), today
    elif periodo == "30dias":
        return today - timedelta(days=30), today
    elif periodo == "12meses":
        return today - timedelta(days=365), today
    else:
        return today, today

@router.get("/resumen")
def resumen(
    periodo: str = Query(default="hoy"),
    vendedor_id: Optional[int] = None,
    categoria: Optional[str] = None,
    metodo_pago: Optional[MetodoPago] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    desde, hasta = parse_range(periodo)
    # Convert to datetime range
    desde_dt = datetime.combine(desde, datetime.min.time(), tzinfo=timezone.utc)
    hasta_dt = datetime.combine(hasta, datetime.max.time(), tzinfo=timezone.utc)

    q = db.query(Venta).filter(Venta.estado == EstadoVenta.completada, Venta.fecha >= desde_dt, Venta.fecha <= hasta_dt)
    if vendedor_id:
        q = q.filter(Venta.vendedor_id == vendedor_id)
    if metodo_pago:
        q = q.filter(Venta.metodo_pago == metodo_pago)
    ventas = q.all()

    # filtrar por categoria si aplica: revisar items
    if categoria:
        med_ids = [m.id for m in db.query(Medicamento).filter(Medicamento.categoria == categoria).all()]
        ventas_filtradas = []
        for v in ventas:
            if any(item.get("medicamento_id") in med_ids for item in v.items):
                ventas_filtradas.append(v)
        ventas = ventas_filtradas

    total = sum(v.total for v in ventas)
    count = len(ventas)
    ticket_promedio = int(total / count) if count else 0

    # productos más vendidos
    prod_counts = {}
    for v in ventas:
        for item in v.items:
            pid = item["medicamento_id"]
            prod_counts[pid] = prod_counts.get(pid, 0) + item["cantidad"]
    top_ids = sorted(prod_counts, key=lambda k: prod_counts[k], reverse=True)[:5]
    top_productos = []
    for pid in top_ids:
        med = db.query(Medicamento).filter(Medicamento.id == pid).first()
        if med:
            top_productos.append({"id": med.id, "nombre": med.nombre, "codigo": med.codigo, "cantidad": prod_counts[pid], "precio_venta": med.precio_venta})

    # menos vendidos
    # productos sin vender
    all_meds = db.query(Medicamento).filter(Medicamento.activo==True).all()
    sin_vender = [m.nombre for m in all_meds if m.id not in prod_counts]

    # recetas vs sin receta
    con_receta = sum(1 for v in ventas if v.receta_id is not None)
    sin_receta = count - con_receta

    return {
        "periodo": periodo,
        "desde": desde.isoformat(),
        "hasta": hasta.isoformat(),
        "total_ventas": total,
        "cantidad_transacciones": count,
        "ticket_promedio": ticket_promedio,
        "top_productos": top_productos,
        "sin_vender": sin_vender[:10],
        "con_receta": con_receta,
        "sin_receta": sin_receta,
        "ventas": [{"fecha": v.fecha.isoformat(), "total": v.total} for v in ventas[:20]]
    }

@router.get("/ventas-por-periodo")
def ventas_por_periodo(
    periodo: str = Query(default="hoy"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    if periodo == "hoy":
        # ventas por hora
        start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        end = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)
        ventas = db.query(Venta).filter(Venta.fecha >= start, Venta.fecha <= end, Venta.estado==EstadoVenta.completada).all()
        horas = {h:0 for h in range(24)}
        for v in ventas:
            h = v.fecha.hour if v.fecha else 0
            horas[h] += v.total
        return [{"hora": f"{h:02d}:00", "total": horas[h]} for h in range(24)]
    elif periodo == "semana":
        start = today - timedelta(days=7)
        data = []
        for i in range(7):
            d = start + timedelta(days=i)
            s = datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc)
            e = datetime.combine(d, datetime.max.time(), tzinfo=timezone.utc)
            total = db.query(func.coalesce(func.sum(Venta.total),0)).filter(Venta.fecha>=s, Venta.fecha<=e, Venta.estado==EstadoVenta.completada).scalar() or 0
            data.append({"fecha": d.strftime("%d/%m"), "total": total})
        return data
    elif periodo == "mes":
        start = today.replace(day=1)
        days = calendar.monthrange(today.year, today.month)[1]
        data = []
        for d in range(1, days+1):
            cur = date(today.year, today.month, d)
            if cur > today:
                break
            s = datetime.combine(cur, datetime.min.time(), tzinfo=timezone.utc)
            e = datetime.combine(cur, datetime.max.time(), tzinfo=timezone.utc)
            total = db.query(func.coalesce(func.sum(Venta.total),0)).filter(Venta.fecha>=s, Venta.fecha<=e, Venta.estado==EstadoVenta.completada).scalar() or 0
            data.append({"fecha": cur.strftime("%d/%m"), "total": total})
        return data
    elif periodo == "12meses":
        data = []
        for i in range(11, -1, -1):
            # compute month
            month = today.month - i
            year = today.year
            while month <= 0:
                month += 12
                year -= 1
            total = db.query(func.coalesce(func.sum(Venta.total),0)).filter(extract('year', Venta.fecha)==year, extract('month', Venta.fecha)==month, Venta.estado==EstadoVenta.completada).scalar() or 0
            data.append({"mes": f"{month:02d}/{year}", "total": total})
        return data
    else:
        return []

@router.get("/productos")
def analisis_productos(
    periodo: str = Query(default="mes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    desde, hasta = parse_range(periodo)
    desde_dt = datetime.combine(desde, datetime.min.time(), tzinfo=timezone.utc)
    hasta_dt = datetime.combine(hasta, datetime.max.time(), tzinfo=timezone.utc)
    ventas = db.query(Venta).filter(Venta.fecha>=desde_dt, Venta.fecha<=hasta_dt, Venta.estado==EstadoVenta.completada).all()
    prod_counts = {}
    for v in ventas:
        for item in v.items:
            pid = item["medicamento_id"]
            prod_counts[pid] = prod_counts.get(pid, {"cantidad":0, "total":0})
            prod_counts[pid]["cantidad"] += item["cantidad"]
            prod_counts[pid]["total"] += item["subtotal"]
    top = sorted(prod_counts.items(), key=lambda x: x[1]["cantidad"], reverse=True)[:10]
    result = []
    for pid, vals in top:
        med = db.query(Medicamento).filter(Medicamento.id==pid).first()
        if med:
            result.append({"id": pid, "nombre": med.nombre, "categoria": med.categoria, "cantidad": vals["cantidad"], "total": vals["total"], "margen": med.margen_ganancia if hasattr(med,'margen_ganancia') else 0})
    # margen por producto
    margenes = db.query(Medicamento).filter(Medicamento.activo==True).limit(10).all()
    margen_data = [{"nombre": m.nombre, "margen": round(((m.precio_venta - m.precio_costo)/m.precio_costo*100),2) if m.precio_costo else 0} for m in margenes]
    # proximos a vencer
    venc = db.query(Medicamento).filter(Medicamento.fecha_vencimiento != None, Medicamento.fecha_vencimiento <= date.today()+timedelta(days=30), Medicamento.activo==True).all()
    venc_data = [{"nombre": m.nombre, "vencimiento": m.fecha_vencimiento.isoformat(), "stock": m.stock_actual} for m in venc]
    return {"top": result, "margen": margen_data, "vencimiento": venc_data}

@router.get("/financiero")
def financiero(
    periodo: str = Query(default="mes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admin/contador
    if current_user.rol not in ["admin", "contador"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Solo contador/admin")
    desde, hasta = parse_range(periodo)
    desde_dt = datetime.combine(desde, datetime.min.time(), tzinfo=timezone.utc)
    hasta_dt = datetime.combine(hasta, datetime.max.time(), tzinfo=timezone.utc)
    ingresos = db.query(func.coalesce(func.sum(Venta.total),0)).filter(Venta.fecha>=desde_dt, Venta.fecha<=hasta_dt, Venta.estado==EstadoVenta.completada).scalar() or 0
    ingresos += db.query(func.coalesce(func.sum(Ingreso.monto),0)).filter(Ingreso.fecha>=desde_dt, Ingreso.fecha<=hasta_dt).scalar() or 0
    egresos = db.query(func.coalesce(func.sum(Egreso.monto),0)).filter(Egreso.fecha>=desde_dt, Egreso.fecha<=hasta_dt).scalar() or 0
    ganancia = ingresos - egresos
    margen = round((ganancia/ingresos*100),2) if ingresos else 0
    # 6 meses historico
    hist = []
    for i in range(5, -1, -1):
        month = date.today().month - i
        year = date.today().year
        while month <=0:
            month+=12
            year-=1
        s = datetime(year, month, 1, tzinfo=timezone.utc)
        # last day
        last_day = calendar.monthrange(year, month)[1]
        e = datetime(year, month, last_day, 23,59,59, tzinfo=timezone.utc)
        inc = db.query(func.coalesce(func.sum(Venta.total),0)).filter(Venta.fecha>=s, Venta.fecha<=e, Venta.estado==EstadoVenta.completada).scalar() or 0
        inc += db.query(func.coalesce(func.sum(Ingreso.monto),0)).filter(Ingreso.fecha>=s, Ingreso.fecha<=e).scalar() or 0
        egr = db.query(func.coalesce(func.sum(Egreso.monto),0)).filter(Egreso.fecha>=s, Egreso.fecha<=e).scalar() or 0
        hist.append({"mes": f"{month:02d}/{year}", "ingresos": inc, "egresos": egr})
    # proyeccion simple promedio ultimos 3 meses
    proy = sum(h["ingresos"] for h in hist[-3:]) / 3 if hist else 0
    return {"ingresos": ingresos, "egresos": egresos, "ganancia": ganancia, "margen": margen, "historico": hist, "proyeccion": int(proy)}

@router.get("/metodos-pago")
def metodos_pago(
    periodo: str = Query(default="mes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    desde, hasta = parse_range(periodo)
    desde_dt = datetime.combine(desde, datetime.min.time(), tzinfo=timezone.utc)
    hasta_dt = datetime.combine(hasta, datetime.max.time(), tzinfo=timezone.utc)
    ventas = db.query(Venta).filter(Venta.fecha>=desde_dt, Venta.fecha<=hasta_dt, Venta.estado==EstadoVenta.completada).all()
    dist = {}
    for v in ventas:
        key = v.metodo_pago.value if hasattr(v.metodo_pago,'value') else str(v.metodo_pago)
        dist[key] = dist.get(key, {"count":0, "total":0})
        dist[key]["count"]+=1
        dist[key]["total"]+=v.total
    pie = [{"metodo": k, "total": v["total"], "count": v["count"]} for k,v in dist.items()]
    return pie

@router.get("/clientes")
def clientes_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # cliente mas frecuente
    from sqlalchemy import desc
    # group by cliente_id
    res = db.query(Venta.cliente_id, func.count(Venta.id).label('cnt'), func.sum(Venta.total).label('total')).filter(Venta.cliente_id != None, Venta.estado==EstadoVenta.completada).group_by(Venta.cliente_id).order_by(desc('cnt')).limit(5).all()
    data = []
    for cliente_id, cnt, total in res:
        cli = db.query(Cliente).filter(Cliente.id==cliente_id).first()
        if cli:
            data.append({"id": cli.id, "nombre": cli.nombre, "cedula": cli.cedula, "transacciones": cnt, "total_gastado": total or 0})
    # cliente que más gastó
    top_gasto = sorted(data, key=lambda x: x["total_gastado"], reverse=True)[:1]
    return {"frecuentes": data, "top_gasto": top_gasto}
