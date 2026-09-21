#!/bin/bash
set -e
echo "PharmacyPOS Setup Paraguay"
cp -n .env.example .env 2>/dev/null || true
echo "Building..."
docker-compose up --build -d
echo "Waiting 10s for DB..."
sleep 10
echo "Seeding..."
docker-compose exec backend python seed.py || echo "Seed may have run"
echo "Done! Frontend http://localhost:5173 Backend http://localhost:8000/docs"
