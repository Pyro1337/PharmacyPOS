import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.config import settings

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="function")
def client_fixture(db):
    # Override already set; just return client
    return client

def create_user(db, email="test@test.com", password="Test123!@#", rol=UserRole.admin, nombre="Test User"):
    user = User(email=email, hashed_password=get_password_hash(password), nombre=nombre, rol=rol, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_token(email="test@test.com", password="Test123!@#"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    return None

@pytest.fixture
def admin_user(db):
    return create_user(db, email="admin@test.com", password="Admin123!@#", rol=UserRole.admin, nombre="Admin")

@pytest.fixture
def vendedor_user(db):
    return create_user(db, email="vendedor@test.com", password="Vend123!@#", rol=UserRole.vendedor, nombre="Vendedor")

@pytest.fixture
def farmaceutico_user(db):
    return create_user(db, email="farma@test.com", password="Farma123!@#", rol=UserRole.farmaceutico, nombre="Farma")

@pytest.fixture
def contador_user(db):
    return create_user(db, email="contador@test.com", password="Cont123!@#", rol=UserRole.contador, nombre="Contador")

@pytest.fixture
def admin_token(admin_user):
    return get_token("admin@test.com", "Admin123!@#")

@pytest.fixture
def vendedor_token(vendedor_user):
    return get_token("vendedor@test.com", "Vend123!@#")

@pytest.fixture
def farma_token(farmaceutico_user):
    return get_token("farma@test.com", "Farma123!@#")

@pytest.fixture
def contador_token(contador_user):
    return get_token("contador@test.com", "Cont123!@#")

@pytest.fixture
def auth_header(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
