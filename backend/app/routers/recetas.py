from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timezone
from ..database import get_db
from ..models.receta import Receta, EstadoReceta
from ..models.medicamento import Medicamento
from ..models.user import User, UserRole
from ..schemas.receta import RecetaCreate, RecetaUpdate, RecetaResponse
from ..dependencies import get_current_user
import re

router = APIRouter(prefix="/recetas", tags=["recetas"])

def validate_cedula(cedula: str):
    return bool(re.match(r"^\d{6,8}$", cedula))

@router.post("/", response_model=RecetaResponse)
def create_receta(data: RecetaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not validate_cedula(data.paciente_cedula):
        raise HTTPException(status_code=400, detail="Cédula paciente inválida (6-8 dígitos)")
    if db.query(Receta).filter(Receta.codigo == data.codigo).first():
        raise HTTPException(status_code=400, detail="Código receta ya existe")
    if data.fecha_vencimiento < data.fecha_emision:
        raise HTTPException(status_code=400, detail="Fecha vencimiento debe ser posterior a emisión")
    receta = Receta(
        codigo=data.codigo,
        paciente_nombre=data.paciente_nombre,
        paciente_cedula=data.paciente_cedula,
        paciente_fecha_nacimiento=data.paciente_fecha_nacimiento,
        prescriptor_nombre=data.prescriptor_nombre,
        prescriptor_cedula=data.prescriptor_cedula,
        prescriptor_especialidad=data.prescriptor_especialidad,
        fecha_emision=data.fecha_emision,
        fecha_vencimiento=data.fecha_vencimiento,
        notas=data.notas,
        archivo_adjunto=data.archivo_adjunto,
        usuario_id=current_user.id,
        estado=EstadoReceta.pendiente
    )
    if data.fecha_vencimiento < date.today():
        receta.estado = EstadoReceta.vencida
    db.add(receta)
    db.flush()
    # attach medicamentos
    if data.medicamento_ids:
        meds = db.query(Medicamento).filter(Medicamento.id.in_(data.medicamento_ids)).all()
        receta.medicamentos = meds
    db.commit()
    db.refresh(receta)
    return to_response(receta, db)

def to_response(receta: Receta, db: Session):
    meds = []
    for m in receta.medicamentos:
        meds.append({"id": m.id, "nombre": m.nombre, "codigo": m.codigo})
    return RecetaResponse(
        id=receta.id,
        codigo=receta.codigo,
        paciente_nombre=receta.paciente_nombre,
        paciente_cedula=receta.paciente_cedula,
        paciente_fecha_nacimiento=receta.paciente_fecha_nacimiento,
        prescriptor_nombre=receta.prescriptor_nombre,
        prescriptor_cedula=receta.prescriptor_cedula,
        prescriptor_especialidad=receta.prescriptor_especialidad,
        fecha_emision=receta.fecha_emision,
        fecha_vencimiento=receta.fecha_vencimiento,
        archivo_adjunto=receta.archivo_adjunto,
        estado=receta.estado,
        notas=receta.notas,
        usuario_id=receta.usuario_id,
        created_at=receta.created_at,
        updated_at=receta.updated_at,
        medicamentos=meds
    )

@router.get("/", response_model=List[RecetaResponse])
def list_recetas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = None,
    estado: Optional[EstadoReceta] = None,
):
    q = db.query(Receta)
    if search:
        pattern = f"%{search}%"
        q = q.filter((Receta.codigo.ilike(pattern)) | (Receta.paciente_nombre.ilike(pattern)) | (Receta.paciente_cedula.ilike(pattern)))
    if estado:
        q = q.filter(Receta.estado == estado)
    recetas = q.order_by(Receta.created_at.desc()).all()
    return [to_response(r, db) for r in recetas]

@router.get("/{receta_id}", response_model=RecetaResponse)
def get_receta(receta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return to_response(receta, db)

@router.put("/{receta_id}", response_model=RecetaResponse)
def update_receta(receta_id: int, data: RecetaUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    # solo farmaceutico o admin puede cambiar estado
    if data.estado and current_user.rol not in [UserRole.farmaceutico, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Solo farmacéutico o admin puede cambiar estado")
    if data.estado:
        receta.estado = data.estado
    if data.notas is not None:
        receta.notas = data.notas
    if data.medicamento_ids is not None:
        meds = db.query(Medicamento).filter(Medicamento.id.in_(data.medicamento_ids)).all()
        receta.medicamentos = meds
    db.commit()
    db.refresh(receta)
    return to_response(receta, db)

@router.post("/{receta_id}/validar")
def validar_receta(receta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    if receta.fecha_vencimiento < date.today():
        receta.estado = EstadoReceta.vencida
        db.commit()
        return {"valida": False, "motivo": "Receta vencida"}
    if receta.estado == EstadoReceta.vencida:
        return {"valida": False, "motivo": "Receta vencida"}
    if receta.estado == EstadoReceta.rechazada:
        return {"valida": False, "motivo": "Receta rechazada"}
    return {"valida": True, "estado": receta.estado, "vencimiento": receta.fecha_vencimiento}

@router.delete("/{receta_id}")
def delete_receta(receta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    db.delete(receta)
    db.commit()
    return {"msg": "Receta eliminada"}
