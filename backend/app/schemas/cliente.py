from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class ClienteCreate(BaseModel):
    nombre: str
    cedula: Optional[str] = Field(default=None, pattern=r"^\d{6,8}$")
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    descuento: float = Field(default=0, ge=0, le=100)
    alias: Optional[str] = None
    direccion: Optional[str] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    cedula: Optional[str] = Field(default=None, pattern=r"^\d{6,8}$")
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    descuento: Optional[float] = Field(default=None, ge=0, le=100)
    alias: Optional[str] = None
    direccion: Optional[str] = None

class ClienteResponse(BaseModel):
    id: int
    nombre: str
    cedula: Optional[str]
    email: Optional[str]
    telefono: Optional[str]
    descuento: float
    alias: Optional[str]
    direccion: Optional[str]
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
