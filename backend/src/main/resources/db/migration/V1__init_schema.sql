CREATE TABLE utilisateurs (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telephone VARCHAR(255),
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP NOT NULL,
    role VARCHAR(64) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    derniere_connexion TIMESTAMP
);

CREATE TABLE citoyens (
    id BIGINT PRIMARY KEY REFERENCES utilisateurs(id),
    cin VARCHAR(50) NOT NULL UNIQUE,
    langue_preferee VARCHAR(50) NOT NULL,
    indicateur_accessibilite VARCHAR(50) NOT NULL,
    date_naissance DATE,
    adresse VARCHAR(500),
    telephone_mobile VARCHAR(50)
);

CREATE TABLE mediateurs (
    id BIGINT PRIMARY KEY REFERENCES utilisateurs(id),
    identifiant_institution VARCHAR(255),
    institution_nom VARCHAR(255)
);

CREATE TABLE agents (
    id BIGINT PRIMARY KEY REFERENCES utilisateurs(id),
    matricule VARCHAR(100) NOT NULL UNIQUE,
    service_affectation VARCHAR(255),
    statut VARCHAR(50) NOT NULL,
    niveau_habilitation VARCHAR(50) NOT NULL,
    superviseur_id BIGINT
);

CREATE TABLE agent_reclamations (
    id BIGINT PRIMARY KEY REFERENCES agents(id)
);

CREATE TABLE agent_validations (
    id BIGINT PRIMARY KEY REFERENCES agents(id)
);

CREATE TABLE agent_certifications (
    id BIGINT PRIMARY KEY REFERENCES agents(id)
);

CREATE TABLE agent_signatures (
    id BIGINT PRIMARY KEY REFERENCES agents(id)
);

CREATE TABLE administrateurs (
    id BIGINT PRIMARY KEY REFERENCES agents(id)
);

CREATE TABLE responsables_service (
    id BIGINT PRIMARY KEY REFERENCES agents(id),
    service_represente VARCHAR(255)
);

ALTER TABLE agents
    ADD CONSTRAINT fk_agents_superviseur
    FOREIGN KEY (superviseur_id)
    REFERENCES responsables_service(id);

CREATE TABLE services_publics (
    id_service BIGSERIAL PRIMARY KEY,
    code_service VARCHAR(100) NOT NULL UNIQUE,
    nom_service VARCHAR(255) NOT NULL,
    description TEXT,
    responsable_id BIGINT,
    contact_point VARCHAR(255),
    telephone VARCHAR(50),
    adresse VARCHAR(500),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_service_responsable FOREIGN KEY (responsable_id) REFERENCES responsables_service(id)
);

CREATE TABLE type_demandes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_json TEXT,
    duree_traitement_jours INTEGER,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE dossiers (
    id_dossier BIGSERIAL PRIMARY KEY,
    numero_dossier VARCHAR(100) NOT NULL UNIQUE,
    date_creation TIMESTAMP NOT NULL,
    date_cloture TIMESTAMP,
    type_demande_id BIGINT NOT NULL REFERENCES type_demandes(id),
    statut VARCHAR(50) NOT NULL,
    citoyen_id BIGINT NOT NULL REFERENCES citoyens(id),
    agent_reclamation_id BIGINT REFERENCES agent_reclamations(id),
    agent_validation_id BIGINT REFERENCES agent_validations(id),
    agent_certification_id BIGINT REFERENCES agent_certifications(id),
    agent_signature_id BIGINT REFERENCES agent_signatures(id),
    description TEXT,
    priorite VARCHAR(50) NOT NULL
);

CREATE TABLE documents (
    id_document BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(1000) NOT NULL,
    taille BIGINT,
    hash VARCHAR(255) NOT NULL,
    date_ajout TIMESTAMP NOT NULL,
    dossier_id BIGINT NOT NULL REFERENCES dossiers(id_dossier),
    citoyen_id BIGINT NOT NULL REFERENCES citoyens(id),
    verifie BOOLEAN NOT NULL DEFAULT FALSE,
    score_fiabilite DOUBLE PRECISION
);

CREATE TABLE signatures (
    id_signature BIGSERIAL PRIMARY KEY,
    date_signature TIMESTAMP NOT NULL,
    dossier_id BIGINT NOT NULL REFERENCES dossiers(id_dossier),
    citoyen_id BIGINT NOT NULL REFERENCES citoyens(id)
);

CREATE TABLE signatures_simples (
    id_signature BIGINT PRIMARY KEY REFERENCES signatures(id_signature),
    image_signature VARCHAR(1000) NOT NULL,
    ip_adresse VARCHAR(100),
    user_agent VARCHAR(1000),
    re_authentifie BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE signatures_qualifiees (
    id_signature BIGINT PRIMARY KEY REFERENCES signatures(id_signature),
    id_certificat VARCHAR(255) NOT NULL,
    autorite_certification VARCHAR(255),
    horodatage_certifie VARCHAR(255),
    certificat_valide BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE litiges (
    id_litige BIGSERIAL PRIMARY KEY,
    numero_litige VARCHAR(100) NOT NULL UNIQUE,
    dossier_id BIGINT NOT NULL REFERENCES dossiers(id_dossier),
    citoyen_id BIGINT NOT NULL REFERENCES citoyens(id),
    motif VARCHAR(500),
    description TEXT,
    date_saisine TIMESTAMP NOT NULL,
    statut VARCHAR(50) NOT NULL,
    mediateur_id BIGINT REFERENCES mediateurs(id),
    service_concerne_id BIGINT REFERENCES services_publics(id_service),
    recommandation TEXT,
    date_recommandation TIMESTAMP,
    date_mise_en_oeuvre TIMESTAMP
);

CREATE TABLE rendez_vous (
    id_rdv BIGSERIAL PRIMARY KEY,
    date_rdv DATE,
    heure_rdv TIME,
    duree INTEGER,
    motif VARCHAR(1000),
    statut VARCHAR(50) NOT NULL,
    citoyen_id BIGINT NOT NULL REFERENCES citoyens(id),
    service_id BIGINT NOT NULL REFERENCES services_publics(id_service),
    agent_id BIGINT REFERENCES agents(id),
    date_creation TIMESTAMP NOT NULL,
    date_modification TIMESTAMP
);

CREATE TABLE historique_actions (
    id_action BIGSERIAL PRIMARY KEY,
    type_action VARCHAR(64) NOT NULL,
    date_heure TIMESTAMP NOT NULL,
    details TEXT,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id),
    dossier_id BIGINT NOT NULL REFERENCES dossiers(id_dossier),
    ip_adresse VARCHAR(100),
    user_agent VARCHAR(1000)
);

CREATE TABLE notifications (
    id_notification BIGSERIAL PRIMARY KEY,
    contenu VARCHAR(2000) NOT NULL,
    date_envoi TIMESTAMP NOT NULL,
    canal VARCHAR(32) NOT NULL,
    statut_lecture VARCHAR(32) NOT NULL,
    date_lecture TIMESTAMP,
    destinataire_id BIGINT NOT NULL REFERENCES utilisateurs(id),
    dossier_id BIGINT REFERENCES dossiers(id_dossier),
    lien VARCHAR(1000)
);

CREATE TABLE messages_internes (
    id_message BIGSERIAL PRIMARY KEY,
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMP NOT NULL,
    expediteur_id BIGINT NOT NULL REFERENCES agents(id),
    destinataire_id BIGINT NOT NULL REFERENCES agents(id),
    lu BOOLEAN NOT NULL DEFAULT FALSE,
    date_lecture TIMESTAMP,
    piece_jointe_id BIGINT REFERENCES documents(id_document),
    message_parent_id BIGINT REFERENCES messages_internes(id_message)
);

CREATE TABLE actualites (
    id_actualite BIGSERIAL PRIMARY KEY,
    titre VARCHAR(500) NOT NULL,
    contenu TEXT NOT NULL,
    date_publication TIMESTAMP,
    date_scraping TIMESTAMP,
    source VARCHAR(255),
    url VARCHAR(1000),
    image_url VARCHAR(1000),
    categorie VARCHAR(255)
);

CREATE TABLE coordonnees_bureaux (
    id BIGSERIAL PRIMARY KEY,
    nom_bureau VARCHAR(255),
    adresse VARCHAR(500),
    ville VARCHAR(255),
    code_postal VARCHAR(50),
    telephone VARCHAR(50),
    email VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    horaires VARCHAR(255),
    service_id BIGINT NOT NULL REFERENCES services_publics(id_service)
);

CREATE TABLE conversations_chatbot (
    id_conversation BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id),
    date_creation TIMESTAMP NOT NULL
);

CREATE TABLE messages_chatbot (
    id_message BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations_chatbot(id_conversation),
    auteur VARCHAR(32) NOT NULL,
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMP NOT NULL,
    sources TEXT
);

CREATE INDEX idx_dossiers_citoyen ON dossiers(citoyen_id);
CREATE INDEX idx_dossiers_statut ON dossiers(statut);
CREATE INDEX idx_litiges_statut ON litiges(statut);
CREATE INDEX idx_notifications_destinataire ON notifications(destinataire_id);
CREATE INDEX idx_rdv_service_date ON rendez_vous(service_id, date_rdv);
