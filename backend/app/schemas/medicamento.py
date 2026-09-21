from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class MedicamentoCreate(BaseModel):
    codigo: str = Field(min_length=1)
    nombre: str = Field(min_length=1)
    principio_activo: Optional[str] = None
    presentacion: Optional[str] = None
    precio_costo: int = Field(ge=0)
    precio_venta: int = Field(ge=0)
    stock_actual: int = Field(default=0, ge=0)
    stock_minimo: int = Field(default=5, ge=0)
    stock_maximo: int = Field(default=100, ge=0)
    requiere_receta: bool = False
    fecha_vencimiento: Optional[date] = None
    categoria: Optional[str] = None
    proveedor_id: Optional[int] = None
    imagen_url: Optional[str] = None
    activo: bool = True

class MedicamentoUpdate(BaseModel):
    nombre: Optional[str] = None
    principio_activo: Optional[str] = None
    presentacion: Optional[str] = None
    precio_costo: Optional[int] = Field(default=None, ge=0)
    precio_venta: Optional[int] = Field(default=None, ge=0)
    stock_actual: Optional[int] = Field(default=None, ge=0)
    stock_minimo: Optional[int] = Field(default=None, ge=0)
    stock_maximo: Optional[int] = Field(default=None, ge=0)
    requiere_receta: Optional[bool] = None
    fecha_vencimiento: Optional[date] = None
    categoria: Optional[str] = None
    proveedor_id: Optional[int] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None

class MedicamentoResponse(BaseModel):
    id: int
    codigo: str
    nombre: str
    principio_activo: Optional[str]
    presentacion: Optional[str]
    precio_costo: int
    precio_venta: int
    margen_ganancia: float = 0
    stock_actual: int
    stock_minimo: int
    stock_maximo: int
    requiere_receta: bool
    fecha_vencimiento: Optional[date]
    categoria: Optional[str]
    proveedor_id: Optional[int]
    imagen_url: Optional[str] = None
    activo: bool
    creado_por: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_margin(cls, obj):
        data = {c.key: getattr(obj, c.key) for c in obj.__table__.columns}
        # compute margin
        if obj.precio_costo and obj.precio_costo > 0:
            data["margen_ganancia"] = round(((obj.precio_venta - obj.precio_costo) / obj.precio_costo)*100, 2)
        else:
            data["margen_ganancia"] = 0
        return cls(**data)

class BulkPriceUpdate(BaseModel):
    ids: list[int]
    precio_venta: Optional[int] = None
    precio_costo: Optional[int] = None
