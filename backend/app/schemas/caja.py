from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum

class TurnoCaja(str, Enum):
    manana = "manana"
    tarde = "tarde"
    noche = "noche"

class EstadoCaja(str, Enum):
    abierta = "abierta"
    cerrada = "cerrada"

class CajaAbrir(BaseModel):
    saldo_inicial: int = Field(ge=0)
    turno: TurnoCaja = TurnoCaja.manana
    notas_apertura: Optional[str] = None

class MovimientoManual(BaseModel):
    tipo: str  # deposito, gasto, otro
    monto: int  # puede ser negativo para egresos
    descripcion: str

class CajaCerrar(BaseModel):
    saldo_real: int = Field(ge=0)
    notas_cierre: Optional[str] = None

class CajaResponse(BaseModel):
    id: int
    fecha: date
    numero_caja: int
    vendedor_id: int
    turno: TurnoCaja
    saldo_inicial: int
    saldo_esperado: Optional[int]
    saldo_real: Optional[int]
    diferencia: Optional[int]
    estado: EstadoCaja
    notas_apertura: Optional[str]
    notas_cierre: Optional[str]
    movimientos: List[Dict[str, Any]] = []
    created_at: datetime
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True
