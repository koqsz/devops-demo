# 1. Előfeltételek

## Szükséges Szoftverek

### Docker Desktop
A konténerizációhoz és lokális fejlesztéshez szükséges.

**Telepítés:**
- **macOS/Windows:** https://www.docker.com/products/docker-desktop/
- **Linux:** https://docs.docker.com/engine/install/

Ellenőrzés:
```bash
docker --version
docker-compose --version
```

### kubectl
A Kubernetes cluster kezelésére szolgáló CLI eszköz.

**Telepítés:**
```bash
# macOS (Homebrew)
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Windows (Chocolatey)
choco install kubernetes-cli
```

Ellenőrzés:
```bash
kubectl version --client
```

### Kubernetes Cluster

Lokális fejlesztéshez az alábbi lehetőségek közül válassz egyet:

#### Minikube (ajánlott kezdőknek)
```bash
# Telepítés
brew install minikube  # macOS
# vagy: https://minikube.sigs.k8s.io/docs/start/

# Cluster indítása
minikube start --driver=docker --memory=4096 --cpus=2

# Ellenőrzés
kubectl cluster-info
```

#### Kind (Kubernetes in Docker)
```bash
# Telepítés
brew install kind  # macOS
# vagy: https://kind.sigs.k8s.io/docs/user/quick-start/

# Cluster létrehozása
kind create cluster --name devops-demo

# Ellenőrzés
kubectl cluster-info
```

### Git
```bash
# macOS
brew install git

# Linux
sudo apt-get install git

# Ellenőrzés
git --version
```

### GitHub Account
- Regisztráció: https://github.com
- GitHub Container Registry (GHCR) automatikusan elérhető

### ArgoCD CLI (opcionális, de ajánlott)
```bash
# macOS
brew install argocd

# Linux
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd-linux-amd64
sudo mv argocd-linux-amd64 /usr/local/bin/argocd

# Ellenőrzés
argocd version --client
```

### Kustomize (opcionális)
A kubectl-be beépített, de külön is telepíthető:
```bash
# macOS
brew install kustomize

# Ellenőrzés (beépített)
kubectl kustomize --help
```

## Ajánlott Minimális Rendszerkövetelmények

| Erőforrás | Minimum | Ajánlott |
|-----------|---------|----------|
| RAM | 8 GB | 16 GB |
| CPU | 2 core | 4 core |
| Lemez | 20 GB szabad | 40 GB szabad |
| Docker memory | 4 GB | 6 GB |
