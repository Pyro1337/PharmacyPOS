from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, timedelta, timezone, datetime

from ..database import get_db
from ..models.medicamento import Medicamento, HistorialPrecio
from ..models.user import User
from ..schemas.medicamento import MedicamentoCreate, MedicamentoUpdate, MedicamentoResponse, BulkPriceUpdate
from ..dependencies import get_current_user

router = APIRouter(prefix="/medicamentos", tags=["medicamentos"])

def to_response(m: Medicamento):
    data = MedicamentoResponse.model_validate(m)
    # manually compute margin
    if m.precio_costo and m.precio_costo > 0:
        data.margen_ganancia = round(((m.precio_venta - m.precio_costo)/m.precio_costo)*100, 2)
    else:
        data.margen_ganancia = 0
    return data

@router.post("/", response_model=MedicamentoResponse)
def create_medicamento(data: MedicamentoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Medicamento).filter(Medicamento.codigo == data.codigo).first():
        raise HTTPException(status_code=400, detail="Código ya existe")
    med = Medicamento(**data.model_dump(), creado_por=current_user.id)
    db.add(med)
    db.commit()
    db.refresh(med)
    return to_response(med)

@router.get("/", response_model=List[MedicamentoResponse])
def list_medicamentos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = None,
    categoria: Optional[str] = None,
    proveedor_id: Optional[int] = None,
    requiere_receta: Optional[bool] = None,
    activo: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
):
    q = db.query(Medicamento)
    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(Medicamento.nombre.ilike(pattern), Medicamento.codigo.ilike(pattern), Medicamento.principio_activo.ilike(pattern)))
    if categoria:
        q = q.filter(Medicamento.categoria == categoria)
    if proveedor_id is not None:
        q = q.filter(Medicamento.proveedor_id == proveedor_id)
    if requiere_receta is not None:
        q = q.filter(Medicamento.requiere_receta == requiere_receta)
    if activo is not None:
        q = q.filter(Medicamento.activo == activo)
    meds = q.offset(skip).limit(limit).all()
    return [to_response(m) for m in meds]

@router.get("/alertas/bajo-stock", response_model=List[MedicamentoResponse])
def alertas_bajo_stock(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meds = db.query(Medicamento).filter(Medicamento.stock_actual < Medicamento.stock_minimo, Medicamento.activo == True).all()
    return [to_response(m) for m in meds]

@router.get("/alertas/vencimiento", response_model=List[MedicamentoResponse])
def alertas_vencimiento(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    limit_date = date.today() + timedelta(days=30)
    meds = db.query(Medicamento).filter(Medicamento.fecha_vencimiento != None, Medicamento.fecha_vencimiento <= limit_date, Medicamento.activo == True).all()
    return [to_response(m) for m in meds]

@router.get("/{med_id}", response_model=MedicamentoResponse)
def get_medicamento(med_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medicamento).filter(Medicamento.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    return to_response(med)

@router.put("/{med_id}", response_model=MedicamentoResponse)
def update_medicamento(med_id: int, data: MedicamentoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medicamento).filter(Medicamento.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    old_costo = med.precio_costo
    old_venta = med.precio_venta
    update_data = data.model_dump(exclude_unset=True)
    price_changed = False
    if "precio_costo" in update_data and update_data["precio_costo"] != old_costo:
        price_changed = True
    if "precio_venta" in update_data and update_data["precio_venta"] != old_venta:
        price_changed = True
    for k, v in update_data.items():
        setattr(med, k, v)
    if price_changed:
        hist = HistorialPrecio(
            medicamento_id=med.id,
            precio_costo_anterior=old_costo,
            precio_venta_anterior=old_venta,
            precio_costo_nuevo=med.precio_costo,
            precio_venta_nuevo=med.precio_venta,
            cambiado_por=current_user.id
        )
        db.add(hist)
    db.commit()
    db.refresh(med)
    return to_response(med)

@router.delete("/{med_id}")
def delete_medicamento(med_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medicamento).filter(Medicamento.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    # Soft delete -> activo False
    med.activo = False
    db.commit()
    return {"msg": "Medicamento desactivado"}

@router.post("/bulk-precio", response_model=List[MedicamentoResponse])
def bulk_precio(data: BulkPriceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meds = db.query(Medicamento).filter(Medicamento.id.in_(data.ids)).all()
    for med in meds:
        old_costo = med.precio_costo
        old_venta = med.precio_venta
        if data.precio_venta is not None:
            med.precio_venta = data.precio_venta
        if data.precio_costo is not None:
            med.precio_costo = data.precio_costo
        hist = HistorialPrecio(
            medicamento_id=med.id,
            precio_costo_anterior=old_costo,
            precio_venta_anterior=old_venta,
            precio_costo_nuevo=med.precio_costo,
            precio_venta_nuevo=med.precio_venta,
            cambiado_por=current_user.id
        )
        db.add(hist)
    db.commit()
    for m in meds:
        db.refresh(m)
    return [to_response(m) for m in meds]

@router.get("/{med_id}/historial")
def historial(med_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medicamento).filter(Medicamento.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    hist = db.query(HistorialPrecio).filter(HistorialPrecio.medicamento_id == med_id).order_by(HistorialPrecio.created_at.desc()).all()
    return hist
