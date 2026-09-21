from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ProveedorCreate(BaseModel):
    nombre: str
    contacto: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    ruc: Optional[str] = None
    condiciones_pago: Optional[str] = None

class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    contacto: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    ruc: Optional[str] = None
    condiciones_pago: Optional[str] = None

class ProveedorResponse(BaseModel):
    id: int
    nombre: str
    contacto: Optional[str]
    email: Optional[str]
    telefono: Optional[str]
    ruc: Optional[str]
    condiciones_pago: Optional[str]
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
