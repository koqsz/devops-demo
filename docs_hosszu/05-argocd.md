# 5. ArgoCD Telepítés és Konfiguráció

## Mi az ArgoCD?

Az ArgoCD egy GitOps folyamatos telepítési (Continuous Deployment) eszköz Kubernetes-hez. A Git repository-ban tárolt manifeszteket automatikusan szinkronizálja a Kubernetes cluster-rel.

### GitOps Elv

> "A Git a single source of truth" - Minden változtatás Git-en keresztül történik, nem kézi `kubectl apply`-jal.

**Előnyök:**
- Audit trail: minden változtatás nyomkövethető Git history-ban
- Rollback: `git revert` = automatikus visszaállítás
- Self-healing: ha valaki kézzel módosítja a cluster-t, ArgoCD visszaállítja
- Automatikus deploy: push → ArgoCD észleli → deploy

## ArgoCD Telepítése

### 1. ArgoCD Namespace és Telepítés

```bash
# Namespace létrehozása
kubectl create namespace argocd

# ArgoCD telepítése (legfrissebb stabil verzió)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml --server-side --force-conflicts

# Várakozás a pod-ok indulására
kubectl wait --for=condition=ready pod \
  --all -n argocd \
  --timeout=300s
```

### 2. Pod-ok Ellenőrzése

```bash
kubectl get pods -n argocd
# NAME                                                READY   STATUS    RESTARTS   AGE
# argocd-application-controller-0                     1/1     Running   0          60s
# argocd-applicationset-controller-xxx                1/1     Running   0          60s
# argocd-dex-server-xxx                               1/1     Running   0          60s
# argocd-notifications-controller-xxx                 1/1     Running   0          60s
# argocd-redis-xxx                                    1/1     Running   0          60s
# argocd-repo-server-xxx                              1/1     Running   0          60s
# argocd-server-xxx                                   1/1     Running   0          60s
```

### 3. Admin Jelszó Lekérése

```bash
# Kezdeti admin jelszó (automatikusan generált)
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo  # Újsor a szebb kimenetért
```

**Felhasználónév:** `admin`
**Jelszó:** A fenti parancs kimenete

### 4. ArgoCD UI Elérése

#### Port-forward (legegyszerűbb)

```bash
# Port-forward a 8443 portra
kubectl port-forward svc/argocd-server -n argocd 8443:443

# Böngészőben: https://localhost:8443
# (Fogadd el a self-signed certificate figyelmeztetést)
```

#### LoadBalancer (ha a cluster támogatja)

```bash
# Service típus módosítása
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```

#### Minikube tunnel

```bash
# Másik terminálban
minikube tunnel

# Majd:
kubectl get svc argocd-server -n argocd
# Az EXTERNAL-IP oszlop mutatja a címet
```

### 5. ArgoCD CLI Bejelentkezés (opcionális)

```bash
# Login
argocd login localhost:8443 --insecure --username admin --password <JELSZO>

# Jelszó módosítása (ajánlott)
argocd account update-password
```

## Alkalmazás Regisztrálása az ArgoCD-ben

### 1. AppProject Létrehozása

```bash
# A projekt fájlban cseréld ki az OWNER-t a GitHub felhasználónevedre!
# Szerkeszt: argocd/project.yaml

kubectl apply -f argocd/project.yaml
```

**Mit csinál az AppProject?**
- Korlátozza, hogy milyen repository-kból lehet deploy-olni
- Korlátozza, hogy melyik namespace-be lehet deploy-olni
- Biztonsági szint: csak a `devops-demo` namespace engedélyezett

### 2. Application Létrehozása

```bash
# Az application fájlban is cseréld ki az OWNER-t és a repo URL-t!
# Szerkeszt: argocd/application.yaml

kubectl apply -f argocd/application.yaml
```

**Mit csinál az Application?**
- Megmondja az ArgoCD-nek:
  - **Honnan** olvasson: Git repo, `k8s/overlays/dev` path
  - **Hova** telepítsen: `devops-demo` namespace
  - **Hogyan**: Kustomize
  - **Mikor**: Automatikusan (automated sync)

### Vagy ArgoCD CLI-vel:

```bash
argocd app create devops-demo \
  --repo https://github.com/FELHASZNALONEV/devops-demo.git \
  --path k8s/overlays/dev \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace devops-demo \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

## Sync Policy Magyarázat

A `syncPolicy` az `application.yaml`-ben:

```yaml
syncPolicy:
  automated:
    prune: true      # Törli a cluster-ből azokat az erőforrásokat,
                     # amik már nincsenek a Git-ben
    selfHeal: true   # Ha valaki kézzel módosít valamit a cluster-ben,
                     # ArgoCD visszaállítja a Git szerinti állapotra
  syncOptions:
    - CreateNamespace=true  # Automatikusan létrehozza a namespace-t
  retry:
    limit: 5         # Max 5 újrapróbálkozás hiba esetén
    backoff:
      duration: 5s   # Kezdeti várakozás
      factor: 2      # Exponenciális növekedés (5s, 10s, 20s, 40s, 80s)
      maxDuration: 3m
```

## Teljes Workflow Teszt

### 1. Ellenőrizd az ArgoCD UI-t

1. Nyisd meg: https://localhost:8443
2. Bejelentkezés admin/jelszó
3. Keresd meg a `devops-demo` alkalmazást
4. Állapot: **Synced** és **Healthy** kell legyen

### 2. Változtatás Deployolása

```bash
# Változtass a backend kódon
# Pl.: backend/src/index.ts - módosítsd a health endpoint válaszát

# Commitolás és push
git add .
git commit -m "feat: update health endpoint"
git push origin main

# A GitHub Actions:
# 1. Buildeli az új image-et
# 2. Push-olja GHCR-be
# 3. Frissíti a kustomization.yaml-t az új SHA-val

# ArgoCD (max ~3 percen belül):
# 1. Észleli a kustomization.yaml változást
# 2. Automatikusan sync-el
# 3. Rolling update-tel frissíti a pod-okat
```

### 3. Azonnali Sync (nem kell várni)

```bash
# ArgoCD CLI-vel
argocd app sync devops-demo

# Vagy az UI-ban: kattints a "Sync" gombra
```

### 4. Rollback

```bash
# ArgoCD CLI-vel
argocd app history devops-demo
argocd app rollback devops-demo <REVISION>

# Vagy Git-tel (ajánlott GitOps-ban):
git revert HEAD
git push origin main
# ArgoCD automatikusan visszaáll
```

## Monitoring és Hibakeresés

### ArgoCD UI Állapotok

| Állapot | Jelentés |
|---------|---------|
| **Synced** | A cluster állapota megegyezik a Git-tel |
| **OutOfSync** | Különbség van a Git és a cluster között |
| **Healthy** | Minden erőforrás egészséges |
| **Progressing** | Deployment folyamatban |
| **Degraded** | Valamilyen hiba van |
| **Missing** | Erőforrás hiányzik a cluster-ből |

### Hasznos ArgoCD CLI Parancsok

```bash
# Alkalmazás állapota
argocd app get devops-demo

# Alkalmazás logok
argocd app logs devops-demo

# Alkalmazás erőforrás-fa
argocd app resources devops-demo

# Különbségek a Git és cluster között
argocd app diff devops-demo

# Sync history
argocd app history devops-demo
```

### Kubernetes Szintű Hibakeresés

```bash
# Pod-ok állapota
kubectl get pods -n devops-demo

# Pod események
kubectl describe pod <POD-NEV> -n devops-demo

# Pod logok
kubectl logs <POD-NEV> -n devops-demo

# Események a namespace-ben
kubectl get events -n devops-demo --sort-by='.lastTimestamp'
```

## ArgoCD Eltávolítása

```bash
# Alkalmazás törlése
kubectl delete -f argocd/application.yaml
kubectl delete -f argocd/project.yaml

# ArgoCD eltávolítása
kubectl delete -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl delete namespace argocd
```

## Privát Repository Beállítása (ha szükséges)

```bash
# HTTPS-el (Personal Access Token)
argocd repo add https://github.com/FELHASZNALONEV/devops-demo.git \
  --username git \
  --password <GITHUB_PAT>

# SSH-val
argocd repo add git@github.com:FELHASZNALONEV/devops-demo.git \
  --ssh-private-key-path ~/.ssh/id_rsa
```
