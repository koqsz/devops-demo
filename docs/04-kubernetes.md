# 4. Kubernetes Beállítás

## Áttekintés

Az alkalmazás Kubernetes-re deploy-olása Kustomize-zal történik. A manifesztek base + overlay struktúrában vannak szervezve.

### Manifest Struktúra

```
k8s/
├── base/                    # Alap manifesztek (közös minden környezetben)
│   ├── kustomization.yaml   # Kustomize konfig
│   ├── namespace.yaml       # devops-demo namespace
│   ├── frontend/
│   │   ├── deployment.yaml  # Frontend pod-ok
│   │   └── service.yaml     # Frontend ClusterIP service
│   ├── backend/
│   │   ├── deployment.yaml  # Backend pod-ok
│   │   ├── service.yaml     # Backend ClusterIP service
│   │   └── configmap.yaml   # Backend env vars
│   └── database/
│       ├── statefulset.yaml # PostgreSQL StatefulSet
│       ├── service.yaml     # Headless service
│       ├── secret.yaml      # DB credentials
│       └── configmap.yaml   # Init SQL script
│
└── overlays/
    └── dev/                 # Dev környezet overlay
        ├── kustomization.yaml  # Image tag-ek (CI frissíti!)
        └── ingress.yaml        # Ingress szabályok
```

## Cluster Előkészítése

### Minikube

```bash
# Cluster indítása
minikube start --driver=docker --memory=4096 --cpus=2

# Ingress addon engedélyezése
minikube addons enable ingress

# Cluster állapot
kubectl cluster-info
```

### Kind

```bash
# Cluster létrehozása
kind create cluster --name devops-demo

# Ingress Controller telepítése (nginx)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Várakozás az Ingress Controller-re
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

## Kustomize Alapok

### Mi a Kustomize?

A Kustomize egy Kubernetes-natív konfigurációkezelő eszköz:
- **Base:** Alap manifesztek, amik közösek minden környezetben
- **Overlay:** Környezet-specifikus módosítások (dev, staging, prod)
- Nincs template nyelv - tiszta YAML
- Beépített a `kubectl`-be

### Hogyan Működik?

```bash
# Overlay alkalmazása és eredmény megtekintése (dry-run)
kubectl kustomize k8s/overlays/dev

# Közvetlen telepítés

kubectl apply -k k8s/overlays/dev
```

A Kustomize a base manifeszteket az overlay-ben definiált módosításokkal kombinálja:
- Az `images` szekcióban felülírja a base image neveket valódi GHCR image-ekre
- Az `ingress.yaml`-t hozzáadja az erőforrásokhoz
- A `namespace: devops-demo` minden erőforrásra rákerül

## Manuális Deployment

### 1. Image Tag-ek Beállítása

A `k8s/overlays/dev/kustomization.yaml` fájlban cseréld ki az `OWNER`-t a GitHub felhasználónevedre:

```yaml
images:
  - name: frontend-image
    newName: ghcr.io/TE-FELHASZNALONEVED/devops-demo-frontend
    newTag: latest
  - name: backend-image
    newName: ghcr.io/TE-FELHASZNALONEVED/devops-demo-backend
    newTag: latest
```

### 2. GHCR Image Pull Secret (ha privát image-ek)

```bash
# GitHub Personal Access Token (PAT) létrehozása szükséges
# GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# Szükséges scope: read:packages

kubectl create namespace devops-demo

kubectl create secret docker-registry ghcr-secret \
  --namespace=devops-demo \
  --docker-server=ghcr.io \
  --docker-username=GITHUB_USER \
  --docker-password=GITHUB_PAT \
  --docker-email=EMAIL
```

### 3. Telepítés

```bash
# Manifesztek alkalmazása
kubectl apply -k k8s/overlays/dev

# Állapot ellenőrzés
kubectl get all -n devops-demo
```

### 4. Ellenőrzés

```bash
# Pod-ok állapota
kubectl get pods -n devops-demo
# NAME                        READY   STATUS    RESTARTS   AGE
# frontend-xxx-yyy            1/1     Running   0          30s
# backend-xxx-yyy             1/1     Running   0          30s
# database-0                  1/1     Running   0          30s

# Pod logok
kubectl logs -n devops-demo deployment/backend
kubectl logs -n devops-demo deployment/frontend

# Service-ek
kubectl get svc -n devops-demo

# Port-forward a frontend-hez (Ingress nélkül)
kubectl port-forward -n devops-demo svc/frontend 8080:80

# Port-forward a backend-hez
kubectl port-forward -n devops-demo svc/backend 3000:3000
```

### 5. Alkalmazás Tesztelése

```bash
# Port-forward futtatása után:
curl http://localhost:3000/health
curl http://localhost:3000/api/tasks
```

## Ingress Beállítása

### Hosts Fájl Módosítása

```bash
# /etc/hosts (macOS/Linux) vagy C:\Windows\System32\drivers\etc\hosts (Windows)
# Add hozzá:

# Minikube esetén:
echo "$(minikube ip) devops-demo.local" | sudo tee -a /etc/hosts

# Kind/egyéb esetén:
echo "127.0.0.1 devops-demo.local" | sudo tee -a /etc/hosts
```

Ezután: http://devops-demo.local

## Kubernetes Fogalmak (Oktatáshoz)

| Erőforrás | Leírás | A projektben |
|-----------|--------|-------------|
| **Namespace** | Izolált munkaterület | `devops-demo` |
| **Deployment** | Pod-ok kezelése, skálázás, rolling update | frontend, backend |
| **StatefulSet** | Állapottal rendelkező alkalmazásokhoz | database (PostgreSQL) |
| **Service** | Pod-ok hálózati elérése | ClusterIP (frontend, backend), Headless (database) |
| **ConfigMap** | Konfigurációs adatok | backend config, init.sql |
| **Secret** | Érzékeny adatok (titkosítva) | DB jelszavak |
| **PVC** | Persistent Volume Claim - tartós tárolás | PostgreSQL adatok |
| **Ingress** | Külső HTTP forgalom irányítása | devops-demo.local → frontend |

## Törlés

```bash
# Minden erőforrás törlése
kubectl delete -k k8s/overlays/dev

# Vagy a teljes namespace törlése
kubectl delete namespace devops-demo
```
