from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_
from ..database import get_db
from ..models.proveedor import Proveedor
from ..models.user import User
from ..schemas.proveedor import ProveedorCreate, ProveedorUpdate, ProveedorResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/proveedores", tags=["proveedores"])

@router.post("/", response_model=ProveedorResponse)
def create_proveedor(data: ProveedorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prov = Proveedor(**data.model_dump())
    db.add(prov)
    db.commit()
    db.refresh(prov)
    return prov

@router.get("/", response_model=List[ProveedorResponse])
def list_proveedores(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), search: Optional[str]=None, skip: int=0, limit: int=100):
    q = db.query(Proveedor)
    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(Proveedor.nombre.ilike(pattern), Proveedor.ruc.ilike(pattern)))
    return q.offset(skip).limit(limit).all()

@router.get("/{prov_id}", response_model=ProveedorResponse)
def get_proveedor(prov_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prov = db.query(Proveedor).filter(Proveedor.id==prov_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return prov

@router.put("/{prov_id}", response_model=ProveedorResponse)
def update_proveedor(prov_id: int, data: ProveedorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prov = db.query(Proveedor).filter(Proveedor.id==prov_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    for k,v in data.model_dump(exclude_unset=True).items():
        setattr(prov, k, v)
    db.commit()
    db.refresh(prov)
    return prov

@router.delete("/{prov_id}")
def delete_proveedor(prov_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prov = db.query(Proveedor).filter(Proveedor.id==prov_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    db.delete(prov)
    db.commit()
    return {"msg": "Proveedor eliminado"}
