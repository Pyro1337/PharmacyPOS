from sqlalchemy import Column, Integer, String, DateTime, Float
from datetime import datetime, timezone
from ..database import Base

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    cedula = Column(String, unique=True, index=True, nullable=True)  # 8 dígitos PY
    email = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    descuento = Column(Float, default=0.0)  # %
    alias = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
