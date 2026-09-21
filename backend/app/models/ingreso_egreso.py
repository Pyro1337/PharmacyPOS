from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base
import enum

class TipoIngreso(str, enum.Enum):
    venta = "venta"
    devolucion = "devolucion"
    otro = "otro"

class TipoEgreso(str, enum.Enum):
    compra_proveedor = "compra_proveedor"
    gasto_operativo = "gasto_operativo"
    devolucion_cliente = "devolucion_cliente"
    mantenimiento = "mantenimiento"
    otro = "otro"

class Ingreso(Base):
    __tablename__ = "ingresos"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    monto = Column(Integer, nullable=False)
    origen = Column(Enum(TipoIngreso), default=TipoIngreso.otro)
    descripcion = Column(Text, nullable=True)
    metodo_registro = Column(String, default="manual")
    creado_por = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Egreso(Base):
    __tablename__ = "egresos"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    monto = Column(Integer, nullable=False)
    tipo = Column(Enum(TipoEgreso), default=TipoEgreso.otro)
    descripcion = Column(Text, nullable=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    comprobante = Column(String, nullable=True)
    creado_por = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    proveedor = relationship("Proveedor")
