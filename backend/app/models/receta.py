from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Text, Enum, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base
import enum

class EstadoReceta(str, enum.Enum):
    pendiente = "pendiente"
    completada = "completada"
    parcial = "parcial"
    vencida = "vencida"
    rechazada = "rechazada"
    aprobada = "aprobada"

# Tabla intermedia receta-medicamentos
receta_medicamentos = Table(
    "receta_medicamentos",
    Base.metadata,
    Column("receta_id", Integer, ForeignKey("recetas.id", ondelete="CASCADE"), primary_key=True),
    Column("medicamento_id", Integer, ForeignKey("medicamentos.id", ondelete="CASCADE"), primary_key=True),
    Column("cantidad", Integer, default=1)
)

class Receta(Base):
    __tablename__ = "recetas"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)
    paciente_nombre = Column(String, nullable=False)
    paciente_cedula = Column(String, nullable=False)
    paciente_fecha_nacimiento = Column(Date, nullable=True)
    prescriptor_nombre = Column(String, nullable=True)
    prescriptor_cedula = Column(String, nullable=True)
    prescriptor_especialidad = Column(String, nullable=True)
    fecha_emision = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    archivo_adjunto = Column(String, nullable=True)  # path MinIO
    estado = Column(Enum(EstadoReceta), default=EstadoReceta.pendiente)
    notas = Column(Text, nullable=True)
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    medicamentos = relationship("Medicamento", secondary=receta_medicamentos, lazy="joined")
