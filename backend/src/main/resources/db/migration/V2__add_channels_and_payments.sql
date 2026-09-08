-- V2__add_channels_and_payments.sql
-- Migration Flyway pour le système de Paiement Stripe et la Messagerie Interne (Canaux & Groupes)

-- 1. Table des Paiements (Frais administratifs et Stripe)
CREATE TABLE IF NOT EXISTS paiements (
    id_paiement BIGSERIAL PRIMARY KEY,
    numero_transaction VARCHAR(100) NOT NULL UNIQUE,
    montant NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    devise VARCHAR(10) NOT NULL DEFAULT 'MAD',
    statut VARCHAR(50) NOT NULL DEFAULT 'GRATUIT_EXONERE',
    moyen_paiement VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_session_id VARCHAR(255),
    carte_last4 VARCHAR(10),
    carte_marque VARCHAR(50),
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_paiement TIMESTAMP,
    recu_url VARCHAR(1000),
    citoyen_id BIGINT NOT NULL REFERENCES citoyens(id),
    dossier_id BIGINT NOT NULL UNIQUE REFERENCES dossiers(id_dossier)
);

-- 2. Table des Canaux de Discussion (Groupes & Chats Privés)
CREATE TABLE IF NOT EXISTS canaux_chat (
    id_canal BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    type VARCHAR(64) NOT NULL, -- PRIVE_DIRECT, GROUPE_DEPARTEMENT, GROUPE_INTER_DEPARTEMENT
    departement VARCHAR(255),
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table de liaison Canaux - Membres (Agents)
CREATE TABLE IF NOT EXISTS canaux_membres (
    canal_id BIGINT NOT NULL REFERENCES canaux_chat(id_canal) ON DELETE CASCADE,
    agent_id BIGINT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    PRIMARY KEY (canal_id, agent_id)
);

-- 4. Évolution de la table messages_internes pour supporter les canaux
ALTER TABLE messages_internes
    ADD COLUMN IF NOT EXISTS canal_id BIGINT REFERENCES canaux_chat(id_canal) ON DELETE CASCADE;

ALTER TABLE messages_internes
    ALTER COLUMN destinataire_id DROP NOT NULL;

-- 5. Index de performance
CREATE INDEX IF NOT EXISTS idx_paiements_dossier ON paiements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);
CREATE INDEX IF NOT EXISTS idx_messages_canal ON messages_internes(canal_id);
CREATE INDEX IF NOT EXISTS idx_messages_date ON messages_internes(date_envoi);
