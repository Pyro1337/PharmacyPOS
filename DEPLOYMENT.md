# Deployment - PharmacyPOS

## Desarrollo Local (5 pasos)

1. `cp .env.example .env`
2. `docker-compose up --build`
3. Esperar `alembic upgrade head && python seed.py`
4. Frontend: http://localhost:5173 | Backend: http://localhost:8000/docs
5. Login admin@farmacia.py / Admin123!

También sin Docker:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Producción Railway + Vercel

### Backend en Railway

1. Crear proyecto Railway, conectar GitHub.
2. Variables en Railway:
   ```
   DATABASE_URL=postgresql://... (Railway Postgres)
   SECRET_KEY=<32+ chars random>
   ENVIRONMENT=production
   CORS_ORIGINS=["https://tu-vercel.vercel.app"]
   FARMACIA_NOMBRE=Farmacia Central Paraguay
   POSTGRES_PASSWORD=<secure>
   ```
3. Railway detecta `docker-compose.prod.yml` o `backend/Dockerfile`:
   `alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Deploy automático desde main.

`docker-compose.prod.yml` listo para `railway up`.

### Frontend en Vercel

1. Importar repo en Vercel, root `frontend`.
2. Config `vercel.json` (incluido):
   ```json
   { "buildCommand": "npm run build", "outputDirectory": "dist" }
   ```
3. Variables Vercel:
   ```
   VITE_API_URL=https://tu-backend.railway.app/api/v1
   ```
4. Deploy. Cada push a main redeploya.

### Variables

Ver `.env.example` completo. Nunca commitear `.env`.

### Migraciones

- Local: `alembic revision --autogenerate -m "desc"` + `alembic upgrade head`
- Prod: `alembic upgrade head` on startup (Docker CMD).

### MinIO

- Local: MinIO en `docker-compose.yml` puerto 9000/9001
- Prod: usar S3 Railway plugin o volumen persistente para PDFs.

### CI/CD

- GitHub Actions en `.github/workflows/ci.yml`: pytest + vitest en cada push.

## Troubleshooting

- `could not translate host name "db"` => sin Docker, usar `localhost` en DATABASE_URL.
- `UNIQUE constraint refresh_tokens.token` => ya fix con `jti` UUID.
- `bcrypt` wrap bug => fix truncate + direct bcrypt.
