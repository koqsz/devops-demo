# 4. Kubernetes Beállítás

## Áttekintés

Az alkalmazás Kubernetes-re deploy-olása Kustomize-zal történik. A projekt **két különböző Kubernetes telepítési célpontot** támogat:

| Könyvtár | Célplatform | Ingress |
|----------|-------------|---------|
| `kubi/` | Talos Linux cluster | nginx Ingress Controller |
| `google-cloud/k8s/` | Google Kubernetes Engine (GKE) | GCE natív Load Balancer |

---

## 1. Talos Cluster (`kubi/`)

### Manifest Struktúra

```
kubi/
├── base/                    # Alap manifesztek
│   ├── kustomization.yaml   # Kustomize konfig
│   ├── namespace.yaml       # devops-demo namespace
│   ├── frontend/
│   │   ├── deployment.yaml  # Frontend pod-ok
│   │   ├── service.yaml     # Frontend ClusterIP service
│   │   └── ingress.yaml     # Nginx Ingress (valós domain)
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
        └── kustomization.yaml  # Image tag-ek (CI frissíti!)
```

### Mi a Talos?

A Talos Linux egy immutable, API-driven operációs rendszer, amelyet kizárólag Kubernetes futtatására terveztek. Jellemzői:
- Nincs SSH hozzáférés, nincs shell – csak API-n keresztül kezelhető
- Minden konfigurációs változás deklaratív YAML-ban definiált
- Magas fokú biztonság és reprodukálhatóság

### Ingress beállítása (Talos)

A Talos clusteren nginx Ingress Controller fut. Az ingress konfig a `kubi/base/frontend/ingress.yaml`-ban van:

```yaml
spec:
  ingressClassName: nginx
  rules:
    - host: <IDE-IRD-A-DOMAIN-NEVET>
```

Cseréld ki a domain nevet a valós domainedre. Az nginx Ingress Controller a cluster telepítésekor kerül fel.

### Telepítés Talos clusterre

```bash
# Image tagek beállítása az overlay-ben
# Szerkeszd: kubi/overlays/dev/kustomization.yaml
# Cseréld ki az OWNER-t a GitHub felhasználónevedre

# Dry-run (ellenőrzés)
kubectl kustomize kubi/overlays/dev

# Telepítés
kubectl apply -k kubi/overlays/dev

# Állapot ellenőrzés
kubectl get all -n devops-demo
```

---

## 2. Google Kubernetes Engine (`google-cloud/`)

### Manifest Struktúra

```
google-cloud/
└── k8s/
    ├── kustomization.yaml   # Overlay (k8s/base + GCE patches)
    ├── ingress.yaml         # GCE Ingress (Google Cloud Load Balancer)
    └── patches/
        ├── frontend-deployment.yaml  # Frontend deployment patch
        ├── frontend-service.yaml     # Service típus patch (ClusterIP)
        └── backend-deployment.yaml   # Backend deployment patch
```

### Különbségek a vanilla K8s-hez képest

**Ingress:** A GKE natív Google Cloud Load Balancert használ. Az ingress annotációban `kubernetes.io/ingress.class: "gce"` van megadva (nem nginx).

**Frontend Service:** GKE-n a LoadBalancer típus automatikusan Google Cloud Load Balancert hoz létre – ez külön cost-tal jár. Ezért a Service `ClusterIP`-re van patch-elve, és a forgalom az Ingress-en keresztül érkezik be.

**Alap manifesztek:** A `google-cloud/k8s/kustomization.yaml` a `../../k8s/base`-ből örököl, tehát az általános manifesztek (`k8s/base/`) az alap, a GKE-specifikus fájlok csak a különbségeket definiálják.

### Ingress beállítása (GKE)

A `google-cloud/k8s/ingress.yaml`-ban cseréld ki a domain nevet:

```yaml
spec:
  defaultBackend:
    service:
      name: frontend
      port:
        number: 5000
  rules:
    - host: <IDE-IRD-A-DOMAIN-NEVET>
```

### Telepítés GKE-re
# Előfeltétel: gcloud CLI konfigurálva, kubectl a GKE clusterhez csatlakoztatva
# gcloud container clusters get-credentials <CLUSTER-NEV> --zone <ZONE> --project <PROJECT-ID>
```bash


# Image tagek beállítása
# Szerkeszd: google-cloud/k8s/kustomization.yaml

# Dry-run
kubectl kustomize google-cloud/k8s

# Telepítés
kubectl apply -k google-cloud/k8s

# Állapot ellenőrzés
kubectl get all -n devops-demo
kubectl get ingress -n devops-demo
```

---

## Kustomize Alapok

### Mi a Kustomize?

A Kustomize egy Kubernetes-natív konfigurációkezelő eszköz:
- **Base:** Alap manifesztek, amik közösek minden környezetben
- **Overlay:** Környezet-specifikus módosítások (dev, staging, prod)
- Nincs template nyelv – tiszta YAML
- Beépített a `kubectl`-be

### Hogyan Működik?

```bash
# Overlay alkalmazása és eredmény megtekintése (dry-run)
kubectl kustomize kubi/overlays/dev          # Talos
kubectl kustomize google-cloud/k8s           # GKE

# Közvetlen telepítés
kubectl apply -k kubi/overlays/dev           # Talos
kubectl apply -k google-cloud/k8s            # GKE
```

---

## GHCR Image Pull Secret

Ha privát container image-eket használsz:

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

---

## Ellenőrzés és Hibakeresés

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

# Ingress állapot
kubectl get ingress -n devops-demo

# Port-forward a frontend-hez (Ingress nélkül)
kubectl port-forward -n devops-demo svc/frontend 8080:80

# Port-forward a backend-hez
kubectl port-forward -n devops-demo svc/backend 3000:3000
```

### Alkalmazás Tesztelése

```bash
# Port-forward futtatása után:
curl http://localhost:3000/health
curl http://localhost:3000/api/tasks
```

---

## Kubernetes Fogalmak (Oktatáshoz)

| Erőforrás | Leírás | A projektben |
|-----------|--------|-------------|
| **Namespace** | Izolált munkaterület | `devops-demo` |
| **Deployment** | Pod-ok kezelése, skálázás, rolling update | frontend, backend |
| **StatefulSet** | Állapottal rendelkező alkalmazásokhoz | database (PostgreSQL) |
| **Service** | Pod-ok hálózati elérése | ClusterIP (frontend, backend), Headless (database) |
| **ConfigMap** | Konfigurációs adatok | backend config, init.sql |
| **Secret** | Érzékeny adatok (titkosítva) | DB jelszavak |
| **PVC** | Persistent Volume Claim – tartós tárolás | PostgreSQL adatok |
| **Ingress** | Külső HTTP forgalom irányítása | domain → frontend |

---

## Törlés

```bash
# Talos cluster
kubectl delete -k kubi/overlays/dev

# GKE
kubectl delete -k google-cloud/k8s

# Vagy a teljes namespace törlése (mindkét esetben)
kubectl delete namespace devops-demo
```
