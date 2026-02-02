# 2. Lokális Fejlesztés

## Docker Compose-zal (Ajánlott)

### Indítás

```bash
# Teljes alkalmazás buildelése és indítása
docker-compose up --build

# Háttérben futtatás
docker-compose up --build -d
```

Ez elindítja mind a 3 szolgáltatást:
- **frontend** - http://localhost:8080 (nginx + React)
- **backend** - http://localhost:3000 (Express API)
- **database** - localhost:5432 (PostgreSQL)

### Alkalmazás Tesztelése

```bash
# Health check
curl http://localhost:3000/health
# Válasz: {"status":"ok","uptime":12.345,"timestamp":"..."}

# Readiness check (DB kapcsolat)
curl http://localhost:3000/ready
# Válasz: {"status":"ready","db":"connected"}

# App info
curl http://localhost:3000/api/info
# Válasz: {"version":"1.0.0","hostname":"abc123","environment":"development","timestamp":"..."}

# Feladatok listázása
curl http://localhost:3000/api/tasks
# Válasz: [{"id":1,"title":"DevOps pipeline beállítása",...}, ...]

# Új feladat létrehozása
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Teszt feladat","description":"Ez egy teszt"}'

# Feladat befejezése
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Feladat törlése
curl -X DELETE http://localhost:3000/api/tasks/1
```

### Frontend elérése

Nyisd meg a böngészőben: http://localhost:8080

A frontend automatikusan a backend API-t hívja a nginx proxy-n keresztül.

### Logok Megtekintése

```bash
# Minden szolgáltatás logja
docker-compose logs -f

# Csak a backend logjai
docker-compose logs -f backend

# Csak a database logjai
docker-compose logs -f database
```

### Adatbázis Elérése

```bash
# psql-lel csatlakozás
docker-compose exec database psql -U postgres -d taskmanager

# SQL parancsok
\dt                          -- Táblák listázása
SELECT * FROM tasks;         -- Feladatok lekérése
\q                           -- Kilépés
```

### Leállítás

```bash
# Szolgáltatások leállítása
docker-compose down

# Szolgáltatások leállítása + adatbázis adatok törlése
docker-compose down -v
```

## Docker Nélkül (Fejlesztési Mód)

Ha Docker nélkül szeretnéd futtatni (pl. hot-reload-dal):

### Előfeltételek
- Node.js 20+ telepítve
- PostgreSQL futó instance (pl. Docker-rel: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=taskmanager postgres:15-alpine`)

### Backend
```bash
cd backend
npm install
npm run dev
# Elindul a 3000-es porton hot-reload-dal
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Elindul az 5173-as porton hot-reload-dal
# API hívások automatikusan proxy-zódnak a backend-re (vite.config.ts)
```

## Docker Image-ek Manuális Buildelése

```bash
# Backend image
docker build -t devops-demo-backend ./backend

# Frontend image
docker build -t devops-demo-frontend ./frontend

# Futtatás
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=taskmanager \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  devops-demo-backend
```

## Hibaelhárítás

### "port is already in use"
```bash
# Melyik process használja a portot
lsof -i :8080  # vagy :3000, :5432

# Docker konténerek leállítása
docker-compose down
```

### "database connection refused"
- Ellenőrizd, hogy a database konténer fut: `docker-compose ps`
- Várj néhány másodpercet (a healthcheck miatt)
- Ellenőrizd a logokat: `docker-compose logs database`

### Frontend nem éri el a backend-et
- Az nginx konfig a `backend` hostnevet használja (Docker Compose hálózaton belül)
- Lokálisan a Vite proxy intézi (`vite.config.ts`)
