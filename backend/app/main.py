from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from .config import settings, validate_settings
from .database import Base, engine
from .routers import auth, medicamentos, recetas, ventas, caja, dashboard, ingresos_egresos, clientes, proveedores
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models.user import RefreshToken, RecoveryCode

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# Create tables (skip if DB not available - e.g., during tests without postgres)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: could not create tables at import: {e}")

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(medicamentos.router, prefix=settings.API_V1_STR)
app.include_router(recetas.router, prefix=settings.API_V1_STR)
app.include_router(ventas.router, prefix=settings.API_V1_STR)
app.include_router(caja.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(ingresos_egresos.router, prefix=settings.API_V1_STR)
app.include_router(clientes.router, prefix=settings.API_V1_STR)
app.include_router(proveedores.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"msg": "PharmacyPOS Paraguay API", "version": settings.VERSION, "moneda": settings.MONEDA}

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# Background task: clean expired tokens
def cleanup_expired():
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        db.query(RefreshToken).filter(RefreshToken.expires_at < now).delete()
        db.query(RecoveryCode).filter(RecoveryCode.expires_at < now).delete()
        db.commit()
    except Exception as e:
        print(f"Cleanup error: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(cleanup_expired, 'interval', hours=1)
try:
    scheduler.start()
except:
    pass

@app.on_event("startup")
def on_startup():
    try:
        validate_settings()
    except Exception as e:
        print(f"Settings validation: {e}")
