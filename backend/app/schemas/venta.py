from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class MetodoPago(str, Enum):
    efectivo = "efectivo"
    tarjeta_debito = "tarjeta_debito"
    tarjeta_credito = "tarjeta_credito"
    cheque = "cheque"
    transferencia = "transferencia"
    mixto = "mixto"

class EstadoVenta(str, Enum):
    completada = "completada"
    anulada = "anulada"
    devuelto_parcial = "devuelto_parcial"

class VentaItem(BaseModel):
    medicamento_id: int
    cantidad: int = Field(gt=0)
    precio_unitario: int = Field(ge=0)
    descuento_item: int = Field(default=0, ge=0)
    subtotal: int = Field(ge=0)

class VentaCreate(BaseModel):
    cliente_id: Optional[int] = None
    items: List[VentaItem]
    descuento_total_porcentaje: float = Field(default=0, ge=0, le=100)
    metodo_pago: MetodoPago
    detalle_pago: Optional[Dict[str, Any]] = None
    receta_id: Optional[int] = None
    notas: Optional[str] = None

class VentaResponse(BaseModel):
    id: int
    numero_venta: int
    fecha: datetime
    vendedor_id: int
    cliente_id: Optional[int]
    items: List[Dict[str, Any]]
    subtotal: int
    descuento_total_porcentaje: float
    monto_descuento: int
    total: int
    metodo_pago: MetodoPago
    detalle_pago: Optional[Dict[str, Any]]
    receta_id: Optional[int]
    notas: Optional[str]
    estado: EstadoVenta
    created_at: datetime

    class Config:
        from_attributes = True
