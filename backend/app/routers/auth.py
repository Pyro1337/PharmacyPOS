from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random, string

from ..database import get_db
from ..models.user import User, RefreshToken, RecoveryCode, UserRole
from ..schemas.user import UserCreate, UserLogin, TokenResponse, RefreshRequest, UserResponse, UserUpdate, PasswordRecoveryRequest, PasswordRecoveryVerify, ChangePassword
from ..core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token, hash_recovery_code
from ..dependencies import get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only admin can register new users
    if current_user.rol != UserRole.admin:
        raise HTTPException(status_code=403, detail="Solo admin puede registrar usuarios")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    hashed = get_password_hash(data.password)
    user = User(email=data.email, hashed_password=hashed, nombre=data.nombre, rol=data.rol)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/register-public", response_model=UserResponse)
def register_public(data: UserCreate, db: Session = Depends(get_db)):
    # Allow first user to be admin without auth
    count = db.query(User).count()
    if count > 0:
        # If users exist, require admin - but we already have protected register. This endpoint for initial seed.
        raise HTTPException(status_code=403, detail="Registro público solo para primer usuario. Usa /auth/register con admin.")
    hashed = get_password_hash(data.password)
    user = User(email=data.email, hashed_password=hashed, nombre=data.nombre, rol=UserRole.admin)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario inactivo")
    access_token = create_access_token(data={"sub": str(user.id), "rol": user.rol.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    # Persist refresh token
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at)
    db.add(rt)
    db.commit()
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    user_id = payload.get("sub")
    try:
        user_id = int(user_id)
    except:
        pass
    token_row = db.query(RefreshToken).filter(RefreshToken.token == data.refresh_token, RefreshToken.revoked == False).first()
    if not token_row:
        raise HTTPException(status_code=401, detail="Refresh token expirado o revocado")
    # handle naive vs aware comparison (sqlite stores naive)
    exp = token_row.expires_at
    now = datetime.now(timezone.utc)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(status_code=401, detail="Refresh token expirado o revocado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    # revoke old
    token_row.revoked = True
    db.commit()
    access_token = create_access_token(data={"sub": str(user.id), "rol": user.rol.value})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(user_id=user.id, token=new_refresh, expires_at=expires_at)
    db.add(rt)
    db.commit()
    return {"access_token": access_token, "refresh_token": new_refresh, "token_type": "bearer"}

@router.post("/logout")
def logout(data: RefreshRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token_row = db.query(RefreshToken).filter(RefreshToken.token == data.refresh_token, RefreshToken.user_id == current_user.id).first()
    if token_row:
        token_row.revoked = True
        db.commit()
    return {"msg": "Sesión cerrada"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.nombre:
        current_user.nombre = data.nombre
    if data.email:
        if db.query(User).filter(User.email == data.email, User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Email ya en uso")
        current_user.email = data.email
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(data: ChangePassword, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"msg": "Contraseña actualizada"}

@router.post("/recovery/request")
def recovery_request(data: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"msg": "Si el email existe, se envió código"}
    code = ''.join(random.choices(string.digits, k=6))
    code_hash = hash_recovery_code(code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    # revoke previous
    db.query(RecoveryCode).filter(RecoveryCode.user_id == user.id, RecoveryCode.used == False).update({"used": True})
    rc = RecoveryCode(user_id=user.id, code_hash=code_hash, expires_at=expires_at)
    db.add(rc)
    db.commit()
    # In dev, return code for testing; in prod hide it
    return {"msg": "Código enviado", "code": code}

@router.post("/recovery/verify")
def recovery_verify(data: PasswordRecoveryVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Código inválido")
    # handle timezone for sqlite
    now = datetime.now(timezone.utc)
    # fetch all and filter in python to avoid tz issues
    candidates = db.query(RecoveryCode).filter(RecoveryCode.user_id == user.id, RecoveryCode.used == False).order_by(RecoveryCode.created_at.desc()).all()
    rc = None
    for c in candidates:
        exp = c.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp > now:
            rc = c
            break
    if not rc or not verify_password(data.code, rc.code_hash):
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
    rc.used = True
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"msg": "Contraseña restablecida"}

@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.rol != UserRole.admin:
        raise HTTPException(status_code=403, detail="Solo admin")
    return db.query(User).all()
