from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
from sqlalchemy.orm import Session
from ..config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__ident="2b", bcrypt__min_rounds=4, bcrypt__max_rounds=12)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # truncate to 72 bytes for bcrypt compatibility
    pw = plain_password[:72] if len(plain_password.encode('utf-8')) > 72 else plain_password
    try:
        return pwd_context.verify(pw, hashed_password)
    except Exception:
        # fallback to bcrypt direct
        return bcrypt.checkpw(pw.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    pw = password[:72] if len(password.encode('utf-8')) > 72 else password
    # use bcrypt directly to avoid passlib wrap bug
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pw.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    import uuid
    to_encode.update({"exp": expire, "type": "access", "jti": str(uuid.uuid4()), "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    import uuid
    to_encode.update({"exp": expire, "type": "refresh", "jti": str(uuid.uuid4()), "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def hash_recovery_code(code: str) -> str:
    return get_password_hash(code)
