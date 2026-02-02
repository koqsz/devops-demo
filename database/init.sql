-- Feladatkezelő alkalmazás - adatbázis inicializálás

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Példa adatok (seed data)
INSERT INTO tasks (title, description) VALUES
    ('DevOps pipeline beállítása', 'GitHub Actions CI/CD pipeline konfigurálás és tesztelés'),
    ('Kubernetes deployment', 'K8s manifesztek elkészítése és tesztelése'),
    ('ArgoCD telepítés', 'GitOps workflow beállítása ArgoCD-vel'),
    ('Monitoring beállítás', 'Alkalmazás monitorozás konfigurálása')
ON CONFLICT DO NOTHING;
