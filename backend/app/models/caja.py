from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Text, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base
import enum

class TurnoCaja(str, enum.Enum):
    manana = "manana"
    tarde = "tarde"
    noche = "noche"

class EstadoCaja(str, enum.Enum):
    abierta = "abierta"
    cerrada = "cerrada"

class CajaDiaria(Base):
    __tablename__ = "cajas_diarias"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    numero_caja = Column(Integer, nullable=False)
    vendedor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    turno = Column(Enum(TurnoCaja), default=TurnoCaja.manana)
    saldo_inicial = Column(Integer, nullable=False)  # PYG
    saldo_esperado = Column(Integer, nullable=True)
    saldo_real = Column(Integer, nullable=True)
    diferencia = Column(Integer, nullable=True)
    estado = Column(Enum(EstadoCaja), default=EstadoCaja.abierta)
    notas_apertura = Column(Text, nullable=True)
    notas_cierre = Column(Text, nullable=True)
    movimientos = Column(JSON, default=list)  # [{"tipo": "deposito", "monto": 100000, "descripcion": "..."}]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)

    vendedor = relationship("User")
