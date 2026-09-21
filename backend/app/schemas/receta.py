from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class EstadoReceta(str, Enum):
    pendiente = "pendiente"
    completada = "completada"
    parcial = "parcial"
    vencida = "vencida"
    rechazada = "rechazada"
    aprobada = "aprobada"

class RecetaCreate(BaseModel):
    codigo: str
    paciente_nombre: str
    paciente_cedula: str = Field(pattern=r"^\d{6,8}$")
    paciente_fecha_nacimiento: Optional[date] = None
    prescriptor_nombre: Optional[str] = None
    prescriptor_cedula: Optional[str] = None
    prescriptor_especialidad: Optional[str] = None
    fecha_emision: date
    fecha_vencimiento: date
    medicamento_ids: List[int] = []
    cantidades: Optional[dict] = None  # {medicamento_id: cantidad}
    notas: Optional[str] = None
    archivo_adjunto: Optional[str] = None

class RecetaUpdate(BaseModel):
    estado: Optional[EstadoReceta] = None
    notas: Optional[str] = None
    medicamento_ids: Optional[List[int]] = None

class RecetaResponse(BaseModel):
    id: int
    codigo: str
    paciente_nombre: str
    paciente_cedula: str
    paciente_fecha_nacimiento: Optional[date]
    prescriptor_nombre: Optional[str]
    prescriptor_cedula: Optional[str]
    prescriptor_especialidad: Optional[str]
    fecha_emision: date
    fecha_vencimiento: date
    archivo_adjunto: Optional[str]
    estado: EstadoReceta
    notas: Optional[str]
    usuario_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    medicamentos: List[dict] = []

    class Config:
        from_attributes = True
