from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TipoIngreso(str, Enum):
    venta = "venta"
    devolucion = "devolucion"
    otro = "otro"

class TipoEgreso(str, Enum):
    compra_proveedor = "compra_proveedor"
    gasto_operativo = "gasto_operativo"
    devolucion_cliente = "devolucion_cliente"
    mantenimiento = "mantenimiento"
    otro = "otro"

class IngresoCreate(BaseModel):
    monto: int = Field(gt=0)
    origen: TipoIngreso = TipoIngreso.otro
    descripcion: Optional[str] = None
    metodo_registro: str = "manual"

class EgresoCreate(BaseModel):
    monto: int = Field(gt=0)
    tipo: TipoEgreso = TipoEgreso.otro
    descripcion: Optional[str] = None
    proveedor_id: Optional[int] = None
    comprobante: Optional[str] = None

class IngresoResponse(BaseModel):
    id: int
    fecha: datetime
    monto: int
    origen: TipoIngreso
    descripcion: Optional[str]
    metodo_registro: str
    creado_por: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True

class EgresoResponse(BaseModel):
    id: int
    fecha: datetime
    monto: int
    tipo: TipoEgreso
    descripcion: Optional[str]
    proveedor_id: Optional[int]
    comprobante: Optional[str]
    creado_por: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True
