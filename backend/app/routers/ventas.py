from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from ..database import get_db
from ..models.venta import Venta, MetodoPago, EstadoVenta
from ..models.medicamento import Medicamento
from ..models.receta import Receta, EstadoReceta
from ..models.cliente import Cliente
from ..models.user import User
from ..schemas.venta import VentaCreate, VentaResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/ventas", tags=["ventas"])

@router.post("/", response_model=VentaResponse)
def create_venta(data: VentaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Carrito vacío")
    # validar stock y receta
    subtotal = 0
    items_db = []
    for item in data.items:
        med = db.query(Medicamento).filter(Medicamento.id == item.medicamento_id).first()
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicamento {item.medicamento_id} no encontrado")
        if not med.activo:
            raise HTTPException(status_code=400, detail=f"Medicamento {med.nombre} inactivo")
        if med.stock_actual < item.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {med.nombre}: disponible {med.stock_actual}")
        if med.requiere_receta:
            if not data.receta_id:
                raise HTTPException(status_code=400, detail=f"Medicamento {med.nombre} requiere receta válida")
            receta = db.query(Receta).filter(Receta.id == data.receta_id).first()
            if not receta:
                raise HTTPException(status_code=400, detail="Receta no encontrada")
            from datetime import date
            if receta.fecha_vencimiento < date.today() or receta.estado in [EstadoReceta.vencida, EstadoReceta.rechazada]:
                raise HTTPException(status_code=400, detail="Receta vencida o rechazada")
            # verificar que medicamento está en receta
            med_ids = [m.id for m in receta.medicamentos]
            if med.id not in med_ids:
                raise HTTPException(status_code=400, detail=f"Medicamento {med.nombre} no está prescrito en receta {receta.codigo}")
        # validar precio
        expected_subtotal = item.precio_unitario * item.cantidad - item.descuento_item
        if expected_subtotal < 0:
            raise HTTPException(status_code=400, detail="Descuento mayor que subtotal")
        subtotal += expected_subtotal
        items_db.append({
            "medicamento_id": med.id,
            "cantidad": item.cantidad,
            "precio_unitario": item.precio_unitario,
            "descuento_item": item.descuento_item,
            "subtotal": expected_subtotal,
            "nombre": med.nombre,
            "codigo": med.codigo
        })
        # alerta stock bajo
        # no bloquea, solo info

    # aplicar descuento total
    monto_descuento = int(subtotal * (data.descuento_total_porcentaje / 100))
    # validar descuento manual >10% requiere admin/farmaceutico? Se permite pero log.
    if data.descuento_total_porcentaje > 10 and current_user.rol not in ["admin", "farmaceutico"]:
        # allow but note; alternatively require auth. We allow with warning.
        pass

    total = subtotal - monto_descuento
    if total < 0:
        total = 0

    # descuento cliente frecuente
    if data.cliente_id:
        cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
        if cliente and cliente.descuento > 0:
            extra = int(total * (cliente.descuento/100))
            monto_descuento += extra
            total -= extra

    # generar numero_venta
    max_num = db.query(func.max(Venta.numero_venta)).scalar() or 0
    numero_venta = max_num + 1

    venta = Venta(
        numero_venta=numero_venta,
        vendedor_id=current_user.id,
        cliente_id=data.cliente_id,
        items=items_db,
        subtotal=subtotal,
        descuento_total_porcentaje=data.descuento_total_porcentaje,
        monto_descuento=monto_descuento,
        total=total,
        metodo_pago=data.metodo_pago,
        detalle_pago=data.detalle_pago,
        receta_id=data.receta_id,
        notas=data.notas,
        estado=EstadoVenta.completada
    )
    db.add(venta)
    # actualizar stock
    for it in data.items:
        med = db.query(Medicamento).filter(Medicamento.id == it.medicamento_id).first()
        med.stock_actual -= it.cantidad
    db.commit()
    db.refresh(venta)
    return venta

@router.get("/", response_model=List[VentaResponse])
def list_ventas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    metodo_pago: Optional[MetodoPago] = None,
):
    q = db.query(Venta).order_by(Venta.fecha.desc())
    if desde:
        q = q.filter(Venta.fecha >= desde)
    if hasta:
        q = q.filter(Venta.fecha <= hasta)
    if metodo_pago:
        q = q.filter(Venta.metodo_pago == metodo_pago)
    ventas = q.offset(skip).limit(limit).all()
    return ventas

@router.get("/{venta_id}", response_model=VentaResponse)
def get_venta(venta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta

@router.post("/{venta_id}/anular")
def anular_venta(venta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if venta.estado == EstadoVenta.anulada:
        raise HTTPException(status_code=400, detail="Venta ya anulada")
    # devolver stock
    for item in venta.items:
        med = db.query(Medicamento).filter(Medicamento.id == item["medicamento_id"]).first()
        if med:
            med.stock_actual += item["cantidad"]
    venta.estado = EstadoVenta.anulada
    db.commit()
    return {"msg": "Venta anulada", "venta_id": venta.id}
