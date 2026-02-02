# 3. GitHub Actions CI/CD Pipeline

## Áttekintés

A CI/CD pipeline automatikusan buildelni és deployolni a Docker image-eket minden `main` branch-re történő push esetén.

### A Pipeline Lépései

```
git push main
    │
    ├── Build Frontend ──▶ Push to GHCR (ghcr.io/OWNER/devops-demo-frontend:SHA)
    │
    ├── Build Backend  ──▶ Push to GHCR (ghcr.io/OWNER/devops-demo-backend:SHA)
    │
    └── Update K8s Manifests ──▶ kustomization.yaml frissítése az új image tag-ekkel
                                  ──▶ git commit & push (ArgoCD-nek)
```

## GitHub Repository Beállítása

### 1. Repository Létrehozása

```bash
# GitHub-on hozz létre egy új repository-t (pl. "devops-demo")
# Majd:
cd DevOps
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/FELHASZNALONEV/devops-demo.git
git branch -M main
git push -u origin main
```

### 2. GHCR (GitHub Container Registry) Beállítása

A GHCR automatikusan elérhető minden GitHub felhasználó számára. A `GITHUB_TOKEN` secret automatikusan rendelkezésre áll a GitHub Actions-ben.

**Fontos:** A repository beállításainál engedélyezd a GitHub Actions számára a packages írási jogosultságot:
1. Repository → Settings → Actions → General
2. "Workflow permissions" → **Read and write permissions**
3. Mentés

### 3. Image-ek Megnyitása (Opcionális)

Ha a Kubernetes cluster-nek authentikáció nélkül kell elérnie a GHCR image-eket:
1. GitHub profile → Settings → Packages
2. A package-re kattintás → Package settings → Danger Zone → Change visibility → Public

## A Pipeline Fájl Magyarázata

### Fájl: `.github/workflows/ci.yml`

#### Trigger Konfiguráció

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - 'backend/**'
```

**Fontos:** A `paths` filter biztosítja, hogy:
- Csak `frontend/` vagy `backend/` mappában történő változtatás indítja a pipeline-t
- A `k8s/` mappában történő változtatás (amit a pipeline maga csinál) **NEM** indít új pipeline-t
- Ez megakadályozza a végtelen ciklust

#### Build Jobok

A `build-frontend` és `build-backend` jobok **párhuzamosan** futnak:

1. **Checkout** - Kód letöltése
2. **Docker Buildx** - Hatékony builder beállítása
3. **GHCR Login** - Container registry authentikáció
4. **Build & Push** - Docker image buildelése és feltöltése

**Image Tag Stratégia:**
- `ghcr.io/OWNER/devops-demo-frontend:<git-sha>` - Egyedi, nyomkövethető
- `ghcr.io/OWNER/devops-demo-frontend:latest` - Legfrissebb verzió

#### Manifest Frissítés (GitOps)

```yaml
update-k8s-manifests:
  needs: [build-frontend, build-backend]
```

Ez a job:
1. Megvárja mindkét build job sikerét
2. Kustomize-zal frissíti az image tag-eket a `k8s/overlays/dev/kustomization.yaml`-ben
3. Commitolja és push-olja a változtatást
4. ArgoCD észleli a változást és deployol

## Pipeline Futtatása

### Manuális Teszt

```bash
# Változtass valamit a backend-en
echo "// test change" >> backend/src/index.ts

# Commitolás és push
git add .
git commit -m "test: trigger pipeline"
git push origin main
```

### Pipeline Állapot Ellenőrzése

1. GitHub → Repository → Actions tab
2. Kattints a futó workflow-ra
3. Minden job logja megtekinthető

### GHCR Image-ek Ellenőrzése

```bash
# Vagy a GitHub UI-on: Repository → Packages
docker pull ghcr.io/FELHASZNALONEV/devops-demo-backend:latest
docker pull ghcr.io/FELHASZNALONEV/devops-demo-frontend:latest
```

## Hibakeresés

### "permission denied" a GHCR push-nál
- Ellenőrizd a workflow permissions-t (Settings → Actions → General)
- A `packages: write` permission szükséges

### Pipeline nem indul el
- Ellenőrizd, hogy a `main` branch-re push-olsz
- Ellenőrizd, hogy a változtatás a `frontend/` vagy `backend/` mappában van
- Nézd meg az Actions tab-ot hibákért

### Image tag nem frissül a kustomization.yaml-ben
- Ellenőrizd a `update-k8s-manifests` job logjait
- A `contents: write` permission szükséges
