from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from ..database import get_db
from ..models.ingreso_egreso import Ingreso, Egreso, TipoIngreso, TipoEgreso
from ..models.user import User
from ..schemas.ingreso_egreso import IngresoCreate, EgresoCreate, IngresoResponse, EgresoResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/finanzas", tags=["finanzas"])

@router.post("/ingresos", response_model=IngresoResponse)
def create_ingreso(data: IngresoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ing = Ingreso(monto=data.monto, origen=data.origen, descripcion=data.descripcion, metodo_registro=data.metodo_registro, creado_por=current_user.id)
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return ing

@router.get("/ingresos", response_model=List[IngresoResponse])
def list_ingresos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    search: Optional[str] = None
):
    q = db.query(Ingreso).order_by(Ingreso.fecha.desc())
    if desde:
        q = q.filter(Ingreso.fecha >= desde)
    if hasta:
        q = q.filter(Ingreso.fecha <= hasta)
    if search:
        q = q.filter(Ingreso.descripcion.ilike(f"%{search}%"))
    return q.all()

@router.post("/egresos", response_model=EgresoResponse)
def create_egreso(data: EgresoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    egr = Egreso(monto=data.monto, tipo=data.tipo, descripcion=data.descripcion, proveedor_id=data.proveedor_id, comprobante=data.comprobante, creado_por=current_user.id)
    db.add(egr)
    db.commit()
    db.refresh(egr)
    return egr

@router.get("/egresos", response_model=List[EgresoResponse])
def list_egresos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    tipo: Optional[TipoEgreso] = None,
    search: Optional[str] = None
):
    q = db.query(Egreso).order_by(Egreso.fecha.desc())
    if desde:
        q = q.filter(Egreso.fecha >= desde)
    if hasta:
        q = q.filter(Egreso.fecha <= hasta)
    if tipo:
        q = q.filter(Egreso.tipo == tipo)
    if search:
        q = q.filter(Egreso.descripcion.ilike(f"%{search}%"))
    return q.all()

@router.get("/resumen")
def resumen(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None
):
    q_ing = db.query(func.coalesce(func.sum(Ingreso.monto),0))
    q_egr = db.query(func.coalesce(func.sum(Egreso.monto),0))
    if desde:
        q_ing = q_ing.filter(Ingreso.fecha >= desde)
        q_egr = q_egr.filter(Egreso.fecha >= desde)
    if hasta:
        q_ing = q_ing.filter(Ingreso.fecha <= hasta)
        q_egr = q_egr.filter(Egreso.fecha <= hasta)
    total_ing = q_ing.scalar() or 0
    total_egr = q_egr.scalar() or 0
    return {"total_ingresos": total_ing, "total_egresos": total_egr, "saldo_neto": total_ing - total_egr}

@router.delete("/ingresos/{ing_id}")
def delete_ingreso(ing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ing = db.query(Ingreso).filter(Ingreso.id==ing_id).first()
    if not ing:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    db.delete(ing)
    db.commit()
    return {"msg": "Ingreso eliminado"}

@router.delete("/egresos/{egr_id}")
def delete_egreso(egr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    egr = db.query(Egreso).filter(Egreso.id==egr_id).first()
    if not egr:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Egreso no encontrado")
    db.delete(egr)
    db.commit()
    return {"msg": "Egreso eliminado"}
