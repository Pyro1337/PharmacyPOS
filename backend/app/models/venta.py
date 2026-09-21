from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base
import enum

class MetodoPago(str, enum.Enum):
    efectivo = "efectivo"
    tarjeta_debito = "tarjeta_debito"
    tarjeta_credito = "tarjeta_credito"
    cheque = "cheque"
    transferencia = "transferencia"
    mixto = "mixto"

class EstadoVenta(str, enum.Enum):
    completada = "completada"
    anulada = "anulada"
    devuelto_parcial = "devuelto_parcial"

class Venta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    numero_venta = Column(Integer, unique=True, index=True, nullable=False)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    items = Column(JSON, nullable=False)  # lista de {medicamento_id, cantidad, precio_unitario, descuento_item, subtotal}
    subtotal = Column(Integer, nullable=False)  # PYG
    descuento_total_porcentaje = Column(Float, default=0)
    monto_descuento = Column(Integer, default=0)
    total = Column(Integer, nullable=False)
    metodo_pago = Column(Enum(MetodoPago), nullable=False)
    detalle_pago = Column(JSON, nullable=True)  # ej {"efectivo": 50000, "tarjeta": 100000}
    receta_id = Column(Integer, ForeignKey("recetas.id"), nullable=True)
    notas = Column(Text, nullable=True)
    estado = Column(Enum(EstadoVenta), default=EstadoVenta.completada)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vendedor = relationship("User")
    cliente = relationship("Cliente")
    receta = relationship("Receta")
