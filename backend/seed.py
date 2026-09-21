from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.proveedor import Proveedor
from app.models.medicamento import Medicamento
from app.models.cliente import Cliente
from app.core.security import get_password_hash
from datetime import date, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    if db.query(User).count() > 0:
        print("Seed ya ejecutado, saltando...")
        db.close()
        return

    # Users
    users = [
        User(email="admin@farmacia.py", hashed_password=get_password_hash("Admin123!"), nombre="Admin Principal", rol=UserRole.admin),
        User(email="farmaceutico@farmacia.py", hashed_password=get_password_hash("Farma123!"), nombre="Dra. Maria Gonzalez", rol=UserRole.farmaceutico),
        User(email="vendedor@farmacia.py", hashed_password=get_password_hash("Vendedor123!"), nombre="Juan Perez", rol=UserRole.vendedor),
        User(email="contador@farmacia.py", hashed_password=get_password_hash("Contador123!"), nombre="Carlos Contador", rol=UserRole.contador),
    ]
    for u in users:
        db.add(u)
    db.commit()

    # Proveedores
    provs = [
        Proveedor(nombre="Droguería Paraguay S.A.", contacto="Luis Ramirez", email="ventas@drogueriapy.com", telefono="021 123 456", ruc="80012345-1", condiciones_pago="30 días"),
        Proveedor(nombre="Laboratorios Lasca", contacto="Ana Torres", email="pedidos@lasca.com.py", telefono="021 654 321", ruc="80054321-2", condiciones_pago="Contado"),
        Proveedor(nombre="Quimfa S.A.", contacto="Pedro Diaz", email="info@quimfa.com.py", telefono="021 987 654", ruc="80098765-3", condiciones_pago="60 días"),
    ]
    for p in provs:
        db.add(p)
    db.commit()
    prov_ids = [p.id for p in db.query(Proveedor).all()]

    # Medicamentos
    meds_data = [
        ("7790012345678", "Paracetamol 500mg", "Paracetamol", "Caja x 20", 5000, 8500, 100, "Analgésicos"),
        ("7790012345679", "Ibuprofeno 400mg", "Ibuprofeno", "Blíster x 10", 7000, 12000, 80, "Analgésicos"),
        ("7790012345680", "Amoxicilina 500mg", "Amoxicilina", "Caja x 16", 15000, 25000, 50, "Antibióticos", True),
        ("7790012345681", "Omeprazol 20mg", "Omeprazol", "Caja x 30", 12000, 20000, 60, "Gastrointestinal"),
        ("7790012345682", "Loratadina 10mg", "Loratadina", "Caja x 10", 8000, 14000, 40, "Antialérgicos"),
        ("7790012345683", "Vitamina C 1000mg", "Ácido Ascórbico", "Frasco x 60", 20000, 35000, 30, "Vitaminas"),
        ("7790012345684", "Diclofenac 50mg", "Diclofenac", "Caja x 20", 9000, 15000, 70, "Antiinflamatorios"),
        ("7790012345685", "Azitromicina 500mg", "Azitromicina", "Caja x 3", 18000, 30000, 25, "Antibióticos", True),
        ("7790012345686", "Enalapril 10mg", "Enalapril", "Caja x 30", 10000, 18000, 45, "Cardiovascular"),
        ("7790012345687", "Metformina 500mg", "Metformina", "Caja x 60", 14000, 22000, 35, "Diabetes"),
        ("7790012345688", "Clonazepam 2mg", "Clonazepam", "Caja x 30", 25000, 42000, 15, "Controlados", True),
        ("7790012345689", "Tramadol 50mg", "Tramadol", "Caja x 20", 30000, 50000, 10, "Controlados", True),
        ("7790012345690", "Salbutamol Spray", "Salbutamol", "Frasco", 22000, 38000, 20, "Respiratorio"),
        ("7790012345691", "Cetirizina 10mg", "Cetirizina", "Caja x 10", 7500, 13000, 55, "Antialérgicos"),
        ("7790012345692", "Complejo B", "Vitaminas B", "Caja x 30", 16000, 28000, 40, "Vitaminas"),
    ]
    for code, nombre, principio, present, costo, venta, stock, cat, *rest in meds_data:
        requiere = rest[0] if rest else False
        venc = date.today() + timedelta(days=random.randint(60, 720))
        if nombre in ["Paracetamol 500mg", "Ibuprofeno 400mg"]:
            venc = date.today() + timedelta(days=20)  # para alerta
        med = Medicamento(
            codigo=code, nombre=nombre, principio_activo=principio, presentacion=present,
            precio_costo=costo, precio_venta=venta, stock_actual=stock, stock_minimo=10, stock_maximo=150,
            requiere_receta=requiere, fecha_vencimiento=venc, categoria=cat, proveedor_id=random.choice(prov_ids), activo=True, creado_por=1
        )
        db.add(med)
    db.commit()

    # Clientes
    clientes = [
        Cliente(nombre="Juan Lopez", cedula="12345678", email="juan.lopez@mail.com", telefono="0981 123 456", descuento=5, alias="Juancho"),
        Cliente(nombre="Maria Benitez", cedula="23456789", email="maria.b@mail.com", telefono="0982 234 567", descuento=10),
        Cliente(nombre="Pedro Ortiz", cedula="34567890", email="pedro.ortiz@mail.com", telefono="0983 345 678", descuento=0),
    ]
    for c in clientes:
        db.add(c)
    db.commit()
    print("Seed completado exitosamente!")
    db.close()

if __name__ == "__main__":
    seed()
