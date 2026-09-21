from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class Medicamento(Base):
    __tablename__ = "medicamentos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)  # SKU / barras
    nombre = Column(String, nullable=False, index=True)
    principio_activo = Column(String, nullable=True, index=True)
    presentacion = Column(String, nullable=True)  # caja, blister, frasco
    precio_costo = Column(Integer, nullable=False)  # PYG sin decimales
    precio_venta = Column(Integer, nullable=False)
    stock_actual = Column(Integer, default=0, nullable=False)
    stock_minimo = Column(Integer, default=5, nullable=False)
    stock_maximo = Column(Integer, default=100, nullable=False)
    requiere_receta = Column(Boolean, default=False, nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)
    categoria = Column(String, nullable=True, index=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id", ondelete="SET NULL"), nullable=True)
    imagen_url = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    creado_por = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    proveedor = relationship("Proveedor", back_populates="medicamentos")
    historial_precios = relationship("HistorialPrecio", back_populates="medicamento", cascade="all, delete-orphan")

    @property
    def margen_ganancia(self):
        if self.precio_costo and self.precio_costo > 0:
            return round(((self.precio_venta - self.precio_costo) / self.precio_costo) * 100, 2)
        return 0

class HistorialPrecio(Base):
    __tablename__ = "historial_precios"
    id = Column(Integer, primary_key=True, index=True)
    medicamento_id = Column(Integer, ForeignKey("medicamentos.id", ondelete="CASCADE"), nullable=False)
    precio_costo_anterior = Column(Integer)
    precio_venta_anterior = Column(Integer)
    precio_costo_nuevo = Column(Integer)
    precio_venta_nuevo = Column(Integer)
    cambiado_por = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    medicamento = relationship("Medicamento", back_populates="historial_precios")
