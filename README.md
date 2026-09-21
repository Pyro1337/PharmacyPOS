# PharmacyPOS Paraguay 💊

Sistema POS integrado con inventario, gestión de recetas y cierre de caja con reportes PDF para farmacias. Moneda: Guaraní Paraguayo (PYG).

## Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL 16, Pydantic v2, JWT, bcrypt, ReportLab, APScheduler, pytest
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4, Zustand, React Router, Recharts, Vitest + Testing Library, lucide-react
- **Infra:** Docker + Docker Compose, nginx, MinIO, Alembic

## Quick Start

```bash
# 1. Clonar y configurar env
cp .env.example .env

# 2. Levantar todo
docker-compose up --build

# 3. Abrir
# Frontend: http://localhost:5173
# Backend: http://localhost:8000/docs
# MinIO: http://localhost:9001
```

## Usuarios demo (seed.py)

| Email | Password | Rol |
|-------|----------|-----|
| admin@farmacia.py | Admin123! | Admin |
| farmaceutico@farmacia.py | Farma123! | Farmacéutico |
| vendedor@farmacia.py | Vendedor123! | Vendedor |
| contador@farmacia.py | Contador123! | Contador |

## Features

- ✅ POS con carrito, descuentos, 6 métodos de pago, validación recetas controladas
- ✅ Gestión medicamentos: CRUD, búsqueda, alertas vencimiento/bajo stock, historial precios
- ✅ Recetas: validación 30 días, estados, archivo adjunto, aprobación farmacéutico
- ✅ Caja diaria: apertura/cierre, movimientos, PDF cierre (ver `prompt/PROMPT_PHARMACYPOS_PARAGUAY.md:193`)
- ✅ Dashboard: hoy/semana/mes/12 meses, top productos, financiero, métodos pago
- ✅ Finanzas: ingresos/egresos separados
- ✅ Clientes y Proveedores
- ✅ Moneda PYG `50.000 ₲` , timezone America/Asuncion, fecha DD/MM/YYYY

## Tests

```bash
# Backend: 141 tests
python -m pytest backend/tests -v

# Frontend: 97 tests
npm --prefix frontend run test -- --run
```

## Documentación

- `API.md` – rutas y ejemplos
- `SEGURIDAD.md` – auditoría y roles
- `DEPLOYMENT.md` – Railway + Vercel
- `USER_GUIDE.md` – guía de uso POS

## Estructura

```
backend/app/models, routers, schemas, services/pdf_service.py
frontend/src/pages, stores, lib
docker-compose.yml / docker-compose.prod.yml
```

Generado: 2026 | Tiempo a prod: 1-2h
