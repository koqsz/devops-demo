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
devops-demo/
├── frontend/              # React frontend alkalmazás
│   ├── Dockerfile         # Multi-stage build (node → nginx)
│   ├── nginx.conf         # Nginx konfig (SPA + API proxy)
│   └── src/               # React forráskód
├── backend/               # Node.js/Express backend API
│   ├── Dockerfile         # Multi-stage build
│   └── src/               # TypeScript forráskód
├── database/              # Adatbázis
│   └── init.sql           # Tábla létrehozás + seed adatok
├── kubi/                  # Kubernetes manifesztek – Talos cluster
│   ├── base/              # Alap manifesztek (namespace, deployment-ek, ingress)
│   │   ├── frontend/ingress.yaml    # nginx Ingress – Frontend
│   │   └── argocd-ingress.yaml      # nginx Ingress – ArgoCD
│   ├── overlays/dev/      # Dev overlay (image tagek, CI frissíti)
│   └── nginx-proxy/       # Külső nginx reverse proxy minták (SSL terminálás)
│       ├── frontend.conf  # Frontend domain SSL proxy konfig
│       └── argocd.conf    # ArgoCD domain SSL proxy konfig
├── google-cloud/          # Kubernetes manifesztek – Google Kubernetes Engine (GKE)
│   └── k8s/               # GKE-specifikus kustomizáció
│       ├── kustomization.yaml   # Overlay (GCE Ingress, image tagek)
│       ├── ingress.yaml         # GCE Ingress – Frontend (ingress.class: gce)
│       ├── argocd-ingress.yaml  # GCE Ingress – ArgoCD + ManagedCertificate
│       └── patches/             # Service/Deployment patch-ek GKE-hez
├── k8s/                   # Általános K8s alap manifesztek (referencia)
│   ├── base/              # Alap manifesztek
│   └── overlays/dev/      # Dev overlay
├── argocd/                # ArgoCD konfiguráció
│   ├── application.yaml   # ArgoCD Application
│   └── project.yaml       # ArgoCD AppProject
├── .github/workflows/     # CI/CD Pipeline
│   └── ci.yml             # GitHub Actions workflow
├── docker-compose.yml     # Lokális fejlesztés
└── docs_hosszu/           # Részletes dokumentáció
```

## Kubernetes Telepítési Lehetőségek

### Talos Cluster (`kubi/`)

A `kubi/` könyvtár egy **Talos Linux** alapú Kubernetes clusterre való telepítést tartalmaz. A Talos egy immutable, API-driven operációs rendszer Kubernetes-hez.

- Ingress: nginx Ingress Controller, valós domain névvel (`kubi/base/frontend/ingress.yaml`)
- ArgoCD elérés: `kubi/base/argocd-ingress.yaml` – nginx Ingress az ArgoCD server elé
- Külső SSL: `kubi/nginx-proxy/` – nginx reverse proxy minták (frontend + ArgoCD domainhez)
- Overlay: `kubi/overlays/dev/kustomization.yaml` – image tagek (CI frissíti automatikusan)

```bash
# Talos clusterre telepítés
kubectl apply -k kubi/overlays/dev
```

### Google Kubernetes Engine (`google-cloud/`)

A `google-cloud/` könyvtár **GKE**-re optimalizált konfigurációt tartalmaz. A legfőbb különbségek a vanilla K8s-hez képest:

- Ingress (Frontend): GCE natív Ingress (`kubernetes.io/ingress.class: gce`) – Google Cloud Load Balancer
- Ingress (ArgoCD): `google-cloud/k8s/argocd-ingress.yaml` – GCE Ingress + Google Managed SSL tanúsítvány
- Frontend Service: `ClusterIP` (patch-elt a `patches/frontend-service.yaml`-ban)
- Az alap manifesztek a `k8s/base/`-ből öröklődnek

```bash
# GKE-re telepítés
kubectl apply -k google-cloud/k8s
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

A `docs_hosszu/` könyvtárban megtalálható a teljes telepítési és konfigurációs útmutató:

1. [Előfeltételek](docs_hosszu/01-elofeltelek.md) - Szükséges szoftverek és eszközök
2. [Lokális fejlesztés](docs_hosszu/02-lokalis-fejlesztes.md) - Docker Compose és tesztelés
3. [GitHub Actions](docs_hosszu/03-github-actions.md) - CI/CD pipeline beállítása
4. [Kubernetes](docs_hosszu/04-kubernetes.md) - Cluster és manifesztek (Talos + GKE)
5. [ArgoCD](docs_hosszu/05-argocd.md) - GitOps deployment beállítása
6. [OpenLens](docs_hosszu/06-openlens.md) - Grafikus cluster kezelés (jelszó, port-forward, Ingress IP)

## Fontos Megjegyzések

- A `kubi/overlays/dev/kustomization.yaml` fájlban az `OWNER` részt cseréld ki a saját GitHub felhasználónevedre
- A `google-cloud/k8s/kustomization.yaml` fájlban szintén cseréld ki az `OWNER`-t
- A `argocd/` fájlokban szintén cseréld ki az `OWNER`-t és a repo URL-t
- Az ingress fájlokban (`kubi/base/frontend/ingress.yaml`, `kubi/base/argocd-ingress.yaml`, `google-cloud/k8s/ingress.yaml`, `google-cloud/k8s/argocd-ingress.yaml`) a placeholder domain neveket cseréld ki a valós domain neveidre
- Az nginx proxy konfig fájlokban (`kubi/nginx-proxy/`) szintén cseréld ki a `pelda.com` / `argocd.pelda.com` neveket, és az `INGRESS_IP` helyére az Ingress Controller valós IP-jét
- A secret.yaml fájlban a jelszavak demo célra vannak - éles környezetben használj Sealed Secrets-et vagy External Secrets-et
