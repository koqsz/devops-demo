# DevOps Demo Projekt - Feladatkezelő Alkalmazás

Egy teljes DevOps pipeline bemutató projekt oktatási célra. Az alkalmazás egy egyszerű feladatkezelő (Task Manager), amely demonstrálja a modern CI/CD és GitOps workflow-t.

## Architektúra

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL   │
│  React/Vite  │     │   Express    │     │              │
│   (nginx)    │     │  Node.js     │     │              │
│   port 80    │     │  port 3000   │     │  port 5432   │
└─────────────┘     └──────────────┘     └──────────────┘
```

### GitOps Flow

```
Fejlesztő ──▶ git push main ──▶ GitHub Actions
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                    Build Frontend           Build Backend
                    Docker image             Docker image
                          │                       │
                          ▼                       ▼
                    Push to GHCR             Push to GHCR
                          │                       │
                          └───────────┬───────────┘
                                      ▼
                            Update K8s manifests
                            (kustomization.yaml)
                                      │
                                      ▼
                               ArgoCD detektálja
                               a változást
                                      │
                                      ▼
                              Kubernetes Deploy
                              (automatikus sync)
```

## Technológiai Stack

| Komponens | Technológia |
|-----------|-------------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Adatbázis | PostgreSQL 15 |
| Konténerizáció | Docker (multi-stage build) |
| CI/CD | GitHub Actions |
| Container Registry | GitHub Container Registry (GHCR) |
| Orchestráció | Kubernetes + Kustomize |
| GitOps | Argo CD |

## Gyors Start (Lokális Fejlesztés)

### Előfeltételek

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) telepítve
- [Git](https://git-scm.com/) telepítve

### Indítás

```bash
# Repository klónozás
git clone <repo-url>
cd devops-demo

# Alkalmazás indítása Docker Compose-zal
docker-compose up --build
```

### Elérés

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api/tasks
- **Health check:** http://localhost:3000/health
- **Readiness check:** http://localhost:3000/ready
- **App info:** http://localhost:3000/api/info

## Projekt Struktúra

```
DevOps/
├── frontend/              # React frontend alkalmazás
│   ├── Dockerfile         # Multi-stage build (node → nginx)
│   ├── nginx.conf         # Nginx konfig (SPA + API proxy)
│   └── src/               # React forráskód
├── backend/               # Node.js/Express backend API
│   ├── Dockerfile         # Multi-stage build
│   └── src/               # TypeScript forráskód
├── database/              # Adatbázis
│   └── init.sql           # Tábla létrehozás + seed adatok
├── k8s/                   # Kubernetes manifesztek
│   ├── base/              # Alap manifesztek
│   └── overlays/dev/      # Dev környezet (image tagek)
├── argocd/                # ArgoCD konfiguráció
│   ├── application.yaml   # ArgoCD Application
│   └── project.yaml       # ArgoCD AppProject
├── .github/workflows/     # CI/CD Pipeline
│   └── ci.yml             # GitHub Actions workflow
├── docker-compose.yml     # Lokális fejlesztés
└── docs/                  # Részletes dokumentáció
```

## API Végpontok

| Végpont | Metódus | Leírás |
|---------|---------|--------|
| `/health` | GET | Alkalmazás életjel |
| `/ready` | GET | Adatbázis kapcsolat ellenőrzés |
| `/api/info` | GET | Alkalmazás info (verzió, hostname, env) |
| `/api/tasks` | GET | Összes feladat listázása |
| `/api/tasks` | POST | Új feladat létrehozása |
| `/api/tasks/:id` | PUT | Feladat módosítása |
| `/api/tasks/:id` | DELETE | Feladat törlése |

## Részletes Dokumentáció

A `docs/` könyvtárban megtalálható a teljes telepítési és konfigurációs útmutató:

1. [Előfeltételek](docs/01-elofeltelek.md) - Szükséges szoftverek és eszközök
2. [Lokális fejlesztés](docs/02-lokalis-fejlesztes.md) - Docker Compose és tesztelés
3. [GitHub Actions](docs/03-github-actions.md) - CI/CD pipeline beállítása
4. [Kubernetes](docs/04-kubernetes.md) - Cluster és manifesztek
5. [ArgoCD](docs/05-argocd.md) - GitOps deployment beállítása

## Fontos Megjegyzések

- A `k8s/overlays/dev/kustomization.yaml` fájlban az `OWNER` részt cseréld ki a saját GitHub felhasználónevedre
- A `argocd/` fájlokban szintén cseréld ki az `OWNER`-t és a repo URL-t
- A secret.yaml fájlban a jelszavak demo célra vannak - éles környezetben használj Sealed Secrets-et vagy External Secrets-et
