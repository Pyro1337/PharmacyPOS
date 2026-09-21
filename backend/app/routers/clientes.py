from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_
from ..database import get_db
from ..models.cliente import Cliente
from ..models.user import User
from ..schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/clientes", tags=["clientes"])

@router.post("/", response_model=ClienteResponse)
def create_cliente(data: ClienteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.cedula and db.query(Cliente).filter(Cliente.cedula == data.cedula).first():
        raise HTTPException(status_code=400, detail="Cédula ya registrada")
    cli = Cliente(**data.model_dump())
    db.add(cli)
    db.commit()
    db.refresh(cli)
    return cli

@router.get("/", response_model=List[ClienteResponse])
def list_clientes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), search: Optional[str]=None, skip: int=0, limit: int=100):
    q = db.query(Cliente)
    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(Cliente.nombre.ilike(pattern), Cliente.cedula.ilike(pattern), Cliente.alias.ilike(pattern)))
    return q.offset(skip).limit(limit).all()

@router.get("/{cli_id}", response_model=ClienteResponse)
def get_cliente(cli_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cli = db.query(Cliente).filter(Cliente.id==cli_id).first()
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cli

@router.put("/{cli_id}", response_model=ClienteResponse)
def update_cliente(cli_id: int, data: ClienteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cli = db.query(Cliente).filter(Cliente.id==cli_id).first()
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for k,v in data.model_dump(exclude_unset=True).items():
        setattr(cli, k, v)
    db.commit()
    db.refresh(cli)
    return cli

@router.delete("/{cli_id}")
def delete_cliente(cli_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cli = db.query(Cliente).filter(Cliente.id==cli_id).first()
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cli)
    db.commit()
    return {"msg": "Cliente eliminado"}

@router.get("/{cli_id}/historial")
def historial_cliente(cli_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from ..models.venta import Venta
    cli = db.query(Cliente).filter(Cliente.id==cli_id).first()
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ventas = db.query(Venta).filter(Venta.cliente_id==cli_id).order_by(Venta.fecha.desc()).all()
    return ventas
