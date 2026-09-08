-- V3__seed_dataset_reference_and_rania_user.sql
-- Création de la table Golden Record (dataset_reference_citoyens) et insertion du compte citoyen Rania Lamsakhar pour l'application Tawsa

-- 1. Table Golden Record / Dataset de Référence
CREATE TABLE IF NOT EXISTS dataset_reference_citoyens (
    id BIGSERIAL PRIMARY KEY,
    cni VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    date_naissance DATE NOT NULL,
    compte_cree BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. Insertion du Golden Record de référence Rania Lamsakhar
INSERT INTO dataset_reference_citoyens (cni, nom, prenom, date_naissance, compte_cree)
VALUES ('AI225', 'LAMSAKHAR', 'Rania', '2005-04-22', TRUE);

-- 3. Insertion du compte Utilisateur & Citoyen pour Rania Lamsakhar
INSERT INTO utilisateurs (id, nom, prenom, email, telephone, mot_de_passe, date_creation, role, actif)
VALUES (
    1001,
    'LAMSAKHAR',
    'Rania',
    'rania.lamsakhar@tawsa.ma',
    '06 39 47 59 20',
    'Rania2026@',
    CURRENT_TIMESTAMP,
    'CITOYEN',
    TRUE
);

INSERT INTO citoyens (id, cin, langue_preferee, indicateur_accessibilite, date_naissance, adresse, telephone_mobile)
VALUES (
    1001,
    'AI225',
    'FRANCAIS',
    'AUCUN',
    '2005-04-22',
    'Avenue Mohammed V, Rabat, Maroc',
    '06 39 47 59 20'
);
