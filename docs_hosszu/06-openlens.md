# 6. OpenLens – Cluster Kezelés Grafikusan

Az **OpenLens** (vagy **Lens**) egy nyílt forrású, grafikus Kubernetes IDE, amellyel böngészőn vagy asztali alkalmazáson keresztül kezelheted a clustert parancssor nélkül. Az alábbiakban a leggyakoribb feladatokat mutatjuk be OpenLens-en keresztül.

> **Telepítés:** https://github.com/MuhammedKalkan/OpenLens/releases

---

## 1. ArgoCD Admin Jelszó Megtekintése

Az ArgoCD telepítéskor automatikusan generál egy kezdeti admin jelszót, amelyet egy Kubernetes Secret tárol az `argocd` namespace-ben.

### Lépések OpenLens-ben

1. Nyisd meg az OpenLens-t, és csatlakozz a clusterhez.
2. Bal oldali sávban válaszd ki a **Namespaces** listából az **`argocd`** namespace-t (vagy a felső szűrőből szűrj rá).
3. Navigálj: **Config → Secrets**
4. Keresd meg az **`argocd-initial-admin-secret`** nevű Secret-et, és kattints rá.
5. A megjelenő panelen kattints a **jelszó mező melletti szem ikonra** (👁) a dekódolt érték megjelenítéséhez.

```
Namespace: argocd
Secret neve: argocd-initial-admin-secret
Kulcs: password
```

> **Megjegyzés:** Ez az initial secret csak az első bejelentkezésig érvényes. Bejelentkezés után változtasd meg a jelszót az ArgoCD UI-ban: *User Info → Update Password*.

### Alternatíva: beépített Terminal OpenLens-ben

Az OpenLens tartalmaz beépített terminált. Kattints a jobb alsó sarokban lévő **`>`_** ikonra, majd:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

---

## 2. Port Forwarding OpenLens-ben

A port forwarding segítségével a cluster belső service-eit közvetlenül elérheted a helyi böngészőből, anélkül hogy Ingress-t kellene konfigurálni.

### 2a. Frontend elérése port forwardinggal

1. Navigálj: **Namespace: `devops-demo`** → **Network → Services**
2. Keresd meg a **`frontend`** service-t.
3. Hover-elj a sor fölé, majd kattints a **Port Forward** (nyíl) ikonra, vagy jobb klikk → **Port Forward**.
4. A felugró ablakban:
   - **Local port:** `8080`
   - **Remote port:** `80`
   - Kattints: **Start**
5. OpenLens automatikusan megnyitja: **http://localhost:8080**

### 2b. ArgoCD Server elérése port forwardinggal

1. Navigálj: **Namespace: `argocd`** → **Network → Services**
2. Keresd meg az **`argocd-server`** service-t.
3. Jobb klikk → **Port Forward**
4. A felugró ablakban:
   - **Local port:** `8443`
   - **Remote port:** `443`
   - Kattints: **Start**
5. Böngészőben nyisd meg: **https://localhost:8443**
   - Fogadd el a self-signed tanúsítvány figyelmeztetést (böngészőtől függően: *Advanced → Proceed*)

> **Tipp:** Az OpenLens port forward listáját a bal alsó sarokban lévő **Port Forwards** fülön látod és kezelheted.

### 2c. Backend API elérése port forwardinggal

1. Navigálj: **Namespace: `devops-demo`** → **Network → Services**
2. Keresd meg a **`backend`** service-t.
3. Port Forward: local `3000` → remote `3000`
4. Böngészőben: **http://localhost:3000/health**

---

## 3. Ingress Controller IP Megkeresése

Az Ingress Controller külső IP-jén keresztül érhető el az alkalmazás a valós domain névvel. OpenLens-ben két helyen keresheted meg:

### 3a. devops-demo alkalmazás Ingress IP-je

1. Navigálj: **Namespace: `devops-demo`** → **Network → Ingresses**
2. Keresd meg a **`frontend`** (Talos) vagy **`devops-demo-ingress`** (GKE) nevű Ingress-t.
3. Az **Address** oszlopban látod a külső IP-t vagy hostname-t.

```
Talos (nginx):  pl. 192.168.1.100  (a node-ok IP-je vagy MetalLB IP)
GKE (gce):      pl. 34.107.xxx.xxx  (Google Cloud Load Balancer IP)
```

### 3b. ArgoCD Ingress IP-je

1. Navigálj: **Namespace: `argocd`** → **Network → Ingresses**
2. Keresd meg az **`argocd-ingress`** (Talos) vagy **`argocd-gke-ingress`** (GKE) Ingress-t.
3. Az **Address** oszlopban olvasható a külső IP.

### 3c. Ingress Controller LoadBalancer Service IP-je (Talos)

Ha az nginx Ingress Controller LoadBalancer Service-ként fut:

1. Navigálj: **Namespace: `ingress-nginx`** → **Network → Services**
2. Keresd meg az **`ingress-nginx-controller`** service-t.
3. Az **External IP** oszlopban látod a LoadBalancer IP-t.

> **Ez az IP kell a DNS beállításhoz!** Az `A` record ezt az IP-t kell mutassa.

---

## Összefoglalás – OpenLens gyorsbillentyűk

| Feladat | Hol található OpenLens-ben |
|---------|---------------------------|
| ArgoCD admin jelszó | `argocd` ns → Config → Secrets → `argocd-initial-admin-secret` |
| Frontend port forward | `devops-demo` ns → Network → Services → `frontend` → Port Forward |
| ArgoCD port forward | `argocd` ns → Network → Services → `argocd-server` → Port Forward |
| App Ingress IP | `devops-demo` ns → Network → Ingresses → Address oszlop |
| ArgoCD Ingress IP | `argocd` ns → Network → Ingresses → Address oszlop |
| nginx controller IP | `ingress-nginx` ns → Network → Services → `ingress-nginx-controller` |
