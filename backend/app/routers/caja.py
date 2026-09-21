from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timezone
from ..database import get_db
from ..models.caja import CajaDiaria, TurnoCaja, EstadoCaja
from ..models.venta import Venta, EstadoVenta, MetodoPago
from ..models.user import User
from ..schemas.caja import CajaAbrir, CajaCerrar, MovimientoManual, CajaResponse
from ..dependencies import get_current_user
from ..services.pdf_service import generate_cierre_pdf
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/cajas", tags=["cajas"])

@router.post("/abrir", response_model=CajaResponse)
def abrir_caja(data: CajaAbrir, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hoy = date.today()
    # verificar si ya tiene caja abierta hoy
    existing = db.query(CajaDiaria).filter(CajaDiaria.vendedor_id == current_user.id, CajaDiaria.fecha == hoy, CajaDiaria.estado == EstadoCaja.abierta).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya tienes una caja abierta hoy")
    max_num = db.query(func.max(CajaDiaria.numero_caja)).filter(CajaDiaria.fecha == hoy).scalar() or 0
    caja = CajaDiaria(
        fecha=hoy,
        numero_caja=max_num+1,
        vendedor_id=current_user.id,
        turno=data.turno,
        saldo_inicial=data.saldo_inicial,
        notas_apertura=data.notas_apertura,
        estado=EstadoCaja.abierta,
        movimientos=[]
    )
    db.add(caja)
    db.commit()
    db.refresh(caja)
    return caja

@router.get("/actual", response_model=CajaResponse)
def caja_actual(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hoy = date.today()
    caja = db.query(CajaDiaria).filter(CajaDiaria.vendedor_id == current_user.id, CajaDiaria.fecha == hoy, CajaDiaria.estado == EstadoCaja.abierta).first()
    if not caja:
        raise HTTPException(status_code=404, detail="No hay caja abierta")
    # calcular saldo esperado en vivo
    ventas_efectivo = db.query(func.coalesce(func.sum(Venta.total),0)).filter(
        Venta.vendedor_id == current_user.id,
        func.date(Venta.fecha) == hoy,
        Venta.estado == EstadoVenta.completada,
        Venta.metodo_pago == MetodoPago.efectivo
    ).scalar()
    movimientos_total = sum(m["monto"] for m in (caja.movimientos or []))
    saldo_esperado = caja.saldo_inicial + (ventas_efectivo or 0) + movimientos_total
    # include mixto: sumar parte efectivo de mixto
    # simplificado: solo efectivo puro
    caja.saldo_esperado = saldo_esperado
    return caja

@router.post("/{caja_id}/movimiento", response_model=CajaResponse)
def agregar_movimiento(caja_id: int, data: MovimientoManual, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    caja = db.query(CajaDiaria).filter(CajaDiaria.id == caja_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    if caja.estado == EstadoCaja.cerrada:
        raise HTTPException(status_code=400, detail="Caja ya cerrada")
    if caja.vendedor_id != current_user.id and current_user.rol not in ["admin", "contador"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    movs = caja.movimientos or []
    movs.append({"tipo": data.tipo, "monto": data.monto, "descripcion": data.descripcion, "fecha": datetime.now(timezone.utc).isoformat()})
    caja.movimientos = movs
    # force update
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(caja, "movimientos")
    db.commit()
    db.refresh(caja)
    return caja

@router.post("/{caja_id}/cerrar", response_model=CajaResponse)
def cerrar_caja(caja_id: int, data: CajaCerrar, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    caja = db.query(CajaDiaria).filter(CajaDiaria.id == caja_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    if caja.estado == EstadoCaja.cerrada:
        raise HTTPException(status_code=400, detail="Caja ya cerrada")
    if caja.vendedor_id != current_user.id and current_user.rol not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    hoy = caja.fecha
    ventas_efectivo = db.query(func.coalesce(func.sum(Venta.total),0)).filter(
        func.date(Venta.fecha) == hoy,
        Venta.vendedor_id == caja.vendedor_id,
        Venta.estado == EstadoVenta.completada,
        Venta.metodo_pago == MetodoPago.efectivo
    ).scalar()
    # ventas mixto con detalle efectivo
    ventas_mixto = db.query(Venta).filter(func.date(Venta.fecha)==hoy, Venta.vendedor_id==caja.vendedor_id, Venta.metodo_pago==MetodoPago.mixto, Venta.estado==EstadoVenta.completada).all()
    efectivo_mixto = sum((v.detalle_pago or {}).get("efectivo",0) for v in ventas_mixto)
    movimientos_total = sum(m["monto"] for m in (caja.movimientos or []))
    saldo_esperado = caja.saldo_inicial + (ventas_efectivo or 0) + efectivo_mixto + movimientos_total
    caja.saldo_esperado = saldo_esperado
    caja.saldo_real = data.saldo_real
    caja.diferencia = data.saldo_real - saldo_esperado
    caja.notas_cierre = data.notas_cierre
    caja.estado = EstadoCaja.cerrada
    caja.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(caja)
    return caja

@router.get("/", response_model=List[CajaResponse])
def list_cajas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), skip: int=0, limit: int=50):
    q = db.query(CajaDiaria).order_by(CajaDiaria.fecha.desc())
    if current_user.rol not in ["admin", "contador"]:
        q = q.filter(CajaDiaria.vendedor_id == current_user.id)
    return q.offset(skip).limit(limit).all()

@router.get("/{caja_id}", response_model=CajaResponse)
def get_caja(caja_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    caja = db.query(CajaDiaria).filter(CajaDiaria.id == caja_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    if caja.vendedor_id != current_user.id and current_user.rol not in ["admin", "contador"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    return caja

@router.get("/{caja_id}/pdf")
def descargar_pdf(caja_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    caja = db.query(CajaDiaria).filter(CajaDiaria.id == caja_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    if caja.vendedor_id != current_user.id and current_user.rol not in ["admin", "contador"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    # obtener ventas del día para PDF
    ventas = db.query(Venta).filter(func.date(Venta.fecha)==caja.fecha, Venta.vendedor_id==caja.vendedor_id, Venta.estado==EstadoVenta.completada).all()
    from ..config import settings
    vendedor = db.query(User).filter(User.id==caja.vendedor_id).first()
    pdf_bytes = generate_cierre_pdf(caja, ventas, vendedor.nombre if vendedor else "Desconocido", settings.FARMACIA_NOMBRE)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=cierre_caja_{caja.id}.pdf"})
